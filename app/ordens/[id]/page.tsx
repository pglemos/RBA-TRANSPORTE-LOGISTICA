'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderPDF from '@/components/FreightOrderPDF';
import { FREIGHT_ORDER_STATUSES, getFreightStatusMeta, normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { 
  ArrowLeft,
  Printer,
  Paperclip,
  Edit3,
  Lock,
  ShieldCheck,
  User,
  Truck,
  FileCheck2,
  DollarSign,
  Clock,
  AlertCircle,
  Upload,
  Receipt,
  Camera,
  FileText,
  ClipboardList,
  Trash2,
  Loader2,
  Eye,
  Download
} from 'lucide-react';

const ORDER_STATUS_OPTIONS = FREIGHT_ORDER_STATUSES;

export default function OrderDetailsPage() {
const params = useParams<{ id: string }>();
const id = params?.id;
  const router = useRouter();
  
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  
  // PDF Trigger
  const [showPDF, setShowPDF] = useState(false);

  // Upload de documentos por categoria
  const [uploadingCat, setUploadingCat] = useState<string>('');
  const [attachmentMsg, setAttachmentMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Faturamento (CTE) — edição inline na página de detalhes
  const [cteValueEdit, setCteValueEdit] = useState<number>(0);
  const [cteDiscountEdit, setCteDiscountEdit] = useState<number>(10);
  const [savingFat, setSavingFat] = useState(false);
  const [fatMsg, setFatMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Status operacional — edição inline na página de detalhes
  const [statusEdit, setStatusEdit] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const DOC_CATEGORIES = [
    { key: 'comprovante_pagamento', label: 'Comprovante de Pagamento ao Motorista', hint: 'PIX / transferência paga ao condutor', icon: Receipt, accent: 'text-emerald-600' },
    { key: 'auditoria_carga', label: 'Foto da Auditoria da Carga', hint: 'Registro do carregamento na origem', icon: Camera, accent: 'text-sky-600' },
    { key: 'cte', label: 'Documento do CTE', hint: 'Conhecimento de Transporte Eletrônico', icon: FileText, accent: 'text-yellow-600' },
    { key: 'manifesto', label: 'Documento do Manifesto', hint: 'MDF-e do transporte', icon: ClipboardList, accent: 'text-purple-600' },
  ] as const;

  const fetchCurrentRole = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setCurrentRole(data?.user?.role || null);
    } catch {
      setCurrentRole(null);
    }
  }, []);

  const handleUploadDoc = async (category: string, file: File | null) => {
    if (!file) return;
    setUploadingCat(category);
    setAttachmentMsg(null);
    try {
      const fd = new FormData();
      fd.append('order_id', String(id));
      fd.append('file', file);
      fd.append('category', category);
      const res = await fetch('/api/attachments', { method: 'POST', body: fd });
      const data = await res.json();
      if (data?.success) {
        setAttachmentMsg({ type: 'ok', text: 'Documento anexado com sucesso.' });
        await fetchOrderDetails();
      } else {
        setAttachmentMsg({ type: 'err', text: data?.error || 'Falha ao enviar o documento.' });
      }
    } catch (e) {
      setAttachmentMsg({ type: 'err', text: 'Erro de rede ao enviar o documento.' });
    } finally {
      setUploadingCat('');
    }
  };

  const handleDeleteDoc = async (attId: string) => {
    if (!confirm('Excluir este documento anexado?')) return;
    setAttachmentMsg(null);
    try {
      const res = await fetch(`/api/attachments?id=${attId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data?.success) {
        setAttachmentMsg({ type: 'ok', text: 'Documento excluído com sucesso.' });
        await fetchOrderDetails();
      } else {
        setAttachmentMsg({ type: 'err', text: data?.error || 'Erro ao excluir o documento.' });
      }
    } catch (e) {
      setAttachmentMsg({ type: 'err', text: 'Erro ao excluir o documento.' });
    }
  };

  // Load order details
  const fetchOrderDetails = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCteValueEdit(Number(data.cte_value) || 0);
        setCteDiscountEdit(data.cte_discount_percent ?? 10);
          setStatusEdit(normalizeFreightOrderStatus(data.status));
        setOrder(data);
      } else {
        setErrorMsg("Você não possui permissão para ver esta ficha, ou o registro não existe.");
      }
    } catch (e) {
      setErrorMsg("Erro de rede ao sincronizar dados da Ordem.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleSaveStatus = async () => {
    setSavingStatus(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusEdit }),
      });
      const data = await res.json();
      if (data?.success) {
        setStatusMsg({ type: 'ok', text: 'Status atualizado com sucesso.' });
        await fetchOrderDetails();
      } else {
        setStatusMsg({ type: 'err', text: data?.error || 'Falha ao atualizar o status.' });
      }
    } catch {
      setStatusMsg({ type: 'err', text: 'Erro de rede ao atualizar o status.' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveFaturamento = async () => {
    setSavingFat(true);
    setFatMsg(null);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cte_value: Number(cteValueEdit) || 0,
          cte_discount_percent: Number(cteDiscountEdit) || 0,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setFatMsg({ type: 'ok', text: 'Faturamento atualizado com sucesso.' });
        await fetchOrderDetails();
      } else {
        setFatMsg({ type: 'err', text: data?.error || 'Falha ao salvar o faturamento.' });
      }
    } catch {
      setFatMsg({ type: 'err', text: 'Erro de rede ao salvar o faturamento.' });
    } finally {
      setSavingFat(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      fetchOrderDetails();
      fetchCurrentRole();
    }, 0);

    // Refresh details if user changes simulated role (handles dynamic LGPD unmasking!)
    window.addEventListener('rba-auth-switch', fetchOrderDetails);
    window.addEventListener('rba-auth-switch', fetchCurrentRole);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', fetchOrderDetails);
      window.removeEventListener('rba-auth-switch', fetchCurrentRole);
    };
  }, [id, fetchOrderDetails, fetchCurrentRole]);

  if (loading) {
    return (
      <HeaderAndSidebar>
        <div className="bg-white p-24 text-center border rounded-3xl">
          <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-550 font-bold text-xs">Acessando registro seguro no banco...</p>
        </div>
      </HeaderAndSidebar>
    );
  }

  if (errorMsg) {
    return (
      <HeaderAndSidebar>
        <div className="bg-white border rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto animate-pulse" />
          <h2 className="text-md font-black text-slate-900">Acesso Negado ou Não Encontrado</h2>
          <p className="text-xs text-slate-450 leading-relaxed">{errorMsg}</p>
          <Link href="/ordens" className="px-4 py-2 bg-slate-900 text-white rounded-lg inline-block text-xs font-bold">
            Voltar para Arquivos
          </Link>
        </div>
      </HeaderAndSidebar>
    );
  }

  // Memória de cálculo do faturamento (CTE) — derivada dos campos editáveis + custos da ordem
  const fmtBR = (n: number) => (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fatDespesas = Number(order.total_expenses) || 0;
  const fatFrete = Number(order.freight_value) || 0;
  const fatDescontoValor = (Number(cteValueEdit) || 0) * (Number(cteDiscountEdit) || 0) / 100;
  const fatLiquido = (Number(cteValueEdit) || 0) - fatDescontoValor - fatFrete - fatDespesas;
  const fatDirty =
    (Number(cteValueEdit) || 0) !== (Number(order.cte_value) || 0) ||
    (Number(cteDiscountEdit) || 0) !== (order.cte_discount_percent ?? 10);
  const statusDirty = statusEdit !== normalizeFreightOrderStatus(order.status);
  const canManageFaturamento = currentRole === 'Administrador' || currentRole === 'Financeiro' || currentRole === 'Operacional';
  const canViewFreightFinancialDetails = currentRole !== null;

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">

        {/* Navigation Breadcrumb & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border rounded-3xl border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/ordens" className="p-2 border hover:bg-slate-50 text-slate-700 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Ficha Operacional Regulada</span>
              <h1 className="text-sm font-black text-slate-900">Ordem de Frete Nº {order.order_number}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="details-print-btn"
              onClick={() => setShowPDF(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir Ficha (PDF)
            </button>
            
            <Link
              id="details-edit-lnk"
              href={`/ordens/${order.id}/editar`}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Edit3 className="h-4 w-4" />
              Editar Ficha
            </Link>
          </div>
        </div>

        {/* Visual Stepper Timeline */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto py-2">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-250 dark:bg-slate-850 -z-10 rounded" />
            
            {/* Connecting active line */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-yellow-500 transition-all duration-500 rounded -z-10"
              style={{
                width: 
                  order.status === 'Contratar' ? '0%' :
                  order.status === 'Carregando' ? '33.3%' :
                  order.status === 'Em Trânsito' || order.status === 'Em Viagem' ? '66.6%' : '100%'
              }}
            />

            {[
              { id: 'Contratar', label: 'Contratação', icon: '🤝' },
              { id: 'Carregando', label: 'Carregamento', icon: '🚛' },
              { id: 'Em Trânsito', label: 'Em Trânsito', icon: '🚚' },
              { id: 'Entregue', label: 'Entregue', icon: '✅' },
            ].map((step, idx) => {
              const normalizedCurrent = normalizeFreightOrderStatus(order.status);
              const stepRanks = { Contratar: 0, Carregando: 1, 'Em Trânsito': 2, Entregue: 3 };
              
              const currentRank = stepRanks[normalizedCurrent] ?? 0;
              const stepRank = stepRanks[step.id as keyof typeof stepRanks] ?? 0;
              
              const isCompleted = stepRank < currentRank;
              const isActive = stepRank === currentRank;
              
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                      isActive ? 'bg-yellow-500 border-yellow-500 text-slate-950 font-black shadow-[0_0_10px_rgba(216,180,93,0.4)] ring-4 ring-yellow-100 dark:ring-yellow-950/40' :
                      'bg-white dark:bg-slate-900 border-slate-350 text-slate-400 dark:border-slate-800'
                    }`}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider mt-2 whitespace-nowrap ${
                      isActive ? 'text-yellow-600' :
                      isCompleted ? 'text-emerald-700' :
                      'text-slate-450 dark:text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Details Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. DADOS DE LOGÍSTICA */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div className="border-b pb-3 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-yellow-650" />
                  Dados de Itinerário & Clientes
                </h2>
                <span className="text-[10px] bg-slate-100 p-1 px-2.5 rounded-full font-bold text-slate-600">
                  {getFreightStatusMeta(order.status).icon} {normalizeFreightOrderStatus(order.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-xs font-medium">
                <div>
                  <span className="text-[9px] text-slate-450 block font-bold uppercase mb-0.5">Cidade Origem</span>
                  <p className="text-slate-900 font-bold">{order.origin}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 block font-bold uppercase mb-0.5">Cidade Destino</span>
                  <p className="text-slate-900 font-bold">{order.destination}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 block font-bold uppercase mb-0.5">Data de Entrega Limite</span>
                  <p className="text-slate-900 font-bold">{order.delivery_date || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-450 block font-bold uppercase">Cliente Tomador / Pagador</span>
                  <p className="text-slate-900 font-bold mt-1 text-sm leading-none">{order.client_name}</p>
                  <p className="text-slate-500 mt-1">CNPJ: {order.client_document}</p>
                </div>

                {order.notes && (
                  <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 pl-0 md:pl-4">
                    <span className="text-[9px] text-slate-450 block font-bold uppercase">Observações Operacionais</span>
                    <p className="text-slate-650 italic mt-1 leading-normal text-[11px]">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. DADOS DO MOTORISTA */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div className="border-b pb-3 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-550" />
                  Condutor & Snapshot Bancário
                </h2>
                {order.driver_cpf.includes('*') && (
                  <span className="text-[9px] bg-red-100 text-red-800 font-bold rounded-lg px-2 py-0.5 flex items-center gap-1 font-semibold uppercase">
                    <Lock className="h-3 w-3" />
                    LGPD Máscara
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-450 block font-bold">CONTA E CHAVE CONTROLE</span>
                  <p className="text-slate-900 font-black">{order.driver_name}</p>
                  <p className="text-slate-500">CPF: {order.driver_cpf}</p>
                  <p className="text-slate-500">RG: {order.driver_rg}</p>
                  <p className="text-slate-500">Contato: {order.driver_phone}</p>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <span className="text-[9px] text-slate-450 block font-bold">FAVORECIDO DO CRÉDITO</span>
                  <p className="text-slate-800 font-bold">{order.bank_data_snapshot.beneficiary_name}</p>
                  <p className="text-slate-500">Banco: {order.bank_data_snapshot.bank_name}</p>
                  <p className="text-slate-500">Ag: {order.bank_data_snapshot.bank_agency} | CC: {order.bank_data_snapshot.bank_account}</p>
                  <p className="text-emerald-700 font-bold">Pix: {order.bank_data_snapshot.pix_key}</p>
                </div>
              </div>
            </div>

            {/* 3. DADOS DE CUSTOS E VALORES */}
            {canViewFreightFinancialDetails && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div className="border-b pb-3">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                  Detalhamento Financeiro do Frete
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fluxos de Pagamentos</h4>
                  <div className="flex justify-between border-b pb-1.5 text-slate-600">
                    <span>Valor do Frete ao Motorista:</span>
                    <strong className="text-slate-900">R$ {order.freight_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-red-700">
                    <span>(-) Adiantamento faturado:</span>
                    <strong>R$ {order.advance_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-red-700">
                    <span>(-) Pedágio / Pago à Vista:</span>
                    <strong>R$ {order.cash_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-950 font-black pt-1.5 bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20">
                    <span>SALDO DE FRETE A PAGAR:</span>
                    <strong>R$ {order.balance_value.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Custos e Ajustes de Carga</h4>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Ajudante de Carga:</span>
                    <span>R$ {order.loading_expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Pedágio / Descarga duto:</span>
                    <span>R$ {order.unloading_expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Outros custos operacionais:</span>
                    <span>R$ {order.other_expenses.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-black pt-1.5 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <span>VALOR LÍQUIDO RBA:</span>
                    <strong>R$ {order.net_value.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 4. FATURAMENTO (CTE) — MEMÓRIA DE CÁLCULO EDITÁVEL */}
            {canManageFaturamento && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div className="border-b pb-3 flex items-center justify-between">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-emerald-600" />
                  Faturamento (CTE) — Memória de Cálculo
                </h2>
                {order.cte_number && (
                  <span className="text-[10px] bg-slate-100 p-1 px-2.5 rounded-full font-bold text-slate-600">
                    CTE {order.cte_number}
                  </span>
                )}
              </div>

              {/* Entradas editáveis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[9px] text-slate-450 font-bold uppercase block mb-1">Valor do CTE (Receita Bruta)</span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-emerald-500">
                    <span className="px-3 text-xs font-bold text-slate-500 bg-slate-50 self-stretch flex items-center">R$</span>
                    <input
                      id="det-cte-value"
                      type="number" step="0.01" min="0"
                      value={cteValueEdit || ''}
                      onChange={(e) => setCteValueEdit(Number(e.target.value))}
                      placeholder="0,00"
                      className="flex-1 min-w-0 px-3 py-2 text-sm font-bold text-slate-900 outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-[9px] text-slate-450 font-bold uppercase block mb-1">Desconto sobre o CTE</span>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-emerald-500">
                    <input
                      id="det-cte-discount"
                      type="number" step="0.01" min="0" max="100"
                      value={cteDiscountEdit}
                      onChange={(e) => setCteDiscountEdit(Number(e.target.value))}
                      placeholder="10"
                      className="flex-1 min-w-0 px-3 py-2 text-sm font-bold text-slate-900 outline-none"
                    />
                    <span className="px-3 text-xs font-bold text-slate-500 bg-slate-50 self-stretch flex items-center">%</span>
                  </div>
                </label>
              </div>

              {/* Memória de cálculo (ao vivo) */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-1.5 text-xs font-medium">
                <div className="flex justify-between text-slate-700">
                  <span>Receita Bruta (CTE)</span>
                  <strong className="text-blue-800">R$ {fmtBR(cteValueEdit)}</strong>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>(−) Desconto ({Number(cteDiscountEdit) || 0}%)</span>
                  <strong>− R$ {fmtBR(fatDescontoValor)}</strong>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>(−) Valor de Frete <span className="text-slate-400">(motorista: AD. + saldo)</span></span>
                  <strong>− R$ {fmtBR(fatFrete)}</strong>
                </div>
                <div className="flex justify-between text-red-700">
                  <span>(−) Despesas <span className="text-slate-400">(carga / descarga / outros)</span></span>
                  <strong>− R$ {fmtBR(fatDespesas)}</strong>
                </div>
                <div className={`flex justify-between font-black pt-2 mt-1 border-t border-emerald-200 ${fatLiquido < 0 ? 'text-red-600' : 'text-emerald-800'}`}>
                  <span className="uppercase">Resultado Líquido RBA</span>
                  <strong className="text-sm">R$ {fmtBR(fatLiquido)}</strong>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {fatMsg ? (
                  <span className={`text-[11px] font-bold ${fatMsg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {fatMsg.text}
                  </span>
                ) : <span />}
                <button
                  id="det-fat-save"
                  onClick={handleSaveFaturamento}
                  disabled={savingFat || !fatDirty}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  {savingFat ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  {savingFat ? 'Salvando...' : 'Salvar Faturamento'}
                </button>
              </div>
            </div>
            )}

          </div>

          {/* Right Column sidebar info: Clearances, Signatures and Audit events trail */}
          <div className="space-y-6">

            {/* STATUS OPERACIONAL EDITÁVEL */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block">Status da Ordem</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">Controle a etapa operacional da ficha sem abrir a edição completa.</p>
              </div>

              <label className="block">
                <span className="text-[9px] text-slate-450 font-bold uppercase block mb-1">Status Geral</span>
                <select
                  id="det-order-status"
                  value={statusEdit}
                  onChange={(e) => {
                    setStatusEdit(e.target.value);
                    setStatusMsg(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-800 outline-none focus:border-yellow-500"
                >
                  {ORDER_STATUS_OPTIONS.map(statusOption => {
                    const meta = getFreightStatusMeta(statusOption);
                    return (
                      <option key={statusOption} value={statusOption}>
                        {meta.icon} {meta.label}
                      </option>
                    );
                  })}
                </select>
              </label>

              <div className="flex items-center justify-between gap-3">
                {statusMsg ? (
                  <span className={`text-[11px] font-bold ${statusMsg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'}`}>
                    {statusMsg.text}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Atual: {normalizeFreightOrderStatus(order.status)}</span>
                )}
                <button
                  id="det-status-save"
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={savingStatus || !statusDirty}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                  {savingStatus ? 'Salvando...' : 'Salvar Status'}
                </button>
              </div>
            </div>
            
            {/* COMPLIANCE CLEARANCES POOL */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block">Varredura e Seguradoras</span>
              
              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span>Consulta Buonny:</span>
                  <span className={`font-black uppercase text-[10px] ${order.buonny_status === 'Aprovado' ? 'text-emerald-700' : 'text-yellow-600'}`}>
                    {order.buonny_status}
                  </span>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">STATUS DE LIBERAÇÃO</span>
                    <p className="font-black text-slate-900">{normalizeFreightOrderStatus(order.shipment_release_status)}</p>
                  <p className="text-[9.5px] text-slate-500">Limite de Cobertura: {order.shipment_release_limit}</p>
                </div>
              </div>
            </div>

            {/* DOCUMENTOS ANEXADOS POR CATEGORIA */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Documentos da Ordem ({order.attachments?.length || 0})
                </span>
              </div>
              {attachmentMsg && (
                <div className={`p-2.5 rounded-xl border text-[10px] font-bold ${
                  attachmentMsg.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {attachmentMsg.text}
                </div>
              )}

              <div className="space-y-3">
                {DOC_CATEGORIES.map((cat) => {
                  const files = (order.attachments || []).filter((f: any) => f.file_type === cat.key);
                  const Icon = cat.icon;
                  const isUploading = uploadingCat === cat.key;
                  return (
                    <div key={cat.key} className="border border-slate-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cat.accent}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-900 leading-tight">{cat.label}</p>
                          <p className="text-[9px] text-slate-400 font-medium">{cat.hint}</p>
                        </div>
                      </div>

                      {/* Lista de arquivos desta categoria */}
                      {files.length > 0 && (
                        <div className="space-y-1.5">
                          {files.map((file: any) => (
                            <DocFileRow key={file.id} file={file} onDelete={handleDeleteDoc} />
                          ))}
                        </div>
                      )}

                      {/* Botão de upload */}
                      <label className={`flex items-center justify-center gap-1.5 py-2 border border-dashed rounded-lg text-[10px] font-bold cursor-pointer select-none transition-colors ${isUploading ? 'border-slate-300 text-slate-400' : 'border-slate-300 text-slate-600 hover:border-yellow-500 hover:bg-yellow-50'}`}>
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3.5 w-3.5" />
                            {files.length > 0 ? 'Anexar outro' : 'Anexar documento'}
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            handleUploadDoc(cat.key, e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Outros anexos sem categoria (CTE/comprovantes antigos) */}
              {(() => {
                const known = DOC_CATEGORIES.map(c => c.key);
                const others = (order.attachments || []).filter((f: any) => !known.includes(f.file_type));
                if (others.length === 0) return null;
                return (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Outros anexos</span>
                    {others.map((file: any) => (
                      <DocFileRow key={file.id} file={file} onDelete={handleDeleteDoc} />
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* AUDIT EVENTS TRAIL TIMELINE (LGPD Compliance) */}
            <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 space-y-4">
              <div>
                <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest block">Rastro de Auditoria Operacional</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Controle de acessos e modificações exigido pela LGPD.</p>
              </div>

              {/* Timber timeline events list */}
              <div className="space-y-3 text-[11px] leading-relaxed">
                
                <div className="border-l-2 border-yellow-500 pl-3 relative">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-yellow-500" />
<span className="text-[9px] text-slate-500 block">Criado por</span>
<span className="text-white font-bold block">{order.created_by || order.responsible_name || 'Não informado'}</span>
<span className="text-slate-400">Ação: Gerou a Ficha Securitária CTE {order.cte_number || order.order_number}</span>
</div>

<div className="border-l-2 border-slate-700 pl-3 relative">
<span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-slate-700 border border-slate-600" />
<span className="text-[9px] text-slate-500 block">Editado por</span>
<span className="text-white font-bold block">{order.updated_by || order.created_by || order.responsible_name || 'Não informado'}</span>
<span className="text-slate-400">Ação: Última alteração registrada na ficha.</span>
</div>

<div className="border-l-2 border-slate-800 pl-3 relative">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-slate-800 border border-slate-700" />
                  <span className="text-[9px] text-slate-500 block">Auto-Sync</span>
                  <span className="text-slate-400">Ação: Dados bancários do condutor congelados de forma criptografada.</span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Dynamic printable modal sheet render */}
        {showPDF && (
          <FreightOrderPDF
            order={order}
            onClose={() => setShowPDF(false)}
          />
        )}

      </div>
    </HeaderAndSidebar>
  );
}

/** Linha de um documento anexado, com ações: Visualizar, Baixar e Excluir (com texto). */
function DocFileRow({ file, onDelete }: { file: any; onDelete: (id: string) => void }) {
  return (
    <div className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold space-y-2">
      <span className="block truncate" title={file.file_name}>{file.file_name}</span>
      <div className="flex items-center flex-wrap gap-1.5">
        <a
          href={file.file_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-yellow-500 hover:text-yellow-700"
        >
          <Eye className="h-3.5 w-3.5" />
          Visualizar
        </a>
        <a
          href={file.file_url}
          download={file.file_name}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar
        </a>
        <button
          onClick={() => onDelete(file.id)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-red-600 hover:border-red-400 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>
    </div>
  );
}
