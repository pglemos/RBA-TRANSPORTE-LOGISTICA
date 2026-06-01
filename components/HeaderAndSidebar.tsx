'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Truck, 
  FileText, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  BarChart3, 
  Settings, 
  UserSquare2, 
  Eye, 
  LogOut, 
  CheckCircle2, 
  X, 
  Menu,
  ChevronRight,
  Sparkles,
  Zap,
  Lock
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
  { id: 'user_auditor', name: 'Carlos Santos (Auditor)', email: 'auditor@rba.com', role: 'Consulta/Auditoria' }
];

export default function HeaderAndSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simulatorExpanded, setSimulatorExpanded] = useState(true);

  // Fetch current user details on mount
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data && data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshUser();
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle switching simulated profile
  const switchSimulatedProfile = async (profile: typeof defaultProfiles[0]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setCurrentUser(data.user);
        
        // Stagger visual update
        setTimeout(() => {
          router.refresh();
          // Trigger force event for client states to reload
          window.dispatchEvent(new Event('rba-auth-switch'));
        }, 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Ordens de Frete', path: '/ordens', icon: FileText, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Motoristas', path: '/motoristas', icon: Users, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Veículos', path: '/veiculos', icon: Truck, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Clientes', path: '/clientes', icon: UserSquare2, roles: ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Controle Financeiro', path: '/financeiro', icon: DollarSign, roles: ['Administrador', 'Financeiro'] },
    { name: 'Relatórios Consolidados', path: '/relatorios', icon: BarChart3, roles: ['Administrador', 'Financeiro', 'Consulta/Auditoria'] },
    { name: 'Configurações & Auditoria', path: '/configuracoes', icon: Settings, roles: ['Administrador', 'Consulta/Auditoria'] },
    { name: 'Usuários & Perfis', path: '/usuarios', icon: ShieldCheck, roles: ['Administrador'] }
  ];

  const filteredNavItems = navItems.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <div id="rba-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* 1. TOP SIMULATOR OVERLAY */}
      <div id="role-simulator" className="bg-slate-900 text-slate-200 border-b border-yellow-500/30 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            <strong className="text-yellow-400 font-bold tracking-wider uppercase">SIMULADOR DE PERFIS (RBAC & LGPD)</strong>
            <span className="text-slate-400">| Perfil Ativo:</span>
            {loading ? (
              <span className="h-4 w-12 bg-slate-700 rounded animate-pulse" />
            ) : (
              <span className="bg-yellow-500/20 text-yellow-300 font-semibold px-2 py-0.5 rounded border border-yellow-500/30">
                {currentUser?.role || 'Consulta/Auditoria'}
              </span>
            )}
            <span className="text-slate-400 font-mono text-[10px] hidden lg:inline">
              ({currentUser?.name})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 hidden sm:inline">Trocar perfil rápido:</span>
            {defaultProfiles.map((p) => {
              const active = currentUser?.role === p.role;
              return (
                <button
                  id={`btn-sim-${p.role.replace('/', '-')}`}
                  key={p.role}
                  onClick={() => switchSimulatedProfile(p)}
                  disabled={loading}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer font-medium select-none text-[10px] flex items-center gap-1 ${
                    active 
                      ? 'bg-yellow-500 text-black shadow-md border-yellow-400 font-semibold scale-105' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
                  }`}
                >
                  {p.role === 'Administrador' && <ShieldCheck className="h-3 w-3" />}
                  {p.role === 'Operacional' && <Zap className="h-3 w-3" />}
                  {p.role === 'Financeiro' && <DollarSign className="h-3 w-3" />}
                  {p.role === 'Consulta/Auditoria' && <Eye className="h-3 w-3" />}
                  {p.role.split('/')[0]}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Compliance message info */}
        <div className="bg-amber-500/10 border-t border-amber-500/10 text-[10px] py-1 text-center text-amber-400/90 hidden lg:block">
          💡 <strong>Regras da LGPD ativas:</strong> CPFs e contas bancárias são mascarados (com asteriscos) em listas para o perfil <strong>Auditoria</strong>. Dados financeiros sensíveis são bloqueados para o perfil <strong>Operacional</strong>.
        </div>
      </div>

      {/* 2. MAIN CONTAINER LAYOUT */}
      <div className="flex flex-1 relative">
        
        {/* SIDEBAR FOR DESKTOP */}
        <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-850 shrink-0 sticky top-0 h-[calc(100vh-68px)]">
          
          {/* Company Branding logo header */}
          <div className="p-6 border-b border-slate-850 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-extrabold shadow-lg">
                RBA
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-wider block">RBA FRETES</span>
                <span className="text-[10px] text-slate-450 uppercase font-semibold">Transporte & Logística</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const active = pathname === item.path || pathname?.startsWith(item.path + '/');
              const Icon = item.icon;
              return (
                <Link
                  id={`sidebar-link-${item.name.toLowerCase().replace(/ /g, '-')}`}
                  key={item.name}
                  href={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group ${
                    active 
                      ? 'bg-yellow-500 text-slate-950 shadow-md translate-x-1 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-slate-950' : 'text-slate-450 group-hover:text-yellow-400 transition-colors'}`} />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'text-slate-950' : 'text-slate-500'}`} />
                </Link>
              );
            })}
          </nav>

          {/* Footer User Widget */}
          <div className="p-4 border-t border-slate-850 bg-slate-950/20">
            <div className="flex items-center justify-between gap-2 bg-slate-850/50 p-3 rounded-lg border border-slate-800">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{currentUser?.name || "Visitante"}</p>
                <span className="text-[9px] text-yellow-400/90 font-mono tracking-wider uppercase bg-yellow-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                  {currentUser?.role || "Consulta"}
                </span>
              </div>
              <Link href="/login" title="Sair da sessão" className="p-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs">
                <LogOut className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="text-[8px] text-center text-slate-500 mt-3 font-mono">
              RBA Fretes Digital v1.0.0
            </div>
          </div>
        </aside>

        {/* MOBILE SIDEBAR MODAL */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden flex" onClick={() => setSidebarOpen(false)}>
            <div className="w-64 bg-slate-900 h-full flex flex-col outline-none" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white text-md">RBA</span>
                  <span className="text-xs text-slate-400">Fretes Digital</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {filteredNavItems.map((item) => {
                  const active = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      id={`mobile-link-${item.name.toLowerCase().replace(/ /g, '-')}`}
                      key={item.name}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold ${
                        active ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-850 bg-slate-950/20">
                <span className="text-xs font-bold text-white block truncate">{currentUser?.name}</span>
                <span className="text-[10px] text-yellow-400 font-mono block mt-0.5">{currentUser?.role}</span>
                <Link href="/login" className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded flex items-center justify-center gap-2">
                  <LogOut className="h-3.5 w-3.5" />
                  Sair do Sistema
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY WINDOW */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Mobile Top Header NavBar */}
          <header className="md:hidden bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between z-10 shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900 cursor-pointer">
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-sm font-black tracking-wider text-slate-900">
              RBA FRETES
            </div>
            <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-16">
            
            {/* Dynamic system alert for read-only simulation */}
            {currentUser?.role === 'Consulta/Auditoria' && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-center gap-2.5 text-xs">
                <Eye className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Aviso de Auditoria:</strong> Você está visualizando o RBA Fretes Digital em modo <strong>Leitura / Consulta</strong>. Todas as operações de edição, cadastro de ordens, financeiro ou exclusão de dados estão desativadas por segurança (RBAC). Dados sensíveis como CPF, RG e Chaves Pix estão mascarados em conformidade com a LGPD.
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
