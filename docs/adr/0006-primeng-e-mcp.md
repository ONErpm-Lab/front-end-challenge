# 0006 — PrimeNG como biblioteca de UI e MCP em vez de plugin

- **Status:** Aceito
- **Data:** 2026-10-23

## Contexto

Precisamos de componentes acessíveis, temáveis (tema visual de música/OneRPM, claro/escuro) e com suporte a
assistentes de IA. O PrimeNG oferece [MCP](https://primeng.dev/mcp), [plugin](https://primeng.dev/plugin) e
[llms.txt](https://primeng.dev/llms). A doc avisa que **registrar plugin e MCP juntos duplica o servidor**.

## Decisão

- Usar **PrimeNG 21** (alinhado ao Angular 21) com preset customizado via `definePreset`.
- Registrar **apenas o MCP** (`@primeng/mcp@21`) em `.mcp.json`, versionado — funciona para qualquer pessoa que clonar o repo.
- Referenciar `llms.txt`/`llms-full.txt` no `CLAUDE.md` como fonte de docs para IA.

## Alternativas consideradas

- **Plugin PrimeNG** — traz skills úteis, mas é instalação por usuário (não versionada) e conflita com o MCP.
- **Angular Material / CDK puro** — ótimo, porém menos opções de tema pronto e mais CSS manual.
- **Tailwind** — fora de escopo; tokens do PrimeNG + variáveis CSS bastam.

## Consequências

- Positivas: configuração reproduzível; temas por tokens; componentes acessíveis.
- Negativas: dependência de uma biblioteca grande; é preciso importar só o necessário para manter o bundle enxuto.
