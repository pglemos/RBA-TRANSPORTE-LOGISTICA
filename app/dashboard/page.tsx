'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  UserPlus 
} from 'lucide-react';

interface SummaryData {
  totalOrders: number;
  totalFreight: number;
  totalAdvance: number;
  totalBalanceToPay: number;
  totalExpenses: number;
  totalNet: number;
  ordersByStatus: Record<string, number>;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    totalOrders: 0,
    totalFreight: 0,
    totalAdvance: 0,
    totalBalanceToPay: 0,
    totalExpenses: 0,
    totalNet: 0,
    ordersByStatus: {}
  });

  const loadData = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        
        // Calculate dynamic summary counters
        let freight = 0;
        let advance = 0;
        let balance = 0;
        let expenses = 0;
        let net = 0;
        const statusMap: Record<string, number> = {};

        data.forEach(o => {
          freight += Number(o.freight_value) || 0;
          advance += Number(o.advance_value) || 0;
          balance += Number(o.balance_value) || 0;
          expenses += Number(o.total_expenses) || 0;
          net += Number(o.net_value) || 0;

          statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });

        setSummary({
          totalOrders: data.length,
          totalFreight: freight,
          totalAdvance: advance,
          totalBalanceToPay: balance,
          totalExpenses: expenses,
          totalNet: net,
          ordersByStatus: statusMap
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    // Refresh if simulation role changes
    window.addEventListener('rba-auth-switch', loadData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadData);
    };
  }, []);

  // Quick simulated analytics dataset based on active listings
  const chartData = [
    { name: 'Jan', Fretes: (summary.totalFreight * 0.4) || 20000, Margem: (summary.totalNet * 0.4) || 18000 },
    { name: 'Fev', Fretes: (summary.totalFreight * 0.6) || 35000, Margem: (summary.totalNet * 0.6) || 31000 },
    { name: 'Mar', Fretes: (summary.totalFreight * 0.5) || 28000, Margem: (summary.totalNet * 0.5) || 26000 },
    { name: 'Abr', Fretes: (summary.totalFreight * 0.8) || 45000, Margem: (summary.totalNet * 0.8) || 41000 },
    { name: 'Mai', Fretes: summary.totalFreight || 62000, Margem: summary.totalNet || 57000 },
    { name: 'Jun', Fretes: (summary.totalFreight * 1.1) || 68000, Margem: (summary.totalNet * 1.15) || 64000 }
  ];

  return (
    <HeaderAndSidebar>
      <div className="space-y-6" id="dashboard-container">
        
        {/* Banner Welcome */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">RBA Fretes Digital • Painel Geral</h1>
            <p className="text-xs text-slate-500 mt-1">Bem-vindo à central operacional integrada de logística e monitoramento de riscos.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              id="dash-add-order-btn"
              href="/ordens/nova"
              className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              Nova Ordem de Frete
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-xs">Carregando métricas e consolidados de viagem...</p>
          </div>
        ) : (
          <>
            {/* KPI METRIC CONTAINER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Volume Faturamento Bruto</span>
                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h4 className="text-lg font-black tracking-wider text-slate-900 mt-3">
                  R$ {summary.totalFreight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-slate-450 mt-1.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  Margem Líquida RBA: R$ {summary.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <span className="absolute bottom-0 right-0 h-1.5 w-24 bg-emerald-500 rounded-tl" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Adiantamentos Desembolsados</span>
                  <div className="h-8 w-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h4 className="text-lg font-black tracking-wider text-slate-900 mt-3">
                  R$ {summary.totalAdvance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-slate-450 mt-1.5">
                  Despesas acessórias campo: R$ {summary.totalExpenses.toLocaleString('pt-BR')}
                </p>
                <span className="absolute bottom-0 right-0 h-1.5 w-24 bg-sky-500 rounded-tl" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Saldos Finais Pendentes</span>
                  <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-700">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h4 className="text-lg font-black tracking-wider text-slate-900 mt-3">
                  R$ {summary.totalBalanceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-yellow-700 font-bold bg-yellow-400/10 px-2.5 py-0.5 rounded mt-3 block w-fit">
                  A liquidar na entrega do CTE
                </p>
                <span className="absolute bottom-0 right-0 h-1.5 w-24 bg-yellow-500 rounded-tl" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-450 uppercase font-black tracking-wider">Fichas de Fretes Ativas</span>
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-700">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                </div>
                <h4 className="text-lg font-black tracking-wider text-slate-900 mt-3">
                  {summary.totalOrders} Emissão(ões)
                </h4>
                <p className="text-[10px] text-slate-450 mt-1.5">
                  Rascunhos: {summary.ordersByStatus['Rascunho'] || 0} | Liberados: {summary.ordersByStatus['Liberado para Embarque'] || 0}
                </p>
                <span className="absolute bottom-0 right-0 h-1.5 w-24 bg-purple-500 rounded-tl" />
              </div>

            </div>

            {/* QUICK ALERTS & AUDITING BLOCKS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* ALERTS MODULE */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Alertas de Pendências Críticas</span>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs flex gap-2.5">
                    <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <h5 className="font-bold text-red-955 truncate">Motorista Bloqueado Ativo!</h5>
                      <span className="text-[10px] text-red-650 block mt-0.5">Claudio de Souza possui restrição do seguro no cadastro geral.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-xs flex gap-2.5">
                    <Clock className="h-4.5 w-4.5 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-yellow-955">Pancary em Análise!</h5>
                      <span className="text-[10px] text-yellow-650 block mt-0.5">Condução de Marcos Vinicius Santos aguardando liberação na cabine.</span>
                    </div>
                  </div>

                  {summary.ordersByStatus['Pago'] === 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs flex gap-2.5">
                      <CheckCircle className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-blue-955 text-xs">Fechamento do Mês Saudável</h5>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Nenhum desvio financeiro encontrado nas auditorias de pátio hoje.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* INTEGRATED GRAPH (Recharts) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-4">Evolução Mensal de Emissão de Fretes</span>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                      <Line type="monotone" dataKey="Fretes" name="Frete Bruto" stroke="#EAB308" strokeWidth={3} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="Margem" name="Margem Líquida" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* SPREADSHEET ORDERS TABLE */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">Últimas Fichas de Frete Cadastradas</h3>
                  <p className="text-[10px] text-slate-450 mt-1">Lista atualizada em tempo real com ações diretas sob ordens de frete.</p>
                </div>
                <Link href="/ordens" className="text-yellow-600 hover:text-yellow-700 font-bold text-xs flex items-center gap-1 cursor-pointer">
                  Ver Todas as Ordens
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {orders.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                  Nenhuma ordem cadastrada no banco de dados ainda.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-200 text-[10px]">
                        <th className="p-4">Ficha Nº</th>
                        <th className="p-4">Motorista</th>
                        <th className="p-4">Rota / Rumo</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Valor Bruto</th>
                        <th className="p-4">Saldo</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium">
                      {orders.slice(0, 5).map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-4 font-bold text-slate-900">{o.order_number}</td>
                          <td className="p-4">
                            <div>
                              <span>{o.driver_name}</span>
                              <span className="text-[10px] text-slate-450 block font-mono">CPF: {o.driver_cpf}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <span>{o.origin} ➔ {o.destination}</span>
                              <span className="text-[10px] font-semibold text-slate-450 block">Entregar: {o.delivery_date}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-550">{o.client_name}</td>
                          <td className="p-4 font-mono font-bold text-slate-900">R$ {o.freight_value.toLocaleString('pt-BR')}</td>
                          <td className="p-4 font-mono font-bold text-orange-755">R$ {o.balance_value.toLocaleString('pt-BR')}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'Liberado para Embarque' ? 'bg-sky-100 text-sky-800' :
                              o.status === 'Em Análise' ? 'bg-blue-100 text-blue-800' :
                              o.status === 'Cancelado' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link href={`/ordens/${o.id}`} className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black cursor-pointer">
                              Visualizar
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </>
        )}

      </div>
    </HeaderAndSidebar>
  );
}
