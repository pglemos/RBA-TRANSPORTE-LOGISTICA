import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { supabaseServer, isSupabaseServerConfigured } from './supabase/server';
import { getRBADataClient } from './dbContext';
import type { FreightOrderStatus } from './freightStatus';
import { calculateFreightOrderFinancials, type FreightOrderFinancials } from './financialMetrics';

// Define DB Types based on PRD

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Operacional' | 'Financeiro' | 'Consulta/Auditoria';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  rg: string;
  phone: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  pix_key: string;
  beneficiary_name: string;
  beneficiary_document: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  tractor_plate: string;
  trailer_plate: string;
  year: number;
  manufacture_year?: number;
  model_year?: number;
  vehicle_type?: 'Utilitário' | 'VUC' | '3/4' | 'Toco' | 'Truck' | 'Bitruck' | 'Carreta';
  model: string;
  owner_name: string;
  owner_document: string;
  antt: string;
  renavam: string;
  uf: string;
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FreightOrder {
  id: string;
  order_number: string;
  driver_id: string;
  vehicle_id: string;
  client_id: string;
  freight_value: number;
  advance_value: number;
  cash_value: number;
  balance_value: number;
  loading_expense: number;
  unloading_expense: number;
  other_expenses: number;
  total_expenses: number;
  net_value: number;
  bank_data_snapshot: {
    bank_name: string;
    bank_agency: string;
    bank_account: string;
    pix_key: string;
    beneficiary_name: string;
  };
  buonny_status: 'Aprovado' | 'Renovar';
  buonny_code: string;
  cte_number: string;
  cte_value: number;
  cte_discount_percent: number;
  shipment_release_status: FreightOrderStatus;
  shipment_release_limit: 'Até 100.000' | 'Até 200.000' | 'Até 300.000' | 'Até 400.000' | 'Até 500.000';
  origin: string;
  destination: string;
  delivery_date: string;
  emission_day: string;
  emission_month: string;
  emission_year: string;
  responsible_name: string;
  buonny_responsible: string;
  signature_url: string;
  status: FreightOrderStatus;
  notes: string;
  created_by: string;
  approved_by: string;
  approved_at: string;
  created_at: string;
  updated_at: string;
}

export interface FreightPayment {
  id: string;
  freight_order_id: string;
  type: string; // e.g. "Adiantamento", "Saldo", "À Vista"
  amount: number;
  payment_date: string;
  payment_method: string;
  proof_url: string;
  status: 'Pendente' | 'Pago' | 'Cancelado';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FreightOrderAttachment {
  id: string;
  freight_order_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  old_data: string;
  new_data: string;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at?: string;
}

// Memory database loaded from file
interface Database {
  profiles: Profile[];
  drivers: Driver[];
  vehicles: Vehicle[];
  clients: Client[];
  freight_orders: FreightOrder[];
  freight_payments: FreightPayment[];
  freight_order_attachments: FreightOrderAttachment[];
  audit_logs: AuditLog[];
  app_settings: AppSetting[];
}

const DB_PATH = path.join(process.cwd(), 'rba_database.json');
const isServerlessRuntime = !!process.env.VERCEL;
const generateId = (prefix: string) => `${prefix}_${randomUUID()}`;

const nextFreightOrderSequence = (orders: Pick<FreightOrder, 'order_number'>[]) => {
  const year = new Date().getFullYear();
  const maxSequence = orders.reduce((max, order) => {
    const match = order.order_number?.match(new RegExp(`RBA-${year}-(\\d+)$`));
    const sequence = match ? Number(match[1]) : 0;
    return Number.isFinite(sequence) && sequence > max ? sequence : max;
  }, 0);

  return maxSequence + 1;
};

const getCteSortValue = (cteNumber?: string) => {
  const match = cteNumber?.match(/\d+/g);
  if (!match) return 0;
  return Number(match.join('')) || 0;
};

const isUniqueViolation = (error: any) => error?.code === '23505' || /duplicate key|unique/i.test(error?.message || '');

const withFreightOrderDefaults = (order: any): FreightOrder => {
  const defaults = {
    buonny_code: '',
    buonny_responsible: '',
    emission_day: '',
    emission_month: '',
    emission_year: '',
    ...order
  };
  return {
    ...defaults,
    ...calculateFreightOrderFinancials(defaults)
  } as FreightOrder;
};

const buildAutomaticFreightPayments = (orderId: string, financials: FreightOrderFinancials): FreightPayment[] => {
  const now = new Date().toISOString();
  const paymentDate = now.split('T')[0];
  const makePayment = (
    type: string,
    amount: number,
    status: FreightPayment['status'],
    payment_method: string,
    notes: string,
  ): FreightPayment => ({
    id: generateId('pay'),
    freight_order_id: orderId,
    type,
    amount,
    payment_date: paymentDate,
    payment_method,
    proof_url: '',
    status,
    notes,
    created_at: now,
    updated_at: now,
  });

  return [
    financials.advance_value > 0
      ? makePayment('Adiantamento', financials.advance_value, 'Pendente', 'Pix', 'Adiantamento gerado automaticamente para aprovar.')
      : null,
    financials.cash_value > 0
      ? makePayment('À Vista', financials.cash_value, 'Pago', 'Dinheiro', 'Pagamento à vista lançado automaticamente como liquidado.')
      : null,
    financials.balance_value > 0
      ? makePayment('Saldo', financials.balance_value, 'Pago', 'Pix', 'Saldo lançado automaticamente como liquidado.')
      : null,
  ].filter(Boolean) as FreightPayment[];
};

const throwSupabaseError = (action: string, error: any): never => {
  throw new Error(`${action} no Supabase: ${error?.message || 'erro desconhecido'}`);
};

const supabaseDataClient = () => getRBADataClient(supabaseServer);

// Initial seed data
const initialDB: Database = {
  profiles: [
    {
      id: "prof_1",
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "Morgan Ribeiro (Admin)",
      email: "admin@rba.com",
      role: "Administrador",
      active: true,
      created_at: "2026-05-20T10:00:00Z",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      id: "prof_2",
      user_id: "00000000-0000-0000-0000-000000000002",
      name: "Ana Costa",
      email: "operacional@rba.com",
      role: "Operacional",
      active: true,
      created_at: "2026-05-21T08:30:00Z",
      updated_at: "2026-05-21T08:30:00Z"
    },
    {
      id: "prof_3",
      user_id: "00000000-0000-0000-0000-000000000003",
      name: "Bruno Silva",
      email: "financeiro@rba.com",
      role: "Financeiro",
      active: true,
      created_at: "2026-05-21T09:00:00Z",
      updated_at: "2026-05-21T09:00:00Z"
    },
    {
      id: "prof_4",
      user_id: "00000000-0000-0000-0000-000000000004",
      name: "Carlos Santos",
      email: "auditor@rba.com",
      role: "Consulta/Auditoria",
      active: true,
      created_at: "2026-05-22T14:15:00Z",
      updated_at: "2026-05-22T14:15:00Z"
    }
  ],
  drivers: [
    {
      id: "drv_1",
      name: "José Roberto de Almeida",
      cpf: "12345678909",
      rg: "12345678X",
      phone: "11988887777",
      bank_name: "Banco do Brasil",
      bank_agency: "1234",
      bank_account: "54321-0",
      pix_key: "12345678909",
      beneficiary_name: "José Roberto de Almeida",
      beneficiary_document: "12345678909",
      status: "Ativo",
      notes: "Motorista de confiança, carreta graneleiro.",
      created_at: "2026-05-20T11:00:00Z",
      updated_at: "2026-05-20T11:00:00Z"
    },
    {
      id: "drv_2",
      name: "Marcos Vinicius Santos",
      cpf: "11144477735",
      rg: "987654321",
      phone: "31977776666",
      bank_name: "Banco Itaú",
      bank_agency: "0432",
      bank_account: "10987-6",
      pix_key: "marcos@gmail.com",
      beneficiary_name: "Marcos Vinicius Santos",
      beneficiary_document: "11144477735",
      status: "Ativo",
      notes: "Sempre pontual na rota São Paulo x Salvador.",
      created_at: "2026-05-21T11:15:00Z",
      updated_at: "2026-05-21T11:15:00Z"
    },
    {
      id: "drv_3",
      name: "Antônio Ferreira",
      cpf: "93541134780",
      rg: "4567891",
      phone: "41966665555",
      bank_name: "Banco Bradesco",
      bank_agency: "0101",
      bank_account: "89898-9",
      pix_key: "93541134780",
      beneficiary_name: "Maria Ferreira (Esposa)",
      beneficiary_document: "39053344705",
      status: "Ativo",
      notes: "Pix em nome da esposa conforme autorização.",
      created_at: "2026-05-22T13:40:00Z",
      updated_at: "2026-05-22T13:40:00Z"
    },
    {
      id: "drv_4",
      name: "Claudio de Souza",
      cpf: "39053344705",
      rg: "9912831",
      phone: "21955554444",
      bank_name: "Nubank",
      bank_agency: "0001",
      bank_account: "123123-1",
      pix_key: "claudio@outlook.com",
      beneficiary_name: "Claudio de Souza",
      beneficiary_document: "39053344705",
      status: "Bloqueado",
      notes: "Bloqueado temporariamente por sinistro anterior.",
      created_at: "2026-05-23T15:20:00Z",
      updated_at: "2026-05-23T15:20:00Z"
    }
  ],
  vehicles: [
    {
      id: "vhc_1",
      tractor_plate: "ABC1D23",
      trailer_plate: "XYZ9W87",
      year: 2021,
      model: "Volvo FH 540",
      owner_name: "José Roberto de Almeida",
      owner_document: "12345678909",
      antt: "123456789",
      renavam: "01234567890",
      uf: "SP",
      status: "Ativo",
      notes: "Cavalo e carreta em perfeito estado.",
      created_at: "2026-05-20T11:05:00Z",
      updated_at: "2026-05-20T11:05:00Z"
    },
    {
      id: "vhc_2",
      tractor_plate: "MNO4X56",
      trailer_plate: "PQR1A23",
      year: 2019,
      model: "Scania R 450",
      owner_name: "RBA Transportes Ltda",
      owner_document: "01.234.567/0001-95",
      antt: "987654321",
      renavam: "09876543211",
      uf: "MG",
      status: "Ativo",
      notes: "Frota própria RBA.",
      created_at: "2026-05-21T11:20:00Z",
      updated_at: "2026-05-21T11:20:00Z"
    },
    {
      id: "vhc_3",
      tractor_plate: "DEF5G67",
      trailer_plate: "JKL3M45",
      year: 2018,
      model: "Mercedes-Benz Actros",
      owner_name: "Transportes Rapido Sul",
      owner_document: "12.345.678/0001-95",
      antt: "456123789",
      renavam: "44455566677",
      uf: "PR",
      status: "Ativo",
      notes: "Agenciado fixo.",
      created_at: "2026-05-22T13:45:00Z",
      updated_at: "2026-05-22T13:45:00Z"
    }
  ],
  clients: [
    {
      id: "cli_1",
      name: "Ambev S.A.",
      document: "07.526.557/0001-00",
      phone: "1130001000",
      email: "logistica@ambev.com.br",
      address: "Av. Renato Paes de Barros, 1017 - Itaim Bibi, São Paulo - SP",
      notes: "Faturamento quinzenal.",
      created_at: "2026-05-20T11:10:00Z",
      updated_at: "2026-05-20T11:10:00Z"
    },
    {
      id: "cli_2",
      name: "Klabin S.A.",
      document: "89.637.492/0001-34",
      phone: "1138244000",
      email: "fretes@klabin.com.br",
      address: "Av. Brigadeiro Faria Lima, 4400 - São Paulo - SP",
      notes: "Cargas de bobina de papel. Exige lona limpa e cantoneiras.",
      created_at: "2026-05-21T11:30:00Z",
      updated_at: "2026-05-21T11:30:00Z"
    },
    {
      id: "cli_3",
      name: "Cargill Alimentos",
      document: "60.498.706/0001-57",
      phone: "1935431100",
      email: "transportes@cargill.com",
      address: "Rodovia Anhanguera, km 120 - Americana - SP",
      notes: "Grãos e cereais. Peso balança origem vs destino rigido.",
      created_at: "2026-05-22T13:50:00Z",
      updated_at: "2026-05-22T13:50:00Z"
    }
  ],
  freight_orders: [
    {
      id: "ord_1",
      order_number: "RBA-2026-0001",
      driver_id: "drv_1",
      vehicle_id: "vhc_1",
      client_id: "cli_1",
      freight_value: 12000.00,
      advance_value: 5000.00,
      cash_value: 2000.00,
      balance_value: 5000.00,
      loading_expense: 150.00,
      unloading_expense: 200.00,
      other_expenses: 50.00,
      total_expenses: 400.00,
      net_value: 4250.00,
      bank_data_snapshot: {
        bank_name: "Banco do Brasil",
        bank_agency: "1234",
        bank_account: "54321-0",
        pix_key: "12345678909",
        beneficiary_name: "José Roberto de Almeida"
      },
      buonny_status: "Aprovado",
      buonny_code: "BNY0000000000000001",
      cte_number: "CTE-10293",
      cte_value: 18500.00,
      cte_discount_percent: 10,
      shipment_release_status: "Carregando",
      shipment_release_limit: "Até 100.000",
      origin: "Jundiaí - SP",
      destination: "Cajamar - SP",
      delivery_date: "2026-06-03",
      emission_day: "30",
      emission_month: "Maio",
      emission_year: "26",
      responsible_name: "Ana Costa",
      buonny_responsible: "Morgan Ribeiro (Admin)",
      signature_url: "Assinado Digitalmente por Ana Costa",
      status: "Carregando",
      notes: "Carregamento de bebidas Ambev. Liberação autorizada Buonny ativa.",
      created_by: "Ana Costa",
      approved_by: "Morgan Ribeiro (Admin)",
      approved_at: "2026-05-30T14:00:00Z",
      created_at: "2026-05-30T10:00:00Z",
      updated_at: "2026-05-30T14:00:00Z"
    },
    {
      id: "ord_2",
      order_number: "RBA-2026-0002",
      driver_id: "drv_2",
      vehicle_id: "vhc_2",
      client_id: "cli_2",
      freight_value: 8500.00,
      advance_value: 4000.00,
      cash_value: 1000.00,
      balance_value: 3500.00,
      loading_expense: 100.00,
      unloading_expense: 150.00,
      other_expenses: 0.00,
      total_expenses: 250.00,
 net_value: 13120.00,
      bank_data_snapshot: {
        bank_name: "Banco Itaú",
        bank_agency: "0432",
        bank_account: "10987-6",
        pix_key: "marcos@gmail.com",
        beneficiary_name: "Marcos Vinicius Santos"
      },
      buonny_status: "Aprovado",
      buonny_code: "BNY0000000000000002",
      cte_number: "CTE-12831",
      cte_value: 24300.00,
      cte_discount_percent: 10,
      shipment_release_status: "Contratar",
      shipment_release_limit: "Até 200.000",
      origin: "Telêmaco Borba - PR",
      destination: "Mogi das Cruzes - SP",
      delivery_date: "2026-06-05",
      emission_day: "31",
      emission_month: "Maio",
      emission_year: "26",
      responsible_name: "Ana Costa",
      buonny_responsible: "Ana Costa",
      signature_url: "",
      status: "Contratar",
      notes: "Aguardando liberação do sinistro.",
      created_by: "Ana Costa",
      approved_by: "",
      approved_at: "",
      created_at: "2026-05-31T09:30:00Z",
      updated_at: "2026-05-31T09:30:00Z"
    }
  ],
  freight_payments: [
    {
      id: "pay_1",
      freight_order_id: "ord_1",
      type: "Adiantamento",
      amount: 5000.00,
      payment_date: "2026-05-30",
      payment_method: "Pix",
      proof_url: "https://picsum.photos/seed/comp1/600/400",
      status: "Pago",
      notes: "Adiantamento liberado pelo financeiro.",
      created_at: "2026-05-30T15:00:00Z",
      updated_at: "2026-05-30T15:00:00Z"
    },
    {
      id: "pay_2",
      freight_order_id: "ord_1",
      type: "Taxa de Carga",
      amount: 150.00,
      payment_date: "2026-05-30",
      payment_method: "Dinheiro",
      proof_url: "",
      status: "Pago",
      notes: "Pago em mãos na portaria.",
      created_at: "2026-05-30T15:05:00Z",
      updated_at: "2026-05-30T15:05:00Z"
    }
  ],
  freight_order_attachments: [
    {
      id: "att_1",
      freight_order_id: "ord_1",
      file_name: "CTE-10293.pdf",
      file_url: "https://picsum.photos/seed/cte/600/400",
      file_type: "application/pdf",
      uploaded_by: "Ana Costa",
      created_at: "2026-05-30T11:00:00Z"
    },
    {
      id: "att_2",
      freight_order_id: "ord_1",
      file_name: "doc_veiculo.pdf",
      file_url: "https://picsum.photos/seed/veiculo/600/400",
      file_type: "application/pdf",
      uploaded_by: "Ana Costa",
      created_at: "2026-05-30T11:05:00Z"
    }
  ],
  audit_logs: [
    {
      id: "log_1",
      user_id: "user_operacional",
      user_name: "Ana Costa",
      action: "Criar",
      entity: "Ordem de Frete",
      entity_id: "ord_1",
      old_data: "",
      new_data: "Criação da primeira ordem RBA-2026-0001",
      created_at: "2026-05-30T10:00:00Z"
    },
    {
      id: "log_2",
      user_id: "user_admin",
      user_name: "Morgan Ribeiro (Admin)",
      action: "Aprovar",
      entity: "Ordem de Frete",
      entity_id: "ord_1",
      old_data: "Status: Em Análise",
      new_data: "Status: Liberado para Embarque",
      created_at: "2026-05-30T14:00:00Z"
    }
  ],
  app_settings: [
    {
      key: "company_name",
      value: "RBA Transporte e Logística",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      key: "company_document",
      value: "12.345.678/0001-90",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      key: "support_phone",
      value: "(11) 4004-9281",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      key: "insurance_policy_number",
      value: "BR-TOKIO-903124A",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      key: "allow_negative_balance_override",
      value: "true",
      updated_at: "2026-05-20T10:00:00Z"
    },
    {
      key: "block_on_risk_alert",
      value: "true",
      updated_at: "2026-05-20T10:00:00Z"
    }
  ]
};

export class RBADatabase {
  private static load(): Database {
    if (isServerlessRuntime && !isSupabaseServerConfigured) {
      throw new Error('Supabase não configurado no ambiente serverless. Fallback local desativado para evitar perda de dados.');
    }
    if (!fs.existsSync(DB_PATH)) {
      try {
        this.save(initialDB);
      } catch (e) {
        console.warn("Could not save initial database file, using in-memory:", e);
      }
      return initialDB;
    }
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      try {
        this.save(initialDB);
      } catch (saveErr) {
        console.warn("Could not save fallback database file:", saveErr);
      }
      return initialDB;
    }
  }

  private static save(db: Database) {
    if (isServerlessRuntime) {
      throw new Error('Gravação local desativada em ambiente serverless. Configure Supabase para persistência.');
    }
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.warn("Could not write to local database file (likely read-only environment):", e);
    }
  }

  // Auditing Helper
  public static async addAuditLog(userId: string, userName: string, action: string, entity: string, entityId: string, oldData: any, newData: any) {
    if (isSupabaseServerConfigured) {
      const { error } = await supabaseServer
        .from('audit_logs')
        .insert({
          id: generateId('log'),
          user_id: userId,
          user_name: userName,
          action,
          entity,
          entity_id: entityId,
          old_data: JSON.stringify(oldData || {}),
          new_data: JSON.stringify(newData || {}),
          created_at: new Date().toISOString()
        });
      if (!error) return;
    }

    const db = this.load();
    const newLog: AuditLog = {
      id: generateId('log'),
      user_id: userId,
      user_name: userName,
      action,
      entity,
      entity_id: entityId,
      old_data: JSON.stringify(oldData || {}),
      new_data: JSON.stringify(newData || {}),
      created_at: new Date().toISOString()
    };
    db.audit_logs.unshift(newLog);
    this.save(db);
  }

  // Settings
  public static async getSettings() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('app_settings').select('*');
      if (error) throwSupabaseError('Erro ao listar configurações', error);
      if (!error && data) return data as AppSetting[];
    }
    return this.load().app_settings;
  }

  public static async updateSettings(settings: Record<string, string>, operatorId: string, operatorName: string) {
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value: String(value ?? '') }));

    if (isSupabaseServerConfigured) {
      const oldVal = await this.getSettings();
      const { data, error } = await supabaseServer
        .from('app_settings')
        .upsert(entries, { onConflict: 'key' })
        .select();
      if (error) throwSupabaseError('Erro ao salvar configurações', error);
      await this.addAuditLog(operatorId, operatorName, 'Atualizar Configurações', 'Configurações', 'app_settings', oldVal, data);
      return data as AppSetting[];
    }

    const db = this.load();
    const oldVal = [...db.app_settings];
    for (const entry of entries) {
      const idx = db.app_settings.findIndex(setting => setting.key === entry.key);
      if (idx >= 0) {
        db.app_settings[idx] = { ...db.app_settings[idx], ...entry, updated_at: new Date().toISOString() };
      } else {
        db.app_settings.push({ ...entry, updated_at: new Date().toISOString() });
      }
    }
    this.save(db);
    await this.addAuditLog(operatorId, operatorName, 'Atualizar Configurações', 'Configurações', 'app_settings', oldVal, db.app_settings);
    return db.app_settings;
  }

  // Profiles and user management
  public static async getProfiles() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('profiles').select('*');
      if (!error && data) return data as Profile[];
    }
    return this.load().profiles;
  }

  public static async updateProfileRole(id: string, role: Profile['role'], active: boolean, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('profiles').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { data, error } = await supabaseServer
        .from('profiles')
        .update({ role, active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Atualizar Perfil", "Perfil de Usuário", id, oldVal, data);
        return data as Profile;
      }
    }

    const db = this.load();
    const idx = db.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.profiles[idx] };
      db.profiles[idx].role = role;
      db.profiles[idx].active = active;
      db.profiles[idx].updated_at = new Date().toISOString();
      await this.addAuditLog(operatorId, operatorName, "Atualizar Perfil", "Perfil de Usuário", id, oldVal, db.profiles[idx]);
      this.save(db);
      return db.profiles[idx];
    }
    throw new Error("Perfil não encontrado");
  }

  public static async getProfileByEmail(email: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('profiles').select('*').eq('email', email).limit(1);
      if (!error && data && data.length > 0) return data[0] as Profile;
    }
    return this.load().profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  // Drivers CRUD
  public static async getDrivers() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('drivers').select('*').order('name', { ascending: true });
      if (error) throwSupabaseError('Erro ao listar motoristas', error);
      if (!error && data) return data as Driver[];
    }
    return [...this.load().drivers].sort((a, b) => a.name.localeCompare(b.name));
  }

  public static async getDriverById(id: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('drivers').select('*').eq('id', id).limit(1);
      if (error) throwSupabaseError('Erro ao buscar motorista', error);
      if (!error && data && data.length > 0) return data[0] as Driver;
      return undefined;
    }
    return this.load().drivers.find(d => d.id === id);
  }

  public static async createDriver(driverData: Omit<Driver, 'id' | 'created_at' | 'updated_at'>, operatorId: string, operatorName: string) {
    const newId = generateId('drv');
    const cleanPayload = {
      ...driverData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseServer
        .from('drivers')
        .insert(cleanPayload)
        .select()
        .single();
      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Criar Motorista", "Motorista", newId, null, data);
        return data as Driver;
      }
      throwSupabaseError('Erro ao criar motorista', error);
    }

    const db = this.load();
    const newDriver: Driver = cleanPayload as Driver;
    db.drivers.push(newDriver);
    await this.addAuditLog(operatorId, operatorName, "Criar Motorista", "Motorista", newDriver.id, null, newDriver);
    this.save(db);
    return newDriver;
  }

  public static async updateDriver(id: string, driverData: Partial<Driver>, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('drivers').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { data, error } = await supabaseServer
        .from('drivers')
        .update({ ...driverData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Editar Motorista", "Motorista", id, oldVal, data);
        return data as Driver;
      }
      throwSupabaseError('Erro ao editar motorista', error);
    }

    const db = this.load();
    const idx = db.drivers.findIndex(d => d.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.drivers[idx] };
      db.drivers[idx] = {
        ...db.drivers[idx],
        ...driverData,
        updated_at: new Date().toISOString()
      };
      await this.addAuditLog(operatorId, operatorName, "Editar Motorista", "Motorista", id, oldVal, db.drivers[idx]);
      this.save(db);
      return db.drivers[idx];
    }
    throw new Error("Motorista não encontrado");
  }

  public static async deleteDriver(id: string, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { count, error: countError } = await supabaseServer
        .from('freight_orders')
        .select('id', { count: 'exact', head: true })
        .eq('driver_id', id);
      if (countError) throwSupabaseError('Erro ao verificar vínculos do motorista', countError);
      if ((count || 0) > 0) {
        throw new Error('Motorista possui fichas de frete vinculadas e não pode ser excluído.');
      }

      const { data: oldValArray } = await supabaseDataClient().from('drivers').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { error } = await supabaseDataClient().from('drivers').delete().eq('id', id);
      if (!error) {
        await this.addAuditLog(operatorId, operatorName, "Excluir Motorista", "Motorista", id, oldVal, null);
        return true;
      }
      throwSupabaseError('Erro ao excluir motorista', error);
    }

    const db = this.load();
    if (db.freight_orders.some(o => o.driver_id === id)) {
      throw new Error('Motorista possui fichas de frete vinculadas e não pode ser excluído.');
    }
    const idx = db.drivers.findIndex(d => d.id === id);
    if (idx !== -1) {
      const oldVal = db.drivers[idx];
      db.drivers.splice(idx, 1);
      await this.addAuditLog(operatorId, operatorName, "Excluir Motorista", "Motorista", id, oldVal, null);
      this.save(db);
      return true;
    }
    return false;
  }

  // Vehicles CRUD
  public static async getVehicles() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('vehicles').select('*').order('model', { ascending: true });
      if (error) throwSupabaseError('Erro ao listar veículos', error);
      if (!error && data) return data as Vehicle[];
    }
    return [...this.load().vehicles].sort((a, b) => `${a.model} ${a.tractor_plate}`.localeCompare(`${b.model} ${b.tractor_plate}`));
  }

  public static async getVehicleById(id: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('vehicles').select('*').eq('id', id).limit(1);
      if (error) throwSupabaseError('Erro ao buscar veículo', error);
      if (!error && data && data.length > 0) return data[0] as Vehicle;
      return undefined;
    }
    return this.load().vehicles.find(v => v.id === id);
  }

  public static async createVehicle(vData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>, operatorId: string, operatorName: string) {
    const newId = generateId('vhc');
    const cleanPayload = {
      ...vData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseServer
        .from('vehicles')
        .insert(cleanPayload)
        .select()
        .single();
      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Criar Veículo", "Veículo", newId, null, data);
        return data as Vehicle;
      }
      throwSupabaseError('Erro ao criar veículo', error);
    }

    const db = this.load();
    const newVehicle: Vehicle = cleanPayload as Vehicle;
    db.vehicles.push(newVehicle);
    await this.addAuditLog(operatorId, operatorName, "Criar Veículo", "Veículo", newVehicle.id, null, newVehicle);
    this.save(db);
    return newVehicle;
  }

  public static async updateVehicle(id: string, vData: Partial<Vehicle>, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('vehicles').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { data, error } = await supabaseServer
        .from('vehicles')
        .update({ ...vData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Editar Veículo", "Veículo", id, oldVal, data);
        return data as Vehicle;
      }
      throwSupabaseError('Erro ao editar veículo', error);
    }

    const db = this.load();
    const idx = db.vehicles.findIndex(v => v.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.vehicles[idx] };
      db.vehicles[idx] = {
        ...db.vehicles[idx],
        ...vData,
        updated_at: new Date().toISOString()
      };
      await this.addAuditLog(operatorId, operatorName, "Editar Veículo", "Veículo", id, oldVal, db.vehicles[idx]);
      this.save(db);
      return db.vehicles[idx];
    }
    throw new Error("Veículo não encontrado");
  }

  public static async deleteVehicle(id: string, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { count, error: countError } = await supabaseServer
        .from('freight_orders')
        .select('id', { count: 'exact', head: true })
        .eq('vehicle_id', id);
      if (countError) throwSupabaseError('Erro ao verificar vínculos do veículo', countError);
      if ((count || 0) > 0) {
        throw new Error('Veículo possui fichas de frete vinculadas e não pode ser excluído.');
      }

      const { data: oldValArray } = await supabaseDataClient().from('vehicles').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { error } = await supabaseDataClient().from('vehicles').delete().eq('id', id);
      if (!error) {
        await this.addAuditLog(operatorId, operatorName, "Excluir Veículo", "Veículo", id, oldVal, null);
        return true;
      }
      throwSupabaseError('Erro ao excluir veículo', error);
    }

    const db = this.load();
    if (db.freight_orders.some(o => o.vehicle_id === id)) {
      throw new Error('Veículo possui fichas de frete vinculadas e não pode ser excluído.');
    }
    const idx = db.vehicles.findIndex(v => v.id === id);
    if (idx !== -1) {
      const oldVal = db.vehicles[idx];
      db.vehicles.splice(idx, 1);
      await this.addAuditLog(operatorId, operatorName, "Excluir Veículo", "Veículo", id, oldVal, null);
      this.save(db);
      return true;
    }
    return false;
  }

  // Clients CRUD
  public static async getClients() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('clients').select('*').order('name', { ascending: true });
      if (error) throwSupabaseError('Erro ao listar clientes', error);
      if (!error && data) return data as Client[];
    }
    return [...this.load().clients].sort((a, b) => a.name.localeCompare(b.name));
  }

  public static async getClientById(id: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('clients').select('*').eq('id', id).limit(1);
      if (error) throwSupabaseError('Erro ao buscar cliente', error);
      if (!error && data && data.length > 0) return data[0] as Client;
      return undefined;
    }
    return this.load().clients.find(c => c.id === id);
  }

  public static async createClient(cData: Omit<Client, 'id' | 'created_at' | 'updated_at'>, operatorId: string, operatorName: string) {
    const newId = generateId('cli');
    const cleanPayload = {
      ...cData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseServer
        .from('clients')
        .insert(cleanPayload)
        .select()
        .single();
      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Criar Cliente", "Cliente", newId, null, data);
        return data as Client;
      }
      throwSupabaseError('Erro ao criar cliente', error);
    }

    const db = this.load();
    const newClient: Client = cleanPayload as Client;
    db.clients.push(newClient);
    await this.addAuditLog(operatorId, operatorName, "Criar Cliente", "Cliente", newClient.id, null, newClient);
    this.save(db);
    return newClient;
  }

  public static async updateClient(id: string, cData: Partial<Client>, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('clients').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { data, error } = await supabaseServer
        .from('clients')
        .update({ ...cData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Editar Cliente", "Cliente", id, oldVal, data);
        return data as Client;
      }
      throwSupabaseError('Erro ao editar cliente', error);
    }

    const db = this.load();
    const idx = db.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.clients[idx] };
      db.clients[idx] = {
        ...db.clients[idx],
        ...cData,
        updated_at: new Date().toISOString()
      };
      await this.addAuditLog(operatorId, operatorName, "Editar Cliente", "Cliente", id, oldVal, db.clients[idx]);
      this.save(db);
      return db.clients[idx];
    }
    throw new Error("Cliente não encontrado");
  }

  public static async deleteClient(id: string, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { count, error: countError } = await supabaseServer
        .from('freight_orders')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', id);
      if (countError) throwSupabaseError('Erro ao verificar vínculos do cliente', countError);
      if ((count || 0) > 0) {
        throw new Error('Cliente possui fichas de frete vinculadas e não pode ser excluído.');
      }

      const { data: oldValArray } = await supabaseDataClient().from('clients').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { error } = await supabaseDataClient().from('clients').delete().eq('id', id);
      if (!error) {
        await this.addAuditLog(operatorId, operatorName, "Excluir Cliente", "Cliente", id, oldVal, null);
        return true;
      }
      throwSupabaseError('Erro ao excluir cliente', error);
    }

    const db = this.load();
    if (db.freight_orders.some(o => o.client_id === id)) {
      throw new Error('Cliente possui fichas de frete vinculadas e não pode ser excluído.');
    }
    const idx = db.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      const oldVal = db.clients[idx];
      db.clients.splice(idx, 1);
      await this.addAuditLog(operatorId, operatorName, "Excluir Cliente", "Cliente", id, oldVal, null);
      this.save(db);
      return true;
    }
    return false;
  }

  // Freight Orders CRUD
  public static async getFreightOrders(options: { page?: number; pageSize?: number; status?: string; driverId?: string; clientId?: string; search?: string } = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 50));
    if (isSupabaseServerConfigured) {
      let query = supabaseServer
        .from('freight_orders')
        .select('*')
        .order('cte_number', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (options.status) query = query.eq('status', options.status);
      if (options.driverId) query = query.eq('driver_id', options.driverId);
      if (options.clientId) query = query.eq('client_id', options.clientId);
      if (options.search) {
        const term = options.search.replace(/[%_]/g, '').trim();
        if (term) {
          query = query.or(`order_number.ilike.%${term}%,cte_number.ilike.%${term}%,origin.ilike.%${term}%,destination.ilike.%${term}%`);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await query.range(from, to);
      if (error) throwSupabaseError('Erro ao listar ordens', error);
      if (!error && data) {
        return data.map(withFreightOrderDefaults);
      }
    }
    let orders = [...this.load().freight_orders].sort((a, b) => {
      const cteDiff = getCteSortValue(b.cte_number) - getCteSortValue(a.cte_number);
      if (cteDiff !== 0) return cteDiff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    if (options.status) orders = orders.filter(o => o.status === options.status);
    if (options.driverId) orders = orders.filter(o => o.driver_id === options.driverId);
    if (options.clientId) orders = orders.filter(o => o.client_id === options.clientId);
    if (options.search) {
      const term = options.search.toLowerCase();
      orders = orders.filter(o =>
        o.order_number?.toLowerCase().includes(term) ||
        o.cte_number?.toLowerCase().includes(term) ||
        o.origin?.toLowerCase().includes(term) ||
        o.destination?.toLowerCase().includes(term)
      );
    }
    return orders.slice((page - 1) * pageSize, page * pageSize).map(withFreightOrderDefaults);
  }

  public static async getFreightOrderById(id: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('freight_orders').select('*').eq('id', id).limit(1);
      if (error) throwSupabaseError('Erro ao buscar ordem', error);
      if (!error && data && data.length > 0) {
        return withFreightOrderDefaults(data[0]);
      }
      return undefined;
    }
    const order = this.load().freight_orders.find(o => o.id === id);
    return order ? withFreightOrderDefaults(order) : undefined;
  }

  public static async createFreightOrder(orderData: Omit<FreightOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'total_expenses' | 'net_value'>, operatorId: string, operatorName: string) {
    const financials = calculateFreightOrderFinancials(orderData);
    const { cte_discount_value: _cteDiscountValue, net_revenue: _netRevenue, ...persistedFinancials } = financials;
    const newId = generateId('ord');
    const year = new Date().getFullYear();

    // Get counter from the active datastore to avoid duplicate order numbers.
    let existingOrders: Pick<FreightOrder, 'order_number'>[];
    if (isSupabaseServerConfigured) {
      const { data: orderNumbers, error: orderNumbersError } = await supabaseServer
        .from('freight_orders')
        .select('order_number');

      if (orderNumbersError) {
        throw new Error(`Erro ao gerar número da ordem no Supabase: ${orderNumbersError.message}`);
      }
      existingOrders = orderNumbers || [];
    } else {
      existingOrders = this.load().freight_orders;
    }
    const buildPayload = (orderNumber: string) => ({
      ...orderData,
      id: newId,
      order_number: orderNumber,
      approved_at: orderData.approved_at || null,
      ...persistedFinancials,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (isSupabaseServerConfigured) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const sequence = nextFreightOrderSequence(existingOrders);
        const orderNumber = `RBA-${year}-${String(sequence).padStart(4, '0')}`;
        const cleanPayload = buildPayload(orderNumber);
        const { data, error } = await supabaseServer
          .from('freight_orders')
          .insert(cleanPayload)
          .select()
          .single();
        if (!error && data) {
          // Auto-create initial advance payments if specified
        if (financials.advance_value > 0) {
            const newPayId = generateId('pay');
            await supabaseDataClient().from('freight_payments').insert({
              id: newPayId,
              freight_order_id: newId,
              type: 'Adiantamento',
            amount: financials.advance_value,
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: 'Pix',
              proof_url: '',
              status: 'Pendente',
              notes: 'Adiantamento gerado automaticamente a aprovar.',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          const paidAutomaticPayments = buildAutomaticFreightPayments(newId, {
            ...financials,
            advance_value: 0,
          });
          if (paidAutomaticPayments.length > 0) {
            await supabaseDataClient().from('freight_payments').insert(paidAutomaticPayments);
          }
          await this.addAuditLog(operatorId, operatorName, "Criar Ordem Frete", "Ordem de Frete", newId, null, data);
          return data as FreightOrder;
        }
        if (!isUniqueViolation(error)) {
          throw new Error(`Erro ao salvar ordem no Supabase: ${error?.message || 'erro desconhecido'}`);
        }
        const { data: latestOrderNumbers, error: latestError } = await supabaseServer
          .from('freight_orders')
          .select('order_number');
        if (latestError) throw new Error(`Erro ao regerar número da ordem no Supabase: ${latestError.message}`);
        existingOrders = latestOrderNumbers || [];
      }
      throw new Error('Conflito ao gerar número da ordem após múltiplas tentativas. Tente salvar novamente.');
    }

    const db = this.load();
    const sequence = nextFreightOrderSequence(existingOrders);
    const orderNumber = `RBA-${year}-${String(sequence).padStart(4, '0')}`;
    const cleanPayload = buildPayload(orderNumber);
    const newOrder: FreightOrder = cleanPayload as FreightOrder;
    db.freight_orders.push(newOrder);

    if (newOrder.advance_value > 0) {
      const newPay: FreightPayment = {
        id: generateId('pay'),
        freight_order_id: newOrder.id,
        type: 'Adiantamento',
        amount: newOrder.advance_value,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Pix',
        proof_url: '',
        status: 'Pendente',
        notes: 'Adiantamento gerado automaticamente a aprovar.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.freight_payments.push(newPay);
    }
    db.freight_payments.push(...buildAutomaticFreightPayments(newOrder.id, {
      ...financials,
      advance_value: 0,
    }));

    await this.addAuditLog(operatorId, operatorName, "Criar Ordem Frete", "Ordem de Frete", newOrder.id, null, newOrder);
    this.save(db);
    return newOrder;
  }

  public static async updateFreightOrder(id: string, orderData: Partial<FreightOrder>, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('freight_orders').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;
      const baseObj = { ...oldVal, ...orderData };
      const financials = calculateFreightOrderFinancials(baseObj);
      const { cte_discount_value: _cteDiscountValue, net_revenue: _netRevenue, ...persistedFinancials } = financials;

      let approvedBy = baseObj.approved_by || null;
      let approvedAt = baseObj.approved_at || null;
    if (orderData.status && orderData.status !== 'Contratar' && oldVal?.status === 'Contratar') {
      approvedBy = operatorName;
      approvedAt = new Date().toISOString();
    }

      const updatePayload = {
        ...orderData,
        ...persistedFinancials,
        approved_by: approvedBy,
        approved_at: approvedAt,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseServer
        .from('freight_orders')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Editar Ordem Frete", "Ordem de Frete", id, oldVal, data);
        return data as FreightOrder;
      }
      throw new Error(`Erro ao atualizar ordem no Supabase: ${error?.message || 'erro desconhecido'}`);
    }

    const db = this.load();
    const idx = db.freight_orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.freight_orders[idx] };
      const baseObj = { ...db.freight_orders[idx], ...orderData };
      const financials = calculateFreightOrderFinancials(baseObj);
      const { cte_discount_value: _cteDiscountValue, net_revenue: _netRevenue, ...persistedFinancials } = financials;

      let approvedBy = baseObj.approved_by || '';
      let approvedAt = baseObj.approved_at || '';
    if (orderData.status && orderData.status !== 'Contratar' && oldVal.status === 'Contratar') {
      approvedBy = operatorName;
      approvedAt = new Date().toISOString();
    }

      db.freight_orders[idx] = {
        ...baseObj,
        ...persistedFinancials,
        approved_by: approvedBy,
        approved_at: approvedAt,
        updated_at: new Date().toISOString()
      };

      await this.addAuditLog(operatorId, operatorName, "Editar Ordem Frete", "Ordem de Frete", id, oldVal, db.freight_orders[idx]);
      this.save(db);
      return db.freight_orders[idx];
    }
    throw new Error("Ordem de frete não encontrada");
  }

  public static async deleteFreightOrder(id: string, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('freight_orders').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { error } = await supabaseDataClient().from('freight_orders').delete().eq('id', id);
      if (!error) {
        await this.addAuditLog(operatorId, operatorName, "Excluir Ordem Frete", "Ordem de Frete", id, oldVal, null);
        return true;
      }
    }

    const db = this.load();
    const idx = db.freight_orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      const oldVal = db.freight_orders[idx];
      db.freight_orders.splice(idx, 1);
      await this.addAuditLog(operatorId, operatorName, "Excluir Ordem Frete", "Ordem de Frete", id, oldVal, null);
      this.save(db);
      return true;
    }
    return false;
  }

  // Payments CRUD
  public static async getPayments() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('freight_payments').select('*');
      if (error) throwSupabaseError('Erro ao listar pagamentos', error);
      if (!error && data) return data as FreightPayment[];
    }
    return this.load().freight_payments;
  }

  public static async getPaymentsByOrderId(orderId: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('freight_payments').select('*').eq('freight_order_id', orderId);
      if (error) throwSupabaseError('Erro ao listar pagamentos da ordem', error);
      if (!error && data) return data as FreightPayment[];
    }
    return this.load().freight_payments.filter(p => p.freight_order_id === orderId);
  }

  private static async syncOrderPaymentStatus(orderId: string, operatorId: string, operatorName: string) {
    const order = await this.getFreightOrderById(orderId);
    if (!order) return;

    const payments = await this.getPaymentsByOrderId(orderId);
    const paidTotal = payments
      .filter(p => p.status === 'Pago')
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const freightValue = Number(order.freight_value) || 0;

    if (freightValue > 0 && paidTotal >= freightValue && order.status !== 'Entregue') {
      await this.updateFreightOrder(orderId, { status: 'Entregue' }, operatorId, operatorName);
      return;
    }

  }

  public static async createPayment(payData: Omit<FreightPayment, 'id' | 'created_at' | 'updated_at'>, operatorId: string, operatorName: string) {
    const newId = generateId('pay');
    const cleanPayload = {
      ...payData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseServer
        .from('freight_payments')
        .insert(cleanPayload)
        .select()
        .single();
      if (!error && data) {
         // Also verify if the complete payload moves the order status to "Pago"
         await this.addAuditLog(operatorId, operatorName, "Registrar Pagamento", "Pagamentos do Frete", newId, null, data);
         await this.syncOrderPaymentStatus(payData.freight_order_id, operatorId, operatorName);
         return data as FreightPayment;
      }
      throwSupabaseError('Erro ao registrar pagamento', error);
    }

    const db = this.load();
    const newPay: FreightPayment = cleanPayload as FreightPayment;
    db.freight_payments.push(newPay);
    await this.addAuditLog(operatorId, operatorName, "Registrar Pagamento", "Pagamentos do Frete", newPay.id, null, newPay);
    this.save(db);
    await this.syncOrderPaymentStatus(newPay.freight_order_id, operatorId, operatorName);
    return newPay;
  }

  public static async updatePayment(id: string, payData: Partial<FreightPayment>, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('freight_payments').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { data, error } = await supabaseServer
        .from('freight_payments')
        .update({ ...payData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        await this.addAuditLog(operatorId, operatorName, "Editar Pagamento", "Pagamentos do Frete", id, oldVal, data);
        await this.syncOrderPaymentStatus(data.freight_order_id, operatorId, operatorName);
        return data as FreightPayment;
      }
      throwSupabaseError('Erro ao editar pagamento', error);
    }

    const db = this.load();
    const idx = db.freight_payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      const oldVal = { ...db.freight_payments[idx] };
      db.freight_payments[idx] = {
        ...db.freight_payments[idx],
        ...payData,
        updated_at: new Date().toISOString()
      };
      await this.addAuditLog(operatorId, operatorName, "Editar Pagamento", "Pagamentos do Frete", id, oldVal, db.freight_payments[idx]);
      this.save(db);
      await this.syncOrderPaymentStatus(db.freight_payments[idx].freight_order_id, operatorId, operatorName);
      return db.freight_payments[idx];
    }
    throw new Error("Pagamento não encontrado");
  }

  public static async deletePayment(id: string, operatorId: string, operatorName: string) {
    if (isSupabaseServerConfigured) {
      const { data: oldValArray } = await supabaseDataClient().from('freight_payments').select('*').eq('id', id).limit(1);
      const oldVal = (oldValArray && oldValArray[0]) || null;

      const { error } = await supabaseDataClient().from('freight_payments').delete().eq('id', id);
      if (!error) {
        await this.addAuditLog(operatorId, operatorName, "Excluir Pagamento", "Pagamentos do Frete", id, oldVal, null);
        if (oldVal?.freight_order_id) await this.syncOrderPaymentStatus(oldVal.freight_order_id, operatorId, operatorName);
        return true;
      }
      throwSupabaseError('Erro ao excluir pagamento', error);
    }

    const db = this.load();
    const idx = db.freight_payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      const oldVal = db.freight_payments[idx];
      db.freight_payments.splice(idx, 1);
      await this.addAuditLog(operatorId, operatorName, "Excluir Pagamento", "Pagamentos do Frete", id, oldVal, null);
      this.save(db);
      await this.syncOrderPaymentStatus(oldVal.freight_order_id, operatorId, operatorName);
      return true;
    }
    return false;
  }

  // File Attachments
  public static async getAttachmentsByOrderId(orderId: string) {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('freight_order_attachments').select('*').eq('freight_order_id', orderId);
      if (error) throwSupabaseError('Erro ao listar anexos', error);
      if (!error && data) return data as FreightOrderAttachment[];
    }
    return this.load().freight_order_attachments.filter(a => a.freight_order_id === orderId);
  }

  public static async createAttachment(orderId: string, name: string, url: string, type: string, operatorName: string) {
    const newId = generateId('att');
    const cleanPayload = {
      id: newId,
      freight_order_id: orderId,
      file_name: name,
      file_url: url,
      file_type: type,
      uploaded_by: operatorName,
      created_at: new Date().toISOString()
    };

    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseServer
        .from('freight_order_attachments')
        .insert(cleanPayload)
        .select()
        .single();
      if (!error && data) return data as FreightOrderAttachment;
      throwSupabaseError('Erro ao criar anexo', error);
    }

    const db = this.load();
    const newAtt: FreightOrderAttachment = cleanPayload;
    db.freight_order_attachments.push(newAtt);
    this.save(db);
    return newAtt;
  }

  public static async deleteAttachment(id: string) {
    const removeLocalFile = (fileUrl?: string) => {
      if (!fileUrl?.startsWith('/uploads/')) return;
      const uploadPath = path.join(process.cwd(), 'public', fileUrl);
      if (uploadPath.startsWith(path.join(process.cwd(), 'public', 'uploads')) && fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    };

    if (isSupabaseServerConfigured) {
      const { data: oldValArray, error: selectError } = await supabaseServer
        .from('freight_order_attachments')
        .select('*')
        .eq('id', id)
        .limit(1);
      if (selectError) throwSupabaseError('Erro ao buscar anexo', selectError);

      const { error } = await supabaseDataClient().from('freight_order_attachments').delete().eq('id', id);
      if (!error) {
        removeLocalFile(oldValArray?.[0]?.file_url);
        return true;
      }
      throwSupabaseError('Erro ao excluir anexo', error);
    }

    const db = this.load();
    const idx = db.freight_order_attachments.findIndex(a => a.id === id);
    if (idx !== -1) {
      removeLocalFile(db.freight_order_attachments[idx].file_url);
      db.freight_order_attachments.splice(idx, 1);
      this.save(db);
      return true;
    }
    return false;
  }

  // Audit Logs Getter
  public static async getAuditLogs() {
    if (isSupabaseServerConfigured) {
      const { data, error } = await supabaseDataClient().from('audit_logs').select('*').order('created_at', { ascending: false });
      if (error) throwSupabaseError('Erro ao listar auditoria', error);
      if (!error && data) return data as AuditLog[];
    }
    return this.load().audit_logs;
  }
}
