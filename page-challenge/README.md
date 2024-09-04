# PageChallenge

Este projeto é uma aplicação Angular que consome a API do Spotify para exibir informações sobre faixas musicais usando o código ISRC. O objetivo é obter e exibir informações detalhadas das faixas, ordenadas por título, com várias funcionalidades, incluindo prévia do áudio e informações detalhadas.

## Visão Geral

O projeto permite consultar dados de faixas musicais através do código ISRC (International Standard Recording Code), exibindo informações como:

- Imagem do álbum (Thumb do álbum)
- Data de lançamento
- Título da faixa
- Lista dos artistas da faixa
- Duração da faixa em minutos e segundos (mm:ss)
- Player com prévia do áudio
- Link para a página da faixa no Spotify
- Disponibilidade da faixa no Brasil (BR)

A aplicação é responsiva e ordena as faixas por título de forma alfabética.

## Requisitos

- **Node.js**: versão 14 ou superior
- **Angular CLI**: versão 17.3.9
- **Conta e credenciais da API do Spotify**: [Obtenha suas credenciais aqui](https://developer.spotify.com/dashboard/)

## Configuração do Projeto

1. **Clone o repositório**:

    ```bash
    git clone https://github.com/seu-usuario/page-challenge.git
    ```

2. **Navegue até o diretório do projeto**:

    ```bash
    cd page-challenge
    ```

3. **Instale as dependências**:

    ```bash
    npm install
    ```

4. **Configure suas credenciais da API do Spotify**:

    Edite o arquivo `src/environments/environment.ts` e adicione seu `accessToken` e `baseUrl`:

    ```typescript
    export const environment = {
      production: false,
      spotify: {
        baseUrl: 'https://api.spotify.com/v1',
      },
      accessToken: 'YOUR_ACCESS_TOKEN_HERE'
    };
    ```

5. **Referência ao Projeto de Exemplos de Autenticação da API do Spotify**:

    Em sua conta do GitHub, o Spotify disponibiliza diversos projetos que facilitam o uso de sua API. Um deles é o repositório [web-api-auth-examples](https://github.com/spotify/web-api-auth-examples), o qual utilizamos para dar continuidade ao nosso projeto. Este repositório fornece exemplos úteis e orientações sobre autenticação e integração com a API do Spotify.

## Servidor de Desenvolvimento

Para iniciar o servidor de desenvolvimento e visualizar a aplicação:

```bash
ng serve

