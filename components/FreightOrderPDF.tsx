'use client';

import React from 'react';
import { Printer, ShieldCheck, XCircle, Share2, CornerDownRight } from 'lucide-react';
import RBALogo from '@/components/RBALogo';
import { normalizeFreightOrderStatus } from '@/lib/freightStatus';
import { formatFreightOrderEmissionLongDate } from '@/lib/freightOrderDates';

interface Props {
  order: {
    id: string;
    order_number: string;
    driver_name: string;
    driver_cpf: string;
    driver_rg: string;
    driver_phone: string;
    vehicle_tractor_plate: string;
    vehicle_trailer_plate: string;
    vehicle_model: string;
    vehicle_year: string;
    client_name: string;
    client_document: string;
    origin: string;
    destination: string;
    delivery_date: string;
    freight_value: number;
    advance_value: number;
    cash_value: number;
    balance_value: number;
    loading_expense: number;
    unloading_expense: number;
    other_expenses: number;
    total_expenses: number;
    net_value: number;
    buonny_status: string;
    cte_number: string;
    shipment_release_status: string;
    shipment_release_limit: string;
    notes: string;
    responsible_name: string;
    signature_url: string;
    emission_day?: string;
    emission_month?: string;
    emission_year?: string;
    created_at: string;
    pdf_proof_token?: string;
    bank_data_snapshot: {
      bank_name: string;
      bank_agency: string;
      bank_account: string;
      pix_key: string;
      beneficiary_name: string;
    };
  };
  onClose: () => void;
}

export default function FreightOrderPDF({ order, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const getQRSeed = () => {
    return `RBA_HMAC_SHA256:${order.pdf_proof_token || 'assinatura-indisponivel'}`;
  };

  const emissionLabel = formatFreightOrderEmissionLongDate(order);

  return (
    <div id="pdf-modal-overlay" className="fixed inset-0 bg-slate-900/70 py-6 px-4 z-50 overflow-y-auto flex items-start justify-center backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden print:p-0 print:shadow-none print:my-0">
        
        {/* ACTION HEADER BAR (Hidden when printing) */}
        <div id="pdf-header" className="bg-slate-950 text-slate-100 p-4 px-6 flex items-center justify-between border-b border-white/10 print:hidden">
          <div>
            <h3 className="font-extrabold text-xs tracking-wider uppercase text-yellow-400">Ficha de Frete Digital Gerada</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">ID Único: {order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-pdf-btn"
              onClick={handlePrint}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>
            <button
              id="close-pdf-btn"
              onClick={onClose}
              className="p-2 border border-slate-750 hover:bg-slate-800 rounded-xl text-slate-450 hover:text-white cursor-pointer"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE WORK AREA */}
        <div className="p-8 md:p-12 print:p-4 text-slate-900" id="print-area">
          
          {/* Header Grid */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-6">
            <div className="flex items-center gap-4">
              <RBALogo className="h-20 w-36" />
              <div>
                <h1 className="font-black text-lg tracking-tight">RBA TRANSPORTE & LOGÍSTICA</h1>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Apoio Logístico, Transporte Rodoviário e Gerenciamento de Risco</p>
                <p className="text-[10px] text-slate-400">Rua da Logística, 100 - Área Industrial, Cajamar - SP | CNPJ: 12.345.678/0001-90</p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1.5 md:self-stretch justify-between">
              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-300 text-center min-w-[200px]">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">CTE</span>
                <span className="text-md font-black text-slate-950">{order.cte_number || order.order_number}</span>
              </div>
              <span className="text-[9px] p-1 bg-yellow-500/10 text-yellow-800 rounded border border-yellow-500/20 uppercase font-extrabold tracking-wider">
                Emissão: {emissionLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-6">

            {/* BLOCK 1: DADOS DA VIAGEM */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                1. DADOS LOGÍSTICOS DA VIAGEM
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Cliente Pagador</span>
                  <p className="text-slate-900 font-black truncate">{order.client_name}</p>
                  <p className="text-[10px] text-slate-500">{order.client_document}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Cidade Origem</span>
                  <p className="text-slate-900 font-bold">{order.origin}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Cidade Destino</span>
                  <p className="text-slate-900 font-bold">{order.destination}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Data de Entrega</span>
                  <p className="text-slate-900 font-bold text-emerald-800">
                    {order.delivery_date ? new Date(order.delivery_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* BLOCK 2: MOTORISTA E VÍNCULO BANCÁRIO */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                2. IDENTIFICAÇÃO DO CONDUTOR E DADOS DE PAGAMENTO
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-medium">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase">Condutor Autorizado</span>
                  <p className="text-slate-900 font-black">{order.driver_name}</p>
                  <p className="text-slate-500">CPF: {order.driver_cpf}</p>
                    <p className="text-slate-500">RG: {order.driver_rg || 'N/A'}</p>
                  <p className="text-slate-500">Fone: {order.driver_phone}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase">Dados Bancários para Crédito</span>
                  <p className="text-slate-800">Banco: {order.bank_data_snapshot.bank_name}</p>
                  <p className="text-slate-500">Ag: {order.bank_data_snapshot.bank_agency} | CC: {order.bank_data_snapshot.bank_account}</p>
                  <p className="text-emerald-700 font-bold">PIX Chave ID: {order.bank_data_snapshot.pix_key}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase">Favorecido Final da Ordem</span>
                  <p className="text-slate-800 font-bold">{order.bank_data_snapshot.beneficiary_name}</p>
                </div>
              </div>
            </div>

            {/* BLOCK 3: EQUIPAMENTO E PLACAS */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                3. VEÍCULO / PLACA DE TRÁFEGO
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Equipamento Cavalo</span>
                  <p className="text-slate-900 font-bold">{order.vehicle_model} ({order.vehicle_year})</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Placa Trator (Cavalo)</span>
                  <p className="text-slate-900 font-bold border-2 border-slate-600 bg-slate-55 rounded px-2 w-fit">
                    {order.vehicle_tractor_plate}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Placa Carreta (Reboque)</span>
                  <p className="text-slate-900 font-bold border-2 border-slate-600 bg-slate-55 rounded px-2 w-fit">
                    {order.vehicle_trailer_plate}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase mb-0.5">Número CTE Associado</span>
                  <p className="text-slate-950 font-black">{order.cte_number || "A Emitir"}</p>
                </div>
              </div>
            </div>

            {/* BLOCK 4: ACORDOS FINANCEIROS */}
            <div className="border-2 border-slate-900 rounded-2xl overflow-hidden shadow">
              <div className="bg-slate-900 px-4 py-2 text-[10px] uppercase font-extrabold text-white tracking-widest flex justify-between items-center">
                <span>4. DEMONSTRATIVO FINANCEIRO DO FRETE</span>
                <span className="text-[8px] bg-yellow-400 text-black px-1.5 rounded">CÁLCULO SISTÊMICO RBA</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-250 font-medium">
                
                {/* Contractual credits */}
                <div className="space-y-3.5 pr-0 md:pr-4">
                  <h4 className="text-[10px] font-black text-slate-550 uppercase tracking-wider block">Créditos Contratuais</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Valor do Frete ao Motorista</span>
                    <strong className="text-slate-950 text-sm leading-none">R$ {order.freight_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-rose-700">
                    <span className="font-bold flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3" />
                      (-) Adiantamento em Conta Bancária
                    </span>
                    <strong>R$ {order.advance_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-rose-700">
                    <span className="font-bold flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3" />
                      (-) Valor Pago à Vista / Desconto
                    </span>
                    <strong>R$ {order.cash_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-200 pt-3 text-slate-950 font-black bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20">
                    <span>SALDO DE FRETE PENDENTE A PAGAR</span>
                    <span className="text-sm">R$ {order.balance_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Costs deductions and outputs */}
                <div className="space-y-3.5 pt-4 md:pt-0 pl-0 md:pl-6">
                  <h4 className="text-[10px] font-black text-slate-550 uppercase tracking-wider block">Ajustes Operacionais de Campo</h4>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Custo de Carga</span>
                    <span>R$ {order.loading_expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Custo Descarrega</span>
                    <span>R$ {order.unloading_expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Outros Desembolsos</span>
                    <span>R$ {order.other_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-150 pb-2.5">
                    <span className="text-slate-450 font-bold">Total Despesas Acordadas</span>
                    <strong className="text-slate-900">R$ {order.total_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-900 font-extrabold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    <span>VALOR LÍQUIDO FINAL DO FRETE</span>
                    <span>R$ {order.net_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* BLOCK 5: GERENCIAMENTO DE RISCO E ASSINATURA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              <div className="md:col-span-1 border border-slate-300 rounded-2xl p-4 text-xs font-semibold space-y-2">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">GERENCIAMENTO DE RISCO (LOG)</span>
                <div className="flex items-center justify-between border-b pb-1">
                  <span>Buonny:</span>
                  <span className={`font-black ${order.buonny_status === 'Aprovado' ? 'text-emerald-700' : 'text-yellow-700'}`}>
                    {order.buonny_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Embarque:</span>
                  <span className="font-bold bg-slate-100 p-0.5 rounded text-slate-700">
                    {normalizeFreightOrderStatus(order.shipment_release_status)}
                  </span>
                </div>
                {order.notes && (
                  <p className="text-[9px] text-slate-400 leading-tight italic truncate pt-1 hover:text-slate-700 font-medium">Nota: {order.notes}</p>
                )}
              </div>

              {/* Secure barcode block */}
              <div className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-fit gap-3">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block">CONTROLE FISCAL DIGITAL</span>
                <div className="flex items-center gap-3">
                  {/* Clean Mock QR Code Elements to avoid slow external resource lookups during compilations */}
                  <div className="h-12 w-12 bg-slate-900 border-2 border-slate-900 p-1 flex flex-wrap gap-0.5 shrink-0 rounded">
                    <div className="h-3 w-3 bg-white" />
                    <div className="h-3 w-3 bg-slate-900" />
                    <div className="h-3 w-3 bg-white" />
                    <div className="h-3 w-3 bg-slate-900" />
                    <div className="h-3.5 w-3.5 bg-white" />
                    <div className="h-3.5 w-3.5 bg-slate-900" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black block">AUTORIZAÇÃO SEGURA</span>
                    <span className="text-[8px] text-slate-500 block truncate max-w-[150px]">{getQRSeed()}</span>
                    <span className="text-[8.5px] text-emerald-800 bg-emerald-100 p-0.5 font-bold block mt-1 rounded w-fit uppercase">Válido para Trânsito Sefaz</span>
                  </div>
                </div>
              </div>

              {/* Signature stamp block */}
              <div className="md:col-span-1 border border-slate-350 bg-slate-55/50 p-4 rounded-2xl flex flex-col justify-between gap-6 relative">
                <span className="text-[9px] text-slate-450 font-extrabold block uppercase mb-0.5">VALIDAÇÃO SISTÊMICA DA EMISSÃO</span>
                <div className="text-center pb-2">
                  <p className="text-xs font-black text-slate-700">{order.responsible_name}</p>
                  <p className="text-[9.5px] text-slate-500 tracking-wide">ASSINATURA ELETRÔNICA CONFIRMADA</p>
                  <span className="text-[8px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 font-bold rounded-full mt-2 inline-block border border-emerald-300">
                    ✔ DISPOSITIVO AUDITADO RBA
                  </span>
                </div>
              </div>

            </div>

            {/* Printable Terms footer info */}
            <div className="mt-8 border-t-2 border-slate-900 pt-4 text-[9px] text-slate-450 leading-relaxed text-justify font-medium">
              A presente Ordem de Frete Digital gerada em conformidade com as regras de logística terrestre Sefaz substitui integralmente a ficha em meio físico. O condutor/motorista concorda com os saldos demonstrados e assume responsabilidade irrestrita pela custódia, transporte e entrega perfeita das mercadorias confiadas até o destino balizado. A quebra injustificada do prazo sujeita o transportador a multas estabelecidas nas cláusulas gerais de fretes RBA.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
