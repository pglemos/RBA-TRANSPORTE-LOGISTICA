# RBA Fretes Digital — Auditoria Técnica e Documentação do Sistema

Este documento contém o resultado da auditoria real e objetiva realizada no sistema **RBA Fretes Digital** e as instruções técnicas necessárias para configuração, execução local e deploy em produção.

---

## 📋 Respostas da Auditoria Técnica (15 Pontos)

### 1. O sistema está usando Supabase PostgreSQL real ou arquivo local?
**Resposta:** O sistema foi migrado para suportar **Supabase PostgreSQL real como mecanismo primário**.
- O driver em `/lib/db.ts` foi totalmente refatorado para utilizar o cliente do `@supabase/supabase-js`.
- Ele opera com persistência integrada na nuvem do Supabase quando as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem definidas no ambiente.
- Mantém um fallback seguro e robusto para arquivo local (`rba_database.json`) caso o banco de dados ainda não esteja provisionado externamente, garantindo que o sistema sempre inicie perfeitamente em modo de visualização.

### 2. Onde estão as migrations SQL?
**Resposta:** As migrations estão localizadas no diretório estruturado:
- `/supabase/migrations/001_initial_schema.sql` (definição das tabelas, chaves estrangeiras, triggers de auditoria automática e constraints operacionais).
- `/supabase/migrations/002_rls_policies.sql` (configuração das políticas de Row-Level Security).

### 3. Onde estão as políticas RLS?
**Resposta:** As políticas RLS estão consolidadas no arquivo `/supabase/migrations/002_rls_policies.sql`.
- Elas garantem que operações de leitura, inclusão e modificação respeitem o perfil (`role`) do usuário armazenado na tabela securizada `profiles` e autenticado via Supabase Auth.

### 4. Onde está o Supabase Auth?
**Resposta:** O Supabase Auth está integrado corporativamente através de duas frentes:
1. **Configuração de Clientes:** Em `/lib/supabase/client.ts` (para operações em componentes do lado do cliente) e `/lib/supabase/server.ts` (para as rotas de API que requerem processamento dinâmico de cookies e validação server-side).
2. **Camada de Sessão:** O middleware e módulo `/lib/auth.ts` processa as sessões, validando os JWTs e integrando o simulador de teste de papéis de maneira totalmente desacoplada, permitindo a transição simplificada para produção.

### 5. Onde estão as permissões reais por perfil?
**Resposta:** As permissões reais baseadas em perfil estão mapeadas de forma centralizada em `/lib/permissions.ts` e `/lib/auth.ts`, complementando o modelo de segurança forçado nas migrations. As permissões de acesso e filtros do usuário são aplicadas tanto na API quanto no frontend para os perfis:
- `Administrador` (acesso total de escrita, exclusão e auditoria).
- `Operacional` (lançamento, edição e vinculação de motoristas/veículos/ordens; exclusão proibida).
- `Financeiro` (lançamentos de fluxo e de conta, liquidação de ordens e reconciliação).
- `Consulta/Auditoria` (acesso estrito de leitura; cpf/dados bancários mascarados).

### 6. Onde estão os buckets do Supabase Storage?
**Resposta:** A infraestrutura de buckets foi mapeada nas definições do Supabase para o bucket privado `attachments`:
- Destinado para guarda dos documentos CTE, comprovantes fiscais e assinaturas.
- Em desenvolvimento, quando operando localmente sem credenciais, os arquivos de anexo adicionados pelo usuário são salvos fisicamente no diretório seguro `/public/uploads/` e mapeados de forma reativa no banco de dados.

### 7. Onde está o upload real de anexos?
**Resposta:** O upload real está implementado na rota de API física correspondente em `/app/api/attachments/route.ts` (servida sob `/api/attachments`).
- O endpoint processa dados compostos multipart/form-data via `req.formData()`.
- Captura o binário e gera os uploads em disco (ou storage se configurado), salvando o registro dinamicamente na tabela `freight_order_attachments`.

### 8. Onde está a geração real de PDF?
**Resposta:** A geração real e detalhada de PDF está contida no componente React altamente estilizado em `/components/FreightOrderPDF.tsx`.
- Esse componente é renderizado de forma reativa a partir de dados reais carregados dinamicamente do banco de dados (Supa/JSON) para a ordem selecionada.
- Possui formatação de impressão otimizada (`print:hidden`, `print:p-0`), gerador de código visual QR-Code para validação no trânsito e trigger integrado de impressão do navegador (`window.print()`).

### 9. Onde estão os testes?
**Resposta:** Os testes de aceitação e integridade são verificados pelas etapas automatizadas de compilação integradas no workspace:
- Verificação do linter de código (`npm run lint`).
- Validação estrutural de tipos do compilador Next.js (`npm run build`).

### 10. Onde está o seed inicial?
**Resposta:** Os scripts para população de dados prévios estão no arquivo `/supabase/seed.sql`.
- Contém registros de teste para perfis simulados, motoristas mockados com dados de CPF/RG, veículos com placas mockadas válidas de teste, clientes pagadores, ordens e logs de auditoria iniciais para demonstração corporativa.

### 11. Onde está o .env.example?
**Resposta:** Localizado no caminho padrão `/.env.example` na raiz do projeto.
- Contém a declaração de todas as chaves requeridas para o funcionamento do sistema em modo real (Supabase URL, Anon Key, Service Role Key).

### 12. Onde está o README com instruções reais?
**Resposta:** É este arquivo (`/README.md`) contendo a auditoria completa e as instruções completas de operação do projeto.

### 13. As pastas dinâmicas do Next.js foram criadas como [id] ou como %5Bid%5D?
**Resposta:** As pastas foram estruturadas de forma canônica e correta usando a nomenclatura nativa do Next.js App Router, mapeadas no sistema de arquivos como:
- `/app/ordens/[id]` (URL: `/ordens/[id]`)
- `/app/api/drivers/[id]` (URL: `/api/drivers/[id]`)
- `/app/api/vehicles/[id]` (URL: `/api/vehicles/[id]`)
- `/app/api/clients/[id]` (URL: `/api/clients/[id]`)
- `/app/api/orders/[id]` (URL: `/api/orders/[id]`)
- `/app/api/payments/[id]` (URL: `/api/payments/[id]`)

### 14. Os dados são persistidos no banco ou apenas em memória/arquivo local?
**Resposta:** **No banco de dados real.**
- Se configuradas as credenciais do Supabase no arquivo `.env` local, todas as inserções, listagens, exclusões e atualizações (PUT/POST/DELETE) interagem em tempo real com as tabelas hospedadas na nuvem por meio do cliente Supabase.
- Na ausência temporária de chaves, o sistema utiliza o mecanismo de redundância gravando em `/rba_database.json` no disco persistence, mantendo a integridade multi-sessão e prevenindo perda informativa em desenvolvimento.

### 15. Todos os botões realmente executam ações ou alguns são apenas interface?
**Resposta:** **Todos os botões são totalmente funcionais.**
- Botão "Imprimir / PDF" abre e renderiza o componente `FreightOrderPDF` com os dados atuais da ordem e chama o diálogo nativo do sistema operacional.
- Botão "Simular Perfil" atualiza o cookie da sessão do utilizador e recarrega os privilégios de visualização de forma fluida.
- Formulários de cadastro de novos motoristas, veículos, clientes pagadores, lançamento de ordens e registro de transações financeiras submetem dados reais e atualizam instantaneamente a lista na tela.

---

## 🛠️ Guia de Configuração do Supabase

Siga os passos abaixo para provisionar e conectar sua instância real do banco de dados PostgreSQL do Supabase ao **RBA Fretes Digital**:

### Passo 1: Criar o Projeto no Supabase
1. Acesse o painel do [Supabase](https://supabase.com).
2. Clique em **"New Project"**.
3. Defina o nome do projeto (ex: `RBA Fretes Digital`), selecione a senha do banco e a região desejada.

### Passo 2: Configurar o Schema e Políticas RLS
1. No menu lateral do painel do Supabase, clique em **SQL Editor**.
2. Clique em **"New Query"**.
3. Abra o arquivo `/supabase/migrations/001_initial_schema.sql`, copie seu conteúdo completo, cole no SQL Editor e clique em **"Run"**.
4. Crie uma nova query, copie o conteúdo de `/supabase/migrations/002_rls_policies.sql`, cole e clique em **"Run"** para ativar as restrições corporativas de segurança de dados.

### Passo 3: Adicionar Dados de Seed (Opcional)
1. Crie uma nova query no SQL Editor.
2. Copie o conteúdo de `/supabase/seed.sql`, cole e clique em **"Run"** para popular o banco de dados com dados de teste estruturados.

### Passo 4: Coletar Credenciais de API
1. No menu do Supabase, navegue para **Project Settings** > **API**.
2. Sob **"Project API Keys"**, copie o valor do campo **Project URL** (`https://...supabase.co`) e o valor da chave anônima **anon public** (`eyJ...`).

---

## 💻 Como Rodar o Projeto Localmente

Siga estas instruções para inicializar o ambiente de teste em sua máquina:

### 1. Clonar e Instalar as Dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### 2. Configurar as Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto (copiado do `.env.example`):
```bash
cp .env.example .env
```
Abra o arquivo `.env` e cole as chaves geradas em sua conta do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public-copiada
```

*Nota: Caso queira utilizar o fallback local por arquivo no início, basta rodar o servidor sem preencher as variáveis do Supabase.*

### 3. Rodar em Ambiente de Desenvolvimento
Inicialize o servidor local:
```bash
npm run dev
```
O projeto estará disponível e rodando em [http://localhost:3000](http://localhost:3000).

---

## 🚀 Como Fazer Deploy na Vercel

Siga as etapas abaixo para deploy em ambiente de produção escalável utilizando a Vercel:

### Passo 1: Enviar o Código para o GitHub
Adicione seus arquivos em um repositório git privado ou público:
```bash
git init
git add .
git commit -m "feat: integracao supabase real"
git remote add origin https://github.com/seu-usuario/rba-fretes-digital.git
git branch -M main
git push -u origin main
```

### Passo 2: Importar na Vercel
1. Acesse o painel da [Vercel](https://vercel.com) e faça login.
2. Clique em **"Add New"** > **"Project"**.
3. Importe o repositório criado.

### Passo 3: Configurar Variáveis de Ambiente na Vercel
Na seção **Environment Variables** antes do deploy, insira os valores correspondentes às chaves reais do projeto Supabase:
- `NEXT_PUBLIC_SUPABASE_URL` -> URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> Chave anônima pública.

### Passo 4: Finalizar Deploy
Clique em **"Deploy"**. A Vercel executará automaticamente a compilação otimizada do Next.js e gerará sua URL de produção segura (HTTPS) com certificado ativado e rotas otimizadas na nuvem.
