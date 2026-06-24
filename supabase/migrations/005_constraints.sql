-- Migracao 005: Constraints de integridade faltantes
-- Executar no SQL Editor do Supabase

-- Evitar telefones duplicados na tabela clientes
ALTER TABLE clientes ADD CONSTRAINT IF NOT EXISTS clientes_telefone_unique UNIQUE (telefone);

-- Evitar multiplas participacoes ativas por cliente por semana
CREATE UNIQUE INDEX IF NOT EXISTS idx_participacoes_cliente_semana_ativa
  ON roleta_participacoes(telefone, semana)
  WHERE status != 'rejeitado';

-- Garantir que roleta_config sempre tenha ao menos 1 linha
INSERT INTO roleta_config (ativa, premios, max_vencedores_semana)
SELECT TRUE, '["🎁 5% OFF — Compras acima de R$35","🍫 Brownie Tradicional Gratis — Compras acima de R$50","🎁 10% OFF — Compras acima de R$50","📸 Siga a Gelamour no Instagram","🛍️ Compre 2 e Leve — Ate R$14 em produtos","😕 Nao Foi Dessa Vez — Ganha 5% OFF acima de R$35"]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM roleta_config LIMIT 1);

COMMENT ON CONSTRAINT clientes_telefone_unique ON clientes
  IS 'Telefone e o identificador unico de cada cliente';
