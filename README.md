# Sistema de Fichas VtM V5

Uma aplicação web para gerenciar fichas de personagem do jogo Vampiro: A Mascarada V5, com sincronização em tempo real via banco de dados Supabase.

## Stack Técnico

- **Frontend**: HTML/CSS/JavaScript (sem framework)
- **Backend**: Netlify Functions (Node.js)
- **Database**: Supabase (Postgres)
- **Deploy**: Netlify + Supabase

## Configuração Passo a Passo

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto:
   - Click em "New Project"
   - Escolha uma organização (ou crie uma)
   - Nome do projeto: `rpg-fichas` (ou outro à sua escolha)
   - Escolha a região mais próxima (ex: `South America - São Paulo`)
   - Configure uma senha forte para o usuário `postgres`
   - Click em "Create new project" e aguarde (leva alguns minutos)

### 2. Criar Tabela no Supabase

1. No painel Supabase, vá para a aba **SQL Editor**
2. Crie uma nova query
3. Cole o conteúdo do arquivo `migrations/001_create_characters.sql`:
   ```sql
   -- copie todo o conteúdo de migrations/001_create_characters.sql aqui
   ```
4. Execute a query (botão "RUN" ou Ctrl+Enter)
5. Verifique se a tabela foi criada indo para **Table Editor** e procurando por `characters`

### 3. Copiar Connection String

1. No Supabase, vá para **Settings** > **Database**
2. Procure por **Connection String** (seção "Connection pooling")
3. Selecione a aba **URI** (não "Connection string")
4. Copie a string completa (substitua `[YOUR-PASSWORD]` pela senha que você configurou)

Exemplo:
```
postgresql://postgres:sua_senha_aqui@db.supabase.co:5432/postgres?schema=public
```

### 4. Configurar Variáveis de Ambiente Localmente

1. Na raiz do projeto, crie um arquivo `.env`:
   ```bash
   cp .env.example .env
   ```
2. Abra `.env` e preencha:
   ```
   DATABASE_URL=postgresql://postgres:sua_senha_aqui@db.supabase.co:5432/postgres?schema=public
   ```

### 5. Instalar Dependências e Testar Localmente

```powershell
cd "c:\Users\felipe.hondei\OneDrive - LAPONIA SUDESTE LTDA\Área de Trabalho\Pessoal\RPG"
npm install
npm run dev
```

Acesse `http://localhost:8888` no navegador.

Teste salvar uma ficha — a função Netlify deve gravar no Supabase.

### 6. Deploy no Netlify

#### Opção A: Git (Recomendado)

1. Inicialize Git no projeto:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit: RPG fichas system"
   ```

2. Crie um repositório no GitHub (ou GitLab/Bitbucket)

3. Envie o código:
   ```powershell
   git remote add origin https://github.com/seu_usuario/seu_repo.git
   git branch -M main
   git push -u origin main
   ```

4. No [Netlify](https://netlify.com), clique em "New site from Git"
   - Conecte sua conta GitHub
   - Selecione o repositório
   - Deixe as configurações padrão (Netlify detecta automaticamente `netlify` folder)
   - Click em "Deploy site"

#### Opção B: Deploy Manual

1. Instale Netlify CLI:
   ```powershell
   npm install -g netlify-cli
   ```

2. Autentique-se:
   ```powershell
   netlify login
   ```

3. Deploy:
   ```powershell
   netlify deploy --prod
   ```

### 7. Configurar DATABASE_URL no Netlify

1. No painel Netlify, acesse **Site settings** > **Build & deploy** > **Environment**
2. Clique em "Edit variables"
3. Adicione:
   - **Key**: `DATABASE_URL`
   - **Value**: (cole sua connection string do Supabase)
4. Salve e faça novo deploy

### 8. Testar em Produção

Acesse sua URL de produção (ex: `seu-site.netlify.app`) e teste salvar/carregar fichas.

## Estrutura do Projeto

```
├── index.html                     # UI principal (5 fichas + visão geral)
├── script.js                      # Lógica frontend (carga/save de fichas)
├── styles.css                     # Estilos
├── package.json                   # Dependências (pg, netlify-cli)
├── .env.example                   # Template de variáveis
├── migrations/
│   └── 001_create_characters.sql  # Schema do banco (RLS + trigger)
├── netlify/
│   └── functions/
│       └── characters.js          # API serverless (GET/POST/PUT)
└── README.md                      # Este arquivo
```

## Como Funciona

1. **Frontend** (`script.js`):
   - Carrega fichas via `GET /.netlify/functions/characters`
   - Salva alterações via `POST /.netlify/functions/characters`
   - Usa `localStorage` como fallback se a API falhar

2. **Backend** (`netlify/functions/characters.js`):
   - Conecta-se ao Supabase usando a connection string
   - Suporta GET (listar/por ID) e POST/PUT (inserir/atualizar)
   - Usa `ON CONFLICT` para upsert automático

3. **Database** (Supabase):
   - Tabela `characters` com colunas: `id`, `char_number` (1-5), `data` (JSONB), timestamps
   - RLS habilitado (política pública para anônimos)
   - Trigger automático de `updated_at`

## Troubleshooting

### Erro: "FATAL: password authentication failed"
- Verifique se a senha do Supabase está correta em `.env`
- Confirme que copiou a connection string da aba **URI** (não "Connection string")

### Erro: "relation 'characters' does not exist"
- A migração SQL não foi executada
- Vá para **SQL Editor** no Supabase e execute o conteúdo de `migrations/001_create_characters.sql`

### Supabase não salva dados, mas `localStorage` funciona
- Verifique se `DATABASE_URL` foi adicionado como variável de ambiente no Netlify
- Confirme que a tabela foi criada (SQL Editor > Table Editor)

### Conexão recusada localmente
- Certifique-se de que `.env` está preenchido com a connection string correta
- Tente `npm run dev` novamente

## Dicas de Segurança

- **Nunca** commite `.env` (já está em `.gitignore`)
- Use a política de RLS do Supabase para restringir acesso (atual: permite anônimos)
- Considere adicionar autenticação com Supabase Auth se desejar múltiplos usuários

## Próximas Melhorias

- [ ] Autenticação de usuários (Supabase Auth)
- [ ] Histórico de versões das fichas
- [ ] Backup automático
- [ ] Temas customizáveis
- [ ] Export/Import de fichas (PDF)

## Suporte

Para dúvidas sobre Supabase: [docs.supabase.com](https://docs.supabase.com)
Para dúvidas sobre Netlify: [docs.netlify.com](https://docs.netlify.com)
