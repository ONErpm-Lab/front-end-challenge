# 🎵 ISRC Spotify App

Uma aplicação Angular moderna para buscar e visualizar informações de faixas musicais usando códigos ISRC (International Standard Recording Code) através da API do Spotify.

## 📺 Demonstração

![Demonstração da Aplicação](./challenge.mp4)

> 🎬 **Vídeo de Demonstração**: Assista ao vídeo acima para ver as principais funcionalidades da aplicação em ação!
> 
> **Funcionalidades demonstradas:**
> - 🔍 Busca por códigos ISRC
> - 🎵 Visualização de informações das faixas
> - 🌐 Interface responsiva
> - 🔄 Carregamento dinâmico de dados

## 🚀 Funcionalidades

- 🔍 **Busca por ISRC**: Pesquise faixas usando códigos ISRC
- 🎨 **Interface Moderna**: Design responsivo e intuitivo
- 🌐 **Internacionalização**: Suporte a múltiplos idiomas
- 🔒 **Autenticação Spotify**: Integração segura com a API do Spotify
- ⚡ **Performance**: Carregamento rápido com lazy loading
- 🧪 **Testes**: Cobertura completa de testes unitários

## 🛠️ Tecnologias

- **Angular 20+** - Framework principal
- **TypeScript** - Linguagem de programação
- **SCSS** - Estilização
- **FontAwesome** - Ícones
- **Jasmine/Karma** - Testes unitários
- **Playwright** - Testes e2e

## 📋 Pré-requisitos

- **Node.js** 20.19.0 ou superior
- **npm** 8.0.0 ou superior
- **Conta Spotify Developer** para obter credenciais da API

## 🔐 Configuração das Credenciais

### ⚠️ **IMPORTANTE: Segurança das Credenciais**

**As credenciais que podem aparecer no histórico de commits deste repositório são fictícias e foram invalidadas por motivos de segurança.** Você **DEVE** criar suas próprias credenciais para usar este projeto.

### Como obter suas credenciais:

1. **Acesse o Spotify Developer Dashboard**:
   - Vá para: https://developer.spotify.com/dashboard
   - Faça login com sua conta Spotify

2. **Crie uma nova aplicação**:
   - Clique em "Create an App"
   - Preencha o nome e descrição
   - Aceite os termos de uso

3. **Obtenha suas credenciais**:
   - Na página da sua aplicação, você encontrará:
     - `Client ID`
     - `Client Secret` (clique em "Show Client Secret")

### Configuração do arquivo .env:

1. **Crie o arquivo `.env`** na raiz do projeto:
   ```bash
   cp .env.example .env  # Se existir um arquivo de exemplo
   # OU crie manualmente
   ```

2. **Configure suas credenciais** no arquivo `.env`:
   ```env
   # Spotify API Credentials
   # Obtenha suas credenciais em: https://developer.spotify.com/dashboard
   SPOTIFY_CLIENT_ID=seu_client_id_aqui
   SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui

   # Spotify API URLs (não altere)
   SPOTIFY_API_URL=https://api.spotify.com/v1
   SPOTIFY_TOKEN_URL=https://accounts.spotify.com/api/token
   ```

3. **Substitua os valores**:
   - `seu_client_id_aqui` → Seu Client ID real
   - `seu_client_secret_aqui` → Seu Client Secret real

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd isrc-spotify-app
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Siga as instruções na seção [Configuração das Credenciais](#-configuração-das-credenciais)

### 4. Execute o projeto
```bash
# Desenvolvimento
npm start
# OU
ng serve

# Produção
npm run build:prod
```

### 5. Acesse a aplicação
Abra seu navegador em: `http://localhost:4200`

## 🌐 Deploy no GitHub Pages

Esta aplicação está configurada para deploy automático no GitHub Pages através de GitHub Actions.

### 🚀 **Aplicação Online:**
- **URL de Produção**: `https://danields9900.github.io/front-end-challenge/`

### ⚙️ **Deploy Automático:**
- ✅ Deploy automático a cada push na branch `main`
- ✅ Build otimizado para produção
- ✅ Configuração de variáveis de ambiente via GitHub Secrets
- ✅ Cache de dependências para builds mais rápidos

### 🔧 **Configuração do Deploy:**

1. **Configure os Secrets no GitHub:**
   - Vá para: `Settings > Secrets and variables > Actions`
   - Adicione os seguintes secrets:
     ```
     SPOTIFY_CLIENT_ID: seu_client_id_aqui
     SPOTIFY_CLIENT_SECRET: seu_client_secret_aqui
     ```

2. **Ative o GitHub Pages:**
   - Vá para: `Settings > Pages`
   - Source: `Deploy from a branch`
   - Branch: `gh-pages`

3. **Primeiro Deploy:**
   - Faça push do código para a branch `main`
   - O GitHub Actions será executado automaticamente
   - Aguarde a conclusão do workflow
   - A aplicação estará disponível em: `https://danields9900.github.io/front-end-challenge/`

### 📋 **Pré-requisitos para Deploy:**
- ✅ Repositório público no GitHub
- ✅ GitHub Actions habilitado
- ✅ Secrets configurados com credenciais válidas do Spotify
- ✅ GitHub Pages ativado

## 🧪 Testes

### Testes Unitários
```bash
# Executar testes
npm test
# OU
ng test

# Testes com cobertura
npm run test:coverage

# Testes em modo CI
npm run test:ci
```

### Testes E2E
```bash
# Executar testes e2e
npm run test:e2e

# Testes e2e com interface
npm run test:e2e:ui

# Testes e2e em modo debug
npm run test:e2e:debug
```

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── core/                 # Serviços e utilitários centrais
│   │   ├── guards/          # Guards de rota
│   │   ├── interceptors/    # Interceptadores HTTP
│   │   ├── services/        # Serviços compartilhados
│   │   └── spotify/         # Serviços específicos do Spotify
│   ├── modules/
│   │   ├── shared/          # Componentes compartilhados
│   │   └── tracks/          # Módulo de faixas musicais
│   └── components/          # Componentes globais
├── assets/
│   └── i18n/               # Arquivos de tradução
├── environments/           # Configurações de ambiente
└── styles/                # Estilos globais
```

## 🌐 Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SPOTIFY_CLIENT_ID` | ID do cliente Spotify | `9ff1dae3c73e499bb67e64f70f75ecdc` |
| `SPOTIFY_CLIENT_SECRET` | Secret do cliente Spotify | `c6a8b93c1eb241f6bd88d4cfa3fdc885` |
| `SPOTIFY_API_URL` | URL base da API Spotify | `https://api.spotify.com/v1` |
| `SPOTIFY_TOKEN_URL` | URL para obter token | `https://accounts.spotify.com/api/token` |

## 🔒 Segurança

- ✅ Arquivo `.env` está no `.gitignore`
- ✅ Credenciais não são commitadas no código
- ✅ Validação de credenciais antes das requisições
- ✅ Interceptadores para tratamento de erros

## 🐛 Solução de Problemas

### Erro: "Cannot find name 'process'"
- Certifique-se de que `@types/node` está instalado
- Verifique se `"node"` está nos tipos do `tsconfig.json`

### Erro: "Invalid client credentials"
- Verifique se suas credenciais no `.env` estão corretas
- Confirme se a aplicação está ativa no Spotify Developer Dashboard

### Erro: "CORS"
- Este é um problema conhecido da API do Spotify no browser
- O projeto usa proxy/interceptadores para contornar isso

## 📄 Scripts Disponíveis

```bash
npm start              # Inicia o servidor de desenvolvimento
npm run build          # Build para produção
npm run build:prod     # Build otimizado para produção
npm test               # Executa testes unitários
npm run test:coverage  # Testes com relatório de cobertura
npm run test:e2e       # Executa testes e2e
npm run setup          # Instala dependências
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se seguiu todos os passos de configuração
2. Confirme se suas credenciais do Spotify estão corretas
3. Consulte a documentação da [API do Spotify](https://developer.spotify.com/documentation/web-api/)
4. Abra uma issue neste repositório

---

**⚠️ Lembrete**: Nunca compartilhe suas credenciais reais do Spotify. Mantenha seu arquivo `.env` seguro e nunca o commite no repositório!