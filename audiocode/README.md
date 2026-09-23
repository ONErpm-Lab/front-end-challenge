 # Audiocode

Aplicação Angular para consultar e exibir metadados de faixas musicais a partir de códigos ISRC, usando a API do Spotify.

## Funcionalidades

- Consulta de 10 ISRCs definidos no componente de listagem.
- Ordenação alfabética por título.
- Filtro por nome da faixa ou artista, com suporte a buscas sem acentos.
- Lista em formato accordion: cada faixa pode ser aberta individualmente.
- Primeira faixa encontrada aberta automaticamente.
- Detalhes da faixa selecionada:
  - capa do álbum;
  - título e artistas;
  - data de lançamento em `dd/MM/yyyy`;
  - duração;
  - código ISRC;
  - disponibilidade no Brasil;
  - prévia de áudio, quando disponível;
  - link para ouvir no Spotify.
- Estados de carregamento, erro e lista vazia.
- Layout responsivo e navegação por teclado no accordion.

## Tecnologias

- Angular 18 standalone.
- TypeScript 5.5.
- RxJS 7.8.
- Angular HttpClient.
- API Web do Spotify.

## Requisitos

- Node.js 18 ou superior.
- npm.
- Credenciais de uma aplicação criada no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

## Instalação

Na pasta do projeto Angular:

```bash
cd audiocode
npm install
```

## Configuração do Spotify

As credenciais são lidas de:

```text
src/app/environments/environments.ts
```

Configure o `clientId` e o `clientSecret` da sua aplicação:

```typescript
export const environment = {
  production: false,
  spotify: {
    clientId: 'SEU_CLIENT_ID',
    clientSecret: 'SEU_CLIENT_SECRET',
    apiUrl: 'https://api.spotify.com/v1'
  }
};
```

Não publique credenciais reais no repositório. O fluxo Client Credentials está implementado diretamente no frontend apenas para este desafio; em produção, as credenciais devem ser protegidas por um backend ou BFF.

## Execução

Servidor de desenvolvimento:

```bash
npm start
```

Depois, acesse [http://localhost:4200](http://localhost:4200).

Build de produção:

```bash
npm run build
```

Os arquivos compilados são gerados em `dist/audiocode`.

Build contínuo durante o desenvolvimento:

```bash
npm run watch
```

## Testes

```bash
npm test
```

## Estrutura principal

```text
src/app/
├── components/
│   ├── track-list/
│   │   ├── track-list.component.ts
│   │   ├── track-list.component.html
│   │   └── track-list.component.scss
│   └── track-item/
│       ├── track-item.component.ts
│       ├── track-item.component.html
│       └── track-item.component.scss
├── environments/
│   └── environments.ts
├── models/
│   └── track.model.ts
├── services/
│   └── spotify.service.ts
├── app.config.ts
└── app.routes.ts
```

## ISRCs consultados

```text
NO1R42509310
NO1R42511410
BRC310600002
BR1SP1200071
BR1SP1200070
BR1SP1500002
BXKZM1900338
BXKZM1900345
QZNJX2081700
QZNJX2078148
```

## Observação de segurança

O Spotify Client Credentials Flow exige um `client_secret`. Como este projeto executa o fluxo no navegador para fins de avaliação, esse segredo pode ser exposto ao usuário final. Para uma aplicação real, mova a autenticação e as chamadas ao Spotify para um servidor e entregue ao frontend apenas os dados necessários.



