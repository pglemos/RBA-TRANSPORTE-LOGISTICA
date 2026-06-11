'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Sparkles,
  TrendingUp,
  UserPlus,
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

const emptySummary: SummaryData = {
  totalOrders: 0,
  totalFreight: 0,
  totalAdvance: 0,
  totalBalanceToPay: 0,
  totalExpenses: 0,
  totalNet: 0,
  ordersByStatus: {},
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error || 'Erro ao carregar dashboard.');

      let freight = 0;
      let advance = 0;
      let balance = 0;
      let expenses = 0;
      let net = 0;
      const statusMap: Record<string, number> = {};

      data.forEach((order) => {
        freight += Number(order.freight_value) || 0;
        advance += Number(order.advance_value) || 0;
        balance += Number(order.balance_value) || 0;
        expenses += Number(order.total_expenses) || 0;
        net += Number(order.net_value) || 0;
        statusMap[order.status] = (statusMap[order.status] || 0) + 1;
      });

      setOrders(data);
      setSummary({
        totalOrders: data.length,
        totalFreight: freight,
        totalAdvance: advance,
        totalBalanceToPay: balance,
        totalExpenses: expenses,
        totalNet: net,
        ordersByStatus: statusMap,
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 0);
    window.addEventListener('rba-auth-switch', loadData);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadData);
    };
  }, []);

  const formatCurrency = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const chartData = [
    { name: 'Jan', Fretes: summary.totalFreight * 0.38 || 20000, Margem: summary.totalNet * 0.34 || 12000 },
    { name: 'Fev', Fretes: summary.totalFreight * 0.52 || 32000, Margem: summary.totalNet * 0.45 || 22000 },
    { name: 'Mar', Fretes: summary.totalFreight * 0.48 || 28000, Margem: summary.totalNet * 0.42 || 19000 },
    { name: 'Abr', Fretes: summary.totalFreight * 0.72 || 45000, Margem: summary.totalNet * 0.64 || 35000 },
    { name: 'Mai', Fretes: summary.totalFreight || 62000, Margem: summary.totalNet || 47000 },
    { name: 'Jun', Fretes: summary.totalFreight * 1.08 || 68000, Margem: summary.totalNet * 1.12 || 52000 },
  ];

  const statusData = [
    { name: 'Rascunho', value: summary.ordersByStatus.Rascunho || 0 },
    { name: 'Análise', value: summary.ordersByStatus['Em Análise'] || 0 },
    { name: 'Liberado', value: summary.ordersByStatus['Liberado para Embarque'] || 0 },
    { name: 'Carregando', value: summary.ordersByStatus.Carregando || 0 },
    { name: 'Pago', value: summary.ordersByStatus.Pago || 0 },
  ];

  return (
    <HeaderAndSidebar>
      <div id="dashboard-container" className="space-y-8">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {errorMsg}
          </div>
        )}
        <section className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-[72ch]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8b45d]/35 bg-[#fff7df] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#8a6725]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Painel operacional
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
                  Operação online
                </span>
              </div>
              <h1 className="mt-5 max-w-[14ch] text-3xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-[2.75rem]">
                Fretes, caixa e risco sob controle.
              </h1>
              <p className="mt-4 max-w-[68ch] text-base leading-7 text-slate-600">
                Acompanhe prioridades do dia, pagamentos pendentes, margem e ordens recentes sem perder contexto operacional.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Link
                id="dash-add-order-btn"
                href="/ordens/nova"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-950 px-5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4.5 w-4.5" />
                Nova ordem
              </Link>
              <Link
                href="/relatorios"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-[oklch(98%_0.006_83)] px-5 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition hover:border-[#d8b45d] hover:text-slate-950"
              >
                Relatórios
                <ArrowUpRight className="h-4.5 w-4.5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryLine label="Ordens abertas" value={summary.totalOrders.toString()} />
            <SummaryLine label="Margem líquida" value={formatCurrency(summary.totalNet)} />
            <SummaryLine label="Saldo a liquidar" value={formatCurrency(summary.totalBalanceToPay)} />
            <SummaryLine label="Despesas" value={formatCurrency(summary.totalExpenses)} />
          </div>
        </section>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] py-24 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#d8b45d] border-t-transparent" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Carregando métricas...</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Faturamento bruto"
                value={formatCurrency(summary.totalFreight)}
                detail={`Margem liquida: ${formatCurrency(summary.totalNet)}`}
                icon={DollarSign}
                tone="emerald"
              />
              <KpiCard
                label="Adiantamentos"
                value={formatCurrency(summary.totalAdvance)}
                detail={`Despesas: ${formatCurrency(summary.totalExpenses)}`}
                icon={Activity}
                tone="blue"
              />
              <KpiCard
                label="Saldos pendentes"
                value={formatCurrency(summary.totalBalanceToPay)}
                detail="A liquidar na entrega do CTE"
                icon={Clock}
                tone="gold"
              />
              <KpiCard
                label="Fretes ativos"
                value={`${summary.totalOrders} emissões`}
                detail={`Liberados: ${summary.ordersByStatus['Liberado para Embarque'] || 0}`}
                icon={TrendingUp}
                tone="slate"
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Pendências críticas</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Alertas operacionais</h2>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-6">
                  <AlertItem
                    title="Motorista bloqueado ativo"
                    text="Claudio de Souza possui restrição cadastral ativa de seguro no sistema."
                    icon={AlertTriangle}
                    tone="rose"
                  />
                  <AlertItem
                    title="Buonny a renovar"
                    text="Condução de Marcos Vinicius Santos com consulta Buonny pendente de renovação."
                    icon={Clock}
                    tone="amber"
                  />
                  <AlertItem
                    title="Fechamento mensal"
                    text="Nenhum desvio financeiro encontrado nas auditorias de pátio hoje."
                    icon={CheckCircle}
                    tone="blue"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Evolução mensal</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Fretes e margem líquida</h2>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Valores consolidados por competência</span>
                </div>

                <div className="mt-6 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fretesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d8b45d" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#d8b45d" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="margemFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'oklch(98.5% 0.006 83)', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 18px 45px rgba(15,23,42,0.12)' }}
                        itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 800 }}
                        labelStyle={{ color: '#64748b', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                      <Area type="monotone" dataKey="Fretes" stroke="#b88a2c" strokeWidth={3} fill="url(#fretesFill)" />
                      <Area type="monotone" dataKey="Margem" stroke="#10b981" strokeWidth={3} fill="url(#margemFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.42fr]">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Operação recente</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Últimas fichas de frete</h2>
                  </div>
                  <Link href="/ordens" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#8a6725] hover:text-slate-950">
                    Ver todas
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="py-16 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Nenhuma ordem cadastrada ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          <th className="p-4">Ficha</th>
                          <th className="p-4">Motorista</th>
                          <th className="p-4">Rota</th>
                          <th className="p-4">Cliente</th>
                          <th className="p-4">Valor bruto</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 6).map((order) => (
                          <tr key={order.id} className="transition hover:bg-slate-50/80">
                            <td className="p-4 font-black text-slate-950">{order.order_number}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{order.driver_name}</p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">CPF: {order.driver_cpf}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{order.origin} {'->'} {order.destination}</p>
                              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">Entrega: {order.delivery_date}</p>
                            </td>
                            <td className="p-4 font-semibold text-slate-600">{order.client_name}</td>
                            <td className="p-4 font-mono font-black text-slate-950">{formatCurrency(Number(order.freight_value) || 0)}</td>
                            <td className="p-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="p-4 text-right">
                              <Link href={`/ordens/${order.id}`} className="inline-flex rounded-lg border border-slate-200 bg-[oklch(98%_0.006_83)] px-3 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:border-[#d8b45d] hover:text-slate-950">
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

              <div className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Distribuição</p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">Status das ordens</h2>
                  </div>
                  <UserPlus className="h-5 w-5 text-[#8a6725]" />
                </div>

                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: 'oklch(98.5% 0.006 83)', borderColor: '#e2e8f0', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" fill="#d8b45d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </HeaderAndSidebar>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-lg font-black leading-tight text-slate-950">{value}</p>
    </div>
  );
}

function KpiCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: React.ElementType; tone: 'emerald' | 'blue' | 'gold' | 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    gold: 'bg-[#fff7df] text-[#8a6725] border-[#ead18b]',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function AlertItem({ title, text, icon: Icon, tone }: { title: string; text: string; icon: React.ElementType; tone: 'rose' | 'amber' | 'blue' }) {
  const tones = {
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
  };

  return (
    <div className="flex gap-3 border-t border-slate-200 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === 'Pago'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'Liberado para Embarque'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : status === 'Carregando'
          ? 'border-orange-200 bg-orange-50 text-orange-700'
        : status === 'Em Análise'
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
          : status === 'Cancelado'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-[#ead18b] bg-[#fff7df] text-[#8a6725]';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${classes}`}>
      {status}
    </span>
  );
}
