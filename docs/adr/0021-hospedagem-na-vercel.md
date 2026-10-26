# 0021 — Hospedagem na Vercel, com deploy a partir da tag da release

- **Status:** Aceito (complementa o ADR 0020: o deploy continua só por release, agora criada à mão, ADR 0022; a imagem do
  contêiner passa a ser um artefato portátil)
- **Data:** 2026-10-23

## Contexto

A página precisa estar no ar com o Client Secret só no servidor (ADR 0003). Descartamos, com o motivo: **GitHub Pages e S3**
(só arquivos estáticos, sem servidor); **Render gratuito** (o serviço dorme após 15 minutos e o primeiro acesso leva cerca de um
minuto, ruim para quem avalia); AWS (o App Runner deixou de aceitar clientes novos e as demais opções são muito mais trabalho).
A **Vercel** não dorme: há uma partida a frio de poucos segundos, o HTTPS vem pronto e o plano gratuito não pede cartão.

## Decisão

- **O mesmo servidor, como uma função.** O Angular gera o servidor SSR (Express + BFF) em `dist/onerpm-tracks/server/server.mjs`,
  que já exporta `reqHandler`. A função `api/index.mjs` apenas o reexporta; `vercel.json` manda para ela tudo o que não é arquivo
  estático. Os arquivos estáticos do navegador (`dist/onerpm-tracks/browser`) saem direto da CDN da Vercel.
- **Cabeçalhos também na CDN.** O _middleware_ do Express (ADR 0019) não roda para os arquivos servidos pela CDN, então
  `vercel.json` repete os mesmos cabeçalhos de segurança; um teste garante que são idênticos aos do código
  (`src/vercel-config.spec.ts`). Arquivos com _hash_ (`chunk-*`, `main-*`, `styles-*`, `media/*`) são guardados por um ano.
  A compressão e o HSTS são da própria Vercel.
- **Deploy só por release, a partir da tag, pelo nosso workflow** (e não pela integração com o Git da Vercel, que implantaria a
  cada _push_): `vercel.json` desliga os deploys do Git (`git.deploymentEnabled: false`) e o job `Deploy to Vercel` do workflow
  `Release` (ADR 0020) faz _checkout_ da tag, `vercel pull`, `vercel build --prod` e `vercel deploy --prebuilt --prod`. A CLI
  tem versão fixa e lê o _token_ do ambiente (nunca na linha de comando); só os passos `pull` e `deploy` o recebem, o _build_
  (que roda o código do projeto) não.
- **O renderizador precisa confiar nos cabeçalhos da Vercel.** A Vercel manda `x-forwarded-for`, `-host`, `-proto` e `-port` (o cliente
  não consegue forjá-los); sem `NG_TRUST_PROXY_HEADERS` o Angular os recusa e responde com a página vazia de contingência, sem
  renderizar no servidor (a página funcionava, mas sem o idioma e as faixas já no HTML). `api/index.mjs` define a variável com
  esses quatro cabeçalhos antes de carregar o servidor; o host continua validado por `NG_ALLOWED_HOSTS`. Um e2e envia esses
  cabeçalhos e exige a página renderizada no idioma pedido.
- **A CDN não pode servir o `index.csr.html`.** A Vercel entrega o conteúdo do diretório de saída antes de qualquer
  _rewrite_, e entregava `index.csr.html` (a página vazia de contingência do Angular) para `/`: o servidor nunca renderizava a
  página inicial. O passo `scripts/vercel-static.mjs`, depois do _build_, copia o `browser` para `static` sem esse arquivo; o
  `outputDirectory` é `static`, a função continua com o original (de que o servidor precisa) e `excludeFiles` tira a cópia da função.
- **A mesma versão do npm do CI.** O `package-lock.json` só passa no `npm ci` com o npm fixado em `packageManager` (11.6.2):
  o 11.4 e o 11.7 reclamam de `@emnapi/core` e `@emnapi/runtime` ausentes. O npm padrão da Vercel não é esse, e o primeiro
  deploy falhou exatamente aí. Por isso `installCommand` é `npx --yes npm@11.6.2 ci`, e um teste exige que a versão seja a
  de `packageManager`.
- **Testado sem a Vercel:** um e2e (`e2e/vercel-entry.e2e.ts`) coloca `api/index.mjs` atrás de um servidor HTTP comum, como a
  Vercel faz, e pergunta o que um navegador perguntaria (página, `/api/health`, `/api/tracks`, 404 JSON, arquivos estáticos,
  cabeçalhos).

## Como configurar

1. **Projeto sem ligação com o Git:** na pasta do repositório, `npx vercel@65 login` e `npx vercel@65 link` (escolha a conta,
   "Link to existing project: No", nome `onerpm-challenge`; **não** conecte o repositório do GitHub). Isso cria `.vercel/project.json`
   (fora do Git) com `orgId` e `projectId`.
2. **Ajustes do projeto** (Settings → General): _Node.js Version_ **24.x**. O `engines.node` do `package.json` (`^22.12 || >=24`)
   também é lido pela Vercel: se o primeiro deploy usar outra versão, ajuste um dos dois (esta é uma das coisas que o primeiro
   deploy confirma).
3. **Variáveis de ambiente** (Settings → Environment Variables, ambiente **Production**): `SPOTIFY_CLIENT_ID`,
   `SPOTIFY_CLIENT_SECRET` (marque como _Sensitive_) e `NG_ALLOWED_HOSTS` com o domínio público
   (o domínio que a Vercel mostra depois do primeiro deploy, por exemplo `onerpm-challenge-ssr.vercel.app`; vários, separados por vírgula). Sem `NG_ALLOWED_HOSTS` o Angular cai na renderização
   no navegador e a página perde o idioma já renderizado no servidor.
4. **Segredos do repositório no GitHub:** `VERCEL_TOKEN` (Account Settings → Tokens), `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`
   (do `.vercel/project.json`).
5. **Primeiro deploy, para validar a configuração** antes da primeira release: na branch com estes arquivos,
   `npx vercel@65 deploy --prod` (compila na Vercel; depois disso, os deploys são da release).

## Alternativas consideradas

- **Integração com o Git da Vercel** — implanta a cada _push_ na `main`, contra o pedido de implantar só com release.
- **Render pago ou Cloud Run** — rodam a imagem sem adaptar, mas o primeiro exige plano pago para não dormir e o segundo exige
  conta com cartão e um passo de deploy diferente.

## Consequências

- Positivas: sem "sono" nem cartão; HTTPS, CDN e compressão da plataforma; o que está no ar é sempre uma release numerada.
- Negativas: o BFF passa a viver em funções: o _cache_ de resultados e o limitador de concorrência valem por instância, não
  para o site todo (cada instância ainda respeita o limite do Spotify, mas várias somam); a função tem limite de tempo do plano; a
  configuração depende de um serviço externo que não rodamos aqui (a primeira verificação real é o primeiro deploy). A imagem do
  contêiner deixa de ser o caminho de produção, mas continua verificada no CI e publicada.
