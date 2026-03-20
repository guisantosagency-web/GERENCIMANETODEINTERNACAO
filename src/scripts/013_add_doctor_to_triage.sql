-- ============================================================
-- ADICIONAR CAMPO MÉDICO À TABELA DE TRIAGEM
-- ============================================================

ALTER TABLE surgery_triage ADD COLUMN IF NOT EXISTS medico TEXT;

COMMENT ON COLUMN surgery_triage.medico IS 'Nome do médico ou cirurgião responsável';
