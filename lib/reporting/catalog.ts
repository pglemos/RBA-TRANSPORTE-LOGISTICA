import type { ReportKind } from './types.ts';

export interface ReportCatalogItem {
  kind: ReportKind;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
}

export const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    kind: 'executive',
    title: 'Relatório Executivo Geral',
    shortTitle: 'Executivo',
    description: 'Visão consolidada da operação, finanças, comparações, rankings e prioridades.',
    accent: 'bg-slate-950 text-white',
  },
  {
    kind: 'expenses',
    title: 'Relatório de Despesas',
    shortTitle: 'Despesas',
    description: 'Carga, descarga, outros gastos, concentração e oportunidades de eficiência.',
    accent: 'bg-amber-50 text-amber-900',
  },
  {
    kind: 'profits',
    title: 'Relatório de Lucros',
    shortTitle: 'Lucros',
    description: 'Lucro líquido registrado, margem, evolução e operações com melhor retorno.',
    accent: 'bg-emerald-50 text-emerald-900',
  },
  {
    kind: 'clients',
    title: 'Relatório de Clientes',
    shortTitle: 'Clientes',
    description: 'Volume, ticket, participação, concentração, recorrência e evolução comercial.',
    accent: 'bg-blue-50 text-blue-900',
  },
  {
    kind: 'drivers',
    title: 'Relatório de Motoristas',
    shortTitle: 'Motoristas',
    description: 'Operações, valores movimentados, despesas, recorrência e destaques da rede.',
    accent: 'bg-indigo-50 text-indigo-900',
  },
  {
    kind: 'routes',
    title: 'Relatório de Rotas',
    shortTitle: 'Rotas',
    description: 'Origens, destinos, rotas recorrentes, concentração e retorno registrado.',
    accent: 'bg-cyan-50 text-cyan-900',
  },
  {
    kind: 'recurrence',
    title: 'Relatório de Recorrência',
    shortTitle: 'Recorrência',
    description: 'Clientes, motoristas e rotas repetidas, retenção e dependência operacional.',
    accent: 'bg-violet-50 text-violet-900',
  },
  {
    kind: 'in-progress',
    title: 'Operações em Andamento',
    shortTitle: 'Em andamento',
    description: 'Operações a contratar, carregando ou em trânsito, com prioridades de ação.',
    accent: 'bg-orange-50 text-orange-900',
  },
];

export const getReportCatalogItem = (kind: ReportKind): ReportCatalogItem =>
  REPORT_CATALOG.find((item) => item.kind === kind) || REPORT_CATALOG[0];
