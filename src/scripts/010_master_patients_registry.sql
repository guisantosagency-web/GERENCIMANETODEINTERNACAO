-- =====================================================
-- 010: CADASTRO UNIFICADO DE PACIENTES (master_patients)
-- Esta migration é idempotente - já foi aplicada via MCP
-- =====================================================

-- Ver: supabase/migrations/20240318_create_master_patients.sql
-- Tabela criada com os seguintes campos:
--   id, full_name, cpf (UNIQUE), sus, rg, data_nascimento,
--   sexo, tipagem_sanguinea, estado_civil, telefone, email,
--   estado, municipio, endereco, bairro, cep,
--   nome_mae, nome_pai, origem_cadastro,
--   primeira_visita_em, ultima_atualizacao_em

-- Para verificar:
-- SELECT COUNT(*), origem_cadastro FROM master_patients GROUP BY origem_cadastro;
