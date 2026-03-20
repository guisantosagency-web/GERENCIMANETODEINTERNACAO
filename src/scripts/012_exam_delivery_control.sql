-- ============================================================
-- PASSO 1: Adicionar colunas de controle de entrega
-- ============================================================

ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS result_delivered BOOLEAN DEFAULT FALSE;
ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS result_delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS result_delivered_by TEXT;

-- ============================================================
-- PASSO 2: Comentários para documentação
-- ============================================================

COMMENT ON COLUMN exam_appointments.result_delivered IS 'Indica se o resultado do exame foi entregue ao paciente';
COMMENT ON COLUMN exam_appointments.result_delivered_at IS 'Data e hora em que o resultado foi entregue';
COMMENT ON COLUMN exam_appointments.result_delivered_by IS 'Nome do funcionário que realizou a entrega';
