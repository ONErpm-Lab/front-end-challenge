# Consulta de faixas por ISRC — versão SPA

Branch **`main-spa`**: uma nova versão do desafio da ONErpm, como **aplicação Angular 21 (LTS) estática**, sem SSR e
sem servidor, com um design novo pensado para produtores musicais. A versão SSR entregue para avaliação continua na
branch [`main`](https://github.com/AlyssonMascarenhas/onerpm-challenge/tree/main), sem alterações.

A página consulta na **Spotify Web API**, direto do navegador, os **10 ISRCs** do contrato e mostra cada faixa com capa,
data de lançamento, título, artistas, duração `mm:ss`, prévia do áudio, link no Spotify e se está disponível no Brasil,
**ordenadas por título**, sem guardar nada. Se o Spotify não puder ser usado, o visitante vê um alerta.

**No ar:** https://alyssonmascarenhas.github.io/onerpm-challenge/

> **Atenção:** esta versão é uma demonstração. Sem servidor, as credenciais do Spotify vão no JavaScript publicado e
> qualquer pessoa pode usá-las. Veja [Segurança](#seguranca) para os riscos e para como deveria ser em produção.

> O enunciado original está no fim deste arquivo, [intacto](#enunciado-original).

## O design

Escolhido no Claude Design entre duas direções ("Estúdio/DAW" e "Catálogo"). O **Catálogo** mostra de uma vez quantos
ISRCs chegaram, quantos o Spotify tem, quantos tocam no Brasil, quanto dura o conjunto e de quando são os lançamentos;
abaixo, a tabela filtrável e o detalhe da faixa com a prévia.

- **Desktop:** cartões de resumo, tabela (faixa, ISRC, lançamento, duração, Brasil) e painel de detalhe ao lado.
- **Celular:** cartões em duas colunas, chips de situação roláveis, tabela enxuta e o detalhe numa _bottom sheet_.
- **Datas divergentes:** quando o Spotify tem mais de um lançamento para o ISRC (álbum e single, por exemplo), a página
  mostra a data mais antiga e, no detalhe, um aviso "x datas encontradas" que lista todas ao clicar.
- **Claro e escuro**, seis idiomas, WCAG AA verificado pelo axe.

## Como funciona

```text
Navegador (Angular)
  ├─ POST accounts.spotify.com/api/token   (credenciais do environment → token de app)
  ├─ GET  api.spotify.com/v1/search?q=isrc:…   (token posto pelo spotifyAuthInterceptor)
  └─ player do Spotify (iframe), carregado só ao clicar em "Ouvir uma prévia"
```

```text
src/
  app/
    api/          quem faz requisição para fora: spotify-accounts/, spotify-web/, spotify-player/
    services/     nossos serviços sobre a api/: spotify-auth/ (token + interceptor), track-lookup/, spotify-player/
    models/       o modelo do app (Track, TrackLookupResult)
    core/         i18n, tema, storage
    layout/       header, footer, language-menu, theme-toggle
    shared/       components/icon, components/copy-button
    features/tracks/  domain, store, components, pages
  environments/   environment.ts (produção, sem credenciais), .development, .e2e, .local.example
  testing/        utilitários dos testes
e2e/              Playwright + axe
docs/adr/         registros das decisões desta branch
```

Convenção clássica do Angular: `xxx.component.ts|html|scss|spec.ts`, `xxx.service.ts`, `xxx.interceptor.ts`
([ADR 0004](docs/adr/0004-convencoes-angular-e-camadas.md)).

## Decisões

- **SPA estática, Spotify chamado do navegador** ([0002](docs/adr/0002-spa-estatica-com-spotify-chamado-do-navegador.md)):
  qualquer hospedagem estática serve. Em troca, **o Client Secret vai no bundle publicado**: use um app Spotify só para
  esta página e troque o segredo se vazar.
- **Componentes próprios + Angular CDK** ([0003](docs/adr/0003-design-catalogo-com-componentes-proprios-e-cdk.md)).
- **Convenções do Angular e camadas `api` / `services`** ([0004](docs/adr/0004-convencoes-angular-e-camadas.md)).
- **Testes** ([0005](docs/adr/0005-testes-unitarios-e2e-e-acessibilidade.md)): Vitest com cobertura mínima, Playwright
  (desktop e celular) e axe nos dois temas.
- **Deploy no GitHub Pages, à mão** ([0006](docs/adr/0006-deploy-no-github-pages.md)): lint, testes e build antes de
  publicar; as credenciais vêm dos secrets do repositório.

## Rodando localmente

**Pré-requisitos:** Node `^22.12 || >=24` (o `.nvmrc` usa 24), npm ≥ 11.6 e um app no
[dashboard do Spotify](https://developer.spotify.com/dashboard) (Client ID e Client Secret).

```bash
npm ci
cp src/environments/environment.local.example.ts src/environments/environment.local.ts
# preencha clientId e clientSecret em environment.local.ts (o arquivo é ignorado pelo Git)
npm start              # http://localhost:4200
```

### Credenciais do Spotify

| Arquivo                         | Usado por                            | Credenciais                       |
| ------------------------------- | ------------------------------------ | --------------------------------- |
| `environment.local.ts`          | `npm start` (`ng serve`)             | as suas (ignorado pelo Git)       |
| `environment.development.ts`    | testes e build de desenvolvimento    | vazias                            |
| `environment.e2e.ts`            | `npm run e2e`                        | falsas (o Spotify é simulado)     |
| `environment.ts`                | `npm run build` (produção)           | vazias no Git; o deploy as escreve a partir dos secrets |

Sem credenciais a página abre do mesmo jeito e mostra o alerta de dados indisponíveis.

## Garantindo que está tudo certo

```bash
npm run lint && npm run format:check && npm run typecheck
npm run test:ci        # Vitest com cobertura mínima
npm run e2e            # Playwright (desktop e Pixel 7) + axe; navegador: npm run e2e:install
```

O CI (`.github/workflows/ci.yml`) roda tudo isso em PRs para `main-spa`.

## Deploy (GitHub Pages)

Publicado em https://alyssonmascarenhas.github.io/onerpm-challenge/ pelo workflow
`.github/workflows/deploy-pages.yml`, só quando disparado à mão.

Configuração, uma vez só:

1. **Settings → Pages → Build and deployment → Source:** "GitHub Actions".
2. **Settings → Environments → `github-pages` → Deployment branches and tags:** adicione `main-spa`.
3. **Settings → Secrets and variables → Actions:** crie `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET`.

Para publicar: **Actions → Deploy to GitHub Pages → Run workflow**, escolhendo a branch `main-spa`.

<a id="seguranca"></a>

## Segurança

Chamar o Spotify direto do navegador, sem servidor, foi uma escolha para a demonstração
([ADR 0002](docs/adr/0002-spa-estatica-com-spotify-chamado-do-navegador.md)). Ela **não serve para produção**.

### O que esta versão expõe

- **Client ID e Client Secret públicos.** Os dois estão no JavaScript publicado; basta abrir o DevTools. Com eles,
  qualquer pessoa pede tokens em nome do nosso app, fora desta página. Os termos do Spotify proíbem expor o segredo,
  e o app pode ser bloqueado.
- **Sem autenticação nem autorização.** Qualquer visitante usa a página, e não há como dizer quem pode ver o quê.
- **Cota compartilhada e sem defesa contra abuso.** O limite de requisições do Spotify é do app, não de cada
  visitante. Quem copiar o segredo pode esgotá-lo (429) para todos, e não há limite por usuário, cache ou bloqueio.
- **Trocar o segredo exige novo build.** Se ele vazar, é preciso trocá-lo no Spotify e publicar de novo; até lá, a
  página fica sem dados.
- **Nenhum controle no servidor.** Não há log de quem consultou, auditoria, alerta de uso fora do normal, nem
  cabeçalhos de segurança (o GitHub Pages não permite CSP por cabeçalho).
- **Resposta inteira do Spotify no navegador.** O front recebe e filtra o JSON completo, em vez de só os campos que
  usa.

Mitigação adotada enquanto for só demonstração: um app do Spotify exclusivo para esta página, sem dados de usuário,
com o segredo trocado se houver abuso.

### Como deveria ser em produção

O navegador nunca fala com o Spotify. Ele fala só com **nosso backend**, levando o token do **próprio usuário**,
emitido depois do login. O backend valida esse token, confere as permissões e só então busca no Spotify o necessário.

```text
Navegador (Angular)
  ├─ login no provedor de identidade (OAuth 2.0 / OpenID Connect, Authorization Code + PKCE)
  │    └─ recebe o access token do usuário (JWT)
  └─ GET /api/tracks?isrc=…   Authorization: Bearer <JWT do usuário>
        │
        ▼
Nosso backend (API / BFF)
  ├─ valida o JWT: assinatura (JWKS), emissor, audiência, validade
  ├─ autoriza: o usuário tem a permissão (ex.: escopo `catalog:read`) e acesso a este contrato?
  ├─ limita requisições por usuário e registra quem consultou o quê
  ├─ pede e guarda em cache o token de app do Spotify (Client Credentials; o segredo só existe aqui)
  ├─ consulta o Spotify, guarda as respostas em cache por um tempo
  └─ devolve só o que a tela usa (o modelo `Track`), nunca o JSON do Spotify
```

O que muda no front: o `environment` passa a ter só a URL da nossa API, sem credenciais. O `spotifyAuthInterceptor`
dá lugar a um interceptor que envia o token do usuário (guardado em memória, nunca no `localStorage`) e o renova ou
leva ao login quando ele vence. Os serviços em `src/app/api/` passam a chamar a nossa API, e os de `services/`
continuam iguais para o resto do app.

O que se ganha: o segredo nunca sai do servidor; só usuários autenticados e autorizados consultam; o limite e o uso
são controlados por usuário; o cache serve muitos visitantes com poucas chamadas ao Spotify; trocar o segredo não
exige novo deploy do front.

A versão SSR da [`main`](https://github.com/AlyssonMascarenhas/onerpm-challenge/tree/main) já dá o primeiro passo:
um BFF guarda o segredo e faz cache. Faltaria o login e a validação do JWT do usuário.

## Limitações conhecidas

- O Client Secret fica visível no JavaScript publicado (ver [Segurança](#seguranca)).
- Sem cache entre visitantes: cada visita faz suas buscas, então um limite do Spotify (429) aparece mais cedo.
- A prévia depende do player oficial do Spotify (iframe); o volume não existe na API do embed.

---

<a id="enunciado-original"></a>

<details>
<summary><strong>Enunciado original</strong> (preservado sem alterações)</summary>

## Início

Bem vindo ao mundo da música!

Atualmente temos a necessidade de consumir os dados de faixas musicais através do código ISRC, que é uma das coisas mais importantes na indústria fonográfica.

Segundo [Abramus](https://www.abramus.org.br/musica/isrc/), ISRC (International Standard Recording Code ou Código de Gravação Padrão Internacional) é um padrão internacional de código para identificar de forma única as gravações (faixas).

Ele funciona como um código de barras da faixa.


## Problema

Durante o fechamento de contrato com um produtor, foram informados 10 ISRC's que não constam em nossas bases de dados, que seguem abaixo:

* NO1R42509310
* NO1R42511410
* BRC310600002
* BR1SP1200071
* BR1SP1200070
* BR1SP1500002
* BXKZM1900338
* BXKZM1900345
* QZNJX2081700
* QZNJX2078148

Precisamos obter e exibir os seguintes dados:

* Thumb do álbum
* Data de lançamento
* Título da faixa
* Lista dos artistas da faixa
* Duração da faixa em minutos e segundos (mm:ss)
* Player com prévia do áudio
* Link para a página da faixa no Spotify
* Sinalização dizendo se a faixa está ou não disponível no Brasil (BR)

Por decisão técnica, precisamos exibí-los através de uma webpage pública, ordenados por título da faixa de forma alfabética, sem necessidade de armazenamento para consulta posterior.

Caso a integração com o fornecedor dos dados não esteja disponível, um alerta deve ser dado ao usuário.


## Requisitos

* Faça um fork deste repositório e abra um PR quando estiver finalizado.
* O frontend deve ser no  deve ser feito em Angular versão LTS.
* A página deve ser responsiva para atender todos os tipos de dispositivos.
* Use a API do Spotify: [https://developer.spotify.com/](https://developer.spotify.com/) para coletar os dados das faixas.


## Diferencial

* Desenvolver testes unitários e de integração.


## O que será avaliado

* Fidelidade às instruções.
* Padrões de projeto.
* Clean Code e boas práticas.
* Boas práticas de versionamento.


## Perfil que buscamos

* Comunicativo
* Autodidata
* Automotivado
* Curioso
* Gostar de trabalhar em equipe
* Compromissado

</details>
