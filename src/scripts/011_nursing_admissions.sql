-- Create nursing_admissions table
CREATE TABLE IF NOT EXISTS nursing_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id BIGINT, -- Optional link to patients table
    patient_name TEXT NOT NULL,
    social_name TEXT,
    prontuario TEXT,
    sexo TEXT,
    data_nascimento DATE,
    diagnostico_medico TEXT,
    hora_admissao TIME,
    jejum_status TEXT, -- SIM, NAO, NAO_SE_APLICA
    jejum_inicio TIME,
    peso NUMERIC(5,2),
    altura NUMERIC(3,2),
    
    -- Comorbidities (Antecedentes Pessoais) stored as JSONB for flexibility
    comorbidades JSONB DEFAULT '{}'::jsonb,
    medication_in_use TEXT,
    
    -- Medications of continuous use
    medicacoes_continuas JSONB DEFAULT '{}'::jsonb,
    
    -- Family history
    historico_familiar JSONB DEFAULT '{}'::jsonb,
    
    -- Life habits
    habitos_vida JSONB DEFAULT '{}'::jsonb,
    
    -- Devices
    dispositivos JSONB DEFAULT '{}'::jsonb,
    
    -- Vital signs
    sinais_vitais JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT -- Username or name of the person who created the record
);

-- Enable RLS
ALTER TABLE nursing_admissions ENABLE ROW LEVEL SECURITY;

-- Simple policy for development: enable all for authenticated users
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all for authenticated users' AND tablename = 'nursing_admissions') THEN
        CREATE POLICY "Enable all for authenticated users" ON nursing_admissions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
