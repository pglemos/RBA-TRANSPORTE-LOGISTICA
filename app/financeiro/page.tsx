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

  // Messages
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Dynamic statistics
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalBudget: 0
  });

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const [payRes, ordRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/orders')
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

      setStats({
        totalPaid: paid,
        totalPending: pending,
        totalBudget: paid + pending
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
      payment_method: 'Pix',
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

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.driver_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.order_number?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter ? p.status === statusFilter : true;

    return matchesSearch && matchesStatus;
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
            <AlertCircle className="h-4.5 w-4.5 text-red-650" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* METRICS HEADER CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-700 uppercase font-black tracking-wider">Total Pago Liquidado</span>
              <Wallet className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <h4 className="text-lg font-black text-emerald-950 mt-3 font-mono">
              R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-emerald-650 block mt-1">Transações finalizadas no banco de dados</span>
          </div>

          <div className="bg-yellow-50 border border-yellow-250 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-yellow-700 uppercase font-black tracking-wider">Total Pendente de Entrega</span>
              <DollarSign className="h-4.5 w-4.5 text-yellow-600" />
            </div>
            <h4 className="text-lg font-black text-yellow-950 mt-3 font-mono">
              R$ {stats.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-yellow-650 block mt-1">Liquidações que dependem do canhoto assinado</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Desembolso Geral Acumulado</span>
              <ArrowUpRight className="h-4.5 w-4.5 text-yellow-500" />
            </div>
            <h4 className="text-lg font-black mt-3 font-mono text-white">
              R$ {stats.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[9px] text-slate-400 block mt-1">Soma de adiantas + parcelas residuais</span>
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
                      <option key={o.id} value={o.id}>Ordem #{o.order_number} {o.driver_name} (Bruto: R$ {o.freight_value})</option>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <th className="p-4 font-mono">Valor Sacado</th>
                    <th className="p-4">Status de Liquidação</th>
                    <th className="p-4">Data Registro</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-semibold text-slate-700">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-4 font-mono text-slate-500">{p.id.slice(0, 8)}</td>
                      <td className="p-4 font-black text-slate-900">#{p.order_number}</td>
                      <td className="p-4">
                        <div>
                          <p>{p.driver_name}</p>
                          <p className="text-[10px] text-slate-450 font-mono">Chave Pix: {p.pix_key}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="p-1 text-[10px] bg-slate-100 text-slate-700 font-bold rounded">
                          {p.type}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          p.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-105 bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10.5px] text-slate-450">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                      </td>
                      <td className="p-4 text-right">
                        {p.status === 'Pendente' ? (
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(p.id, 'Pago')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              Liquidar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(p.id, 'Cancelado')}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
