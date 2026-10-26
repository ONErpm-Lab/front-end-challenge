## O que muda

<!-- Resuma a mudança em 2–4 linhas. -->

## Por quê

<!-- Problema ou necessidade. Link para ADR/issue, se houver. -->

## Como validar

```bash
npm run lint && npm run test:ci && npm run build
```

## Checklist

- [ ] Título do PR no formato Conventional Commits (ex.: `feat(bff): ...`) — vira a mensagem do squash
- [ ] Testes cobrindo os cenários novos (inclusive os de erro)
- [ ] ADR em `docs/adr/` quando há decisão técnica nova
- [ ] Sem segredos no diff (`.env` fica fora do git)
