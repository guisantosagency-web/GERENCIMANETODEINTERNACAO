-- Migration to create surgery_triage table
CREATE TABLE IF NOT EXISTS surgery_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  cpf TEXT,
  sus TEXT,
  contato TEXT,
  data_nascimento DATE,
  tipagem_sanguinea TEXT,
  data_triage DATE DEFAULT CURRENT_DATE,
  checklist_data JSONB DEFAULT '{}',
  nir_data JSONB DEFAULT '{}',
  obs TEXT,
  recepcionista TEXT,
  is_launched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE surgery_triage ENABLE ROW LEVEL SECURITY;

-- Policies for public access (as per project pattern)
CREATE POLICY "Allow public read surgery_triage" ON surgery_triage FOR SELECT USING (true);
CREATE POLICY "Allow public insert surgery_triage" ON surgery_triage FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update surgery_triage" ON surgery_triage FOR UPDATE USING (true);
CREATE POLICY "Allow public delete surgery_triage" ON surgery_triage FOR DELETE USING (true);
