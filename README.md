<div align="center">

# 💪 FitSenior

### Plataforma de Atividades Físicas para a Terceira Idade

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://fitsenior.vercel.app)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[🌐 Demo](https://fitsenior.vercel.app) • [📚 Documentação](#-documentação) • [🚀 Deploy](#-deploy)

</div>

---

## 📋 Sobre o Projeto

**FitSenior** é uma plataforma que conecta profissionais de educação física com a terceira idade, facilitando o acesso a atividades físicas adequadas e promovendo qualidade de vida.

### ✨ Funcionalidades

- 🏃‍♀️ **Busca de Aulas**: Encontre aulas de acordo com localização e horário
- 📝 **Cadastro de Alunos**: Sistema completo de registro com verificação de idade
- 👨‍🏫 **Área do Profissional**: Gerenciamento de turmas e alunos
- 💬 **Fórum Comunitário**: Espaço de interação entre alunos
- 📧 **Mensagens Privadas**: Comunicação direta entre usuários
- 💳 **Controle Financeiro**: Gestão de pagamentos e mensalidades
- 📊 **Dashboard**: Acompanhamento de métricas e estatísticas
- 🏥 **Atestado Médico**: Upload obrigatório para maiores de 60 anos

---

## 🛠️ Tecnologias

### Frontend
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-007ACC?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat&logo=tailwind-css)
![Shadcn/ui](https://img.shields.io/badge/Shadcn/ui-Latest-000000?style=flat)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat&logo=express)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat&logo=postgresql)

### Deploy
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?style=flat&logo=vercel)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=flat&logo=render)

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- Python 3.11+ instalado
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)
- Conta no [Render](https://render.com) (para deploy do backend)

### 📦 Instalação

#### Frontend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/fitsenior.git
cd fitsenior

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

**`.env`**
```env
VITE_SUPABASE_URL=sua_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=sua_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

```bash
# Execute o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

#### Backend (FastAPI)

```bash
# Entre na pasta backend
cd backend

# (Opcional) Crie um ambiente virtual
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp ../docker-compose.env.example .env
# ou crie um backend/.env com:
# SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY, ALLOWED_ORIGINS, BACKEND_PORT
```

```bash
# Execute o servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Acesse: `http://localhost:8000/health`

---

## 🗄️ Estrutura do Banco de Dados

Execute o SQL no Supabase SQL Editor:

```sql
-- Execute os scripts na pasta supabase/migrations/
-- ou copie o conteúdo do arquivo de migration principal
```

### Tabelas principais:
- `students` - Cadastro de alunos
- `professionals` - Cadastro de profissionais
- `classes` - Turmas e aulas
- `enrollments` - Inscrições dos alunos
- `demands` - Demandas de atividades
- `forum_messages` - Mensagens do fórum
- `private_messages` - Mensagens privadas
- `payments` - Controle de pagamentos
- `attendance` - Frequência dos alunos

---

## 📁 Estrutura do Projeto

```
fitsenior/
├── 📂 backend/
│   ├── app/
│   │   ├── core/          # Configurações e clientes
│   │   ├── routers/       # Rotas FastAPI
│   │   └── schemas/       # Modelos Pydantic
│   └── requirements.txt
│
├── 📂 src/
│   ├── components/       # Componentes reutilizáveis
│   ├── context/          # Context API (Auth)
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # Supabase client e types
│   ├── lib/              # Utilitários
│   ├── pages/            # Páginas da aplicação
│   └── routes.tsx        # Rotas do React Router
│
├── 📂 supabase/
│   ├── config.toml       # Configuração do Supabase
│   └── migrations/       # SQL migrations
│
└── 📄 package.json
```

---

## 🌐 Deploy

### Frontend (Vercel)

1. Faça push do código para GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe o repositório
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_API_URL` (URL do backend no Render)
5. Deploy!

**URL de Produção:** [fitsenior.vercel.app](https://fitsenior.vercel.app)

### Backend (Render)

1. Acesse [render.com](https://render.com)
2. Crie um novo **Web Service**
3. Conecte seu repositório
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Adicione as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `ALLOWED_ORIGINS=https://fitsenior.vercel.app`
6. Deploy!

**URL da API:** `https://<seu-backend>.onrender.com`

---

## 📚 API Endpoints

### Autenticação
Todas as rotas requerem `Authorization: Bearer <token>` no header.

### Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Health check |
| `GET` | `/api/me` | Dados do usuário logado |
| `GET` | `/api/demands` | Lista demandas |
| `POST` | `/api/demands` | Cria demanda |
| `GET` | `/api/classes` | Lista aulas |
| `POST` | `/api/classes` | Cria aula |
| `GET` | `/api/enrollments` | Lista inscrições |
| `POST` | `/api/enrollments` | Inscreve em aula |
| `GET` | `/api/forum/posts` | Lista posts |
| `POST` | `/api/forum/posts` | Cria post |
| `GET` | `/api/messages/conversations` | Lista conversas |
| `POST` | `/api/messages` | Envia mensagem |

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---




---

<div align="center">

### ⭐ Feito com ❤️ para a terceira idade

[![GitHub stars](https://img.shields.io/github/stars/seu-usuario/fitsenior?style=social)](https://github.com/seu-usuario/fitsenior/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/seu-usuario/fitsenior?style=social)](https://github.com/seu-usuario/fitsenior/network/members)

[⬆ Voltar ao topo](#-fitsenior)

</div>
