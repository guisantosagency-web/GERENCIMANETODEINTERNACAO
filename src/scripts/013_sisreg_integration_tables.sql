-- Tabela para gerenciar pedidos de sincronização manuais via plataforma
CREATE TABLE IF NOT EXISTS public.exam_sisreg_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    error_message TEXT
);

-- Tabela para armazenar os dados capturados do SISREG
CREATE TABLE IF NOT EXISTS public.exam_sisreg_import (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_date DATE NOT NULL,
    cns TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    phone TEXT,
    procedure_name TEXT NOT NULL,
    professional TEXT,
    soliciting_unit TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'ignored'
    job_id UUID REFERENCES public.exam_sisreg_sync_jobs(id) ON DELETE SET NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    -- Evitar duplicados do mesmo paciente para o mesmo exame no mesmo dia
    CONSTRAINT unique_sisreg_entry UNIQUE (exam_date, cns, procedure_name)
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.exam_sisreg_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sisreg_import ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Allow all for authenticated users on sisreg_sync_jobs" ON public.exam_sisreg_sync_jobs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users on sisreg_import" ON public.exam_sisreg_import FOR ALL TO authenticated USING (true);
