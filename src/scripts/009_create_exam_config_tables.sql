-- ============================================================
-- PASSO 1: Criar tabelas (execute separadamente se necessário)
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_procedures_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_types_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(procedure_name, name)
);

-- ============================================================
-- PASSO 2: Habilitar RLS
-- ============================================================

ALTER TABLE exam_procedures_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_types_list ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASSO 3: Criar policies (ignore erros se já existirem)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_procedures_list' AND policyname = 'Allow public read exam_procedures_list') THEN
    CREATE POLICY "Allow public read exam_procedures_list" ON exam_procedures_list FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_procedures_list' AND policyname = 'Allow public insert exam_procedures_list') THEN
    CREATE POLICY "Allow public insert exam_procedures_list" ON exam_procedures_list FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_procedures_list' AND policyname = 'Allow public update exam_procedures_list') THEN
    CREATE POLICY "Allow public update exam_procedures_list" ON exam_procedures_list FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_procedures_list' AND policyname = 'Allow public delete exam_procedures_list') THEN
    CREATE POLICY "Allow public delete exam_procedures_list" ON exam_procedures_list FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_types_list' AND policyname = 'Allow public read exam_types_list') THEN
    CREATE POLICY "Allow public read exam_types_list" ON exam_types_list FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_types_list' AND policyname = 'Allow public insert exam_types_list') THEN
    CREATE POLICY "Allow public insert exam_types_list" ON exam_types_list FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_types_list' AND policyname = 'Allow public update exam_types_list') THEN
    CREATE POLICY "Allow public update exam_types_list" ON exam_types_list FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_types_list' AND policyname = 'Allow public delete exam_types_list') THEN
    CREATE POLICY "Allow public delete exam_types_list" ON exam_types_list FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- PASSO 4: Inserir dados iniciais
-- ============================================================

INSERT INTO exam_procedures_list (name) VALUES
  ('Tomografia'),
  ('Ultrassom'),
  ('Ecocardiograma'),
  ('Raio X'),
  ('Laboratoriais'),
  ('Eletrocardiograma')
ON CONFLICT (name) DO NOTHING;

INSERT INTO exam_types_list (procedure_name, name) VALUES
  ('Tomografia', 'Crânio'),
  ('Tomografia', 'Tórax'),
  ('Tomografia', 'Abdômen'),
  ('Tomografia', 'Coluna'),
  ('Tomografia', 'Membros'),
  ('Ultrassom', 'Ultrassom Abdominal'),
  ('Ultrassom', 'Ultrassom Pélvico'),
  ('Ultrassom', 'Outros'),
  ('Ecocardiograma', 'Transtorácico'),
  ('Ecocardiograma', 'Transesofágico'),
  ('Raio X', 'Tórax'),
  ('Raio X', 'Membros'),
  ('Raio X', 'Coluna'),
  ('Raio X', 'Bacia'),
  ('Laboratoriais', 'Sangue'),
  ('Laboratoriais', 'Urina'),
  ('Laboratoriais', 'Fezes'),
  ('Laboratoriais', 'Hemograma Completo'),
  ('Laboratoriais', 'Glicemia'),
  ('Laboratoriais', 'Colesterol'),
  ('Laboratoriais', 'Bioquímica'),
  ('Laboratoriais', 'Eletrolitos'),
  ('Eletrocardiograma', 'Padrão')
ON CONFLICT (procedure_name, name) DO NOTHING;

-- ============================================================
-- PASSO 5: Confirmar resultado
-- ============================================================

SELECT 'exam_procedures_list' as tabela, count(*) as total FROM exam_procedures_list
UNION ALL
SELECT 'exam_types_list', count(*) FROM exam_types_list;
