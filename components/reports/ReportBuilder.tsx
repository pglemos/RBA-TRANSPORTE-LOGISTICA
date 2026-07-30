'use client';

import {
  ArrowDownToLine,
  CalendarRange,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Printer,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

import { FREIGHT_ORDER_STATUSES, getFreightStatusMeta } from '@/lib/freightStatus';
import { REPORT_CATALOG } from '@/lib/reporting/catalog';
import type { ReportConfiguration } from '@/lib/reporting/types';

interface SelectOption {
  id: string;
  name: string;
}

interface ReportBuilderProps {
  config: ReportConfiguration;
  clients: SelectOption[];
  drivers: SelectOption[];
  loading: boolean;
  exportingExcel: boolean;
  hasReport: boolean;
  errorMessage: string;
  onChange: <Key extends keyof ReportConfiguration>(key: Key, value: ReportConfiguration[Key]) => void;
  onGenerate: () => void;
  onReset: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

const fieldClassName = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#c5a866] focus:ring-4 focus:ring-[#c5a866]/15';
const labelClassName = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.11em] text-slate-500';

function Toggle({
  checked,
  label,
  helper,
  onChange,
}: {
  checked: boolean;
  label: string;
  helper: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#c5a866]/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#9e8245] focus:ring-[#c5a866]"
      />
      <span className="min-w-0">
        <span className="block break-words text-xs font-black text-slate-900">{label}</span>
        <span className="mt-0.5 block break-words text-[10px] font-semibold leading-relaxed text-slate-500">{helper}</span>
      </span>
    </label>
  );
}

export default function ReportBuilder({
  config,
  clients,
  drivers,
  loading,
  exportingExcel,
  hasReport,
  errorMessage,
  onChange,
  onGenerate,
  onReset,
  onExportCsv,
  onExportExcel,
  onPrint,
}: ReportBuilderProps) {
  return (
    <section className="report-screen-only space-y-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#d7be82]">
                <Sparkles className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em]">Central inteligente de relatórios</p>
              </div>
              <h1 className="mt-2 break-words text-2xl font-black tracking-tight sm:text-3xl">Relatórios dinâmicos RBA</h1>
              <p className="mt-2 max-w-3xl break-words text-xs font-semibold leading-relaxed text-slate-300 sm:text-sm">
                Escolha o modelo, o período e os filtros. A mesma seleção será usada na tela, no CSV, no Excel e no PDF.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <CalendarRange className="h-5 w-5 text-[#d7be82]" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Fonte</p>
                <p className="text-xs font-black text-white">Ordens, CTEs e manifestos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-[#d7be82]">1</span>
              <div className="min-w-0">
                <h2 className="break-words text-sm font-black text-slate-950">Escolha o relatório pronto</h2>
                <p className="break-words text-[10px] font-semibold text-slate-500">Cada modelo altera indicadores, rankings, insights e colunas exportadas.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {REPORT_CATALOG.map((item) => {
                const selected = config.kind === item.kind;
                return (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => onChange('kind', item.kind)}
                    className={`min-w-0 rounded-2xl border p-4 text-left transition ${selected ? 'border-[#c5a866] bg-[#fffaf0] shadow-sm ring-2 ring-[#c5a866]/20' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <span className={`min-w-0 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${item.accent}`}>{item.shortTitle}</span>
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${selected ? 'bg-[#c5a866]' : 'bg-slate-200'}`} />
                    </div>
                    <p className="mt-3 break-words text-xs font-black leading-snug text-slate-950">{item.title}</p>
                    <p className="mt-1.5 break-words text-[10px] font-semibold leading-relaxed text-slate-500">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-[#d7be82]">2</span>
              <div className="min-w-0">
                <h2 className="break-words text-sm font-black text-slate-950">Defina o período</h2>
                <p className="break-words text-[10px] font-semibold text-slate-500">Mês específico, ano ou intervalo personalizado.</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-wrap gap-2">
                {([
                  ['month', 'Mês'],
                  ['year', 'Ano'],
                  ['custom', 'Personalizado'],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange('periodMode', mode)}
                    className={`rounded-xl px-4 py-2 text-xs font-black transition ${config.periodMode === mode ? 'bg-slate-950 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {config.periodMode === 'month' && (
                  <div className="min-w-0 sm:col-span-2">
                    <label htmlFor="report-month" className={labelClassName}>Mês do relatório</label>
                    <input id="report-month" type="month" value={config.monthValue} onChange={(event) => onChange('monthValue', event.target.value)} className={fieldClassName} />
                  </div>
                )}
                {config.periodMode === 'year' && (
                  <div className="min-w-0 sm:col-span-2">
                    <label htmlFor="report-year" className={labelClassName}>Ano do relatório</label>
                    <input id="report-year" type="number" min="2000" max="9999" value={config.yearValue} onChange={(event) => onChange('yearValue', event.target.value)} className={fieldClassName} />
                  </div>
                )}
                {config.periodMode === 'custom' && (
                  <>
                    <div className="min-w-0">
                      <label htmlFor="report-start-date" className={labelClassName}>Data inicial</label>
                      <input id="report-start-date" type="date" value={config.startDate} onChange={(event) => onChange('startDate', event.target.value)} className={fieldClassName} />
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="report-end-date" className={labelClassName}>Data final</label>
                      <input id="report-end-date" type="date" value={config.endDate} onChange={(event) => onChange('endDate', event.target.value)} className={fieldClassName} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="mb-3 flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-[#d7be82]">3</span>
              <div className="min-w-0">
                <h2 className="break-words text-sm font-black text-slate-950">Personalize os filtros</h2>
                <p className="break-words text-[10px] font-semibold text-slate-500">Os mesmos critérios serão aplicados às bases comparativas.</p>
              </div>
            </div>

            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <label htmlFor="report-client" className={labelClassName}>Cliente</label>
                <select id="report-client" value={config.clientId} onChange={(event) => onChange('clientId', event.target.value)} className={fieldClassName}>
                  <option value="">Todos os clientes</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="report-driver" className={labelClassName}>Motorista</label>
                <select id="report-driver" value={config.driverId} onChange={(event) => onChange('driverId', event.target.value)} className={fieldClassName}>
                  <option value="">Todos os motoristas</option>
                  {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="report-status" className={labelClassName}>Status operacional</label>
                <select id="report-status" value={config.status} onChange={(event) => onChange('status', event.target.value)} className={fieldClassName}>
                  <option value="">Todos os status</option>
                  {FREIGHT_ORDER_STATUSES.map((status) => <option key={status} value={status}>{getFreightStatusMeta(status).label}</option>)}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="report-origin" className={labelClassName}>Origem contém</label>
                <input id="report-origin" value={config.origin} onChange={(event) => onChange('origin', event.target.value)} placeholder="Ex.: Betim - MG" className={fieldClassName} />
              </div>
              <div className="min-w-0">
                <label htmlFor="report-destination" className={labelClassName}>Destino contém</label>
                <input id="report-destination" value={config.destination} onChange={(event) => onChange('destination', event.target.value)} placeholder="Ex.: São Paulo - SP" className={fieldClassName} />
              </div>
              <div className="min-w-0">
                <label htmlFor="report-search" className={labelClassName}>Busca geral</label>
                <input id="report-search" value={config.search} onChange={(event) => onChange('search', event.target.value)} placeholder="CTE, ficha, cliente, motorista ou rota" className={fieldClassName} />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 border-t border-slate-200 pt-5 md:grid-cols-2 xl:grid-cols-4">
            <Toggle checked={config.includePrevious} label="Comparar período anterior" helper="Intervalo imediatamente anterior com a mesma quantidade de dias." onChange={(value) => onChange('includePrevious', value)} />
            <Toggle checked={config.includePreviousYear} label="Comparar ano anterior" helper="Mesmas datas deslocadas em um ano, quando houver registros." onChange={(value) => onChange('includePreviousYear', value)} />
            <Toggle checked={config.includeDetails} label="Incluir detalhamento" helper="Adiciona a base de ordens ao PDF e aos arquivos analíticos." onChange={(value) => onChange('includeDetails', value)} />
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
              <label htmlFor="report-ranking-limit" className={labelClassName}>Itens nos rankings</label>
              <select id="report-ranking-limit" value={config.rankingLimit} onChange={(event) => onChange('rankingLimit', Number(event.target.value))} className={fieldClassName}>
                {[5, 10, 15, 20, 30].map((value) => <option key={value} value={value}>Top {value}</option>)}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold leading-relaxed text-red-800">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onGenerate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                {loading ? 'Gerando relatório...' : 'Gerar relatório'}
              </button>
              <button type="button" onClick={onReset} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
                <RefreshCcw className="h-4 w-4" />
                Limpar filtros
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onExportCsv} disabled={!hasReport || loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:border-[#c5a866] hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-50">
                <ArrowDownToLine className="h-4 w-4" /> CSV
              </button>
              <button type="button" onClick={onExportExcel} disabled={!hasReport || loading || exportingExcel} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                {exportingExcel ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                {exportingExcel ? 'Gerando Excel...' : 'Excel'}
              </button>
              <button type="button" onClick={onPrint} disabled={!hasReport || loading} className="inline-flex items-center gap-2 rounded-xl bg-[#9e8245] px-4 py-3 text-xs font-black text-white transition hover:bg-[#80672f] disabled:cursor-not-allowed disabled:opacity-50">
                <Printer className="h-4 w-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
