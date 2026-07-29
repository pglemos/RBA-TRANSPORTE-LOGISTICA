'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import {
  ArrowDownToLine,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileCheck,
  FileWarning,
  Filter,
  LoaderCircle,
  Printer,
  ReceiptText,
  RotateCcw,
  Truck,
  WalletCards,
} from 'lucide-react';

import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import RBALogo from '@/components/RBALogo';
import {
  FREIGHT_ORDER_STATUSES,
  getFreightStatusMeta,
  normalizeFreightOrderStatus,
} from '@/lib/freightStatus';
import {
  formatFreightOrderEmissionDate,
  getFreightOrderEmissionDateValue,
} from '@/lib/freightOrderDates';
import {
  buildReportFileName,
  buildReportRows,
  buildReportSummary,
  serializeReportCsv,
  type ReportOrderInput,
  type ReportRow,
} from '@/lib/reportExport';

interface ReportOrder extends ReportOrderInput {
  id: string;
  client_id?: string;
  status?: string | null;
  created_at?: string | null;
  emission_day?: string | number | null;
  emission_month?: string | null;
  emission_year?: string | number | null;
}

interface ClientOption {
  id: string;
  name: string;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('pt-BR');

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatDateInput = (dateValue: string) => {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  return year && month && day ? `${day}/${month}/${year}` : dateValue;
};

const formatGeneratedAt = (date: Date) =>
  date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function FinancialMetric({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 break-words text-xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</p>
    </div>
  );
}

function OperationalMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[9px] font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function ScreenReportTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.12em] text-slate-900">Viagens consolidadas</h2>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            {integerFormatter.format(rows.length)} registros com valores reproduzidos do sistema.
          </p>
        </div>
        <span className="text-[10px] font-bold text-slate-500">Valores em reais (R$)</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <FileWarning className="h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-700">Nenhuma viagem encontrada</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Ajuste os filtros para gerar o relatório. O arquivo CSV continuará disponível com o cabeçalho estrutural.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] w-full text-left text-[11px] text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                <th className="px-3 py-3">CTE / Ficha</th>
                <th className="px-3 py-3">Emissão</th>
                <th className="px-3 py-3">Motorista</th>
                <th className="px-3 py-3">Origem / Destino</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3 text-right">Valor CTE</th>
                <th className="px-3 py-3 text-right">Frete</th>
                <th className="px-3 py-3 text-right">Adiant.</th>
                <th className="px-3 py-3 text-right">À vista</th>
                <th className="px-3 py-3 text-right">Saldo</th>
                <th className="px-3 py-3 text-right">Despesas</th>
                <th className="px-3 py-3 text-right">Líquido</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const statusMeta = getFreightStatusMeta(row.status);
                return (
                  <tr key={row.id || `${row.orderNumber}-${row.cteNumber}`} className="align-top transition hover:bg-slate-50">
                    <td className="px-3 py-3">
                      {row.id ? (
                        <Link href={`/ordens/${row.id}`} className="font-black text-[#8a6725] hover:underline">
                          {row.cteNumber !== 'A emitir' ? row.cteNumber : `#${row.orderNumber}`}
                        </Link>
                      ) : (
                        <span className="font-black text-slate-900">{row.cteNumber}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-500">{row.emissionDate}</td>
                    <td className="max-w-48 px-3 py-3 font-bold text-slate-900">{row.driverName}</td>
                    <td className="max-w-64 px-3 py-3 leading-relaxed">
                      <span className="font-semibold text-slate-900">{row.origin || 'N/A'}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span>{row.destination || 'N/A'}</span>
                    </td>
                    <td className="max-w-44 px-3 py-3">{row.clientName}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-black text-slate-950">{formatCurrency(row.cteValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{formatCurrency(row.freightValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(row.advanceValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(row.cashValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-amber-800">{formatCurrency(row.balanceValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">{formatCurrency(row.totalExpenses)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-black text-emerald-800">{formatCurrency(row.netValue)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedAt, setGeneratedAt] = useState(() => new Date());

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [ordersResponse, clientsResponse] = await Promise.all([
        fetch('/api/orders?page_size=1000', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
      ]);

      const [ordersPayload, clientsPayload] = await Promise.all([
        ordersResponse.json(),
        clientsResponse.json(),
      ]);

      if (!ordersResponse.ok || !clientsResponse.ok) {
        const apiMessage = ordersPayload?.error || clientsPayload?.error;
        throw new Error(apiMessage || 'Não foi possível carregar os dados do relatório.');
      }

      setOrders(Array.isArray(ordersPayload) ? ordersPayload : []);
      setClients(Array.isArray(clientsPayload) ? clientsPayload : []);
    } catch (error) {
      setOrders([]);
      setClients([]);
      setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao carregar o relatório.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReportData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReportData]);

  const dateFilterError = startDate && endDate && startDate > endDate
    ? 'A data inicial não pode ser posterior à data final.'
    : '';

  const filteredOrders = useMemo(() => {
    if (dateFilterError) return [];

    return orders.filter((order) => {
      const matchesClient = !selectedClient || order.client_id === selectedClient;
      const matchesStatus = !statusFilter || normalizeFreightOrderStatus(order.status) === statusFilter;
      if (!matchesClient || !matchesStatus) return false;

      if (!startDate && !endDate) return true;
      const emissionDate = getFreightOrderEmissionDateValue(order);
      if (!emissionDate) return false;
      if (startDate && emissionDate < startDate) return false;
      if (endDate && emissionDate > endDate) return false;
      return true;
    });
  }, [dateFilterError, endDate, orders, selectedClient, startDate, statusFilter]);

  const ordersWithoutDateCount = useMemo(() => {
    if ((!startDate && !endDate) || dateFilterError) return 0;

    return orders.filter((order) => {
      const matchesClient = !selectedClient || order.client_id === selectedClient;
      const matchesStatus = !statusFilter || normalizeFreightOrderStatus(order.status) === statusFilter;
      return matchesClient && matchesStatus && !getFreightOrderEmissionDateValue(order);
    }).length;
  }, [dateFilterError, endDate, orders, selectedClient, startDate, statusFilter]);

  const reportRows = useMemo(
    () => buildReportRows(filteredOrders, {
      normalizeStatus: (status) => normalizeFreightOrderStatus(typeof status === 'string' ? status : ''),
      formatEmissionDate: (order) => formatFreightOrderEmissionDate(order as ReportOrder),
    }),
    [filteredOrders],
  );

  const summary = useMemo(() => buildReportSummary(reportRows), [reportRows]);

  const selectedClientName = useMemo(
    () => clients.find((client) => client.id === selectedClient)?.name || 'Todos os clientes',
    [clients, selectedClient],
  );

  const selectedStatusName = statusFilter
    ? getFreightStatusMeta(statusFilter).label
    : 'Todos os status';

  const periodDescription = startDate || endDate
    ? `${startDate ? formatDateInput(startDate) : 'Início'} até ${endDate ? formatDateInput(endDate) : 'Fim'}`
    : 'Todo o período';

  const exportDisabled = loading || Boolean(dateFilterError);

  const handleExportCsv = useCallback(() => {
    if (exportDisabled) return;

    const exportDate = new Date();
    setGeneratedAt(exportDate);
    const csv = serializeReportCsv(reportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildReportFileName('csv', exportDate);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [exportDisabled, reportRows]);

  const handlePrintReport = useCallback(() => {
    if (exportDisabled) return;

    const exportDate = new Date();
    flushSync(() => setGeneratedAt(exportDate));
    const previousTitle = document.title;
    document.title = buildReportFileName('pdf', exportDate).replace(/\.pdf$/, '');
    let titleRestored = false;

    const restoreTitle = () => {
      if (titleRestored) return;
      titleRestored = true;
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 2000);
  }, [exportDisabled]);

  const clearFilters = () => {
    setSelectedClient('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <HeaderAndSidebar>
      <div id="reports-module" className="space-y-6">
        <div className="report-screen-only space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white md:px-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d8b45d] text-slate-950 shadow-lg shadow-black/20">
                    <BarChart3 className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d8b45d]">Inteligência operacional RBA</p>
                    <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Relatório Executivo de Fretes</h1>
                    <p className="mt-2 max-w-3xl text-xs font-medium leading-relaxed text-slate-300">
                      Visão consolidada para gestão, auditoria e diretoria. Todos os valores reproduzem os campos registrados nas ordens do sistema, sem um segundo cálculo financeiro no relatório.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exportDisabled}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    disabled={exportDisabled}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d8b45d] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-950 shadow-lg shadow-black/20 transition hover:bg-[#e2c475] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d8b45d]/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4" />
                    Gerar PDF Executivo
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1.4fr_auto] xl:items-end xl:p-6">
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Cliente tomador</span>
                <span className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#c5a866] focus-within:ring-4 focus-within:ring-[#c5a866]/15">
                  <Filter className="h-4 w-4 shrink-0 text-slate-400" />
                  <select value={selectedClient} onChange={(event) => setSelectedClient(event.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none">
                    <option value="">Todos os clientes</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </span>
              </label>

              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Status operacional</span>
                <span className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#c5a866] focus-within:ring-4 focus-within:ring-[#c5a866]/15">
                  <FileCheck className="h-4 w-4 shrink-0 text-slate-400" />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none">
                    <option value="">Todos os status</option>
                    {FREIGHT_ORDER_STATUSES.map((status) => <option key={status} value={status}>{getFreightStatusMeta(status).label}</option>)}
                  </select>
                </span>
              </label>

              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Período de emissão</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#c5a866] focus-within:ring-4 focus-within:ring-[#c5a866]/15">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                    <input aria-label="Data inicial" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="min-w-0 w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none" />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-[#c5a866] focus-within:ring-4 focus-within:ring-[#c5a866]/15">
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                    <input aria-label="Data final" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="min-w-0 w-full bg-transparent text-[11px] font-bold text-slate-800 outline-none" />
                  </label>
                </div>
              </div>

              <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200">
                <RotateCcw className="h-4 w-4" />
                Limpar
              </button>
            </div>
          </section>

          <div aria-live="polite" className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-10 text-xs font-bold text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin text-[#8a6725]" />
                Carregando dados registrados nas ordens...
              </div>
            )}

            {errorMessage && !loading && (
              <div className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-rose-900">Falha ao carregar o relatório</p>
                  <p className="mt-1 text-xs font-semibold text-rose-700">{errorMessage}</p>
                </div>
                <button type="button" onClick={() => void loadReportData()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-[10px] font-black uppercase tracking-[0.08em] text-white hover:bg-rose-800">
                  <RotateCcw className="h-4 w-4" />
                  Tentar novamente
                </button>
              </div>
            )}

            {dateFilterError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">{dateFilterError}</div>
            )}

            {ordersWithoutDateCount > 0 && !dateFilterError && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-900">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {ordersWithoutDateCount} {ordersWithoutDateCount === 1 ? 'ordem foi excluída' : 'ordens foram excluídas'} do período porque não possuem data de emissão válida.{' '}
                  <Link href="/ordens" className="underline underline-offset-2 hover:no-underline">Revisar ordens</Link>.
                </span>
              </div>
            )}
          </div>

          {!loading && !errorMessage && (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <FinancialMetric label="Valor CTE consolidado" value={formatCurrency(summary.totalCteValue)} helper="Soma dos valores CTE registrados nas ordens filtradas." icon={CircleDollarSign} accent="bg-slate-100 text-slate-700" />
                <FinancialMetric label="Frete dos motoristas" value={formatCurrency(summary.totalFreightValue)} helper="Soma do campo de frete registrado em cada ordem." icon={Truck} accent="bg-blue-50 text-blue-700" />
                <FinancialMetric label="Adiantamentos registrados" value={formatCurrency(summary.totalAdvanceValue)} helper="Valores de adiantamento já informados nas fichas." icon={WalletCards} accent="bg-cyan-50 text-cyan-700" />
                <FinancialMetric label="Saldos registrados" value={formatCurrency(summary.totalBalanceValue)} helper="Soma do campo de saldo a pagar retornado pelo sistema." icon={ReceiptText} accent="bg-amber-50 text-amber-800" />
                <FinancialMetric label="Pagamentos à vista" value={formatCurrency(summary.totalCashValue)} helper="Soma do campo de pagamento à vista registrado." icon={CheckCircle2} accent="bg-violet-50 text-violet-700" />
                <FinancialMetric label="Despesas registradas" value={formatCurrency(summary.totalExpenses)} helper="Total de despesas já consolidado pelo sistema por ordem." icon={FileWarning} accent="bg-rose-50 text-rose-700" />
                <FinancialMetric label="Líquido registrado" value={formatCurrency(summary.totalNetValue)} helper="Soma do valor líquido devolvido pelo sistema, sem recálculo no relatório." icon={BadgeDollarSign} accent="bg-emerald-50 text-emerald-800" />
                <FinancialMetric label="CTE médio" value={formatCurrency(summary.averageCteValue)} helper="Média gerencial do valor CTE entre os registros filtrados." icon={BarChart3} accent="bg-[#fff7df] text-[#8a6725]" />
              </section>

              <section className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
                <OperationalMetric label="Total de registros" value={integerFormatter.format(summary.totalOrders)} helper="Viagens no filtro atual" />
                <OperationalMetric label="Entregues" value={integerFormatter.format(summary.deliveredCount)} helper={`${summary.deliveredPercent.toLocaleString('pt-BR')}% do total`} />
                <OperationalMetric label="Em trânsito" value={integerFormatter.format(summary.inTransitCount)} helper="Operação em andamento" />
                <OperationalMetric label="Carregando" value={integerFormatter.format(summary.loadingCount)} helper="Em fase de carregamento" />
                <OperationalMetric label="A contratar" value={integerFormatter.format(summary.contractingCount)} helper="Pendentes de contratação" />
              </section>

              <ScreenReportTable rows={reportRows} />
            </>
          )}
        </div>

        <section id="report-print-target" className="report-print-only" aria-label="Relatório executivo para impressão">
          <header className="report-print-header">
            <div className="report-print-brand">
              <RBALogo className="report-print-logo" />
              <div className="report-print-title-block">
                <p className="report-print-kicker">RBA TRANSPORTE & LOGÍSTICA</p>
                <h1>Relatório Executivo Consolidado de Fretes</h1>
                <p>Gestão operacional, financeira e acompanhamento de viagens</p>
              </div>
            </div>
            <div className="report-print-meta">
              <strong>Emitido em {formatGeneratedAt(generatedAt)}</strong>
              <span>Documento interno - uso gerencial</span>
              <span>RBA Fretes Digital</span>
            </div>
          </header>

          <div className="report-print-filters">
            <span><strong>Cliente:</strong> {selectedClientName}</span>
            <span><strong>Status:</strong> {selectedStatusName}</span>
            <span><strong>Período:</strong> {periodDescription}</span>
            <span><strong>Registros:</strong> {integerFormatter.format(reportRows.length)}</span>
          </div>

          <div className="report-print-financials">
            <div><span>Valor CTE</span><strong>{formatCurrency(summary.totalCteValue)}</strong><small>Registrado</small></div>
            <div><span>Frete motorista</span><strong>{formatCurrency(summary.totalFreightValue)}</strong><small>Registrado</small></div>
            <div><span>Adiantamentos</span><strong>{formatCurrency(summary.totalAdvanceValue)}</strong><small>Registrados</small></div>
            <div><span>Saldos</span><strong>{formatCurrency(summary.totalBalanceValue)}</strong><small>Registrados</small></div>
            <div><span>Despesas</span><strong>{formatCurrency(summary.totalExpenses)}</strong><small>Consolidadas pelo sistema</small></div>
            <div className="report-print-highlight"><span>Líquido</span><strong>{formatCurrency(summary.totalNetValue)}</strong><small>Registrado</small></div>
          </div>

          <div className="report-print-operations">
            <span><strong>{summary.deliveredCount}</strong> entregues</span>
            <span><strong>{summary.inTransitCount}</strong> em trânsito</span>
            <span><strong>{summary.loadingCount}</strong> carregando</span>
            <span><strong>{summary.contractingCount}</strong> a contratar</span>
            <span><strong>{summary.deliveredPercent.toLocaleString('pt-BR')}%</strong> concluídas</span>
            <span><strong>{formatCurrency(summary.averageCteValue)}</strong> CTE médio</span>
          </div>

          <table className="report-print-table">
            <colgroup>
              <col className="report-col-reference" />
              <col className="report-col-date" />
              <col className="report-col-driver" />
              <col className="report-col-route" />
              <col className="report-col-client" />
              <col className="report-col-money" />
              <col className="report-col-money" />
              <col className="report-col-money-small" />
              <col className="report-col-money-small" />
              <col className="report-col-money-small" />
              <col className="report-col-money" />
              <col className="report-col-money" />
              <col className="report-col-status" />
            </colgroup>
            <thead>
              <tr>
                <th>CTE / Ficha</th>
                <th>Emissão</th>
                <th>Motorista</th>
                <th>Origem / Destino</th>
                <th>Cliente</th>
                <th className="report-number">CTE</th>
                <th className="report-number">Frete</th>
                <th className="report-number">Adiant.</th>
                <th className="report-number">À vista</th>
                <th className="report-number">Saldo</th>
                <th className="report-number">Despesas</th>
                <th className="report-number">Líquido</th>
                <th className="report-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.length === 0 ? (
                <tr><td colSpan={13} className="report-print-empty">Nenhuma viagem atende aos filtros aplicados.</td></tr>
              ) : reportRows.map((row) => (
                <tr key={`print-${row.id || `${row.orderNumber}-${row.cteNumber}`}`}>
                  <td className="report-reference">{row.cteNumber !== 'A emitir' ? row.cteNumber : `#${row.orderNumber}`}</td>
                  <td className="report-date">{row.emissionDate}</td>
                  <td>{row.driverName}</td>
                  <td><strong>{row.origin || 'N/A'}</strong><span className="report-route-arrow"> → </span>{row.destination || 'N/A'}</td>
                  <td>{row.clientName}</td>
                  <td className="report-number report-strong">{formatCurrency(row.cteValue)}</td>
                  <td className="report-number">{formatCurrency(row.freightValue)}</td>
                  <td className="report-number">{formatCurrency(row.advanceValue)}</td>
                  <td className="report-number">{formatCurrency(row.cashValue)}</td>
                  <td className="report-number">{formatCurrency(row.balanceValue)}</td>
                  <td className="report-number">{formatCurrency(row.totalExpenses)}</td>
                  <td className="report-number report-net">{formatCurrency(row.netValue)}</td>
                  <td className={`report-status report-status-${row.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}`}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="report-print-closing">
            <div className="report-print-source">
              <strong>Fonte e integridade dos dados</strong>
              <p>
                Este documento apresenta os valores retornados pelas ordens, fichas, CTEs e manifestos registrados no RBA Fretes Digital. O relatório apenas organiza e agrega os campos recebidos da API; não executa um segundo cálculo financeiro por viagem.
              </p>
            </div>
            <div className="report-print-signatures">
              <div><span />Responsável operacional</div>
              <div><span />Conferência financeira</div>
              <div><span />Aprovação da diretoria</div>
            </div>
            <div className="report-print-document-id">
              <span>RBA TRANSPORTE & LOGÍSTICA - RELATÓRIO EXECUTIVO</span>
              <span>Gerado em {formatGeneratedAt(generatedAt)}</span>
            </div>
          </footer>
        </section>
      </div>
    </HeaderAndSidebar>
  );
}
