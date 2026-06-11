'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderPDF from '@/components/FreightOrderPDF';
import { 
  Search, 
  Plus, 
  FileText, 
  Edit3, 
  Trash2, 
  Filter, 
  Printer, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<any | null>(null);

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getCteSortValue = (cteNumber?: string) => {
    const digits = cteNumber?.match(/\d+/g)?.join('');
    return digits ? Number(digits) : -1;
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const params = new URLSearchParams({ page: '1', page_size: '100' });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar ordens.');
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar ordens.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);
    // Re-trigger load if role switches
    window.addEventListener('rba-auth-switch', loadOrders);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadOrders);
    };
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta Ordem de Frete permanentemente? Esta ação gera um log de auditoria operacional.")) {
      return;
    }
    setErrorMsg('');
    setMsg('');

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg("Ficha de frete excluída sucesso!");
        loadOrders();
      } else {
        setErrorMsg(data.error || "Operação proibida para o seu perfil.");
      }
    } catch (e) {
      setErrorMsg("Erro de rede ao conectar à API.");
    }
  };

  // Filter listings
  const filteredOrders = orders.filter(o => {
    const normalizedSearch = search.toLowerCase();
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(normalizedSearch) ||
      o.driver_name?.toLowerCase().includes(normalizedSearch) ||
      o.client_name?.toLowerCase().includes(normalizedSearch) ||
      o.cte_number?.toLowerCase().includes(normalizedSearch) ||
      o.vehicle_tractor_plate?.toLowerCase().includes(normalizedSearch) ||
      o.vehicle_trailer_plate?.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter ? o.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const cteDiff = getCteSortValue(b.cte_number) - getCteSortValue(a.cte_number);
    if (cteDiff !== 0) return cteDiff;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Fichas e Ordens de Fretes Digitais</h1>
            <p className="text-xs text-slate-500 mt-1">Veja todos os contratos digitais vigentes. Imprima fichas no padrão Sefaz ou gerencie status operacionais.</p>
          </div>
          <Link
            id="list-add-order-btn"
            href="/ordens/nova"
            className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Emitir Ficha Digital
          </Link>
        </div>

        {/* Global messages */}
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-pulse">
            ✔ {msg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50/70 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-650" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              placeholder="Pesquisar ficha, motorista, placa, CTE ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 transition-colors text-slate-800"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Status</option>
                <option value="Rascunho">🟡 Rascunho</option>
                <option value="Em Análise">🔵 Em Análise de Crédito</option>
                <option value="Aprovado">🟢 Aprovado Buonny</option>
                <option value="Liberado para Embarque">🚛 Liberado para Embarque</option>
                <option value="Carregando">📦 Carregando</option>
                <option value="Em Viagem">🛣️ Em Viagem</option>
                <option value="Entregue">✅ Entregue</option>
                <option value="Pago">💵 Pago / Liquidado</option>
                <option value="Cancelado">❌ Cancelado</option>
              </select>
            </div>
          </div>

        </div>

        {/* Dynamic List Table */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-xs">Sincronizando do banco de dados relacional...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border rounded-3xl py-20 text-center font-bold text-slate-400 text-xs">
            Nenhuma ordem atende aos critérios de filtros pesquisados.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 text-[10px]">
                    <th className="p-4">Ficha / CTE</th>
                    <th className="p-4">Motorista Condutor</th>
                    <th className="p-4">Veículo Conjugado</th>
                    <th className="p-4">Origem ➔ Destino</th>
                    <th className="p-4">Cliente Pagador</th>
                    <th className="p-4">Valor Bruto</th>
                    <th className="p-4">Saldo do Frete</th>
                    <th className="p-4">Status Geral</th>
                    <th className="p-4 text-center">Imprimir</th>
                    <th className="p-4 text-right">Ações de Pátio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      
                      {/* Order and CTE link */}
                      <td className="p-4">
                        <Link href={`/ordens/${o.id}`} className="font-extrabold text-xs text-yellow-650 hover:underline">
                          {o.order_number || 'Ficha sem número'}
                        </Link>
                        <p className="mt-1 text-[10px] font-mono text-slate-500">{o.cte_number || 'CTE a emitir'}</p>
                      </td>

                      {/* Driver mask dynamically rendered */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900">{o.driver_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">CPF: {o.driver_cpf}</p>
                        </div>
                      </td>

                      {/* Vehicle Plates */}
                      <td className="p-4">
                        <div>
                          <p className="text-slate-800">{o.vehicle_model}</p>
                          <p className="text-[10px] text-slate-450 font-mono">Placa: {o.vehicle_tractor_plate} | {o.vehicle_trailer_plate}</p>
                        </div>
                      </td>

                      {/* Origin Destination */}
                      <td className="p-4 text-slate-800">
                        <div>
                          <p>{o.origin} ➔ {o.destination}</p>
                          <p className="text-[9.5px] text-slate-450">Limite de Entrega: {o.delivery_date}</p>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="p-4 text-slate-550 truncate max-w-[120px]">{o.client_name}</td>

                      {/* Bruto and Residual Balances */}
                      <td className="p-4 font-mono font-bold text-slate-900">
                        R$ {o.freight_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-4 font-mono font-bold ${o.balance_value < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        R$ {o.balance_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status label */}
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                          o.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'Liberado para Embarque' ? 'bg-sky-100 text-sky-800' :
                          o.status === 'Carregando' ? 'bg-orange-100 text-orange-800' :
                          o.status === 'Em Análise' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>

                      {/* Print PDF triggers */}
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForPDF(o)}
                          className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer select-none font-bold"
                        >
                          <Printer className="h-3 w-3" />
                          PDF
                        </button>
                      </td>

                      {/* Sub CRUD and view edit toggles */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/ordens/${o.id}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] uppercase font-extrabold"
                          >
                            Detalhes
                          </Link>
                          <Link
                            href={`/ordens/${o.id}/editar`}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px]"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(o.id)}
                            className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* PRINTABLE PDF POPUP DIALOG TRIGGER */}
        {selectedOrderForPDF && (
          <FreightOrderPDF
            order={selectedOrderForPDF}
            onClose={() => setSelectedOrderForPDF(null)}
          />
        )}

      </div>
    </HeaderAndSidebar>
  );
}
