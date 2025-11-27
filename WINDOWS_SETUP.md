# 🪟 Guia de Setup no Windows

## ✅ Compatibilidade

O projeto agora é **100% compatível com Windows**!

### Melhorias Realizadas:

1. **Token Path**: Usa `path.join()` que funciona em qualquer OS
2. **Diretórios**: Cria automaticamente o diretório se não existir
3. **Permissões**: Trata erros de permissão com graceful fallback
4. **Logs**: Melhor feedback do que está acontecendo

## 🚀 Setup no Windows

### 1️⃣ Instalar Node.js
- Baixe em: https://nodejs.org/ (versão LTS)
- Execute o instalador
- Reinicie o computador

### 2️⃣ Clonar o Repositório
```powershell
git clone <seu-repo>
cd hrsjlinhadotempo
```

### 3️⃣ Instalar Dependências

**Backend:**
```powershell
cd backend
npm install
```

**Frontend:**
```powershell
cd ../frontend
npm install
```

### 4️⃣ Configurar Variáveis de Ambiente

Na pasta `backend`, crie/edite o arquivo `.env`:
```properties
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SPREADSHEET_ID=seu_id_aqui
```

### 5️⃣ Copiar Credenciais

Copie o arquivo `credentials.json` para a pasta `backend`:
```
backend/
  ├── credentials.json
  ├── .env
  └── src/
```

### 6️⃣ Iniciar o Projeto

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### 7️⃣ Abrir no Navegador
```
http://localhost:3000
```

## 🔧 Troubleshooting Windows

| Problema | Solução |
|----------|---------|
| `npm: command not found` | Instale Node.js novamente e reinicie |
| Porta 3001 em uso | `netstat -ano \| findstr :3001` depois `taskkill /PID <PID> /F` |
| Permissão negada ao salvar token | Rode o PowerShell como **Administrador** |
| Arquivo credentials.json não encontrado | Verifique se está em `backend/credentials.json` (não `backend\credentials.json`) |

## 📝 Notas Importantes

✅ O código usa `path.join()` - funciona em Windows, Mac e Linux
✅ O token é salvo automaticamente em `backend/token.json`
✅ Se houver erro ao salvar, o app continua funcionando (token fica em memória)

## 🎯 Tudo Pronto!

Seu colega pode seguir as instruções em [`AUTENTICACAO.md`](./AUTENTICACAO.md) após fazer o setup.
