-- =====================================================
-- Migração 001: Tabelas da Roleta VIP Gelamour
-- Executar no SQL Editor do Supabase
-- =====================================================

-- Tabela de configuração da roleta
CREATE TABLE IF NOT EXISTS roleta_config (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ativa       BOOLEAN NOT NULL DEFAULT TRUE,
  premios     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de participações
CREATE TABLE IF NOT EXISTS roleta_participacoes (
  id             BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  telefone       TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente','aprovado','rejeitado')),
  instagram      TEXT,
  foto_url       TEXT,
  data_aprovacao TIMESTAMPTZ,
  ja_girou       BOOLEAN NOT NULL DEFAULT FALSE,
  premio         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de vencedores semanais
CREATE TABLE IF NOT EXISTS roleta_vencedores (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  telefone   TEXT NOT NULL,
  premio     TEXT NOT NULL,
  semana     TEXT NOT NULL, -- formato: YYYY-WW
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_participacoes_telefone ON roleta_participacoes(telefone);
CREATE INDEX IF NOT EXISTS idx_participacoes_status   ON roleta_participacoes(status);
CREATE INDEX IF NOT EXISTS idx_vencedores_semana      ON roleta_vencedores(semana);

COMMENT ON TABLE roleta_participacoes IS 'Participações dos clientes na Roleta VIP';
COMMENT ON TABLE roleta_vencedores    IS 'Vencedores semanais da Roleta VIP (máx 1/semana)';
COMMENT ON TABLE roleta_config        IS 'Configurações da Roleta VIP (ativa/inativa, prêmios)';
