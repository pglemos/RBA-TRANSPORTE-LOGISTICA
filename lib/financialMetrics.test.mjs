import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFreightOrderFinancials,
  summarizeFreightOrders,
} from './financialMetrics.ts';

test('summarizeFreightOrders uses CTE value as gross revenue instead of driver freight', () => {
  const orders = [
    {
      cte_value: 10000,
      cte_discount_percent: 10,
      freight_value: 3000,
      advance_value: 1000,
      cash_value: 500,
      balance_value: 1500,
      loading_expense: 100,
      unloading_expense: 200,
      other_expenses: 50,
    },
    {
      cte_value: 2500,
      cte_discount_percent: 0,
      freight_value: 2000,
      advance_value: 600,
      cash_value: 0,
      balance_value: 300,
      total_expenses: 300,
    },
  ];

  const summary = summarizeFreightOrders(orders);

  assert.equal(summary.totalGrossRevenue, 12500);
  assert.equal(summary.totalDriverFreight, 5000);
  assert.equal(summary.totalAdvance, 1600);
  assert.equal(summary.totalDriverPaid, 3900);
  assert.equal(summary.totalBalanceToPay, 1100);
  assert.equal(summary.totalExpenses, 650);
  assert.equal(summary.totalCteDiscount, 1000);
  assert.equal(summary.totalNet, 5850);
});

test('calculateFreightOrderFinancials derives persisted totals from CTE revenue, freight and expenses', () => {
  const financials = calculateFreightOrderFinancials({
    cte_value: 42000,
    cte_discount_percent: 12.5,
    freight_value: 16000,
    advance_value: 11200,
    cash_value: 0,
    loading_expense: 900,
    unloading_expense: 300,
    other_expenses: 218,
  });

  assert.deepEqual(financials, {
    cte_value: 42000,
    cte_discount_percent: 12.5,
    cte_discount_value: 5250,
    freight_value: 16000,
    advance_value: 11200,
    cash_value: 0,
    balance_value: 4800,
    loading_expense: 900,
    unloading_expense: 300,
    other_expenses: 218,
    total_expenses: 1418,
    net_revenue: 36750,
    net_value: 19332,
  });
});

test('calculateFreightOrderFinancials preserves manual balance value when provided', () => {
  const financials = calculateFreightOrderFinancials({
    cte_value: 20000,
    freight_value: 10000,
    advance_value: 3000,
    cash_value: 1000,
    balance_value: 2500,
  });

  assert.equal(financials.balance_value, 2500);
});

test('calculateFreightOrderFinancials defaults missing CTE discount percent to 10', () => {
  const financials = calculateFreightOrderFinancials({
    cte_value: 15000,
    freight_value: 10000,
  });

  assert.equal(financials.cte_discount_percent, 10);
  assert.equal(financials.cte_discount_value, 1500);
  assert.equal(financials.net_value, 3500);
});
