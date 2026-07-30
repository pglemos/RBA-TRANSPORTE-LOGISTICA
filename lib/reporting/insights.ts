import type {
  ComparisonMetric,
  ReportAnalytics,
  ReportComparison,
  ReportInsight,
} from './types.ts';

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const roundPercent = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10) / 10;

function compareMetric(current: number, reference: number): ComparisonMetric {
  const absoluteChange = roundCurrency(current - reference);
  return {
    current,
    reference,
    absoluteChange,
    percentChange: reference === 0 ? null : roundPercent((absoluteChange / Math.abs(reference)) * 100),
    hasReference: reference !== 0,
  };
}

export function buildReportComparison(
  current: ReportAnalytics,
  reference: ReportAnalytics,
): ReportComparison {
  return {
    totalOrders: compareMetric(current.summary.totalOrders, reference.summary.totalOrders),
    totalCteValue: compareMetric(current.summary.totalCteValue, reference.summary.totalCteValue),
    totalNetValue: compareMetric(current.summary.totalNetValue, reference.summary.totalNetValue),
    totalExpenses: compareMetric(current.summary.totalExpenses, reference.summary.totalExpenses),
    marginPercent: compareMetric(current.summary.marginPercent, reference.summary.marginPercent),
    deliveredPercent: compareMetric(current.summary.deliveredPercent, reference.summary.deliveredPercent),
  };
}

const formatPercent = (value: number | null): string =>
  value === null ? 'sem base comparável' : `${Math.abs(value).toLocaleString('pt-BR')}%`;

function addInsight(target: ReportInsight[], insight: ReportInsight) {
  if (!target.some((item) => item.id === insight.id)) target.push(insight);
}

export function buildReportInsights(
  current: ReportAnalytics,
  previous: ReportAnalytics | null,
  previousYear: ReportAnalytics | null,
): ReportInsight[] {
  const insights: ReportInsight[] = [];
  const previousComparison = previous ? buildReportComparison(current, previous) : null;
  const yearComparison = previousYear ? buildReportComparison(current, previousYear) : null;

  const revenueChange = previousComparison?.totalCteValue.percentChange;
  if (revenueChange !== undefined && revenueChange !== null) {
    if (revenueChange >= 10) {
      addInsight(insights, {
        id: 'revenue-growth',
        kind: 'strength',
        title: 'Crescimento de receita movimentada',
        description: 'O valor CTE registrado avançou de forma relevante frente ao período anterior.',
        evidence: `Variação positiva de ${formatPercent(revenueChange)} no valor CTE.`,
        priority: 90,
      });
    } else if (revenueChange <= -10) {
      addInsight(insights, {
        id: 'revenue-drop',
        kind: 'attention',
        title: 'Queda de receita movimentada',
        description: 'O valor CTE registrado recuou e merece análise por cliente, rota e volume de operações.',
        evidence: `Variação negativa de ${formatPercent(revenueChange)} no valor CTE.`,
        priority: 95,
      });
    }
  }

  if (previous) {
    const expenseRatioChange = roundPercent(current.summary.expenseRatioPercent - previous.summary.expenseRatioPercent);
    if (expenseRatioChange >= 3) {
      addInsight(insights, {
        id: 'expense-ratio-rise',
        kind: 'attention',
        title: 'Pressão crescente de despesas',
        description: 'As despesas registradas cresceram proporcionalmente mais do que o valor CTE.',
        evidence: `A participação das despesas aumentou ${expenseRatioChange.toLocaleString('pt-BR')} p.p.`,
        priority: 92,
      });
    } else if (expenseRatioChange <= -2) {
      addInsight(insights, {
        id: 'expense-ratio-improvement',
        kind: 'strength',
        title: 'Melhora na eficiência de despesas',
        description: 'As despesas registradas perderam participação sobre o valor CTE do período.',
        evidence: `Redução de ${Math.abs(expenseRatioChange).toLocaleString('pt-BR')} p.p. na proporção de despesas.`,
        priority: 76,
      });
    }

    const deliveredDrop = roundPercent(previous.summary.deliveredPercent - current.summary.deliveredPercent);
    if (current.summary.deliveredPercent < 75 || deliveredDrop >= 10) {
      addInsight(insights, {
        id: 'operations-completion',
        kind: 'priority',
        title: 'Prioridade nas operações em andamento',
        description: 'A participação de operações concluídas está abaixo do nível desejável ou caiu frente ao período anterior.',
        evidence: `${current.summary.deliveredPercent.toLocaleString('pt-BR')}% das operações estão entregues.`,
        priority: 100,
      });
    }
  } else if (current.summary.deliveredPercent < 75 && current.summary.totalOrders > 0) {
    addInsight(insights, {
      id: 'operations-completion',
      kind: 'priority',
      title: 'Prioridade nas operações em andamento',
      description: 'A participação de operações concluídas está abaixo de 75%.',
      evidence: `${current.summary.deliveredPercent.toLocaleString('pt-BR')}% das operações estão entregues.`,
      priority: 100,
    });
  }

  const leadingClient = current.clients[0];
  if (leadingClient?.sharePercent >= 50) {
    addInsight(insights, {
      id: 'client-concentration',
      kind: 'attention',
      title: 'Concentração relevante em um cliente',
      description: 'Uma parcela elevada do valor CTE está concentrada no principal cliente do período.',
      evidence: `${leadingClient.label} representa ${leadingClient.sharePercent.toLocaleString('pt-BR')}% do valor CTE.`,
      priority: 88,
    });
  } else if (current.clients.length >= 4 && leadingClient && leadingClient.sharePercent < 35) {
    addInsight(insights, {
      id: 'client-diversification',
      kind: 'strength',
      title: 'Carteira comercial diversificada',
      description: 'O valor movimentado está distribuído sem dependência excessiva de um único cliente.',
      evidence: `O maior cliente representa ${leadingClient.sharePercent.toLocaleString('pt-BR')}% do valor CTE.`,
      priority: 70,
    });
  }

  if (current.recurrence.routes > 0) {
    addInsight(insights, {
      id: 'route-recurrence',
      kind: 'opportunity',
      title: 'Rotas com recorrência comercial',
      description: 'Há rotas repetidas que podem apoiar negociação, previsibilidade e padronização operacional.',
      evidence: `${current.recurrence.routes} rota(s) aparecem em duas ou mais operações.`,
      priority: 72,
    });
  }

  if (current.summary.marginPercent >= 30) {
    addInsight(insights, {
      id: 'margin-highlight',
      kind: 'highlight',
      title: 'Margem registrada em destaque',
      description: 'O lucro líquido persistido representa uma parcela relevante do valor CTE consolidado.',
      evidence: `Margem gerencial registrada de ${current.summary.marginPercent.toLocaleString('pt-BR')}%.`,
      priority: 82,
    });
  } else if (current.summary.marginPercent < 15 && current.summary.totalCteValue > 0) {
    addInsight(insights, {
      id: 'margin-low',
      kind: 'priority',
      title: 'Margem registrada abaixo do esperado',
      description: 'A relação entre lucro líquido registrado e valor CTE exige revisão das operações com menor retorno.',
      evidence: `Margem gerencial registrada de ${current.summary.marginPercent.toLocaleString('pt-BR')}%.`,
      priority: 98,
    });
  }

  const yearNetChange = yearComparison?.totalNetValue.percentChange;
  if (yearNetChange !== undefined && yearNetChange !== null) {
    addInsight(insights, {
      id: 'year-net-comparison',
      kind: yearNetChange >= 0 ? 'highlight' : 'attention',
      title: yearNetChange >= 0 ? 'Lucro acima do mesmo período anterior' : 'Lucro abaixo do mesmo período anterior',
      description: 'Comparação com a mesma janela de datas do ano anterior.',
      evidence: `${yearNetChange >= 0 ? 'Alta' : 'Queda'} de ${formatPercent(yearNetChange)} no lucro líquido registrado.`,
      priority: 68,
    });
  }

  if (!previous && !previousYear) {
    addInsight(insights, {
      id: 'no-comparison-base',
      kind: 'info',
      title: 'Sem base histórica comparável',
      description: 'O período atual possui dados, mas não há registros suficientes nas janelas de comparação.',
      evidence: 'Comparações serão exibidas automaticamente quando houver histórico.',
      priority: 20,
    });
  }

  return insights.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'pt-BR'));
}
