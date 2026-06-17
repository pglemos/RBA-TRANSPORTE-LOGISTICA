# RBA Transporte

Sistema operacional para cadastro de motoristas, veiculos, clientes, ordens de frete, anexos, financeiro, relatorios e auditoria.

## Estado Atual

- Persistencia real via Supabase PostgreSQL quando as variaveis de ambiente estao configuradas.
- Fallback local em `rba_database.json` apenas para desenvolvimento fora de serverless.
- Autenticacao real via Supabase Auth. O sistema nao aceita mais troca de perfil por cookie ou payload do cliente.
- Autorizacao por perfil aplicada nas rotas API e reforcada por RLS no Supabase.
- Dashboard, relatorios e financeiro calculam faturamento bruto por `cte_value`; o valor pago ao motorista fica em `freight_value`.
- Anexos usam bucket privado `order-attachments` e URLs assinadas temporarias.

## Perfis

- `Administrador`: acesso total, exclusoes, configuracoes e auditoria.
- `Operacional`: cadastros operacionais e ordens, sem exclusoes administrativas.
- `Financeiro`: pagamentos e campos financeiros autorizados.
- `Consulta/Auditoria`: leitura e auditoria, sem escrita operacional.

Cada usuario precisa existir no Supabase Auth e ter um registro ativo em `public.profiles` com `user_id = auth.users.id`.

## Variaveis De Ambiente

Copie o exemplo e preencha localmente:

```bash
cp .env.example .env
```

Obrigatorias para producao:

```env
APP_URL="https://seu-dominio"
NEXT_PUBLIC_APP_URL="https://seu-dominio"
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
SUPABASE_SERVICE_ROLE_KEY="sua-service-role"
RBA_PDF_SIGNING_SECRET="segredo-longo-aleatorio"
SUPABASE_ATTACHMENTS_BUCKET="order-attachments"
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`. Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas como compatibilidade legada quando a publishable key nao estiver disponivel.

## Banco E Storage

Migrations ficam em `supabase/migrations/`.

Arquivos principais:

- `20260617203457_security_hardening_real_auth.sql`: RLS por perfil, constraints financeiras, funcao `get_auth_role()` e bucket privado.
- `supabase/seed.sql`: dados demonstrativos para ambiente de teste.

Aplicacao em projeto Supabase linkado:

```bash
supabase db push --linked --yes
```

O bucket de anexos deve permanecer privado:

```text
order-attachments public=false fileSizeLimit=4000000
```

## Desenvolvimento

Instale dependencias e rode:

```bash
npm install
npm run dev
```

Build de producao local:

```bash
npm run build
npm run start -- -p 3001
```

## Validacao

Gates recomendados antes de deploy:

```bash
node --test lib/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
npm audit --audit-level=moderate
git diff --check
```

Probes HTTP sem cookie devem bloquear dados reais:

```bash
curl -i http://localhost:3001/api/auth/me
curl -i 'http://localhost:3001/api/orders?page=1&page_size=5'
curl -i -X POST -H 'Content-Type: application/json' -d '{"role":"Administrador"}' http://localhost:3001/api/auth/me
```

Resultados esperados: `401` para sessao ausente, `405` para simulacao de perfil removida e `403` para mutacoes sem origem autorizada.

## Deploy Na Vercel

Configure as mesmas variaveis obrigatorias nos ambientes `production`, `preview` e `development`. Se o CLI responder que nao consegue carregar o projeto em `.vercel/project.json`, faca o relink com a conta/time correto antes de listar ou alterar variaveis.

Com CLI autenticada no time correto:

```bash
vercel link --yes --project rbatransporte --scope <time-correto>
vercel env ls
vercel env add APP_URL production preview development
vercel env add NEXT_PUBLIC_APP_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production preview development
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development
vercel env add RBA_PDF_SIGNING_SECRET production preview development
vercel env add SUPABASE_ATTACHMENTS_BUCKET production preview development
```

Depois:

```bash
vercel --prod
```

## Seguranca Operacional

- Tokens colados em chat, terminal ou log devem ser rotacionados.
- Mantenha RLS habilitado nas tabelas do schema exposto `public`.
- Use `supabase.auth.getUser()` no servidor para validar sessao.
- Reserve `service_role` para operacoes controladas de servidor, como Storage privado e tarefas administrativas.
- Nao publique `.env`; o projeto ignora `.env*` e versiona somente `.env.example`.
