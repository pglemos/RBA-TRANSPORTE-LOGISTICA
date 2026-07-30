import type { ReactNode } from 'react';

import RBALogo from '@/components/RBALogo';
import type {
  ComparisonMetric,
  GeneratedReport,
  RankingItem,
  ReportInsight,
  TimeSeriesPoint,
} from '@/lib/reporting/types';

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const integerFormatter = new Intl.NumberFormat('pt-BR');
export const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export const formatCurrency = (value: number) => currencyFormatter.format(value);
export const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;
export const formatCompactCurrency = (value: number) => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mi`;
  if (absolute >= 1_000) return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return formatCurrency(value);
};

export const formatGeneratedAt = (date: Date) => date.toLocaleString('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export const formatDelta = (metric: ComparisonMetric | null | undefined): string => {
  if (!metric || metric.percentChange === null) return 'Sem base';
  return `${metric.percentChange > 0 ? '+' : ''}${formatPercent(metric.percentChange)}`;
};

export function CoverPage({
  report,
  title,
  subtitle,
  pageNumber,
  totalPages,
  metrics,
}: {
  report: GeneratedReport;
  title: string;
  subtitle: string;
  pageNumber: number;
  totalPages: number;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <article className="rba-print-page rba-cover-page">
      <div className="rba-cover-orbit rba-cover-orbit-one" />
      <div className="rba-cover-orbit rba-cover-orbit-two" />
      <div className="rba-cover-topline">
        <RBALogo className="rba-cover-logo" />
        <span>PERFORMANCE LOGÍSTICA · VISÃO EXECUTIVA</span>
      </div>
      <div className="rba-cover-content">
        <p className="rba-cover-kicker">RBA TRANSPORTE & LOGÍSTICA</p>
        <h1>{title}</h1>
        <p className="rba-cover-subtitle">{subtitle}</p>
        <div className="rba-cover-metrics">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rba-cover-bottom">
        <div>
          <span>Período analisado</span>
          <strong>{report.period.label}</strong>
          <small>{report.filtersLabel}</small>
        </div>
        <div className="rba-cover-confidential">
          <span>Documento confidencial preparado para Diretoria e liderança executiva</span>
          <strong>RBA FRETES DIGITAL · {report.generatedAt.getFullYear()}</strong>
          <small>{pageNumber.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}</small>
        </div>
      </div>
    </article>
  );
}

export function PrintPage({
  report,
  pageNumber,
  totalPages,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}: {
  report: GeneratedReport;
  pageNumber: number;
  totalPages: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`rba-print-page ${className}`.trim()}>
      <header className="rba-page-header">
        <div className="rba-page-brand">
          <RBALogo className="rba-page-logo" />
          <div>
            <p>RBA TRANSPORTE & LOGÍSTICA</p>
            <span>{eyebrow}</span>
          </div>
        </div>
        <div className="rba-page-heading">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="rba-page-meta">
          <strong>{report.period.label}</strong>
          <span>{report.filtersLabel}</span>
          <small data-dynamic-generated-at>Emitido em {formatGeneratedAt(report.generatedAt)}</small>
        </div>
      </header>
      <main className="rba-page-body">{children}</main>
      <footer className="rba-page-footer">
        <span>RBA TRANSPORTE & LOGÍSTICA · RELATÓRIO EXECUTIVO CONFIDENCIAL</span>
        <strong>{pageNumber.toString().padStart(2, '0')} / {totalPages.toString().padStart(2, '0')}</strong>
      </footer>
    </article>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = 'default',
}: {
  label: string;
  value: string;
  helper: string;
  tone?: 'default' | 'gold' | 'positive' | 'warning' | 'navy';
}) {
  return (
    <div className={`rba-metric-card rba-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

export function MetricGrid({ children, columns = 4 }: { children: ReactNode; columns?: 3 | 4 | 5 | 6 }) {
  return <div className={`rba-metric-grid rba-grid-${columns}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rba-section-title">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function HorizontalBars({
  items,
  value,
  valueLabel,
  limit = 10,
}: {
  items: RankingItem[];
  value: (item: RankingItem) => number;
  valueLabel: (item: RankingItem) => string;
  limit?: number;
}) {
  const visible = items.slice(0, limit);
  const max = Math.max(1, ...visible.map(value));
  return (
    <div className="rba-bars">
      {visible.map((item, index) => {
        const current = value(item);
        return (
          <div className="rba-bar-row" key={item.key}>
            <span className="rba-bar-position">{String(index + 1).padStart(2, '0')}</span>
            <div className="rba-bar-label" title={item.label}>{item.label}</div>
            <div className="rba-bar-track"><span style={{ width: `${Math.max(2, (current / max) * 100)}%` }} /></div>
            <strong>{valueLabel(item)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function buildPolyline(points: TimeSeriesPoint[], getter: (point: TimeSeriesPoint) => number, width: number, height: number): string {
  if (points.length === 0) return '';
  const values = points.map(getter);
  const max = Math.max(1, ...values);
  const usableWidth = width - 80;
  const usableHeight = height - 70;
  return points.map((point, index) => {
    const x = 50 + (points.length === 1 ? usableWidth / 2 : (index / (points.length - 1)) * usableWidth);
    const y = 20 + usableHeight - (getter(point) / max) * usableHeight;
    return `${x},${y}`;
  }).join(' ');
}

export function TrendChart({
  points,
  secondary = 'netValue',
  secondaryLabel = 'Lucro registrado',
}: {
  points: TimeSeriesPoint[];
  secondary?: 'netValue' | 'expenses';
  secondaryLabel?: string;
}) {
  const width = 940;
  const height = 275;
  if (points.length === 0) return <div className="rba-empty-state">Sem dados suficientes para evolução temporal.</div>;
  const cteLine = buildPolyline(points, (point) => point.cteValue, width, height);
  const secondaryLine = buildPolyline(points, (point) => point[secondary], width, height);
  return (
    <div className="rba-chart-card">
      <svg className="rba-trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução temporal do período">
        {[0, 1, 2, 3, 4].map((line) => <line key={line} x1="50" x2="910" y1={25 + line * 47} y2={25 + line * 47} className="rba-chart-gridline" />)}
        <polyline points={cteLine} className="rba-chart-line rba-chart-line-primary" />
        <polyline points={secondaryLine} className="rba-chart-line rba-chart-line-secondary" />
        {points.map((point, index) => {
          const x = 50 + (points.length === 1 ? 430 : (index / (points.length - 1)) * 860);
          return <text key={point.key} x={x} y="260" textAnchor="middle" className="rba-chart-label">{point.label.replace('Semana de ', '')}</text>;
        })}
      </svg>
      <div className="rba-chart-legend">
        <span><i className="rba-legend-primary" /> Valor CTE</span>
        <span><i className="rba-legend-secondary" /> {secondaryLabel}</span>
      </div>
    </div>
  );
}

export function ComparisonGrid({ report }: { report: GeneratedReport }) {
  const rows = [
    ['Operações', report.previousComparison?.totalOrders, report.previousYearComparison?.totalOrders],
    ['Valor CTE', report.previousComparison?.totalCteValue, report.previousYearComparison?.totalCteValue],
    ['Lucro líquido', report.previousComparison?.totalNetValue, report.previousYearComparison?.totalNetValue],
    ['Despesas', report.previousComparison?.totalExpenses, report.previousYearComparison?.totalExpenses],
    ['Margem', report.previousComparison?.marginPercent, report.previousYearComparison?.marginPercent],
    ['Entregues', report.previousComparison?.deliveredPercent, report.previousYearComparison?.deliveredPercent],
  ] as const;
  return (
    <div className="rba-comparison-grid">
      <div className="rba-comparison-head"><span>Indicador</span><span>Período anterior</span><span>Mesmo período do ano anterior</span></div>
      {rows.map(([label, previous, previousYear]) => (
        <div className="rba-comparison-row" key={label}>
          <strong>{label}</strong>
          <span>{formatDelta(previous)}</span>
          <span>{formatDelta(previousYear)}</span>
        </div>
      ))}
    </div>
  );
}

const insightLabels: Record<ReportInsight['kind'], string> = {
  strength: 'Ponto forte',
  highlight: 'Destaque',
  attention: 'Ponto de atenção',
  opportunity: 'Oportunidade',
  priority: 'Prioridade sugerida',
  info: 'Informação',
};

export function InsightAgenda({ insights, limit = 6 }: { insights: ReportInsight[]; limit?: number }) {
  return (
    <div className="rba-insight-agenda">
      {insights.slice(0, limit).map((insight, index) => (
        <article key={insight.id} className={`rba-insight-item rba-insight-${insight.kind}`}>
          <span className="rba-insight-number">{index + 1}</span>
          <div>
            <small>{insightLabels[insight.kind]}</small>
            <h3>{insight.title}</h3>
            <p>{insight.description}</p>
            <strong>{insight.evidence}</strong>
          </div>
        </article>
      ))}
    </div>
  );
}

export function GovernancePanel() {
  return (
    <div className="rba-governance-layout">
      <div className="rba-governance-lead">
        <span>1</span>
        <div>
          <h3>O relatório não recalcula a operação</h3>
          <p>Os valores financeiros são apresentados a partir dos campos retornados pelas ordens, fichas, CTEs e manifestos. O documento organiza, consolida e comunica; não substitui o motor financeiro do sistema.</p>
        </div>
      </div>
      <div className="rba-governance-grid">
        <article><h4>Fonte única</h4><p>Dados oriundos do RBA Fretes Digital e da exportação oficial do período.</p></article>
        <article><h4>Rastreabilidade</h4><p>Cada linha permanece vinculada à ordem, CTE ou manifesto, motorista, rota e cliente.</p></article>
        <article><h4>Transparência</h4><p>Indicadores gerenciais são identificados como consolidações, médias, percentuais ou comparações.</p></article>
        <article><h4>Confidencialidade</h4><p>Documento destinado à Diretoria, liderança e partes expressamente autorizadas.</p></article>
      </div>
    </div>
  );
}

export function ReadingCard({ label, value, description, tone = 'default' }: { label: string; value: string; description: string; tone?: 'default' | 'gold' | 'positive' | 'warning' }) {
  return (
    <article className={`rba-reading-card rba-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}
