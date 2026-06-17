// lib/validators.ts
import { z } from 'zod';
import { FREIGHT_ORDER_STATUSES } from './freightStatus.ts';

export const onlyDigits = (value: string = '') => value.replace(/\D/g, '');

export const normalizeDocument = (value: string = '') => onlyDigits(value);

export const normalizePlate = (value: string = '') =>
  value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

export const normalizeUf = (value: string = '') =>
  value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);

const hasRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value);

export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;

  return digit === Number(cpf[10]);
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || hasRepeatedDigits(cnpj)) return false;

  const calc = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, weight, index) => acc + Number(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calc(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}

export const isValidCpfOrCnpj = (value: string): boolean =>
  isValidCPF(value) || isValidCNPJ(value);

export function isValidBrazilianPhone(value: string): boolean {
  let digits = onlyDigits(value);
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  return (digits.length === 10 || digits.length === 11) && !hasRepeatedDigits(digits);
}

export function isValidBrazilianPlate(value: string): boolean {
  const plate = normalizePlate(value);
  return /^[A-Z]{3}\d{4}$/.test(plate) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plate);
}

export function isValidPixKey(value: string): boolean {
  const key = value.trim();
  if (!key) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return true;
  if (isValidCpfOrCnpj(key)) return true;
  if (isValidBrazilianPhone(key)) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key);
}

export function isValidVehicleYear(value: unknown): boolean {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1980 && year <= new Date().getFullYear() + 2;
}

// Profile Validator
export const ProfileSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Formato de email inválido"),
  role: z.enum(['Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria']),
  active: z.boolean().default(true),
});

// Driver Validator
export const DriverSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().refine(isValidCPF, "CPF inválido"),
  rg: z.string().optional().default(''),
  phone: z.string().refine(isValidBrazilianPhone, "Telefone inválido"),
  bank_name: z.string().optional().default(''),
  bank_agency: z.string().optional().default(''),
  bank_account: z.string().optional().default(''),
  pix_key: z.string().refine(isValidPixKey, "Chave Pix inválida"),
  beneficiary_name: z.string().min(3, "Nome do beneficiário é obrigatório"),
  beneficiary_document: z.string().refine(isValidCpfOrCnpj, "CPF/CNPJ do beneficiário inválido"),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  notes: z.string().optional(),
});

// Vehicle Validator
export const VehicleSchema = z.object({
  tractor_plate: z.string().refine(isValidBrazilianPlate, "Placa do cavalo inválida"),
  trailer_plate: z.string().optional().default(''),
  year: z.number().refine(isValidVehicleYear, "Ano do veículo inválido"),
  manufacture_year: z.number().refine(isValidVehicleYear, "Ano de fabricação inválido"),
  model_year: z.number().refine(isValidVehicleYear, "Ano modelo inválido"),
  vehicle_type: z.enum(['Utilitário', 'VUC', '3/4', 'Toco', 'Truck', 'Carreta']),
  model: z.string().min(2, "Modelo é obrigatório"),
  owner_name: z.string().min(3, "Nome do proprietário obrigatório"),
  owner_document: z.string().refine(isValidCpfOrCnpj, "Documento do proprietário inválido"),
  antt: z.string().optional(),
  renavam: z.string().optional(),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  notes: z.string().optional(),
}).superRefine((vehicle, ctx) => {
  if ((vehicle.vehicle_type === 'Carreta' || vehicle.trailer_plate) && !isValidBrazilianPlate(vehicle.trailer_plate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Placa da carreta inválida",
      path: ['trailer_plate'],
    });
  }
});

// Client Validator
export const ClientSchema = z.object({
  name: z.string().min(3, "Nome/Razão Social obrigatória"),
  document: z.string().refine(isValidCpfOrCnpj, "Documento (CPF/CNPJ) inválido"),
  phone: z.string().optional().refine(value => !value || isValidBrazilianPhone(value), "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Freight Order Validator
export const FreightOrderSchema = z.object({
  driver_id: z.string().min(1, "Motorista é obrigatório"),
  vehicle_id: z.string().min(1, "Veículo é obrigatório"),
  client_id: z.string().min(1, "Cliente é obrigatório"),
  freight_value: z.number().positive("Valor do frete deve ser positivo"),
  advance_value: z.number().nonnegative(),
  cash_value: z.number().nonnegative(),
  loading_expense: z.number().nonnegative().optional().default(0),
  unloading_expense: z.number().nonnegative().optional().default(0),
  other_expenses: z.number().nonnegative().optional().default(0),
  origin: z.string().min(3, "Origem inválida"),
  destination: z.string().min(3, "Destino inválido"),
  delivery_date: z.string().optional().default(''),
  cte_number: z.string().optional(),
  cte_value: z.number().nonnegative().optional().default(0),
  cte_discount_percent: z.number().min(0).max(100).optional().default(10),
  buonny_status: z.enum(['Aprovado', 'Renovar']).optional().default('Renovar'),
  buonny_code: z.string().max(20, "Código Buonny deve ter no máximo 20 caracteres").optional().default(''),
  buonny_responsible: z.string().optional().default(''),
  shipment_release_status: z.enum(FREIGHT_ORDER_STATUSES).optional().default('Contratar'),
  shipment_release_limit: z.enum(['Até 100.000', 'Até 200.000', 'Até 300.000', 'Até 400.000', 'Até 500.000']).optional().default('Até 100.000'),
  responsible_name: z.string().optional().default(''),
  emission_day: z.string().max(2).optional().default(''),
  emission_month: z.string().optional().default(''),
  emission_year: z.string().max(2).optional().default(''),
  signature_url: z.string().optional().default(''),
  status: z.enum(FREIGHT_ORDER_STATUSES).optional().default('Contratar'),
  notes: z.string().optional(),
});

// Payment Validator
export const FreightPaymentSchema = z.object({
  freight_order_id: z.string().min(1),
  type: z.enum(['Adiantamento', 'Saldo', 'Taxa de Carga', 'À Vista', 'Reembolso', 'Outros']),
  amount: z.number().positive("Valor deve ser maior que zero"),
  payment_date: z.string().min(8),
  payment_method: z.enum(['Pix', 'Transferência', 'Dinheiro', 'Cartão', 'Cheque']),
  notes: z.string().optional(),
  status: z.enum(['Pendente', 'Pago', 'Cancelado']).default('Pendente'),
});
