export interface FreightFinancialInput {
  cte_value?: unknown;
  cte_discount_percent?: unknown;
  freight_value?: unknown;
  advance_value?: unknown;
  cash_value?: unknown;
  balance_value?: unknown;
  loading_expense?: unknown;
  unloading_expense?: unknown;
  other_expenses?: unknown;
  total_expenses?: unknown;
  status?: unknown;
}

export interface FreightOrderFinancials {
  cte_value: number;
  cte_discount_percent: number;
  cte_discount_value: number;
  freight_value: number;
  advance_value: number;
  cash_value: number;
  balance_value: number;
  loading_expense: number;
  unloading_expense: number;
  other_expenses: number;
  total_expenses: number;
  net_revenue: number;
  net_value: number;
}

export interface FreightOrdersSummary {
  totalOrders: number;
  totalGrossRevenue: number;
  totalDriverFreight: number;
  totalAdvance: number;
  totalDriverPaid: number;
  totalBalanceToPay: number;
  totalExpenses: number;
  totalCteDiscount: number;
  totalNet: number;
  ordersByStatus: Record<string, number>;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const hasValue = (value: unknown): boolean => value !== undefined && value !== null && value !== '';

export function calculateFreightOrderFinancials(order: FreightFinancialInput): FreightOrderFinancials {
  const cteValue = toNumber(order.cte_value);
  const cteDiscountPercent = hasValue(order.cte_discount_percent) ? toNumber(order.cte_discount_percent) : 10;
  const freightValue = toNumber(order.freight_value);
  const advanceValue = toNumber(order.advance_value);
  const cashValue = toNumber(order.cash_value);
  const balanceValue = hasValue(order.balance_value)
    ? toNumber(order.balance_value)
    : freightValue - advanceValue - cashValue;
  const loadingExpense = toNumber(order.loading_expense);
  const unloadingExpense = toNumber(order.unloading_expense);
  const otherExpenses = toNumber(order.other_expenses);
  const componentExpenses = loadingExpense + unloadingExpense + otherExpenses;
  const totalExpenses = componentExpenses !== 0 ? componentExpenses : toNumber(order.total_expenses);
  const cteDiscountValue = cteValue * cteDiscountPercent / 100;
  const netRevenue = cteValue - cteDiscountValue;

  return {
    cte_value: roundCurrency(cteValue),
    cte_discount_percent: cteDiscountPercent,
    cte_discount_value: roundCurrency(cteDiscountValue),
    freight_value: roundCurrency(freightValue),
    advance_value: roundCurrency(advanceValue),
    cash_value: roundCurrency(cashValue),
    balance_value: roundCurrency(balanceValue),
    loading_expense: roundCurrency(loadingExpense),
    unloading_expense: roundCurrency(unloadingExpense),
    other_expenses: roundCurrency(otherExpenses),
    total_expenses: roundCurrency(totalExpenses),
    net_revenue: roundCurrency(netRevenue),
    net_value: roundCurrency(netRevenue - freightValue - totalExpenses),
  };
}

export function summarizeFreightOrders(
  orders: FreightFinancialInput[],
  normalizeStatus?: (status: unknown) => string,
): FreightOrdersSummary {
  return orders.reduce<FreightOrdersSummary>((summary, order) => {
    const financials = calculateFreightOrderFinancials(order);
    const status = normalizeStatus ? normalizeStatus(order.status) : String(order.status || '');

    summary.totalOrders += 1;
    summary.totalGrossRevenue += financials.cte_value;
    summary.totalDriverFreight += financials.freight_value;
    summary.totalAdvance += financials.advance_value;
    summary.totalDriverPaid += financials.advance_value + financials.cash_value + financials.balance_value;
    summary.totalBalanceToPay += Math.max(
      financials.freight_value - financials.advance_value - financials.cash_value - financials.balance_value,
      0,
    );
    summary.totalExpenses += financials.total_expenses;
    summary.totalCteDiscount += financials.cte_discount_value;
    summary.totalNet += financials.net_value;
    if (status) {
      summary.ordersByStatus[status] = (summary.ordersByStatus[status] || 0) + 1;
    }

    return summary;
  }, {
    totalOrders: 0,
    totalGrossRevenue: 0,
    totalDriverFreight: 0,
    totalAdvance: 0,
    totalDriverPaid: 0,
    totalBalanceToPay: 0,
    totalExpenses: 0,
    totalCteDiscount: 0,
    totalNet: 0,
    ordersByStatus: {},
  });
}
