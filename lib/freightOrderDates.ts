export const FREIGHT_ORDER_EMISSION_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_ALIASES = new Map(
  FREIGHT_ORDER_EMISSION_MONTHS.map((month, index) => [normalizeMonth(month), index]),
);

MONTH_ALIASES.set('marco', 2);
MONTH_ALIASES.set('marco.', 2);

type EmissionDateSource = {
  emission_day?: string | number | null;
  emission_month?: string | null;
  emission_year?: string | number | null;
  created_at?: string | null;
};

function normalizeMonth(month: string) {
  return month
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseEmissionYear(value: string | number | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return NaN;
  if (digits.length <= 2) return 2000 + Number(digits.padStart(2, '0'));
  return Number(digits.slice(0, 4));
}

export function parseFreightOrderEmissionDate(order: EmissionDateSource) {
  const day = Number(String(order.emission_day ?? '').replace(/\D/g, ''));
  const monthIndex = MONTH_ALIASES.get(normalizeMonth(order.emission_month ?? ''));
  const year = parseEmissionYear(order.emission_year);

  if (!day || monthIndex === undefined || !Number.isInteger(year)) return null;

  const date = new Date(Date.UTC(year, monthIndex, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function getFreightOrderEmissionDateValue(order: EmissionDateSource) {
  const emissionDate = parseFreightOrderEmissionDate(order);
  if (emissionDate) return emissionDate.toISOString().slice(0, 10);
  if (!order.created_at) return '';
  const createdAt = new Date(order.created_at);
  if (Number.isNaN(createdAt.getTime())) return '';
  return createdAt.toISOString().slice(0, 10);
}

export function formatFreightOrderEmissionDate(order: EmissionDateSource) {
  const emissionDate = parseFreightOrderEmissionDate(order);
  const date = emissionDate || (order.created_at ? new Date(order.created_at) : null);
  if (!date || Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('pt-BR', { timeZone: emissionDate ? 'UTC' : undefined });
}

export function formatFreightOrderEmissionLongDate(order: EmissionDateSource) {
  const emissionDate = parseFreightOrderEmissionDate(order);
  if (emissionDate) {
    const day = String(emissionDate.getUTCDate()).padStart(2, '0');
    const month = FREIGHT_ORDER_EMISSION_MONTHS[emissionDate.getUTCMonth()];
    const year = emissionDate.getUTCFullYear();
    return `${day} de ${month} de ${year}`;
  }

  if (!order.created_at) return 'N/A';
  const createdAt = new Date(order.created_at);
  if (Number.isNaN(createdAt.getTime())) return 'N/A';
  return `${createdAt.toLocaleDateString('pt-BR')} ${createdAt.toLocaleTimeString('pt-BR')}`;
}
