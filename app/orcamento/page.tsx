'use client';

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Headphones, MapPinned, ShieldCheck, CheckCircle } from 'lucide-react';

export default function QuotePage() {
  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [tipoCarga, setTipoCarga] = useState('');
  const [peso, setPeso] = useState('');
  const [dimensoes, setDimensoes] = useState('');
  const [valorCarga, setValorCarga] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatTelefone = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  const handlePhoneChange = (val: string) => {
    setTelefone(formatTelefone(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const emailSubject = `Solicitação de Orçamento - ${empresa || nome}`;
    const emailText = 
      `Olá Comercial RBA,\n\n` +
      `Temos uma nova solicitação de orçamento pelo site:\n\n` +
      `1. INFORMAÇÕES DE CONTATO\n` +
      `- Nome: ${nome}\n` +
      `- Empresa: ${empresa || 'Não informada'}\n` +
      `- E-mail: ${email}\n` +
      `- Telefone: ${telefone}\n\n` +
      `2. ORIGEM E DESTINO\n` +
      `- Cidade/Estado Origem: ${origem}\n` +
      `- Cidade/Estado Destino: ${destino}\n\n` +
      `3. DETALHES DA CARGA\n` +
      `- Tipo de Carga: ${tipoCarga}\n` +
      `- Peso (kg): ${peso}\n` +
      `- Dimensões (CxLxA cm): ${dimensoes || 'Não informadas'}\n` +
      `- Valor aproximado: R$ ${valorCarga}\n\n` +
      `4. TIPO DE SERVIÇO\n` +
      `- Serviço selecionado: ${tipoServico}\n\n` +
      `MENSAGEM:\n` +
      `${mensagem || 'Sem mensagem adicional.'}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.6;">
        <h2 style="color: #d7b15d; border-bottom: 2px solid #d7b15d; padding-bottom: 8px;">Nova Solicitação de Orçamento</h2>
        
        <h3 style="color: #111; margin-top: 20px;">1. Informações de Contato</h3>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Empresa:</strong> ${empresa || 'Não informada'}</p>
        <p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        
        <h3 style="color: #111; margin-top: 20px;">2. Origem e Destino</h3>
        <p><strong>Cidade/Estado Origem:</strong> ${origem}</p>
        <p><strong>Cidade/Estado Destino:</strong> ${destino}</p>
        
        <h3 style="color: #111; margin-top: 20px;">3. Detalhes da Carga</h3>
        <p><strong>Tipo de Carga:</strong> ${tipoCarga}</p>
        <p><strong>Peso (kg):</strong> ${peso}</p>
        <p><strong>Dimensões (CxLxA cm):</strong> ${dimensoes || 'Não informadas'}</p>
        <p><strong>Valor Aproximado:</strong> R$ ${valorCarga}</p>
        
        <h3 style="color: #111; margin-top: 20px;">4. Tipo de Serviço</h3>
        <p><strong>Serviço Selecionado:</strong> ${tipoServico}</p>
        
        <h3 style="color: #111; margin-top: 20px;">Mensagem Opcional</h3>
        <p style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #d7b15d; font-style: italic;">
          ${mensagem ? mensagem.replace(/\n/g, '<br>') : 'Sem observações adicionais.'}
        </p>
        
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 30px;" />
        <p style="font-size: 11px; color: #888;">Enviado automaticamente pelo portal do site RBA Transporte.</p>
      </div>
    `;

    const rawData = {
      'Nome': nome,
      'Empresa': empresa || 'Não informada',
      'E-mail': email,
      'Telefone': telefone,
      'Origem': origem,
      'Destino': destino,
      'Tipo de Carga': tipoCarga,
      'Peso (kg)': peso,
      'Dimensões (CxLxA cm)': dimensoes || 'Não informadas',
      'Valor aproximado da carga': valorCarga,
      'Tipo de Serviço': tipoServico,
      'Mensagem opcional': mensagem || 'Sem observações adicionais.'
    };

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
          rawData
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao enviar o orçamento.');
      }

      setEnviado(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão ao enviar o e-mail de orçamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicSiteChrome>
      <main className="pt-20">
        <section className="relative min-h-[430px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/rba-home/operation-dock.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,7,0.94),rgba(4,6,7,0.5),rgba(4,6,7,0.78))]" />
          <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
            <div className="max-w-4xl">
              <h1 className="font-heading text-4xl font-black uppercase leading-none text-[#d7b15d] md:text-7xl">Solicite um orçamento</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                Envie os dados da carga e a equipe RBA retorna com a melhor configuração para sua operação.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#222829] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-center text-3xl font-black uppercase text-[#d7b15d] md:text-5xl">Detalhes do orçamento</h2>
            
            {enviado ? (
              <div className="mt-9 border border-[#d7b15d] bg-[#111514] p-8 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] space-y-4 rounded-xl">
                <CheckCircle className="mx-auto h-16 w-16 text-[#d7b15d]" />
                <h3 className="text-2xl font-black text-[#d7b15d]">Solicitação Enviada!</h3>
                <p className="text-white/80 max-w-lg mx-auto text-sm leading-relaxed">
                  Os detalhes do orçamento foram enviados com sucesso diretamente para o e-mail 
                  <strong className="text-[#d7b15d]"> comercial@rbatransporte.com.br</strong>.
                </p>
                <p className="text-white/60 text-xs">
                  Entraremos em contato o mais breve possível com a cotação da sua operação.
                </p>
                <button 
                  onClick={() => {
                    setEnviado(false);
                    setNome('');
                    setEmpresa('');
                    setEmail('');
                    setTelefone('');
                    setOrigem('');
                    setDestino('');
                    setTipoCarga('');
                    setPeso('');
                    setDimensoes('');
                    setValorCarga('');
                    setTipoServico('');
                    setMensagem('');
                  }}
                  className="mt-4 px-6 py-2 border border-[#d7b15d] hover:bg-[#d7b15d] hover:text-[#10110f] transition-all text-xs font-black uppercase tracking-wider text-[#d7b15d] cursor-pointer"
                >
                  Fazer nova solicitação
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-9 border border-[#d7b15d]/45 bg-[#111514] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] md:p-9">
                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-950/60 border border-red-500 text-red-200 rounded-xl text-xs font-semibold flex items-start gap-2.5">
                    <span className="text-sm shrink-0">⚠️</span>
                    <div>
                      <p className="font-bold text-red-300">Falha no envio automático:</p>
                      <p className="mt-0.5">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <FormSection title="1. Informações de contato">
                  <Field label="Nome" value={nome} onChange={setNome} placeholder="Seu nome completo" />
                  <Field label="Empresa" value={empresa} onChange={setEmpresa} placeholder="Nome da empresa" required={false} />
                  <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seuemail@exemplo.com" />
                  <Field label="Telefone" value={telefone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" />
                </FormSection>

                <FormSection title="2. Origem e destino">
                  <Field label="Cidade/Estado origem" value={origem} onChange={setOrigem} placeholder="Ex: São Paulo - SP" />
                  <Field label="Cidade/Estado destino" value={destino} onChange={setDestino} placeholder="Ex: Belo Horizonte - MG" />
                </FormSection>

                <FormSection title="3. Detalhes da carga">
                  <Field label="Tipo de carga" value={tipoCarga} onChange={setTipoCarga} placeholder="Ex: Bobinas, Paletizado, etc." />
                  <Field label="Peso em kg" value={peso} onChange={setPeso} placeholder="Ex: 12000" />
                  <Field label="Dimensões (CxLxA cm)" value={dimensoes} onChange={setDimensoes} placeholder="Ex: 600x240x250" required={false} />
                  <Field label="Valor aproximado da carga" value={valorCarga} onChange={setValorCarga} placeholder="Ex: 50.000,00" />
                </FormSection>

                <div className="mt-8">
                  <h3 className="text-2xl font-black">4. Tipo de serviço</h3>
                  <div className="mt-5 max-w-md">
                    <label className="grid gap-2 text-sm font-semibold text-white/78">
                      Selecione o modelo de serviço desejado *
                      <select 
                        required
                        value={tipoServico}
                        onChange={(e) => setTipoServico(e.target.value)}
                        className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d] cursor-pointer"
                      >
                        <option value="">Selecione o tipo de serviço...</option>
                        <option value="Lotação (Frete Dedicado)">Lotação (Frete Dedicado)</option>
                        <option value="Fracionado">Fracionado</option>
                        <option value="Especial">Especial</option>
                      </select>
                    </label>
                  </div>
                </div>

                <label className="mt-6 grid gap-2 text-sm font-semibold text-white/78">
                  Mensagem opcional
                  <textarea 
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Adicione observações ou instruções especiais aqui..."
                    className="min-h-36 border border-[#d7b15d]/40 bg-[#0a0d0e] p-4 text-white outline-none focus:border-[#d7b15d]" 
                  />
                </label>

                <div className="mt-6 grid gap-4 text-sm font-semibold text-white/72 md:grid-cols-3">
                  <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#d7b15d]" /> Transporte seguro</span>
                  <span className="flex items-center gap-3"><MapPinned className="h-5 w-5 text-[#d7b15d]" /> Rota planejada</span>
                  <span className="flex items-center gap-3"><Headphones className="h-5 w-5 text-[#d7b15d]" /> Resposta rápida</span>
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="mt-7 h-12 w-full bg-[#d7b15d] text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Processando...' : 'Enviar solicitação'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </PublicSiteChrome>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="text-2xl font-black">{title}</h3>
      <div className="mt-5 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  required = true, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string; 
  required?: boolean; 
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/78">
      {label}
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" 
      />
    </label>
  );
}
