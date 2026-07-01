'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, Eye, EyeOff } from 'lucide-react';
import RBALogo from '@/components/RBALogo';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase não está configurado neste ambiente.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Preencha e-mail e senha para autenticar.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        setErrorMsg('Credenciais inválidas ou usuário sem acesso ativo.');
        return;
      }

      const sessionRes = await fetch('/api/auth/me', { cache: 'no-store' });
      const sessionData = await sessionRes.json();
      const destination = sessionData?.user?.role === 'Operacional' ? '/ordens' : '/dashboard';

      router.replace(destination);
      router.refresh();
    } catch {
      setErrorMsg('Falha ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070913] p-6 font-sans text-slate-100 selection:bg-amber-500 selection:text-black">
      <div className="pointer-events-none absolute inset-0 bg-[url('/rba-home/container-operation.webp')] bg-cover bg-center opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(7,9,19,0.96),rgba(7,9,19,0.82),rgba(15,23,42,0.94))]" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <RBALogo className="mx-auto h-28 w-48 drop-shadow-[0_2px_1px_rgba(255,255,255,0.38)]" />
          <h2 className="heading-font mt-4 text-xl font-black uppercase tracking-wider text-white">RBA Fretes Digital</h2>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Acesso operacional seguro</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 rounded-xl border border-slate-900 bg-slate-950/88 p-6 shadow-2xl">
          <span className="block text-center text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Acesso restrito</span>

          {errorMsg && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-xs font-semibold text-red-300">
              {errorMsg}
            </div>
          )}

          <label className="block space-y-2">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">E-mail</span>
            <span className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-950/80 px-4 py-3 focus-within:border-amber-500/40">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                id="ip-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-slate-650"
                placeholder="usuario@empresa.com"
              />
            </span>
          </label>

          <label className="block space-y-2">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Senha</span>
            <span className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-950/80 px-4 py-3 focus-within:border-amber-500/40">
              <LockKeyhole className="h-4 w-4 text-slate-500" />
              <input
                id="ip-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-slate-650"
                placeholder="Senha cadastrada"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-white transition focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition hover:from-amber-400 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Autenticando...' : 'Entrar no sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
