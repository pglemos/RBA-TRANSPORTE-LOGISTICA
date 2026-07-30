import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Minus,
  ReceiptText,
  Repeat2,
  Route,
  Truck,
  Users,
} from 'lucide-react';

import { getFreightStatusMeta } from '@/lib/freightStatus';
import { getReportCatalogItem } from '@/lib/reporting/catalog';
import type {
  BreakdownItem,
  ComparisonMetric,
  GeneratedReport,
  RankingItem,
  ReportComparison,
  ReportingOrder,
  TimeSeriesPoint,
} from '@/lib/reporting/types';
import ReportInsights from './ReportInsights';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const integerFormatter = new Intl.NumberFormat('pt-BR');
const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const DAY_MS = 24 * 60 * 60 * 1000;

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatPercent = (value: number) => `${percentFormatter.format(value)}%`;
const safeMetricPercent = (value: number, total: number) => total !== 0 ? (value / total) * 100 : 0;

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof BarChart3;
  accent: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 break-words text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</p>
    </article>
  );
}

function Delta({ metric, inverse = false }: { metric: ComparisonMetric | null; inverse?: boolean }) {
  if (!metric || metric.percentChange === null) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500"><Minus className="h-3 w-3" /> Sem base</span>;
  }

  const positive = metric.percentChange > 0;
  const favorable = inverse ? !positive : positive;
  const Icon = positive ? ArrowUpRight : metric.percentChange < 0 ? ArrowDownRight : Minus;
  const className = metric.percentChange === 0
    ? 'bg-slate-100 text-slate-600'
    : favorable
      ? 'bg-emerald-50 text-emerald-800'
      : 'bg-red-50 text-red-800';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black ${className}`}>
      <Icon className="h-3 w-3" />
      {metric.percentChange > 0 ? '+' : ''}{formatPercent(metric.percentChange)}
    </span>
  );
}

function ComparisonPanel({ report }: { report: GeneratedReport }) {
  const rows: Array<{ label: string; key: keyof ReportComparison; inverse?: boolean }> = [
    { label: 'Operações', key: 'totalOrders' },
    { label: 'Valor CTE', key: 'totalCteValue' },
    { label: 'Lucro registrado', key: 'totalNetValue' },
    { label: 'Despesas', key: 'totalExpenses', inverse: true },
    { label: 'Margem', key: 'marginPercent' },
    { label: 'Entregues', key: 'deliveredPercent' },
  ];

  if (!report.previousComparison && !report.previousYearComparison) return null;

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9e8245]">Comparações</p>
        <h2 className="mt-1 break-words text-lg font-black text-slate-950">Variação frente às bases históricas</h2>
        <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-slate-500">
          Relatórios mensais usam o mês-calendário anterior. Períodos personalizados usam uma janela anterior equivalente. A comparação anual preserva as mesmas datas.
        </p>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="bg-slate-950 text-white">
            <tr>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em]">Indicador</th>
              <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.1em]">Período anterior</th>
              <th className="px-4 py-3 text-center text-[9px] font-black uppercase tracking-[0.1em]">Ano anterior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.label} className="bg-white even:bg-slate-50">
                <td className="px-4 py-3 font-black text-slate-800">{row.label}</td>
                <td className="px-4 py-3 text-center"><Delta metric={report.previousComparison?.[row.key] || null} inverse={row.inverse} /></td>
                <td className="px-4 py-3 text-center"><Delta metric={report.previousYearComparison?.[row.key] || null} inverse={row.inverse} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RankingList({
  title,
  helper,
  items,
  valueKey = 'cteValue',
}: {
  title: string;
  helper: string;
  items: RankingItem[];
  valueKey?: 'cteValue' | 'netValue' | 'expenses' | 'orderCount';
}) {
  const total = items.reduce((sum, item) => sum + Number(item[valueKey]), 0);
  const maximum = Math.max(1, ...items.map((item) => Math.abs(Number(item[valueKey]))));
  const metricLabel = valueKey === 'expenses'
    ? 'das despesas deste ranking'
    : valueKey === 'netValue'
      ? 'do lucro deste ranking'
      : valueKey === 'orderCount'
        ? 'das operações deste ranking'
        : 'do valor CTE deste ranking';

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="break-words text-sm font-black text-slate-950">{title}</h2>
      <p className="mt-1 break-words text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</p>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-xs font-bold text-slate-500">Sem dados para este ranking.</p>
        ) : items.map((item, index) => {
          const value = Number(item[valueKey]);
          const width = Math.max(3, Math.min(100, (Math.abs(value) / maximum) * 100));
          const participation = safeMetricPercent(value, total);
          const formattedValue = valueKey === 'orderCount' ? `${integerFormatter.format(value)} operações` : formatCurrency(value);
          return (
            <div key={item.key} className="min-w-0">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-950 text-[9px] font-black text-[#d7be82]">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="break-words text-[11px] font-black leading-snug text-slate-800">{item.label}</p>
                    <p className="mt-0.5 break-words text-[9px] font-semibold text-slate-500">{formatPercent(participation)} {metricLabel}</p>
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-slate-900">{formattedValue}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#c5a866]" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PerformanceTable({ title, helper, items }: { title: string; helper: string; items: RankingItem[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 className="break-words text-sm font-black text-slate-950">{title}</h2>
        <p className="mt-1 break-words text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[10px]">
          <thead className="bg-slate-950 text-white">
            <tr><th className="px-3 py-3 font-black uppercase">Nome</th><th className="px-3 py-3 text-center font-black uppercase">Operações</th><th className="px-3 py-3 text-right font-black uppercase">Valor CTE</th><th className="px-3 py-3 text-right font-black uppercase">Ticket médio</th><th className="px-3 py-3 text-right font-black uppercase">Despesas</th><th className="px-3 py-3 text-right font-black uppercase">Lucro</th><th className="px-3 py-3 text-right font-black uppercase">Participação</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.key} className="align-top even:bg-slate-50">
                <td className="max-w-80 break-words px-3 py-3 font-black text-slate-800">{item.label}</td><td className="px-3 py-3 text-center font-bold">{integerFormatter.format(item.orderCount)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black">{formatCurrency(item.cteValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(item.averageCteValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(item.expenses)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black text-emerald-800">{formatCurrency(item.netValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatPercent(item.sharePercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendTable({ points, title = 'Evolução semanal' }: { points: TimeSeriesPoint[]; title?: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="break-words text-sm font-black text-slate-950">{title}</h2><p className="mt-1 break-words text-[10px] font-semibold text-slate-500">Cadência de operações, valor CTE, despesas e lucro líquido registrado.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[10px]"><thead className="bg-slate-950 text-white"><tr><th className="px-3 py-3 font-black uppercase">Semana</th><th className="px-3 py-3 text-center font-black uppercase">Operações</th><th className="px-3 py-3 text-right font-black uppercase">Valor CTE</th><th className="px-3 py-3 text-right font-black uppercase">Despesas</th><th className="px-3 py-3 text-right font-black uppercase">Lucro</th></tr></thead><tbody className="divide-y divide-slate-100">{points.map((point) => <tr key={point.key} className="even:bg-slate-50"><td className="break-words px-3 py-3 font-black text-slate-800">{point.label}</td><td className="px-3 py-3 text-center">{integerFormatter.format(point.orderCount)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black">{formatCurrency(point.cteValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(point.expenses)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black text-emerald-800">{formatCurrency(point.netValue)}</td></tr>)}</tbody></table></div>
    </section>
  );
}

function BreakdownGrid({ title, helper, items, valueMode = 'currency' }: { title: string; helper: string; items: BreakdownItem[]; valueMode?: 'currency' | 'count' }) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="break-words text-sm font-black text-slate-950">{title}</h2><p className="mt-1 break-words text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</p><div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.key} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="break-words text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">{item.label}</p><p className="mt-2 break-words text-lg font-black text-slate-950">{valueMode === 'currency' ? formatCurrency(item.value) : integerFormatter.format(item.orderCount)}</p><p className="mt-1 break-words text-[9px] font-semibold text-slate-500">{formatPercent(item.sharePercent)} do total analisado</p></div>)}</div></section>
  );
}

function StatusOverview({ report }: { report: GeneratedReport }) {
  return <BreakdownGrid title="Situação operacional" helper="Distribuição das ordens conforme o status registrado." items={report.current.statuses} valueMode="count" />;
}

function calculateOpenDays(order: ReportingOrder, reference: Date): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order.emissionDateValue)) return 0;
  const [year, month, day] = order.emissionDateValue.split('-').map(Number);
  const start = Date.UTC(year, month - 1, day);
  const end = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return end >= start ? Math.floor((end - start) / DAY_MS) : 0;
}

function InProgressTable({ report }: { report: GeneratedReport }) {
  const orders = report.current.inProgress;
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="break-words text-sm font-black text-slate-950">Operações que exigem acompanhamento</h2><p className="mt-1 break-words text-[10px] font-semibold text-slate-500">Contratar, Carregando e Em Trânsito no período selecionado.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1020px] text-left text-[10px]"><thead className="bg-slate-950 text-white"><tr><th className="px-3 py-3 font-black uppercase">CTE / Ficha</th><th className="px-3 py-3 font-black uppercase">Emissão</th><th className="px-3 py-3 text-center font-black uppercase">Dias em aberto</th><th className="px-3 py-3 font-black uppercase">Cliente</th><th className="px-3 py-3 font-black uppercase">Motorista</th><th className="px-3 py-3 font-black uppercase">Rota</th><th className="px-3 py-3 text-right font-black uppercase">Valor CTE</th><th className="px-3 py-3 text-center font-black uppercase">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => { const statusMeta = getFreightStatusMeta(order.status); return <tr key={order.id} className="align-top even:bg-slate-50"><td className="max-w-40 break-words px-3 py-3 font-black text-[#8a6725]"><Link href={`/ordens/${order.id}`} className="hover:underline">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</Link></td><td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-500">{order.emissionDate}</td><td className="px-3 py-3 text-center font-black text-orange-800">{calculateOpenDays(order, report.generatedAt)}</td><td className="max-w-44 break-words px-3 py-3 font-bold text-slate-800">{order.clientName}</td><td className="max-w-44 break-words px-3 py-3">{order.driverName}</td><td className="max-w-64 break-words px-3 py-3">{order.origin} → {order.destination}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black">{formatCurrency(order.cteValue)}</td><td className="px-3 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusMeta.className}`}>{statusMeta.label}</span></td></tr>; })}</tbody></table></div></section>
  );
}

function DetailTable({ orders }: { orders: ReportingOrder[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="break-words text-sm font-black text-slate-950">Base detalhada das ordens</h2><p className="mt-1 break-words text-[10px] font-semibold text-slate-500">Valores reproduzidos dos registros do sistema, sem um segundo cálculo financeiro.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-[10px]"><thead className="bg-slate-950 text-white"><tr><th className="px-3 py-3 font-black uppercase">Referência</th><th className="px-3 py-3 font-black uppercase">Emissão</th><th className="px-3 py-3 font-black uppercase">Cliente</th><th className="px-3 py-3 font-black uppercase">Motorista</th><th className="px-3 py-3 font-black uppercase">Rota</th><th className="px-3 py-3 text-right font-black uppercase">CTE</th><th className="px-3 py-3 text-right font-black uppercase">Frete</th><th className="px-3 py-3 text-right font-black uppercase">Despesas</th><th className="px-3 py-3 text-right font-black uppercase">Lucro</th><th className="px-3 py-3 text-center font-black uppercase">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => { const statusMeta = getFreightStatusMeta(order.status); return <tr key={order.id} className="align-top even:bg-slate-50"><td className="max-w-40 break-words px-3 py-3 font-black text-[#8a6725]"><Link href={`/ordens/${order.id}`} className="hover:underline">{order.cteNumber !== 'A emitir' ? order.cteNumber : order.orderNumber}</Link></td><td className="whitespace-nowrap px-3 py-3 text-slate-500">{order.emissionDate}</td><td className="max-w-44 break-words px-3 py-3 font-bold">{order.clientName}</td><td className="max-w-44 break-words px-3 py-3">{order.driverName}</td><td className="max-w-64 break-words px-3 py-3">{order.origin} → {order.destination}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black">{formatCurrency(order.cteValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(order.freightValue)}</td><td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(order.totalExpenses)}</td><td className="whitespace-nowrap px-3 py-3 text-right font-black text-emerald-800">{formatCurrency(order.netValue)}</td><td className="px-3 py-3 text-center"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusMeta.className}`}>{statusMeta.label}</span></td></tr>; })}</tbody></table></div></section>
  );
}

export default function ReportDashboard({ report }: { report: GeneratedReport }) {
  const catalog = getReportCatalogItem(report.kind);
  const limit = report.rankingLimit;
  const current = report.current;
  const expenseClients = [...current.clients].sort((a, b) => b.expenses - a.expenses).slice(0, limit);
  const expenseDrivers = [...current.drivers].sort((a, b) => b.expenses - a.expenses).slice(0, limit);
  const expenseRoutes = [...current.routes].sort((a, b) => b.expenses - a.expenses).slice(0, limit);
  const profitClients = [...current.clients].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
  const profitDrivers = [...current.drivers].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
  const profitRoutes = [...current.routes].sort((a, b) => b.netValue - a.netValue).slice(0, limit);
  const recurringClients = current.clients.filter((item) => item.orderCount >= 2).slice(0, limit);
  const recurringDrivers = current.drivers.filter((item) => item.orderCount >= 2).slice(0, limit);
  const recurringRoutes = current.routes.filter((item) => item.orderCount >= 2).slice(0, limit);
  const recurringClientRoutes = current.clientRoutes.filter((item) => item.orderCount >= 2).slice(0, limit);

  return (
    <div className="report-screen-only space-y-5">
      <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="bg-slate-950 px-5 py-5 text-white sm:px-6"><div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#d7be82]">{catalog.shortTitle}</p><h2 className="mt-1 break-words text-2xl font-black tracking-tight">{catalog.title}</h2><p className="mt-2 max-w-3xl break-words text-xs font-semibold leading-relaxed text-slate-300">{catalog.description}</p></div><div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:max-w-md"><p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Período e filtros</p><p className="mt-1 break-words text-xs font-black text-white">{report.period.label}</p><p className="mt-1 break-words text-[10px] font-semibold leading-relaxed text-slate-300">{report.filtersLabel}</p></div></div></div></section>

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"><MetricCard label="Operações" value={integerFormatter.format(current.summary.totalOrders)} helper="Registros no período e filtros selecionados." icon={Truck} accent="bg-slate-100 text-slate-800" /><MetricCard label="Valor CTE" value={formatCurrency(current.summary.totalCteValue)} helper="Valor consolidado registrado nas ordens." icon={CircleDollarSign} accent="bg-blue-50 text-blue-800" /><MetricCard label="Lucro registrado" value={formatCurrency(current.summary.totalNetValue)} helper="Soma do lucro líquido persistido no sistema." icon={BadgeDollarSign} accent="bg-emerald-50 text-emerald-800" /><MetricCard label="Despesas" value={formatCurrency(current.summary.totalExpenses)} helper={`${formatPercent(current.summary.expenseRatioPercent)} do valor CTE.`} icon={ReceiptText} accent="bg-amber-50 text-amber-800" /><MetricCard label="Margem gerencial" value={formatPercent(current.summary.marginPercent)} helper="Lucro registrado dividido pelo valor CTE consolidado." icon={BarChart3} accent="bg-violet-50 text-violet-800" /><MetricCard label="Operações entregues" value={formatPercent(current.summary.deliveredPercent)} helper={`${current.summary.deliveredCount} de ${current.summary.totalOrders} operações.`} icon={CheckCircle2} accent="bg-green-50 text-green-800" /></section>

      <ComparisonPanel report={report} />

      {report.kind === 'executive' && <><div className="grid min-w-0 gap-5 xl:grid-cols-3"><StatusOverview report={report} /><RankingList title="Clientes em destaque" helper="Classificação pelo valor CTE registrado." items={current.clients.slice(0, limit)} /><RankingList title="Rotas em destaque" helper="Classificação pelo valor CTE registrado." items={current.routes.slice(0, limit)} /></div><TrendTable points={current.timeSeries} /></>}

      {report.kind === 'expenses' && <><BreakdownGrid title="Composição das despesas" helper="Carga, descarga e outros valores registrados." items={current.expenses} /><div className="grid min-w-0 gap-5 xl:grid-cols-3"><RankingList title="Clientes com maior despesa" helper="Soma das despesas registradas por cliente." items={expenseClients} valueKey="expenses" /><RankingList title="Motoristas com maior despesa" helper="Soma das despesas registradas por motorista." items={expenseDrivers} valueKey="expenses" /><RankingList title="Rotas com maior despesa" helper="Soma das despesas registradas por origem e destino." items={expenseRoutes} valueKey="expenses" /></div><TrendTable points={current.timeSeries} title="Evolução semanal das despesas" /></>}

      {report.kind === 'profits' && <><BreakdownGrid title="Distribuição dos resultados registrados" helper="Operações positivas, neutras e negativas conforme o campo de lucro líquido persistido." items={current.profitBuckets} /><div className="grid min-w-0 gap-5 xl:grid-cols-3"><RankingList title="Clientes com maior lucro" helper="Soma do lucro líquido registrado por cliente." items={profitClients} valueKey="netValue" /><RankingList title="Motoristas com maior lucro" helper="Soma do lucro líquido registrado por motorista." items={profitDrivers} valueKey="netValue" /><RankingList title="Rotas com maior lucro" helper="Soma do lucro líquido registrado por rota." items={profitRoutes} valueKey="netValue" /></div><TrendTable points={current.timeSeries} title="Evolução semanal do lucro registrado" /></>}

      {report.kind === 'clients' && <><section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Clientes ativos" value={integerFormatter.format(current.clients.length)} helper="Clientes com operações no período." icon={Users} accent="bg-blue-50 text-blue-800" /><MetricCard label="Clientes recorrentes" value={integerFormatter.format(current.recurrence.clients)} helper={`${formatPercent(current.recurrence.recurringClientOrderPercent)} das operações pertencem a clientes recorrentes.`} icon={Repeat2} accent="bg-violet-50 text-violet-800" /><MetricCard label="Dependência do principal" value={formatPercent(current.recurrence.leadingClientDependencyPercent)} helper="Participação do cliente com mais operações." icon={BarChart3} accent="bg-amber-50 text-amber-800" /><MetricCard label="Ticket médio" value={formatCurrency(current.summary.averageCteValue)} helper="Média do valor CTE por operação." icon={CircleDollarSign} accent="bg-emerald-50 text-emerald-800" /></section><PerformanceTable title="Performance consolidada por cliente" helper="Volume, participação, ticket, despesas e lucro registrado." items={current.clients.slice(0, limit)} /><RankingList title="Clientes recorrentes" helper="Clientes presentes em duas ou mais operações." items={recurringClients} valueKey="orderCount" /></>}

      {report.kind === 'drivers' && <><section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Motoristas utilizados" value={integerFormatter.format(current.drivers.length)} helper="Motoristas com operações no período." icon={Truck} accent="bg-indigo-50 text-indigo-800" /><MetricCard label="Motoristas recorrentes" value={integerFormatter.format(current.recurrence.drivers)} helper={`${formatPercent(current.recurrence.recurringDriverOrderPercent)} das operações usam motoristas recorrentes.`} icon={Repeat2} accent="bg-violet-50 text-violet-800" /><MetricCard label="Frete registrado" value={formatCurrency(current.summary.totalFreightValue)} helper="Total do frete persistido nas ordens." icon={BadgeDollarSign} accent="bg-blue-50 text-blue-800" /><MetricCard label="Lucro médio" value={formatCurrency(current.summary.averageNetValue)} helper="Média do lucro líquido registrado por operação." icon={BarChart3} accent="bg-emerald-50 text-emerald-800" /></section><PerformanceTable title="Performance consolidada por motorista" helper="Operações, valores movimentados, despesas, ticket e lucro registrado." items={current.drivers.slice(0, limit)} /><RankingList title="Motoristas recorrentes" helper="Motoristas presentes em duas ou mais operações." items={recurringDrivers} valueKey="orderCount" /></>}

      {report.kind === 'routes' && <><section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Rotas utilizadas" value={integerFormatter.format(current.routes.length)} helper="Combinações de origem e destino no período." icon={Route} accent="bg-cyan-50 text-cyan-800" /><MetricCard label="Rotas recorrentes" value={integerFormatter.format(current.recurrence.routes)} helper={`${formatPercent(current.recurrence.recurringRouteOrderPercent)} das operações usam rotas recorrentes.`} icon={Repeat2} accent="bg-violet-50 text-violet-800" /><MetricCard label="Origens distintas" value={integerFormatter.format(current.origins.length)} helper="Pontos de origem identificados." icon={Route} accent="bg-blue-50 text-blue-800" /><MetricCard label="Destinos distintos" value={integerFormatter.format(current.destinations.length)} helper="Pontos de destino identificados." icon={Route} accent="bg-emerald-50 text-emerald-800" /></section><PerformanceTable title="Performance por rota" helper="Volume, ticket, despesas, lucro e participação por origem e destino." items={current.routes.slice(0, limit)} /><div className="grid min-w-0 gap-5 xl:grid-cols-2"><PerformanceTable title="Principais origens" helper="Pontos de origem classificados pelo valor CTE." items={current.origins.slice(0, limit)} /><PerformanceTable title="Principais destinos" helper="Pontos de destino classificados pelo valor CTE." items={current.destinations.slice(0, limit)} /></div><TrendTable points={current.timeSeries} title="Evolução semanal das rotas operadas" /></>}

      {report.kind === 'recurrence' && <><section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Recorrência de clientes" value={formatPercent(current.recurrence.recurringClientOrderPercent)} helper={`${current.recurrence.clients} clientes recorrentes.`} icon={Users} accent="bg-blue-50 text-blue-800" /><MetricCard label="Recorrência de motoristas" value={formatPercent(current.recurrence.recurringDriverOrderPercent)} helper={`${current.recurrence.drivers} motoristas recorrentes.`} icon={Truck} accent="bg-indigo-50 text-indigo-800" /><MetricCard label="Recorrência de rotas" value={formatPercent(current.recurrence.recurringRouteOrderPercent)} helper={`${current.recurrence.routes} rotas recorrentes.`} icon={Route} accent="bg-cyan-50 text-cyan-800" /><MetricCard label="Cliente + rota" value={formatPercent(current.recurrence.recurringClientRouteOrderPercent)} helper={`${current.recurrence.clientRoutes} combinações recorrentes.`} icon={Repeat2} accent="bg-violet-50 text-violet-800" /></section><div className="grid min-w-0 gap-5 xl:grid-cols-2"><RankingList title="Clientes recorrentes" helper="Clientes presentes em duas ou mais operações." items={recurringClients} valueKey="orderCount" /><RankingList title="Motoristas recorrentes" helper="Motoristas presentes em duas ou mais operações." items={recurringDrivers} valueKey="orderCount" /><RankingList title="Rotas recorrentes" helper="Rotas presentes em duas ou mais operações." items={recurringRoutes} valueKey="orderCount" /><RankingList title="Combinações cliente + rota" helper="Relações comerciais e operacionais repetidas no período." items={recurringClientRoutes} valueKey="orderCount" /></div></>}

      {report.kind === 'in-progress' && <><section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Em andamento" value={integerFormatter.format(current.inProgressSummary.totalOrders)} helper="Operações ainda não entregues." icon={Clock3} accent="bg-orange-50 text-orange-800" /><MetricCard label="Valor CTE envolvido" value={formatCurrency(current.inProgressSummary.totalCteValue)} helper="Valor registrado nas operações abertas." icon={CircleDollarSign} accent="bg-blue-50 text-blue-800" /><MetricCard label="Média em aberto" value={`${current.inProgressSummary.averageOpenDays} dias`} helper="Tempo médio desde a emissão." icon={Clock3} accent="bg-amber-50 text-amber-800" /><MetricCard label="Operação mais antiga" value={`${current.inProgressSummary.oldestOpenDays} dias`} helper="Maior tempo em aberto identificado." icon={Clock3} accent="bg-red-50 text-red-800" /></section><BreakdownGrid title="Operações abertas por status" helper="Distribuição das operações que exigem acompanhamento." items={current.inProgressSummary.byStatus} valueMode="count" /><div className="grid min-w-0 gap-5 xl:grid-cols-2"><RankingList title="Clientes com operações abertas" helper="Agrupamento pelo valor CTE das operações em andamento." items={current.inProgressSummary.byClient.slice(0, limit)} /><RankingList title="Rotas com operações abertas" helper="Agrupamento pelo valor CTE das operações em andamento." items={current.inProgressSummary.byRoute.slice(0, limit)} /></div><InProgressTable report={report} /></>}

      <ReportInsights insights={report.insights} />
      {report.includeDetails && report.kind !== 'in-progress' && <DetailTable orders={report.orders} />}
    </div>
  );
}
