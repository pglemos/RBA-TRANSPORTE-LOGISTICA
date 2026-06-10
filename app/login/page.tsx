'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import RBALogo from '@/components/RBALogo';

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
    <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Decorative vector overlays */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />

      <div className="w-full max-w-md space-y-6 z-10 relative">
        
        {/* Company Header */}
        <div className="text-center">
          <RBALogo className="mx-auto h-28 w-48 drop-shadow-[0_2px_1px_rgba(255,255,255,0.38)]" />
          <h2 className="text-xl font-black tracking-wider mt-4 text-white uppercase heading-font">RBA FRETES DIGITAL</h2>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-extrabold">Controle de Riscos e Fugas de Fretes</p>
        </div>

        {/* Form Body card */}
        <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-slate-900">
          
          <span className="absolute top-0 right-0 h-10 w-28 bg-amber-500/5 border-b border-l border-slate-900 rounded-bl-3xl flex items-center justify-center text-[9px] text-amber-500 font-extrabold uppercase tracking-widest">
            Acesso Restrito
          </span>

          <form onSubmit={handleManualLogin} className="space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl text-xs font-semibold backdrop-blur-md">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 block">Endereço de E-mail *</label>
              <div className="relative">
                <input
                  id="ip-email"
                  type="email"
                  placeholder="Ex: admin@rba.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl outline-none focus:border-amber-500/30 text-white placeholder-slate-650 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 block">Senha de Acesso RBA *</label>
              <div className="relative">
                <input
                  id="ip-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950/80 border border-slate-900 rounded-xl outline-none focus:border-amber-500/30 text-white placeholder-slate-650 transition-colors"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-450 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-102 transition-all duration-300 cursor-pointer"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            </button>

          </form>

          {/* Quick preset credentials buttons for sandbox review */}
          <div className="border-t border-slate-900 mt-6 pt-6 space-y-4">
            <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" />
              Perfis de Demonstração (Clique Único):
            </span>
            <div className="grid grid-cols-2 gap-2.5 text-[10px]">
              
              <button
                id="preset-login-admin"
                type="button"
                onClick={() => handlePresetLogin('user_admin', 'Morgan Ribeiro (Admin)', 'admin@rba.com', 'Administrador')}
                className="p-3 bg-slate-950/80 border border-slate-900 hover:border-amber-500/30 rounded-xl text-left hover:text-white transition-all hover:bg-slate-900 duration-200"
              >
                <span className="font-extrabold text-white block">Administrador</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">admin@rba.com</span>
              </button>

              <button
                id="preset-login-operacional"
                type="button"
                onClick={() => handlePresetLogin('user_operacional', 'Ana Costa', 'operacional@rba.com', 'Operacional')}
                className="p-3 bg-slate-950/80 border border-slate-900 hover:border-amber-500/30 rounded-xl text-left hover:text-white transition-all hover:bg-slate-900 duration-200"
              >
                <span className="font-extrabold text-white block">Operacional</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">operacional@rba.com</span>
              </button>

              <button
                id="preset-login-financeiro"
                type="button"
                onClick={() => handlePresetLogin('user_financeiro', 'Bruno Silva', 'financeiro@rba.com', 'Financeiro')}
                className="p-3 bg-slate-950/80 border border-slate-900 hover:border-amber-500/30 rounded-xl text-left hover:text-white transition-all hover:bg-slate-900 duration-200"
              >
                <span className="font-extrabold text-white block">Financeiro</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">financeiro@rba.com</span>
              </button>

              <button
                id="preset-login-auditor"
                type="button"
                onClick={() => handlePresetLogin('user_auditor', 'Carlos Santos (Auditor)', 'auditor@rba.com', 'Consulta/Auditoria')}
                className="p-3 bg-slate-950/80 border border-slate-900 hover:border-amber-500/30 rounded-xl text-left hover:text-white transition-all hover:bg-slate-900 duration-200"
              >
                <span className="font-extrabold text-white block">Consulta/Audit</span>
                <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">auditor@rba.com</span>
              </button>

            </div>
          </div>

        </div>

        <p className="text-center text-[9px] text-slate-600 font-mono uppercase tracking-widest">
          RBA Fretes Digital • Cajamar, SP • Brasil
        </p>

      </div>
    </div>
  );
}
