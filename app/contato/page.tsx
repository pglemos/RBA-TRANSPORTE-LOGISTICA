import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Mail, MapPin, MessageCircle, Phone, Users } from 'lucide-react';

const units = [
  ['Matriz', 'Base operacional RBA Transporte & Logística - MG', '(31) 99309-2821'],
];

export default function ContactPage() {
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

            <form className="border border-[#d7b15d]/45 bg-[#101415] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                {['Nome', 'E-mail'].map((label) => (
                  <label key={label} className="grid gap-2 text-sm font-semibold text-white/78">
                    {label}
                    <input className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" />
                  </label>
                ))}
              </div>
              <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                Assunto
                <input className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" />
              </label>
              <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                Mensagem
                <textarea className="min-h-36 border border-[#d7b15d]/40 bg-[#0a0d0e] p-4 text-white outline-none focus:border-[#d7b15d]" />
              </label>
              <button className="mt-6 h-12 w-full bg-[#d7b15d] text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82]">
                Enviar mensagem
              </button>
            </form>
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
                <article key={title} className="w-full max-w-md border border-white/10 bg-[#0a0d0e] p-6 text-center">
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
