'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Clock3, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import RBALogo from '@/components/RBALogo';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Parcerias', href: '/parcerias' },
  { label: 'Contato', href: '/contato' },
];

export default function PublicSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#090b0c] text-white selection:bg-[#d7b15d] selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080a0b]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center no-underline" aria-label="RBA Transporte & Logística">
            <RBALogo className="h-16 w-28 drop-shadow-[0_2px_1px_rgba(255,255,255,0.35)]" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[11px] font-black uppercase tracking-[0.18em] transition-colors hover:text-[#d7b15d] ${
                    active ? 'text-[#d7b15d]' : 'text-white/72'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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

      {children}

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
              <Link href="/orcamento" className="transition-colors hover:text-[#d7b15d]">
                Orçamento
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-white">Contato</h3>
            <div className="mt-5 grid gap-4 text-xs text-white/64">
              <span className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#d7b15d]" />
                (31) 99309-2821
              </span>
              <span className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#d7b15d]" />
                comercial@rbatransporte.com.br
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
