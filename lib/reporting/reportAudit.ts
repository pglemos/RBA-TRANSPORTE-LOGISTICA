
import type { DateRange, ReportingOrder } from './types.ts';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatDateOnly = (date: Date): string => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const formatBrazilianDate = (value: string): string => {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
};

function parseDateOnly(value: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) throw new Error(`Data inválida: ${value}`);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Data inválida: ${value}`);
  }
  return date;
}

function daysInRange(range: Pick<DateRange, 'startDate' | 'endDate'>): number {
  const start = parseDateOnly(range.startDate).getTime();
  const end = parseDateOnly(range.endDate).getTime();
  if (start > end) throw new Error('A data inicial não pode ser posterior à data final.');
  return Math.floor((end - start) / DAY_MS) + 1;
}

export function filterOrdersByEmissionRange<T extends Pick<ReportingOrder, 'emissionDateValue'>>(
  orders: T[],
  range: Pick<DateRange, 'startDate' | 'endDate'>,
): T[] {
  return orders.filter((order) => (
    DATE_ONLY_PATTERN.test(order.emissionDateValue)
    && order.emissionDateValue >= range.startDate
    && order.emissionDateValue <= range.endDate
  ));
}

export function clampRangeToDate(range: DateRange, referenceDate = new Date()): DateRange {
  const today = formatDateOnly(referenceDate);
  if (today < range.startDate || today > range.endDate) return { ...range, isPartial: false };
  return {
    ...range,
    endDate: today,
    label: `${range.label} (parcial até ${formatBrazilianDate(today)})`,
    isPartial: true,
  };
}

export function getPreviousMonthEquivalentRange(range: DateRange): DateRange {
  const start = parseDateOnly(range.startDate);
  const length = daysInRange(range);
  const previousStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1));
  const lastPreviousDay = new Date(Date.UTC(previousStart.getUTCFullYear(), previousStart.getUTCMonth() + 1, 0)).getUTCDate();
  const endDay = Math.min(length, lastPreviousDay);
  const startDate = [
    previousStart.getUTCFullYear(),
    String(previousStart.getUTCMonth() + 1).padStart(2, '0'),
    '01',
  ].join('-');
  const endDate = [
    previousStart.getUTCFullYear(),
    String(previousStart.getUTCMonth() + 1).padStart(2, '0'),
    String(endDay).padStart(2, '0'),
  ].join('-');
  return { startDate, endDate, label: `Mês anterior equivalente (${formatBrazilianDate(startDate)} a ${formatBrazilianDate(endDate)})` };
}

export function normalizeReferenceText(value: string): string {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed.toLocaleLowerCase('pt-BR') === 'a emitir') return trimmed || 'A emitir';
  return trimmed.split('/').map((part) => part.trim()).filter(Boolean).join(' / ');
}

export function normalizeLocationText(value: string): string {
  return String(value || '')
    .replace(/\bGRARULHOS\b/gi, 'GUARULHOS')
    .replace(/SÃO\s+JÕAO/gi, 'SÃO JOÃO')
    .replace(/\s+-\s*/g, ' - ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function summarizePaymentIntegrity(orders: ReportingOrder[]) {
  const totalFreightValue = roundCurrency(orders.reduce((sum, order) => sum + order.freightValue, 0));
  const totalRecordedDiscountValue = roundCurrency(orders.reduce((sum, order) => sum + order.cteDiscountValue, 0));
  const totalNetRevenue = roundCurrency(orders.reduce((sum, order) => sum + order.netRevenue, 0));
  const totalClassifiedPaymentValue = roundCurrency(orders.reduce((sum, order) => sum + order.classifiedPaymentValue, 0));
  const totalUnclassifiedPaymentValue = roundCurrency(orders.reduce((sum, order) => sum + order.unclassifiedPaymentValue, 0));
  return {
    totalRecordedDiscountValue,
    totalNetRevenue,
    totalClassifiedPaymentValue,
    totalUnclassifiedPaymentValue,
    unclassifiedPaymentOrderCount: orders.filter((order) => order.unclassifiedPaymentValue > 0.009).length,
    paymentCoveragePercent: totalFreightValue > 0
      ? roundCurrency((totalClassifiedPaymentValue / totalFreightValue) * 100)
      : 0,
  };
}
