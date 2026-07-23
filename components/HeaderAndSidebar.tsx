'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import RBALogo from '@/components/RBALogo';
import {
  BarChart3,
  DollarSign,
  Eye,
  FileText,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Truck,
  UserSquare2,
  Users,
  X,
} from 'lucide-react';

interface UserSession {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

type UserRole = 'Administrador' | 'Operacional' | 'Financeiro' | 'Consulta/Auditoria';

const navItems: Array<{
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}> = [
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3, roles: ['Administrador', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Ordens de Frete', path: '/ordens', icon: FileText, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Motoristas', path: '/motoristas', icon: Users, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Veículos', path: '/veiculos', icon: Truck, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Clientes', path: '/clientes', icon: UserSquare2, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Financeiro', path: '/financeiro', icon: DollarSign, roles: ['Administrador', 'Financeiro'] },
  { name: 'Relatórios', path: '/relatorios', icon: BarChart3, roles: ['Administrador', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['Administrador', 'Consulta/Auditoria'] },
  { name: 'Usuários', path: '/usuarios', icon: ShieldCheck, roles: ['Administrador'] },
] as const;

export default function HeaderAndSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerError, setHeaderError] = useState('');


  useEffect(() => {
    let cancelled = false;

    async function refreshUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.status === 401) {
          router.replace('/login');
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setCurrentUser(data?.user || null);
          setHeaderError(data?.user ? '' : 'Sessão inválida.');
        }
      } catch {
        if (!cancelled) setHeaderError('Erro ao carregar sessão.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    refreshUser();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  const filteredNavItems = currentUser ? navItems.filter((item) => item.roles.includes(currentUser.role)) : [];
  const homePath = currentUser?.role === 'Operacional' ? '/ordens' : '/dashboard';

  const navLink = (item: (typeof navItems)[number], onClick?: () => void) => {
    const active = pathname === item.path || pathname?.startsWith(`${item.path}/`);
    const Icon = item.icon;

    return (
      <Link
        id={`nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
        key={item.name}
        href={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-extrabold transition ${
          active
            ? 'border-amber-500/30 bg-amber-500/10 text-[#d8b45d]'
            : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <div id="rba-app-root" className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-amber-500/30 selection:text-slate-955">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-xs print:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-2 md:px-8">
          <div className="flex min-w-0 items-center gap-3 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            {loading ? (
              <span className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
            ) : (
              <>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-black uppercase tracking-[0.08em] text-[#8a6725]">
                  {currentUser?.role || 'Sem sessão'}
                </span>
                <span className="hidden max-w-[260px] truncate font-bold text-slate-600 md:inline">{currentUser?.name}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 transition hover:border-rose-200 hover:text-rose-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
        {headerError && (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-[11px] font-bold text-red-700">{headerError}</div>
        )}
      </div>

      <div className="flex min-h-[calc(100vh-49px)]">
        <aside id="desktop-sidebar" className="sticky top-[49px] hidden h-[calc(100vh-49px)] w-72 shrink-0 flex-col border-r border-slate-800 bg-[#0B0F19] md:flex print:hidden">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href={homePath} aria-label="Início RBA">
              <RBALogo className="h-24 w-44" />
            </Link>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-450">Central operacional</p>
              <p className="mt-1 text-sm font-black text-white">RBA Fretes Digital</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {filteredNavItems.map((item) => navLink(item))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="truncate text-sm font-bold text-white">{currentUser?.name || 'Usuário'}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#d8b45d]">{currentUser?.role || 'Sem sessão'}</p>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex h-full w-80 max-w-[85vw] flex-col border-r border-white/10 bg-[#0B0F19] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <RBALogo className="h-16 w-32" />
                <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {filteredNavItems.map((item) => navLink(item, () => setSidebarOpen(false)))}
              </nav>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden print:hidden">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <RBALogo className="h-12 w-24" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8b45d] text-xs font-bold text-slate-955">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 overflow-y-auto px-4 py-6 pb-16 md:px-8 md:py-8 print:p-0 print:max-w-none">
            {currentUser?.role === 'Consulta/Auditoria' && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <Eye className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span>Perfil de consulta: dados sensíveis são mascarados e ações de escrita ficam bloqueadas.</span>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
