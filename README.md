# HRS Linha do Tempo - Full Stack Application

Projeto full-stack com arquitetura moderna usando Express (backend) e React (frontend).

## 📁 Estrutura do Projeto

```
hrsjlinhadotempo/
├── backend/                 # API Express
│   ├── src/
│   │   ├── index.js        # Entrada principal
│   │   ├── routes/         # Definição de rotas
│   │   ├── controllers/    # Lógica das endpoints
│   │   ├── middlewares/    # Middlewares customizados
│   │   └── config/         # Configurações
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principais
│   │   ├── services/       # Chamadas à API
│   │   ├── styles/         # Estilos CSS
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Entrada React
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── .gitignore
│
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn

### 1. Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O backend estará disponível em `http://localhost:3001`

### 2. Configurar Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 📡 Comunicação entre Frontend e Backend

### Backend (Express)
- **Porta:** 3001
- **CORS:** Configurado para aceitar requisições do frontend
- **Exemplo de endpoint:** `GET /api/hello`

### Frontend (React)
- **Porta:** 3000
- **Client HTTP:** Axios
- **Serviço API:** `src/services/api.js`
- **Proxy Vite:** Configurado para redirecionar `/api` para `http://localhost:3001`

## 🔄 Fluxo de Comunicação

1. Frontend faz requisição via Axios
2. Vite redireciona para backend
3. Express processa e retorna JSON
4. React atualiza o UI com a resposta

## 📝 Exemplos de Uso

### Adicionar nova rota no backend

```javascript
// backend/src/routes/api.js
router.get('/dados', getDados);

// backend/src/controllers/novoController.js
export const getDados = (req, res) => {
  res.json({ data: [] });
};
```

### Chamar a API do frontend

```javascript
// frontend/src/App.jsx
import api from './services/api'

const response = await api.get('/dados')
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Express.js** - Framework web
- **CORS** - Cross-origin resource sharing
- **dotenv** - Variáveis de ambiente
- **Nodemon** - Auto-reload em desenvolvimento

### Frontend
- **React** - Biblioteca UI
- **Vite** - Build tool
- **Axios** - Cliente HTTP
- **CSS** - Estilização

## 📚 Próximos Passos

- [ ] Adicionar banco de dados (MongoDB/PostgreSQL)
- [ ] Autenticação (JWT)
- [ ] Validação de dados
- [ ] Testes (Jest, Vitest)
- [ ] Docker para containerização
- [ ] CI/CD pipeline

## 📄 Licença

MIT
