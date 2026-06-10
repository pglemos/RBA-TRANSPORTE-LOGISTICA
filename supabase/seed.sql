-- seed.sql
-- Dados de teste para inicializar o sistema RBA Fretes Digital no Supabase

-- 1. Inserir configurações do sistema
INSERT INTO public.app_settings (id, key, value, updated_at) VALUES 
('set_1', 'company_name', 'RBA Transporte e Logística', now()),
('set_2', 'allow_negative_balance_override', 'true', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Inserir perfis de usuário padrão
INSERT INTO public.profiles (id, user_id, name, email, role, active, created_at, updated_at) VALUES 
('prof_1', '00000000-0000-0000-0000-000000000001', 'Morgan Ribeiro (Admin)', 'admin@rba.com', 'Administrador', true, now(), now()),
('prof_2', '00000000-0000-0000-0000-000000000002', 'Ana Costa', 'operacional@rba.com', 'Operacional', true, now(), now()),
('prof_3', '00000000-0000-0000-0000-000000000003', 'Bruno Silva', 'financeiro@rba.com', 'Financeiro', true, now(), now()),
('prof_4', '00000000-0000-0000-0000-000000000004', 'Carlos Santos', 'auditor@rba.com', 'Consulta/Auditoria', true, now(), now())
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 3. Inserir Clientes
INSERT INTO public.clients (id, name, document, phone, email, address, notes, created_at, updated_at) VALUES 
('cli_1', 'Ambev S.A.', '07.526.557/0001-85', '1130001000', 'logistica@ambev.com.br', 'Av. Renato Paes de Barros, 1017 - Itaim Bibi, São Paulo - SP', 'Faturamento quinzenal.', now(), now()),
('cli_2', 'Klabin S.A.', '89.637.492/0001-10', '1138244000', 'fretes@klabin.com.br', 'Av. Brigadeiro Faria Lima, 4400 - São Paulo - SP', 'Cargas de bobina de papel. Exige lona limpa e cantoneiras.', now(), now()),
('cli_3', 'Cargill Alimentos', '60.498.706/0001-52', '1935431100', 'transportes@cargill.com', 'Rodovia Anhanguera, km 120 - Americana - SP', 'Grãos e cereais. Peso balança origem vs destino rigido.', now(), now())
ON CONFLICT (document) DO NOTHING;

-- 4. Inserir Motoristas
INSERT INTO public.drivers (id, name, cpf, rg, phone, bank_name, bank_agency, bank_account, pix_key, beneficiary_name, beneficiary_document, status, notes, created_at, updated_at) VALUES 
('drv_1', 'José Roberto de Almeida', '12345678909', '12345678X', '11988887777', 'Banco do Brasil', '1234', '54321-0', '12345678909', 'José Roberto de Almeida', '12345678909', 'Ativo', 'Motorista de confiança, carreta graneleiro.', now(), now()),
('drv_2', 'Marcos Vinicius Santos', '98765432101', '987654321', '31977776666', 'Banco Itaú', '0432', '10987-6', 'marcos@gmail.com', 'Marcos Vinicius Santos', '98765432101', 'Ativo', 'Sempre pontual na rota São Paulo x Salvador.', now(), now()),
('drv_3', 'Antônio Ferreira', '45678912345', '4567891', '41966665555', 'Banco Bradesco', '0101', '89898-9', '45678912345', 'Maria Ferreira (Esposa)', '98754321098', 'Ativo', 'Pix em nome da esposa conforme autorização.', now(), now()),
('drv_4', 'Claudio de Souza', '36925814725', '9912831', '21955554444', 'Nubank', '0001', '123123-1', 'claudio@outlook.com', 'Claudio de Souza', '36925814725', 'Bloqueado', 'Bloqueado temporariamente por sinistro anterior.', now(), now())
ON CONFLICT (cpf) DO NOTHING;

-- 5. Inserir Veículos
INSERT INTO public.vehicles (id, tractor_plate, trailer_plate, year, model, owner_name, owner_document, antt, renavam, uf, status, notes, created_at, updated_at) VALUES 
('vhc_1', 'ABC1D23', 'XYZ9W87', 2021, 'Volvo FH 540', 'José Roberto de Almeida', '12345678909', '123456789', '01234567890', 'SP', 'Ativo', 'Cavalo e carreta em perfeito estado.', now(), now()),
('vhc_2', 'MNO4X56', 'PQR1A23', 2019, 'Scania R 450', 'RBA Transportes Ltda', '01.234.567/0001-89', '987654321', '09876543211', 'MG', 'Ativo', 'Frota própria RBA.', now(), now()),
('vhc_3', 'DEF5G67', 'JKL3M45', 2018, 'Mercedes-Benz Actros', 'Transportes Rapido Sul', '12.345.678/0001-90', '456123789', '44455566677', 'PR', 'Ativo', 'Agenciado fixo.', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 6. Inserir Ordens de Fretes Ativas
INSERT INTO public.freight_orders (
    id, order_number, driver_id, vehicle_id, client_id, 
    freight_value, advance_value, cash_value, balance_value, 
    loading_expense, unloading_expense, other_expenses, total_expenses, net_value,
    bank_data_snapshot, buonny_status, buonny_code, cte_number,
    shipment_release_status, shipment_release_limit, origin, destination, 
    delivery_date, responsible_name, buonny_responsible, signature_url, status, notes, 
    created_by, approved_by, approved_at, created_at, updated_at
) VALUES 
('ord_1', 'RBA-2026-0001', 'drv_1', 'vhc_1', 'cli_1', 
 12000.00, 5000.00, 2000.00, 5000.00, 
 150.00, 200.00, 50.00, 400.00, 11600.00, 
 '{"bank_name": "Banco do Brasil", "bank_agency": "1234", "bank_account": "54321-0", "pix_key": "12345678909", "beneficiary_name": "José Roberto de Almeida"}'::jsonb, 
 'Aprovado', 'BNY0000000000000001', 'CTE-10293',
 'Liberado', 'Até 100.000', 'Jundiaí - SP', 'Cajamar - SP', 
 '2026-06-03', 'Ana Costa', 'Morgan Ribeiro (Admin)', 'Assinado Digitalmente por Ana Costa', 'Liberado para Embarque', 'Carregamento de bebidas Ambev. Liberação autorizada Buonny ativa.', 
 'Ana Costa', 'Morgan Ribeiro (Admin)', now(), now(), now()),
('ord_2', 'RBA-2026-0002', 'drv_2', 'vhc_2', 'cli_2', 
 8500.00, 4000.00, 1000.00, 3500.00, 
 100.00, 150.00, 0.00, 250.00, 8250.00, 
 '{"bank_name": "Banco Itaú", "bank_agency": "0432", "bank_account": "10987-6", "pix_key": "marcos@gmail.com", "beneficiary_name": "Marcos Vinicius Santos"}'::jsonb, 
 'Aprovado', 'BNY0000000000000002', 'CTE-12831',
 'Pendente', 'Até 200.000', 'Telêmaco Borba - PR', 'Mogi das Cruzes - SP', 
 '2026-06-05', 'Ana Costa', 'Ana Costa', NULL, 'Em Análise', 'Aguardando liberação do sinistro.',
 'Ana Costa', NULL, NULL, now(), now())
ON CONFLICT (order_number) DO NOTHING;

-- 7. Inserir Histórico de Pagamentos de Frete
INSERT INTO public.freight_payments (id, freight_order_id, type, amount, payment_date, payment_method, proof_url, status, notes, created_at, updated_at) VALUES 
('pay_1', 'ord_1', 'Adiantamento', 5000.00, '2026-05-30', 'Pix', 'https://picsum.photos/seed/comp1/600/400', 'Pago', 'Adiantamento liberado pelo financeiro.', now(), now()),
('pay_2', 'ord_1', 'Taxa de Carga', 150.00, '2026-05-30', 'Dinheiro', NULL, 'Pago', 'Pago em mãos na portaria.', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 8. Inserir Registro de Auditoria
INSERT INTO public.audit_logs (id, user_id, user_name, action, entity, entity_id, old_data, new_data, created_at) VALUES 
('log_1', 'user_operacional', 'Ana Costa', 'Criar', 'Ordem de Frete', 'ord_1', '{}', '{"msg": "Criação da primeira ordem RBA-2026-0001"}', now()),
('log_2', 'user_admin', 'Morgan Ribeiro (Admin)', 'Aprovar', 'Ordem de Frete', 'ord_1', '{"status": "Em Análise"}', '{"status": "Liberado para Embarque"}', now())
ON CONFLICT (id) DO NOTHING;
