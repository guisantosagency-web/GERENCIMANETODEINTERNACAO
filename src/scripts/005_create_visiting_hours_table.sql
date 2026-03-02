-- Create visiting_hours table
CREATE TABLE IF NOT EXISTS visiting_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enfermaria TEXT,
  uti TEXT,
  trocas_acompanhantes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values
INSERT INTO visiting_hours (enfermaria, uti, trocas_acompanhantes)
VALUES ('14h às 16h e 18h às 20h', '10h às 11h e 16h às 17h', '8h, 14h e 20h')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE visiting_hours ENABLE ROW LEVEL SECURITY;

-- Create policy for full access
CREATE POLICY "Enable all access for visiting_hours" ON visiting_hours FOR ALL USING (true) WITH CHECK (true);
