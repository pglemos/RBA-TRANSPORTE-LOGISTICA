'use client';

import React from 'react';
import Link from 'next/link';
import RBALogo from '@/components/RBALogo';
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Warehouse,
} from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Parcerias', href: '/parcerias' },
  { label: 'Contato', href: '/contato' },
];

const serviceCards = [
  {
    title: 'Transporte rodoviário',
    description: 'Fretes dedicados, fracionados e cargas de alto cuidado com acompanhamento operacional.',
    icon: Truck,
  },
  {
    title: 'Logística integrada',
    description: 'Doca, armazenagem, movimentação e distribuição conectadas ao fluxo do cliente.',
    icon: Warehouse,
  },
  {
    title: 'Cargas especiais',
    description: 'Equipamentos, volumes excedentes e operações que exigem planejamento e liberação técnica.',
    icon: Boxes,
  },
];

const proofItems = [
  'Frota identificada e equipe operacional própria',
  'Movimentação com empilhadeira e apoio em pátio',
  'Documentação, prazos e atendimento sob controle',
];

const galleryItems = [
  {
    title: 'Operação de doca',
    image: '/rba-home/operation-dock.webp',
  },
  {
    title: 'Carga especial',
    image: '/rba-home/special-equipment.webp',
  },
  {
    title: 'Estrutura interna',
    image: '/rba-home/warehouse-floor.webp',
  },
];

export default function LandingPage() {
  return (
    <div id="home" className="min-h-screen bg-[#090b0c] text-white selection:bg-[#d7b15d] selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080a0b]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center no-underline" aria-label="RBA Transporte & Logística">
            <RBALogo className="h-16 w-28 drop-shadow-[0_2px_1px_rgba(255,255,255,0.45)]" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[11px] font-black uppercase tracking-[0.18em] text-white/72 transition-colors hover:text-[#d7b15d]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-[#d7b15d]/70 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#f3db9f] transition-colors hover:bg-[#d7b15d] hover:text-[#0a0c0d]"
          >
            Portal do Cliente
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative min-h-[760px] overflow-hidden pt-20 md:min-h-[720px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/rba-home/site-hero.webp')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,6,0.94)_0%,rgba(3,5,6,0.72)_38%,rgba(3,5,6,0.24)_72%,rgba(3,5,6,0.5)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#090b0c] to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-5 py-16 md:px-8">
            <div className="max-w-3xl">
              <h1 className="font-heading text-[34px] font-black uppercase leading-[0.95] text-white sm:text-5xl md:text-6xl lg:text-7xl">
                Carga segura. Logística sob controle.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
                A RBA combina frota, pátio operacional e atendimento próximo para transportar cargas com previsibilidade em cada etapa.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/orcamento"
                  className="inline-flex h-12 items-center justify-center gap-2 bg-[#d7b15d] px-6 text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] transition-transform hover:-translate-y-0.5 hover:bg-[#efcf82]"
                >
                  Solicitar operação
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#estrutura"
                  className="inline-flex h-12 items-center justify-center border border-white/20 px-6 text-[12px] font-black uppercase tracking-[0.13em] text-white/86 transition-colors hover:border-[#d7b15d]/70 hover:text-[#d7b15d]"
                >
                  Ver estrutura
                </Link>
              </div>
            </div>

            <div className="mt-14 grid max-w-4xl gap-px border border-white/10 bg-white/10 md:grid-cols-3">
              {[
                ['Operação', 'Cargas completas e fracionadas'],
                ['Controle', 'Acompanhamento de ponta a ponta'],
                ['Estrutura', 'Pátio, doca e movimentação'],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#090b0c]/76 p-5 backdrop-blur">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#d7b15d]">{label}</span>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/82">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="servicos" className="bg-[#f4f1eb] px-5 py-18 text-[#111311] md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h2 className="font-heading text-3xl font-black uppercase leading-tight md:text-5xl">Serviços com padrão RBA</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">
                  Uma operação enxuta, fiscalizável e preparada para o transporte real: veículo, equipe, pátio e documentação trabalhando juntos.
                </p>
              </div>
              <Link href="/servicos" className="inline-flex w-fit items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-[#8b6725]">
                Ver todos os serviços
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {serviceCards.map(({ title, description, icon: Icon }) => (
                <article key={title} className="border border-black/10 bg-white p-7 shadow-[0_18px_45px_rgba(0,0,0,0.07)]">
                  <div className="flex h-12 w-12 items-center justify-center bg-[#101312] text-[#d7b15d]">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-6 text-xl font-black uppercase leading-tight">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-black/60">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="estrutura" className="bg-[#090b0c] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="relative min-h-[420px] overflow-hidden bg-[#141719] md:min-h-[560px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/rba-home/container-operation.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            </div>

            <div className="md:pl-8">
              <h2 className="font-heading text-3xl font-black uppercase leading-tight text-white md:text-5xl">
                Estrutura pronta para carga, descarga e distribuição.
              </h2>
              <p className="mt-6 text-sm leading-8 text-white/66 md:text-base">
                O diferencial está na execução: pátio organizado, equipamento de movimentação, veículos identificados e equipe conectada ao cliente.
              </p>

              <div className="mt-8 grid gap-4">
                {proofItems.map((item) => (
                  <div key={item} className="flex items-start gap-3 border-b border-white/10 pb-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d7b15d]" strokeWidth={1.6} />
                    <span className="text-sm font-semibold leading-6 text-white/82">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-9 grid grid-cols-3 border border-white/10">
                {[
                  ['24h', 'rotina de suporte'],
                  ['100%', 'operação rastreável'],
                  ['SP', 'base operacional'],
                ].map(([number, label]) => (
                  <div key={number} className="border-r border-white/10 p-4 last:border-r-0">
                    <strong className="block text-2xl font-black text-[#d7b15d]">{number}</strong>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="operacao" className="bg-[#111514] px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {galleryItems.map((item) => (
                <figure key={item.title} className="group overflow-hidden bg-black">
                  <div
                    className="h-80 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <figcaption className="border-t border-white/10 bg-[#090b0c] p-5">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#d7b15d]">{item.title}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-black px-5 py-16 md:px-8 md:py-20">
          <div
            className="absolute inset-y-0 right-0 hidden w-1/2 bg-cover bg-center opacity-55 md:block"
            style={{ backgroundImage: "url('/rba-home/facility-front.webp')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/45" />
          <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading max-w-xl text-3xl font-black uppercase leading-tight text-white md:text-5xl">
                Precisa de uma operação sob medida?
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/64">
                Fale com a equipe RBA para alinhar coleta, rota, descarga, armazenagem e nível de acompanhamento esperado.
              </p>
            </div>
            <Link
              href="/orcamento"
              className="inline-flex h-12 w-fit items-center justify-center gap-2 bg-[#d7b15d] px-6 text-[12px] font-black uppercase tracking-[0.13em] text-[#10110f] hover:bg-[#efcf82]"
            >
              Iniciar atendimento
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer id="contato" className="bg-[#0d1011] px-5 py-10 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/10 pb-8 md:grid-cols-[1.2fr_0.8fr_1fr_1fr]">
          <div>
            <RBALogo className="h-20 w-36 drop-shadow-[0_2px_1px_rgba(255,255,255,0.35)]" />
            <p className="mt-5 max-w-xs text-xs leading-7 text-white/55">
              Transporte e logística com estrutura operacional para cargas rodoviárias, armazenagem e apoio em pátio.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white">Navegação</h3>
            <div className="mt-5 grid gap-3 text-xs text-white/58">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href} className="transition-colors hover:text-[#d7b15d]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white">Contato</h3>
            <div className="mt-5 grid gap-4 text-xs text-white/64">
              <span className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#d7b15d]" />
                (91) 262 9559
              </span>
              <span className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#d7b15d]" />
                rba@transporte.com.br
              </span>
              <span className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#d7b15d]" />
                RBA Transporte & Logística
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white">Operação</h3>
            <div className="mt-5 grid gap-3 text-xs text-white/58">
              <span className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#d7b15d]" />
                Segurança operacional
              </span>
              <span className="flex items-center gap-3">
                <Clock3 className="h-4 w-4 text-[#d7b15d]" />
                Atendimento contínuo
              </span>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-7xl text-center text-[11px] text-white/40">
          © 2024 RBA Transporte & Logística. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
