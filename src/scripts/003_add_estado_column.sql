-- Adicionar coluna estado à tabela patients

-- Adiciona a coluna estado com valor padrão 'MA' (Maranhão)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'MA';

-- Atualiza registros existentes para ter 'MA' como padrão
UPDATE patients 
SET estado = 'MA' 
WHERE estado IS NULL OR estado = '';

-- Adiciona comentário na coluna
COMMENT ON COLUMN patients.estado IS 'Sigla do estado de origem do paciente (UF)';
