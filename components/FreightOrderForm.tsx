'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle, Paperclip } from 'lucide-react';
import { Driver, Vehicle, Client, FreightOrder } from '@/lib/db';
import { FREIGHT_ORDER_STATUSES, getFreightStatusMeta, normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { getShipmentReleaseValidationError } from '@/lib/freightOrderFormValidation';

interface Props {
  initialData?: FreightOrder & {
    attachments?: any[];
  };
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const VEHICLE_TYPES: NonNullable<Vehicle['vehicle_type']>[] = [
  'Utilitário',
  'VUC',
  '3/4',
  'Toco',
  'Truck',
  'Bitruck',
  'Carreta',
];

type DriverDraft = Pick<
  Driver,
  | 'name'
  | 'cpf'
  | 'rg'
  | 'phone'
  | 'bank_name'
  | 'bank_agency'
  | 'bank_account'
  | 'pix_key'
  | 'beneficiary_name'
  | 'beneficiary_document'
  | 'status'
  | 'notes'
>;

type VehicleDraft = Pick<
  Vehicle,
  | 'tractor_plate'
  | 'trailer_plate'
  | 'year'
  | 'manufacture_year'
  | 'model_year'
  | 'vehicle_type'
  | 'model'
  | 'owner_name'
  | 'owner_document'
  | 'antt'
  | 'renavam'
  | 'uf'
  | 'status'
  | 'notes'
>;

const emptyDriverDraft = (): DriverDraft => ({
  name: '',
  cpf: '',
  rg: '',
  phone: '',
  bank_name: '',
  bank_agency: '',
  bank_account: '',
  pix_key: '',
  beneficiary_name: '',
  beneficiary_document: '',
  status: 'Ativo',
  notes: '',
});

const emptyVehicleDraft = (): VehicleDraft => ({
  tractor_plate: '',
  trailer_plate: '',
  year: 0,
  manufacture_year: 0,
  model_year: 0,
  vehicle_type: 'Carreta',
  model: '',
  owner_name: '',
  owner_document: '',
  antt: '',
  renavam: '',
  uf: '',
  status: 'Ativo',
  notes: '',
});

const driverToDraft = (driver: Driver): DriverDraft => ({
  name: driver.name || '',
  cpf: driver.cpf || '',
  rg: driver.rg || '',
  phone: driver.phone || '',
  bank_name: driver.bank_name || '',
  bank_agency: driver.bank_agency || '',
  bank_account: driver.bank_account || '',
  pix_key: driver.pix_key || '',
  beneficiary_name: driver.beneficiary_name || driver.name || '',
  beneficiary_document: driver.beneficiary_document || driver.cpf || '',
  status: driver.status || 'Ativo',
  notes: driver.notes || '',
});

const vehicleToDraft = (vehicle: Vehicle): VehicleDraft => ({
  tractor_plate: vehicle.tractor_plate || '',
  trailer_plate: vehicle.trailer_plate || '',
  year: vehicle.year || vehicle.manufacture_year || 0,
  manufacture_year: vehicle.manufacture_year || vehicle.year || 0,
  model_year: vehicle.model_year || vehicle.year || 0,
  vehicle_type: vehicle.vehicle_type || 'Carreta',
  model: vehicle.model || '',
  owner_name: vehicle.owner_name || '',
  owner_document: vehicle.owner_document || '',
  antt: vehicle.antt || '',
  renavam: vehicle.renavam || '',
  uf: vehicle.uf || '',
  status: vehicle.status || 'Ativo',
  notes: vehicle.notes || '',
});

function PrintedCheckbox({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-4 w-4 md:h-5 md:w-5 shrink-0 border-2 border-slate-900 rounded-[3px] flex items-center justify-center ${checked ? 'bg-slate-900' : 'bg-white'}`}
      aria-pressed={checked}
    >
      {checked && <span className="text-white text-[10px] md:text-xs font-black leading-none">✕</span>}
    </button>
  );
}

export default function FreightOrderForm({ initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Load selection tables from APIs
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingSelections, setLoadingSelections] = useState(true);

  // Form Field States
  const [driverId, setDriverId] = useState(initialData?.driver_id || '');
  const [vehicleId, setVehicleId] = useState(initialData?.vehicle_id || '');
  const [clientId, setClientId] = useState(initialData?.client_id || '');
  const [driverDraft, setDriverDraft] = useState<DriverDraft>(() => emptyDriverDraft());
  const [vehicleDraft, setVehicleDraft] = useState<VehicleDraft>(() => emptyVehicleDraft());

  // Trip routing
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [destination, setDestination] = useState(initialData?.destination || '');
  const [deliveryDate, setDeliveryDate] = useState(initialData?.delivery_date || '');
  const [status] = useState<FreightOrder['status']>(normalizeFreightOrderStatus(initialData?.status));
  const [tripNotes, setTripNotes] = useState(initialData?.notes || '');

  // Driver freight and liquidations (calculated live)
  const [freightValue, setFreightValue] = useState(initialData?.freight_value || 0);
  const [advanceValue, setAdvanceValue] = useState(initialData?.advance_value || 0);
  const [cashValue, setCashValue] = useState(initialData?.cash_value || 0);
  const [balanceValue, setBalanceValue] = useState<number | ''>(initialData?.balance_value !== undefined ? initialData.balance_value : '');
  const [loadingExpense, setLoadingExpense] = useState(initialData?.loading_expense || 0);
  const [unloadingExpense, setUnloadingExpense] = useState(initialData?.unloading_expense || 0);
  const [otherExpenses, setOtherExpenses] = useState(initialData?.other_expenses || 0);

  // Security Clearances (Buonny)
  const [buonnyStatus, setBuonnyStatus] = useState<FreightOrder['buonny_status']>(initialData?.buonny_status || 'Renovar');
  const [buonnyCode, setBuonnyCode] = useState(initialData?.buonny_code || '');

  // Shipment Release
  const [shipmentReleaseStatus, setShipmentReleaseStatus] = useState<FreightOrder['shipment_release_status']>(
    normalizeFreightOrderStatus(initialData?.shipment_release_status || initialData?.status)
  );
  const [shipmentReleaseLimit, setShipmentReleaseLimit] = useState<FreightOrder['shipment_release_limit']>(initialData?.shipment_release_limit || 'Até 100.000');
  const [releaseJustification, setReleaseJustification] = useState('');

  // Documents
  const [cteNumber, setCteNumber] = useState(initialData?.cte_number || '');
  const [cteValue, setCteValue] = useState(initialData?.cte_value || 0);

  // Responsáveis (dois papéis distintos)
  // 1) Resp. (ao lado de Liberação) = quem fez a CONSULTA BUONNY
  const [buonnyResponsible, setBuonnyResponsible] = useState((initialData as any)?.buonny_responsible || '');
  // 2) Responsável (rodapé) = quem CONTRATOU o motorista para o frete
  const [responsibleName, setResponsibleName] = useState(initialData?.responsible_name || '');
  const [signatureText, setSignatureText] = useState(initialData?.signature_url ? 'Confirmada' : '');

  // Emission date (ficha física: "__ DE ____ 20__")
  const now = new Date();

  // Derive initial date string for the date picker from existing emission fields or today
  const getInitialEmissionDateString = () => {
    const day = initialData?.emission_day;
    const month = initialData?.emission_month;
    const year = initialData?.emission_year;
    if (day && month && year) {
      const monthIndex = MESES.findIndex(
        (m) => m.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
          month.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      );
      if (monthIndex !== -1) {
        const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
        return `${fullYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    // Default to today
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [emissionDateStr, setEmissionDateStr] = useState(getInitialEmissionDateString);

  // Derived fields kept in sync with the date picker
  const emissionDay = emissionDateStr ? String(Number(emissionDateStr.split('-')[2])) : String(now.getDate()).padStart(2, '0');
  const emissionMonth = emissionDateStr ? MESES[Number(emissionDateStr.split('-')[1]) - 1] : MESES[now.getMonth()];
  const emissionYear = emissionDateStr ? emissionDateStr.split('-')[0].slice(-2) : String(now.getFullYear()).slice(-2);

  // Double validations
  const [confirmNegativeBalance, setConfirmNegativeBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Attachments (only on edit)
  const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);



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

        if (!drvRes.ok || !vhcRes.ok || !cliRes.ok) {
          throw new Error(drvData?.error || vhcData?.error || cliData?.error || 'Erro ao carregar listas de cadastro.');
        }

        const driverList = Array.isArray(drvData) ? drvData : [];
        const vehicleList = Array.isArray(vhcData) ? vhcData : [];
        const clientList = Array.isArray(cliData) ? cliData : [];

        setDrivers(driverList);
        setVehicles(vehicleList);
        setClients(clientList);

        const selectedDriver = driverList.find((driver) => driver.id === initialData?.driver_id);
        if (selectedDriver) setDriverDraft(driverToDraft(selectedDriver));

        const selectedVehicle = vehicleList.find((vehicle) => vehicle.id === initialData?.vehicle_id);
        if (selectedVehicle) setVehicleDraft(vehicleToDraft(selectedVehicle));
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Erro ao carregar motoristas, veículos e clientes.");
      } finally {
        setLoadingSelections(false);
      }
    }
    loadResources();
  }, [initialData?.driver_id, initialData?.vehicle_id]);

  // Autofill: o operador logado é o responsável padrão pela consulta Buonny e pela contratação
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d?.user) {
          if (!buonnyResponsible) {
            setBuonnyResponsible(d.user.name);
          }
          if (!responsibleName) {
            setResponsibleName(d.user.name);
          }
        }
      })
      .catch(() => {});
  }, [buonnyResponsible, responsibleName]);

  const selectDriver = (id: string) => {
    setDriverId(id);
    const selectedDriver = drivers.find(driver => driver.id === id);
    if (selectedDriver) setDriverDraft(driverToDraft(selectedDriver));
  };

  const selectVehicle = (id: string) => {
    setVehicleId(id);
    const selectedVehicle = vehicles.find(vehicle => vehicle.id === id);
    if (selectedVehicle) setVehicleDraft(vehicleToDraft(selectedVehicle));
  };

  const updateDriverDraft = (patch: Partial<DriverDraft>) => {
    if (!isEdit && driverId) setDriverId('');
    setDriverDraft(prev => ({ ...prev, ...patch }));
  };

  const updateVehicleDraft = (patch: Partial<VehicleDraft>) => {
    if (!isEdit && vehicleId) setVehicleId('');
    setVehicleDraft(prev => ({ ...prev, ...patch }));
  };

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const uploadAttachmentFile = async (file: File | null, type: 'cte' | 'outros' | 'comprovante') => {
    if (!file) return;
    if (!isEdit) {
      setErrorMessage("Salve a ficha primeiro. Depois abra a edição para anexar documentos.");
      return;
    }
    setUploadingAttachment(true);
    setErrorMessage('');
    try {
      const fd = new FormData();
      fd.append('order_id', initialData!.id);
      fd.append('file', file);
      fd.append('file_type', type);
      fd.append('category', type);
      const res = await fetch('/api/attachments', { method: 'POST', body: fd });
      const data = await res.json();
      if (data && data.success) {
        setAttachments(prev => [...prev, data.attachment]);
        setSuccessMessage("Documento anexado com sucesso!");
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data?.error || "Erro ao anexar documento.");
      }
    } catch (e) {
      setErrorMessage("Erro ao enviar documento.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>, type: 'cte' | 'outros' | 'comprovante') => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    await uploadAttachmentFile(file, type);
  };

  const handleDropAttachment = async (event: React.DragEvent<HTMLLabelElement>, type: 'cte' | 'outros' | 'comprovante') => {
    event.preventDefault();
    if (uploadingAttachment) return;
    await uploadAttachmentFile(event.dataTransfer.files?.[0] || null, type);
  };

  const handleRemoveAttachment = async (id: string) => {
    try {
      const res = await fetch(`/api/attachments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data?.success) {
        setAttachments(attachments.filter(a => a.id !== id));
      } else {
        setErrorMessage(data?.error || "Erro ao remover anexo.");
      }
    } catch (e) {
      setErrorMessage("Erro ao remover anexo.");
    }
  };

  // Submit Handler
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (loadingSelections) {
      setErrorMessage("Aguarde carregar motoristas, veículos e clientes antes de salvar.");
      return;
    }
    if (!driverId && (!driverDraft.name.trim() || !driverDraft.cpf.trim())) {
      setErrorMessage("Selecione um motorista existente ou preencha nome e CPF para cadastrar direto na ficha.");
      return;
    }
    if (!vehicleId && (!vehicleDraft.tractor_plate.trim() || !vehicleDraft.owner_name.trim())) {
      setErrorMessage("Selecione um veículo existente ou preencha placa do cavalo e proprietário para cadastrar direto na ficha.");
      return;
    }
    if (!clientId) {
      setErrorMessage("O cliente do frete é obrigatório.");
      return;
    }
    if (!origin || !destination) {
      setErrorMessage("Origem e Destino do frete são obrigatórios.");
      return;
    }
    if (freightValue <= 0) {
      setErrorMessage("O valor do frete é obrigatório e deve ser maior que zero.");
      return;
    }
    if (typeof balanceValue === 'number' && balanceValue < 0 && !confirmNegativeBalance) {
      setErrorMessage("⚠️ ATENÇÃO: O saldo do frete restou negativo! Marque a confirmação de override no campo SALDO.");
      return;
    }

    const shipmentReleaseError = getShipmentReleaseValidationError({
      shipmentReleaseStatus,
      buonnyStatus,
      releaseJustification,
    });
    if (shipmentReleaseError) {
      setErrorMessage(shipmentReleaseError);
      return;
    }
    if (buonnyCode.trim().length > 20) {
      setErrorMessage("O código da consulta Buonny deve ter no máximo 20 caracteres.");
      return;
    }

    setSubmitting(true);

    const orderStatus = shipmentReleaseStatus || status;

    const payload = {
      driver_id: driverId,
      vehicle_id: vehicleId,
      driver: driverDraft,
      vehicle: vehicleDraft,
      client_id: clientId,
      freight_value: freightValue,
      advance_value: advanceValue,
      cash_value: cashValue,
      balance_value: balanceValue === '' ? undefined : balanceValue,
      loading_expense: loadingExpense,
      unloading_expense: unloadingExpense,
      other_expenses: otherExpenses,
      origin,
      destination,
      delivery_date: deliveryDate,
      status: orderStatus,
      cte_number: cteNumber,
      cte_value: cteValue,
      notes: `${tripNotes}. ${releaseJustification ? 'Override da liberação: ' + releaseJustification : ''}`.trim(),
      buonny_status: buonnyStatus,
      buonny_code: canEnterBuonnyCode ? buonnyCode.trim() : '',
      shipment_release_status: shipmentReleaseStatus,
      shipment_release_limit: shipmentReleaseLimit,
      responsible_name: responsibleName,
      buonny_responsible: buonnyResponsible,
      emission_day: emissionDay.trim(),
      emission_month: emissionMonth.trim(),
      emission_year: emissionYear.trim(),
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
        setSuccessMessage(isEdit ? "Ficha de Frete atualizada com sucesso!" : "Ficha de Frete gerada com sucesso!");
        setTimeout(() => { router.push('/ordens'); }, 1500);
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
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center py-16">
        <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">Conectando ao banco de dados e sincronizando frotas...</p>
      </div>
    );
  }

  // ---- Shared style tokens to mimic the printed sheet ----
  const cell = "flex items-stretch border-b border-slate-150 last:border-b-0";
  const label = "flex items-center px-3 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-r border-slate-150 whitespace-nowrap shrink-0 select-none";
  const field = "flex-1 min-w-0 bg-white outline-none px-3 py-2 text-xs md:text-sm font-bold text-slate-900 focus:bg-amber-500/5";
  const selectField = field + " cursor-pointer";
  const divider = "border-l border-slate-150";
  const canEnterBuonnyCode = buonnyStatus === 'Aprovado';

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

      <form id="freight-order-master-form" onSubmit={handleSaveOrder}>

        {/* ===================== FICHA DE FRETE (réplica do papel) ===================== */}
        <div className="mx-auto max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">

          {/* TÍTULO */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase text-center leading-none">
              RBA Transporte e Logística
            </h2>
          </div>

          {/* MOTORISTA + CPF (ambos buscáveis — selecionam o mesmo condutor) */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Motorista:</span>
              <DriverCombobox
                drivers={drivers}
                value={driverId}
                onChange={selectDriver}
                display="name"
                inputId="ip-driver-select"
                inputClass={field}
                placeholder="— buscar por nome —"
                freeTextValue={driverDraft.name}
                onFreeTextChange={(value) => updateDriverDraft({ name: value })}
              />
            </div>
            <div className={`flex items-stretch w-[42%] ${divider}`}>
              <span className={label}>CPF:</span>
              <DriverCombobox
                drivers={drivers}
                value={driverId}
                onChange={selectDriver}
                display="cpf"
                inputId="ip-driver-cpf"
                inputClass={field}
                placeholder="— buscar por CPF —"
                freeTextValue={driverDraft.cpf}
                onFreeTextChange={(value) => updateDriverDraft({ cpf: value })}
              />
            </div>
          </div>

          {/* FONES + RG */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Fones:</span>
              <input
                id="ip-driver-phone"
                name="driver_phone"
                type="text"
                value={driverDraft.phone}
                onChange={(e) => updateDriverDraft({ phone: e.target.value })}
                placeholder="telefone do motorista"
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
            <div className={`flex items-stretch w-[42%] ${divider}`}>
              <span className={label}>RG:</span>
              <input
                id="ip-driver-rg"
                name="driver_rg"
                type="text"
                value={driverDraft.rg}
                onChange={(e) => updateDriverDraft({ rg: e.target.value })}
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
          </div>

          {/* VALOR DE FRETE / AD. / A VISTA / SALDO */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Valor de Frete:</span>
              <input
                id="ip-freight"
                name="freight_value"
                type="number" step="0.01" min="0"
                value={freightValue || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFreightValue(val);
                  setBalanceValue(val - advanceValue - cashValue);
                }}
                className={field}
              />
            </div>
            <div className={`flex items-stretch w-[18%] ${divider}`}>
              <span className={label}>AD.:</span>
              <input
                id="ip-advance"
                name="advance_value"
                type="number"
                step="0.01"
                min="0"
                value={advanceValue || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setAdvanceValue(val);
                  setBalanceValue(freightValue - val - cashValue);
                }}
                className={field}
              />
            </div>
            <div className={`flex items-stretch w-[22%] ${divider}`}>
              <span className={label}>A Vista:</span>
              <input
                id="ip-cash"
                name="cash_value"
                type="number"
                step="0.01"
                min="0"
                value={cashValue || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCashValue(val);
                  setBalanceValue(freightValue - advanceValue - val);
                }}
                className={field}
              />
            </div>
              <div className={`flex items-stretch w-[24%] ${divider}`}>
                <span className={label}>Saldo:</span>
                <input
                  id="ip-balance"
                  name="balance_value"
                  type="number"
                  step="0.01"
                  value={balanceValue !== undefined && balanceValue !== null ? balanceValue : ''}
                  placeholder={String(freightValue - advanceValue - cashValue)}
                  onChange={(e) => setBalanceValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${field} font-black ${typeof balanceValue === 'number' && balanceValue < 0 ? 'text-rose-600' : 'text-blue-800'}`}
                />
              </div>
          </div>

          {/* Override saldo negativo */}
          {typeof balanceValue === 'number' && balanceValue < 0 && (
            <div className="border-b border-slate-200 bg-red-50/50 px-4 py-3">
              <label className="flex items-center gap-2 text-[11px] font-bold text-red-800 cursor-pointer select-none">
                <input id="chk-negative-balance" name="confirm_negative_balance" type="checkbox" checked={confirmNegativeBalance} onChange={(e) => setConfirmNegativeBalance(e.target.checked)} className="h-4 w-4" />
                Saldo negativo — confirmo e assumo override operacional desta ficha.
              </label>
            </div>
          )}

          {/* DESPESAS ADICIONAIS: CARGA / DESCARGA / OUTROS */}
          <div className={cell}>
            <span className={label}>Despesas Adicionais:</span>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Carga:</span>
              <input id="ip-loading-expense" name="loading_expense" type="number" step="0.01" min="0" value={loadingExpense || ''} onChange={(e) => setLoadingExpense(Number(e.target.value))} className={field} />
            </div>
            <div className={`flex items-stretch flex-1 min-w-0 ${divider}`}>
              <span className={label}>Descarga:</span>
              <input id="ip-unloading-expense" name="unloading_expense" type="number" step="0.01" min="0" value={unloadingExpense || ''} onChange={(e) => setUnloadingExpense(Number(e.target.value))} className={field} />
            </div>
            <div className={`flex items-stretch flex-1 min-w-0 ${divider}`}>
              <span className={label}>Outros:</span>
              <input id="ip-other-expenses" name="other_expenses" type="number" step="0.01" min="0" value={otherExpenses || ''} onChange={(e) => setOtherExpenses(Number(e.target.value))} className={field} />
            </div>
          </div>

              {/* DADOS BANCÁRIOS: PIX/BANCO / AG. / CONTA */}
              <div className={cell}>
                <span className={label}>Dados Bancários:</span>
                <div className="flex items-stretch flex-1 min-w-0">
                  <span className={label}>Pix/Banco:</span>
                  <input
                    id="ip-driver-pix-key"
                    name="driver_pix_key"
                    type="text"
                    value={driverDraft.pix_key}
                    onChange={(e) => updateDriverDraft({ pix_key: e.target.value })}
                    className={field}
                    readOnly={isEdit && !!driverId}
                  />
            </div>
            <div className={`flex items-stretch w-[26%] ${divider}`}>
              <span className={label}>AG.:</span>
              <input
                id="ip-driver-agency"
                name="driver_bank_agency"
                type="text"
                value={driverDraft.bank_agency}
                onChange={(e) => updateDriverDraft({ bank_agency: e.target.value })}
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
            <div className={`flex items-stretch w-[26%] ${divider}`}>
              <span className={label}>Conta:</span>
              <input
                id="ip-driver-account"
                name="driver_bank_account"
                type="text"
                value={driverDraft.bank_account}
                onChange={(e) => updateDriverDraft({ bank_account: e.target.value })}
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
          </div>

          {/* FAVORECIDO / CPF-CNPJ */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Favorecido:</span>
              <input
                id="ip-driver-beneficiary"
                name="driver_beneficiary_name"
                type="text"
                value={driverDraft.beneficiary_name}
                onChange={(e) => updateDriverDraft({ beneficiary_name: e.target.value })}
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
            <div className={`flex items-stretch w-[42%] ${divider}`}>
              <span className={label}>CPF/CNPJ:</span>
              <input
                id="ip-driver-beneficiary-document"
                name="driver_beneficiary_document"
                type="text"
                value={driverDraft.beneficiary_document}
                onChange={(e) => updateDriverDraft({ beneficiary_document: e.target.value })}
                className={field}
                readOnly={isEdit && !!driverId}
              />
            </div>
          </div>

          {/* CONSULTA BUONNY + CTE */}
          <div className={cell}>
            <div className="flex-1 min-w-0">
              {/* Buonny */}
              <div className="flex items-center">
                <span className={label}>Consulta Buonny:</span>
                <label className="flex items-center gap-1.5 px-2 cursor-pointer select-none">
                    <PrintedCheckbox checked={buonnyStatus === 'Aprovado'} onClick={() => { setBuonnyStatus('Aprovado'); setShipmentReleaseStatus('Carregando'); }} />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase text-slate-900">Aprovado</span>
                </label>
                <label className="flex items-center gap-1.5 px-2 cursor-pointer select-none">
                  <PrintedCheckbox checked={buonnyStatus === 'Renovar'} onClick={() => setBuonnyStatus('Renovar')} />
                  <span className="text-[10px] md:text-[11px] font-bold uppercase text-slate-900">Renovar</span>
                </label>
              </div>

              {/* Liberação de Embarque / Resp. */}
              <div className="flex items-stretch border-t border-slate-200">
                <div className="flex items-stretch flex-1 min-w-0">
                  <span className={label}>Liberação de Embarque:</span>
                  <div className="flex flex-1 min-w-0 items-stretch">
                    <select
                      id="ip-shipment-status"
                      name="shipment_release_status"
                      value={shipmentReleaseStatus}
                      onChange={(e) => setShipmentReleaseStatus(e.target.value as any)}
                      className={selectField}
                    >
                      {FREIGHT_ORDER_STATUSES.map((statusOption) => {
                        const meta = getFreightStatusMeta(statusOption);
                        return (
                          <option key={statusOption} value={statusOption}>
                            {meta.icon} {meta.label}
                          </option>
                        );
                      })}
                    </select>
                    {canEnterBuonnyCode && (
                      <input
                        id="ip-buonny-code"
                        name="buonny_code"
                        type="text"
                        value={buonnyCode}
                        onChange={(e) => setBuonnyCode(e.target.value.slice(0, 20))}
                        maxLength={20}
                        placeholder="Código Buonny"
                        aria-label="Código da consulta Buonny"
                        className={`${field} w-[45%] flex-none border-l border-slate-150 tracking-wide placeholder:font-semibold placeholder:tracking-normal placeholder:text-slate-400`}
                      />
                    )}
                  </div>
                </div>
                <div className={`flex items-stretch w-[34%] ${divider}`}>
                  <span className={label} title="Responsável pela consulta Buonny">Resp.:</span>
                  <input
                    id="ip-buonny-responsible"
                    name="buonny_responsible"
                    type="text"
                    value={buonnyResponsible}
                    onChange={(e) => setBuonnyResponsible(e.target.value)}
                    placeholder="resp. da consulta Buonny"
                    className={field}
                  />
                </div>
              </div>
            </div>
            {/* CTE */}
            <div className={`flex flex-col w-[34%] ${divider}`}>
              <span className={`${label} border-b border-slate-150 justify-center`}>CTE:</span>
              <input
                id="ip-cte"
                name="cte_number"
                type="text"
                value={cteNumber}
                onChange={(e) => setCteNumber(e.target.value)}
                placeholder="0000 / 0000"
                className={field + ' text-center text-base font-bold'}
              />
              <span className={`${label} border-t border-slate-150 justify-center`}>Valor do CTE:</span>
              <input
                id="ip-cte-value"
                name="cte_value"
                type="number" step="0.01" min="0"
                value={cteValue || ''}
                onChange={(e) => setCteValue(Number(e.target.value))}
                placeholder="0,00"
                className={field + ' flex-1 text-center text-base font-black text-blue-800'}
              />
            </div>
          </div>

          {/* Justificativa override liberação */}
          {shipmentReleaseStatus !== 'Contratar' && buonnyStatus !== 'Aprovado' && (
            <div className="border-b border-slate-200 bg-amber-50/50 px-4 py-3">
              <input
                id="ip-justification"
                name="release_justification"
                type="text"
                value={releaseJustification}
                onChange={(e) => setReleaseJustification(e.target.value)}
                placeholder="Justificativa de override: liberação sem consulta aprovada..."
                className="w-full bg-transparent outline-none text-[11px] font-semibold text-amber-900 placeholder:text-amber-500"
              />
            </div>
          )}

          {/* LIMITES DE VALOR (checkboxes) */}
          <div className={`${cell} flex-wrap gap-y-1 px-1 py-2`}>
            {([
              ['Até 100.000', 'Até 100.000,00'],
              ['Até 200.000', 'Até 200.000,00'],
              ['Até 300.000', 'Até 300.000,00'],
              ['Até 400.000', 'Até 400.000,00'],
              ['Até 500.000', 'Até 500.000,00'],
            ] as const).map(([val, lbl]) => (
              <label key={val} className="flex items-center gap-1.5 px-1.5 cursor-pointer select-none">
                <PrintedCheckbox checked={shipmentReleaseLimit === val} onClick={() => setShipmentReleaseLimit(val as any)} />
                <span className="text-[10px] md:text-[11px] font-extrabold uppercase text-slate-900">{lbl}</span>
              </label>
            ))}
          </div>

          {/* TIPO DE VEÍCULO (2 linhas) */}
          <div className={cell}>
            <div className="flex items-center px-3 w-[28%] shrink-0 border-r border-slate-150">
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                Tipo de Veículo:
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {/* busca do conjunto */}
              <div className="flex items-stretch border-b border-slate-150">
                <VehicleCombobox
                  vehicles={vehicles}
                  value={vehicleId}
                  onChange={selectVehicle}
                  display="summary"
                  inputId="ip-vhc-select"
                  inputClass={selectField}
                  placeholder="— buscar por placa ou modelo —"
                />
                <select
                  id="ip-vehicle-type"
                  name="vehicle_type"
                  value={vehicleDraft.vehicle_type || 'Carreta'}
                  onChange={(e) => updateVehicleDraft({ vehicle_type: e.target.value as VehicleDraft['vehicle_type'] })}
                  className={`${selectField} w-[34%] flex-none border-l border-slate-150`}
                  disabled={isEdit && !!vehicleId}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              {/* PLACA CAV / CARR */}
              <div className="flex items-stretch border-b border-slate-150">
                <div className="flex items-stretch flex-1 min-w-0">
                  <span className={label}>Placa Cav.:</span>
                  <VehicleCombobox
                    vehicles={vehicles}
                    value={vehicleId}
                    onChange={selectVehicle}
                    display="tractor"
                    inputId="ip-vhc-tractor-search"
                    inputClass={field + ' uppercase'}
                    placeholder="— buscar placa cav. —"
                    freeTextValue={vehicleDraft.tractor_plate}
                    onFreeTextChange={(value) => updateVehicleDraft({ tractor_plate: value })}
                  />
                </div>
                <div className={`flex items-stretch w-[42%] ${divider}`}>
                  <span className={label}>Carr.:</span>
                  <input
                    id="ip-vehicle-trailer"
                    name="vehicle_trailer_plate"
                    type="text"
                    value={vehicleDraft.trailer_plate}
                    onChange={(e) => updateVehicleDraft({ trailer_plate: e.target.value.toUpperCase() })}
                    className={field + ' uppercase'}
                    readOnly={isEdit && !!vehicleId}
                  />
                </div>
              </div>
              {/* ANO VEÍCULO / MODELO */}
              <div className="flex items-stretch">
                <div className="flex items-stretch flex-1 min-w-0">
                  <span className={label}>Ano Fab.:</span>
                  <input
                    id="ip-vehicle-manufacture-year"
                    name="vehicle_manufacture_year"
                    type="number"
                    value={vehicleDraft.manufacture_year || ''}
                    onChange={(e) => {
                      const year = Number(e.target.value);
                      updateVehicleDraft({ manufacture_year: year, year });
                    }}
                    className={`${field} max-w-[5.25rem] text-center`}
                    placeholder="Fab."
                    readOnly={isEdit && !!vehicleId}
                  />
                  <span className="flex items-center border-l border-r border-slate-150 px-2 text-sm font-black text-slate-500 bg-slate-50">/</span>
                  <input
                    id="ip-vehicle-model-year"
                    name="vehicle_model_year"
                    type="number"
                    value={vehicleDraft.model_year || ''}
                    onChange={(e) => updateVehicleDraft({ model_year: Number(e.target.value) })}
                    className={`${field} max-w-[5.25rem] text-center`}
                    placeholder="Mod."
                    aria-label="Ano modelo"
                    readOnly={isEdit && !!vehicleId}
                  />
                </div>
                <div className={`flex items-stretch w-[42%] ${divider}`}>
                  <span className={label}>Modelo:</span>
                  <input
                    id="ip-vehicle-model"
                    name="vehicle_model"
                    type="text"
                    value={vehicleDraft.model}
                    onChange={(e) => updateVehicleDraft({ model: e.target.value })}
                    placeholder="DAF/XF FTS 480"
                    className={field}
                    readOnly={isEdit && !!vehicleId}
                  />
                </div>
                </div>
            </div>
          </div>

          {/* CLIENTE / DATA DE ENTREGA */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Cliente:</span>
              <select id="ip-client-select" name="client_id" value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectField}>
                <option value="">— selecione o cliente —</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={`flex items-stretch w-[42%] ${divider}`}>
              <span className={label}>Data de Entrega:</span>
              <input id="ip-delivery-date" name="delivery_date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={field} />
            </div>
          </div>

          {/* ORIGEM / DESTINO */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>Origem:</span>
              <input id="ip-origin" name="origin" type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Cidade - UF" className={field} />
            </div>
            <div className={`flex items-stretch w-[42%] ${divider}`}>
              <span className={label}>Destino:</span>
              <input id="ip-dest" name="destination" type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Cidade - UF" className={field} />
            </div>
          </div>

          {/* DADOS ADICIONAIS VEÍCULO (cabeçalho) */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-[11px] md:text-xs font-bold uppercase tracking-tight text-slate-500">Dados Adicionais Veículo</span>
          </div>

          {/* PROPRIETÁRIO */}
          <div className={cell}>
            <span className={label}>Proprietário:</span>
            <input
              id="ip-vehicle-owner"
              name="vehicle_owner_name"
              type="text"
              value={vehicleDraft.owner_name}
              onChange={(e) => updateVehicleDraft({ owner_name: e.target.value })}
              className={field}
              readOnly={isEdit && !!vehicleId}
            />
          </div>

          {/* CPF/CNPJ + UF */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>CPF/CNPJ:</span>
              <input
                id="ip-vehicle-owner-document"
                name="vehicle_owner_document"
                type="text"
                value={vehicleDraft.owner_document}
                onChange={(e) => updateVehicleDraft({ owner_document: e.target.value })}
                className={field}
                readOnly={isEdit && !!vehicleId}
              />
            </div>
            <div className={`flex items-stretch w-[22%] ${divider}`}>
              <span className={label}>UF:</span>
              <input
                id="ip-vehicle-uf"
                name="vehicle_uf"
                type="text"
                maxLength={2}
                value={vehicleDraft.uf}
                onChange={(e) => updateVehicleDraft({ uf: e.target.value.toUpperCase() })}
                className={field + ' uppercase'}
                readOnly={isEdit && !!vehicleId}
              />
            </div>
          </div>

          {/* ANTT + REN. */}
          <div className={cell}>
            <div className="flex items-stretch flex-1 min-w-0">
              <span className={label}>ANTT:</span>
              <input
                id="ip-vehicle-antt"
                name="vehicle_antt"
                type="text"
                value={vehicleDraft.antt}
                onChange={(e) => updateVehicleDraft({ antt: e.target.value })}
                className={field}
                readOnly={isEdit && !!vehicleId}
              />
            </div>
            <div className={`flex items-stretch w-[50%] ${divider}`}>
              <span className={label}>REN.:</span>
              <input
                id="ip-vehicle-renavam"
                name="vehicle_renavam"
                type="text"
                value={vehicleDraft.renavam}
                onChange={(e) => updateVehicleDraft({ renavam: e.target.value })}
                className={field}
                readOnly={isEdit && !!vehicleId}
              />
            </div>
          </div>

          {/* DATA DE EMISSÃO + RESPONSÁVEL */}
          <div className={cell}>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0 px-2 py-2">
              <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Data de Emissão do Frete</span>
              <input
                id="ip-emission-date"
                type="date"
                value={emissionDateStr}
                onChange={(e) => setEmissionDateStr(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-blue-800 border-b border-slate-400 cursor-pointer w-full"
              />
              {/* Hidden fields for backward compatibility with the form payload */}
              <input type="hidden" name="emission_day" value={emissionDay} />
              <input type="hidden" name="emission_month" value={emissionMonth} />
              <input type="hidden" name="emission_year" value={emissionYear} />
            </div>
            <div className={`flex flex-col items-center justify-center w-[42%] px-2 py-1 ${divider}`}>
              <input
                id="ip-responsible-name"
                name="responsible_name"
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                placeholder="quem contratou o motorista"
                className="w-full bg-transparent outline-none text-center text-sm font-bold text-blue-800 placeholder:text-slate-400 placeholder:font-normal placeholder:text-[11px]"
              />
              <span className="text-[10px] font-extrabold uppercase text-slate-900 tracking-wide">Responsável</span>
            </div>
          </div>

          {/* RODAPÉ – versículos */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 italic text-[9px] md:text-[10px] text-slate-700">
            <span>Deus é por nós, quem será contra nós? Rm 8:31</span>
            <span>Agindo Deus, quem impedirá? Is 43:31</span>
          </div>
        </div>

        {/* ===================== AÇÕES + ANEXOS ===================== */}
        <div className="mx-auto max-w-3xl mt-5 space-y-4">

          {/* Anexos (apenas em edição) */}
          {isEdit && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Anexos da Ficha</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropAttachment(e, 'cte')}
                  className={`py-3 border border-dashed border-slate-300 hover:border-yellow-500 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 ${uploadingAttachment ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input type="file" className="sr-only" accept=".pdf,.xml,image/png,image/jpeg,image/webp,text/xml,application/xml" disabled={uploadingAttachment} onChange={(e) => handleUploadFile(e, 'cte')} />
                  <Paperclip className="h-4 w-4 text-slate-400" /> Arraste ou clique para anexar CTE / XML
                </label>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropAttachment(e, 'comprovante')}
                  className={`py-3 border border-dashed border-slate-300 hover:border-yellow-500 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 ${uploadingAttachment ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,.pdf" disabled={uploadingAttachment} onChange={(e) => handleUploadFile(e, 'comprovante')} />
                  <Paperclip className="h-4 w-4 text-emerald-500" /> Arraste ou clique para anexar comprovante
                </label>
              </div>
              {attachments.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
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
          )}

          {/* Assinatura + Salvar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input id="ip-signature-check" name="signature_confirmed" type="checkbox" checked={!!signatureText}
                onChange={(e) => setSignatureText(e.target.checked ? 'Confirmada' : '')} className="h-4 w-4" />
              Confirmar assinatura digital do operador
            </label>
            <button id="submit-order-form-btn" type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-md flex items-center gap-2 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {submitting ? 'Salvando...' : isEdit ? 'Salvar Alterações da Ficha' : 'Emitir Ficha de Frete'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Combobox de motorista com busca por NOME ou CPF.
 * Tanto o campo "Motorista" quanto o campo "CPF" usam este componente e
 * controlam o mesmo driverId — selecionar em um reflete no outro.
 */
function DriverCombobox({
  drivers,
  value,
  onChange,
  display,
  inputClass,
  inputId,
  placeholder,
  freeTextValue = '',
  onFreeTextChange,
}: {
  drivers: Driver[];
  value: string;
  onChange: (id: string) => void;
  display: 'name' | 'cpf';
  inputClass: string;
  inputId?: string;
  placeholder?: string;
  freeTextValue?: string;
  onFreeTextChange?: (value: string) => void;
}) {
  const selected = drivers.find(d => d.id === value);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  const shownValue = editing
    ? query
    : selected
      ? (display === 'cpf' ? (selected.cpf || '') : selected.name)
      : freeTextValue;

  const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
  const q = query.trim();
  const qDigits = onlyDigits(q);
  const filtered = !q
    ? drivers
    : drivers.filter(d =>
        d.name.toLowerCase().includes(q.toLowerCase()) ||
        (qDigits.length > 0 && onlyDigits(d.cpf).includes(qDigits))
      );

  return (
    <div
      className="relative flex-1 min-w-0"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget as Node | null;
        if (!nextFocus || !event.currentTarget.contains(nextFocus)) {
          setOpen(false);
          setEditing(false);
        }
      }}
    >
      <input
        id={inputId}
        name={inputId}
        type="text"
        autoComplete="off"
        value={shownValue}
        placeholder={placeholder}
        onFocus={() => { setEditing(true); setOpen(true); setQuery(selected ? '' : freeTextValue); }}
        onChange={(e) => {
          const nextValue = e.target.value;
          setQuery(nextValue);
          onFreeTextChange?.(nextValue);
          setEditing(true);
          setOpen(true);
        }}
        className={inputClass}
      />
      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-60 overflow-auto bg-white border border-slate-200 rounded-xl shadow-xl animate-slide-in">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">Nenhum motorista encontrado.</div>
          ) : (
            filtered.map(d => (
              <button
                key={d.id}
                type="button"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(d.id); setEditing(false); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-amber-500/10 hover:text-slate-950 ${d.id === value ? 'bg-amber-500/10 text-slate-950 font-bold' : 'text-slate-700'}`}
              >
                <span className="block text-xs font-bold text-slate-900">
                  {d.name}{d.status === 'Bloqueado' ? ' ⚠ (BLOQUEADO)' : ''}
                </span>
                <span className="block text-[11px] text-blue-700">CPF: {d.cpf || '—'}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Combobox de veículo com busca por placa do cavalo.
 * O campo "Tipo de Veículo" e "Placa Cav." controlam o mesmo vehicleId,
 * então selecionar pela placa preenche automaticamente o conjunto da ficha.
 */
function VehicleCombobox({
  vehicles,
  value,
  onChange,
  display,
  inputClass,
  inputId,
  placeholder,
  freeTextValue = '',
  onFreeTextChange,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (id: string) => void;
  display: 'summary' | 'tractor';
  inputClass: string;
  inputId?: string;
  placeholder?: string;
  freeTextValue?: string;
  onFreeTextChange?: (value: string) => void;
}) {
  const selected = vehicles.find(v => v.id === value);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  const formatSummary = (vehicle: Vehicle) =>
    `${vehicle.model || 'Veículo'} — ${vehicle.tractor_plate || '—'} / ${vehicle.trailer_plate || '—'}`;

  const shownValue = editing
    ? query
    : selected
      ? (display === 'tractor' ? (selected.tractor_plate || '') : formatSummary(selected))
      : freeTextValue;

  const normalizePlate = (plate: string) => (plate || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const q = query.trim();
  const qLower = q.toLowerCase();
  const qPlate = normalizePlate(q);
  const filtered = !q
    ? vehicles
    : vehicles.filter(v =>
        v.model?.toLowerCase().includes(qLower) ||
        v.owner_name?.toLowerCase().includes(qLower) ||
        v.tractor_plate?.toLowerCase().includes(qLower) ||
        v.trailer_plate?.toLowerCase().includes(qLower) ||
        (qPlate.length > 0 && normalizePlate(v.tractor_plate).includes(qPlate)) ||
        (qPlate.length > 0 && normalizePlate(v.trailer_plate).includes(qPlate))
      );

  return (
    <div
      className="relative flex-1 min-w-0"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget as Node | null;
        if (!nextFocus || !event.currentTarget.contains(nextFocus)) {
          setOpen(false);
          setEditing(false);
        }
      }}
    >
      <input
        id={inputId}
        name={inputId}
        type="text"
        autoComplete="off"
        value={shownValue}
        placeholder={placeholder}
        onFocus={() => { setEditing(true); setOpen(true); setQuery(selected ? '' : freeTextValue); }}
        onChange={(e) => {
          const nextValue = display === 'tractor' ? e.target.value.toUpperCase() : e.target.value;
          setQuery(nextValue);
          onFreeTextChange?.(nextValue);
          setEditing(true);
          setOpen(true);
        }}
        className={inputClass}
      />
      {open && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-60 overflow-auto bg-white border border-slate-200 rounded-xl shadow-xl animate-slide-in">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">Nenhum veículo encontrado.</div>
          ) : (
            filtered.map(v => (
              <button
                key={v.id}
                type="button"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(v.id); setEditing(false); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 hover:bg-amber-500/10 hover:text-slate-950 ${v.id === value ? 'bg-amber-500/10 text-slate-950 font-bold' : 'text-slate-700'}`}
              >
                <span className="block text-xs font-bold text-slate-900">
                  {v.tractor_plate || '—'} / {v.trailer_plate || '—'}{v.status === 'Bloqueado' ? ' ⚠ (BLOQUEADO)' : ''}
                </span>
                <span className="block text-[11px] text-blue-700">{v.model || 'Modelo não informado'} · {v.owner_name || 'Proprietário não informado'}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
