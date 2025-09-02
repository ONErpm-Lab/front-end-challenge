# Guia de Testes - ISRC Spotify App

Este documento descreve como executar e manter os testes para o projeto ISRC Spotify App.

## Visão Geral

O projeto inclui três tipos de testes:

1. **Testes Unitários** - Testam componentes, serviços e pipes individualmente
2. **Testes de Integração** - Testam a interação entre diferentes partes do sistema
3. **Testes E2E** - Testam o comportamento completo da aplicação no navegador

## Configuração

### Pré-requisitos

- Node.js 16+ (recomendado 20+)
- npm ou yarn
- Chrome/Chromium para testes E2E

### Instalação

```bash
npm install
```

## Executando os Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
npm run test

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Executar com cobertura de código
npm run test:coverage

# Executar para CI/CD
npm run test:ci
```

### Testes de Integração

Os testes de integração são executados junto com os testes unitários usando o comando `npm run test`.

### Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface gráfica
npm run test:e2e:ui

# Executar em modo headed (com navegador visível)
npm run test:e2e:headed

# Executar em modo debug
npm run test:e2e:debug
```

### Todos os Testes

```bash
# Executar testes unitários + E2E
npm run test:all
```

## Estrutura dos Testes

### Testes Unitários

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── i18n.service.spec.ts          # Testes do serviço de internacionalização
│   │   │   └── i18n-integration.spec.ts      # Testes de integração do sistema i18n
│   │   ├── pipes/
│   │   │   └── translate.pipe.spec.ts        # Testes do pipe de tradução
│   │   └── components/
│   │       └── language-selector/
│   │           └── language-selector.component.spec.ts  # Testes do seletor de idioma
│   └── ...
└── ...
```

### Testes E2E

```
e2e/
└── app.e2e-spec.ts                           # Testes E2E do sistema de localização
```

## Cobertura de Testes

### Serviços Testados

- **I18nService** - Sistema completo de internacionalização
  - Carregamento de traduções
  - Mudança de idioma
  - Cache de traduções
  - Tratamento de erros
  - Validação de idiomas

### Componentes Testados

- **LanguageSelectorComponent** - Seletor de idioma
  - Estado do dropdown
  - Mudança de idioma
  - Interação com o usuário
  - Integração com o serviço i18n

### Pipes Testados

- **TranslatePipe** - Pipe de tradução
  - Transformação de chaves
  - Interpolação de parâmetros
  - Tratamento de valores nulos

## Configurações

### Karma (Testes Unitários)

- **karma.conf.js** - Configuração do Karma
- **src/test.ts** - Configuração global dos testes
- Cobertura configurada para 80% mínimo
- Suporte ao @angular/localize

### Playwright (Testes E2E)

- **playwright.config.ts** - Configuração do Playwright
- Múltiplos navegadores (Chrome, Firefox, Safari)
- Testes em dispositivos móveis
- Screenshots e vídeos em falhas

## Boas Práticas

### Testes Unitários

1. **Isolamento** - Cada teste deve ser independente
2. **Mocks** - Use mocks para dependências externas
3. **Cobertura** - Mantenha cobertura acima de 80%
4. **Nomenclatura** - Use nomes descritivos para os testes

### Testes de Integração

1. **Realismo** - Teste cenários reais de uso
2. **Dados** - Use dados de teste consistentes
3. **Limpeza** - Limpe o estado entre testes

### Testes E2E

1. **Estabilidade** - Evite testes frágeis
2. **Performance** - Mantenha testes rápidos
3. **Debugging** - Use screenshots e vídeos para debug

## Troubleshooting

### Problemas Comuns

#### Testes Unitários Falhando

```bash
# Limpar cache
npm run test -- --watch=false

# Verificar dependências
npm install

# Executar com mais detalhes
npm run test -- --verbose
```

#### Testes E2E Falhando

```bash
# Instalar navegadores
npx playwright install

# Executar com debug
npm run test:e2e:debug

# Verificar logs
npx playwright show-report
```

#### Problemas de Localização

- Verificar se o @angular/localize está instalado
- Confirmar que os arquivos de tradução estão em `/assets/i18n/`
- Verificar se o main.ts importa o localize

### Logs e Relatórios

- **Cobertura**: Disponível em `coverage/isrc-spotify-app/`
- **Relatórios E2E**: `npx playwright show-report`
- **Logs do Karma**: Console do terminal

## CI/CD

### GitHub Actions

```yaml
- name: Run Unit Tests
  run: npm run test:ci

- name: Run E2E Tests
  run: npm run test:e2e
```

### Configurações Recomendadas

- Execute testes unitários em cada PR
- Execute testes E2E em merges para main
- Mantenha cobertura mínima de 80%
- Falhe o build se os testes falharem

## Manutenção

### Atualizando Testes

1. **Novos Componentes** - Crie testes unitários
2. **Novas Funcionalidades** - Adicione testes de integração
3. **Mudanças de UI** - Atualize testes E2E

### Monitoramento

- Execute testes regularmente
- Monitore cobertura de código
- Revise testes falhando
- Atualize dependências de teste

## Recursos Adicionais

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Testing Framework](https://jasmine.github.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Karma Configuration](https://karma-runner.github.io/latest/config/configuration-file.html)
