-- Table for doctor slots (vacancies)
CREATE TABLE IF NOT EXISTS doctor_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, date)
);

-- Update existing patients table to make prontuario nullable
-- This allows registering patients in 1st consultation without a prontuario
ALTER TABLE patients ALTER COLUMN prontuario DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN ordem DROP NOT NULL;

-- Table for consultations (appointments)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Patient data (redundant for speed or if patient record is not yet synced)
  patient_name TEXT NOT NULL,
  cpf TEXT,
  sus_card TEXT,
  phone TEXT,
  birth_date TEXT,
  municipio TEXT,
  
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  receptionist_name TEXT,
  
  date TEXT NOT NULL,
  time TEXT,
  
  -- Recolhimento de dados fields
  sisreg TEXT,
  procedencia TEXT,
  destination TEXT, -- Alta, Falta, Retorno, Aviso Cirúrgico
  
  status TEXT DEFAULT 'Agendado',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE doctor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read doctor_slots" ON doctor_slots FOR SELECT USING (true);
CREATE POLICY "Allow public insert doctor_slots" ON doctor_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update doctor_slots" ON doctor_slots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete doctor_slots" ON doctor_slots FOR DELETE USING (true);

CREATE POLICY "Allow public read consultations" ON consultations FOR SELECT USING (true);
CREATE POLICY "Allow public insert consultations" ON consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update consultations" ON consultations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete consultations" ON consultations FOR DELETE USING (true);
