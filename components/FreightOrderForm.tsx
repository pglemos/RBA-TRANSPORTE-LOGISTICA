'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  User, 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  FileCheck2, 
  Paperclip, 
  NotebookPen, 
  Save, 
  ArrowLeft,
  ChevronRight,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Driver, Vehicle, Client, FreightOrder } from '@/lib/db';

interface Props {
  initialData?: FreightOrder & {
    attachments?: any[];
  };
}

export default function FreightOrderForm({ initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Active Tab
  const [activeTab, setActiveTab] = useState<'viagem' | 'motorista' | 'veiculo' | 'financeiro' | 'consultas' | 'documentos'>('viagem');

  // Load selection tables from APIs
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingSelections, setLoadingSelections] = useState(true);

  // Form Field States
  const [driverId, setDriverId] = useState(initialData?.driver_id || '');
  const [vehicleId, setVehicleId] = useState(initialData?.vehicle_id || '');
  const [clientId, setClientId] = useState(initialData?.client_id || '');

  // Trip routing
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [deliveryDate, setDeliveryDate] = useState(initialData?.delivery_date || '');
  const [status, setStatus] = useState<FreightOrder['status']>(initialData?.status || 'Rascunho');
  const [tripNotes, setTripNotes] = useState(initialData?.notes || '');

  // Finance Bruto & Liquidations (calculated live)
  const [freightValue, setFreightValue] = useState(initialData?.freight_value || 0);
  const [advanceValue, setAdvanceValue] = useState(initialData?.advance_value || 0);
  const [cashValue, setCashValue] = useState(initialData?.cash_value || 0);
  const [loadingExpense, setLoadingExpense] = useState(initialData?.loading_expense || 0);
  const [unloadingExpense, setUnloadingExpense] = useState(initialData?.unloading_expense || 0);
  const [otherExpenses, setOtherExpenses] = useState(initialData?.other_expenses || 0);

  // Security Clearances (Buonny & Pancary)
  const [buonnyStatus, setBuonnyStatus] = useState<FreightOrder['buonny_status']>(initialData?.buonny_status || 'Em Análise');
  const [pancaryStatus, setPancaryStatus] = useState<FreightOrder['pancary_status']>(initialData?.pancary_status || 'Em Análise');
  const [analysisNotes, setAnalysisNotes] = useState(initialData?.notes || '');

  // Shipment Release
  const [shipmentReleaseStatus, setShipmentReleaseStatus] = useState<FreightOrder['shipment_release_status']>(initialData?.shipment_release_status || 'Pendente');
  const [shipmentReleaseLimit, setShipmentReleaseLimit] = useState<FreightOrder['shipment_release_limit']>(initialData?.shipment_release_limit || 'Até 100.000');
  const [releaseJustification, setReleaseJustification] = useState('');

  // Documents
  const [cteNumber, setCteNumber] = useState(initialData?.cte_number || '');

  // Signatures
  const [responsibleName, setResponsibleName] = useState(initialData?.responsible_name || '');
  const [signatureText, setSignatureText] = useState(initialData?.signature_url ? 'Confirmada' : '');

  // Double validations
  const [confirmNegativeBalance, setConfirmNegativeBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Temporary attachment upload simulations
  const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
  const [uploadingDemo, setUploadingDemo] = useState(false);

  // Load lists
  useEffect(() => {
    async function loadResources() {
      try {
        const [drvRes, vhcRes, cliRes] = await Promise.all([
          fetch('/api/drivers'),
          fetch('/api/vehicles'),
          fetch('/api/clients')
        ]);
        const drvData = await drvRes.json();
        const vhcData = await vhcRes.json();
        const cliData = await cliRes.json();
        
        setDrivers(drvData);
        setVehicles(vhcData);
        setClients(cliData);
      } catch (err) {
        console.error("Erro ao carregar seleções:", err);
      } finally {
        setLoadingSelections(false);
      }
    }
    loadResources();
  }, []);

  // Autofill current user name as operator on startup if empty
  useEffect(() => {
    if (!responsibleName) {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(d => {
          if (d?.user) {
            setResponsibleName(d.user.name);
          }
        });
    }
  }, [responsibleName]);

  // DERIVED/CALCULATED VALUES (Calculated cleanly on render)
  const balanceValue = freightValue - advanceValue - cashValue;
  const totalExpenses = loadingExpense + unloadingExpense + otherExpenses;
  const netValue = freightValue - totalExpenses;

  // Selected details display objects
  const activeDriver = drivers.find(d => d.id === driverId);
  const activeVehicle = vehicles.find(v => v.id === vehicleId);
  const activeClient = clients.find(c => c.id === clientId);

  // Quick helper to upload mock files to order
  const handleUploadMockFile = async (type: 'cte' | 'outros' | 'comprovante') => {
    if (!isEdit) {
      alert("Por favor, submeta a Ordem de Frete (Rascunho) primeiro, e então anexe quantos documentos desejar na edição!");
      return;
    }
    setUploadingDemo(true);
    try {
      const fd = new FormData();
      fd.append('order_id', initialData!.id);
      fd.append('file_type', type);
      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data && data.success) {
        setAttachments(prev => [...prev, data.attachment]);
        setSuccessMessage("Documento anexado com sucesso!");
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingDemo(false);
    }
  };

  const handleRemoveAttachment = async (id: string) => {
    try {
      const res = await fetch(`/api/attachments?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAttachments(attachments.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Handler
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // --- Core Validações (PRD Gatekeeping Rules) ---
    if (!driverId) {
      setErrorMessage("Identificação do motorista é obrigatória.");
      setActiveTab('motorista');
      return;
    }
    if (!vehicleId) {
      setErrorMessage("O cadastro do veículo conjugado (cavalo e carreta) é obrigatório.");
      setActiveTab('veiculo');
      return;
    }
    if (!clientId) {
      setErrorMessage("O cliente destinatário do frete é obrigatório.");
      setActiveTab('viagem');
      return;
    }
    if (!origin || !destination) {
      setErrorMessage("Origem e Destino do frete são obrigatórios.");
      setActiveTab('viagem');
      return;
    }
    if (freightValue <= 0) {
      setErrorMessage("O valor bruto do frete é obrigatório e deve ser maior que zero.");
      setActiveTab('financeiro');
      return;
    }

    // Checking 1: Negative Balance confirmations
    if (balanceValue < 0 && !confirmNegativeBalance) {
      setErrorMessage("⚠️ ATENÇÃO: O saldo do frete restou negativo! Por favor, role até o final da aba Financeiro e marque a Caixa de Confirmação operacional.");
      setActiveTab('financeiro');
      return;
    }

    // Checking 2: Shipment release criteria (Sem consulta aprovada exige justificativa!)
    const prechecksOk = buonnyStatus === 'Aprovado' && pancaryStatus === 'Aprovado';
    if (shipmentReleaseStatus === 'Liberado' && !prechecksOk && !releaseJustification.trim()) {
      setErrorMessage("⚠️ VIOLAÇÃO DE LIBERAÇÃO: Não é permitido liberar embarque sem consultas aprovadas por Buonny/Pancary sem uma Justificativa de Override Excepcional preenchida na aba Consultas.");
      setActiveTab('consultas');
      return;
    }

    setSubmitting(true);
    
    // Formulate package
    const payload = {
      driver_id: driverId,
      vehicle_id: vehicleId,
      client_id: clientId,
      freight_value: freightValue,
      advance_value: advanceValue,
      cash_value: cashValue,
      loading_expense: loadingExpense,
      unloading_expense: unloadingExpense,
      other_expenses: otherExpenses,
      origin,
      destination,
      delivery_date: deliveryDate,
      status,
      cte_number: cteNumber,
      notes: `${tripNotes}. ${releaseJustification ? 'Override da liberação: ' + releaseJustification : ''}`.trim(),
      buonny_status: buonnyStatus,
      pancary_status: pancaryStatus,
      shipment_release_status: shipmentReleaseStatus,
      shipment_release_limit: shipmentReleaseLimit,
      responsible_name: responsibleName,
      signature_url: signatureText ? 'Assinado Digitalmente' : ''
    };

    try {
      const url = isEdit ? `/api/orders/${initialData!.id}` : '/api/orders';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data && data.success) {
        setSuccessMessage(isEdit ? "Ficha de Frete atualizada com sucesso!" : "Ficha de Frete Digital gerada com sucesso!");
        setTimeout(() => {
          router.push('/ordens');
        }, 1500);
      } else {
        setErrorMessage(data.error || "Algo deu errado durante a gravação.");
      }
    } catch (err: any) {
      setErrorMessage("Erro de rede ao conectar à API.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSelections) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-250 shadow-sm text-center py-16">
        <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">Conectando ao banco de dados e sincronizando frotas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider">Erros de Validação da Ficha</h4>
            <p className="text-xs mt-1 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <p className="text-xs font-bold tracking-wide">{successMessage}</p>
        </div>
      )}

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* TAB LIST SIDEBAR PANEL */}
        <div className="lg:col-span-1 space-y-2 bg-slate-900/5 p-3 rounded-2xl border border-slate-200 h-fit">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest px-3 block mb-2">Seções da Ficha</span>
          <button
            type="button"
            onClick={() => setActiveTab('viagem')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'viagem' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              1. Viagem & Cliente
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('motorista')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'motorista' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0" />
              2. Motorista & Pix
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('veiculo')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'veiculo' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0" />
              3. Veículo Conjugado
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financeiro')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'financeiro' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 shrink-0" />
              4. Valores & Saldo
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultas')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'consultas' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              5. Consultas & Liberação
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between transition-all ${
              activeTab === 'documentos' ? 'bg-slate-900 border border-slate-900 text-white shadow' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 shrink-0" />
              6. CTE & Assinatura
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ACTIVE FORM BODY GROUP PANEL */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <form id="freight-order-master-form" onSubmit={handleSaveOrder}>
            
            {/* T-1: VIAGEM & CLIENTE DADOS */}
            {activeTab === 'viagem' && (
              <div id="section-trip" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">1. Cadastro da Viagem e Cliente Pagador</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Insira as rotas, os prazos de entrega e selecione um cliente ativo do banco de dados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label id="lbl-viagem-cliente" className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cliente Tomador do Frete *</label>
                    <select
                      id="ip-client-select"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none focus:border-yellow-500 transition-colors"
                    >
                      <option value="">Selecione o Cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - CNPJ: {c.document}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Data Limite de Entrega *</label>
                    <input
                      id="ip-delivery-date"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                {activeClient && (
                  <div className="p-4 bg-slate-55 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">DETALHES DO CLIENTE:</span>
                      <p className="text-slate-800 font-bold mt-1">{activeClient.name}</p>
                      <p className="text-slate-500">Documento: {activeClient.document}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">CANAL DE CONTATO:</span>
                      <p className="text-slate-500 mt-1">Email: {activeClient.email}</p>
                      <p className="text-slate-500">Telefone: {activeClient.phone}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cidade Origem (UF) *</label>
                    <input
                      id="ip-origin"
                      type="text"
                      placeholder="Ex: Santos - SP"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Cidade Destino (UF) *</label>
                    <input
                      id="ip-dest"
                      type="text"
                      placeholder="Ex: Rio de Janeiro - RJ"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status Operacional da Viagem</label>
                    <select
                      id="ip-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 rounded-lg px-3 py-2.5 outline-none"
                    >
                      <option value="Rascunho">🟡 Rascunho Operacional</option>
                      <option value="Em Análise">🔵 Em Análise de Crédito</option>
                      <option value="Aprovado">🟢 Aprovado Buonny/Pancary</option>
                      <option value="Liberado para Embarque">🚛 Liberado para Embarcar</option>
                      <option value="Em Viagem">🛣️ Em Viagem</option>
                      <option value="Entregue">✅ Entregue ao Cliente</option>
                      <option value="Pago">💵 Liquidado / Pago</option>
                      <option value="Cancelado">❌ Ordem Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Observações de Logística</label>
                  <textarea
                    rows={3}
                    placeholder="Lacre balança, horário preferencial, orientações adicionais da RBA..."
                    value={tripNotes}
                    onChange={(e) => setTripNotes(e.target.value)}
                    className="w-full text-xs font-bold p-3 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('motorista')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg flex items-center gap-1 cursor-pointer select-none"
                  >
                    Próxima Seção
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* T-2: MOTORISTA & DADOS BANCÁRIOS */}
            {activeTab === 'motorista' && (
              <div id="section-driver" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">2. Motorista Vinculado e Snapshot Bancário</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Selecione o motorista para puxar seu CPF, RG, celular, dados PIX e dados de favorecido para liquidação direta.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Selecione o Motorista Ativo *</label>
                  <select
                    id="ip-driver-select"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                  >
                    <option value="">Selecione o Condutor</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} {d.status === 'Bloqueado' ? '(⚠️ BLOQUEADO NO CADASTRO)' : ''}</option>
                    ))}
                  </select>
                </div>

                {activeDriver && (
                  <div className="space-y-6">
                    {activeDriver.status === 'Bloqueado' && (
                      <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-800 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>AVISO REGULATÓRIO: Este piloto possui Status BLOQUEADO por sinistros ou pendências de cadastro. Descarregue a ordem somente se possuir override de diretoria!</span>
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold">DOCUMENTOS DO CONDUTOR</span>
                        <p className="font-bold text-slate-800 mt-1">{activeDriver.name}</p>
                        <p className="text-slate-500">CPF: {activeDriver.cpf}</p>
                        <p className="text-slate-500">RG: {activeDriver.rg}</p>
                        <p className="text-slate-500">Telefone: {activeDriver.phone}</p>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-slate-455 block font-bold">CONTA BANCÁRIA VINCULADA</span>
                        <p className="font-bold text-slate-800 mt-1">Banco: {activeDriver.bank_name}</p>
                        <p className="text-slate-500">Agência: {activeDriver.bank_agency}</p>
                        <p className="text-slate-500">Conta: {activeDriver.bank_account}</p>
                        <p className="text-emerald-700 font-bold">Chave Pix: {activeDriver.pix_key}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-455 block font-bold">FAVORECIDO / PIX ALTERNATIVO</span>
                        <p className="font-bold mt-1 text-slate-800">Nome: {activeDriver.beneficiary_name}</p>
                        <p className="text-slate-500">Documento: {activeDriver.beneficiary_document}</p>
                        <span className="text-[8px] bg-sky-200/55 text-sky-800 block px-1 mt-2 rounded font-mono">
                          REGISTRO AUDITÁVEL EM LIQUIDAÇÕES
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('viagem')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg flex items-center gap-1"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('veiculo')}
                    className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs rounded-lg flex items-center gap-1"
                  >
                    Próxima Seção
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* T-3: VEÍCULO CONJUGADO */}
            {activeTab === 'veiculo' && (
              <div id="section-vehicle" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">3. Veículo Conjugado (Cavalo & Carreta)</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Associe o chassi e placas (cavalo e carretas graneleiras, baú ou tanque) com cadastro fiscal ANTT e Renavam ativos.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Selecione o Conjunto Conjugado *</label>
                  <select
                    id="ip-vhc-select"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                  >
                    <option value="">Selecione o Veículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.model} - Cavalo: {v.tractor_plate} | Carreta: {v.trailer_plate} ({v.uf})</option>
                    ))}
                  </select>
                </div>

                {activeVehicle && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-medium">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-450 block font-bold">INFO DO EQUIPAMENTO</span>
                      <p className="font-bold text-slate-933 mt-1">{activeVehicle.model} ({activeVehicle.year})</p>
                      <p className="text-slate-600 font-mono">Trator Placa: {activeVehicle.tractor_plate}</p>
                      <p className="text-slate-600 font-mono">Semi-Reboque: {activeVehicle.trailer_plate}</p>
                      <p className="text-slate-600">Estado UF de Registro: {activeVehicle.uf}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-455 block font-bold">PROPRIETÁRIO CADASTRO</span>
                      <p className="font-bold mt-1 text-slate-800">{activeVehicle.owner_name}</p>
                      <p className="text-slate-500">CPF/CNPJ: {activeVehicle.owner_document}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-455 block font-bold">REGISTROS FISCAIS</span>
                      <p className="text-slate-655 mt-1">ANTT: {activeVehicle.antt}</p>
                      <p className="text-slate-655">RENAVAM ID: {activeVehicle.renavam}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('motorista')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('financeiro')}
                    className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs rounded-lg flex items-center gap-1"
                  >
                    Próxima Seção
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* T-4: VALORES & FINANCEIRO */}
            {activeTab === 'financeiro' && (
              <div id="section-finance" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">4. Controle de Valores do Frete (Adiantamento, Despesas e Saldo)</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Preencha os valores do frete. O saldo, despesas e margens líquidas são calculados em tempo real na tela.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-emerald-800">Valor Bruto do Frete (R$) *</label>
                    <input
                      id="ip-freight"
                      type="number"
                      step="0.01"
                      value={freightValue}
                      onChange={(e) => setFreightValue(Number(e.target.value))}
                      className="w-full text-xs font-black px-3 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 text-sky-800">Adiantamento de Frete (R$)</label>
                    <input
                      id="ip-advance"
                      type="number"
                      step="0.01"
                      value={advanceValue}
                      onChange={(e) => setAdvanceValue(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-sky-50 border border-sky-200 text-sky-950 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Valor Pago à Vista / Pedágio (R$)</label>
                    <input
                      id="ip-cash"
                      type="number"
                      step="0.01"
                      value={cashValue}
                      onChange={(e) => setCashValue(Number(e.target.value))}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* Real-time Ledger calculations banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">SALDO DO FRETE RESTANTE</span>
                    <span className={`text-lg font-black tracking-wider block ${balanceValue < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      R$ {balanceValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-slate-400 block font-mono">FRETE - ADIANTAMENTO - PAGO À VISTA</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">TOTAL DESPESAS ADICIONAIS</span>
                    <span className="text-lg font-black tracking-wider block text-slate-150">
                      R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-slate-400 block font-mono">SOMA DO AJUSTE DE CARGA/DESCARGA</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">VALOR LÍQUIDO DO FRETE (MARGEM RBA)</span>
                    <span className="text-lg font-black tracking-wider block text-emerald-400">
                      R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-slate-400 block font-mono">FRETE BRUTO - TOTAL DESPESAS</span>
                  </div>
                </div>

                {balanceValue < 0 && (
                  <div className="p-4 bg-red-100/70 border border-red-200 text-red-950 rounded-xl space-y-3">
                    <div className="flex items-center gap-2.5 text-xs font-bold">
                      <ShieldAlert className="h-5 w-5 text-red-700 shrink-0 animate-bounce" />
                      <span>AVISO CRÍTICO: O saldo desta ficha deu NEGATIVO!</span>
                    </div>
                    <p className="text-xs font-medium">As adiantas e taxas à vista excederam o frete bruto contratado. Para prosseguir com o lançamento, exige confirmação excepcional do override:</p>
                    <label className="flex items-center gap-2 text-xs font-bold shrink-0 bg-white p-3 rounded-lg border border-red-300 w-fit cursor-pointer select-none">
                      <input
                        id="chk-negative-balance"
                        type="checkbox"
                        checked={confirmNegativeBalance}
                        onChange={(e) => setConfirmNegativeBalance(e.target.checked)}
                        className="h-4 w-4 text-slate-900 border-slate-350 focus:ring-0 cursor-pointer"
                      />
                      <span>Declaro confirmar e assumir saldo de frete negativo para esta viagem.</span>
                    </label>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3">Custos Operacionais Excepcionais de Campo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Adicional de Ajuda de Carga (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={loadingExpense}
                        onChange={(e) => setLoadingExpense(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Adicional Descarrego (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={unloadingExpense}
                        onChange={(e) => setUnloadingExpense(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Outras Despesas de Campo (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('veiculo')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('consultas')}
                    className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs rounded-lg flex items-center gap-1"
                  >
                    Próxima Seção
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* T-5: CONSULTAS & LIBERAÇÃO */}
            {activeTab === 'consultas' && (
              <div id="section-checks" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">5. Consultas Regulatórias de Risco e Liberação de Embarque</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Aprovação cadastral de seguro (Pancary e Buonny). Se alguma consulta estiver reprovada ou pendente, exige override com justificativa.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Consulta Cadastral Buonny *</label>
                    <select
                      id="ip-buonny"
                      value={buonnyStatus}
                      onChange={(e) => setBuonnyStatus(e.target.value as any)}
                      className="w-full text-xs font-extrabold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                    >
                      <option value="Aprovado">🟢 Aprovado / Cadastro Ativo</option>
                      <option value="Em Análise">🔵 Em Análise de Risco</option>
                      <option value="Reprovado">🔴 Reprovado por Sinistro</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Consulta Cadastral Pancary *</label>
                    <select
                      id="ip-pancary"
                      value={pancaryStatus}
                      onChange={(e) => setPancaryStatus(e.target.value as any)}
                      className="w-full text-xs font-extrabold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                    >
                      <option value="Aprovado">🟢 Aprovado / Cobertura Ativa</option>
                      <option value="Em Análise">🔵 Em Triagem e Sindicância</option>
                      <option value="Reprovado">🔴 Reprovado por Pendência</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/10 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status da Liberação do Embarque</label>
                    <select
                      id="ip-shipment-status"
                      value={shipmentReleaseStatus}
                      onChange={(e) => setShipmentReleaseStatus(e.target.value as any)}
                      className="w-full text-xs font-black bg-white border border-slate-250 rounded-lg px-3 py-2.5 outline-none"
                    >
                      <option value="Pendente">🟡 Pendente de Varredura</option>
                      <option value="Liberado">🟢 Liberado de Embarque</option>
                      <option value="Bloqueado">🔴 Bloqueado Operacionalmente</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Limite Seguro de Valor Carga</label>
                    <select
                      value={shipmentReleaseLimit}
                      onChange={(e) => setShipmentReleaseLimit(e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-slate-250 rounded-lg px-3 py-2.5 outline-none"
                    >
                      <option value="Até 100.000">Até R$ 100.000 (Padrão)</option>
                      <option value="Até 200.000">Até R$ 200.000</option>
                      <option value="Até 300.000">Até R$ 300.000</option>
                      <option value="Até 400.000">Até R$ 400.000</option>
                      <option value="Até 500.000">Até R$ 500.000 (Teto Máximo)</option>
                    </select>
                  </div>
                </div>

                {/* Exception Handling Justifications (Sem consulta aprovada exige justificativa!) */}
                {shipmentReleaseStatus === 'Liberado' && (buonnyStatus !== 'Aprovado' || pancaryStatus !== 'Aprovado') && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <AlertCircle className="h-4.5 w-4.5 text-amber-700 shrink-0" />
                      <span>REGRA CRÍTICA: Liberação Autorizada Excepcionalmente</span>
                    </div>
                    <p className="text-[11px] font-medium text-amber-855">
                      Você marcou o embarque como <strong>Liberado</strong>, porém a checagem da Buonny ou Pancary está pendente de aprovação total. Insira um despacho justificando formalmente a liberação sob responsabilidade operacional:
                    </p>
                    <textarea
                      id="ip-justification"
                      rows={2}
                      placeholder="Ex: Autorizado liberação por termo de seguro especial assinado com a diretoria do cliente..."
                      value={releaseJustification}
                      onChange={(e) => setReleaseJustification(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('financeiro')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('documentos')}
                    className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-extrabold text-xs rounded-lg flex items-center gap-1"
                  >
                    Próxima Seção
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* T-6: DOCUMENTOS, ANEXOS & ASSINATURA */}
            {activeTab === 'documentos' && (
              <div id="section-docs" className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-sm font-black text-slate-900">6. CTE Emitido, Anexos Digitais e Assinatura Interna</h3>
                  <p className="text-[11px] text-slate-450 mt-1">Vincule o CTE emitido, faça upload dos relatórios em PDF e confirme a assinatura eletrônica para auditorias rápidas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Número do CTE (Conhecimento de Transporte Eletrônico)</label>
                    <input
                      id="ip-cte"
                      type="text"
                      placeholder="Ex: CTE-90231"
                      value={cteNumber}
                      onChange={(e) => setCteNumber(e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 border border-slate-250 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Responsável Interno da Liberação</label>
                    <input
                      id="ip-operator"
                      type="text"
                      readOnly
                      value={responsibleName}
                      className="w-full text-xs font-extrabold px-3 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg outline-none"
                    />
                  </div>
                </div>

                {/* Drag-and-drop Attachments simulations */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Arquivos e Anexos (Armazenados no Supabase Storage)</label>
                  
                  {isEdit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleUploadMockFile('cte')}
                        disabled={uploadingDemo}
                        className="py-4 border border-dashed border-slate-300 hover:border-yellow-500 hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
                      >
                        <Paperclip className="h-5 w-5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Simular Upload de CTE / Xml</span>
                        <span className="text-[9px] text-slate-400">Gera um PDF e salva o arquivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUploadMockFile('comprovante')}
                        disabled={uploadingDemo}
                        className="py-4 border border-dashed border-slate-300 hover:border-yellow-500 hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
                      >
                        <Paperclip className="h-5 w-5 text-emerald-450" />
                        <span className="text-xs font-bold text-slate-700">Anexar Comprovante do Adiantamento</span>
                        <span className="text-[9px] text-slate-400">Envia para a pasta do financeiro</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border rounded-2xl text-center text-xs text-slate-500">
                      ℹ️ O Upload de arquivos digitais estará disponível imediatamente após clicar em <strong>Salvar Ordem</strong> abaixo.
                    </div>
                  )}

                  {/* Render present attachments */}
                  {attachments.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                      <span className="text-[9px] text-slate-450 font-black block uppercase mb-1">Arquivos Carregados nesta Ficha ({attachments.length})</span>
                      {attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-150 text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-xs">{file.file_name}</span>
                          <div className="flex items-center gap-2">
                            <a href={file.file_url} target="_blank" rel="noreferrer" className="text-yellow-600 font-bold hover:underline">Ver</a>
                            <button type="button" onClick={() => handleRemoveAttachment(file.id)} className="text-red-500 hover:text-red-700 text-[10px] font-bold">Excluir</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Digital Signature box */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Assinatura Eletrônica do Operador RBA</label>
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white">Confirmação Digital da Ordem de Frete</p>
                      <p className="text-[10px] text-slate-400 mt-1">Ao marcar a autorização, o sistema carimba seu IP, data, hora e o token de liberação digital único.</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <label className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer select-none">
                        <input
                          id="ip-signature-check"
                          type="checkbox"
                          checked={!!signatureText}
                          onChange={(e) => setSignatureText(e.target.checked ? 'Confirmada' : '')}
                          className="h-4 w-4 bg-white text-black border-none focus:ring-0 cursor-pointer"
                        />
                        <span>CONFIRMAR ASSINATURA DIGITAL</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab('consultas')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg"
                  >
                    Voltar
                  </button>
                  
                  <button
                    id="submit-order-form-btn"
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer select-none"
                  >
                    <Save className="h-4.5 w-4.5" />
                    {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações da Ordem' : 'Emitir Ficha de Frete Digital'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
