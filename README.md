# Front-end Challenge - Spotify Missing Tracks

Este projeto é uma aplicação Angular que busca músicas ausentes no Spotify usando ISRC (International Standard Recording Code). A arquitetura segue os princípios do Domain-Driven Design (DDD) para organizar o código de forma clara e escalável.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── app/
│   ├── core/                           # 🎯 Core Domain
│   │   ├── components/                 # Componentes 
│   │   │   └── layout/
│   │   ├── utils/                      # Utilitários globais
│   │   │   └── duration.ts
│   │   └── guards/                     # Guards de rota
│   │
│   ├── domains/                        # 🏢 Domínios de Negócio
│   │   ├── spotify/                    # Domínio Spotify
│   │   │   ├── services/
│   │   │   │   └── spotify.service.ts  # Serviço de API Spotify
│   │   │   └── types/
│   │   │       └── spotify.types.ts    # Tipos do Spotify
│   │   │
│   │   └── tracks/                     # Domínio de Músicas
│   │       ├── components/             # Componentes do domínio
│   │       │   └── missing-track-card/
│   │       ├── mappers/                # Mapeadores de dados
│   │       │   └── missing-track.mapper.ts
│   │       ├── pages/                  # Páginas do domínio
│   │       │   └── missing-tracks/
│   │       ├── routes/                 # Rotas do domínio
│   │       │   └── tracks.routes.ts
│   │       ├── services/               # Serviços do domínio
│   │       │   └── missing-tracks.service.ts
│   │       └── types/                  # Tipos do domínio
│   │           └── tracks.types.ts
│   │
│   ├── shared/                         # 🔄 Shared
│   │   ├── components/                 # Componentes compartilhados
│   │   ├── directives/                 # Diretivas compartilhadas
│   │   └── pipes/                      # Pipes compartilhados
│   │
│   ├── app.component.ts                # Componente raiz
│   ├── app.config.ts                   # Configuração da aplicação
│   ├── app.routes.ts                   # Rotas principais
│   └── main.ts                         # Ponto de entrada
│
├── assets/                             # 📁 Recursos estáticos
├── environments/                       # 🌍 Configurações de ambiente
└── styles.scss                         # Estilos globais
```

## 📋 Estrutura Detalhada por Camada

### 🎯 Core Domain
**Responsabilidade**: Funcionalidades essenciais e compartilhadas da aplicação

- **Components**: Componentes base reutilizáveis (LoadingSpinner, etc.)
- **Utils**: Funções utilitárias globais (formatação de duração, etc.)
- **Guards**: Proteção de rotas e autenticação

### 🏢 Domain Layer
**Responsabilidade**: Lógica de negócio específica de cada domínio

#### 🎵 Tracks Domain
- **Services**: `MissingTracksService` - Gerencia busca de músicas ausentes
- **Mappers**: `MissingTrackMapper` - Converte dados da API para o modelo da aplicação
- **Types**: Interfaces e tipos específicos do domínio de músicas
- **Components**: Componentes específicos do domínio (MissingTrackCard)
- **Pages**: Páginas do domínio (MissingTracksPage)
- **Routes**: Configuração de rotas do domínio

#### 🎧 Spotify Domain
- **Services**: `SpotifyService` - Integração com API do Spotify
- **Types**: Interfaces e tipos da API do Spotify

### 🔄 Shared
**Responsabilidade**: Código compartilhado entre múltiplos domínios

- **Components**: Componentes reutilizáveis entre domínios
- **Directives**: Diretivas customizadas
- **Pipes**: Transformadores de dados

## 🚀 Benefícios da Arquitetura DDD

### ✅ **Separação de Responsabilidades**
- Cada domínio tem sua própria lógica de negócio
- Fácil manutenção e evolução independente

### ✅ **Escalabilidade**
- Novos domínios podem ser adicionados sem afetar os existentes
- Estrutura clara para crescimento do projeto

### ✅ **Testabilidade**
- Cada camada pode ser testada independentemente
- Mocks e stubs bem definidos

### ✅ **Reutilização**
- Componentes e serviços podem ser reutilizados entre domínios
- Utilitários centralizados no Core

### ✅ **Manutenibilidade**
- Código organizado e fácil de navegar
- Mudanças isoladas por domínio

## 🔧 Tecnologias Utilizadas

- **Angular 17+** - Framework principal
- **RxJS** - Programação reativa
- **Luxon** - Manipulação de datas
- **Angular Signals** - Estado reativo
- **Jasmine/Karma** - Testes unitários

## 📦 Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm start

# Executar testes
npm test

# Build para produção
npm run build
```

## 📝 Convenções de Nomenclatura

- **Domínios**: PascalCase (ex: `Tracks`, `Spotify`)
- **Serviços**: PascalCase + Service (ex: `MissingTracksService`)
- **Mappers**: camelCase + Mapper (ex: `missingTrackMapper`)
- **Tipos**: PascalCase com prefixo I (ex: `IMissingTrackCardProps`)
- **Componentes**: PascalCase (ex: `MissingTrackCard`)
