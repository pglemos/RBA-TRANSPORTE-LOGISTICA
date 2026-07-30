import type {
  ComparisonMetric,
  ReportAnalytics,
  ReportComparison,
  ReportInsight,
  ReportKind,
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

const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function addInsight(target: ReportInsight[], insight: ReportInsight) {
  if (!target.some((item) => item.id === insight.id)) target.push(insight);
}

function addModelInsights(insights: ReportInsight[], current: ReportAnalytics, kind: ReportKind) {
  if (kind === 'expenses') {
    const leadingCategory = [...current.expenses].sort((a, b) => b.value - a.value)[0];
    const leadingClient = [...current.clients].sort((a, b) => b.expenses - a.expenses)[0];
    if (leadingCategory && current.summary.totalExpenses > 0) {
      addInsight(insights, {
        id: 'expenses-leading-category',
        kind: leadingCategory.sharePercent >= 60 ? 'attention' : 'highlight',
        title: 'Categoria predominante de despesas',
        description: 'A composição das despesas mostra qual tipo de lançamento mais pressiona o período.',
        evidence: `${leadingCategory.label} representa ${leadingCategory.sharePercent.toLocaleString('pt-BR')}% das despesas, com ${formatCurrency(leadingCategory.value)} registrados.`,
        priority: 86,
      });
    }
    if (leadingClient?.expenses > 0) {
      addInsight(insights, {
        id: 'expenses-leading-client',
        kind: 'opportunity',
        title: 'Cliente prioritário para revisão de despesas',
        description: 'A concentração de despesas por cliente ajuda a direcionar conferência operacional e negociação.',
        evidence: `${leadingClient.label} concentra ${formatCurrency(leadingClient.expenses)} em despesas registradas.`,
        priority: 79,
      });
    }
  }

  if (kind === 'profits') {
    const negative = current.profitBuckets.find((item) => item.key === 'negative');
    const neutral = current.profitBuckets.find((item) => item.key === 'neutral');
    const leadingRoute = [...current.routes].sort((a, b) => b.netValue - a.netValue)[0];
    if ((negative?.orderCount || 0) > 0) {
      addInsight(insights, {
        id: 'profits-negative-operations',
        kind: 'priority',
        title: 'Operações com resultado negativo registrado',
        description: 'Há ordens cujo campo de lucro líquido persistido está abaixo de zero e exige conferência individual.',
        evidence: `${negative?.orderCount || 0} operação(ões) somam ${formatCurrency(negative?.value || 0)} em resultado negativo.`,
        priority: 100,
      });
    }
    if ((neutral?.orderCount || 0) > 0) {
      addInsight(insights, {
        id: 'profits-neutral-operations',
        kind: 'attention',
        title: 'Operações sem lucro registrado',
        description: 'Resultados iguais a zero podem indicar operação sem retorno ou cadastro financeiro incompleto.',
        evidence: `${neutral?.orderCount || 0} operação(ões) apresentam lucro líquido igual a zero.`,
        priority: 84,
      });
    }
    if (leadingRoute?.netValue > 0) {
      addInsight(insights, {
        id: 'profits-leading-route',
        kind: 'strength',
        title: 'Rota com maior lucro registrado',
        description: 'A rota líder pode orientar priorização comercial e análise de capacidade.',
        evidence: `${leadingRoute.label} soma ${formatCurrency(leadingRoute.netValue)} em lucro líquido registrado.`,
        priority: 77,
      });
    }
  }

  if (kind === 'clients') {
    if (current.recurrence.recurringClientOrderPercent >= 60) {
      addInsight(insights, {
        id: 'clients-recurrence-strength',
        kind: 'strength',
        title: 'Base relevante de clientes recorrentes',
        description: 'A maior parte das operações está associada a clientes com mais de uma ocorrência no período.',
        evidence: `${current.recurrence.recurringClientOrderPercent.toLocaleString('pt-BR')}% das operações pertencem a clientes recorrentes.`,
        priority: 85,
      });
    }
    if (current.recurrence.leadingClientDependencyPercent >= 50) {
      addInsight(insights, {
        id: 'clients-volume-dependency',
        kind: 'attention',
        title: 'Dependência financeira do principal cliente',
        description: 'O cliente líder representa parcela elevada do valor CTE consolidado.',
        evidence: `${current.recurrence.leadingClientDependencyPercent.toLocaleString('pt-BR')}% do valor CTE pertence ao cliente líder.`,
        priority: 91,
      });
    }
  }

  if (kind === 'drivers') {
    const leader = current.drivers[0];
    if (current.recurrence.recurringDriverOrderPercent >= 60) {
      addInsight(insights, {
        id: 'drivers-recurrence-strength',
        kind: 'strength',
        title: 'Rede de motoristas recorrente',
        description: 'A operação utiliza com frequência motoristas já presentes em outras viagens do período.',
        evidence: `${current.recurrence.recurringDriverOrderPercent.toLocaleString('pt-BR')}% das operações usam motoristas recorrentes.`,
        priority: 80,
      });
    }
    if (leader) {
      addInsight(insights, {
        id: 'drivers-leading-volume',
        kind: 'highlight',
        title: 'Motorista com maior volume movimentado',
        description: 'O destaque identifica o motorista associado ao maior valor CTE consolidado.',
        evidence: `${leader.label} reúne ${leader.orderCount} operação(ões) e ${formatCurrency(leader.cteValue)} em valor CTE.`,
        priority: 72,
      });
    }
  }

  if (kind === 'routes') {
    const leader = current.routes[0];
    if (leader) {
      addInsight(insights, {
        id: 'routes-leading-volume',
        kind: 'highlight',
        title: 'Rota com maior valor movimentado',
        description: 'A rota líder concentra o maior valor CTE do período selecionado.',
        evidence: `${leader.label} representa ${leader.sharePercent.toLocaleString('pt-BR')}% do valor CTE.`,
        priority: 80,
      });
    }
    if (current.recurrence.recurringRouteOrderPercent >= 50) {
      addInsight(insights, {
        id: 'routes-recurrence-strength',
        kind: 'opportunity',
        title: 'Potencial de padronização em rotas recorrentes',
        description: 'O volume repetido permite estudar negociação, previsibilidade e capacidade dedicada.',
        evidence: `${current.recurrence.recurringRouteOrderPercent.toLocaleString('pt-BR')}% das operações usam rotas recorrentes.`,
        priority: 83,
      });
    }
  }

  if (kind === 'recurrence') {
    if (current.recurrence.clientRoutes > 0) {
      addInsight(insights, {
        id: 'recurrence-client-route',
        kind: 'opportunity',
        title: 'Combinações cliente e rota consolidadas',
        description: 'Relações repetidas entre cliente e rota podem sustentar acordos comerciais e operacionais específicos.',
        evidence: `${current.recurrence.clientRoutes} combinação(ões) cliente + rota aparecem em duas ou mais operações.`,
        priority: 88,
      });
    }
    if (current.recurrence.recurringClientRouteOrderPercent < 25 && current.summary.totalOrders >= 5) {
      addInsight(insights, {
        id: 'recurrence-low-client-route',
        kind: 'attention',
        title: 'Baixa repetição de cliente e rota',
        description: 'A operação está distribuída em combinações pouco repetidas, reduzindo previsibilidade.',
        evidence: `Somente ${current.recurrence.recurringClientRouteOrderPercent.toLocaleString('pt-BR')}% das operações pertencem a combinações recorrentes.`,
        priority: 78,
      });
    }
  }

  if (kind === 'in-progress') {
    const open = current.inProgressSummary;
    if (open.oldestOpenDays >= 15) {
      addInsight(insights, {
        id: 'in-progress-oldest',
        kind: 'priority',
        title: 'Operação antiga ainda em andamento',
        description: 'A operação aberta mais antiga ultrapassa o intervalo recomendado para conferência prioritária.',
        evidence: `A operação mais antiga está aberta há ${open.oldestOpenDays} dias.`,
        priority: 100,
      });
    }
    if (open.totalOrders > 0) {
      addInsight(insights, {
        id: 'in-progress-exposure',
        kind: 'attention',
        title: 'Valor envolvido em operações abertas',
        description: 'O volume financeiro das operações em andamento deve ser acompanhado até a conclusão.',
        evidence: `${open.totalOrders} operação(ões) abertas representam ${formatCurrency(open.totalCteValue)} em valor CTE.`,
        priority: 89,
      });
    }
    const leadingOpenClient = open.byClient[0];
    if (leadingOpenClient) {
      addInsight(insights, {
        id: 'in-progress-leading-client',
        kind: 'highlight',
        title: 'Cliente com maior exposição em aberto',
        description: 'O agrupamento por cliente identifica onde está concentrado o valor das operações em andamento.',
        evidence: `${leadingOpenClient.label} reúne ${formatCurrency(leadingOpenClient.cteValue)} em valor CTE aberto.`,
        priority: 75,
      });
    }
  }
}

export function buildReportInsights(
  current: ReportAnalytics,
  previous: ReportAnalytics | null,
  previousYear: ReportAnalytics | null,
  kind: ReportKind = 'executive',
): ReportInsight[] {
  const insights: ReportInsight[] = [];
  const previousComparison = previous ? buildReportComparison(current, previous) : null;
  const yearComparison = previousYear ? buildReportComparison(current, previousYear) : null;

  const revenueChange = previousComparison?.totalCteValue.percentChange;
  if (revenueChange !== undefined && revenueChange !== null) {
    if (revenueChange >= 10) {
      addInsight(insights, {
        id: 'revenue-growth', kind: 'strength', title: 'Crescimento de receita movimentada',
        description: 'O valor CTE registrado avançou de forma relevante frente ao período anterior.',
        evidence: `Variação positiva de ${formatPercent(revenueChange)} no valor CTE.`, priority: 90,
      });
    } else if (revenueChange <= -10) {
      addInsight(insights, {
        id: 'revenue-drop', kind: 'attention', title: 'Queda de receita movimentada',
        description: 'O valor CTE registrado recuou e merece análise por cliente, rota e volume de operações.',
        evidence: `Variação negativa de ${formatPercent(revenueChange)} no valor CTE.`, priority: 95,
      });
    }
  }

  if (previous) {
    const expenseRatioChange = roundPercent(current.summary.expenseRatioPercent - previous.summary.expenseRatioPercent);
    if (expenseRatioChange >= 3) {
      addInsight(insights, {
        id: 'expense-ratio-rise', kind: 'attention', title: 'Pressão crescente de despesas',
        description: 'As despesas registradas cresceram proporcionalmente mais do que o valor CTE.',
        evidence: `A participação das despesas aumentou ${expenseRatioChange.toLocaleString('pt-BR')} p.p.`, priority: 92,
      });
    } else if (expenseRatioChange <= -2) {
      addInsight(insights, {
        id: 'expense-ratio-improvement', kind: 'strength', title: 'Melhora na eficiência de despesas',
        description: 'As despesas registradas perderam participação sobre o valor CTE do período.',
        evidence: `Redução de ${Math.abs(expenseRatioChange).toLocaleString('pt-BR')} p.p. na proporção de despesas.`, priority: 76,
      });
    }

    const deliveredDrop = roundPercent(previous.summary.deliveredPercent - current.summary.deliveredPercent);
    if (current.summary.deliveredPercent < 75 || deliveredDrop >= 10) {
      addInsight(insights, {
        id: 'operations-completion', kind: 'priority', title: 'Prioridade nas operações em andamento',
        description: 'A participação de operações concluídas está abaixo do nível desejável ou caiu frente ao período anterior.',
        evidence: `${current.summary.deliveredPercent.toLocaleString('pt-BR')}% das operações estão entregues.`, priority: 100,
      });
    }
  } else if (current.summary.deliveredPercent < 75 && current.summary.totalOrders > 0) {
    addInsight(insights, {
      id: 'operations-completion', kind: 'priority', title: 'Prioridade nas operações em andamento',
      description: 'A participação de operações concluídas está abaixo de 75%.',
      evidence: `${current.summary.deliveredPercent.toLocaleString('pt-BR')}% das operações estão entregues.`, priority: 100,
    });
  }

  const leadingClient = current.clients[0];
  if (leadingClient?.sharePercent >= 50) {
    addInsight(insights, {
      id: 'client-concentration', kind: 'attention', title: 'Concentração relevante em um cliente',
      description: 'Uma parcela elevada do valor CTE está concentrada no principal cliente do período.',
      evidence: `${leadingClient.label} representa ${leadingClient.sharePercent.toLocaleString('pt-BR')}% do valor CTE.`, priority: 88,
    });
  } else if (current.clients.length >= 4 && leadingClient && leadingClient.sharePercent < 35) {
    addInsight(insights, {
      id: 'client-diversification', kind: 'strength', title: 'Carteira comercial diversificada',
      description: 'O valor movimentado está distribuído sem dependência excessiva de um único cliente.',
      evidence: `O maior cliente representa ${leadingClient.sharePercent.toLocaleString('pt-BR')}% do valor CTE.`, priority: 70,
    });
  }

  if (current.recurrence.routes > 0) {
    addInsight(insights, {
      id: 'route-recurrence', kind: 'opportunity', title: 'Rotas com recorrência comercial',
      description: 'Há rotas repetidas que podem apoiar negociação, previsibilidade e padronização operacional.',
      evidence: `${current.recurrence.routes} rota(s) aparecem em duas ou mais operações.`, priority: 72,
    });
  }

  if (current.summary.marginPercent >= 30) {
    addInsight(insights, {
      id: 'margin-highlight', kind: 'highlight', title: 'Margem registrada em destaque',
      description: 'O lucro líquido persistido representa uma parcela relevante do valor CTE consolidado.',
      evidence: `Margem gerencial registrada de ${current.summary.marginPercent.toLocaleString('pt-BR')}%.`, priority: 82,
    });
  } else if (current.summary.marginPercent < 15 && current.summary.totalCteValue > 0) {
    addInsight(insights, {
      id: 'margin-low', kind: 'priority', title: 'Margem registrada abaixo do esperado',
      description: 'A relação entre lucro líquido registrado e valor CTE exige revisão das operações com menor retorno.',
      evidence: `Margem gerencial registrada de ${current.summary.marginPercent.toLocaleString('pt-BR')}%.`, priority: 98,
    });
  }

  const yearNetChange = yearComparison?.totalNetValue.percentChange;
  if (yearNetChange !== undefined && yearNetChange !== null) {
    addInsight(insights, {
      id: 'year-net-comparison', kind: yearNetChange >= 0 ? 'highlight' : 'attention',
      title: yearNetChange >= 0 ? 'Lucro acima do mesmo período anterior' : 'Lucro abaixo do mesmo período anterior',
      description: 'Comparação com a mesma janela de datas do ano anterior.',
      evidence: `${yearNetChange >= 0 ? 'Alta' : 'Queda'} de ${formatPercent(yearNetChange)} no lucro líquido registrado.`, priority: 68,
    });
  }

  addModelInsights(insights, current, kind);

  if (!previous && !previousYear) {
    addInsight(insights, {
      id: 'no-comparison-base', kind: 'info', title: 'Sem base histórica comparável',
      description: 'O período atual possui dados, mas não há registros suficientes nas janelas de comparação.',
      evidence: 'Comparações serão exibidas automaticamente quando houver histórico.', priority: 20,
    });
  }

  return insights.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title, 'pt-BR'));
}
