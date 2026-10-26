# 0006 — Deploy no GitHub Pages, disparado à mão

- **Status:** Aceito
- **Data:** 2026-10-26

## Contexto

A versão SSR da `main` está na Vercel e não pode ser tocada. Esta branch gera só arquivos estáticos (ADR 0002), então
qualquer hospedagem estática serve. O site fica em `https://<usuário>.github.io/<repositório>/`: um subcaminho, não a
raiz do domínio. As credenciais do Spotify não ficam no Git e precisam entrar no build.

## Decisão

- **GitHub Pages, pelo workflow `.github/workflows/deploy-pages.yml`** (fonte do Pages: "GitHub Actions").
- **Só manual** (`workflow_dispatch`) e só a partir da `main-spa`: publicar é uma escolha, não efeito de um merge.
- **Antes de publicar:** lint, testes unitários com cobertura e build de produção. O e2e continua no CI dos PRs.
- **Credenciais:** os secrets `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` do repositório são escritos no
  `environment.ts` durante o job; sem eles o deploy falha, em vez de publicar uma página sem dados.
- **Subcaminho:** `--base-href` vem do `actions/configure-pages`; os caminhos do `index.html` já são relativos.
  Uma cópia do `index.html` como `404.html` faz o app responder a qualquer caminho e voltar ao catálogo.

## Alternativas consideradas

- **Vercel (outro projeto)** — funcionaria, mas mistura com o deploy da `main`, que não deve ser mexido.
- **Netlify / Cloudflare Pages** — mais um serviço e mais uma conta para quem avalia; o Pages já vem com o repositório.
- **Deploy a cada push na `main-spa`** — automático, mas publicaria qualquer merge sem decisão.

## Consequências

- Positivas: sem serviço extra; o deploy usa o mesmo setup (`setup-project`) do CI; o segredo fica fora do Git.
- Negativas: o Client Secret continua legível no JavaScript publicado (ADR 0002). O Pages não permite cabeçalhos
  próprios, então uma CSP só seria possível por `<meta>`. O ambiente `github-pages` precisa liberar a branch
  `main-spa`, já que a padrão do repositório é a `main`.
