import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Eye, HeartHandshake, ShieldCheck, Target } from 'lucide-react';

const pillars = [
  { title: 'Missão', text: 'Entregar soluções logísticas com responsabilidade, controle e atendimento próximo.', icon: Target },
  { title: 'Visão', text: 'Ser referência em transporte regional pela confiança construída em cada operação.', icon: Eye },
  { title: 'Valores', text: 'Compromisso, segurança, transparência, respeito ao cliente e execução bem feita.', icon: HeartHandshake },
];

const timeline = [
  ['2017', 'Início da jornada com foco em transporte rodoviário e atendimento direto.'],
  ['2018', 'Expansão da operação com estrutura de apoio e rotina de pátio.'],
  ['2024', 'Fortalecimento da marca RBA com frota identificada e processos mais integrados.'],
];

export default function AboutPage() {
  return (
    <PublicSiteChrome>
      <main className="pt-20">
        <section className="relative min-h-[430px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/rba-home/facility-front.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,7,0.92),rgba(4,6,7,0.48),rgba(4,6,7,0.78))]" />
          <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl font-black uppercase leading-none text-[#d7b15d] md:text-7xl">Nossa história</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                Uma jornada construída com serviço, presença operacional e compromisso com a carga do cliente.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-16 text-[#111311] md:px-8 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-base leading-8 text-black/68">
              A RBA Transporte & Logística cresceu atendendo empresas que precisam de uma operação objetiva, segura e próxima. O trabalho combina frota, equipe, apoio em pátio e comunicação direta para cada entrega sair com clareza desde a coleta até o destino.
            </p>
            <p className="mt-6 text-base leading-8 text-black/68">
              Mais do que deslocar cargas, a RBA organiza etapas, entende restrições de cada cliente e mantém uma rotina de execução que valoriza pontualidade, responsabilidade e transparência.
            </p>
          </div>
        </section>

        <section className="bg-[#101415] px-5 py-14 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {pillars.map(({ title, text, icon: Icon }) => (
              <article key={title} className="border border-[#d7b15d]/35 bg-[#080b0c] p-8 text-center">
                <Icon className="mx-auto h-10 w-10 text-[#d7b15d]" strokeWidth={1.4} />
                <h2 className="mt-5 text-xl font-black uppercase text-[#d7b15d]">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-white/62">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white px-5 py-16 text-[#111311] md:px-8 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl">
              {timeline.map(([year, text], index) => (
                <div key={year} className="grid grid-cols-[90px_1fr] gap-8 border-l-2 border-black/15 pb-10 last:pb-0">
                  <div className="-ml-[9px] flex items-start gap-5">
                    <span className="mt-1 h-4 w-4 rounded-full bg-[#111311]" />
                    <strong className="text-2xl font-black">{year}</strong>
                  </div>
                  <p className="pt-1 text-sm leading-7 text-black/62">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0a0d0e] px-5 py-16 text-center md:px-8 md:py-20">
          <ShieldCheck className="mx-auto h-12 w-12 text-[#d7b15d]" strokeWidth={1.4} />
          <h2 className="mt-5 font-heading text-3xl font-black uppercase text-white md:text-5xl">Qualidade e segurança</h2>
          <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-white/62">
            A empresa mantém atenção constante à documentação, condução, movimentação de carga e atendimento. Cada etapa precisa ser simples de acompanhar e consistente para o cliente.
          </p>
        </section>
      </main>
    </PublicSiteChrome>
  );
}
