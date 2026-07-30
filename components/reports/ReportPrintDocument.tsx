import RBALogo from '@/components/RBALogo';
import { getReportCatalogItem } from '@/lib/reporting/catalog';
import type {
  BreakdownItem,
  ComparisonMetric,
  GeneratedReport,
  RankingItem,
  ReportKind,
  ReportingOrder,
  TimeSeriesPoint,
} from '@/lib/reporting/types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const integerFormatter = new Intl.NumberFormat('pt-BR');
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const DAY_MS = 24 * 60 * 60 * 1000;

const INSIGHT_KIND_LABELS = {
  strength: 'Ponto forte',
  highlight: 'Destaque',
  attention: 'Ponto de atenção',
  opportunity: 'Oportunidade',
  priority: 'Prioridade sugerida',
  info: 'Informação',
} as const;

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;
const formatGeneratedAt = (date: Date) => date.toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

function formatDelta(metric: ComparisonMetric | null): string {
  if (!metric || metric.percentChange === null) return 'Sem base';
  return `${metric.percentChange > 0 ? '+' : ''}${formatPercent(metric.percentChange)}`;
}

function openDays(order: ReportingOrder, reference: Date): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.emissionDateValue)) return 0;
  const [year, month, day] = order.emissionDateValue.split('-').map(Number);
  const start = Date.UTC(year, month - 1, day);
  const end = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return end >= start ? Math.floor((end - start) / DAY_MS) : 0;
}

function MiniCards({ items, mode = 'currency' }: { items: BreakdownItem[]; mode?: 'currency' | 'count' }) {
  return (
    <div className="dynamic-report-mini-grid">
      {items.map((item) => (
        <div key={item.key} className="dynamic-report-mini-card">
          <span>{item.label}</span>
          <strong>{mode === 'currency' ? formatCurrency(item.value) : integerFormatter.format(item.orderCount)}</strong>
          <small>{formatPercent(item.sharePercent)} do total</small>
        </div>
      ))}
    </div>
  );
}

function SummaryCards({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="dynamic-report-model-summary">
      {items.map(([label, value, helper]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>{helper}</small>
        </div>
      ))}
    </div>
  );
}

function RankingTable({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <section className="dynamic-report-section">
      <h2>{title}</h2>
      <table className="dynamic-report-table dynamic-report-ranking-table">
        <thead><tr><th>Pos.</th><th>Nome</th><th>Operações</th><th>Valor CTE</th><th>Lucro</th><th>Despesas</th><th>Participação</th></tr></thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.key}>
              <td className="dynamic-report-center">{index + 1}</td>
              <td className="dynamic-report-wrap dynamic-report-strong">{item.label}</td>
              <td className="dynamic-report-center">{integerFormatter.format(item.orderCount)}</td>
              <td className="dynamic-report-number">{formatCurrency(item.cteValue)}</td>
              <td className="dynamic-report-number dynamic-report-positive">{formatCurrency(item.netValue)}</td>
              <td className="dynamic-report-number">{formatCurrency(item.expenses)}</td>
              <td className="dynamic-report-number">{formatPercent(item.sharePercent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TrendTable({ title, points }: { title: string; points: TimeSeriesPoint[] }) {
  if (points.length === 0) return null;
  return (
    <section className="dynamic-report-section">
      <h2>{title}</h2>
      <table className="dynamic-report-table dynamic-report-trend-table">
        <thead><tr><th>Semana</th><th>Operações</th><th>Valor CTE</th><th>Despesas</th><th>Lucro líquido</th></tr></thead>
        <tbody>{points.map((point) => <tr key={point.key}><td className="dynamic-report-wrap dynamic-report-strong">{point.label}</td><td className="dynamic-report-center">{integerFormatter.format(point.orderCount)}</td><td className="dynamic-report-number">{formatCurrency(point.cteValue)}</td><td className="dynamic-report-number">{formatCurrency(point.expenses)}</td><td className="dynamic-report-number dynamic-report-positive">{formatCurrency(point.netValue)}</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function ModelSections({ report }: { report: GeneratedReport }) {
  const limit = report.rankingLimit;
  const analytics = report.current;
  const byExpense = (items: RankingItem[]) => [...items].sort((a, b) => b.expenses - a.expenses).slice(0, limit);
  const byProfit = (items: RankingItem[]) => [...items].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
  const recurring = (items: RankingItem[]) => items.filter((item) => item.orderCount >= 2).slice(0, limit);

  if (report.kind === 'expenses') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Composição das despesas registradas</h2><MiniCards items={analytics.expenses} /></section><RankingTable title="Clientes com maior despesa" items={byExpense(analytics.clients)} /><RankingTable title="Motoristas com maior despesa" items={byExpense(analytics.drivers)} /><RankingTable title="Rotas com maior despesa" items={byExpense(analytics.routes)} /><TrendTable title="Evolução semanal das despesas" points={analytics.timeSeries} /></>;
  }

  if (report.kind === 'profits') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Distribuição dos resultados registrados</h2><MiniCards items={analytics.profitBuckets} /></section><RankingTable title="Clientes com maior lucro líquido" items={byProfit(analytics.clients)} /><RankingTable title="Motoristas com maior lucro líquido" items={byProfit(analytics.drivers)} /><RankingTable title="Rotas com maior lucro líquido" items={byProfit(analytics.routes)} /><TrendTable title="Evolução semanal do lucro registrado" points={analytics.timeSeries} /></>;
  }

  if (report.kind === 'clients') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Indicadores comerciais</h2><SummaryCards items={[["Clientes ativos", integerFormatter.format(analytics.clients.length), 'com operações'], ["Clientes recorrentes", integerFormatter.format(analytics.recurrence.clients), formatPercent(analytics.recurrence.recurringClientOrderPercent) + ' das operações'], ["Dependência principal", formatPercent(analytics.recurrence.leadingClientDependencyPercent), 'participação por volume'], ["Ticket médio", formatCurrency(analytics.summary.averageCteValue), 'por operação']]}/></section><RankingTable title="Performance consolidada por cliente" items={analytics.clients.slice(0, limit)} /><RankingTable title="Clientes recorrentes" items={recurring(analytics.clients)} /></>;
  }

  if (report.kind === 'drivers') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Indicadores da rede de motoristas</h2><SummaryCards items={[["Motoristas utilizados", integerFormatter.format(analytics.drivers.length), 'no período'], ["Motoristas recorrentes", integerFormatter.format(analytics.recurrence.drivers), formatPercent(analytics.recurrence.recurringDriverOrderPercent) + ' das operações'], ["Frete registrado", formatCurrency(analytics.summary.totalFreightValue), 'nas ordens'], ["Lucro médio", formatCurrency(analytics.summary.averageNetValue), 'por operação']]}/></section><RankingTable title="Performance consolidada por motorista" items={analytics.drivers.slice(0, limit)} /><RankingTable title="Motoristas recorrentes" items={recurring(analytics.drivers)} /></>;
  }

  if (report.kind === 'routes') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Indicadores geográficos</h2><SummaryCards items={[["Rotas utilizadas", integerFormatter.format(analytics.routes.length), 'combinações'], ["Rotas recorrentes", integerFormatter.format(analytics.recurrence.routes), formatPercent(analytics.recurrence.recurringRouteOrderPercent) + ' das operações'], ["Origens distintas", integerFormatter.format(analytics.origins.length), 'identificadas'], ["Destinos distintos", integerFormatter.format(analytics.destinations.length), 'identificados']]}/></section><RankingTable title="Performance por rota" items={analytics.routes.slice(0, limit)} /><RankingTable title="Principais origens" items={analytics.origins.slice(0, limit)} /><RankingTable title="Principais destinos" items={analytics.destinations.slice(0, limit)} /><TrendTable title="Evolução semanal das rotas operadas" points={analytics.timeSeries} /></>;
  }

  if (report.kind === 'recurrence') {
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Indicadores de recorrência</h2><SummaryCards items={[["Clientes", formatPercent(analytics.recurrence.recurringClientOrderPercent), analytics.recurrence.clients + ' recorrentes'], ["Motoristas", formatPercent(analytics.recurrence.recurringDriverOrderPercent), analytics.recurrence.drivers + ' recorrentes'], ["Rotas", formatPercent(analytics.recurrence.recurringRouteOrderPercent), analytics.recurrence.routes + ' recorrentes'], ["Cliente + rota", formatPercent(analytics.recurrence.recurringClientRouteOrderPercent), analytics.recurrence.clientRoutes + ' combinações']]}/></section><RankingTable title="Clientes recorrentes" items={recurring(analytics.clients)} /><RankingTable title="Motoristas recorrentes" items={recurring(analytics.drivers)} /><RankingTable title="Rotas recorrentes" items={recurring(analytics.routes)} /><RankingTable title="Combinações cliente + rota" items={recurring(analytics.clientRoutes)} /></>;
  }

  if (report.kind === 'in-progress') {
    const open = analytics.inProgressSummary;
    return <><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Indicadores das operações em andamento</h2><SummaryCards items={[["Operações abertas", integerFormatter.format(open.totalOrders), 'não entregues'], ["Valor CTE", formatCurrency(open.totalCteValue), 'envolvido'], ["Média em aberto", open.averageOpenDays + ' dias', 'desde a emissão'], ["Mais antiga", open.oldestOpenDays + ' dias', 'em acompanhamento']]}/></section><section className="dynamic-report-section dynamic-report-avoid-break"><h2>Operações abertas por status</h2><MiniCards items={open.byStatus} mode="count" /></section><RankingTable title="Clientes com operações abertas" items={open.byClient.slice(0, limit)} /><RankingTable title="Rotas com operações abertas" items={open.byRoute.slice(0, limit)} />{DetailTable({ kind: 'in-progress', orders: report.orders, generatedAt: report.generatedAt })}</>;
  }

  return <><RankingTable title="Principais clientes" items={analytics.clients.slice(0, limit)} /><RankingTable title="Principais rotas" items={analytics.routes.slice(0, limit)} /><TrendTable title="Evolução semanal" points={analytics.timeSeries} /></>;
}

function DetailTable({ kind, orders, generatedAt }: { kind: ReportKind; orders: ReportingOrder[]; generatedAt: Date }) {
  const source = kind === 'in-progress' ? orders.filter((order) => ['Contratar', 'Carregando', 'Em Trânsito'].includes(order.status)) : orders;
  if (kind === 'expenses') return <table className="dynamic-report-table dynamic-report-detail-table"><thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Rota</th><th>Carga</th><th>Descarga</th><th>Outros</th><th>Total</th></tr></thead><tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.loadingExpense)}</td><td className="dynamic-report-number">{formatCurrency(order.unloadingExpense)}</td><td className="dynamic-report-number">{formatCurrency(order.otherExpenses)}</td><td className="dynamic-report-number dynamic-report-strong">{formatCurrency(order.totalExpenses)}</td></tr>)}</tbody></table>;
  if (kind === 'profits') return <table className="dynamic-report-table dynamic-report-detail-table"><thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Margem</th><th>Status</th></tr></thead><tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.cteValue)}</td><td className="dynamic-report-number dynamic-report-positive">{formatCurrency(order.netValue)}</td><td className="dynamic-report-number">{formatPercent(order.cteValue > 0 ? (order.netValue / order.cteValue) * 100 : 0)}</td><td className="dynamic-report-center">{order.status}</td></tr>)}</tbody></table>;
  if (kind === 'in-progress') return <table className="dynamic-report-table dynamic-report-detail-table"><thead><tr><th>Referência</th><th>Emissão</th><th>Dias</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor CTE</th><th>Status</th></tr></thead><tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-center dynamic-report-strong">{openDays(order, generatedAt)}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.driverName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.cteValue)}</td><td className="dynamic-report-center">{order.status}</td></tr>)}</tbody></table>;
  return <table className="dynamic-report-table dynamic-report-detail-table"><thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Status</th></tr></thead><tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.driverName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.cteValue)}</td><td className="dynamic-report-number dynamic-report-positive">{formatCurrency(order.netValue)}</td><td className="dynamic-report-center">{order.status}</td></tr>)}</tbody></table>;
}

export default function ReportPrintDocument({ report }: { report: GeneratedReport }) {
  const catalog = getReportCatalogItem(report.kind);
  const comparisonRows = [
    ['Operações', report.previousComparison?.totalOrders || null, report.previousYearComparison?.totalOrders || null],
    ['Valor CTE', report.previousComparison?.totalCteValue || null, report.previousYearComparison?.totalCteValue || null],
    ['Lucro líquido', report.previousComparison?.totalNetValue || null, report.previousYearComparison?.totalNetValue || null],
    ['Despesas', report.previousComparison?.totalExpenses || null, report.previousYearComparison?.totalExpenses || null],
    ['Margem', report.previousComparison?.marginPercent || null, report.previousYearComparison?.marginPercent || null],
    ['Entregues', report.previousComparison?.deliveredPercent || null, report.previousYearComparison?.deliveredPercent || null],
  ] as const;

  return (
    <section id="dynamic-report-print-target" className="report-print-only dynamic-report-document" aria-label="Relatório dinâmico para impressão">
      <header className="dynamic-report-header"><div className="dynamic-report-brand"><RBALogo className="dynamic-report-logo" /><div className="dynamic-report-title-block"><p>RBA TRANSPORTE & LOGÍSTICA</p><h1>{catalog.title}</h1><span>{report.period.label}</span></div></div><div className="dynamic-report-meta"><strong data-dynamic-generated-at>Emitido em {formatGeneratedAt(report.generatedAt)}</strong><span>{report.filtersLabel}</span><span>Documento interno - uso gerencial</span></div></header>
      <section className="dynamic-report-summary dynamic-report-avoid-break"><div><span>Operações</span><strong>{integerFormatter.format(report.current.summary.totalOrders)}</strong><small>registros filtrados</small></div><div><span>Valor CTE</span><strong>{formatCurrency(report.current.summary.totalCteValue)}</strong><small>registrado</small></div><div><span>Lucro líquido</span><strong>{formatCurrency(report.current.summary.totalNetValue)}</strong><small>registrado</small></div><div><span>Despesas</span><strong>{formatCurrency(report.current.summary.totalExpenses)}</strong><small>{formatPercent(report.current.summary.expenseRatioPercent)} do CTE</small></div><div><span>Margem</span><strong>{formatPercent(report.current.summary.marginPercent)}</strong><small>gerencial</small></div><div><span>Entregues</span><strong>{formatPercent(report.current.summary.deliveredPercent)}</strong><small>{report.current.summary.deliveredCount} operações</small></div></section>
      {(report.previousComparison || report.previousYearComparison) && <section className="dynamic-report-section dynamic-report-avoid-break"><h2>Comparações do período</h2><table className="dynamic-report-table dynamic-report-comparison-table"><thead><tr><th>Indicador</th><th>Período anterior</th><th>Mesmo período do ano anterior</th></tr></thead><tbody>{comparisonRows.map(([label, previous, year]) => <tr key={label}><td className="dynamic-report-strong">{label}</td><td className="dynamic-report-center">{formatDelta(previous)}</td><td className="dynamic-report-center">{formatDelta(year)}</td></tr>)}</tbody></table></section>}
      <ModelSections report={report} />
      <section className="dynamic-report-section"><h2>Insights, pontos fortes e prioridades sugeridas</h2><div className="dynamic-report-insights">{report.insights.map((insight) => <article key={insight.id} className={`dynamic-report-insight dynamic-report-insight-${insight.kind}`}><span>{INSIGHT_KIND_LABELS[insight.kind]}</span><h3>{insight.title}</h3><p>{insight.description}</p><strong>{insight.evidence}</strong></article>)}</div></section>
      {report.includeDetails && report.kind !== 'in-progress' && <section className="dynamic-report-section dynamic-report-detail-section"><h2>Detalhamento das ordens</h2><p className="dynamic-report-section-helper">Os valores abaixo são reproduzidos dos campos persistidos no sistema. O relatório não executa um segundo cálculo financeiro por operação.</p><DetailTable kind={report.kind} orders={report.orders} generatedAt={report.generatedAt} /></section>}
      <footer className="dynamic-report-footer"><div><strong>Fonte e integridade dos dados</strong><p>Ordens, fichas, CTEs e manifestos registrados no RBA Fretes Digital. Comparações, médias, percentuais, recorrências e rankings são agregações gerenciais dos valores persistidos.</p></div><span>RBA TRANSPORTE & LOGÍSTICA · {catalog.shortTitle} · {report.period.label}</span></footer>
    </section>
  );
}
