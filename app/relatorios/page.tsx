'use client';

import { useEffect, useState } from 'react';

import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import ReportBuilder from '@/components/reports/ReportBuilder';
import ReportDashboard from '@/components/reports/ReportDashboard';
import ReportPrintDocument from '@/components/reports/ReportPrintDocument';
import { formatFreightOrderEmissionDate, getFreightOrderEmissionDateValue } from '@/lib/freightOrderDates';
import { normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { buildReportAnalytics } from '@/lib/reporting/analytics';
import { serializeReportModelCsv } from '@/lib/reporting/csv';
import { buildReportComparison, buildReportInsights } from '@/lib/reporting/insights';
import { buildReportingOrders, filterReportingOrders, type ReportOrderSource } from '@/lib/reporting/orders';
import {
  getCustomRange,
  getMonthRange,
  getPreviousEquivalentRange,
  getPreviousMonthRange,
  getPreviousYearRange,
  getYearRange,
} from '@/lib/reporting/periods';
import type {
  DateRange,
  GeneratedReport,
  ReportConfiguration,
  ReportingOrder,
} from '@/lib/reporting/types';

interface SelectOption {
  id: string;
  name: string;
}

const buildInitialConfig = (): ReportConfiguration => {
  const currentDate = new Date();
  return {
    kind: 'executive',
    periodMode: 'month',
    monthValue: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
    yearValue: String(currentDate.getFullYear()),
    startDate: '',
    endDate: '',
    clientId: '',
    driverId: '',
    status: '',
    origin: '',
    destination: '',
    search: '',
    includePrevious: true,
    includePreviousYear: true,
    includeDetails: false,
    rankingLimit: 10,
  };
};

const resolvePeriod = (config: ReportConfiguration): DateRange => {
  if (config.periodMode === 'month') {
    const [year, month] = config.monthValue.split('-').map(Number);
    if (!year || !month) throw new Error('Selecione um mês válido.');
    return getMonthRange(year, month);
  }

  if (config.periodMode === 'year') {
    const year = Number(config.yearValue);
    if (!year) throw new Error('Informe um ano válido.');
    return getYearRange(year);
  }

  if (!config.startDate || !config.endDate) throw new Error('Informe a data inicial e a data final.');
  return getCustomRange(config.startDate, config.endDate);
};

const resolvePreviousPeriod = (config: ReportConfiguration, period: DateRange): DateRange => {
  if (config.periodMode === 'month') {
    const [year, month] = config.monthValue.split('-').map(Number);
    return getPreviousMonthRange(year, month);
  }
  if (config.periodMode === 'year') {
    return getYearRange(Number(config.yearValue) - 1);
  }
  return getPreviousEquivalentRange(period);
};

const fetchJson = async <Result,>(url: string): Promise<Result> => {
  const response = await fetch(url, { cache: 'no-store' });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error?: unknown }).error || '')
      : '';
    throw new Error(apiError || `Falha ao carregar ${url}.`);
  }
  return payload as Result;
};

const buildOrdersUrl = (config: ReportConfiguration, range: DateRange): string => {
  const params = new URLSearchParams({
    page_size: '10000',
    start_date: range.startDate,
    end_date: range.endDate,
  });
  if (config.clientId) params.set('client_id', config.clientId);
  if (config.driverId) params.set('driver_id', config.driverId);
  if (config.status) params.set('status', config.status);
  return `/api/orders?${params.toString()}`;
};

const fetchReportingOrders = async (config: ReportConfiguration, range: DateRange): Promise<ReportingOrder[]> => {
  const payload = await fetchJson<ReportOrderSource[]>(buildOrdersUrl(config, range));
  const rawOrders = Array.isArray(payload) ? payload : [];
  const orders = buildReportingOrders(rawOrders, {
    normalizeStatus: (status) => normalizeFreightOrderStatus(typeof status === 'string' ? status : ''),
    formatEmissionDate: (order) => formatFreightOrderEmissionDate(order as never),
    getEmissionDateValue: (order) => getFreightOrderEmissionDateValue(order as never) || '',
  });
  return filterReportingOrders(orders, {
    origin: config.origin,
    destination: config.destination,
    search: config.search,
  });
};

const optionName = (options: SelectOption[], id: string, fallback: string): string =>
  options.find((option) => option.id === id)?.name || fallback;

const buildFiltersLabel = (
  config: ReportConfiguration,
  clients: SelectOption[],
  drivers: SelectOption[],
): string => {
  const labels = [
    config.clientId ? `Cliente: ${optionName(clients, config.clientId, 'Selecionado')}` : 'Todos os clientes',
    config.driverId ? `Motorista: ${optionName(drivers, config.driverId, 'Selecionado')}` : 'Todos os motoristas',
    config.status ? `Status: ${config.status}` : 'Todos os status',
  ];
  if (config.origin) labels.push(`Origem contém: ${config.origin}`);
  if (config.destination) labels.push(`Destino contém: ${config.destination}`);
  if (config.search) labels.push(`Busca: ${config.search}`);
  return labels.join(' · ');
};

const generateReportData = async (
  config: ReportConfiguration,
  clients: SelectOption[],
  drivers: SelectOption[],
): Promise<GeneratedReport> => {
  const period = resolvePeriod(config);
  const previousPeriod = config.includePrevious ? resolvePreviousPeriod(config, period) : null;
  const previousYearPeriod = config.includePreviousYear ? getPreviousYearRange(period) : null;

  const [orders, previousOrders, previousYearOrders] = await Promise.all([
    fetchReportingOrders(config, period),
    previousPeriod ? fetchReportingOrders(config, previousPeriod) : Promise.resolve([]),
    previousYearPeriod ? fetchReportingOrders(config, previousYearPeriod) : Promise.resolve([]),
  ]);

  const current = buildReportAnalytics(orders);
  const previous = previousOrders.length > 0 ? buildReportAnalytics(previousOrders) : null;
  const previousYear = previousYearOrders.length > 0 ? buildReportAnalytics(previousYearOrders) : null;

  return {
    kind: config.kind,
    period,
    previousPeriod,
    previousYearPeriod,
    filtersLabel: buildFiltersLabel(config, clients, drivers),
    generatedAt: new Date(),
    orders,
    current,
    previous,
    previousYear,
    previousComparison: previous ? buildReportComparison(current, previous) : null,
    previousYearComparison: previousYear ? buildReportComparison(current, previousYear) : null,
    insights: buildReportInsights(current, previous, previousYear),
    includeDetails: config.includeDetails,
    rankingLimit: config.rankingLimit,
  };
};

const buildExportFileName = (report: GeneratedReport, extension: 'csv' | 'xlsx' | 'pdf'): string =>
  `rba-${report.kind}-${report.period.startDate}-${report.period.endDate}.${extension}`;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function ReportsPage() {
  const [config, setConfig] = useState<ReportConfiguration>(() => buildInitialConfig());
  const [clients, setClients] = useState<SelectOption[]>([]);
  const [drivers, setDrivers] = useState<SelectOption[]>([]);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setErrorMessage('');
          const [clientPayload, driverPayload] = await Promise.all([
            fetchJson<SelectOption[]>('/api/clients'),
            fetchJson<SelectOption[]>('/api/drivers'),
          ]);
          const safeClients = Array.isArray(clientPayload) ? clientPayload : [];
          const safeDrivers = Array.isArray(driverPayload) ? driverPayload : [];
          const initialConfig = buildInitialConfig();
          const initialReport = await generateReportData(initialConfig, safeClients, safeDrivers);
          if (cancelled) return;
          setClients(safeClients);
          setDrivers(safeDrivers);
          setConfig(initialConfig);
          setReport(initialReport);
        } catch (error) {
          if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar a central de relatórios.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const changeConfig = <Key extends keyof ReportConfiguration>(key: Key, value: ReportConfiguration[Key]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setReport(await generateReportData(config, clients, drivers));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao gerar o relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const nextConfig = buildInitialConfig();
    setConfig(nextConfig);
    window.setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          setErrorMessage('');
          setReport(await generateReportData(nextConfig, clients, drivers));
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Erro inesperado ao limpar os filtros.');
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
  };

  const handleExportCsv = () => {
    if (!report) return;
    const csv = serializeReportModelCsv(report.kind, report.orders, report.current);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), buildExportFileName(report, 'csv'));
  };

  const handleExportExcel = async () => {
    if (!report) return;
    try {
      setExportingExcel(true);
      setErrorMessage('');
      const { buildReportWorkbookBuffer } = await import('@/lib/reporting/excel');
      const buffer = await buildReportWorkbookBuffer({
        kind: report.kind,
        periodLabel: report.period.label,
        filtersLabel: report.filtersLabel,
        orders: report.orders,
        current: report.current,
        previous: report.previous,
        previousYear: report.previousYear,
        insights: report.insights,
      });
      downloadBlob(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        buildExportFileName(report, 'xlsx'),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível gerar o arquivo Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const generatedAt = new Date();
    setReport((current) => current ? { ...current, generatedAt } : current);
    document.querySelectorAll<HTMLElement>('[data-dynamic-generated-at]').forEach((element) => {
      element.textContent = `Emitido em ${generatedAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    });
    const previousTitle = document.title;
    document.title = buildExportFileName({ ...report, generatedAt }, 'pdf').replace(/\.pdf$/, '');
    let restored = false;
    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = previousTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
    window.setTimeout(restoreTitle, 2500);
  };

  return (
    <HeaderAndSidebar>
      <div id="reports-module" className="min-w-0 space-y-5 pb-12">
        <ReportBuilder
          config={config}
          clients={clients}
          drivers={drivers}
          loading={loading}
          exportingExcel={exportingExcel}
          hasReport={Boolean(report)}
          errorMessage={errorMessage}
          onChange={changeConfig}
          onGenerate={handleGenerate}
          onReset={handleReset}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
        />

        {report && <ReportDashboard report={report} />}
        {report && <ReportPrintDocument report={report} />}

        {!report && !loading && !errorMessage && (
          <div className="report-screen-only rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-black text-slate-700">Configure os filtros e gere o primeiro relatório.</p>
          </div>
        )}
      </div>
    </HeaderAndSidebar>
  );
}
