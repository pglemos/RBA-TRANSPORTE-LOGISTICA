'use client';

import React, { useEffect, useState } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

const usersList = [
  {
    name: 'Administrador',
    role: 'Administrador',
    desc: 'Gestão completa do sistema, usuários, cadastros, ordens, financeiro e auditoria.',
    permissions: ['Gerenciar usuários', 'Excluir registros', 'Ver dados sensíveis', 'Alterar configurações'],
  },
  {
    name: 'Operacional',
    role: 'Operacional',
    desc: 'Operação de fretes, cadastros de base, anexos e avanço do fluxo logístico.',
    permissions: ['Criar ordens', 'Editar operação', 'Cadastrar motoristas', 'Sem alteração financeira'],
  },
  {
    name: 'Financeiro',
    role: 'Financeiro',
    desc: 'Faturamento, pagamentos, adiantamentos, saldo, conferência financeira e margens.',
    permissions: ['Editar financeiro', 'Ver dados bancários', 'Baixar comprovantes', 'Sem gerenciar usuários'],
  },
  {
    name: 'Consulta/Auditoria',
    role: 'Consulta/Auditoria',
    desc: 'Perfil de leitura para conferência, auditoria e acompanhamento com dados sensíveis mascarados.',
    permissions: ['Somente leitura', 'Auditoria', 'Dados mascarados', 'Sem escrita'],
  },
];

export default function ProfilesPage() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadActiveUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setActiveUser(data?.user || null);
      } catch {
        if (!cancelled) setErrorMsg('Erro ao carregar usuário ativo.');
      }
    }

    loadActiveUser();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 text-[#8a6725]" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">Equipe & Matriz de Permissões</h1>
              <p className="mt-1 text-xs text-slate-500">Permissões são aplicadas pelo perfil vinculado ao usuário autenticado no Supabase.</p>
            </div>
          </div>
        </div>

        {activeUser && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 md:flex-row md:items-center">
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-yellow-700">Perfil autenticado</span>
              <p className="mt-0.5 text-xs font-black text-slate-900">{activeUser.name} ({activeUser.email})</p>
            </div>
            <span className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-bold text-black">
              Perfil: {activeUser.role}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {usersList.map((user) => (
            <div
              key={user.role}
              className={`space-y-4 rounded-lg border bg-white p-6 shadow-sm ${
                activeUser?.role === user.role ? 'border-yellow-500 bg-yellow-500/5 ring-2 ring-yellow-500/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{user.name}</h3>
                  <p className="mt-1 text-xs leading-normal text-slate-500">{user.desc}</p>
                </div>
                {activeUser?.role === user.role && <CheckCircle2 className="h-5 w-5 shrink-0 text-yellow-600" />}
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                {user.permissions.map((permission) => (
                  <span key={permission} className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </HeaderAndSidebar>
  );
}
