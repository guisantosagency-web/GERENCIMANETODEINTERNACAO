-- Criar tabela para armazenar configurações do sistema (logos)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para desenvolvimento)
CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete settings" ON public.settings FOR DELETE USING (true);

-- Inserir registros padrão para as logos
INSERT INTO public.settings (key, value) VALUES 
  ('logo_hto', null),
  ('logo_maranhao', null),
  ('logo_instituto', null),
  ('logo_sus', null)
ON CONFLICT (key) DO NOTHING;
