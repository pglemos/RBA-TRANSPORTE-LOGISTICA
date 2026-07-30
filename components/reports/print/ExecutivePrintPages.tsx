import type { CSSProperties } from 'react';

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

function sumOrders(items: RankingItem[], predicate: (item: RankingItem) => boolean): number {
  return items.filter(predicate).reduce((total, item) => total + item.orderCount, 0);
}

function countItems(items: RankingItem[], predicate: (item: RankingItem) => boolean): number {
  return items.filter(predicate).length;
}

export default function ExecutivePrintPages({ report, totalPages }: { report: GeneratedReport; totalPages: number }) {
  const analytics = report.current;
  const summary = analytics.summary;
  const topClients = analytics.clients.slice(0, 10);
  const topDrivers = analytics.drivers.slice(0, 10);
  const recurringOnce = sumOrders(analytics.drivers, (item) => item.orderCount === 1);
  const recurringTwice = sumOrders(analytics.drivers, (item) => item.orderCount === 2);
  const recurringMore = sumOrders(analytics.drivers, (item) => item.orderCount >= 3);
  const singleTripDrivers = countItems(analytics.drivers, (item) => item.orderCount === 1);
  const twoTripDrivers = countItems(analytics.drivers, (item) => item.orderCount === 2);
  const threePlusDrivers = countItems(analytics.drivers, (item) => item.orderCount >= 3);
  const activeOrders = summary.totalOrders - summary.deliveredCount;
  const topClient = analytics.clients[0];
  const topOrigin = analytics.origins[0];
  const topDestination = analytics.destinations[0];
  const peakCte = [...analytics.timeSeries].sort((a, b) => b.cteValue - a.cteValue)[0];
  const peakProfit = [...analytics.timeSeries].sort((a, b) => b.netValue - a.netValue)[0];

  return (
    <>
      <CoverPage
        report={report}
        pageNumber={1}
        totalPages={totalPages}
        title="RELATÓRIO EXECUTIVO DE PERFORMANCE LOGÍSTICA"
        subtitle="Indicadores financeiros, operação, carteira, rotas, capacidade de execução e agenda de prioridades para a Diretoria."
        metrics={[
          { label: 'VALOR CTE CONSOLIDADO', value: formatCompactCurrency(summary.totalCteValue) },
          { label: 'OPERAÇÕES REGISTRADAS', value: integerFormatter.format(summary.totalOrders) },
          { label: 'OPERAÇÕES CONCLUÍDAS', value: formatPercent(summary.deliveredPercent) },
        ]}
      />

      <PrintPage report={report} pageNumber={2} totalPages={totalPages} eyebrow="PAINEL DA DIRETORIA" title="Visão executiva do período" subtitle="Leitura rápida dos principais resultados consolidados">
        <MetricGrid columns={4}>
          <MetricCard label="Valor CTE" value={formatCompactCurrency(summary.totalCteValue)} helper={`${integerFormatter.format(summary.totalOrders)} operações registradas`} tone="navy" />
          <MetricCard label="Lucro registrado" value={formatCompactCurrency(summary.totalNetValue)} helper="Campo consolidado da operação" tone="positive" />
          <MetricCard label="Margem registrada" value={formatPercent(summary.marginPercent)} helper="Lucro registrado / valor CTE" tone="gold" />
          <MetricCard label="Ticket médio CTE" value={formatCurrency(summary.averageCteValue)} helper="Média por operação" />
        </MetricGrid>
        <div className="rba-overview-split">
          <div className="rba-status-panel">
            <SectionTitle title="Status operacional" subtitle={`Distribuição das ${integerFormatter.format(summary.totalOrders)} operações no período`} />
            <div className="rba-status-donut" style={{ '--rba-progress': `${Math.max(0, Math.min(100, summary.deliveredPercent)) * 3.6}deg` } as CSSProperties}>
              <div><strong>{formatPercent(summary.deliveredPercent)}</strong><span>CONCLUÍDAS</span></div>
            </div>
            <div className="rba-status-legend">
              <span><i className="rba-status-delivered" /> Entregues <strong>{summary.deliveredCount}</strong></span>
              <span><i className="rba-status-transit" /> Em trânsito <strong>{summary.inTransitCount}</strong></span>
              <span><i className="rba-status-loading" /> Carregando <strong>{summary.loadingCount}</strong></span>
              <span><i className="rba-status-contract" /> Contratar <strong>{summary.contractingCount}</strong></span>
            </div>
          </div>
          <div>
            <SectionTitle title="Leitura executiva" />
            <div className="rba-reading-grid">
              <ReadingCard label="Clientes ativos" value={integerFormatter.format(analytics.clients.length)} description={`O maior cliente representa ${formatPercent(analytics.recurrence.leadingClientDependencyPercent)} do valor CTE.`} tone="gold" />
              <ReadingCard label="Rotas distintas" value={integerFormatter.format(analytics.routes.length)} description={`${integerFormatter.format(summary.totalOrders)} operações distribuídas pela malha.`} />
              <ReadingCard label="Motoristas" value={integerFormatter.format(analytics.drivers.length)} description={`${integerFormatter.format(analytics.recurrence.drivers)} motoristas recorrentes no período.`} />
              <ReadingCard label="Operações em andamento" value={integerFormatter.format(activeOrders)} description="Pipeline que exige acompanhamento de status e exceções." tone={activeOrders > 0 ? 'warning' : 'positive'} />
            </div>
          </div>
        </div>
      </PrintPage>

      <PrintPage report={report} pageNumber={3} totalPages={totalPages} eyebrow="RESULTADO FINANCEIRO" title="Performance financeira consolidada" subtitle="Valores apresentados conforme os campos registrados nas ordens">
        <SectionTitle title="Estrutura de valores do período" subtitle="Comparativo dos principais campos financeiros registrados" />
        <div className="rba-financial-strip">
          {[
            ['CTE', summary.totalCteValue],
            ['Dedução registrada', summary.totalRecordedDiscountValue],
            ['Receita líquida', summary.totalNetRevenue],
            ['Frete', summary.totalFreightValue],
            ['Pagamentos classificados', summary.totalClassifiedPaymentValue],
            ['Não classificado', summary.totalUnclassifiedPaymentValue],
            ['Despesas', summary.totalExpenses],
            ['Lucro registrado', summary.totalNetValue],
          ].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{formatCompactCurrency(Number(value))}</strong></div>)}
        </div>
        <MetricGrid columns={3}>
          <MetricCard label="Margem registrada" value={formatPercent(summary.marginPercent)} helper="Indicador gerencial sobre CTE" tone="gold" />
          <MetricCard label="Lucro médio" value={formatCurrency(summary.averageNetValue)} helper="Por operação registrada" tone="positive" />
          <MetricCard label="Despesa / CTE" value={formatPercent(summary.expenseRatioPercent)} helper="Participação das despesas registradas" />
        </MetricGrid>
        <div className="rba-payment-composition">
          <SectionTitle title="Composição de pagamentos" subtitle={`${formatPercent(summary.paymentCoveragePercent)} do frete está classificado; ${integerFormatter.format(summary.unclassifiedPaymentOrderCount)} ordem(ns) possuem diferença.`} />
          <div className="rba-payment-bar">
            <span style={{ flex: Math.max(1, summary.totalAdvanceValue) }}>Adiantamentos <strong>{formatCompactCurrency(summary.totalAdvanceValue)}</strong></span>
            <span style={{ flex: Math.max(1, summary.totalCashValue) }}>À vista <strong>{formatCompactCurrency(summary.totalCashValue)}</strong></span>
            <span style={{ flex: Math.max(1, summary.totalBalanceValue) }}>Saldo a pagar <strong>{formatCompactCurrency(summary.totalBalanceValue)}</strong></span>
            <span className="rba-payment-unclassified" style={{ flex: Math.max(1, summary.totalUnclassifiedPaymentValue) }}>Não classificado <strong>{formatCompactCurrency(summary.totalUnclassifiedPaymentValue)}</strong></span>
          </div>
        </div>
      </PrintPage>

      <PrintPage report={report} pageNumber={4} totalPages={totalPages} eyebrow="EXECUÇÃO OPERACIONAL" title="Eficiência, andamento e capacidade" subtitle="Acompanhamento da entrega e do volume operacional">
        <MetricGrid columns={5}>
          <MetricCard label="Concluídas" value={integerFormatter.format(summary.deliveredCount)} helper={formatPercent(summary.deliveredPercent)} tone="positive" />
          <MetricCard label="Em andamento" value={integerFormatter.format(activeOrders)} helper="trânsito + carregando + contratar" tone="warning" />
          <MetricCard label="Clientes" value={integerFormatter.format(analytics.clients.length)} helper="carteira atendida" />
          <MetricCard label="Motoristas" value={integerFormatter.format(analytics.drivers.length)} helper="rede mobilizada" />
          <MetricCard label="Rotas" value={integerFormatter.format(analytics.routes.length)} helper="origem → destino" />
        </MetricGrid>
        <div className="rba-operation-layout">
          <div>
            <SectionTitle title="Cadência semanal de operações" subtitle="Quantidade de ordens por semana de emissão" />
            <HorizontalBars items={analytics.timeSeries.map((point) => ({ key: point.key, label: point.label.replace('Semana de ', ''), orderCount: point.orderCount, cteValue: point.cteValue, netValue: point.netValue, expenses: point.expenses, averageCteValue: point.orderCount ? point.cteValue / point.orderCount : 0, sharePercent: 0 }))} value={(item) => item.orderCount} valueLabel={(item) => `${integerFormatter.format(item.orderCount)} operações`} limit={8} />
          </div>
          <div className="rba-pipeline-panel">
            <span>PIPELINE OPERACIONAL</span>
            <strong>{integerFormatter.format(activeOrders)}</strong>
            <small>operações em andamento</small>
            <div><p>Entregues</p><b>{summary.deliveredCount}</b></div>
            <div><p>Em trânsito</p><b>{summary.inTransitCount}</b></div>
            <div><p>Carregando</p><b>{summary.loadingCount}</b></div>
            <div><p>Contratar</p><b>{summary.contractingCount}</b></div>
          </div>
        </div>
        <div className="rba-highlight-band"><span>DESTAQUE DE EXECUÇÃO</span><strong>{formatPercent(summary.deliveredPercent)} das operações estão marcadas como entregues</strong></div>
      </PrintPage>

      <PrintPage report={report} pageNumber={5} totalPages={totalPages} eyebrow="CARTEIRA DE CLIENTES" title="Concentração e relevância comercial" subtitle="Participação dos principais clientes no valor CTE consolidado">
        <div className="rba-two-column-wide">
          <div>
            <SectionTitle title="Top 10 clientes por valor CTE" subtitle="Valor consolidado e número de operações por cliente" />
            <HorizontalBars items={topClients} value={(item) => item.cteValue} valueLabel={(item) => `${formatCompactCurrency(item.cteValue)} · ${item.orderCount} op.`} />
          </div>
          <div className="rba-side-stack">
            <MetricCard label="Clientes atendidos" value={integerFormatter.format(analytics.clients.length)} helper="Carteira no período" />
            <MetricCard label="Maior cliente" value={topClient?.label || 'Sem base'} helper={topClient ? formatCompactCurrency(topClient.cteValue) : 'Sem movimentação'} tone="gold" />
            <MetricCard label="Dependência principal" value={formatPercent(analytics.recurrence.leadingClientDependencyPercent)} helper="Participação do maior cliente" tone={analytics.recurrence.leadingClientDependencyPercent > 40 ? 'warning' : 'positive'} />
            <ReadingCard label="Leitura comercial" value={topClient?.label || 'Sem base'} description={`A concentração principal é de ${formatPercent(analytics.recurrence.leadingClientDependencyPercent)}. Priorizar retenção das contas-chave sem interromper a diversificação.`} tone="gold" />
          </div>
        </div>
      </PrintPage>

      <PrintPage report={report} pageNumber={6} totalPages={totalPages} eyebrow="INTELIGÊNCIA DE MALHA" title="Rotas, origens e destinos" subtitle="Leitura da distribuição geográfica das operações">
        <MetricGrid columns={3}>
          <MetricCard label="Rotas distintas" value={integerFormatter.format(analytics.routes.length)} helper={`${integerFormatter.format(summary.totalOrders)} operações no período`} tone="navy" />
          <MetricCard label="Principal origem" value={topOrigin?.label || 'Sem base'} helper={topOrigin ? formatCompactCurrency(topOrigin.cteValue) : 'Sem movimentação'} tone="gold" />
          <MetricCard label="Principal destino" value={topDestination?.label || 'Sem base'} helper={topDestination ? formatCompactCurrency(topDestination.cteValue) : 'Sem movimentação'} />
        </MetricGrid>
        <div className="rba-dual-ranking">
          <div><SectionTitle title="Principais origens" /><HorizontalBars items={analytics.origins} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} limit={7} /></div>
          <div><SectionTitle title="Principais destinos" /><HorizontalBars items={analytics.destinations} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} limit={7} /></div>
        </div>
      </PrintPage>

      <PrintPage report={report} pageNumber={7} totalPages={totalPages} eyebrow="CAPACIDADE DE TRANSPORTE" title="Rede de motoristas mobilizada" subtitle="Distribuição de volume e recorrência operacional">
        <div className="rba-two-column-wide">
          <div><SectionTitle title="Motoristas com maior valor CTE movimentado" subtitle="Visão de volume no período, sem substituir avaliação qualitativa" /><HorizontalBars items={topDrivers} value={(item) => item.cteValue} valueLabel={(item) => formatCompactCurrency(item.cteValue)} /></div>
          <div className="rba-side-stack">
            <MetricCard label="Motoristas únicos" value={integerFormatter.format(analytics.drivers.length)} helper="Rede mobilizada no período" tone="navy" />
            <div className="rba-recurrence-card">
              <span>RECORRÊNCIA OPERACIONAL</span>
              <div><strong>{singleTripDrivers}</strong><p>motoristas · {recurringOnce} operações com 1 viagem</p></div>
              <div><strong>{twoTripDrivers}</strong><p>motoristas · {recurringTwice} operações com 2 viagens</p></div>
              <div><strong>{threePlusDrivers}</strong><p>motoristas · {recurringMore} operações com 3 ou mais</p></div>
            </div>
            <ReadingCard label="Leitura de capacidade" value={`${integerFormatter.format(analytics.recurrence.drivers)} recorrentes`} description="A rede amplia cobertura, mas exige disciplina de cadastro, documentação, homologação e qualidade operacional." />
          </div>
        </div>
      </PrintPage>

      <PrintPage report={report} pageNumber={8} totalPages={totalPages} eyebrow="EVOLUÇÃO TEMPORAL" title="Ritmo de receita e lucro registrado" subtitle="Evolução semanal no período analisado">
        <SectionTitle title="Evolução semanal consolidada" subtitle="Valor CTE e lucro registrado por semana de emissão" />
        <TrendChart points={analytics.timeSeries} />
        <MetricGrid columns={3}>
          <MetricCard label="Maior semana em CTE" value={peakCte ? formatCompactCurrency(peakCte.cteValue) : 'Sem base'} helper={peakCte?.label || 'Sem dados'} tone="navy" />
          <MetricCard label="Melhor semana em lucro" value={peakProfit ? formatCompactCurrency(peakProfit.netValue) : 'Sem base'} helper={peakProfit?.label || 'Sem dados'} tone="positive" />
          <MetricCard label="Média semanal de operações" value={analytics.timeSeries.length ? (summary.totalOrders / analytics.timeSeries.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'} helper="operações emitidas" tone="gold" />
        </MetricGrid>
      </PrintPage>

      <PrintPage report={report} pageNumber={9} totalPages={totalPages} eyebrow="AGENDA EXECUTIVA" title="Insights e prioridades sugeridas" subtitle="Pontos de atenção derivados exclusivamente dos dados consolidados">
        <InsightAgenda insights={report.insights} limit={6} />
        <div className="rba-comparison-box"><SectionTitle title="Comparações do período" /><ComparisonGrid report={report} /></div>
      </PrintPage>

      <PrintPage report={report} pageNumber={10} totalPages={totalPages} eyebrow="GOVERNANÇA E INTEGRIDADE" title="Confiança para decisão executiva" subtitle="Fonte única, rastreabilidade, transparência e confidencialidade">
        <GovernancePanel report={report} />
      </PrintPage>
    </>
  );
}
