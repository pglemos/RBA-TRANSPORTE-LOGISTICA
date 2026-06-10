// lib/validators.ts
import { z } from 'zod';

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
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos numéricos"),
  rg: z.string().min(5, "RG inválido"),
  phone: z.string().optional(),
  bank_name: z.string().min(2, "Banco é obrigatório"),
  bank_agency: z.string().min(3, "Agência inválida"),
  bank_account: z.string().min(4, "Conta inválida"),
  pix_key: z.string().min(4, "Chave Pix inválida"),
  beneficiary_name: z.string().min(3, "Nome do beneficiário é obrigatório"),
  beneficiary_document: z.string().regex(/^\d{11}|\d{14}$/, "CPF/CNPJ do beneficiário inválido"),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  notes: z.string().optional(),
});

// Vehicle Validator
export const VehicleSchema = z.object({
  tractor_plate: z.string().min(7, "Placa do cavalo inválida (mínimo 7 caracteres)"),
  trailer_plate: z.string().optional(),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 2),
  model: z.string().min(2, "Modelo é obrigatório"),
  owner_name: z.string().min(3, "Nome do proprietário obrigatório"),
  owner_document: z.string().min(11, "Documento do proprietário inválido"),
  antt: z.string().optional(),
  renavam: z.string().optional(),
  uf: z.string().length(2, "UF deve ter 2 caracteres"),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  notes: z.string().optional(),
});

// Client Validator
export const ClientSchema = z.object({
  name: z.string().min(3, "Nome/Razão Social obrigatória"),
  document: z.string().min(11, "Documento (CPF/CNPJ) inválido"),
  phone: z.string().optional(),
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
  delivery_date: z.string().min(8, "Data de entrega obrigatória"),
  cte_number: z.string().optional(),
  cte_value: z.number().nonnegative().optional().default(0),
  cte_discount_percent: z.number().min(0).max(100).optional().default(10),
  buonny_status: z.enum(['Aprovado', 'Renovar']).optional().default('Renovar'),
  buonny_code: z.string().max(20, "Código Buonny deve ter no máximo 20 caracteres").optional().default(''),
  buonny_responsible: z.string().optional().default(''),
  shipment_release_status: z.enum(['Liberado', 'Pendente', 'Bloqueado']).optional().default('Pendente'),
  shipment_release_limit: z.enum(['Até 100.000', 'Até 200.000', 'Até 300.000', 'Até 400.000', 'Até 500.000']).optional().default('Até 100.000'),
  responsible_name: z.string().optional().default(''),
  emission_day: z.string().max(2).optional().default(''),
  emission_month: z.string().optional().default(''),
  emission_year: z.string().max(2).optional().default(''),
  signature_url: z.string().optional().default(''),
  status: z.enum(['Rascunho', 'Em Análise', 'Aprovado', 'Liberado para Embarque', 'Carregando', 'Em Viagem', 'Entregue', 'Pago', 'Cancelado']).optional().default('Rascunho'),
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
