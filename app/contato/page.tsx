'use client';

import React, { useState } from 'react';
import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Mail, MapPin, MessageCircle, Phone, Users, CheckCircle } from 'lucide-react';

const units = [
  ['Matriz', 'Base operacional RBA Transporte & Logística - MG', '(31) 99309-2821'],
];

export default function ContactPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const emailSubject = `Contato Site RBA - ${assunto}`;
    const emailText = 
      `Olá Comercial RBA,\n\n` +
      `Temos uma nova mensagem recebida pela página de Contato:\n\n` +
      `- Nome: ${nome}\n` +
      `- E-mail: ${email}\n` +
      `- Assunto: ${assunto}\n\n` +
      `MENSAGEM:\n` +
      `${mensagem}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.6;">
        <h2 style="color: #d7b15d; border-bottom: 2px solid #d7b15d; padding-bottom: 8px;">Nova Mensagem de Contato</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        
        <h3 style="color: #111; margin-top: 20px;">Mensagem</h3>
        <p style="background-color: #f9f9f9; padding: 10px; border-left: 4px solid #d7b15d; font-style: italic;">
          ${mensagem.replace(/\n/g, '<br>')}
        </p>
        
        <hr style="border: 0; border-top: 1px solid #ccc; margin-top: 30px;" />
        <p style="font-size: 11px; color: #888;">Enviado automaticamente pelo formulário de contato do site RBA.</p>
      </div>
    `;

    const rawData = {
      'Nome': nome,
      'E-mail': email,
      'Assunto': assunto,
      'Mensagem': mensagem
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
        throw new Error(data?.error || 'Erro ao enviar a mensagem.');
      }

      setEnviado(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão ao enviar a mensagem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicSiteChrome>
      <main className="pt-20">
        <section className="relative min-h-[430px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/rba-home/facility-front.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,7,0.92),rgba(4,6,7,0.46),rgba(4,6,7,0.74))]" />
          <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
            <div className="max-w-4xl">
              <h1 className="font-heading text-4xl font-black uppercase leading-none text-[#d7b15d] md:text-7xl">Estamos onde você precisa</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                Fale com a equipe RBA para alinhar coleta, entrega, orçamento, parceria ou atendimento pelo portal.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-16 text-[#111311] md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[0.42fr_0.58fr]">
            <div className="grid gap-4">
              <article className="border border-black/10 bg-[#101415] p-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                <Phone className="h-8 w-8 text-[#d7b15d]" />
                <h2 className="mt-4 text-lg font-black uppercase text-[#d7b15d]">Telefone</h2>
                <p className="mt-2 text-sm text-white/68">(31) 99309-2821</p>
              </article>
              <article className="border border-black/10 bg-[#101415] p-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                <Mail className="h-8 w-8 text-[#d7b15d]" />
                <h2 className="mt-4 text-lg font-black uppercase text-[#d7b15d]">E-mail</h2>
                <p className="mt-2 text-sm text-white/68">comercial@rbatransporte.com.br</p>
              </article>
              <article className="border border-black/10 bg-[#101415] p-6 text-white shadow-[0_18px_45px_rgba(0,0,0,0.08)]">
                <h2 className="text-lg font-black uppercase text-[#d7b15d]">Social</h2>
                <div className="mt-4 flex gap-3 text-[#d7b15d]">
                  <Users className="h-6 w-6" />
                  <MessageCircle className="h-6 w-6" />
                </div>
              </article>
            </div>

            {enviado ? (
              <div className="border border-[#d7b15d] bg-[#101415] p-8 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] space-y-4 rounded-xl">
                <CheckCircle className="mx-auto h-16 w-16 text-[#d7b15d]" />
                <h3 className="text-2xl font-black text-[#d7b15d]">Mensagem Enviada!</h3>
                <p className="text-white/80 max-w-md mx-auto text-sm leading-relaxed">
                  Sua mensagem de contato foi enviada com sucesso para o e-mail 
                  <strong className="text-[#d7b15d]"> comercial@rbatransporte.com.br</strong>.
                </p>
                <button 
                  onClick={() => {
                    setEnviado(false);
                    setNome('');
                    setEmail('');
                    setAssunto('');
                    setMensagem('');
                  }}
                  className="mt-4 px-6 py-2 border border-[#d7b15d] hover:bg-[#d7b15d] hover:text-[#10110f] transition-all text-xs font-black uppercase tracking-wider text-[#d7b15d] cursor-pointer"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-[#d7b15d]/45 bg-[#101415] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:p-8">
                {errorMsg && (
                  <div className="mb-5 p-5 bg-red-950/80 border border-red-500 text-red-200 rounded-2xl space-y-4">
                    <div className="flex items-start gap-2.5">
                      <span className="text-sm shrink-0">⚠️</span>
                      <div>
                        <p className="font-bold text-red-300 text-sm">Falha no envio automático:</p>
                        <p className="mt-0.5 text-xs text-red-200/80">{errorMsg}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-red-500/20 pt-4 space-y-3">
                      <p className="text-xs text-slate-350 font-bold">Não se preocupe! Você pode enviar sua mensagem diretamente usando os botões abaixo:</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <a
                          href={`https://wa.me/5531993092821?text=${encodeURIComponent(
                            `Olá Comercial RBA, meu nome é ${nome} (${email}):\n\n` +
                            `• Assunto: ${assunto}\n` +
                            `• Mensagem: ${mensagem}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                        >
                          Enviar por WhatsApp
                        </a>
                        <a
                          href={`mailto:comercial@rbatransporte.com.br?subject=${encodeURIComponent(
                            `Contato RBA - ${assunto}`
                          )}&body=${encodeURIComponent(
                            `Olá Comercial RBA,\n\nTemos uma nova mensagem de contato:\n\n` +
                            `• Nome: ${nome}\n` +
                            `• E-mail: ${email}\n\n` +
                            `Mensagem:\n${mensagem}`
                          )}`}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] tracking-wider uppercase rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                        >
                          Enviar por E-mail (Manual)
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-white/78">
                    Nome
                    <input 
                      required
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" 
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-white/78">
                    E-mail
                    <input 
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" 
                    />
                  </label>
                </div>
                <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                  Assunto
                  <input 
                    required
                    placeholder="Ex: Dúvidas sobre fretes, parcerias..."
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" 
                  />
                </label>
                <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                  Mensagem
                  <textarea 
                    required
                    placeholder="Sua mensagem..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    className="min-h-36 border border-[#d7b15d]/40 bg-[#0a0d0e] p-4 text-white outline-none focus:border-[#d7b15d]" 
                  />
                </label>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="mt-6 h-12 w-full bg-[#d7b15d] text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Processando...' : 'Enviar mensagem'}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="bg-[#101415] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="relative h-[360px] overflow-hidden border border-white/10 bg-[#0a0d0e]">
              <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(215,177,93,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(215,177,93,0.18)_1px,transparent_1px)] [background-size:46px_46px]" />
              <div className="absolute left-[50%] top-[50%] h-4 w-4 rounded-full bg-[#d7b15d] shadow-[0_0_0_12px_rgba(215,177,93,0.15)]" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-6">
                <span className="text-sm font-black uppercase tracking-[0.16em] text-[#d7b15d]">Matriz operacional - MG</span>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              {units.map(([title, address, phone]) => (
                <article key={title} className="w-full max-w-md border border-white/10 bg-[#0a0d0e] p-6 text-center text-white">
                  <MapPin className="mx-auto h-8 w-8 text-[#d7b15d]" />
                  <h2 className="mt-4 text-xl font-black uppercase text-[#d7b15d]">{title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/62">{address}</p>
                  <p className="mt-3 text-sm font-bold text-white/74">{phone}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteChrome>
  );
}
