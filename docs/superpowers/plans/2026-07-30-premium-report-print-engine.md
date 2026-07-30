# Motor Premium de Relatórios para Diretoria - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a impressão contínua por um motor paginado A4 que reproduza a apresentação premium aprovada e permaneça dinâmico para todos os filtros e modelos.

**Architecture:** Um planejador puro define páginas e paginação. Componentes React isolados renderizam páginas executivas, temáticas e apêndices. CSS fixa cada página em 297 x 210 mm e o navegador apenas exporta as páginas já compostas.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.8, CSS de impressão, SVG inline, node:test.

## Global Constraints

- Valores financeiros por ordem devem ser reproduzidos da API, sem segundo cálculo financeiro.
- O PDF premium de 16 páginas é a referência visual obrigatória.
- Cada página deve medir A4 horizontal e possuir quebra explícita.
- Apêndices devem usar no máximo 20 registros por página.
- CSV e Excel existentes devem continuar funcionando.
- A tela responsiva existente não pode regredir.

---

### Task 1: Planejamento determinístico de páginas

**Files:**
- Create: `tests/reportingPrintLayout.test.ts`
- Create: `lib/reporting/printLayout.ts`

**Interfaces:**
- Produces: `buildPrintPagePlan(kind, orderCount, includeDetails)` e `chunkForPrint(items, pageSize)`.

- [ ] Escrever testes que esperam 16 páginas para executivo com 119 ordens e 15 para 85.
- [ ] Executar testes e confirmar falha por módulo ausente.
- [ ] Implementar sequência de páginas e paginação mínima.
- [ ] Executar testes e confirmar aprovação.

### Task 2: Primitivos visuais premium

**Files:**
- Create: `components/reports/print/PrintPrimitives.tsx`
- Modify: `app/relatorios/reporting.css`

**Interfaces:**
- Produces: `PrintPage`, `PageHeader`, `PageFooter`, `MetricCard`, `HorizontalBars`, `TrendChart`, `ComparisonGrid`, `InsightList`, `RankingTable`.

- [ ] Criar teste estrutural que exige classes de página física e quebra explícita.
- [ ] Confirmar falha com CSS atual.
- [ ] Implementar primitivas e novo contrato CSS A4.
- [ ] Confirmar teste estrutural e build.

### Task 3: Dez páginas do relatório executivo

**Files:**
- Create: `components/reports/print/ExecutivePrintPages.tsx`

**Interfaces:**
- Consumes: `GeneratedReport` e primitivas da Task 2.
- Produces: `ExecutivePrintPages({ report })`.

- [ ] Renderizar capa, painel, financeiro, operações, clientes, malha, motoristas, evolução, agenda e governança.
- [ ] Usar rankings e séries do `ReportAnalytics` sem recalcular ordens.
- [ ] Garantir uma página física por seção.
- [ ] Executar build.

### Task 4: Páginas específicas dos sete relatórios temáticos

**Files:**
- Create: `components/reports/print/ModelPrintPages.tsx`

**Interfaces:**
- Consumes: `GeneratedReport`.
- Produces: `ModelPrintPages({ report })`.

- [ ] Implementar narrativas específicas para despesas, lucros, clientes, motoristas, rotas, recorrência e operações em andamento.
- [ ] Preservar comparações e insights específicos do modelo.
- [ ] Executar build.

### Task 5: Apêndice operacional paginado

**Files:**
- Create: `components/reports/print/AppendixPages.tsx`

**Interfaces:**
- Consumes: `GeneratedReport` e `chunkForPrint`.
- Produces: `AppendixPages({ report })`.

- [ ] Dividir ordens em blocos de até 20.
- [ ] Repetir cabeçalho e intervalo de registros.
- [ ] Usar colunas adequadas a cada modelo.
- [ ] Garantir que nenhuma página vazia seja criada.
- [ ] Executar testes.

### Task 6: Orquestração do documento

**Files:**
- Modify: `components/reports/ReportPrintDocument.tsx`

**Interfaces:**
- Consumes: páginas executivas/temáticas e apêndice.

- [ ] Remover o documento contínuo antigo.
- [ ] Renderizar páginas conforme o tipo do relatório.
- [ ] Incluir apêndice somente pelas regras do plano.
- [ ] Executar testes e build completo.

### Task 7: Validação visual e produção

**Files:**
- Create: `docs/validation/premium-report-print-engine.md`

- [ ] Gerar fixture com 119 registros e textos extremos.
- [ ] Exportar PDF real com Chromium.
- [ ] Renderizar todas as páginas a 160-200 dpi.
- [ ] Comparar com a referência premium.
- [ ] Registrar quantidade de páginas, ausência de cortes e resultado.
- [ ] Criar PR, aguardar CI, revisar e mesclar no `main`.
- [ ] Confirmar deploy Vercel do commit de merge.
