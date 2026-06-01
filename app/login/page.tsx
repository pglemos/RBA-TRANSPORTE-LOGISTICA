'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Truck, Lock, User, Sparkles, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg("Preencha todos os campos do formulário para autenticação.");
      return;
    }

    setLoading(true);

    try {
      // Find matching credentials
      let name = "Morgan Ribeiro (Admin)";
      let role = "Administrador";
      let id = "user_admin";

      const lowerEmail = email.toLowerCase().trim();
      if (lowerEmail === 'admin@rba.com') {
        name = "Morgan Ribeiro (Admin)";
        role = "Administrador";
        id = "user_admin";
      } else if (lowerEmail === 'operacional@rba.com') {
        name = "Ana Costa (Operacional)";
        role = "Operacional";
        id = "user_operacional";
      } else if (lowerEmail === 'financeiro@rba.com') {
        name = "Bruno Silva (Financeiro)";
        role = "Financeiro";
        id = "user_financeiro";
      } else if (lowerEmail === 'auditor@rba.com') {
        name = "Carlos Santos (Auditor)";
        role = "Consulta/Auditoria";
        id = "user_auditor";
      } else {
        setErrorMsg("Credenciais inválidas. Use os perfis recomendados abaixo!");
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, name, email: lowerEmail, role })
      });
      
      const data = await res.json();
      if (data && data.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg("Erro na gravação da sessão.");
      }
    } catch (e) {
      setErrorMsg("Falha ao comunicar com os serviços de autenticação.");
    } finally {
      setLoading(false);
    }
  };

  // Quick preset trigger login
  const handlePresetLogin = async (presetId: string, name: string, email: string, role: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: presetId, name, email, role })
      });
      
      const data = await res.json();
      if (data && data.success) {
        router.push('/dashboard');
      }
    } catch (e) {
      setErrorMsg("Assinante não carregado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 relative selection:bg-yellow-500 selection:text-black">
      
      {/* Decorative vector overlays */}
      <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-yellow-500/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-6">
        
        {/* Company Header */}
        <div className="text-center">
          <div className="h-12 w-12 bg-yellow-500 rounded-xl flex items-center justify-center my-0 mx-auto font-black text-black text-xl shadow-lg border-2 border-yellow-400">
            RBA
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-3 text-white">RBA FRETES DIGITAL</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Controle de Riscos e Fugas de Fretes</p>
        </div>

        {/* Form Body card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          
          <span className="absolute top-0 right-0 h-10 w-28 bg-yellow-500/5 border-b border-l border-yellow-500/10 rounded-bl-3xl flex items-center justify-center text-[9px] text-yellow-500 font-bold uppercase tracking-wider">
            Acesso Restrito
          </span>

          <form onSubmit={handleManualLogin} className="space-y-4">
            
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Endereço de E-mail *</label>
              <div className="relative">
                <input
                  id="ip-email"
                  type="email"
                  placeholder="Ex: admin@rba.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-yellow-500/50 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-semibold text-slate-400">Senha de Acesso RBA *</label>
              <div className="relative">
                <input
                  id="ip-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none focus:border-yellow-500/50 text-white"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-98 transition-all cursor-pointer"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>

          </form>

          {/* Quick preset credentials buttons for sandbox review */}
          <div className="border-t border-slate-850 mt-6 pt-5 space-y-3">
            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500 animate-spin" />
              Perfis de Demonstração (Clique Único):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              
              <button
                id="preset-login-admin"
                type="button"
                onClick={() => handlePresetLogin('user_admin', 'Morgan Ribeiro (Admin)', 'admin@rba.com', 'Administrador')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-yellow-500 rounded-xl text-left hover:text-white transition-colors"
              >
                <span className="font-bold text-white block">Administrador</span>
                <span className="text-slate-500 font-mono">admin@rba.com</span>
              </button>

              <button
                id="preset-login-operacional"
                type="button"
                onClick={() => handlePresetLogin('user_operacional', 'Ana Costa', 'operacional@rba.com', 'Operacional')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-yellow-500 rounded-xl text-left hover:text-white transition-colors"
              >
                <span className="font-bold text-white block">Operacional</span>
                <span className="text-slate-500 font-mono">operacional@rba.com</span>
              </button>

              <button
                id="preset-login-financeiro"
                type="button"
                onClick={() => handlePresetLogin('user_financeiro', 'Bruno Silva', 'financeiro@rba.com', 'Financeiro')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-yellow-500 rounded-xl text-left hover:text-white transition-colors"
              >
                <span className="font-bold text-white block">Financeiro</span>
                <span className="text-slate-500 font-mono">financeiro@rba.com</span>
              </button>

              <button
                id="preset-login-auditor"
                type="button"
                onClick={() => handlePresetLogin('user_auditor', 'Carlos Santos (Auditor)', 'auditor@rba.com', 'Consulta/Auditoria')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-yellow-500 rounded-xl text-left hover:text-white transition-colors"
              >
                <span className="font-bold text-white block">Consulta/Audit</span>
                <span className="text-slate-500 font-mono">auditor@rba.com</span>
              </button>

            </div>
          </div>

        </div>

        <p className="text-center text-[10px] text-slate-500 font-mono">
          RBA Fretes Digital • Cajamar, SP • Brasil
        </p>

      </div>
    </div>
  );
}
