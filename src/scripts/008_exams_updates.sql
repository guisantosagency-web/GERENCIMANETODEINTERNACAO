-- Add columns to exam_appointments
ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS chave_sisreg TEXT;
ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE exam_appointments ADD COLUMN IF NOT EXISTS estado TEXT;

-- Pre-populate "Laboratoriais" if missing
INSERT INTO exam_procedures_list (name) 
VALUES ('Laboratoriais') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO exam_types_list (procedure_name, name) 
VALUES 
  ('Laboratoriais', 'Sangue'),
  ('Laboratoriais', 'Urina'),
  ('Laboratoriais', 'Fezes'),
  ('Laboratoriais', 'Hemograma Completo'),
  ('Laboratoriais', 'Glicemia'),
  ('Laboratoriais', 'Colesterol'),
  ('Laboratoriais', 'Bioquímica'),
  ('Laboratoriais', 'Eletrolitos')
ON CONFLICT (procedure_name, name) DO NOTHING;
