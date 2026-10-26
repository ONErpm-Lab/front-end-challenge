# 0012 — Tema, modo escuro e layout com PrimeNG

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A página precisa de um visual aderente a **música** e ao contexto da OneRPM, **claro e escuro**, **responsivo** (celular a
desktop), acessível (WCAG AA) e com seletor de idioma e de tema. Não existe um guia de marca público da OneRPM (o site
não expõe cores oficiais), então não dá para afirmar fidelidade à marca.

## Decisão

- **PrimeNG 21** no modo estilizado, com o preset **Aura personalizado** (`definePreset`) em `core/theme`. Só tokens e
  variáveis CSS; sem Tailwind. Versões alinhadas ao Angular 21 (`@primeuix/themes@2`, que casa com o `@primeuix/styled`
  0.7 do PrimeNG 21; a série 3 é para o PrimeNG 22).
- **Paleta própria, em um lugar só** (`theme.constants.ts`): acento laranja "luz de palco" (escala 50–950) sobre
  superfícies neutras "tinta" com leve tom violeta, mais um rosa de apoio para o degradê. **Não é a paleta oficial da
  ONErpm**; trocar a marca é editar essas duas escalas. Motivo musical: marca com barras de equalizador animadas
  (desligadas com `prefers-reduced-motion`) e título com degradê.
- **Contraste verificado por teste** (WCAG AA, 4,5:1): texto branco sobre o primário do tema claro (`700` → 5,5:1),
  texto escuro sobre o primário do tema escuro (`400` → 7,5:1), e textos de apoio nos dois fundos. Se alguém mexer na
  paleta e quebrar o contraste, o teste falha.
- **Modo escuro por classe** `app-dark` no `<html>` (`darkModeSelector`). Prioridade: escolha salva → preferência do
  sistema → claro. **Um script inline no `index.html`** aplica a classe antes da primeira pintura (sem _flash_ branco para
  quem usa escuro); como não pode importar as constantes, testes garantem que chave, classe e _media query_ não divirjam,
  e executam o script para provar o comportamento. O script decide **exatamente como o serviço `Theme`**: só `light` e
  `dark` valem como escolha salva (qualquer outro valor é ignorado) e, se o armazenamento estiver bloqueado ou o valor for
  inválido, vale a preferência do sistema, nunca "claro" por padrão. Um teste de paridade compara os dois em todas as
  combinações de valor salvo × preferência do sistema. O serviço `Theme` mantém a classe sincronizada depois.
- **`cssLayer`**: o PrimeNG fica numa camada abaixo do nosso CSS, então sobrescrevemos sem `!important`.
- **Fonte Inter variável auto-hospedada** (`@fontsource-variable/inter`): sem requisição a terceiros, e o navegador baixa
  só os blocos de caracteres usados (latino, latino estendido e **cirílico** — necessário para o russo — e vietnamita).
- **Layout** mobile-first: cabeçalho fixo com marca, seletor de idioma e botão de tema; conteúdo centralizado até 64 rem
  com margens fluidas (`clamp`); títulos com `clamp` e `text-wrap: balance`; sem rolagem horizontal em 375 px (verificado).
  _Skip link_ para o conteúdo, `main` focável, `<h1>` único, nomes de idioma escritos no próprio idioma e marcados com
  `lang`.
- **Componentes de UI do PrimeNG**: `p-select` (idioma), `p-button` (tema e "tentar novamente"), `p-message` (alertas),
  `p-skeleton` (carregamento). Textos via o pipe `transloco` no template (combina com `OnPush` e _zoneless_ e reage à troca de idioma; ver [ADR 0011](0011-i18n-com-transloco.md)).
- **Estados da página**: placeholders enquanto carrega (anunciados por `role="status"`), alerta `role="alert"` com
  botão de nova tentativa quando o provedor está fora (a região só fica `aria-busy` enquanto carrega — com a falha ela já
  não está ocupada, senão leitores de tela podem adiar o anúncio do alerta), aviso `role="status"` quando só algumas ISRCs falham. A busca roda
  no store (`rxResource`), inclusive no servidor ([ADR 0025](0025-ssr-renderiza-as-faixas-e-store-com-rxresource.md)). A lista de faixas desta etapa é simples; os
  cartões (capa, data, player, link, selo do Brasil) vêm no próximo PR.
- **Orçamento de _bundle_ inicial** subiu de 500 kB/1 MB para **800 kB/1,2 MB** (753 kB brutos, **171 kB** comprimidos):
  o preset do PrimeNG e o CDK são o grosso. Não há como ter o PrimeNG estilizado menor sem abrir mão do tema; a página
  carrega o resto sob demanda (traduções e a página em _chunks_ próprios).

## Alternativas consideradas

- **Angular Material** — bom, mas tema por _tokens_ e dark mode dão mais trabalho; PrimeNG já estava decidido (ADR 0006).
- **Tailwind + componentes próprios** — controle total, porém reimplementar select, mensagens e acessibilidade.
- **Seguir só `prefers-color-scheme` (CSS)** — sem como o visitante escolher; mantivemos a escolha explícita.
- **Aplicar o tema só no Angular** — causaria _flash_ de tema claro antes da hidratação.
- **Google Fonts** — requisição a terceiros e dependência de rede; auto-hospedar é mais rápido e privado.

## Consequências

- Positivas: um único lugar para rebrand; contraste e sincronia do `index.html` sob teste; claro/escuro sem _flash_.
- Negativas: _bundle_ inicial maior que o orçamento padrão do Angular; o PrimeNG 21 fixa em inglês o rótulo
  "dropdown trigger" de um elemento decorativo do `p-select` (tentei ocultá-lo via _pass-through_ sem efeito; a auditoria
  de acessibilidade do PR de e2e deve confirmar se importa); a cor de marca é uma aproximação até haver guia oficial.

## Atualização — brilho do topo (hero)

O brilho atrás do título é uma camada própria (`.hero::before`) com uma máscara que o apaga até a borda de baixo. Os
degradês radiais têm tamanho fixo (24rem de altura): no celular o bloco é mais baixo e a borda cortava o brilho ainda forte,
deixando uma linha dura. Um teste e2e lê os pixels da última linha do bloco e da primeira abaixo dele (nos dois temas e nos
dois tamanhos de tela) e exige que a diferença seja imperceptível. A área do conteúdo também ganhou um respiro no topo, para o
campo de filtro não encostar no bloco.

## Atualização (24/10/2026): preset só com o que a página usa

Uma revisão apontou o PrimeNG pesando para uma única página (bundle inicial de 772 kB brutos, 174 kB transferidos). A medição
(`ng build --stats-json`) mostrou que o preset **Aura inteiro** respondia por ~106 kB: ele carrega os _tokens_ de uns noventa
componentes e a página usa oito. O preset passou a ser montado de `@primeuix/themes/aura/base` mais **só os componentes
usados** (`button`, `dialog`, `iconfield`, `inputtext`, `message`, `select`, `skeleton`, `tag`): o bundle inicial caiu para
**706 kB brutos (169 kB transferidos)** e o aviso de orçamento passou de 800 para 750 kB, para a economia não se perder. A aparência não muda
(os _tokens_ dos componentes usados são os mesmos). **Atenção:** um componente PrimeNG novo precisa dos seus _tokens_ em
`theme-preset.ts`, senão aparece sem tema.

Também foi testado trocar o `p-select` do idioma por um `<select>` nativo (−~110 kB e sem `@angular/forms`, bundle inicial em
**521 kB**), mas o visual nativo destoou do resto da interface e foi descartado: o `p-select` fica.
