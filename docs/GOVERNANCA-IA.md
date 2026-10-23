# Governança de IA no projeto

Como este repositório orienta e limita o trabalho de agentes de IA (Claude Code, Copilot, Cursor, Gemini…) e por que cada peça existe.

**Princípio:** a IA acelera, mas **as regras que importam são verificadas por máquina**, não confiadas a um prompt. O texto para agentes descreve contexto e intenção; o lint, os testes e o CI garantem o resultado.

---

## 1. Visão geral

```
                     ┌───────────────────────────────────────────────┐
  Contexto           │  AGENTS.md (projeto)   frontend/AGENTS.md     │  o que o agente LÊ
  (orienta)          │  escrito por nós       gerado pelo Angular CLI│
                     └───────────────────────────────────────────────┘
                     ┌───────────────────────────────────────────────┐
  Ferramentas        │  Angular CLI MCP (.mcp.json, --read-only)     │  o que o agente CONSULTA
  (informa)          │  docs oficiais, boas práticas, exemplos       │
                     └───────────────────────────────────────────────┘
                     ┌───────────────────────────────────────────────┐
  Verificação        │  lint:boundaries · ESLint · TS estrito ·      │  o que BARRA o erro,
  (garante)          │  cobertura 90% · AXE · CI no PR               │  venha de quem vier
                     └───────────────────────────────────────────────┘
```

| Arquivo | Papel | Quem mantém |
|---|---|---|
| `AGENTS.md` | Regras **deste** projeto: comandos, arquitetura, decisões fora do padrão, proibições | Nós, à mão |
| `frontend/AGENTS.md` | Boas práticas **oficiais** do Angular | Angular CLI: `npx ng g ai-config --tool=agents` |
| `CLAUDE.md` | Ponte para o Claude Code, que lê `CLAUDE.md`, não `AGENTS.md` | Duas linhas: `@AGENTS.md` e `@frontend/AGENTS.md` |
| `.mcp.json` | Liga o servidor MCP do Angular CLI em modo somente leitura | Nós |
| `eslint.config.js`, `verify-boundaries.mjs`, `ci.yml` | Verificação determinística | Nós |

---

## 2. Conferência com a documentação oficial do Angular

Antes de escrever o `AGENTS.md`, foram consultadas a seção de IA do angular.dev ([Develop with AI](https://angular.dev/ai/develop-with-ai) e [MCP](https://angular.dev/ai/mcp)) e o que o Angular CLI 21 instalado oferece de fato.

| O que o Angular oferece | Situação aqui | Decisão |
|---|---|---|
| **Regras de boas práticas** (`best-practices.md`) | O CLI 21 gera o arquivo com o schematic `ng g ai-config` (ferramentas: agents, claude, copilot, cursor, gemini, jetbrains, windsurf) | **Gerado sem edição** em `frontend/AGENTS.md`. Não copiamos essas regras para o nosso `AGENTS.md` |
| **Servidor MCP do CLI** (`ng mcp`) | Existe no CLI 21.2 | **Ativado** em `.mcp.json`, com `--read-only` |
| **`llms.txt` / `llms-full.txt`** | Índice da documentação para LLMs | Não versionado: o MCP (`search_documentation`) já consulta a doc oficial sob demanda |
| **Agent skills** (`npx skills add https://github.com/angular/skills`) | Guias carregados sob demanda (`angular-developer` com 46 referências, `angular-new-app`) | **Não adotado.** Ver a seção 4.1 |

**O que a consulta mudou no plano inicial:**

- O plano era escrever um `AGENTS.md` único com as regras de estilo Angular (standalone, OnPush, signals…). **Não é necessário:** o Angular publica e gera essas regras oficialmente. Copiar criaria duas fontes que divergem a cada versão.
- Por isso o nosso `AGENTS.md` ficou com **só o que é específico do projeto** (53 linhas). O que o lint já exige não é repetido, e as fronteiras só são citadas com link.

**Divergência de versão.** A doc no angular.dev já está na **v22**, que diz "não declare `OnPush`" porque virou padrão. O arquivo gerado pelo CLI **21**, a versão do projeto, diz "declare `OnPush`". Seguimos o da nossa versão: por isso o arquivo é **gerado pelo CLI do projeto**, e não baixado do site.

---

## 3. Auditoria do código contra as regras oficiais

Com as regras oficiais em mãos, o código foi conferido item a item:

| Regra oficial | Status | Evidência |
|---|---|---|
| Standalone, sem `standalone: true` explícito | ✔ | Nenhum decorator declara |
| `host` em vez de `@HostBinding`/`@HostListener` | ✔ | `host: {...}` nos componentes |
| `input()` / `output()` / `computed()` | ✔ | Todos os componentes |
| `OnPush` em todos os componentes | ✔ | 7 de 7 |
| Signals para estado, `set`/`update` (sem `mutate`) | ✔ | `TracksSignalStore` (`patchState`), `AudioPreviewService` |
| Control flow nativo (`@if`, `@for`, `@switch`) | ✔ | Templates |
| Sem `ngClass`/`ngStyle` | ✔ | Bindings `[class.x]` e `[style.x]` |
| `inject()` em vez de construtor | ✔ | Serviços e store |
| Não assumir globais | ✔ | `Audio` e `document` protegidos em `AudioPreviewService` e `withViewTransition` |
| **`NgOptimizedImage`** | ✘ → ✔ | **Corrigido:** capas com `ngSrc` + `preconnect` para `i.scdn.co` |
| **Passar em todas as checagens AXE** | ✘ → ✔ | **Corrigido:** o AXE apontou `label-content-name-mismatch` (WCAG 2.5.3) no botão de ordenação |
| `providedIn: 'root'` para singletons | Exceção consciente | `TracksSignalStore` é provido na página (via `provideTracksFeature()`), para o estado viver com a tela (documentado no `AGENTS.md`) |
| Lazy loading de rotas | Não se aplica | A aplicação não tem rotas |

**AXE.** Rodado com `axe-core` nas regras WCAG 2.0/2.1 A e AA + best-practice, em desktop e mobile, nos estados de sucesso e de erro. Resultado final: **0 violações** (40 regras aprovadas no estado de sucesso, 25 no de erro).

---

## 4. Servidor MCP do Angular CLI

```json
// .mcp.json (lido pelo Claude Code)
{ "mcpServers": { "angular-cli": { "command": "npx", "args": ["-y", "@angular/cli@21", "mcp", "--read-only"] } } }
```

**Verificado** iniciando o servidor a partir da raiz do repositório: ele se identifica como `angular-cli-server 21.2.27` e encontra o workspace `frontend/angular.json` (projeto `frontend`, Angular 21).

**Ferramentas expostas no modo somente leitura**

| Ferramenta | Uso |
|---|---|
| `get_best_practices` | Boas práticas da versão instalada |
| `search_documentation` | Busca no angular.dev |
| `find_examples` | Exemplos oficiais de código moderno |
| `list_projects` | Lê o `angular.json` |
| `onpush_zoneless_migration` | Plano de migração (já estamos em zoneless) |
| `ai_tutor` | Tutor interativo |

**Por que `--read-only`.** O modo completo adiciona ferramentas que **agem** no projeto (`devserver_start`, `run_target` para build/test/lint/deploy). Aqui o agente consulta pelo MCP e executa comandos pelo caminho normal, visível e aprovado no terminal, com a mesma sequência do CI descrita no `AGENTS.md`. É o princípio do menor privilégio.

**`@angular/cli@21` fixo:** o servidor responde com as práticas da **nossa** versão, não da última publicada.

Para VS Code, o equivalente fica em `.vscode/mcp.json`, com a chave `"servers"` em vez de `"mcpServers"`. Ele não é versionado, porque é preferência de cada editor.

---

## 4.1. Por que não usamos as skills oficiais (`angular/skills`)

**O que são.** Pacotes de instruções que o agente carrega **só quando a tarefa pede** (ex.: "criar um formulário" carrega a referência de forms), ao contrário do `AGENTS.md`, que está sempre no contexto.

**Por que ficaram de fora.** O repositório `angular/skills` é gerado a partir da branch principal do Angular e hoje descreve a **v22**. Exemplos encontrados na análise (commit `38d431e`):

| A skill recomenda | Situação no Angular 21 |
|---|---|
| Decorador `@Service()` em vez de `@Injectable` | Não existe: o build falha |
| Signal Forms para formulários novos | Estável só a partir da v22 |
| Nomes sem sufixo (`track-card.ts`) | Opcional; o projeto escolheu o estilo com sufixo (seção 4.2) |

A própria skill manda verificar a versão do projeto antes, mas instalar um guia que contradiz a versão em uso adiciona ruído e risco sem ganho: as boas práticas da **nossa** versão já vêm do `frontend/AGENTS.md` gerado pelo CLI 21 e do MCP fixado em `@angular/cli@21`.

**Quando reavaliar.** Ao migrar para a v22, instalar fixando um commit (não `latest`) e revisar o diff a cada atualização.

**Rede de segurança.** Mesmo que um agente sugira uma API da v22, o `ng build` do CI falha antes do merge.

## 4.2. Convenção de nomes com sufixo de tipo

Desde a v20, o Angular CLI gera arquivos **sem sufixo de tipo** (`app.ts`, classe `App`). O guia de estilo permite manter o estilo anterior **configurando o `angular.json`**, e foi o que fizemos:

```jsonc
// frontend/angular.json → projects.frontend.schematics
"@schematics/angular:component": { "style": "scss", "type": "component" },
"@schematics/angular:directive": { "type": "directive" },
"@schematics/angular:service":   { "type": "service" },
"@schematics/angular:pipe":        { "typeSeparator": "." },
"@schematics/angular:guard":       { "typeSeparator": "." },
"@schematics/angular:interceptor": { "typeSeparator": "." },
"@schematics/angular:resolver":    { "typeSeparator": "." },
"@schematics/angular:module":      { "typeSeparator": "." }
```

**Por quê:** o papel de cada arquivo fica visível no nome, o que favorece a leitura e a navegação. Além disso, a regra de fronteira do ESLint usa o sufixo `-api.service`.

**Inconsistência corrigida:** o `app.ts` gerado pelo CLI virou `app.component.ts` (`AppComponent`). Agora todo o projeto segue um único estilo, e `ng generate` produz `*.component.ts`, `*.service.ts` e `*.pipe.ts` (verificado com `--dry-run`).

---

## 5. O que o `AGENTS.md` do projeto contém, e por quê

| Seção | Por quê |
|---|---|
| **Comandos** primeiro | O agente precisa saber como verificar o próprio trabalho antes de ler prosa |
| **Arquitetura** em 5 linhas + link | O detalhe está em `docs/ARQUITETURA.md` e é exigido pelo lint, então não precisa ser repetido |
| **Decisões fora do padrão** | É onde um agente erraria seguindo as regras genéricas: store provido na página, sufixo `-api.service`, sem rotas, regra do BR |
| **Proibido** | Limites que o lint não consegue expressar: segredos, exceções nas fronteiras, novas dependências, baixar cobertura, editar o arquivo gerado |
| **Convenções** | Nomes com sufixo de tipo, versão do Angular (sem APIs da v22), idioma de código/interface/commits, registro de decisões |

---

## 6. Camada de verificação: o que barra o erro, venha de quem vier

| Risco típico de código gerado por IA | Barreira | Onde |
|---|---|---|
| Componente chamando HTTP direto | `no-restricted-imports` por camada | `eslint.config.js` + `npm run lint:boundaries` |
| "Desativar a regra para passar" | Proibição no `AGENTS.md` + revisão do diff de `eslint.config.js` no PR | `AGENTS.md`, CI |
| `any`, índices sem checagem | TS estrito ampliado (`noUncheckedIndexedAccess`…) | `tsconfig.json` |
| Lógica sem teste | Cobertura de 90% por arquivo na lógica pura | `test:coverage` |
| Acessibilidade quebrada | `templateAccessibility` no lint + AXE nos testes E2E | `eslint.config.js`, `e2e/` |
| Tela quebrada mesmo com unitários verdes | E2E no navegador real, desktop e mobile | `e2e/`, job `e2e` do CI |
| Segredo no frontend | BFF; `.env` no `.gitignore` | `api/`, `.gitignore` |
| Tudo acima ser ignorado | CI obrigatório em todo PR | `.github/workflows/ci.yml` |

---

## 7. Como manter

- **Ao atualizar o Angular** (ex.: v22): regenerar `npx ng g ai-config --tool=agents` em `frontend/`, revisar o diff e atualizar `@angular/cli@<versão>` no `.mcp.json`.
- **Ao surgir uma nova decisão fora do padrão:** uma linha no `AGENTS.md` e a explicação em `docs/DECISOES.md`.
- **Manter o `AGENTS.md` curto** (meta: < 150 linhas). Se uma regra puder virar lint, ela sai do texto e vira lint.

## Referências

- [Angular — Develop with AI](https://angular.dev/ai/develop-with-ai)
- [Angular — Angular CLI MCP Server](https://angular.dev/ai/mcp)
- [AGENTS.md](https://agents.md/)
