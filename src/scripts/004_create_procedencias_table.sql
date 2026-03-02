-- Criar tabela de procedências
CREATE TABLE IF NOT EXISTS procedencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE procedencias ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso total
DROP POLICY IF EXISTS "Enable all access for procedencias" ON procedencias;
CREATE POLICY "Enable all access for procedencias" ON procedencias FOR ALL USING (true) WITH CHECK (true);

-- Inserir procedências iniciais comuns
INSERT INTO procedencias (name) VALUES
  ('UPA/TIMON'),
  ('HOSPITAL MUNICIPAL ETIMAR MACHADO'),
  ('UPA/CAXIAS'),
  ('HOSPITAL REGIONAL'),
  ('PRONTO SOCORRO')
ON CONFLICT (name) DO NOTHING;
