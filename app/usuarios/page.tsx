'use client';

import React, { useEffect, useMemo, useState } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { CheckCircle2, RefreshCw, Save, ShieldCheck, UserPlus } from 'lucide-react';
import type { Profile } from '@/lib/db';

const ROLE_OPTIONS: Profile['role'][] = ['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria'];

const roleDescriptions: Record<Profile['role'], { desc: string; permissions: string[] }> = {
  Administrador: {
    desc: 'Gestão completa do sistema, usuários, cadastros, ordens, financeiro e auditoria.',
    permissions: ['Gerenciar usuários', 'Excluir registros', 'Ver dados sensíveis', 'Alterar configurações'],
  },
  Operacional: {
    desc: 'Operação de fretes, cadastros de base, anexos e avanço do fluxo logístico.',
    permissions: ['Criar ordens', 'Editar operação', 'Cadastrar motoristas', 'Sem alteração financeira'],
  },
  Financeiro: {
    desc: 'Faturamento, pagamentos, adiantamentos, saldo, conferência financeira e margens.',
    permissions: ['Editar financeiro', 'Ver dados bancários', 'Baixar comprovantes', 'Sem gerenciar usuários'],
  },
  'Consulta/Auditoria': {
    desc: 'Perfil de leitura para conferência, auditoria e acompanhamento com dados sensíveis mascarados.',
    permissions: ['Somente leitura', 'Auditoria', 'Dados mascarados', 'Sem escrita'],
  },
};

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'Operacional' as Profile['role'],
  active: true,
};

export default function ProfilesPage() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const groupedProfiles = useMemo(() => {
    return ROLE_OPTIONS.map((role) => ({
      role,
      profiles: profiles.filter((profile) => profile.role === role),
      ...roleDescriptions[role],
    }));
  }, [profiles]);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMsg('');
      const sessionRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const sessionData = await sessionRes.json();
      setActiveUser(sessionData?.user || null);

      if (sessionData?.user?.role !== 'Administrador') return;

      const profilesRes = await fetch('/api/profiles', { cache: 'no-store' });
      const profilesData = await profilesRes.json();
      if (!profilesRes.ok) throw new Error(profilesData?.error || 'Erro ao carregar perfis.');
      setProfiles(Array.isArray(profilesData) ? profilesData : []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao criar perfil.');
      setForm(initialForm);
      setMsg('Perfil criado com login inicial.');
      await loadData();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao criar perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(profile: Profile, changes: Partial<Pick<Profile, 'role' | 'active'>>) {
    setSaving(true);
    setMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          role: changes.role ?? profile.role,
          active: changes.active ?? profile.active,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao atualizar perfil.');
      setProfiles((current) => current.map((item) => (item.id === profile.id ? data.profile : item)));
      setMsg('Perfil atualizado.');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-6 w-6 text-[#8a6725]" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">Equipe & Matriz de Permissões</h1>
                <p className="mt-1 text-xs text-slate-500">Perfis são vinculados ao login autenticado no Supabase.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {errorMsg}
          </div>
        )}

        {msg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
            {msg}
          </div>
        )}

        {activeUser && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 md:flex-row md:items-center">
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-yellow-700">Perfil autenticado</span>
              <p className="mt-0.5 text-xs font-black text-slate-900">{activeUser.name} ({activeUser.email})</p>
            </div>
            <span className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-bold text-black">Perfil: {activeUser.role}</span>
          </div>
        )}

        {activeUser?.role === 'Administrador' && (
          <form onSubmit={handleCreate} className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-slate-700" />
              <h2 className="text-sm font-black text-slate-900">Criar perfil de acesso</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-yellow-500"
                placeholder="Nome do usuário"
                required
              />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-yellow-500"
                placeholder="email@empresa.com"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-yellow-500"
                placeholder="Senha inicial"
                minLength={6}
                required
              />
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Profile['role'] }))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold outline-none focus:border-yellow-500"
              >
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:bg-yellow-400 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Criar
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {groupedProfiles.map((group) => (
            <div
              key={group.role}
              className={`space-y-4 rounded-lg border bg-white p-6 shadow-sm ${
                activeUser?.role === group.role ? 'border-yellow-500 bg-yellow-500/5 ring-2 ring-yellow-500/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{group.role}</h3>
                  <p className="mt-1 text-xs leading-normal text-slate-500">{group.desc}</p>
                </div>
                {activeUser?.role === group.role && <CheckCircle2 className="h-5 w-5 shrink-0 text-yellow-600" />}
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                {group.permissions.map((permission) => (
                  <span key={permission} className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                    {permission}
                  </span>
                ))}
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {loading ? (
                  <p className="text-xs font-bold text-slate-400">Carregando perfis...</p>
                ) : group.profiles.length === 0 ? (
                  <p className="text-xs font-bold text-slate-400">Nenhum usuário neste perfil.</p>
                ) : group.profiles.map((profile) => (
                  <div key={profile.id} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <p className="text-xs font-black text-slate-900">{profile.name}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{profile.email}</p>
                    </div>
                    <select
                      value={profile.role}
                      onChange={(event) => handleUpdate(profile, { role: event.target.value as Profile['role'] })}
                      disabled={activeUser?.role !== 'Administrador' || saving}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 outline-none"
                    >
                      {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={profile.active}
                        onChange={(event) => handleUpdate(profile, { active: event.target.checked })}
                        disabled={activeUser?.role !== 'Administrador' || saving}
                        className="h-4 w-4 accent-yellow-500"
                      />
                      Ativo
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </HeaderAndSidebar>
  );
}
