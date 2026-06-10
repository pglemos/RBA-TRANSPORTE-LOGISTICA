import Link from 'next/link';
import PublicSiteChrome from '@/components/PublicSiteChrome';
import { Boxes, CheckCircle2, ChevronRight, Clock3, Forklift, Route, ShieldCheck, Truck, Warehouse } from 'lucide-react';

const services = [
  {
    title: 'Transporte rodoviário',
    text: 'Soluções completas e fracionadas para entregas comerciais, industriais e operações recorrentes.',
    icon: Truck,
  },
  {
    title: 'Logística integrada',
    text: 'Apoio de pátio, armazenagem, separação, movimentação e distribuição com controle operacional.',
    icon: Warehouse,
  },
  {
    title: 'Cargas especiais',
    text: 'Planejamento para máquinas, equipamentos, volumes sensíveis e cargas que exigem cuidado técnico.',
    icon: Boxes,
  },
  {
    title: 'Movimentação interna',
    text: 'Empilhadeira, doca e equipe de apoio para carga, descarga e transferência entre veículos.',
    icon: Forklift,
  },
  {
    title: 'Rotas programadas',
    text: 'Coletas e entregas com rotina definida, previsibilidade de horário e acompanhamento próximo.',
    icon: Route,
  },
  {
    title: 'Atendimento sob medida',
    text: 'Operações desenhadas conforme origem, destino, volume, prazo e nível de suporte exigido.',
    icon: Clock3,
  },
];

const advantages = [
  ['Segurança', 'Equipe treinada, veículos identificados e documentação acompanhada.'],
  ['Tecnologia', 'Comunicação rápida para manter cliente e operação na mesma página.'],
  ['Pontualidade', 'Roteirização prática e compromisso com janelas de coleta e entrega.'],
];

export default function ServicesPage() {
  return (
    <PublicSiteChrome>
      <main className="pt-20">
        <section className="relative min-h-[430px] overflow-hidden">
          <div className="absolute inset-0 bg-[url('/rba-home/site-hero.webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,7,0.94),rgba(4,6,7,0.58),rgba(4,6,7,0.76))]" />
          <div className="relative z-10 mx-auto flex min-h-[430px] max-w-7xl items-center px-5 md:px-8">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl font-black uppercase leading-none text-[#d7b15d] md:text-7xl">Nossos serviços</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
                Transporte, armazenagem e apoio operacional para empresas que precisam de carga em movimento com controle real.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#101415] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="min-h-[360px] bg-[url('/rba-home/container-operation.webp')] bg-cover bg-center shadow-[0_24px_70px_rgba(0,0,0,0.36)]" />
            <div>
              <h2 className="font-heading text-3xl font-black uppercase leading-tight text-white md:text-5xl">Transporte rodoviário com estrutura de operação.</h2>
              <p className="mt-6 text-sm leading-8 text-white/64">
                A RBA atende cargas completas, fracionadas e dedicadas, conectando frota, pátio, equipe de apoio e comunicação para reduzir improviso na entrega.
              </p>
              <div className="mt-8 grid gap-3">
                {['Coleta e entrega com acompanhamento', 'Frota para cargas comerciais e industriais', 'Apoio em doca, pátio e movimentação'].map((item) => (
                  <div key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm font-semibold text-white/82">
                    <CheckCircle2 className="h-5 w-5 text-[#d7b15d]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f1eb] px-5 py-16 text-[#111311] md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {services.map(({ title, text, icon: Icon }) => (
                <article key={title} className="border border-black/10 bg-white p-7 shadow-[0_18px_45px_rgba(0,0,0,0.07)]">
                  <div className="flex h-12 w-12 items-center justify-center bg-[#101312] text-[#d7b15d]">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-xl font-black uppercase leading-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-black/60">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#111514] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {advantages.map(([title, text]) => (
              <article key={title} className="border border-white/10 bg-[#0a0d0e] p-8 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-[#d7b15d]" strokeWidth={1.4} />
                <h3 className="mt-5 text-xl font-black uppercase text-[#d7b15d]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-black px-5 py-14 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <h2 className="font-heading max-w-xl text-3xl font-black uppercase leading-tight text-white md:text-5xl">Precisa de uma solução sob medida?</h2>
            <Link href="/orcamento" className="inline-flex h-12 w-fit items-center justify-center gap-2 bg-[#d7b15d] px-6 text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82]">
              Solicitar orçamento
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteChrome>
  );
}
