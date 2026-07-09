'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { Search, DollarSign, Wallet, ArrowUpRight, Check, Trash2, Filter, Save, AlertCircle } from 'lucide-react';

export default function FinancePage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search / Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Creation form states
  const [showForm, setShowForm] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentType, setPaymentType] = useState<'Adiantamento' | 'Saldo' | 'Taxa de Carga' | 'Outros'>('Adiantamento');
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState<'Pendente' | 'Pago' | 'Cancelado'>('Pendente');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Transferência' | 'Dinheiro' | 'Cartão' | 'Cheque'>('Pix');
  const [proofUrl, setProofUrl] = useState('');

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<'default' | 'amount' | 'date'>('default');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const handleSortToggle = (key: 'amount' | 'date') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Dynamic statistics
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalBudget: 0,
    totalMargin: 0
  });

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [payRes, ordRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/orders?page_size=200')
      ]);

      const payData = await payRes.json();
      const ordData = await ordRes.json();
      if (!payRes.ok || !ordRes.ok) {
        throw new Error(payData?.error || ordData?.error || 'Erro ao carregar financeiro.');
      }

      setPayments(Array.isArray(payData) ? payData : []);
      setOrders(Array.isArray(ordData) ? ordData : []);

      // Sum up metrics
      let paid = 0;
      let pending = 0;
      (Array.isArray(payData) ? payData : []).forEach((p: any) => {
        if (p.status === 'Pago') {
          paid += Number(p.amount) || 0;
        } else if (p.status === 'Pendente') {
          pending += Number(p.amount) || 0;
        }
      });

      let marginSum = 0;
      (Array.isArray(ordData) ? ordData : []).forEach((o: any) => {
        const cteVal = Number(o.cte_value) || 0;
        const freightVal = Number(o.freight_value) || 0;
        const totalExpenses = Number(o.total_expenses) || 0;
        const discountVal = cteVal * (Number(o.cte_discount_percent ?? 10) / 100);
        const netVal = cteVal - discountVal - freightVal - totalExpenses;
        marginSum += netVal;
      });

      setStats({
        totalPaid: paid,
        totalPending: pending,
        totalBudget: paid + pending,
        totalMargin: marginSum
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFinanceData();
    }, 0);
    window.addEventListener('rba-auth-switch', loadFinanceData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadFinanceData);
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'Pago' | 'Cancelado') => {
    setErrorMsg('');
    setMsg('');
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data && data.success) {
        setMsg(`Liquidação atualizada para ${newStatus}!`);
        loadFinanceData();
      } else {
        setErrorMsg(data.error || "Seu perfil não possui autorização.");
      }
    } catch (e) {
      setErrorMsg("Erro de rede.");
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMsg('');

    if (!orderId || amount <= 0) {
      setErrorMsg("Selecione uma Ordem de Frete e especifique um valor de desembolso maior que zero.");
      return;
    }

    setSaving(true);
    const payload = {
      freight_order_id: orderId,
      type: paymentType,
      amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: paymentMethod,
      proof_url: proofUrl,
      status
    };

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.success) {
        setMsg("Baixa financeira de pagamento lançada com sucesso!");
        setShowForm(false);
        setOrderId('');
        setAmount(0);
        setPaymentMethod('Pix');
        setProofUrl('');
        loadFinanceData();
      } else {
        setErrorMsg(data.error || "Operação não autorizada pelo controle RLS.");
      }
    } catch (err) {
      setErrorMsg("Erro na rota.");
    } finally {
      setSaving(false);
    }
  };

  const statusRank: Record<string, number> = {
    'Carregando': 1,
    'Em Trânsito': 2,
    'Entregue': 3,
    'Contratar': 4,
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.cte_number?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter ? p.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortKey === 'amount') {
      const diff = (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return sortAsc ? diff : -diff;
    }
    if (sortKey === 'date') {
      const dateA = new Date(a.created_at || a.payment_date || 0).getTime();
      const dateB = new Date(b.created_at || b.payment_date || 0).getTime();
      const diff = dateA - dateB;
      return sortAsc ? diff : -diff;
    }
    const rankA = statusRank[a.order_status] || 99;
    const rankB = statusRank[b.order_status] || 99;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const cteA = a.cte_number || '';
    const cteB = b.cte_number || '';
    return cteA.localeCompare(cteB, 'pt-BR', { numeric: true, sensitivity: 'base' });
  });

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        
        {/* Header tools */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Controle Financeiro & Caixa de Logística</h1>
            <p className="text-xs text-slate-500 mt-1">Monitore e dê baixas em adiantamentos, adubações operacionais, pedágios e saldos finais de entrega.</p>
          </div>

          {!showForm && (
            <button
              id="add-payment-btn"
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <DollarSign className="h-4.5 w-4.5" />
              Lançar Baixa Manual
            </button>
          )}
        </div>

        {/* Global messages */}
        {msg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
            ✔ {msg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50/70 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* METRICS HEADER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-700 uppercase font-black tracking-wider">Total Pago Liquidado</span>
              <Wallet className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <h4 className="text-lg font-black text-emerald-950 mt-3">
              R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-emerald-650 block mt-1">Transações finalizadas no banco de dados</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-250 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-yellow-700 uppercase font-black tracking-wider">Total Pendente de Entrega</span>
              <DollarSign className="h-4.5 w-4.5 text-yellow-600" />
            </div>
            <h4 className="text-lg font-black text-yellow-950 mt-3">
              R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-yellow-700 block mt-1">Liquidações que dependem do canhoto assinado</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Desembolso Geral Acumulado</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-yellow-500" />
            </div>
            <h4 className="text-lg font-black mt-3 text-white">
              R$ {stats.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-slate-400 block mt-1">Soma de adiantas + parcelas residuais</span>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-700 uppercase font-black tracking-wider">Margem Acumulada RBA</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <h4 className="text-lg font-black mt-3 text-amber-950">
              R$ {stats.totalMargin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-amber-650 block mt-1">Lucro líquido operacional consolidado</span>
          </div>

        </div>

        {/* EXPANSIVE MANUAL PAYMENT POPUP */}
        {showForm && (
          <div className="bg-white border-2 border-yellow-500/20 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Lançar Nova Baixa Financeira Manual
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Associar Ordem de Frete *</label>
                  <select
                    id="ip-pay-order"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="">Selecione a Ordem</option>
 {orders.map(o => (
 <option key={o.id} value={o.id}>Ordem #{o.order_number} {o.driver_name} (Motorista: R$ {o.freight_value} | CTE: R$ {o.cte_value || 0})</option>
 ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Alocação de Tipo de Custo</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full text-xs font-black px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="Adiantamento">Adiantamento em Viagem</option>
                    <option value="Saldo">Saldo Final de Entrega</option>
                    <option value="Taxa de Carga">Taxa de Carga / Pedágio</option>
                    <option value="Outros">Outras Despesas de Campo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Valor Pago (R$) *</label>
                  <input
                    id="ip-pay-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Status do Envio Bancário</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="Pendente">🟡 Pendente / Processando Lote</option>
                    <option value="Pago">🟢 Pago / Comprovante Anetado</option>
                    <option value="Cancelado">❌ Estornado / Cancelado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Método de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Transferência">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro Espécie</option>
                    <option value="Cartão">Cartão Corporativo</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">URL do Comprovante (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/comprovante.pdf"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                >
                  Fechar
                </button>
                <button
                  id="pay-save-btn"
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" />
                  {saving ? 'Gravando...' : 'Gravar Pagamento'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Searching bar filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por motorista, número da ordem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 bg-slate-55 border border-slate-250 rounded-xl outline-none focus:border-yellow-500 text-slate-800"
            />
          </div>

          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs font-bold">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-700 outline-none font-bold"
              >
                <option value="">Filtrar Lançamento</option>
                <option value="Pago">🟢 Pago / Fechado</option>
                <option value="Pendente">🟡 Pendente de Banco</option>
                <option value="Cancelado">❌ Cancelado / Estornado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger list spreadsheet */}
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slate-400">
            Sincronizando livro diário...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white border rounded-3xl py-16 text-center text-xs font-bold text-slate-400">
            Nenhuma liquidação de caixa atende a essa consulta.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold border-b border-indigo-200/5 text-[10px]">
                    <th className="p-4">Código Lote</th>
                    <th className="p-4">Ficha / Ordem Associada</th>
                    <th className="p-4">Motorista Beneficiário</th>
                    <th className="p-4">Tipo de Baixa</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none" onClick={() => handleSortToggle('amount')}>
                       Valor Sacado {sortKey === 'amount' ? (sortAsc ? ' ⬆️' : ' ⬇️') : ''}
                     </th>
                    <th className="p-4">Status de Liquidação</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 select-none" onClick={() => handleSortToggle('date')}>
                       Data Registro {sortKey === 'date' ? (sortAsc ? ' ⬆️' : ' ⬇️') : ''}
                     </th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredPayments.map((p) => {
                    const order = orders.find(o => o.id === p.freight_order_id);
                    const valCTE = Number(order?.cte_value) || 0;
                    const valFrete = Number(order?.freight_value) || 0;
                    const valAdto = Number(order?.advance_value) || 0;
                    const valPedagio = Number(order?.cash_value) || 0;
                    const valSaldo = valFrete - valAdto - valPedagio;

                    const valAjudante = Number(order?.loading_expense) || 0;
                    const valDescarga = Number(order?.unloading_expense) || 0;
                    const valOutros = Number(order?.other_expenses) || 0;
                    const valDespesas = Number(order?.total_expenses) || 0;

                    const cteDiscountPercent = Number(order?.cte_discount_percent ?? 10);
                    const valDesconto = valCTE * (cteDiscountPercent / 100);
                    const valLiq = valCTE - valDesconto - valFrete - valDespesas;

                    const isExpanded = expandedPaymentId === p.id;

                    return (
                      <React.Fragment key={p.id}>
                        <tr
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/80 border-l-4 border-yellow-500' : ''}`}
                          onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                        >
                          <td className="p-4 text-slate-550">{p.id.slice(0, 8)}</td>
                          <td className="p-4 font-black text-slate-900">
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {p.cte_number && p.cte_number !== 'Sem CTE' && p.cte_number !== 'Não vinculado' ? (
                                  p.cte_number
                                ) : (
                                  <span className="text-slate-400 font-semibold italic">Sem CTE</span>
                                )}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 font-normal">
                                <span className="text-[10px] text-slate-500">Ordem: #{p.order_number}</span>
                                {p.order_status && p.order_status !== 'N/A' && (
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wide ${
                                    p.order_status === 'Carregando' ? 'bg-orange-100 text-orange-850' :
                                    p.order_status === 'Em Trânsito' ? 'bg-blue-100 text-blue-850' :
                                    p.order_status === 'Entregue' ? 'bg-emerald-100 text-emerald-850' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {p.order_status}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5 font-normal">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">CTE: R$ {valCTE.toLocaleString('pt-BR')}</span>
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Frete: R$ {valFrete.toLocaleString('pt-BR')}</span>
                                <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Adto: R$ {valAdto.toLocaleString('pt-BR')}</span>
                                <span className="bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-bold">Saldo: R$ {valSaldo.toLocaleString('pt-BR')}</span>
                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">Líq: R$ {valLiq.toLocaleString('pt-BR')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                               <p>{p.driver_name}</p>
                               <p className="text-[10px] text-slate-450">Chave Pix: {p.pix_key}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-700 font-extrabold rounded uppercase tracking-wider">
                                {p.type}
                              </span>
                              <span className="text-[10px] text-slate-450">{p.payment_method || 'Pix'}</span>
                              {p.proof_url && (
                                <a
                                  href={p.proof_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[9px] font-bold text-[#d8b45d] hover:underline"
                                >
                                  📎 Ver Recibo
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-900">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              p.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-[10.5px] text-slate-450">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                          </td>
                          <td className="p-4 text-right">
                            {p.status === 'Pendente' ? (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(p.id, 'Pago');
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Check className="h-3 w-3" />
                                  Liquidar
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(p.id, 'Cancelado');
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-red-600 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Bloquear
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">Cancelado ou Finalizado</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50 border-l-4 border-yellow-500">
                            <td colSpan={8} className="p-5 border-b">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 font-semibold">
                                
                                {/* DETALHAMENTO FINANCEIRO DO FRETE */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                                  <div className="border-b pb-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                                      DETALHAMENTO FINANCEIRO DO FRETE
                                    </h4>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-1">FLUXOS DE PAGAMENTOS</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between border-b pb-1 text-slate-500">
                                      <span>Valor do Frete ao Motorista:</span>
                                      <strong>R$ {valFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-red-700">
                                      <span>(-) Adiantamento faturado:</span>
                                      <strong>R$ {valAdto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-red-700">
                                      <span>(-) Pedágio / Pago à Vista:</span>
                                      <strong>R$ {valPedagio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between text-slate-950 font-black pt-1 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                                      <span>SALDO DE FRETE A PAGAR:</span>
                                      <strong>R$ {valSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* CUSTOS E AJUSTES DE CARGA */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                                  <div className="border-b pb-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                                      CUSTOS E AJUSTES DE CARGA
                                    </h4>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-1">&nbsp;</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between border-b pb-1 text-slate-500">
                                      <span>Ajudante de Carga:</span>
                                      <strong>R$ {valAjudante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-slate-500">
                                      <span>Pedágio / Descarga duto:</span>
                                      <strong>R$ {valDescarga.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-slate-500">
                                      <span>Outros custos operacionais:</span>
                                      <strong>R$ {valOutros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                  </div>
                                </div>

                                {/* FATURAMENTO (CTE) — MEMÓRIA DE CÁLCULO */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                                  <div className="border-b pb-2">
                                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                                      FATURAMENTO (CTE) — MEMÓRIA DE CÁLCULO
                                    </h4>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-1">&nbsp;</p>
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between border-b pb-1 text-slate-500">
                                      <span>VALOR DO CTE (Receita Bruta):</span>
                                      <strong>R$ {valCTE.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-red-700">
                                      <span>(−) DESCONTO SOBRE O CTE ({cteDiscountPercent}%):</span>
                                      <strong>− R$ {valDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-red-700">
                                      <span>(−) Valor de Frete (motorista: AD. + saldo):</span>
                                      <strong>− R$ {valFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between border-b pb-1 text-red-700">
                                      <span>(−) Despesas (carga / descarga / outros):</span>
                                      <strong>− R$ {valDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                    <div className="flex justify-between text-slate-950 font-black pt-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                      <span>RESULTADO LÍQUIDO RBA:</span>
                                      <strong>R$ {valLiq.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
