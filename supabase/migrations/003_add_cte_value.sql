-- Adiciona o valor bruto do CTe (valor pago pela empresa contratante do frete).
-- Entra na memória de cálculo de faturamento, receitas e despesas.
ALTER TABLE freight_orders
    ADD COLUMN IF NOT EXISTS cte_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Percentual de desconto sobre o valor do CTe (padrão 10%, personalizável por ficha).
ALTER TABLE freight_orders
    ADD COLUMN IF NOT EXISTS cte_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00;
