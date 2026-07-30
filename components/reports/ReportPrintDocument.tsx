import RBALogo from '@/components/RBALogo';
import { getReportCatalogItem } from '@/lib/reporting/catalog';
import type {
  ComparisonMetric,
  GeneratedReport,
  RankingItem,
  ReportKind,
  ReportingOrder,
} from '@/lib/reporting/types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const integerFormatter = new Intl.NumberFormat('pt-BR');
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

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
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDelta(metric: ComparisonMetric | null): string {
  if (!metric || metric.percentChange === null) return 'Sem base';
  return `${metric.percentChange > 0 ? '+' : ''}${formatPercent(metric.percentChange)}`;
}

function RankingTable({ title, items, valueKey = 'cteValue' }: {
  title: string;
  items: RankingItem[];
  valueKey?: 'cteValue' | 'netValue' | 'expenses' | 'orderCount';
}) {
  return (
    <section className="dynamic-report-section">
      <h2>{title}</h2>
      <table className="dynamic-report-table dynamic-report-ranking-table">
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Nome</th>
            <th>Operações</th>
            <th>Valor CTE</th>
            <th>Lucro</th>
            <th>Despesas</th>
            <th>Participação</th>
          </tr>
        </thead>
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

function ModelSections({ report }: { report: GeneratedReport }) {
  const limit = report.rankingLimit;
  const analytics = report.current;

  if (report.kind === 'expenses') {
    return (
      <>
        <section className="dynamic-report-section dynamic-report-avoid-break">
          <h2>Composição das despesas registradas</h2>
          <div className="dynamic-report-mini-grid">
            {analytics.expenses.map((item) => (
              <div key={item.key} className="dynamic-report-mini-card">
                <span>{item.label}</span>
                <strong>{formatCurrency(item.value)}</strong>
                <small>{formatPercent(item.sharePercent)} das despesas</small>
              </div>
            ))}
          </div>
        </section>
        <RankingTable title="Clientes com maior despesa consolidada" items={[...analytics.clients].sort((a, b) => b.expenses - a.expenses).slice(0, limit)} valueKey="expenses" />
        <RankingTable title="Rotas com maior despesa consolidada" items={[...analytics.routes].sort((a, b) => b.expenses - a.expenses).slice(0, limit)} valueKey="expenses" />
      </>
    );
  }

  if (report.kind === 'profits') {
    return (
      <>
        <RankingTable title="Clientes com maior lucro líquido registrado" items={[...analytics.clients].sort((a, b) => b.netValue - a.netValue).slice(0, limit)} valueKey="netValue" />
        <RankingTable title="Rotas com maior lucro líquido registrado" items={[...analytics.routes].sort((a, b) => b.netValue - a.netValue).slice(0, limit)} valueKey="netValue" />
      </>
    );
  }

  if (report.kind === 'clients') return <RankingTable title="Performance consolidada por cliente" items={analytics.clients.slice(0, limit)} />;
  if (report.kind === 'drivers') return <RankingTable title="Performance consolidada por motorista" items={analytics.drivers.slice(0, limit)} />;

  if (report.kind === 'routes') {
    return (
      <>
        <RankingTable title="Rotas mais relevantes" items={analytics.routes.slice(0, limit)} />
        <div className="dynamic-report-two-columns">
          <RankingTable title="Principais origens" items={analytics.origins.slice(0, limit)} />
          <RankingTable title="Principais destinos" items={analytics.destinations.slice(0, limit)} />
        </div>
      </>
    );
  }

  if (report.kind === 'recurrence') {
    return (
      <>
        <RankingTable title="Clientes recorrentes" items={analytics.clients.filter((item) => item.orderCount >= 2).slice(0, limit)} valueKey="orderCount" />
        <RankingTable title="Motoristas recorrentes" items={analytics.drivers.filter((item) => item.orderCount >= 2).slice(0, limit)} valueKey="orderCount" />
        <RankingTable title="Rotas recorrentes" items={analytics.routes.filter((item) => item.orderCount >= 2).slice(0, limit)} valueKey="orderCount" />
      </>
    );
  }

  return (
    <div className="dynamic-report-two-columns">
      <RankingTable title="Principais clientes" items={analytics.clients.slice(0, limit)} />
      <RankingTable title="Principais rotas" items={analytics.routes.slice(0, limit)} />
    </div>
  );
}

function DetailTable({ kind, orders }: { kind: ReportKind; orders: ReportingOrder[] }) {
  const source = kind === 'in-progress'
    ? orders.filter((order) => ['Contratar', 'Carregando', 'Em Trânsito'].includes(order.status))
    : orders;

  if (kind === 'expenses') {
    return (
      <table className="dynamic-report-table dynamic-report-detail-table">
        <thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Rota</th><th>Carga</th><th>Descarga</th><th>Outros</th><th>Total</th></tr></thead>
        <tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.loadingExpense)}</td><td className="dynamic-report-number">{formatCurrency(order.unloadingExpense)}</td><td className="dynamic-report-number">{formatCurrency(order.otherExpenses)}</td><td className="dynamic-report-number dynamic-report-strong">{formatCurrency(order.totalExpenses)}</td></tr>)}</tbody>
      </table>
    );
  }

  if (kind === 'profits') {
    return (
      <table className="dynamic-report-table dynamic-report-detail-table">
        <thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Margem</th><th>Status</th></tr></thead>
        <tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.cteValue)}</td><td className="dynamic-report-number dynamic-report-positive">{formatCurrency(order.netValue)}</td><td className="dynamic-report-number">{formatPercent(order.cteValue > 0 ? (order.netValue / order.cteValue) * 100 : 0)}</td><td className="dynamic-report-center">{order.status}</td></tr>)}</tbody>
      </table>
    );
  }

  return (
    <table className="dynamic-report-table dynamic-report-detail-table">
      <thead><tr><th>Referência</th><th>Emissão</th><th>Cliente</th><th>Motorista</th><th>Rota</th><th>Valor CTE</th><th>Lucro</th><th>Status</th></tr></thead>
      <tbody>{source.map((order) => <tr key={order.id}><td className="dynamic-report-wrap dynamic-report-strong">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</td><td>{order.emissionDate}</td><td className="dynamic-report-wrap">{order.clientName}</td><td className="dynamic-report-wrap">{order.driverName}</td><td className="dynamic-report-wrap">{order.origin} → {order.destination}</td><td className="dynamic-report-number">{formatCurrency(order.cteValue)}</td><td className="dynamic-report-number dynamic-report-positive">{formatCurrency(order.netValue)}</td><td className="dynamic-report-center">{order.status}</td></tr>)}</tbody>
    </table>
  );
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
      <header className="dynamic-report-header">
        <div className="dynamic-report-brand">
          <RBALogo className="dynamic-report-logo" />
          <div className="dynamic-report-title-block">
            <p>RBA TRANSPORTE & LOGÍSTICA</p>
            <h1>{catalog.title}</h1>
            <span>{report.period.label}</span>
          </div>
        </div>
        <div className="dynamic-report-meta">
          <strong data-dynamic-generated-at>Emitido em {formatGeneratedAt(report.generatedAt)}</strong>
          <span>{report.filtersLabel}</span>
          <span>Documento interno - uso gerencial</span>
        </div>
      </header>

      <section className="dynamic-report-summary dynamic-report-avoid-break">
        <div><span>Operações</span><strong>{integerFormatter.format(report.current.summary.totalOrders)}</strong><small>registros filtrados</small></div>
        <div><span>Valor CTE</span><strong>{formatCurrency(report.current.summary.totalCteValue)}</strong><small>registrado</small></div>
        <div><span>Lucro líquido</span><strong>{formatCurrency(report.current.summary.totalNetValue)}</strong><small>registrado</small></div>
        <div><span>Despesas</span><strong>{formatCurrency(report.current.summary.totalExpenses)}</strong><small>{formatPercent(report.current.summary.expenseRatioPercent)} do CTE</small></div>
        <div><span>Margem</span><strong>{formatPercent(report.current.summary.marginPercent)}</strong><small>gerencial</small></div>
        <div><span>Entregues</span><strong>{formatPercent(report.current.summary.deliveredPercent)}</strong><small>{report.current.summary.deliveredCount} operações</small></div>
      </section>

      {(report.previousComparison || report.previousYearComparison) && (
        <section className="dynamic-report-section dynamic-report-avoid-break">
          <h2>Comparações do período</h2>
          <table className="dynamic-report-table dynamic-report-comparison-table">
            <thead><tr><th>Indicador</th><th>Período anterior</th><th>Mesmo período do ano anterior</th></tr></thead>
            <tbody>{comparisonRows.map(([label, previous, year]) => <tr key={label}><td className="dynamic-report-strong">{label}</td><td className="dynamic-report-center">{formatDelta(previous)}</td><td className="dynamic-report-center">{formatDelta(year)}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <ModelSections report={report} />

      <section className="dynamic-report-section">
        <h2>Insights, pontos fortes e prioridades sugeridas</h2>
        <div className="dynamic-report-insights">
          {report.insights.map((insight) => (
            <article key={insight.id} className={`dynamic-report-insight dynamic-report-insight-${insight.kind}`}>
              <span>{INSIGHT_KIND_LABELS[insight.kind]}</span>
              <h3>{insight.title}</h3>
              <p>{insight.description}</p>
              <strong>{insight.evidence}</strong>
            </article>
          ))}
        </div>
      </section>

      {report.includeDetails && (
        <section className="dynamic-report-section dynamic-report-detail-section">
          <h2>Detalhamento das ordens</h2>
          <p className="dynamic-report-section-helper">Os valores abaixo são reproduzidos dos campos persistidos no sistema. O relatório não executa um segundo cálculo financeiro por operação.</p>
          <DetailTable kind={report.kind} orders={report.orders} />
        </section>
      )}

      <footer className="dynamic-report-footer">
        <div>
          <strong>Fonte e integridade dos dados</strong>
          <p>Ordens, fichas, CTEs e manifestos registrados no RBA Fretes Digital. Comparações, médias, percentuais, recorrências e rankings são agregações gerenciais dos valores persistidos.</p>
        </div>
        <span>RBA TRANSPORTE & LOGÍSTICA · {catalog.shortTitle} · {report.period.label}</span>
      </footer>
    </section>
  );
}
