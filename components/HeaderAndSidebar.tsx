'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import RBALogo from '@/components/RBALogo';
import {
  BarChart3,
  ChevronRight,
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
  Zap,
} from 'lucide-react';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Operacional' | 'Financeiro' | 'Consulta/Auditoria';
  active: boolean;
}

const defaultProfiles = [
  { id: 'user_admin', name: 'Morgan Ribeiro (Admin)', email: 'admin@rba.com', role: 'Administrador' },
  { id: 'user_operacional', name: 'Ana Costa (Operacional)', email: 'operacional@rba.com', role: 'Operacional' },
  { id: 'user_financeiro', name: 'Bruno Silva (Financeiro)', email: 'financeiro@rba.com', role: 'Financeiro' },
  { id: 'user_auditor', name: 'Carlos Santos (Auditor)', email: 'auditor@rba.com', role: 'Consulta/Auditoria' },
] as const;

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: BarChart3, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Ordens de Frete', path: '/ordens', icon: FileText, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Motoristas', path: '/motoristas', icon: Users, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Veículos', path: '/veiculos', icon: Truck, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Clientes', path: '/clientes', icon: UserSquare2, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Financeiro', path: '/financeiro', icon: DollarSign, roles: ['Administrador', 'Financeiro'] },
  { name: 'Relatórios', path: '/relatorios', icon: BarChart3, roles: ['Administrador', 'Financeiro', 'Consulta/Auditoria'] },
  { name: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['Administrador', 'Consulta/Auditoria'] },
  { name: 'Usuários', path: '/usuarios', icon: ShieldCheck, roles: ['Administrador'] },
];

export default function HeaderAndSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerError, setHeaderError] = useState('');

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data?.user) setCurrentUser(data.user);
    } catch (e) {
      setHeaderError('Erro ao carregar sessão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(refreshUser, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const switchSimulatedProfile = async (profile: (typeof defaultProfiles)[number]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data?.success) {
        setHeaderError('');
        setCurrentUser(data.user);
        setTimeout(() => {
          router.refresh();
          window.dispatchEvent(new Event('rba-auth-switch'));
        }, 100);
      }
    } catch (e) {
      setHeaderError('Erro ao alternar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNavItems = navItems.filter((item) => !currentUser || item.roles.includes(currentUser.role));

  return (
    <div id="rba-app-root" className="min-h-screen bg-[oklch(96.5%_0.01_83)] text-slate-900 antialiased selection:bg-[oklch(76%_0.13_82)] selection:text-slate-950">
      <div id="role-simulator" className="sticky top-0 z-50 border-b border-slate-200 bg-[oklch(98%_0.006_83)] shadow-sm">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px]">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            <strong className="font-black uppercase tracking-[0.18em] text-slate-900">RBAC & LGPD</strong>
            <span className="text-slate-500">Perfil ativo</span>
            {loading ? (
              <span className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
            ) : (
              <span className="rounded-full border border-[#d8b45d]/40 bg-[#fff7df] px-3 py-1 font-black uppercase tracking-[0.08em] text-[#8a6725]">
                {currentUser?.role || 'Consulta/Auditoria'}
              </span>
            )}
            <span className="hidden max-w-[220px] truncate font-semibold text-slate-500 lg:inline">{currentUser?.name}</span>
            {headerError && <span className="font-bold text-red-600">{headerError}</span>}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {defaultProfiles.map((profile) => {
              const active = currentUser?.role === profile.role;
              return (
                <button
                  id={`btn-sim-${profile.role.replace('/', '-')}`}
                  key={profile.role}
                  onClick={() => switchSimulatedProfile(profile)}
                  disabled={loading}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition ${
                    active
                      ? 'border-[#d8b45d] bg-[#d8b45d] text-slate-950 shadow-sm'
                      : 'border-slate-200 bg-[oklch(98.5%_0.006_83)] text-slate-500 hover:border-slate-300 hover:bg-[oklch(96.8%_0.01_83)] hover:text-slate-900'
                  }`}
                >
                  {profile.role === 'Administrador' && <ShieldCheck className="h-3.5 w-3.5" />}
                  {profile.role === 'Operacional' && <Zap className="h-3.5 w-3.5" />}
                  {profile.role === 'Financeiro' && <DollarSign className="h-3.5 w-3.5" />}
                  {profile.role === 'Consulta/Auditoria' && <Eye className="h-3.5 w-3.5" />}
                  {profile.role.split('/')[0]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hidden border-t border-slate-100 bg-slate-50 px-4 py-1.5 text-center text-[10px] font-semibold text-slate-500 lg:block">
          Regras de acesso ativas: dados sensíveis podem ser mascarados conforme o perfil selecionado.
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-43px)]">
        <aside id="desktop-sidebar" className="sticky top-[43px] hidden h-[calc(100vh-43px)] w-72 shrink-0 flex-col border-r border-slate-200 bg-[oklch(98.5%_0.006_83)] md:flex">
          <div className="border-b border-slate-100 px-6 py-6">
            <Link href="/dashboard" aria-label="Dashboard RBA">
              <RBALogo className="h-24 w-44" />
            </Link>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Central operacional</p>
              <p className="mt-1 text-sm font-black text-slate-900">RBA Fretes Digital</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {filteredNavItems.map((item) => {
              const active = pathname === item.path || pathname?.startsWith(item.path + '/');
              const Icon = item.icon;
              return (
                <Link
                  id={`sidebar-link-${item.name.toLowerCase().replace(/ /g, '-')}`}
                  key={item.name}
                  href={item.path}
                  className={`group flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-extrabold transition ${
                    active
                      ? 'border-[#d8b45d]/50 bg-[#fff7df] text-slate-950 shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-[#d8b45d] text-slate-950' : 'bg-slate-100 text-slate-500 group-hover:bg-[oklch(98.5%_0.006_83)]'}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="font-extrabold">{item.name}</span>
                  </span>
                  <ChevronRight className={`h-4 w-4 ${active ? 'text-[#8a6725]' : 'text-slate-300'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="truncate text-sm font-black text-slate-900">{currentUser?.name || 'Visitante'}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8a6725]">{currentUser?.role || 'Consulta'}</p>
              <Link href="/login" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-[oklch(98.5%_0.006_83)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-slate-600 transition hover:border-rose-200 hover:text-rose-600">
                <LogOut className="h-4 w-4" />
                Sair
              </Link>
            </div>
            <p className="mt-4 text-center text-[10px] font-semibold text-slate-400">RBA Fretes Digital v1.0.0</p>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex bg-slate-950/45 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="flex h-full w-72 flex-col bg-[oklch(98.5%_0.006_83)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <RBALogo className="h-16 w-32" />
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg border border-slate-200 p-2 text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {filteredNavItems.map((item) => {
                  const active = pathname === item.path || pathname?.startsWith(item.path + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      id={`mobile-link-${item.name.toLowerCase().replace(/ /g, '-')}`}
                      key={item.name}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-extrabold ${
                        active ? 'border-[#d8b45d]/50 bg-[#fff7df] text-slate-950' : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-[oklch(98.5%_0.006_83)] px-4 md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-slate-200 p-2 text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <RBALogo className="h-12 w-24" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8b45d] text-xs font-black text-slate-950">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] flex-1 overflow-y-auto px-4 py-6 pb-16 md:px-8 md:py-8">
            {currentUser?.role === 'Consulta/Auditoria' && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <Eye className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <span>
                  <strong>Aviso de auditoria:</strong> você está em modo leitura. Operações de edição, cadastro, financeiro e exclusão ficam restritas conforme RBAC e LGPD.
                </span>
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
