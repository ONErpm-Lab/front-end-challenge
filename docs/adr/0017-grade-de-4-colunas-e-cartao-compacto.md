# 0017 — Grade de 4 colunas e cartão compacto no celular

- **Status:** Aceito (atualiza os ADRs 0013 e 0015 no que diz respeito à grade e ao alinhamento)
- **Data:** 2026-10-23

## Contexto

Na tela larga a página mostrava só 3 cartões por linha, com capas grandes e muito espaço sobrando nas laterais. No celular
o cartão ocupava a tela inteira (a capa quadrada em largura total) e ainda era preciso rolar para ver os dados e as ações
de uma única faixa.

## Decisão

- **Largura da página: 80rem** (antes 64rem) e colunas de **no mínimo 16,5rem**: 4 colunas a partir de ~1120 px de
  conteúdo, 3 em laptops (~1024 px), 2 em tablets e 1 no celular. Cabeçalho, rodapé e conteúdo usam a mesma variável
  (`--orp-page-width`); a barra de reprodução fica limitada a 64rem para o player não esticar demais.
- **Cartão compacto quando está sozinho na linha.** A grade é um _size container_ (`container-type: inline-size`) e, quando
  a largura dela é menor que a de duas colunas (`@container (width < 34.25rem)`), o cartão muda de forma: capa pequena
  (6,25rem) ao lado do selo, título e artistas; abaixo, os dados em duas colunas; depois as duas ações, um pouco mais baixas
  (`--action-min-height`). O corpo do cartão vira `display: contents` para que suas partes entrem na grade do cartão. Um
  cartão passa a ter ~320 px de altura e cabe inteiro na tela de um celular (testado: menos que a altura da janela menos o
  cabeçalho). O botão de play sobre a capa encolhe junto.
- A consulta é de **contêiner** e não de janela: o cartão decide pelo espaço que realmente tem, e não por um ponto de
  quebra solto que poderia deixar um cartão alto sozinho numa janela de 590 px.
- O alinhamento em _subgrid_ (ADR 0015) continua valendo quando há mais de uma coluna; em uma coluna os cartões deixam de
  ocupar as 8 linhas da grade (não há vizinhos para alinhar).

## Alternativas consideradas

- **Ponto de quebra por largura de janela (`@media`)** — mais simples, mas descasa da grade (o número de colunas depende
  de largura e das margens) e deixa faixas em que o cartão é alto e está sozinho.
- **Capa menor também no desktop** — perde a presença visual das capas, que são o foco da página.
- **Carrossel horizontal no celular** — esconde faixas e quebra a leitura de ordem alfabética.

## Consequências

- Positivas: capas e dados melhor aproveitados em telas largas; uma faixa inteira visível por vez no celular, sem rolagem
  para ler ou agir; testes de colunas por largura (375, 640, 960, 1280 e 1600 px) e de "cabe na tela" no celular.
- Negativas: no celular os botões passam de 44 px para 40 px de altura (atende o AA do WCAG 2.2, que pede 24 px, mas fica
  abaixo dos 44 px recomendados pelo AAA); duas formas de cartão para manter; consultas de contêiner exigem navegadores recentes (suportadas desde 2023
  nos principais).
