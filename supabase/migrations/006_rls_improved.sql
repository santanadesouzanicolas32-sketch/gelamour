-- Migração 006: RLS melhorada com verificação por telefone no JWT
-- As policies abaixo restringem operações baseadas no telefone do cliente
-- autenticado via token personalizado.

-- Revogar policies antigas excessivamente permissivas
DROP POLICY IF EXISTS "participacao_select_proprio" ON roleta_participacoes;
DROP POLICY IF EXISTS "participacao_update_service" ON roleta_participacoes;
DROP POLICY IF EXISTS "vencedores_insert_service" ON roleta_vencedores;

-- roleta_participacoes: cliente só vê as próprias participações
CREATE POLICY "participacao_select_por_telefone" ON roleta_participacoes
  FOR SELECT USING (
    telefone = (current_setting('request.jwt.claims', true)::json->>'telefone')
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- INSERT livre (qualquer anon pode registrar participação)
CREATE POLICY "participacao_insert_livre" ON roleta_participacoes
  FOR INSERT WITH CHECK (TRUE);

-- UPDATE só via service_role (Edge Function sortear-premio)
CREATE POLICY "participacao_update_service_only" ON roleta_participacoes
  FOR UPDATE USING (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- roleta_vencedores: INSERT só via service_role
CREATE POLICY "vencedores_insert_service_only" ON roleta_vencedores
  FOR INSERT WITH CHECK (
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- pedidos: cliente vê apenas os próprios
DROP POLICY IF EXISTS "pedidos_select_livre" ON pedidos;
CREATE POLICY "pedidos_select_proprio" ON pedidos
  FOR SELECT USING (
    cliente_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')
    OR (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

COMMENT ON POLICY "participacao_update_service_only" ON roleta_participacoes
  IS 'Apenas Edge Functions com service_role podem aprovar/rejeitar participações';
