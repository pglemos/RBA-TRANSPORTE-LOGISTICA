import {
  AlertTriangle,
  BadgeCheck,
  CircleAlert,
  CircleDot,
  Lightbulb,
  Target,
} from 'lucide-react';

import type { ReportInsight, ReportInsightKind } from '@/lib/reporting/types';

const KIND_META: Record<ReportInsightKind, {
  label: string;
  icon: typeof BadgeCheck;
  className: string;
  iconClassName: string;
}> = {
  strength: { label: 'Ponto forte', icon: BadgeCheck, className: 'border-emerald-200 bg-emerald-50', iconClassName: 'bg-emerald-700 text-white' },
  highlight: { label: 'Destaque', icon: CircleDot, className: 'border-blue-200 bg-blue-50', iconClassName: 'bg-blue-700 text-white' },
  attention: { label: 'Ponto de atenção', icon: AlertTriangle, className: 'border-amber-200 bg-amber-50', iconClassName: 'bg-amber-600 text-white' },
  opportunity: { label: 'Oportunidade', icon: Lightbulb, className: 'border-violet-200 bg-violet-50', iconClassName: 'bg-violet-700 text-white' },
  priority: { label: 'Prioridade sugerida', icon: Target, className: 'border-orange-200 bg-orange-50', iconClassName: 'bg-orange-700 text-white' },
  info: { label: 'Informação', icon: CircleAlert, className: 'border-slate-200 bg-slate-50', iconClassName: 'bg-slate-700 text-white' },
};

export default function ReportInsights({ insights }: { insights: ReportInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9e8245]">Leitura gerencial</p>
        <h2 className="mt-1 break-words text-lg font-black text-slate-950">Insights, destaques e prioridades</h2>
        <p className="mt-1 max-w-3xl break-words text-xs font-semibold leading-relaxed text-slate-500">
          Cada observação apresenta a evidência numérica que a originou, permitindo leitura gerencial objetiva e auditável.
        </p>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
        {insights.map((insight) => {
          const meta = KIND_META[insight.kind];
          const Icon = meta.icon;
          return (
            <article key={insight.id} className={`min-w-0 rounded-2xl border p-4 ${meta.className}`}>
              <div className="flex min-w-0 items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">{meta.label}</p>
                  <h3 className="mt-1 break-words text-sm font-black leading-snug text-slate-950">{insight.title}</h3>
                  <p className="mt-2 break-words text-[11px] font-semibold leading-relaxed text-slate-600">{insight.description}</p>
                  <p className="mt-3 break-words rounded-lg bg-white/75 px-3 py-2 text-[10px] font-black leading-relaxed text-slate-700">{insight.evidence}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
