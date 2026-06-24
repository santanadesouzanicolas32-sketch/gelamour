-- =====================================================
-- Migração 003: Índices de Performance
-- =====================================================

-- Índice para busca de vencedor na semana atual (usado na roleta)
CREATE INDEX IF NOT EXISTS idx_vencedores_semana_created
  ON roleta_vencedores(semana, created_at DESC);

-- Índice para evitar múltiplas participações no mesmo dia
CREATE INDEX IF NOT EXISTS idx_participacoes_tel_data
  ON roleta_participacoes(telefone, created_at DESC);

-- Índice para aprovações pendentes (painel admin)
CREATE INDEX IF NOT EXISTS idx_participacoes_pendentes
  ON roleta_participacoes(status, created_at DESC)
  WHERE status = 'pendente';
