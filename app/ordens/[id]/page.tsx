'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import FreightOrderPDF from '@/components/FreightOrderPDF';
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
  AlertCircle 
} from 'lucide-react';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // PDF Trigger
  const [showPDF, setShowPDF] = useState(false);

  // Load order details
  const fetchOrderDetails = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
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

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      fetchOrderDetails();
    }, 0);
    
    // Refresh details if user changes simulated role (handles dynamic LGPD unmasking!)
    window.addEventListener('rba-auth-switch', fetchOrderDetails);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', fetchOrderDetails);
    };
  }, [id, fetchOrderDetails]);

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
                  {order.status}
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
                  <p className="text-slate-900 font-bold font-mono">{order.delivery_date}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-slate-450 block font-bold uppercase">Cliente Tomador / Pagador</span>
                  <p className="text-slate-900 font-bold mt-1 text-sm leading-none">{order.client_name}</p>
                  <p className="text-slate-500 font-mono mt-1">CNPJ: {order.client_document}</p>
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
                  <p className="text-slate-500 font-mono">CPF: {order.driver_cpf}</p>
                  <p className="text-slate-500 font-mono">RG: {order.driver_rg}</p>
                  <p className="text-slate-500">Contato: {order.driver_phone}</p>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <span className="text-[9px] text-slate-450 block font-bold">FAVORECIDO DO CRÉDITO</span>
                  <p className="text-slate-800 font-bold">{order.bank_data_snapshot.beneficiary_name}</p>
                  <p className="text-slate-500">Banco: {order.bank_data_snapshot.bank_name}</p>
                  <p className="text-slate-500">Ag: {order.bank_data_snapshot.bank_agency} | CC: {order.bank_data_snapshot.bank_account}</p>
                  <p className="text-emerald-700 font-bold font-mono">Pix: {order.bank_data_snapshot.pix_key}</p>
                </div>
              </div>
            </div>

            {/* 3. DADOS DE CUSTOS E VALORES */}
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
                    <span>Valor Bruto Contratado:</span>
                    <strong className="text-slate-900 font-mono">R$ {order.freight_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-red-700">
                    <span>(-) Adiantamento faturado:</span>
                    <strong className="font-mono">R$ {order.advance_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-red-700">
                    <span>(-) Pedágio / Pago à Vista:</span>
                    <strong className="font-mono">R$ {order.cash_value.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-950 font-black pt-1.5 bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20">
                    <span>SALDO DE FRETE A PAGAR:</span>
                    <strong className="font-mono">R$ {order.balance_value.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Custos e Ajustes de Carga</h4>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Ajudante de Carga:</span>
                    <span className="font-mono">R$ {order.loading_expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Pedágio / Descarga duto:</span>
                    <span className="font-mono">R$ {order.unloading_expense.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 text-slate-550">
                    <span>Outros custos operacionais:</span>
                    <span className="font-mono">R$ {order.other_expenses.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-black pt-1.5 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <span>VALOR LÍQUIDO RBA:</span>
                    <strong className="font-mono">R$ {order.net_value.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column sidebar info: Clearances, Signatures and Audit events trail */}
          <div className="space-y-6">
            
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

                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span>Consulta Pancary:</span>
                  <span className={`font-black uppercase text-[10px] ${order.pancary_status === 'Aprovado' ? 'text-emerald-700' : 'text-yellow-600'}`}>
                    {order.pancary_status}
                  </span>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-bold">STATUS DE LIBERAÇÃO</span>
                  <p className="font-black text-slate-900">{order.shipment_release_status}</p>
                  <p className="text-[9.5px] text-slate-500">Limite de Cobertura: {order.shipment_release_limit}</p>
                </div>
              </div>
            </div>

            {/* INTEGRATED DIGITAL ATTACHMENTS FOR EDITING / REVIEWS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block">Anexos e Certidões ({order.attachments?.length || 0})</span>
              
              {order.attachments && order.attachments.length > 0 ? (
                <div className="space-y-1.5 min-h-0">
                  {order.attachments.map((file: any) => (
                    <div key={file.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between font-semibold">
                      <span className="truncate max-w-[140px]">{file.file_name}</span>
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="text-yellow-600 hover:underline">Ver Doc</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhum arquivo digital ou CTE anexado a esta Ordem.</p>
              )}
            </div>

            {/* AUDIT EVENTS TRAIL TIMELINE (LGPD Compliance) */}
            <div className="bg-slate-950 text-slate-200 rounded-3xl p-5 space-y-4">
              <div>
                <span className="text-[10px] text-yellow-400 font-extrabold uppercase tracking-widest block">Rastro de Auditoria Operacional</span>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">Controle de acessos e modificações exigido pela LGPD.</p>
              </div>

              {/* Timber timeline events list */}
              <div className="space-y-3 text-[11px] font-mono leading-relaxed">
                
                <div className="border-l-2 border-yellow-500 pl-3 relative">
                  <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-[9px] text-slate-500 block">Hoje • Carimbo Oficial</span>
                  <span className="text-white font-bold block">{order.responsible_name}</span>
                  <span className="text-slate-400">Ação: Gerou a Ficha Securitária Nº {order.order_number}</span>
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
