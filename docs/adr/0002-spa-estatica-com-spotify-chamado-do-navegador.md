# 0002 — SPA estática, com o Spotify chamado do navegador

- **Status:** Aceito
- **Data:** 2026-10-25

## Contexto

A versão da `main` é Angular com SSR e um BFF em Express; ela já foi enviada para avaliação e continua intocada. Esta
branch é uma aplicação Angular **estática**: só o resultado do `ng build`, sem servidor nosso. A Spotify Web API exige
um token; sem servidor, ou o visitante faz login (PKCE, que exige conta Spotify e cadastro de cada usuário enquanto o
app está em modo de desenvolvimento), ou o próprio app pede um token de app com as credenciais (Client Credentials).

## Decisão

- **Angular 21 (LTS), só navegador:** `ng serve` e `ng build`, _zoneless_, componentes _standalone_, _signals_.
- **Credenciais no `environment`:** `clientId` e `clientSecret` do app Spotify, providos por `SPOTIFY_CREDENTIALS` em
  `app.config.ts`. `environment.ts` (produção) e `environment.development.ts` vão vazios para o Git; os valores locais
  ficam em `environment.local.ts` (ignorado, usado pelo `ng serve`) e, no deploy, são escritos pelo pipeline.
- **Token por interceptor:** `SpotifyTokenService` pede o token de app ao `accounts.spotify.com`, guarda-o até perto de
  vencer e divide uma requisição entre quem pedir junto; `spotifyAuthInterceptor` coloca `Authorization: Bearer` em
  toda chamada a `api.spotify.com` e, se o Spotify recusar (401), renova o token e tenta mais uma vez.
- **Sem credenciais** (ou recusadas), nenhum ISRC pode ser consultado e a página mostra o alerta de indisponibilidade.

## Alternativas consideradas

- **Função serverless só para o token** — o segredo ficaria fora do bundle, mas haveria um backend para hospedar.
- **Login com PKCE** — nenhum segredo, mas o avaliador precisaria de conta Spotify liberada no app.
- **Access token fixo no environment** — vence em uma hora; precisaria ser trocado à mão.

## Consequências

- Positivas: qualquer hospedagem estática serve; o fluxo é o padrão do Angular (environment + interceptor).
- Negativas: **o Client Secret vai no JavaScript publicado** e qualquer pessoa pode lê-lo (os termos do Spotify
  pedem que ele não seja exposto). Mitigação: um app Spotify só para esta página, sem dados de usuário, com o segredo
  trocado se vazar. Sem cache entre visitantes: cada visita faz suas buscas.
- Não é o desenho para produção: lá, o navegador falaria só com um backend nosso, autenticado pelo JWT do usuário
  (login via OAuth 2.0 / OIDC), que validaria permissões e faria as chamadas ao Spotify. Detalhes e riscos na seção
  "Segurança" do `README.md`.
