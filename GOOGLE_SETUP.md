# 🔧 Configuração do Google Cloud - OAuth 2.0

## ❌ Erros Possíveis

### Erro 1: `redirect_uri_mismatch`
```
Não é possível fazer login no app porque ele não obedece à política do OAuth 2.0 do Google.
```

### Erro 2: `invalid_client`
```
Erro na autenticação: invalid_client
```

**Causa:** O `client_secret` está incorreto. Você tem uma API Key ao invés de um Client Secret OAuth 2.0.

---

## ✅ Solução: Obter as Credenciais Corretas

### 📍 Passo 1: Acessar o Google Cloud Console

1. Abra: https://console.cloud.google.com/
2. Selecione o projeto: **"linha-do-tempo-479418"**
3. No menu à esquerda, procure por **"APIs e Serviços"**
4. Clique em **"Credenciais"**

### 📍 Passo 2: Encontrar ou Criar a Credencial OAuth 2.0

#### Se você já tem uma credencial:
1. Procure por **"Aplicação instalada"** (Desktop app)
2. Clique no Client ID para editar
3. Vá até **"URIs de redirecionamento autorizados"**

#### Se não tem, crie uma nova:
1. Clique em **"+ Criar credenciais"**
2. Escolha **"ID do cliente OAuth"**
3. Selecione **"Aplicação instalada"**
4. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   http://localhost:3001/api/auth/callback
   ```
5. Clique em **"Criar"**

### 📍 Passo 3: Copiar o Client Secret

1. Na credencial OAuth 2.0, você verá:
   - **Client ID**: `xxxxxxx-xxxxxxxxx.apps.googleusercontent.com`
   - **Client Secret**: Uma string com caracteres aleatórios (NÃO começa com `AIza...`)

2. Copie EXATAMENTE esses valores

### 📍 Passo 4: Atualizar o credentials.json

Edite o arquivo `backend/credentials.json`:

```json
{
  "installed": {
    "client_id": "SEU_CLIENT_ID_AQUI",
    "project_id": "linha-do-tempo-479418",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "SEU_CLIENT_SECRET_AQUI",
    "redirect_uris": [
      "http://localhost:3001/api/auth/callback"
    ]
  }
}
```

**IMPORTANTE:**
- ❌ NÃO use `AIzaSy...` (isso é uma API Key)
- ✅ USE o valor que aparece como **Client Secret** no Google Cloud

### 📍 Passo 5: Validar

Execute:
```bash
cat backend/credentials.json | jq .
```

Verifique se:
- ✅ `client_id` está correto
- ✅ `client_secret` NÃO começa com `AIza`
- ✅ `redirect_uris` contém `http://localhost:3001/api/auth/callback`

---

## 🚀 Pronto!

Agora quando você clicar em "🔑 Autenticar com Google", deverá funcionar perfeitamente!

## 📝 Diferença entre Credenciais

| Tipo | Prefixo | Uso |
|------|---------|-----|
| **API Key** | `AIza...` | ❌ NÃO use para OAuth |
| **Client ID** | `xxx...apps.googleusercontent.com` | ✅ Use com Client Secret |
| **Client Secret** | Caracteres aleatórios | ✅ Use com Client ID |

## 🆘 Se Ainda Não Funcionar

1. Verifique se regenerou as credenciais corretamente
2. Delete `backend/token.json` para fazer login novamente
3. Limpe cookies do navegador
4. Tente novamente

