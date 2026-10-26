# 0022 — Releases criadas à mão; publicar a release dispara o deploy

- **Status:** Aceito (substitui, no ADR 0020, o uso do release-please; o resto do ADR 0020 e o ADR 0021 continuam valendo)
- **Data:** 2026-10-24

## Contexto

O ADR 0020 deixou o release-please abrir um PR de release a cada merge e criar a tag e a release quando esse PR fosse
integrado. Na prática deu mais trabalho do que valor para um projeto com um único autor e poucas releases:

- ele precisa de um token próprio (`RELEASE_PLEASE_TOKEN`) com escrita em conteúdo e em PRs, senão o PR de release não
  dispara o CI e a `main` protegida o bloqueia; um token com permissão faltando só reprova na hora de criar a release (visto
  aqui: `Resource not accessible by personal access token`), depois que o PR já foi integrado;
- o título do PR, a versão no `package.json` e o `CHANGELOG.md` gerado exigiram ajustes e testes só para o release-please
  funcionar (`include-component-in-tag`, `pull-request-title-pattern`, `CHANGELOG.md` fora do Prettier);
- decidir **quando** lançar é uma escolha de quem mantém o projeto, não algo que deva acontecer sozinho.

## Decisão

- **A release é criada à mão** no GitHub: Releases → _Draft a new release_ → _Choose a tag_ → digite `vX.Y.Z` (nova tag, no
  alvo `main`) → _Generate release notes_ → _Publish release_.
- **Publicar a release dispara o workflow `Release`** (`on: release: types: [published]`), que faz o _checkout_ **da tag** e
  (a) implanta na Vercel (ADR 0021) e (b) publica a imagem no GHCR (ADR 0020). Um rascunho, um merge na `main` ou uma
  _pre-release_ não implantam nada. `workflow_dispatch` com uma tag existente reimplanta essa tag.
- **A tag continua sendo validada** (`^v[0-9]+\.[0-9]+\.[0-9]+$`) e chega aos _scripts_ só pelo ambiente. Um teste
  (`src/release-workflow.spec.ts`) trava isso, o _checkout_ da tag e o uso do token da Vercel.
- **O release-please sai**: o workflow, `release-please-config.json` e `.release-please-manifest.json` foram removidos, e o
  segredo `RELEASE_PLEASE_TOKEN` deixa de ser necessário (pode ser apagado do repositório). O `CHANGELOG.md` da 1.0.0 fica como
  histórico; as notas das próximas releases são as geradas pelo GitHub a partir dos PRs. Os Conventional Commits e o
  commitlint continuam (ADR 0004).
- **A versão do `package.json`** não é mais atualizada sozinha; a tag é a fonte da versão em produção.

## Alternativas consideradas

- **Manter o release-please e só corrigir o token** — resolve o erro, mas mantém a automação que ninguém pediu e o ruído de um
  PR de release a cada merge.
- **Deploy a cada merge na `main`** — contra o pedido de implantar só uma versão numerada.
- **Disparar por `push` de tag** — equivale, mas a release do GitHub também carrega as notas e fica visível para quem avalia.

## Consequências

- Positivas: menos peças (sem token extra, sem PR de release); a decisão de lançar é explícita; o que está no ar é sempre uma
  release numerada.
- Negativas: o número da versão e as notas são escolhidos por quem publica (sem cálculo automático pelos commits); nada
  impede publicar uma tag de um commit que não passou no CI, então só crie a release de um commit da `main` com o CI verde.
