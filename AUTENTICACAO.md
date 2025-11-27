# 🔐 Guia de Autenticação - Google Sheets API

## ⚠️ PRÉ-REQUISITO IMPORTANTE

Antes de começar, você **PRECISA** ter as credenciais OAuth 2.0 corretas configuradas!

**Consulte:** [`GOOGLE_SETUP.md`](./GOOGLE_SETUP.md) para instruções completas.

### ⚠️ Verificação Crítica:

```bash
cat backend/credentials.json | jq .installed.client_secret
```

**O `client_secret` deve:**
- ✅ NÃO começar com `AIza...` (isso é uma API Key, não é válido)
- ✅ Ser uma string com caracteres aleatórios
- ✅ Corresponder exatamente ao valor no Google Cloud Console

### ✅ Se estiver com `AIza...`:

1. Vá para: https://console.cloud.google.com/
2. Projeto: **"linha-do-tempo-479418"**
3. APIs e Serviços → Credenciais
4. Gere um novo **Client Secret** OAuth 2.0 (não API Key!)
5. Atualize o `credentials.json`

---

## 📋 Configuração Realizada

✅ **Credentials.json** atualizado com:
- `redirect_uri`: `http://localhost:3001/api/auth/callback` (backend)
- Client ID e Client Secret configurados
- Escopo: `https://www.googleapis.com/auth/spreadsheets`

## 🚀 Fluxo de Autenticação

### ✨ Passo 1: Abrir Interface
```
http://localhost:3000
```

### ✨ Passo 2: Clicar em "🔑 Autenticar com Google"
- Frontend chama `GET /api/auth/url`
- Backend retorna URL de autenticação do Google

### ✨ Passo 3: Autorizar no Google
- Você será redirecionado para `accounts.google.com`
- Selecione a conta Google que tem acesso à planilha
- **IMPORTANTE**: A conta deve ser a mesma que tem acesso à planilha!
- Clique em "Permitir"

### ✨ Passo 4: Retorno Automático
- Google redireciona para `http://localhost:3001/api/auth/callback?code=...`
- Backend processa o código e obtém o token
- Token é salvo em `backend/token.json`
- Frontend é redirecionado para `http://localhost:3000?authenticated=true`

### ✨ Passo 5: Pronto! ✅
- Botão "📊 Ler Dados da Planilha" fica habilitado
- Você pode começar a usar a API

## ✅ Após a Autenticação

### Ler dados:
```bash
curl "http://localhost:3001/api/sheets/read?sheetName=Sheet1"
```

### Adicionar dados:
```bash
curl -X POST http://localhost:3001/api/sheets/append \
  -H "Content-Type: application/json" \
  -d '{"sheetName":"Sheet1","values":[["João","25"]]}'
```

## 📝 Notas Importantes

| Item | Detalhes |
|------|----------|
| **Token** | Salvo em `backend/token.json` |
| **.gitignore** | `token.json` já está ignorado |
| **Reutilização** | Token é reutilizado automaticamente |
| **Expiração** | Se expirar, repita a autenticação |
| **Conta** | Deve ser a mesma que tem acesso à planilha |

## 🔄 Resetar Autenticação

Se precisar fazer login com outra conta:

```bash
rm backend/token.json
```

Depois clique no botão "🔑 Autenticar com Google" novamente.

## 🐛 Erros Comuns

| Erro | Solução |
|------|---------|
| **"redirect_uri_mismatch"** | ✅ CORRIGIDO - Agora usa `http://localhost:3001/api/auth/callback` |
| **"Access denied"** | Compartilhe a planilha com o email da sua conta Google |
| **"No access, refresh token..."** | Faça a autenticação (clique no botão) |
| **"SPREADSHEET_ID não configurado"** | Configure no `.env` |

## 🎯 Verificação Rápida

**Teste se está autenticado:**
```bash
curl "http://localhost:3001/api/sheets/read?sheetName=Sheet1" | jq .
```

Se retornar os dados da planilha → ✅ Autenticação funcionando!
Se retornar erro → ❌ Faça a autenticação novamente


