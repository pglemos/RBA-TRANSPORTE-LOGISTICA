'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderPDF from '@/components/FreightOrderPDF';
import { getUniqueFilterOptions, matchesAllFilters, matchesSearchFields } from '@/lib/tableFilters';
import { FREIGHT_ORDER_STATUSES, getFreightStatusListSortRank, getFreightStatusMeta, normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { formatFreightOrderEmissionDate, getFreightOrderEmissionDateValue } from '@/lib/freightOrderDates';
import { 
  Search, 
  Plus, 
  FileText, 
  Edit3, 
  Trash2, 
  Filter, 
  Printer, 
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  MoreVertical,
  Eye
} from 'lucide-react';

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<any | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getCteSortValue = (cteNumber?: string) => {
    const firstMatch = cteNumber?.match(/\d+/);
    return firstMatch ? Number(firstMatch[0]) : -1;
  };

  const getOrderVehicleLabel = (order: any) =>
    [order.vehicle_model, order.vehicle_tractor_plate, order.vehicle_trailer_plate]
      .filter(Boolean)
      .join(' | ');

  const loadOrders = useCallback(async () => {
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
  }, [search, statusFilter]);

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
  }, [loadOrders]);

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
    const matchesSearch = matchesSearchFields(o, search, [
      'order_number',
      'driver_name',
      'client_name',
      'cte_number',
      'vehicle_model',
      'vehicle_tractor_plate',
      'vehicle_trailer_plate',
    ]);
    const matchesFilters = matchesAllFilters(o, [
      { value: statusFilter, getValue: (order) => order.status },
      { value: driverFilter, getValue: (order) => order.driver_name },
      { value: vehicleFilter, getValue: getOrderVehicleLabel },
      { value: clientFilter, getValue: (order) => order.client_name },
    ]);
    const emissionDate = getFreightOrderEmissionDateValue(o);
    const matchesDate = (!startDate || emissionDate >= startDate) &&
      (!endDate || emissionDate <= endDate);

    return matchesSearch && matchesFilters && matchesDate;
  }).sort((a, b) => {
    const statusDiff = getFreightStatusListSortRank(a.status) - getFreightStatusListSortRank(b.status);
    if (statusDiff !== 0) return statusDiff;

    const cteDiff = getCteSortValue(b.cte_number) - getCteSortValue(a.cte_number);
    if (cteDiff !== 0) return cteDiff;
    return new Date(getFreightOrderEmissionDateValue(b) || 0).getTime() -
      new Date(getFreightOrderEmissionDateValue(a) || 0).getTime();
  });

  const driverOptions = getUniqueFilterOptions(orders, (order) => order.driver_name);
  const vehicleOptions = getUniqueFilterOptions(orders, getOrderVehicleLabel);
  const clientOptions = getUniqueFilterOptions(orders, (order) => order.client_name);

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
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
          
          {/* Top row: Search input and Date Range */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder="Pesquisar ficha, motorista, placa, CTE ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-3 py-3 bg-slate-50 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 transition-colors text-slate-800"
              />
            </div>

            {/* Date range picker */}
            <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                <span className="text-slate-400 text-[10px] uppercase font-black">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-700 outline-none font-bold cursor-pointer w-full sm:w-auto text-[11px]"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2.5 rounded-xl text-xs font-bold w-full sm:w-auto">
                <span className="text-slate-400 text-[10px] uppercase font-black">Até:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-700 outline-none font-bold cursor-pointer w-full sm:w-auto text-[11px]"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[10px] font-black uppercase text-red-650 hover:text-red-700 px-2.5 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-transparent text-slate-700 outline-none font-bold"
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

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <select
                id="driver-filter"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Motoristas</option>
                {driverOptions.map((driver) => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <select
                id="vehicle-filter"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Veículos</option>
                {vehicleOptions.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>{vehicle}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <select
                id="client-filter"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Todos os Clientes</option>
                {clientOptions.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
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
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-heading font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="p-4">CTE/MANIFESTO</th>
                    <th className="p-4">Motorista Condutor</th>
                    <th className="p-4">Veículo Conjugado</th>
                    <th className="p-4">Origem ➔ Destino</th>
                    <th className="p-4">Cliente Pagador</th>
                    <th className="p-4">Valor CTE</th>
                    <th className="p-4 min-w-[128px]">Saldo do Frete</th>
                    <th className="p-4">Status Geral</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      
              <td className="p-4">
                <Link
                  href={`/ordens/${o.id}`}
                  className={`font-bold text-sm hover:underline inline-flex items-center gap-1 ${o.cte_number ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {!o.cte_number && <AlertTriangle className="h-3 w-3 animate-pulse text-red-500" />}
                  {o.cte_number || 'A emitir'}
                </Link>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Emissão: {formatFreightOrderEmissionDate(o)}
                </p>
              </td>

                      {/* Driver mask dynamically rendered */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900">{o.driver_name}</p>
                          <p className="text-xs text-slate-500">CPF: {o.driver_cpf}</p>
                        </div>
                      </td>

                      {/* Vehicle Plates */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{o.vehicle_tractor_plate} | {o.vehicle_trailer_plate}</p>
                          <p className="text-xs text-slate-400">{o.vehicle_model}</p>
                        </div>
                      </td>

                      {/* Origin Destination */}
                      <td className="p-4 text-slate-800">
                        <div>
                          <p>{o.origin} ➔ {o.destination}</p>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="p-4 text-slate-550 truncate max-w-[120px]">{o.client_name}</td>

                      {/* CTE value and residual driver balance */}
                      <td className="p-4 min-w-[108px] whitespace-nowrap text-sm font-semibold leading-tight tracking-normal text-slate-900">
                        R$ {(Number(o.cte_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 min-w-[128px] font-bold text-slate-900">
                        <div className="w-max min-w-[108px] text-xs leading-tight tracking-normal">
                          {(Number(o.cash_value) || 0) > 0 ? (
                            <p className="whitespace-nowrap text-emerald-700">
                              À vista R$ {(Number(o.cash_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          ) : (
                            <>
                              <p className={`whitespace-nowrap border-b border-slate-100 pb-1 ${(Number(o.advance_value) || 0) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                AD R$ {(Number(o.advance_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className={`whitespace-nowrap pt-1 ${o.balance_value > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                SD R$ {o.balance_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status label */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getFreightStatusMeta(o.status).className}`}>
                          {getFreightStatusMeta(o.status).icon} {normalizeFreightOrderStatus(o.status)}
                        </span>
                      </td>

                      {/* Kebab action dropdown menu */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(activeDropdownId === o.id ? null : o.id);
                              }}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeDropdownId === o.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveDropdownId(null)}
                                />
                                <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-20 text-left font-semibold text-slate-750 animate-slide-in">
                                  <Link
                                    href={`/ordens/${o.id}`}
                                    onClick={() => setActiveDropdownId(null)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs w-full text-left"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                                    Detalhes
                                  </Link>
                                  <Link
                                    href={`/ordens/${o.id}/editar`}
                                    onClick={() => setActiveDropdownId(null)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs w-full text-left"
                                  >
                                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                    Editar
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      setSelectedOrderForPDF(o);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs w-full text-left"
                                  >
                                    <Printer className="h-3.5 w-3.5 text-slate-400" />
                                    Imprimir
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDelete(o.id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 hover:text-red-700 text-red-600 text-xs w-full text-left"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Excluir
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-150">
              {filteredOrders.map((o) => (
                <div key={o.id} className="p-4 space-y-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">CTE/MANIFESTO</span>
                <Link
                  href={`/ordens/${o.id}`}
                  className={`font-extrabold text-sm hover:underline inline-flex items-center gap-1 ${o.cte_number ? 'text-amber-600 dark:text-amber-500' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {!o.cte_number && <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-red-500" />}
                  {o.cte_number || 'A emitir'}
                </Link>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Emissão: {formatFreightOrderEmissionDate(o)}
                </p>
              </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider text-right mb-1">STATUS</span>
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${getFreightStatusMeta(o.status).className}`}>
                        {getFreightStatusMeta(o.status).icon} {normalizeFreightOrderStatus(o.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Motorista</span>
                      <p className="font-bold text-slate-950 mt-0.5">{o.driver_name}</p>
                      <p className="text-[10px] text-slate-500">CPF: {o.driver_cpf}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Veículo</span>
                      <p className="font-extrabold text-slate-950 mt-0.5">{o.vehicle_tractor_plate} | {o.vehicle_trailer_plate}</p>
                      <p className="text-[10px] text-slate-450">{o.vehicle_model}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Origem ➔ Destino</span>
                      <p className="text-slate-800 mt-0.5">{o.origin} ➔ {o.destination}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor CTE</span>
                      <p className="font-extrabold text-slate-950 mt-0.5">R$ {(Number(o.cte_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saldo Frete</span>
                      <div className="text-[11px] mt-0.5 font-bold text-slate-950 leading-tight">
                        {(Number(o.cash_value) || 0) > 0 ? (
                          <p className="text-emerald-700">
                            À vista R$ {(Number(o.cash_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <>
                            <p className={`border-b border-slate-200 pb-0.5 ${(Number(o.advance_value) || 0) > 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                              AD R$ {(Number(o.advance_value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`pt-0.5 ${o.balance_value > 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                              SD R$ {o.balance_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForPDF(o)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-bold"
                    >
                      <Printer className="h-3 w-3" />
                      Imprimir PDF
                    </button>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ordens/${o.id}/editar`}
                        className="p-2 bg-slate-950 hover:bg-slate-800 text-white rounded-lg text-[10px] uppercase font-bold"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(o.id)}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
