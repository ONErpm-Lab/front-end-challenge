# Guia de Segurança - ISRC Spotify App

## 🔐 Configuração de Credenciais

### Desenvolvimento Local

1. **Copie o arquivo de exemplo:**
```bash
cp env.example .env
```

2. **Configure suas credenciais:**
```bash
# .env
NG_APP_SPOTIFY_CLIENT_ID=seu_client_id_aqui
NG_APP_SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
```

3. **Obtenha suas credenciais:**
   - Acesse [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Crie um novo app ou use um existente
   - Copie o Client ID e Client Secret

### Produção

#### Vercel/Netlify
```bash
# Adicione as variáveis de ambiente no painel de controle:
NG_APP_SPOTIFY_CLIENT_ID=your_production_client_id
NG_APP_SPOTIFY_CLIENT_SECRET=your_production_client_secret
```

#### Heroku
```bash
heroku config:set NG_APP_SPOTIFY_CLIENT_ID=your_client_id
heroku config:set NG_APP_SPOTIFY_CLIENT_SECRET=your_client_secret
```

#### Docker
```bash
docker run -e NG_APP_SPOTIFY_CLIENT_ID=your_id -e NG_APP_SPOTIFY_CLIENT_SECRET=your_secret your-app
```

## 🛡️ Melhores Práticas

### ✅ Faça
- Use variáveis de ambiente para todas as credenciais
- Mantenha o arquivo `.env` no `.gitignore`
- Use credenciais diferentes para desenvolvimento e produção
- Rotacione suas credenciais regularmente
- Monitore o uso das suas credenciais no Spotify Dashboard

### ❌ Não Faça
- Nunca commite credenciais no código
- Não compartilhe suas credenciais em chats/emails
- Não use credenciais de produção em desenvolvimento
- Não exponha credenciais em logs ou error messages

## 🔧 Configuração do Projeto

### Arquivo de Ambiente (Desenvolvimento)
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  SPOTIFY_CLIENT_ID: process.env['NG_APP_SPOTIFY_CLIENT_ID'] || '',
  SPOTIFY_CLIENT_SECRET: process.env['NG_APP_SPOTIFY_CLIENT_SECRET'] || '',
  // ... outras configurações
};
```

### Arquivo de Ambiente (Produção)
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  SPOTIFY_CLIENT_ID: process.env['NG_APP_SPOTIFY_CLIENT_ID'] || '',
  SPOTIFY_CLIENT_SECRET: process.env['NG_APP_SPOTIFY_CLIENT_SECRET'] || '',
  // ... outras configurações
};
```

## 📋 Checklist de Segurança

- [ ] Credenciais removidas do código
- [ ] Arquivo `.env` adicionado ao `.gitignore`
- [ ] Variáveis de ambiente configuradas no ambiente de produção
- [ ] Credenciais diferentes para dev/prod
- [ ] Documentação de segurança criada
- [ ] Equipe orientada sobre as práticas

## 🚨 Em Caso de Exposição de Credenciais

1. **Imediatamente:**
   - Revogue as credenciais no Spotify Dashboard
   - Gere novas credenciais
   - Atualize as variáveis de ambiente

2. **Limpe o histórico do Git (se necessário):**
```bash
# CUIDADO: Isso reescreve o histórico
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/environments/environment.ts' \
  --prune-empty --tag-name-filter cat -- --all
```

3. **Notifique a equipe e monitore o uso**

## 📞 Contato

Em caso de dúvidas sobre segurança, entre em contato com a equipe de desenvolvimento.
