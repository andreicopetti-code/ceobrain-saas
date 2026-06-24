# CEO Brain SaaS

CRM com funil de vendas inteligente e consulta CNPJ integrada.

**Stack:** Next.js 14 · TypeScript · Supabase · Stripe · Tailwind CSS  
**Deploy:** Vercel · ceobrain.com.br

---

## Setup Local

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencha os valores no .env.local
```

### 3. Configurar Supabase

No painel do Supabase (projeto ceobrain-saas), vá em **SQL Editor** e execute o arquivo:

```
supabase/schema.sql
```

### 4. Rodar localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── cadastro/page.tsx
│   ├── auth/
│   │   ├── callback/route.ts
│   │   └── signout/route.ts
│   ├── api/
│   │   ├── organizations/route.ts
│   │   ├── opportunities/route.ts    (próxima sprint)
│   │   └── webhooks/stripe/route.ts  (próxima sprint)
│   ├── dashboard/
│   │   ├── page.tsx                  (Kanban — próxima sprint)
│   │   ├── cnpj/page.tsx             (próxima sprint)
│   │   ├── relatorios/page.tsx       (próxima sprint)
│   │   └── configuracoes/page.tsx    (próxima sprint)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── supabase/
│       ├── client.ts   (browser)
│       └── server.ts   (server + admin)
├── types/
│   └── database.ts     (tipos gerados do Supabase)
└── middleware.ts        (proteção de rotas)
```

---

## Deploy

O deploy é automático via Vercel. Qualquer push na branch `main` dispara o pipeline.

Configure as variáveis de ambiente no painel do Vercel em:  
**Settings → Environment Variables**

---

## Banco de Dados

Dois projetos Supabase separados:

| Projeto | Finalidade |
|---------|-----------|
| `ceobrain-saas` | Dados dos clientes (orgs, users, funis, oportunidades) |
| `gzsnxnjmvovqyzjslblh` | Base de empresas/CNPJs (somente leitura) |
