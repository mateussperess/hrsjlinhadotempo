# 🔑 Como Obter o Client Secret Correto

## Seu Client ID:
```
480220797190-u7q55ab1tcdjkrkd5cpp2c3f4b7tdgpe.apps.googleusercontent.com
```

## ✅ Passo a Passo para Obter o Client Secret

### 1️⃣ Abra o Google Cloud Console
- URL: https://console.cloud.google.com/
- Projeto: **"linha-do-tempo-479418"**

### 2️⃣ Navegue para Credenciais
- Menu lateral esquerdo → "APIs e Serviços"
- Clique em **"Credenciais"**

### 3️⃣ Encontre Sua Credencial
- Procure pelo seu Client ID: `480220797190-u7q55ab1tcdjkrkd5cpp2c3f4b7tdgpe`
- Deve estar listado em **"Aplicação instalada"** ou **"Clientes OAuth 2.0"**
- Clique no Client ID para editar

### 4️⃣ Copie o Client Secret
Na tela de edição, você verá:
```
Client ID: 480220797190-u7q55ab1tcdjkrkd5cpp2c3f4b7tdgpe.apps.googleusercontent.com
Client Secret: [AQUI APARECE O SECRET]
```

**Copie EXATAMENTE** o valor do Client Secret (não o Client ID!)

### 5️⃣ Atualize o credentials.json
Edite o arquivo `backend/credentials.json`:

```json
{
  "installed": {
    "client_id": "480220797190-u7q55ab1tcdjkrkd5cpp2c3f4b7tdgpe.apps.googleusercontent.com",
    "project_id": "linha-do-tempo-479418",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "COLE_O_CLIENT_SECRET_AQUI",
    "redirect_uris": [
      "http://localhost:3001/api/auth/callback"
    ]
  }
}
```

### 6️⃣ Verifique se o Secret está correto
```bash
cat backend/credentials.json | jq .installed.client_secret
```

**Deve retornar algo como:**
```
"abc123def456ghi789jkl012mno345pqr"
```

**NÃO deve retornar:**
```
"AIzaSyDRso3tdiIp3tXviJDVwHmMqN5dfIsJLs0"  ← Isso é uma API Key, não é válido!
```

## ⚠️ Importante

Se o valor que você colou começa com `AIza`:
- ❌ **NÃO é o Client Secret**
- ✅ **Procure novamente** na tela de Credenciais, na seção de "Clientes OAuth 2.0"

## 🚀 Próximas Etapas

1. Atualize o `credentials.json` com o Client Secret correto
2. Delete o token antigo:
   ```bash
   rm backend/token.json
   ```
3. Reinicie o backend:
   ```bash
   cd backend && npm start
   ```
4. Tente autenticar novamente em `http://localhost:3000`
