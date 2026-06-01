-- 001_initial_schema.sql
-- Schema inicial para o RBA Fretes Digital

-- 1. PROFILES Table (Extensão para usuários cadastrados vinculados ao Auth ou simulated profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Administrador', 'Operacional', 'Financeiro', 'Consulta/Auditoria')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DRIVERS Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    rg TEXT NOT NULL,
    phone TEXT,
    bank_name TEXT NOT NULL,
    bank_agency TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    pix_key TEXT NOT NULL,
    beneficiary_name TEXT NOT NULL,
    beneficiary_document TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. VEHICLES Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    tractor_plate TEXT NOT NULL,
    trailer_plate TEXT,
    year INTEGER,
    model TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_document TEXT NOT NULL,
    antt TEXT,
    renavam TEXT,
    uf TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CLIENTS Table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. FREIGHT ORDERS Table
CREATE TABLE IF NOT EXISTS public.freight_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    driver_id TEXT REFERENCES public.drivers(id) ON DELETE RESTRICT,
    vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    client_id TEXT REFERENCES public.clients(id) ON DELETE RESTRICT,
    freight_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    advance_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    loading_expense NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unloading_expense NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bank_data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    buonny_status TEXT NOT NULL DEFAULT 'Em Análise' CHECK (buonny_status IN ('Aprovado', 'Em Análise', 'Reprovado')),
    pancary_status TEXT NOT NULL DEFAULT 'Em Análise' CHECK (pancary_status IN ('Aprovado', 'Em Análise', 'Reprovado')),
    cte_number TEXT,
    shipment_release_status TEXT NOT NULL DEFAULT 'Pendente' CHECK (shipment_release_status IN ('Liberado', 'Pendente', 'Bloqueado')),
    shipment_release_limit TEXT DEFAULT 'Até 100.000',
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    responsible_name TEXT NOT NULL,
    signature_url TEXT,
    status TEXT NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Em Análise', 'Aprovado', 'Liberado para Embarque', 'Em Viagem', 'Entregue', 'Pago', 'Cancelado')),
    notes TEXT,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FREIGHT ORDER ATTACHMENTS Table
CREATE TABLE IF NOT EXISTS public.freight_order_attachments (
    id TEXT PRIMARY KEY,
    freight_order_id TEXT REFERENCES public.freight_orders(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FREIGHT PAYMENTS Table
CREATE TABLE IF NOT EXISTS public.freight_payments (
    id TEXT PRIMARY KEY,
    freight_order_id TEXT REFERENCES public.freight_orders(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Adiantamento', 'Saldo', 'Taxa de Carga', 'À Vista', 'Reembolso', 'Outros')),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_date TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Pix', 'Transferência', 'Dinheiro', 'Cartão', 'Cheque')),
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Cancelado')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. FREIGHT EXPENSES Table
CREATE TABLE IF NOT EXISTS public.freight_expenses (
    id TEXT PRIMARY KEY,
    freight_order_id TEXT REFERENCES public.freight_orders(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expense_date TEXT NOT NULL,
    status TEXT DEFAULT 'Pago' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. AUDIT LOGS Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data TEXT,
    new_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. APP SETTINGS Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimize searches
CREATE INDEX IF NOT EXISTS idx_freight_orders_driver ON public.freight_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_freight_orders_client ON public.freight_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_freight_payments_order ON public.freight_payments(freight_order_id);
CREATE INDEX IF NOT EXISTS idx_freight_order_attachments ON public.freight_order_attachments(freight_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
