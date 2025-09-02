# ISRC → Spotify App

Aplicação Angular para buscar músicas no Spotify usando códigos ISRC (International Standard Recording Code).

## 🚀 Configuração Inicial

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Credenciais do Spotify
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Configure suas credenciais no arquivo .env
NG_APP_SPOTIFY_CLIENT_ID=seu_client_id_aqui
NG_APP_SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
```

**📋 Como obter as credenciais:**
1. Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Crie um novo app ou use um existente
3. Copie o Client ID e Client Secret

⚠️ **IMPORTANTE:** Nunca commite suas credenciais reais no código! Veja [SECURITY.md](./SECURITY.md) para mais detalhes.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
