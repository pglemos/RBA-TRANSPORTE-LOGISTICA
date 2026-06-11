'use client';

import React, { useState, useEffect } from 'react';
import HeaderAndSidebar from '@/components/HeaderAndSidebar';
import { ShieldAlert, Users, Shield, Lock, Eye, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export default function ProfilesPage() {
  const [activeUser, setActiveUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadActiveUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setActiveUser(data?.user || null);
      }
    } catch (e) {
      setErrorMsg("Erro ao carregar usuário ativo.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveUser();
    }, 0);
    window.addEventListener('rba-auth-switch', loadActiveUser);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('rba-auth-switch', loadActiveUser);
    };
  }, []);

  const handleSwitchRole = async (userId: string, name: string, email: string, role: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, email, role })
      });
      const data = await res.json();
      if (data && data.success) {
        // Dispatch custom global event to refresh all active visual components immediately
        window.dispatchEvent(new Event('rba-auth-switch'));
      }
    } catch (e) {
      setErrorMsg("Erro ao alternar perfil.");
    }
  };

  const usersList = [
    {
      id: 'user_admin',
      name: 'Morgan Ribeiro',
      email: 'admin@rba.com',
      role: 'Administrador',
      desc: 'Controle irrestrito sobre o sistema. Visualiza dados sensíveis sem máscara e edita/exclui fichas e adiantamentos.',
      permissions: ['Acesso Total', 'Desconfigurar Máscara LGPD', 'Cadastrar Motoristas', 'Cadastrar Veículos', 'Visualizar Auditoria', 'Excluir Lançamentos']
    },
    {
      id: 'user_operacional',
      name: 'Ana Costa',
      email: 'operacional@rba.com',
      role: 'Operacional',
      desc: 'Operador de pátio focado em cadastros e lançamentos. Não visualiza dados sensíveis unmasked, nem exclui faturamentos.',
      permissions: ['Emitir Novas Ordens', 'Cadastrar Motoristas', 'Cadastrar Veículos', 'NÃO Visualiza Informações de Banco Sem Máscaras', 'NÃO Exclui Registros']
    },
    {
      id: 'user_financeiro',
      name: 'Bruno Silva',
      email: 'financeiro@rba.com',
      role: 'Financeiro',
      desc: 'Gestor de faturamento e fluxo de adiantamento e Pix. Possui acesso para desconfigurar máscaras de banco para realizar transferências.',
      permissions: ['Desconfigurar Máscara LGPD', 'Aprovar Pagamentos', 'Alterar Status de Liquidações', 'NÃO Exclui Ordens de Frete']
    },
    {
      id: 'user_auditor',
      name: 'Carlos Santos',
      email: 'auditor@rba.com',
      role: 'Consulta/Auditoria',
      desc: 'Perfil auditor voltado a conferências fiscais e logs jurídicos de auditorias.',
      permissions: ['Visualizar Console de Auditorias Log', 'Filtros Analíticos de Relatório', 'Dados Sensíveis Mascarados', 'Sem permissão de Edição/Exclusão']
    }
  ];

  return (
    <HeaderAndSidebar>
      <div className="space-y-6">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
            {errorMsg}
          </div>
        )}
        
        {/* Header section */}
        <div className="bg-white border p-6 rounded-3xl border-slate-200">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Equipe & Matriz de Níveis de Permissão (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-1">Veja quais operadores possuem acesso para desmascarar dados bancários e de CPF sob as diretivas da LGPD.</p>
        </div>

        {/* Current user summary badge */}
        {activeUser && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-yellow-700 font-extrabold uppercase block tracking-wider">Perfil Autenticado Ativo na Sessão</span>
              <p className="text-xs font-black text-slate-900 mt-0.5">{activeUser.name} ({activeUser.email})</p>
            </div>
            <div>
              <span className="p-1 px-3 bg-yellow-500 text-black text-xs font-bold rounded-xl shadow-xs">
                Perfil: {activeUser.role}
              </span>
            </div>
          </div>
        )}

        {/* Main Grid matching layout list cards with detailed capabilities highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {usersList.map((usr) => (
            <div 
              key={usr.id} 
              className={`bg-white border rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden transition-all ${
                activeUser?.email === usr.email ? 'border-yellow-500 ring-2 ring-yellow-500/10 bg-yellow-500/5' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">{usr.name}</h3>
                  <code className="text-[10px] text-slate-450 font-mono mt-0.5 block">{usr.email}</code>
                </div>
                <span className={`p-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  usr.role === 'Administrador' ? 'bg-indigo-100 text-indigo-800' :
                  usr.role === 'Financeiro' ? 'bg-emerald-100 text-emerald-800' :
                  usr.role === 'Operacional' ? 'bg-yellow-101 bg-yellow-100 text-yellow-850' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {usr.role}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-normal">{usr.desc}</p>

              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-widest mb-1">Capacidade Operacional</span>
                <div className="flex flex-wrap gap-1.5 min-h-0">
                  {usr.permissions.map((p, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md ${
                        p.startsWith('NÃO') ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {activeUser?.email !== usr.email ? (
                <button
                  type="button"
                  onClick={() => handleSwitchRole(usr.id, usr.name, usr.email, usr.role)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase cursor-pointer text-center block mt-2"
                >
                  Experimentar este Perfil
                </button>
              ) : (
                <div className="w-full py-2 bg-yellow-500 text-black rounded-xl text-xs font-black uppercase text-center block mt-2 cursor-default select-none flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Perfil Ativo
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </HeaderAndSidebar>
  );
}
