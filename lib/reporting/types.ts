export type ReportKind =
  | 'executive'
  | 'expenses'
  | 'profits'
  | 'clients'
  | 'drivers'
  | 'routes'
  | 'recurrence'
  | 'in-progress';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface ReportingOrder {
  id: string;
  orderNumber: string;
  cteNumber: string;
  emissionDate: string;
  emissionDateValue: string;
  clientId: string;
  clientName: string;
  driverId: string;
  driverName: string;
  origin: string;
  destination: string;
  status: string;
  cteValue: number;
  freightValue: number;
  advanceValue: number;
  cashValue: number;
  balanceValue: number;
  loadingExpense: number;
  unloadingExpense: number;
  otherExpenses: number;
  totalExpenses: number;
  netValue: number;
}

export interface ReportSummary {
  totalOrders: number;
  totalCteValue: number;
  totalFreightValue: number;
  totalAdvanceValue: number;
  totalCashValue: number;
  totalBalanceValue: number;
  totalExpenses: number;
  totalNetValue: number;
  averageCteValue: number;
  averageNetValue: number;
  marginPercent: number;
  expenseRatioPercent: number;
  deliveredCount: number;
  inTransitCount: number;
  loadingCount: number;
  contractingCount: number;
  deliveredPercent: number;
}

export interface RankingItem {
  key: string;
  label: string;
  orderCount: number;
  cteValue: number;
  netValue: number;
  expenses: number;
  averageCteValue: number;
  sharePercent: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
  orderCount: number;
  sharePercent: number;
}

export interface TimeSeriesPoint {
  key: string;
  label: string;
  orderCount: number;
  cteValue: number;
  netValue: number;
  expenses: number;
}

export interface ReportAnalytics {
  summary: ReportSummary;
  clients: RankingItem[];
  drivers: RankingItem[];
  routes: RankingItem[];
  origins: RankingItem[];
  destinations: RankingItem[];
  statuses: BreakdownItem[];
  expenses: BreakdownItem[];
  timeSeries: TimeSeriesPoint[];
  inProgress: ReportingOrder[];
  recurrence: {
    clients: number;
    drivers: number;
    routes: number;
  };
}

export interface ComparisonMetric {
  current: number;
  reference: number;
  absoluteChange: number;
  percentChange: number | null;
  hasReference: boolean;
}

export interface ReportComparison {
  totalOrders: ComparisonMetric;
  totalCteValue: ComparisonMetric;
  totalNetValue: ComparisonMetric;
  totalExpenses: ComparisonMetric;
  marginPercent: ComparisonMetric;
  deliveredPercent: ComparisonMetric;
}

export type ReportInsightKind = 'strength' | 'highlight' | 'attention' | 'opportunity' | 'priority' | 'info';

export interface ReportInsight {
  id: string;
  kind: ReportInsightKind;
  title: string;
  description: string;
  evidence: string;
  priority: number;
}
