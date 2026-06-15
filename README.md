# InkFlow

InkFlow é um micro-SaaS completo de gestão para estúdios de tatuagem. Permite gerenciar agenda, clientes, finanças e equipe de tatuadores, com painéis distintos para administradores e artistas.

Construído com Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma + PostgreSQL, NextAuth e Recharts.

## Funcionalidades

- **Autenticação** por credenciais (NextAuth + bcrypt) com papéis `admin` e `artist`.
- **Dashboard administrativo**: KPIs (receita, agendamentos, taxa de conclusão, ticket médio), gráfico de receita (6 meses), agendamentos do dia e ranking de tatuadores.
- **Agenda semanal**: visão de calendário (08h–22h) com blocos posicionados, cores por tatuador, filtro por tatuador e criação/edição via painel lateral.
- **Clientes**: lista com busca, ficha do cliente com histórico e notas de saúde.
- **Financeiro**: receitas, despesas, saldo, fluxo de caixa (30 dias) e registro de transações.
- **Tatuadores**: cadastro e gestão de comissões.
- **Painel do artista**: agenda pessoal, clientes e ganhos com comissão calculada.
- **Tema escuro** por padrão (alternável) e layout responsivo com navegação mobile.

## Stack

- Next.js 14 / React 18 / TypeScript
- Tailwind CSS + componentes estilo shadcn/ui (Radix UI)
- Prisma ORM + PostgreSQL
- NextAuth (JWT, Credentials)
- Recharts, date-fns (pt-BR), react-hook-form + zod, sonner

## Pré-requisitos

- Node.js 18+
- PostgreSQL

## Variáveis de ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/inkflow"
DIRECT_URL="postgresql://postgres:password@localhost:5432/inkflow"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

Gere um segredo com: `openssl rand -base64 32`.

## Configuração do banco de dados

```bash
npm install
npx prisma generate      # gera o Prisma Client
npx prisma db push       # cria as tabelas no banco
npm run seed             # popula dados de exemplo (estúdio brasileiro)
```

## Rodando localmente

```bash
npm run dev
```

Acesse http://localhost:3000.

### Credenciais de exemplo (após o seed)

- **Admin**: `admin@inkflow.com` / `Admin@123`
- **Tatuadores**: `joao@inkflow.com`, `ana@inkflow.com`, `pedro@inkflow.com` / `Artist@123`

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — gera o Prisma Client, aplica o schema e compila a aplicação
- `npm run start` — executa a build de produção
- `npm run seed` — popula o banco com dados de exemplo
- `npm run lint` — lint

## Deployment

1. Provisione um PostgreSQL gerenciado (ex.: Supabase, Neon, Railway).
2. Configure as variáveis de ambiente (`DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` com a URL pública).
3. Em plataformas como Vercel, o comando de build (`prisma generate && prisma db push && next build`) já está configurado em `package.json`.
4. Execute `npm run seed` uma vez (opcional) para dados iniciais.

## Estrutura

```
src/
  app/                 # rotas (App Router)
    dashboard/         # painel administrativo
    artist/            # painel do artista
    api/               # rotas de API
    login/             # autenticação
  components/
    ui/                # primitivas de UI (button, card, select, sheet...)
    forms/             # formulários (agendamento, cliente, transação)
    charts/            # gráficos Recharts
    layout/            # sidebar, header, navegação mobile
  lib/                 # auth, prisma, utils
  types/               # tipos TypeScript
prisma/
  schema.prisma        # modelo de dados
  seed.ts              # dados de exemplo
```
