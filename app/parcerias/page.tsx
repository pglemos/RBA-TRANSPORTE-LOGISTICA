import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Banknote, Headphones, ShieldCheck, Truck } from 'lucide-react';

const benefits = [
  { title: 'Ganhos competitivos', text: 'Operações alinhadas para valorizar disponibilidade, rota e compromisso.', icon: Banknote },
  { title: 'Suporte contínuo', text: 'Comunicação próxima para orientar coleta, entrega e documentação.', icon: Headphones },
  { title: 'Segurança primeiro', text: 'Processos claros para proteger motorista, cliente e carga transportada.', icon: ShieldCheck },
  { title: 'Frota preparada', text: 'Parceria com veículos adequados para diferentes perfis de carga.', icon: Truck },
];

export default function PartnersPage() {
  return (
    <PublicSiteChrome>
      <main className="pt-20">
        <section className="relative min-h-[430px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/rba-home/warehouse-floor.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,7,0.92),rgba(4,6,7,0.5),rgba(4,6,7,0.74))]" />
          <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
            <div className="max-w-4xl">
              <h1 className="font-heading text-4xl font-black uppercase leading-none text-[#d7b15d] md:text-7xl">Faça parte da nossa frota</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                Cadastre seu veículo ou sua disponibilidade para operar com a RBA em rotas e demandas logísticas.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#111514] px-5 py-16 md:px-8 md:py-20">
          <h2 className="font-heading text-center text-3xl font-black uppercase text-[#d7b15d] md:text-5xl">Benefícios para motoristas</h2>
          <div className="mx-auto mt-10 grid max-w-7xl gap-4 md:grid-cols-4">
            {benefits.map(({ title, text, icon: Icon }) => (
              <article key={title} className="border border-white/10 bg-[#0a0d0e] p-7 text-center">
                <Icon className="mx-auto h-10 w-10 text-[#d7b15d]" strokeWidth={1.4} />
                <h3 className="mt-5 text-lg font-black uppercase text-[#d7b15d]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-black px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-center text-3xl font-black uppercase text-[#d7b15d] md:text-5xl">Cadastro de motorista</h2>
            <form className="mt-9 border border-[#d7b15d]/45 bg-[#111514] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] md:p-9">
              <div className="grid gap-5 md:grid-cols-2">
                {['Nome completo', 'Telefone', 'Categoria CNH', 'Tipo de veículo / carroceria'].map((label) => (
                  <label key={label} className="grid gap-2 text-sm font-semibold text-white/78">
                    {label}
                    <input className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" />
                  </label>
                ))}
              </div>
              <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                E-mail
                <input className="h-11 border border-[#d7b15d]/40 bg-[#0a0d0e] px-4 text-white outline-none focus:border-[#d7b15d]" />
              </label>
              <label className="mt-5 grid gap-2 text-sm font-semibold text-white/78">
                Observações sobre veículo, região de atendimento e disponibilidade
                <textarea className="min-h-28 border border-[#d7b15d]/40 bg-[#0a0d0e] p-4 text-white outline-none focus:border-[#d7b15d]" />
              </label>
              <button className="mt-6 h-12 w-full bg-[#d7b15d] text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82]">
                Enviar cadastro
              </button>
            </form>
          </div>
        </section>

        <section className="bg-[#111514] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="font-heading text-3xl font-black uppercase text-[#d7b15d] md:text-5xl">Perguntas frequentes</h2>
              <p className="mt-5 text-sm leading-8 text-white/62">
                A equipe avalia cadastro, perfil do veículo, documentação e regiões atendidas antes de direcionar oportunidades.
              </p>
            </div>
            <div className="grid gap-3">
              {['Como funciona o pagamento?', 'Quais veículos são aceitos?', 'Quais documentos preciso enviar?'].map((item) => (
                <details key={item} className="border border-white/10 bg-[#0a0d0e] p-5 text-white/76">
                  <summary className="cursor-pointer text-sm font-bold">{item}</summary>
                  <p className="mt-4 text-sm leading-7 text-white/56">A resposta depende do tipo de operação. Após o cadastro, a equipe RBA entra em contato para validar os dados e alinhar próximos passos.</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteChrome>
  );
}
