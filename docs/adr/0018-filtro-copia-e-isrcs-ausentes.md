# 0018 — Filtro, cópia de ISRC e lista dos ISRCs que não constam na base

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

A lista é curta hoje (10 ISRCs), mas a página precisa continuar útil com muitos: achar uma faixa pelo nome ou pelo código,
levar um ISRC para outro sistema sem digitá-lo e saber, de relance, quantos ISRCs do contrato **não constam na base** (que é
o motivo de a página existir), sem rolar até os cartões de "não encontrado" no fim da lista.

## Decisão

- **Filtro por nome da música e/ou ISRC**, no navegador (a lista já está toda na página; não há paginação nem busca no
  servidor). A função pura `filterResults` ignora maiúsculas, acentos e, no ISRC, espaços e traços (`br1sp-1200071`
  encontra `BR1SP1200071`); ISRCs sem faixa só casam pelo código. Mantém a ordem da lista. A página mostra "Mostrando X de Y"
  enquanto filtra, uma mensagem com "Limpar o filtro" quando nada casa, e o campo se limpa com o botão ou com Esc. O campo fica
  num landmark `search`, com rótulo, e o texto de resumo é uma região `status` (anunciada a quem usa leitor de tela).
- **Copiar ISRC**: o componente compartilhado `CopyButton` (ícone ou ícone + texto) usa o `Clipboard` do CDK (que cai para
  `execCommand` quando a API assíncrona não está disponível), mostra um ✓ e "Copiado" por 1,5 s e anuncia "Copiado" para
  leitores de tela. Está ao lado do ISRC em cada cartão de faixa, em cada cartão de ISRC sem faixa e em cada linha das listas
  em modal.
- **Resumo e lista dos ISRCs que não constam**: acima da lista, "8 de 10 ISRCs encontrados" e um botão "ISRCs que não constam
  na nossa base: N" (só aparece quando N > 0) que abre um modal com a lista, cada ISRC copiável, e **"Copiar todos"** (um por
  linha). O aviso de falha parcial passou a usar o mesmo componente de lista (`IsrcListDialog`), com "Tentar novamente".
  Os que **falharam** continuam separados dos que **não constam** (um é erro nosso/do Spotify, o outro é um resultado esperado
  do desafio). Os cartões continuam na lista, no fim, e também podem ser filtrados.

## Alternativas consideradas

- **Filtrar no servidor** — não faz sentido: a página já tem todos os resultados e o filtro precisa ser instantâneo.
- **Esconder os cartões de "não encontrado" e deixar só a lista** — perde a visão de cada ISRC no contexto da lista; o
  pedido era um atalho a mais, não substituir os cartões.
- **`navigator.clipboard.writeText` direto** — exige contexto seguro e permissão em alguns navegadores; o `Clipboard` do CDK
  já faz as duas coisas e é testável por injeção.
- **Um modal para falhas e outro para ausentes, copiados** — duplicava marcação e testes; um componente atende os dois.

## Consequências

- Positivas: achar e levar um ISRC sem digitar; o número de ISRCs ausentes está sempre à vista; tudo coberto por testes
  unitários (função pura, componentes, página) e e2e (filtro, cópia com a área de transferência real, modal, idioma) e pelo
  axe nos dois temas (modal aberto e filtro sem resultado).
- Negativas: no Windows a área de transferência recebe quebra de linha CRLF no "Copiar todos" (é o esperado para colar lá;
  os testes normalizam); o filtro olha título e ISRC, não artista nem álbum (não foi pedido; ampliar é trocar `filterResults`).

## Atualização (24/10/2026): a página dividida em componentes

`tracks-page.scss` passou do orçamento de estilo de componente (4 kB) e a página reunia filtro, ordem e o painel de
indisponível. A barra de ferramentas virou `TracksToolbar` (filtro em `model`, resumo, ordem e botão dos ISRCs ausentes) e o
alerta de integração virou `UnavailablePanel`, cada um com seu `.scss`. A página ficou com o _hero_, os avisos e a grade; os
limites da grade continuam juntos em `tracks-page.scss` e `track-card.scss` ([ADR 0017](0017-grade-de-4-colunas-e-cartao-compacto.md)).
Nenhum limite de orçamento foi alterado.
