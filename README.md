# Challenge Pyou

Uma aplicação Angular para explorar e gerenciar faixas do Spotify usando a API oficial.

## Funcionalidades

- 🎵 Listagem de faixas por ISRC
- 🔍 Busca de faixas por ISRC
- ▶️ Player integrado com preview das músicas
- 🎧 Integração com Spotify para reprodução completa
- 📱 Interface responsiva e moderna
- 🌗 Design moderno com efeitos de glassmorphism

## Tecnologias Utilizadas

- Angular 17
- TypeScript
- TailwindCSS
- Spotify Web API
- RxJS

## Configuração do Ambiente

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/challenger-pyou.git
cd challenger-pyou
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

- Copie o arquivo `.env.example` para `.env`
- Preencha as credenciais do Spotify:
  - `CLIENT_ID`
  - `CLIENT_SECRET`

## Ambientes Disponíveis

### Desenvolvimento

```bash
npm run start: deve # ou
ng serve
```

Acesse: `http://localhost:4200`

### Produção

```bash
npm run build
# ou
ng build --configuration production

Link direto: https://rafaaquino.github.io/front-end-challenge/
```

Os arquivos serão gerados na pasta `dist/`

## API Spotify

O projeto utiliza a API do Spotify para:

- Buscar faixas por ISRC
- Obter previews de músicas
- Integração com player do Spotify
