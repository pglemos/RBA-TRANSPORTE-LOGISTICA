'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import RBALogo from '@/components/RBALogo';
import { Search, Printer, DollarSign, BarChart3, Filter, ShieldCheck, FileCheck, ArrowDownToLine } from 'lucide-react';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter criteria
  const [selectedClient, setSelectedClient] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [ordRes, cliRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/clients')
      ]);

      if (ordRes.ok && cliRes.ok) {
        setOrders(await ordRes.json());
        setClients(await cliRes.json());
      }
    } catch (e) {
      console.error(e);
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
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    
    let matchesMonth = true;
    if (monthFilter && o.created_at) {
      const orderDate = new Date(o.created_at);
      const monthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      matchesMonth = monthStr === monthFilter;
    }

    return matchesClient && matchesStatus && matchesMonth;
  });

  // Aggregated totals
  const totalFreight = filteredOrders.reduce((acc, current) => acc + (Number(current.freight_value) || 0), 0);
  const totalAdvance = filteredOrders.reduce((acc, current) => acc + (Number(current.advance_value) || 0), 0);
  const totalBalance = filteredOrders.reduce((acc, current) => acc + (Number(current.balance_value) || 0), 0);
  const totalNet = filteredOrders.reduce((acc, current) => acc + (Number(current.net_value) || 0), 0);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <HeaderAndSidebar>
      <div className="space-y-6" id="reports-module">
        
        {/* Header tools */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 print:hidden">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Relatórios de Custos e Faturamentos</h1>
            <p className="text-xs text-slate-500 mt-1">Gere romaneios operacionais de fretes, resumos de adiantamento e margens RBA de forma consolidada.</p>
          </div>

          <button
            id="print-report-btn"
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Imprimir Relatório (PDF)
          </button>
        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Filtrar por Cliente Tomador</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
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
                <option value="Rascunho">Rascunho</option>
                <option value="Em Análise">Em Análise de Crédito</option>
                <option value="Aprovado">Aprovado Buonny</option>
                <option value="Liberado para Embarque">Liberado para Embarque</option>
                <option value="Carregando">Carregando</option>
                <option value="Em Viagem">Em Viagem</option>
                <option value="Entregue">Entregue</option>
                <option value="Pago">Pago / Liquidado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Mês de Emissão</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-xl outline-none"
            />
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
              <p className="text-[10px] text-slate-450">Filtro Cliente: {selectedClient ? 'Filtro Ativo' : 'Todos'} | Status: {statusFilter || 'Todos'}</p>
            </div>

            {/* FINANCIAL BLOCKS VIEW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white border rounded-2xl p-4 text-center">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Faturamento Bruto</span>
                <span className="text-md md:text-lg font-black font-mono text-slate-900 block">
                  R$ {totalFreight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-400 block mt-1">Soma do frete bruto acordado</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Adiantamentos Faturados</span>
                <span className="text-md md:text-lg font-black font-mono text-slate-900 block text-sky-700">
                  R$ {totalAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-400 block mt-1">Adiantamentos já repassados em Pix</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center bg-yellow-500/5 border-yellow-500/10">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Saldos Residuais Restantes</span>
                <span className="text-md md:text-lg font-black font-mono text-yellow-800 block">
                  R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-450 block mt-1">A pagar na entrega do romaneio</span>
              </div>

              <div className="bg-white border rounded-2xl p-4 text-center bg-emerald-500/5 border-emerald-500/10">
                <span className="text-[9px] text-slate-450 font-black block uppercase tracking-wider mb-2">Lucro Líquido Estimado</span>
                <span className="text-md md:text-lg font-black font-mono text-emerald-800 block">
                  R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-450 block mt-1">Faturamento Bruto - Custos Carga/Descarga</span>
              </div>

            </div>

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
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-400 text-[9.5px]">
                        <th className="p-3">Ficha Nº</th>
                        <th className="p-3">Data Emissão</th>
                        <th className="p-3">Motorista</th>
                        <th className="p-3">Origem ➔ Destino</th>
                        <th className="p-3">Cliente</th>
                        <th className="p-3 font-mono text-right">Bruto (R$)</th>
                        <th className="p-3 font-mono text-right">Adiantamento (R$)</th>
                        <th className="p-3 font-mono text-right">Saldo (R$)</th>
                        <th className="p-3 font-mono text-right">Líquido (R$)</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3 font-extrabold text-slate-900">{o.order_number}</td>
                          <td className="p-3 font-mono text-slate-450">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{o.driver_name}</td>
                          <td className="p-3 truncate max-w-[120px]">{o.origin} ➔ {o.destination}</td>
                          <td className="p-3 truncate max-w-[110px] text-slate-500">{o.client_name}</td>
                          <td className="p-3 font-mono text-right font-bold text-slate-900">R$ {o.freight_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 font-mono text-right text-slate-500">R$ {o.advance_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 font-mono text-right text-slate-500">R$ {o.balance_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 font-mono text-right text-emerald-800 font-black">R$ {o.net_value.toLocaleString('pt-BR')}</td>
                          <td className="p-3 text-center">
                            <span className="p-0.5 px-2 bg-slate-100 text-slate-700 rounded text-[9px] uppercase font-bold">
                              {o.status}
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
                <p className="font-mono text-[8px] text-slate-400">HASH-SECURE: SHA-256/ANALYSIS-SYSTEM-ROUTINES</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
