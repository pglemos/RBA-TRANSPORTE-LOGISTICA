import type { GeneratedReport, ReportKind, ReportingOrder } from './types.ts';

export type PrintPageType = 'cover' | 'content' | 'insights' | 'governance' | 'appendix';

export interface PrintPagePlanItem {
  key: string;
  type: PrintPageType;
  title: string;
  pageIndex?: number;
  startIndex?: number;
  endIndex?: number;
}

export const APPENDIX_ROWS_PER_PAGE = 20;

const IN_PROGRESS_APPENDIX_STATUSES = new Set(['Contratar', 'Carregando', 'Em Trânsito']);

const EXECUTIVE_PAGES: PrintPagePlanItem[] = [
  { key: 'cover', type: 'cover', title: 'Relatório executivo de performance logística' },
  { key: 'overview', type: 'content', title: 'Painel da diretoria' },
  { key: 'financial', type: 'content', title: 'Resultado financeiro' },
  { key: 'operations', type: 'content', title: 'Execução operacional' },
  { key: 'clients', type: 'content', title: 'Carteira de clientes' },
  { key: 'routes', type: 'content', title: 'Inteligência de malha' },
  { key: 'drivers', type: 'content', title: 'Capacidade de transporte' },
  { key: 'trend', type: 'content', title: 'Evolução temporal' },
  { key: 'insights', type: 'insights', title: 'Agenda executiva' },
  { key: 'governance', type: 'governance', title: 'Governança, integridade e rastreabilidade' },
];

const MODEL_PAGES: PrintPagePlanItem[] = [
  { key: 'cover', type: 'cover', title: 'Relatório gerencial' },
  { key: 'overview', type: 'content', title: 'Painel executivo' },
  { key: 'model-primary', type: 'content', title: 'Análise principal' },
  { key: 'model-secondary', type: 'content', title: 'Análise complementar' },
  { key: 'trend', type: 'content', title: 'Evolução e comparação' },
  { key: 'insights', type: 'insights', title: 'Insights e prioridades' },
  { key: 'governance', type: 'governance', title: 'Governança, integridade e rastreabilidade' },
];

export function selectAppendixOrders(
  report: Pick<GeneratedReport, 'kind' | 'orders'>,
): ReportingOrder[] {
  if (report.kind !== 'in-progress') return report.orders;
  return report.orders.filter((order) => IN_PROGRESS_APPENDIX_STATUSES.has(order.status));
}

export function chunkForPrint<T>(items: readonly T[], pageSize = APPENDIX_ROWS_PER_PAGE): T[][] {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error('O tamanho da página deve ser maior que zero.');
  }

  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += pageSize) {
    chunks.push(items.slice(start, start + pageSize));
  }
  return chunks;
}

export function buildPrintPagePlan(
  kind: ReportKind,
  orderCount: number,
  includeDetails: boolean,
): PrintPagePlanItem[] {
  if (!Number.isInteger(orderCount) || orderCount < 0) {
    throw new Error('A quantidade de ordens deve ser um inteiro não negativo.');
  }

  const base = (kind === 'executive' ? EXECUTIVE_PAGES : MODEL_PAGES).map((page) => ({ ...page }));
  const shouldIncludeAppendix = includeDetails || kind === 'in-progress';
  if (!shouldIncludeAppendix || orderCount === 0) return base;

  const pageCount = Math.ceil(orderCount / APPENDIX_ROWS_PER_PAGE);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const startIndex = pageIndex * APPENDIX_ROWS_PER_PAGE;
    base.push({
      key: `appendix-${pageIndex + 1}`,
      type: 'appendix',
      title: 'Apêndice operacional',
      pageIndex,
      startIndex,
      endIndex: Math.min(orderCount, startIndex + APPENDIX_ROWS_PER_PAGE),
    });
  }

  return base;
}
