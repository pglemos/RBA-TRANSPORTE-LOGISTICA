import type { ReactNode } from 'react';
import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Headphones, MapPinned, ShieldCheck } from 'lucide-react';

export default function QuotePage() {
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
            <form className="mt-9 border border-[#d7b15d]/45 bg-[#111514] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.38)] md:p-9">
              <FormSection title="1. Informações de contato">
                <Field label="Nome" />
                <Field label="Empresa" />
                <Field label="E-mail" />
                <Field label="Telefone" />
              </FormSection>

              <FormSection title="2. Origem e destino">
                <Field label="Cidade/Estado origem" />
                <Field label="Cidade/Estado destino" />
              </FormSection>

              <FormSection title="3. Detalhes da carga">
                <Field label="Tipo de carga" />
                <Field label="Peso em kg" />
                <Field label="Dimensões (CxLxA cm)" />
                <Field label="Valor aproximado da carga" />
              </FormSection>

              <div className="mt-8">
                <h3 className="text-2xl font-black">4. Tipo de serviço</h3>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {['Lotação', 'Fracionado', 'Especial'].map((label) => (
                    <label key={label} className="grid gap-2 text-sm font-semibold text-white/78">
                      {label}
                      <select className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]">
                        <option>{label}</option>
                      </select>
                    </label>
                  ))}
                </div>
              </div>

              <label className="mt-6 grid gap-2 text-sm font-semibold text-white/78">
                Mensagem opcional
                <textarea className="min-h-36 border border-[#d7b15d]/40 bg-[#0a0d0e] p-4 text-white outline-none focus:border-[#d7b15d]" />
              </label>

              <div className="mt-6 grid gap-4 text-sm font-semibold text-white/72 md:grid-cols-3">
                <span className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#d7b15d]" /> Transporte seguro</span>
                <span className="flex items-center gap-3"><MapPinned className="h-5 w-5 text-[#d7b15d]" /> Rota planejada</span>
                <span className="flex items-center gap-3"><Headphones className="h-5 w-5 text-[#d7b15d]" /> Resposta rápida</span>
              </div>

              <button className="mt-7 h-12 w-full bg-[#d7b15d] text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82]">
                Enviar solicitação
              </button>
            </form>
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

function Field({ label }: { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/78">
      {label}
      <input className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" />
    </label>
  );
}
