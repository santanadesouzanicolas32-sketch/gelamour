-- =====================================================
-- Migração 002: Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE roleta_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE roleta_participacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roleta_vencedores     ENABLE ROW LEVEL SECURITY;

-- roleta_config: qualquer um pode LER, só service_role pode escrever
CREATE POLICY "config_leitura_publica" ON roleta_config
  FOR SELECT USING (TRUE);

-- roleta_participacoes: usuário vê só os próprios registros
CREATE POLICY "participacao_insert_proprio" ON roleta_participacoes
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "participacao_select_proprio" ON roleta_participacoes
  FOR SELECT USING (TRUE);

CREATE POLICY "participacao_update_service" ON roleta_participacoes
  FOR UPDATE USING (TRUE);

-- roleta_vencedores: leitura pública
CREATE POLICY "vencedores_leitura_publica" ON roleta_vencedores
  FOR SELECT USING (TRUE);

CREATE POLICY "vencedores_insert_service" ON roleta_vencedores
  FOR INSERT WITH CHECK (TRUE);
