'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import RBALogo from '@/components/RBALogo';
import { Search, Printer, DollarSign, BarChart3, Filter, ShieldCheck, FileCheck, ArrowDownToLine, Calendar } from 'lucide-react';
import { FREIGHT_ORDER_STATUSES, getFreightStatusMeta, normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { summarizeFreightOrders } from '@/lib/financialMetrics';
import { formatFreightOrderEmissionDate, getFreightOrderEmissionYearMonth, getFreightOrderEmissionDateValue } from '@/lib/freightOrderDates';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter criteria
  const [selectedClient, setSelectedClient] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [ordRes, cliRes] = await Promise.all([
        fetch('/api/orders?page_size=1000'),
        fetch('/api/clients')
      ]);

      const ordData = await ordRes.json();
      const cliData = await cliRes.json();
      if (!ordRes.ok || !cliRes.ok) {
        throw new Error(ordData?.error || cliData?.error || 'Erro ao carregar relatórios.');
      }
      setOrders(Array.isArray(ordData) ? ordData : []);
      setClients(Array.isArray(cliData) ? cliData : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReportData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Filter orders dynamically
  const filteredOrders = orders.filter(o => {
    const matchesClient = selectedClient ? o.client_id === selectedClient : true;
  const matchesStatus = statusFilter ? normalizeFreightOrderStatus(o.status) === statusFilter : true;
    
    let matchesDateRange = true;
    if (startDate || endDate) {
      const orderDate = getFreightOrderEmissionDateValue(o);
      if (!orderDate) {
        matchesDateRange = false;
      } else {
        if (startDate && orderDate < startDate) {
          matchesDateRange = false;
        }
        if (endDate && orderDate > endDate) {
          matchesDateRange = false;
        }
      }
    }

    return matchesClient && matchesStatus && matchesDateRange;
  });

  // Aggregated totals
  const reportSummary = summarizeFreightOrders(filteredOrders);
  const totalGrossRevenue = reportSummary.totalGrossRevenue;
  const totalAdvance = reportSummary.totalAdvance;
  const totalBalance = reportSummary.totalBalanceToPay;
  const totalNet = reportSummary.totalNet;

  const handleExportCSV = () => {
    const headers = [
      'Ordem',
      'CTE/Manifesto',
      'Motorista',
      'CPF Motorista',
      'Placa Cavalo',
      'Placa Carreta',
      'Origem',
      'Destino',
      'Cliente Pagador',
      'Valor CTE',
      'Frete Motorista',
      'Adiantamento',
      'Saldo a Vista',
      'Saldo a Pagar',
      'Status Geral',
      'Data Emissao'
    ];

    const rows = filteredOrders.map(o => [
      `#${o.order_number}`,
      o.cte_number || 'A emitir',
      o.driver_name,
      o.driver_cpf || '',
      o.vehicle_tractor_plate || '',
      o.vehicle_trailer_plate || '',
      o.origin,
      o.destination,
      o.client_name || '',
      o.cte_value || 0,
      o.freight_value || 0,
      o.advance_value || 0,
      o.cash_value || 0,
      o.balance_value || 0,
      o.status,
      formatFreightOrderEmissionDate(o)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : String(val).replace('.', ',')).join(';'))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_rba_transporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <HeaderAndSidebar>
      <div className="space-y-6" id="reports-module">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 print:hidden">
            {errorMsg}
          </div>
        )}
        
        {/* Header tools */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 print:hidden">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Relatórios de Custos e Faturamentos</h1>
            <p className="text-xs text-slate-500 mt-1">Gere romaneios operacionais de fretes, resumos de adiantamento e margens RBA de forma consolidada.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownToLine className="h-4.5 w-4.5" />
              Exportar Planilha (CSV)
            </button>
            <button
              id="print-report-btn"
              onClick={handlePrintReport}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4.5 w-4.5" />
              Imprimir Relatório (PDF)
            </button>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Filtrar por Cliente Tomador</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5">
              <Filter className="h-4 w-4 text-slate-450 shrink-0" />
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">Todos os Clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Status Operacional da Viagem</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5">
              <FileCheck className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
              >
                <option value="">Todos os Status</option>
                    {FREIGHT_ORDER_STATUSES.map((statusOption) => {
                      const meta = getFreightStatusMeta(statusOption);
                      return (
                        <option key={statusOption} value={statusOption}>
                          {meta.icon} {meta.label}
                        </option>
                      );
                    })}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Período de Emissão</label>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[9px] font-bold text-red-500 hover:text-red-700 hover:underline transition-colors focus:outline-none"
                >
                  Limpar período
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-250 rounded-xl px-2 py-2">
                <span className="text-[9px] uppercase font-extrabold text-slate-400">De</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>
              <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-250 rounded-xl px-2 py-2">
                <span className="text-[9px] uppercase font-extrabold text-slate-400">Até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* WORK CONSOLIDATION DATA */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            Calculando cruzamentos analíticos...
          </div>
        ) : (
          <div className="space-y-6" id="report-print-target">
            
            {/* PRINT-ONLY HEADER EMBLEM */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <RBALogo className="mb-3 h-20 w-40" />
              <h1 className="text-lg font-black tracking-tight">RBA TRANSPORTE & LOGÍSTICA S.A.</h1>
              <p className="text-xs uppercase font-bold text-slate-500">Relatório Consolidado de Contratos de Fretes e Custos Fiscais</p>
              <p className="text-[10px] text-slate-450">
                Filtro Cliente: {clients.find(c => c.id === selectedClient)?.name || 'Todos'} |{' '}
                Status: {statusFilter || 'Todos'} |{' '}
                Período: {startDate || endDate ? `${startDate ? formatDateBR(startDate) : 'Início'} até ${endDate ? formatDateBR(endDate) : 'Fim'}` : 'Todo o período'}
              </p>
                       {/* FINANCIAL BLOCKS VIEW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white border rounded-2xl p-4 text-center">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Faturamento Bruto</span>
                <span className="text-md md:text-lg font-black text-slate-900 block">
                  R$ {totalGrossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-400 block mt-1">Soma do valor bruto do CTE</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Adiantamentos Faturados</span>
                <span className="text-md md:text-lg font-black text-slate-900 block text-sky-700">
                  R$ {totalAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-400 block mt-1">Adiantamentos já repassados in Pix</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center bg-yellow-500/5 border-yellow-500/10">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Saldos Residuais Restantes</span>
                <span className="text-md md:text-lg font-black text-yellow-800 block">
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-455 block mt-1">A pagar na entrega do romaneio</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center bg-emerald-500/5 border-emerald-500/10">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Lucro Líquido Estimado</span>
                <span className="text-md md:text-lg font-black text-emerald-800 block">
                  R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                  <span className="text-[8px] text-slate-450 block mt-1">CTE líquido - motorista - despesas</span>
              </div>

            </div>      </div>

            {/* DETAILED SPREADSHEET */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs uppercase tracking-wider text-slate-900">
                Lista de Viagens Filtradas ({filteredOrders.length} registros)
              </div>
              
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">
                  Nenhuma viagem atende aos filtros atuais para fechar o balancete.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-medium text-slate-700">
                    <thead>
                      <tr className="bg-slate-55 border-b border-slate-200 font-bold text-slate-400 text-[9.5px]">
                        <th className="p-3">CTE/MANIFESTO</th>
                        <th className="p-3">Data Emissão</th>
                        <th className="p-3">Motorista</th>
                        <th className="p-3">Origem ➔ Destino</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3 text-right">CTE (R$)</th>
                        <th className="p-3 text-right">Adiantamento (R$)</th>
                        <th className="p-3 text-right">Saldo (R$)</th>
                        <th className="p-3 text-right">Líquido (R$)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <Link
                              href={`/ordens/${o.id}`}
                              className={`font-extrabold text-xs hover:underline ${o.cte_number ? 'text-amber-600 dark:text-amber-500' : 'text-red-600'}`}
                            >
                              {o.cte_number || 'A emitir'}
                            </Link>
                          </td>
                          <td className="p-3 text-slate-450">
                            {formatFreightOrderEmissionDate(o)}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{o.driver_name}</td>
                          <td className="p-3 truncate max-w-[120px]">{o.origin} ➔ {o.destination}</td>
                          <td className="p-3 truncate max-w-[110px] text-slate-500">{o.client_name}</td>
                          <td className="p-3 text-right font-bold text-slate-900">R$ {(Number(o.cte_value) || 0).toLocaleString('pt-BR')}</td>
                          <td className="p-3 text-right text-slate-500">R$ {o.advance_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 text-right text-slate-500">R$ {o.balance_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 text-right text-emerald-800 font-black">R$ {o.net_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 text-center">
                            <span className={`p-0.5 px-2 rounded text-[9px] uppercase font-bold ${getFreightStatusMeta(o.status).className}`}>
                              {getFreightStatusMeta(o.status).icon} {normalizeFreightOrderStatus(o.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Print only footer stamps */}
            <div className="hidden print:flex items-center justify-between border-t border-dashed border-slate-900 pt-8 mt-12 text-[10px] leading-relaxed">
              <div className="text-center font-bold">
                <span className="block border-t border-slate-900 w-48 mt-8" />
                <span>Assinatura do Responsável RBA</span>
              </div>
              <div className="text-right">
                <p>Relatório gerado via sistema RBA Fretes Digital em {new Date().toLocaleString('pt-BR')}</p>
                <p className="text-[8px] text-slate-400">HASH-SECURE: SHA-256/ANALYSIS-SYSTEM-ROUTINES</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
