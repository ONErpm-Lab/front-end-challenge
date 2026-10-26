# Architecture Decision Records (ADRs)

Cada decisão técnica relevante tem um registro curto aqui: **contexto, decisão, alternativas e consequências**.
Formato inspirado no [MADR](https://adr.github.io/madr/). Idioma: português.

## Como usar

1. Copie [`0000-template.md`](0000-template.md) para `NNNN-titulo-em-kebab-case.md` (próximo número livre).
2. Escreva no **mesmo PR** que introduz a decisão — o código e o "porquê" andam juntos.
3. Não reescreva história: se a decisão mudar, crie um novo ADR e marque o antigo como `Substituído por NNNN`.
4. Adicione a linha no índice abaixo.

## Índice

| #    | Decisão                                                                       | Status   |
| ---- | ----------------------------------------------------------------------------- | -------- |
| 0001 | [Registrar decisões de arquitetura](0001-registrar-decisoes-de-arquitetura.md) | Aceito   |
| 0002 | [Angular 21 (LTS) em vez do 22](0002-angular-21-lts.md)                       | Aceito   |
| 0003 | [BFF no próprio Angular SSR + Express](0003-bff-no-angular-ssr.md)             | Aceito   |
| 0004 | [Commits semânticos, commitlint e fluxo de PRs](0004-commits-semanticos-e-fluxo-de-prs.md) | Aceito |
| 0005 | [Regras de consulta ao Spotify em 2026](0005-regras-de-consulta-ao-spotify.md) | Aceito   |
| 0006 | [PrimeNG como biblioteca de UI e MCP em vez de plugin](0006-primeng-e-mcp.md)  | Aceito   |
| 0007 | [Estrutura do BFF e estratégia de testes do servidor](0007-estrutura-do-bff-e-testes.md) | Aceito |
| 0008 | [Convenções de organização e estilo de código](0008-convencoes-de-organizacao-de-codigo.md) | Parcialmente substituído pelo 0027 |
| 0009 | [CI com GitHub Actions em PRs para `main`](0009-ci-com-github-actions.md) | Aceito |
| 0010 | [Domínio de faixas no front: ordenação, duração e estado](0010-dominio-de-faixas-no-front.md) | Aceito |
| 0011 | [Internacionalização com Transloco, em seis idiomas, também no servidor](0011-i18n-com-transloco.md) | Aceito |
| 0012 | [Tema, modo escuro e layout com PrimeNG](0012-tema-e-layout-com-primeng.md) | Aceito |
| 0013 | [Cartões de faixa e player de prévia do Spotify](0013-cartoes-de-faixa-e-player-do-spotify.md) | Aceito |
| 0014 | [Testes de ponta a ponta e auditoria de acessibilidade](0014-testes-e2e-e-acessibilidade.md) | Aceito |
| 0015 | [Acabamento da interface: alinhamento, aba, rodapé e ações](0015-acabamento-da-interface.md) | Aceito |
| 0016 | [Barra de reprodução fixa, com início automático](0016-barra-de-reproducao-fixa.md) | Aceito |
| 0017 | [Grade de 4 colunas e cartão compacto no celular](0017-grade-de-4-colunas-e-cartao-compacto.md) | Aceito |
| 0018 | [Filtro, cópia de ISRC e lista dos ISRCs que não constam na base](0018-filtro-copia-e-isrcs-ausentes.md) | Aceito |
| 0019 | [Cabeçalhos de segurança, compressão, ordem A–Z/Z–A](0019-endurecimento-do-servidor-e-ordem.md) | Aceito |
| 0020 | [Imagem de contêiner e deploy a partir da release (tag)](0020-imagem-e-deploy-por-release.md) | Aceito |
| 0021 | [Hospedagem na Vercel, com deploy a partir da tag da release](0021-hospedagem-na-vercel.md) | Aceito |
| 0022 | [Releases criadas à mão; publicar a release dispara o deploy](0022-releases-criadas-a-mao.md) | Aceito |
| 0023 | [Organização de pastas por responsabilidade e camada](0023-organizacao-de-pastas-por-responsabilidade.md) | Aceito |
| 0024 | [Cache longo com resposta antiga em caso de falha e saúde do Spotify](0024-cache-longo-com-resposta-antiga-e-saude-do-spotify.md) | Aceito |
| 0025 | [O servidor renderiza as faixas; o store usa `rxResource`](0025-ssr-renderiza-as-faixas-e-store-com-rxresource.md) | Aceito |
| 0026 | [A escolha de idioma fica em um cookie, lida também pelo servidor](0026-idioma-salvo-em-cookie.md) | Aceito |
| 0027 | [Convenções de código menos rígidas (revisa o 0008)](0027-convencoes-de-codigo-menos-rigidas.md) | Aceito |
| 0028 | [CSP com `script-src` e nonce por resposta; cache LRU e compartilhado](0028-csp-com-nonce-e-cache-compartilhado.md) | Aceito |
