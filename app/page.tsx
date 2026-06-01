'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, ShieldCheck, DollarSign, ArrowRight, FileCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div id="landing-root" className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-yellow-500 selection:text-black">
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-slate-900 to-slate-950 -z-10" />

      {/* Main Header navigation */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-yellow-500 rounded-lg flex items-center justify-center font-extrabold text-black hover:scale-105 transition-transform shadow-lg">
            RBA
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider block text-white/95">RBA FRETES</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Transporte & Logística</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold hover:text-yellow-400 transition-colors">
            Acessar o Painel
          </Link>
          <Link href="/login" className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-extrabold shadow-md hover:scale-102 transition-all">
            Fazer Login
          </Link>
        </div>
      </header>

      {/* Hero Showcase Center */}
      <main className="max-w-5xl w-full mx-auto px-6 py-12 md:py-24 text-center space-y-8">
        
        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-extrabold uppercase tracking-widest rounded-full inline-block animate-pulse">
          Substituição da Ficha Física de Papel RBA
        </span>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight max-w-3xl mx-auto leading-none text-white/95">
          Suas Ordens de Frete Digitais em <span className="text-yellow-500">60 segundos</span>.
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Digitalize a emissão, consultas cadastrais Buonny/Pancary, controle de adiantamentos de motoristas e romaneios de veículos. Reduza a fricção de processos burocráticos no pátio de carregamento.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/login" className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg hover:shadow-yellow-500/10 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer no-underline select-none">
            Digitalizar Primeira Ordem
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
          <Link href="/login" className="px-6 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer">
            Verificar Permissões
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-16 text-left max-w-5xl mx-auto">
          
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-white">Ficha 100% Eletrônica</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Elimine o risco de rasuras e folhas rasgadas. Registre motoristas, dados de Pix, chassi e carretas com histórico.
            </p>
          </div>

          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-white">Cálculo de Margem Real</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Monitore adiantamentos, ajudas de custo e taxas. Visualize o saldo restante garantindo que não haja perdas de pátio.
            </p>
          </div>

          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-white">Análise Cadastral</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Varredura integrada de Buonny e Pancary para liberar o embarque. Seguros parametrizados com controle de limite.
            </p>
          </div>

          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="h-10 w-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center mb-4">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-2 text-white">Emissões de Trânsito</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Gere o documento em formato digital com código de barras, carimbos de validação de operador e assinatura criptográfica.
            </p>
          </div>

        </div>

      </main>

      {/* Clean elegant Footer summary */}
      <footer className="border-t border-slate-850 py-8 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 RBA Transporte e Logística S.A. Todos os direitos reservados.</p>
          <p className="font-mono text-[10px]">Desenvolvido com Tecnologia de Emissão de Risco em Tempo Real</p>
        </div>
      </footer>

    </div>
  );
}
