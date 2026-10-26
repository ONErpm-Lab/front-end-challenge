# 0014 — Testes de ponta a ponta e auditoria de acessibilidade

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Os testes unitários e de integração (Vitest) provam as peças e a API, mas não o que o visitante vive: o servidor SSR real, a
hidratação, os cliques, a troca de idioma/tema, o layout em celular e desktop e a acessibilidade de verdade. O compromisso do
projeto é WCAG AA (CLAUDE.md), e o enunciado exige página responsiva e **alerta quando a integração está fora**.

## Decisão

- **Playwright** (Chromium) contra o **build de produção servido pelo servidor Express real** (`npm run build`, depois
  `npm run e2e`), nos projetos **desktop (1280×900)** e **mobile (Pixel 7)**.
- **Spotify nunca é chamado.** O navegador recebe `/api/tracks` simulado com as **respostas reais gravadas** dos 10 ISRCs,
  passadas pelo mapper do próprio BFF (a página recebe exatamente o que a produção enviaria). O player e as capas do Spotify
  são interceptados. Resultado: testes herméticos, rápidos e sem credenciais.
- **O caminho "integração indisponível" usa o BFF de verdade**: o servidor de teste sobe **sem credenciais** (variáveis
  vazias, que vencem qualquer `.env` local) e responde 503 de fato; os testes conferem o alerta, o "tentar novamente", o
  idioma do alerta, o contrato da API (503 sem vazar configuração, 400, 404 em JSON) e a recuperação quando o provedor volta.
- **O que é verificado**: as 10 faixas em ordem A→Z com todos os dados; ISRCs sem faixa depois das faixas e o aviso de
  falha parcial; player só ao clicar (um iframe); idioma pelo navegador, troca entre os 6 idiomas (texto, `<html lang>`,
  título, datas), persistência e **idioma já no HTML do servidor** para vários `Accept-Language`; tema (troca, persistência,
  preferência do sistema, **sem flash**: a classe vale mesmo com o JavaScript bloqueado); layout (sem rolagem horizontal,
  colunas, altura igual por linha, cabeçalho fixo, movimento reduzido); teclado (_skip link_, lista de idiomas).
- **Acessibilidade com axe** (`@axe-core/playwright`, WCAG 2.0/2.1 A e AA), **zero violações** nos temas claro e escuro, em
  desktop e celular, nos estados: página com faixas, carregando, alerta de indisponível, ISRCs sem faixa/aviso, player
  aberto, lista de idiomas aberta, e em todos os idiomas. Isso já pegou problemas reais (abaixo).
- **No CI** (`ci.yml`, job `e2e`, exigido pelo `CI OK`): instala o Chromium, faz o build e roda a suíte com 2 _workers_;
  o relatório HTML sobe como artefato quando algo falha.

## O que a auditoria encontrou e corrigimos

1. **Foco roubado ao carregar.** O PrimeNG 21 grava `autofocus` em todo componente, salvo se `false` explícito, e o navegador
   focava o seletor de idioma: o primeiro `Tab` pulava o _skip link_. Passamos `autofocus` desligado (`[autofocus]="false"` no
   `p-select`; `[buttonProps]="{ autofocus: false }"` nos `p-button`, porque o botão calcula `autofocus || buttonProps?.autofocus`
   e `false || undefined` ainda liga o atributo). Testes unitários e e2e garantem que nada rouba o foco.
2. **Contraste das mensagens e do botão de perigo.** No tema claro, o Aura usa vermelho 600/500 e amarelo 600 sobre fundos
   pálidos (2,5:1 a 3,7:1) e, no escuro, vermelho 500 sobre o tom do cartão (4,47:1). Escurecemos os _tokens_ no preset;
   testes unitários calculam os contrastes (inclusive o fundo mesclado) e provam que os valores padrão do Aura reprovavam.
3. **Região rolável sem acesso por teclado** na lista de idiomas (a lista de 200 px rolava): `scrollHeight="20rem"` faz as
   seis opções caberem sem rolagem.
4. **Disputa de hidratação nos próprios testes**: clicar antes de a página hidratar fazia o cliqe se perder. Os testes
   esperam as faixas aparecerem (prova de que o Angular iniciou e buscou) antes de interagir, e esperam a lista de idiomas
   fechar entre trocas.

## Alternativas consideradas

- **Cypress** — bom, mas Playwright é mais rápido em paralelo, tem emulação de dispositivo e `request` embutido para testar o
  HTML do servidor e a API.
- **Chamar o Spotify de verdade nos testes** — frágil (rede, limites, Premium do dono do app) e exige segredos no CI.
- **Simular também o BFF** — esconderia justamente o que queremos provar no alerta de indisponibilidade.
- **Vários navegadores (Firefox, WebKit)** — mais cobertura a um custo de CI maior; Chromium cobre o essencial por ora.

## Consequências

- Positivas: o fluxo que o visitante vê está coberto de ponta a ponta; regressões de acessibilidade quebram o CI;
  o enunciado (responsivo, alerta, ordem, dados) tem prova executável.
- Negativas: o job de e2e é o mais lento do CI (instala o Chromium e faz o build); testes de navegador exigem cuidado com
  hidratação e animações; o axe não substitui um teste com leitor de tela real.
- Pendente: o PrimeNG 21 mantém em inglês o rótulo `dropdown trigger` de um elemento decorativo do `p-select`; o axe não o
  considera violação, então foi mantido e documentado aqui.
