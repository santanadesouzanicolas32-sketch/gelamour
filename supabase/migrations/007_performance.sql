-- Migração 007: Otimizações de performance
-- =====================================================

-- Full-text search em produtos (para busca futura)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', nome)) STORED;

CREATE INDEX IF NOT EXISTS idx_produtos_search ON produtos USING GIN(search_vector);

-- Índice em pedidos por cliente e data (queries do admin)
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_data
  ON pedidos(cliente_id, created_at DESC);

-- Índice em pedidos por status_pagamento (webhook lookup)
CREATE INDEX IF NOT EXISTS idx_pedidos_payment_status
  ON pedidos(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;

-- View de pedidos do dia
CREATE OR REPLACE VIEW pedidos_hoje AS
  SELECT * FROM pedidos
  WHERE created_at >= CURRENT_DATE
  ORDER BY created_at DESC;

-- Função para limpeza de sessões antigas (executar periodicamente)
CREATE OR REPLACE FUNCTION limpar_participacoes_expiradas()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM roleta_participacoes
  WHERE status = 'pendente'
    AND created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
