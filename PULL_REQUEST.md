## O que foi entregue

Página pública em Angular 21 (LTS) que consulta os 10 ISRCs do contrato na Spotify Web API e exibe, em ordem alfabética por título: capa do álbum, data de lançamento, título, artistas, duração (mm:ss), prévia de áudio, link para o Spotify e disponibilidade no Brasil.

**Demo (dados reais do Spotify):** https://isrc-spotify-challenge.vercel.app

- Alerta com "Tentar de novo" quando a integração está indisponível; se só parte das consultas falha, as demais faixas aparecem com um aviso.
- ISRCs não encontrados aparecem como cartão na grade, e o resumo indica quantas faixas foram encontradas.
- Prévia de áudio: com `preview_url`, player próprio; sem ela (caso atual de apps novos), o player do Spotify é revelado sobre o próprio card, a partir do botão tocado.
- Responsiva, acessível (AXE sem violações) e com animações que respeitam `prefers-reduced-motion`.
- Nenhum dado é armazenado.

## Decisões principais

- **BFF em Express** (`api/`): guarda o Client Secret, que nunca chega ao navegador.
- **Frontend em vertical slices com ports & adapters**: estado em NgRx Signal Store; a página e o store dependem de portas (`InjectionToken`), e só `provideTracksFeature()` conhece as implementações.
- **Value Object `Isrc`**: normaliza e valida o identificador central do domínio.
- **Fronteiras verificadas pelo ESLint**, com prova executável (`npm run lint:boundaries`).
- **Modo de demonstração**: roda sem credenciais, com o mesmo contrato do cliente real e os metadados reais dos ISRCs; alguns estados são simulados para cobrir todos os casos da tela.

O contexto e as alternativas de cada decisão estão em `docs/DECISOES.md`; a estrutura do código, em `docs/ARQUITETURA.md`.

## Limitações atuais da API do Spotify

- `available_markets` foi removido em Development Mode → disponibilidade no BR via `market=BR` + `is_playable`.
- `preview_url` vem `null` para apps novos → quando há URL, toca a prévia no player próprio; sem ela, o botão abre o player incorporado do Spotify (pelo ID da faixa).
- Sem endpoint em lote → uma busca por ISRC, em paralelo.
- Desde fev/2026, apps em Development Mode só funcionam com **Premium** na conta dona do app (sem isso, a API recusa as requisições); por isso o projeto roda sem credenciais em modo de demonstração.

## Como testar

Sem credenciais, a API sobe em modo de demonstração, que cobre todos os estados da tela (não encontrada, indisponível no BR, com e sem prévia). Os passos estão no README.

| Nível | Comando |
|---|---|
| Unitários + integração (API e frontend) | `npm run test:coverage` |
| Fronteiras e lint (frontend) | `npm run lint:boundaries && npm run lint` |
| Ponta a ponta, desktop e mobile | `npm run e2e` |

- Integração indisponível: `SPOTIFY_MOCK_SCENARIO=down` em `api/.env`; falha de um único ISRC: `SPOTIFY_MOCK_SCENARIO=partial`.
- Dados reais: `SPOTIFY_MODE=live` com credenciais (exige Premium na conta dona do app).

O CI (GitHub Actions) roda tudo isso em cada push.

## Próximos passos

- Endpoint em lote no BFF, com cache, quando a lista de ISRCs deixar de ser fixa (hoje o frontend faz uma consulta por ISRC, por demonstração).
- Migrar as fronteiras para o Sheriff quando houver uma segunda feature.
- Hooks de Git (Husky + lint-staged + commitlint) como verificação local, complementando o CI.
