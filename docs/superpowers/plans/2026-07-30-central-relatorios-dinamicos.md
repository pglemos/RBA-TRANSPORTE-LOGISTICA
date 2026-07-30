# Plano de Implementação - Central Dinâmica de Relatórios

## Objetivo

Implementar a especificação `docs/superpowers/specs/2026-07-30-central-relatorios-dinamicos-design.md` sem introduzir cálculo financeiro por ordem.

## Tarefa 1 - Contratos, períodos e comparações

**Arquivos:**

- criar `lib/reporting/types.ts`;
- criar `lib/reporting/periods.ts`;
- criar `tests/reportingPeriods.test.ts`.

**Passos:**

1. Escrever testes para mês específico, período personalizado, período anterior equivalente e ano anterior.
2. Confirmar falha por módulos inexistentes.
3. Implementar funções puras de período.
4. Rodar testes.

## Tarefa 2 - Agregações dinâmicas

**Arquivos:**

- criar `lib/reporting/analytics.ts`;
- criar `tests/reportingAnalytics.test.ts`.

**Passos:**

1. Escrever testes para resumo, clientes, motoristas, rotas, despesas, recorrência, status e séries temporais.
2. Garantir que os valores por ordem sejam apenas lidos.
3. Implementar agregações e rankings.
4. Rodar testes.

## Tarefa 3 - Comparações e insights

**Arquivos:**

- criar `lib/reporting/insights.ts`;
- criar `tests/reportingInsights.test.ts`.

**Passos:**

1. Testar variações, ausência de base, concentração, crescimento, queda e operações em andamento.
2. Implementar insights determinísticos com evidência numérica.
3. Rodar testes.

## Tarefa 4 - CSV e Excel

**Arquivos:**

- criar `lib/reporting/csv.ts`;
- criar `lib/reporting/excel.ts`;
- criar `tests/reportingExports.test.ts`;
- atualizar `package.json`.

**Passos:**

1. Preservar o contrato CSV existente.
2. Acrescentar CSV por modelo.
3. Adicionar ExcelJS para workbook `.xlsx`.
4. Criar abas Resumo Executivo, Modelo, Comparações, Insights e Base de Ordens.
5. Testar conteúdo, nomes de abas e valores.

## Tarefa 5 - Carregamento e filtros

**Arquivos:**

- criar `lib/reporting/clientData.ts`;
- atualizar `app/relatorios/page.tsx`.

**Passos:**

1. Definir período padrão como mês atual.
2. Buscar período atual, anterior e ano anterior pela API com os mesmos filtros.
3. Buscar clientes e motoristas.
4. Aplicar origem, destino e busca textual de forma consistente.
5. Exibir estado de carregamento e erros individualizados.

## Tarefa 6 - Interface da Central

**Arquivos:**

- criar `components/reports/ReportBuilder.tsx`;
- criar `components/reports/ReportDashboard.tsx`;
- criar `components/reports/ReportInsights.tsx`;
- criar `components/reports/ReportRankings.tsx`;
- atualizar `app/relatorios/page.tsx`.

**Passos:**

1. Implementar seletor dos oito modelos.
2. Implementar mês/período personalizado e filtros.
3. Implementar comparação anterior e anual.
4. Exibir KPIs, deltas, rankings, séries e insights adequados ao modelo.
5. Garantir responsividade e ausência de alturas fixas.

## Tarefa 7 - PDF dinâmico

**Arquivos:**

- criar `components/reports/ReportPrintDocument.tsx`;
- atualizar `app/globals.css`.

**Passos:**

1. Gerar documento condicional conforme o modelo.
2. Separar resumo e detalhamento.
3. Remover reticências e alturas fixas na impressão.
4. Repetir cabeçalho das tabelas.
5. Incluir comparações, insights, filtros e fonte dos dados.
6. Validar com textos extremos.

## Tarefa 8 - Integração e verificação

**Arquivos:**

- atualizar `.github/workflows/report-export-validation.yml`;
- atualizar `docs/AGENTE-IA-EXPORTACAO-RELATORIOS.md`.

**Passos:**

1. Rodar todos os testes.
2. Rodar build de produção.
3. Gerar CSV, Excel e PDF representativos.
4. Validar estrutura do CSV e Excel.
5. Renderizar todas as páginas do PDF.
6. Corrigir cortes e repetir.
7. Abrir PR e integrar apenas com CI verde.
