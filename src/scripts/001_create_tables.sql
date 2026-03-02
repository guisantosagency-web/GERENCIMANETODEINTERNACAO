-- Criar tabela de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  ordem INTEGER NOT NULL,
  data TEXT NOT NULL,
  paciente TEXT NOT NULL,
  cidade_origem TEXT,
  horario TEXT,
  leito TEXT,
  sus TEXT,
  cpf TEXT,
  data_nascimento TEXT,
  idade TEXT,
  procedencia TEXT,
  is_residencia BOOLEAN DEFAULT FALSE,
  destino TEXT,
  prontuario TEXT NOT NULL,
  medico TEXT,
  procedimento TEXT,
  recepcionista TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de médicos
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de recepcionistas
CREATE TABLE IF NOT EXISTS receptionists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de usuários do sistema
CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) - mas permitir acesso público para este CRM interno
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (CRM interno sem autenticação Supabase)
CREATE POLICY "Allow public read patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow public insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update patients" ON patients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete patients" ON patients FOR DELETE USING (true);

CREATE POLICY "Allow public read doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert doctors" ON doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update doctors" ON doctors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete doctors" ON doctors FOR DELETE USING (true);

CREATE POLICY "Allow public read receptionists" ON receptionists FOR SELECT USING (true);
CREATE POLICY "Allow public insert receptionists" ON receptionists FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update receptionists" ON receptionists FOR UPDATE USING (true);
CREATE POLICY "Allow public delete receptionists" ON receptionists FOR DELETE USING (true);

CREATE POLICY "Allow public read system_users" ON system_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert system_users" ON system_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update system_users" ON system_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete system_users" ON system_users FOR DELETE USING (true);

-- Inserir médicos padrão
INSERT INTO doctors (name, specialty) VALUES
  ('PLANTONISTA', 'Geral'),
  ('DR. CARLOS SILVA', 'Ortopedia'),
  ('DRA. MARIA SANTOS', 'Traumatologia'),
  ('DR. JOÃO OLIVEIRA', 'Cirurgia Geral')
ON CONFLICT DO NOTHING;

-- Inserir recepcionistas padrão
INSERT INTO receptionists (name, username) VALUES
  ('FRANCINALVA', 'francinalva'),
  ('GILSEANE', 'gilseane'),
  ('ANA AMÉLIA', 'ana amelia'),
  ('MARY', 'mary'),
  ('JACQUE', 'jacque'),
  ('LINDICÁSSIA', 'lindicassia'),
  ('REJANE', 'rejane'),
  ('XAIANA', 'xaiana'),
  ('MEGUES', 'megues')
ON CONFLICT DO NOTHING;

-- Inserir usuário admin
INSERT INTO system_users (username, password, name, role) VALUES
  ('adminmaster', '@htocaxias', 'Administrador', 'admin'),
  ('francinalva', '@htocaxias', 'Francinalva', 'user'),
  ('gilseane', '@htocaxias', 'Gilseane', 'user'),
  ('ana amelia', '@htocaxias', 'Ana Amélia', 'user'),
  ('mary', '@htocaxias', 'Mary', 'user'),
  ('jacque', '@htocaxias', 'Jacque', 'user'),
  ('lindicassia', '@htocaxias', 'Lindicássia', 'user'),
  ('rejane', '@htocaxias', 'Rejane', 'user'),
  ('xaiana', '@htocaxias', 'Xaiana', 'user'),
  ('megues', '@htocaxias', 'Megues', 'user')
ON CONFLICT (username) DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_patients_prontuario ON patients(prontuario);
CREATE INDEX IF NOT EXISTS idx_patients_data ON patients(data);
CREATE INDEX IF NOT EXISTS idx_patients_recepcionista ON patients(recepcionista);
