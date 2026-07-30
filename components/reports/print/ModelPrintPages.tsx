import { getReportCatalogItem } from '@/lib/reporting/catalog';
import type { GeneratedReport, RankingItem } from '@/lib/reporting/types';

import {
  ComparisonGrid,
  CoverPage,
  formatCompactCurrency,
  formatCurrency,
  formatPercent,
  GovernancePanel,
  HorizontalBars,
  InsightAgenda,
  MetricCard,
  MetricGrid,
  PrintPage,
  ReadingCard,
  SectionTitle,
  TrendChart,
  integerFormatter,
} from './PrintPrimitives';

const byExpense = (items: RankingItem[]) => [...items].sort((a, b) => b.expenses - a.expenses);
const byProfit = (items: RankingItem[]) => [...items].sort((a, b) => b.netValue - a.netValue);
const recurring = (items: RankingItem[]) => items.filter((item) => item.orderCount >= 2);

function OverviewPage({ report, totalPages }: { report: GeneratedReport; totalPages: number }) {
  const summary = report.current.summary;
  return (
    <PrintPage report={report} pageNumber={2} totalPages={totalPages} eyebrow="PAINEL EXECUTIVO" title="Indicadores consolidados do período" subtitle="Resumo financeiro e operacional do recorte selecionado">
      <MetricGrid columns={4}>
        <MetricCard label="Operações" value={integerFormatter.format(summary.totalOrders)} helper="registros filtrados" tone="navy" />
        <MetricCard label="Valor CTE" value={formatCompactCurrency(summary.totalCteValue)} helper="registrado" tone="gold" />
        <MetricCard label="Lucro líquido" value={formatCompactCurrency(summary.totalNetValue)} helper="registrado" tone="positive" />
        <MetricCard label="Despesas" value={formatCompactCurrency(summary.totalExpenses)} helper={`${formatPercent(summary.expenseRatioPercent)} do CTE`} />
      </MetricGrid>
      <MetricGrid columns={4}>
        <MetricCard label="Margem" value={formatPercent(summary.marginPercent)} helper="indicador gerencial" />
        <MetricCard label="Entregues" value={formatPercent(summary.deliveredPercent)} helper={`${summary.deliveredCount} operações`} tone="positive" />
        <MetricCard label="Ticket médio" value={formatCurrency(summary.averageCteValue)} helper="por operação" />
        <MetricCard label="Lucro médio" value={formatCurrency(summary.averageNetValue)} helper="por operação" />
      </MetricGrid>
      <div className="rba-comparison-box rba-comparison-box-spaced"><SectionTitle title="Comparações do período" /><ComparisonGrid report={report} /></div>
    </PrintPage>
  );
}

function PrimaryAnalysis({ report, totalPages }: { report: GeneratedReport; totalPages: number }) {
  const analytics = report.current;
  const kind = report.kind;
  if (kind === 'expenses') {
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="DESPESAS" title="Composição e concentração dos gastos" subtitle="Categorias e clientes com maior despesa registrada">
        <MetricGrid columns={3}>
          {analytics.expenses.map((item) => <MetricCard key={item.key} label={item.label} value={formatCompactCurrency(item.value)} helper={`${formatPercent(item.sharePercent)} das despesas`} />)}
        </MetricGrid>
        <SectionTitle title="Clientes com maior despesa consolidada" />
        <HorizontalBars items={byExpense(analytics.clients)} value={(item) => item.expenses} valueLabel={(item) => formatCompactCurrency(item.expenses)} limit={10} />
      </PrintPage>
    );
  }

  if (kind === 'profits') {
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="LUCROS" title="Distribuição do resultado registrado" subtitle="Operações positivas, neutras, negativas e clientes de maior contribuição">
        <MetricGrid columns={3}>
          {analytics.profitBuckets.map((item) => <MetricCard key={item.key} label={item.label} value={integerFormatter.format(item.orderCount)} helper={`${formatPercent(item.sharePercent)} das operações`} tone={item.key === 'positive' ? 'positive' : item.key === 'negative' ? 'warning' : 'default'} />)}
        </MetricGrid>
        <SectionTitle title="Clientes com maior lucro líquido" />
        <HorizontalBars items={byProfit(analytics.clients)} value={(item) => Math.max(0, item.netValue)} valueLabel={(item) => formatCompactCurrency(item.netValue)} limit={10} />
      </PrintPage>
    );
  }

  if (kind === 'clients') {
    const topClient = analytics.clients[0];
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="CLIENTES" title="Carteira e concentração comercial" subtitle="Volume, recorrência e dependência por cliente">
        <MetricGrid columns={4}>
          <MetricCard label="Clientes ativos" value={integerFormatter.format(analytics.clients.length)} helper="com operações" tone="navy" />
          <MetricCard label="Clientes recorrentes" value={integerFormatter.format(analytics.recurrence.clients)} helper={`${formatPercent(analytics.recurrence.recurringClientOrderPercent)} das operações`} />
          <MetricCard label="Dependência principal" value={formatPercent(analytics.recurrence.leadingClientDependencyPercent)} helper="participação do maior cliente" tone={analytics.recurrence.leadingClientDependencyPercent > 40 ? 'warning' : 'positive'} />
          <MetricCard label="Maior cliente" value={topClient?.label || 'Sem base'} helper={topClient ? formatCompactCurrency(topClient.cteValue) : 'Sem movimentação'} tone="gold" />
        </MetricGrid>
        <SectionTitle title="Top clientes por valor CTE" />
        <HorizontalBars items={analytics.clients} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} limit={10} />
      </PrintPage>
    );
  }

  if (kind === 'drivers') {
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="MOTORISTAS" title="Capacidade e volume da rede" subtitle="Motoristas mobilizados e participação operacional">
        <MetricGrid columns={4}>
          <MetricCard label="Motoristas utilizados" value={integerFormatter.format(analytics.drivers.length)} helper="no período" tone="navy" />
          <MetricCard label="Motoristas recorrentes" value={integerFormatter.format(analytics.recurrence.drivers)} helper={`${formatPercent(analytics.recurrence.recurringDriverOrderPercent)} das operações`} />
          <MetricCard label="Frete registrado" value={formatCompactCurrency(analytics.summary.totalFreightValue)} helper="nas ordens" tone="gold" />
          <MetricCard label="Lucro médio" value={formatCurrency(analytics.summary.averageNetValue)} helper="por operação" tone="positive" />
        </MetricGrid>
        <SectionTitle title="Motoristas com maior valor CTE movimentado" />
        <HorizontalBars items={analytics.drivers} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} limit={10} />
      </PrintPage>
    );
  }

  if (kind === 'routes') {
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="ROTAS" title="Inteligência da malha operacional" subtitle="Rotas de maior volume, origens e destinos">
        <MetricGrid columns={4}>
          <MetricCard label="Rotas utilizadas" value={integerFormatter.format(analytics.routes.length)} helper="combinações" tone="navy" />
          <MetricCard label="Rotas recorrentes" value={integerFormatter.format(analytics.recurrence.routes)} helper={`${formatPercent(analytics.recurrence.recurringRouteOrderPercent)} das operações`} />
          <MetricCard label="Origens distintas" value={integerFormatter.format(analytics.origins.length)} helper="identificadas" tone="gold" />
          <MetricCard label="Destinos distintos" value={integerFormatter.format(analytics.destinations.length)} helper="identificados" />
        </MetricGrid>
        <SectionTitle title="Rotas com maior valor CTE" />
        <HorizontalBars items={analytics.routes} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} limit={10} />
      </PrintPage>
    );
  }

  if (kind === 'recurrence') {
    return (
      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="RECORRÊNCIA" title="Estabilidade comercial e operacional" subtitle="Clientes, motoristas, rotas e combinações repetidas">
        <MetricGrid columns={4}>
          <MetricCard label="Clientes recorrentes" value={integerFormatter.format(analytics.recurrence.clients)} helper={formatPercent(analytics.recurrence.recurringClientOrderPercent)} tone="gold" />
          <MetricCard label="Motoristas recorrentes" value={integerFormatter.format(analytics.recurrence.drivers)} helper={formatPercent(analytics.recurrence.recurringDriverOrderPercent)} />
          <MetricCard label="Rotas recorrentes" value={integerFormatter.format(analytics.recurrence.routes)} helper={formatPercent(analytics.recurrence.recurringRouteOrderPercent)} />
          <MetricCard label="Cliente + rota" value={integerFormatter.format(analytics.recurrence.clientRoutes)} helper={formatPercent(analytics.recurrence.recurringClientRouteOrderPercent)} tone="positive" />
        </MetricGrid>
        <SectionTitle title="Clientes recorrentes" />
        <HorizontalBars items={recurring(analytics.clients)} value={(item) => item.orderCount} valueLabel={(item) => `${integerFormatter.format(item.orderCount)} operações`} limit={10} />
      </PrintPage>
    );
  }

  const open = analytics.inProgressSummary;
  return (
    <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="OPERAÇÕES EM ANDAMENTO" title="Pipeline ativo e tempo em aberto" subtitle="Exposição financeira, status e envelhecimento operacional">
      <MetricGrid columns={4}>
        <MetricCard label="Operações abertas" value={integerFormatter.format(open.totalOrders)} helper="não entregues" tone="warning" />
        <MetricCard label="Valor CTE" value={formatCompactCurrency(open.totalCteValue)} helper="envolvido" tone="navy" />
        <MetricCard label="Média em aberto" value={`${open.averageOpenDays} dias`} helper="desde a emissão" />
        <MetricCard label="Mais antiga" value={`${open.oldestOpenDays} dias`} helper="em acompanhamento" tone="gold" />
      </MetricGrid>
      <SectionTitle title="Operações abertas por status" />
      <div className="rba-status-summary-grid">
        {open.byStatus.map((item) => <ReadingCard key={item.key} label={item.label} value={integerFormatter.format(item.orderCount)} description={`${formatCompactCurrency(item.value)} em valor CTE`} tone={item.label.includes('Trânsito') ? 'gold' : item.label.includes('Carregando') ? 'warning' : 'default'} />)}
      </div>
    </PrintPage>
  );
}

function SecondaryAnalysis({ report, totalPages }: { report: GeneratedReport; totalPages: number }) {
  const analytics = report.current;
  let leftTitle = 'Análise complementar';
  let rightTitle = 'Destaques adicionais';
  let leftItems: RankingItem[] = [];
  let rightItems: RankingItem[] = [];
  let leftValue: (item: RankingItem) => number = (item) => item.cteValue;
  let rightValue: (item: RankingItem) => number = (item) => item.cteValue;
  let leftLabel: (item: RankingItem) => string = (item) => formatCompactCurrency(item.cteValue);
  let rightLabel: (item: RankingItem) => string = leftLabel;

  if (report.kind === 'expenses') {
    leftTitle = 'Motoristas com maior despesa'; rightTitle = 'Rotas com maior despesa';
    leftItems = byExpense(analytics.drivers); rightItems = byExpense(analytics.routes);
    leftValue = rightValue = (item) => item.expenses; leftLabel = rightLabel = (item) => formatCompactCurrency(item.expenses);
  } else if (report.kind === 'profits') {
    leftTitle = 'Motoristas com maior lucro'; rightTitle = 'Rotas com maior lucro';
    leftItems = byProfit(analytics.drivers); rightItems = byProfit(analytics.routes);
    leftValue = rightValue = (item) => Math.max(0, item.netValue); leftLabel = rightLabel = (item) => formatCompactCurrency(item.netValue);
  } else if (report.kind === 'clients') {
    leftTitle = 'Clientes recorrentes'; rightTitle = 'Combinações cliente + rota';
    leftItems = recurring(analytics.clients); rightItems = recurring(analytics.clientRoutes);
    leftValue = rightValue = (item) => item.orderCount; leftLabel = rightLabel = (item) => `${integerFormatter.format(item.orderCount)} operações`;
  } else if (report.kind === 'drivers') {
    leftTitle = 'Motoristas recorrentes'; rightTitle = 'Motoristas com maior lucro';
    leftItems = recurring(analytics.drivers); rightItems = byProfit(analytics.drivers);
    leftValue = (item) => item.orderCount; leftLabel = (item) => `${integerFormatter.format(item.orderCount)} operações`;
    rightValue = (item) => Math.max(0, item.netValue); rightLabel = (item) => formatCompactCurrency(item.netValue);
  } else if (report.kind === 'routes') {
    leftTitle = 'Principais origens'; rightTitle = 'Principais destinos';
    leftItems = analytics.origins; rightItems = analytics.destinations;
  } else if (report.kind === 'recurrence') {
    leftTitle = 'Rotas recorrentes'; rightTitle = 'Cliente + rota recorrente';
    leftItems = recurring(analytics.routes); rightItems = recurring(analytics.clientRoutes);
    leftValue = rightValue = (item) => item.orderCount; leftLabel = rightLabel = (item) => `${integerFormatter.format(item.orderCount)} operações`;
  } else if (report.kind === 'in-progress') {
    leftTitle = 'Clientes com operações abertas'; rightTitle = 'Rotas com operações abertas';
    leftItems = analytics.inProgressSummary.byClient; rightItems = analytics.inProgressSummary.byRoute;
  } else {
    leftTitle = 'Clientes'; rightTitle = 'Rotas'; leftItems = analytics.clients; rightItems = analytics.routes;
  }

  return (
    <PrintPage report={report} pageNumber={4} totalPages={totalPages} eyebrow="ANÁLISE COMPLEMENTAR" title="Concentrações e prioridades do modelo" subtitle="Rankings específicos do relatório selecionado">
      <div className="rba-dual-ranking rba-dual-ranking-tall">
        <div><SectionTitle title={leftTitle} /><HorizontalBars items={leftItems} value={leftValue} valueLabel={leftLabel} limit={8} /></div>
        <div><SectionTitle title={rightTitle} /><HorizontalBars items={rightItems} value={rightValue} valueLabel={rightLabel} limit={8} /></div>
      </div>
    </PrintPage>
  );
}

export default function ModelPrintPages({ report, totalPages }: { report: GeneratedReport; totalPages: number }) {
  const catalog = getReportCatalogItem(report.kind);
  const summary = report.current.summary;
  const secondary = report.kind === 'expenses' ? 'expenses' : 'netValue';
  const secondaryLabel = report.kind === 'expenses' ? 'Despesas registradas' : 'Lucro registrado';
  return (
    <>
      <CoverPage
        report={report}
        pageNumber={1}
        totalPages={totalPages}
        title={catalog.title.toUpperCase()}
        subtitle={catalog.description}
        metrics={[
          { label: 'OPERAÇÕES NO PERÍODO', value: integerFormatter.format(summary.totalOrders) },
          { label: 'VALOR CTE CONSOLIDADO', value: formatCompactCurrency(summary.totalCteValue) },
          { label: report.kind === 'expenses' ? 'DESPESAS REGISTRADAS' : 'LUCRO REGISTRADO', value: formatCompactCurrency(report.kind === 'expenses' ? summary.totalExpenses : summary.totalNetValue) },
        ]}
      />
      <OverviewPage report={report} totalPages={totalPages} />
      <PrimaryAnalysis report={report} totalPages={totalPages} />
      <SecondaryAnalysis report={report} totalPages={totalPages} />
      <PrintPage report={report} pageNumber={5} totalPages={totalPages} eyebrow="EVOLUÇÃO E COMPARAÇÃO" title="Comportamento do período" subtitle="Série temporal e variações frente às bases disponíveis">
        <TrendChart points={report.current.timeSeries} secondary={secondary} secondaryLabel={secondaryLabel} />
        <div className="rba-comparison-box rba-comparison-box-spaced"><ComparisonGrid report={report} /></div>
      </PrintPage>
      <PrintPage report={report} pageNumber={6} totalPages={totalPages} eyebrow="INSIGHTS E PRIORIDADES" title="Leitura gerencial recomendada" subtitle="Pontos fortes, riscos e prioridades derivados da base filtrada">
        <InsightAgenda insights={report.insights} limit={6} />
      </PrintPage>
      <PrintPage report={report} pageNumber={7} totalPages={totalPages} eyebrow="GOVERNANÇA E INTEGRIDADE" title="Confiança para decisão executiva" subtitle="Fonte única, rastreabilidade, transparência e confidencialidade">
        <GovernancePanel />
      </PrintPage>
    </>
  );
}
