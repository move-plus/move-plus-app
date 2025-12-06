## Ambiente Docker FitSenior

Este guia mostra como subir rapidamente o frontend (Vite) e o backend (FastAPI) usando Docker, conectando ambos ao serviço Supabase já existente em produção/staging, com dois usuários de teste criados automaticamente.

### 1. Pré‑requisitos
- Docker Desktop (ou Docker Engine + docker compose v2).
- Chaves do projeto Supabase que você já utiliza hoje (URL, anon key e service role key).

### 2. Configuração das variáveis
1. Copie o arquivo de exemplo e preencha com as credenciais reais:
   ```
   cp docker-compose.env.example docker-compose.env
   ```
2. Edite `docker-compose.env` e atualize:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
   - Se quiser alterar e-mails/senhas dos usuários de teste, ajuste as variáveis `DEFAULT_*`.
   - Opcional: atualize as portas `FRONTEND_PORT`/`BACKEND_PORT`.

#### Como obter as chaves do Supabase:
1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Você encontrará:
   - **Project URL**: use como `SUPABASE_URL` (ex: `https://xxxxx.supabase.co`)
   - **anon public**: use como `SUPABASE_ANON_KEY`
   - **service_role secret**: use como `SUPABASE_SERVICE_KEY` ⚠️ **IMPORTANTE**: Esta é diferente da anon key e tem permissões administrativas

> ⚠️ **Atenção**: O backend continua precisando da `SUPABASE_SERVICE_KEY` (service_role key) para executar chamadas administrativas no Supabase. Sem ela, algumas rotas que usam privilégios elevados podem falhar.

### 3. Subindo o ambiente
Com tudo configurado, rode:
```
docker compose --env-file docker-compose.env up --build
```

O compose faz o seguinte:
- sobe o backend em FastAPI com `uvicorn --reload`, disponível em `http://localhost:${BACKEND_PORT}` (default 8000);
- sobe o frontend em `http://localhost:${FRONTEND_PORT}` (default 5173) apontando para o backend e para o Supabase informado;
- monta o código como volume, então mudanças locais refletem instantaneamente (frontend via Vite, backend via uvicorn).

Para parar tudo:
```
docker compose down
```
Para limpar volumes/cache de dependências:
```
docker compose down -v
```

### 4. Usuários padrão para login
| Perfil        | E-mail sugerido           | Senha sugerida  |
|---------------|---------------------------|-----------------|
| Estudante     | `aluno@fitsenior.com`     | `Senha123!`     |
| Profissional  | `pro@fitsenior.com`       | `Senha123!`     |

Os e-mails/senhas acima são apenas uma sugestão para manter consistência entre ambientes. Crie esses usuários diretamente no Supabase (via Auth > Users ou via scripts próprios) antes de utilizar o ambiente local, garantindo que tenham os papéis/relacionamentos necessários (`user_roles`, `students`, `professionals` etc.).

### 5. Fluxo de desenvolvimento
- **Hot reload**: como os volumes montam o código, salvar arquivos já recarrega o frontend (Vite) e o backend (uvicorn `--reload`). Não é preciso reiniciar o compose.
- **Novas dependências**: após adicionar dependências no `package.json` ou `requirements.txt`, reinicie o serviço correspondente para reinstalar:
  ```
  docker compose restart frontend
  # ou
  docker compose restart backend
  ```
- **Mudanças extensas ou Dockerfile**: se alterar comandos ou versões base, rode novamente com build:
  ```
  docker compose up --build
  ```
- **Inspecionar logs**:
  ```
  docker compose logs -f backend
  docker compose logs -f frontend
  ```

### 6. Variáveis expostas ao frontend
O arquivo `docker-compose.env` já encaminha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL` (`http://backend:8000` dentro da rede do compose)

Se preferir apontar para outro backend (por exemplo, API hospedada), altere `VITE_API_URL` antes de subir o compose.

### 7. Troubleshooting rápido

#### ❌ "Invalid API key" ao acessar o backend
**Causa**: A `SUPABASE_SERVICE_KEY` está incorreta, ausente ou você está usando a anon key por engano.

**Solução**:
1. Verifique se o arquivo `docker-compose.env` existe e está na raiz do projeto
2. Confirme que a variável `SUPABASE_SERVICE_KEY` está preenchida (não pode estar vazia ou com `<sua-service-role-key>`)
3. Certifique-se de estar usando a **service_role secret key**, não a anon key
4. No Supabase Dashboard: Settings → API → copie a chave "service_role" (ela é bem longa, começa com `eyJ...`)
5. Cole no `docker-compose.env` sem aspas ou espaços extras
6. Reinicie o compose: `docker compose --env-file docker-compose.env up --build`

#### ⚠️ Porta em uso
Ajuste `FRONTEND_PORT`/`BACKEND_PORT` no `docker-compose.env` ou pare o processo que está usando a porta.

#### 🌐 Frontend não consegue conectar ao backend
Verifique se `VITE_API_URL` no `docker-compose.env` está como `http://backend:8000` (nome do serviço do Docker, não `localhost`).

Pronto! Com isso, qualquer pessoa do time consegue subir o ambiente local espelhando o Supabase em produção, já com credenciais prontas para testar fluxo de aluno e profissional.

