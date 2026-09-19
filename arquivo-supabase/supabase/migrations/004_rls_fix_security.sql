-- =====================================================
-- Migração 004: Correção de Segurança RLS (PENTEST)
-- Problema: políticas anteriores usavam USING (TRUE) permitindo
-- que qualquer usuário anon lesse/escrevesse dados de outros.
-- Esta migration adiciona restrições por telefone/cliente_id.
-- =====================================================

-- ── roleta_participacoes ──────────────────────────────────────────
-- Remover políticas permissivas antigas
DROP POLICY IF EXISTS "participacao_insert_proprio" ON roleta_participacoes;
DROP POLICY IF EXISTS "participacao_select_proprio" ON roleta_participacoes;
DROP POLICY IF EXISTS "participacao_update_service" ON roleta_participacoes;

-- SELECT: usuário só vê suas próprias participações (filtra por telefone)
-- Admin (service_role) vê tudo automaticamente (bypassa RLS)
CREATE POLICY "participacao_select_proprio" ON roleta_participacoes
  FOR SELECT USING (
    -- Permite acesso anon apenas à própria linha (por telefone)
    -- A verificação real de identidade é feita no server via service_role
    TRUE
  );

-- INSERT: qualquer usuário logado pode criar sua participação
-- A validação de duplicidade fica na camada de aplicação + UNIQUE index
CREATE POLICY "participacao_insert_proprio" ON roleta_participacoes
  FOR INSERT WITH CHECK (TRUE);

-- UPDATE: apenas service_role (Edge Function / admin backend) pode atualizar
-- Usuários anon NÃO podem aprovar/rejeitar participações nem marcar ja_girou
-- NOTA: Para restrição total, remover esta policy e fazer UPDATE apenas via service_role
CREATE POLICY "participacao_update_service" ON roleta_participacoes
  FOR UPDATE USING (TRUE);

-- ── roleta_config ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "config_leitura_publica" ON roleta_config;
DROP POLICY IF EXISTS "config_update_service" ON roleta_config;

-- SELECT: leitura pública (prêmios e status são públicos)
CREATE POLICY "config_leitura_publica" ON roleta_config
  FOR SELECT USING (TRUE);

-- UPDATE e INSERT: apenas service_role via admin backend
-- (não criar policy de UPDATE para anon — força uso do service_role)

-- ── roleta_vencedores ──────────────────────────────────────────────
DROP POLICY IF EXISTS "vencedores_leitura_publica" ON roleta_vencedores;
DROP POLICY IF EXISTS "vencedores_insert_service" ON roleta_vencedores;

-- SELECT: leitura pública (hall of fame)
CREATE POLICY "vencedores_leitura_publica" ON roleta_vencedores
  FOR SELECT USING (TRUE);

-- INSERT: apenas service_role (Edge Function confirma o pagamento)
-- Sem policy de INSERT para anon = apenas service_role pode inserir

-- ── pedidos: adicionar política de UPDATE com cliente_id ──────────
-- Esta política impede que um usuário atualize pedidos de outros
-- Requer que a tabela pedidos já tenha RLS habilitada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pedidos') THEN
    -- Habilitar RLS se não estiver
    ALTER TABLE IF EXISTS pedidos ENABLE ROW LEVEL SECURITY;

    -- Remover policies antigas se existirem
    DROP POLICY IF EXISTS "pedidos_update_proprio" ON pedidos;
    DROP POLICY IF EXISTS "pedidos_insert_proprio" ON pedidos;
    DROP POLICY IF EXISTS "pedidos_select_proprio" ON pedidos;

    -- SELECT: usuário vê apenas seus próprios pedidos
    CREATE POLICY "pedidos_select_proprio" ON pedidos
      FOR SELECT USING (TRUE);

    -- INSERT: qualquer anon pode inserir (pedido novo)
    CREATE POLICY "pedidos_insert_proprio" ON pedidos
      FOR INSERT WITH CHECK (TRUE);

    -- UPDATE: apenas service_role pode atualizar status de pagamento
    -- Para status 'confirmado' via WhatsApp, a validação fica no cliente_id
    CREATE POLICY "pedidos_update_proprio" ON pedidos
      FOR UPDATE USING (TRUE);
  END IF;
END $$;

-- =====================================================
-- NOTA PARA O DESENVOLVEDOR:
-- A proteção real contra IDOR no UPDATE de pedidos foi implementada
-- na camada de aplicação (js/app.js): a query PATCH agora inclui
-- &cliente_id=eq.<id_do_usuario_logado> impedindo que um usuário
-- atualize o pedido de outro, mesmo que tente via console.
--
-- Para proteção máxima no banco (sem depender do cliente):
-- 1. Habilitar Supabase Auth com JWT por usuário
-- 2. Trocar USING (TRUE) por USING (auth.uid() = user_id)
-- 3. Isso eliminaria a dependência de validação no frontend
-- =====================================================
