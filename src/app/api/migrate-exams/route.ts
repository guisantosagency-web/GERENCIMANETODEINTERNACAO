import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const steps = []

  // 1. Create exam_procedures_list
  const { error: e1 } = await supabase.rpc("exec_sql", {
    sql: `CREATE TABLE IF NOT EXISTS exam_procedures_list (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`
  }).catch(() => ({ error: null }))

  // Try direct approach - insert and check if table exists by inserting
  const { error: procInsertError } = await supabase
    .from("exam_procedures_list")
    .insert([
      { name: "Tomografia" },
      { name: "Ultrassom" },
      { name: "Ecocardiograma" },
      { name: "Raio X" },
      { name: "Laboratoriais" },
      { name: "Eletrocardiograma" },
    ])
    .onConflict("name")
    .ignore()

  steps.push({ step: "procedures_insert", error: procInsertError?.message })

  if (!procInsertError) {
    // 2. Insert exam types
    const types = [
      { procedure_name: "Tomografia", name: "Crânio" },
      { procedure_name: "Tomografia", name: "Tórax" },
      { procedure_name: "Tomografia", name: "Abdômen" },
      { procedure_name: "Tomografia", name: "Coluna" },
      { procedure_name: "Tomografia", name: "Membros" },
      { procedure_name: "Ultrassom", name: "Ultrassom Abdominal" },
      { procedure_name: "Ultrassom", name: "Ultrassom Pélvico" },
      { procedure_name: "Ultrassom", name: "Outros" },
      { procedure_name: "Ecocardiograma", name: "Transtorácico" },
      { procedure_name: "Ecocardiograma", name: "Transesofágico" },
      { procedure_name: "Raio X", name: "Tórax" },
      { procedure_name: "Raio X", name: "Membros" },
      { procedure_name: "Raio X", name: "Coluna" },
      { procedure_name: "Raio X", name: "Bacia" },
      { procedure_name: "Laboratoriais", name: "Sangue" },
      { procedure_name: "Laboratoriais", name: "Urina" },
      { procedure_name: "Laboratoriais", name: "Fezes" },
      { procedure_name: "Laboratoriais", name: "Hemograma Completo" },
      { procedure_name: "Laboratoriais", name: "Glicemia" },
      { procedure_name: "Laboratoriais", name: "Colesterol" },
      { procedure_name: "Laboratoriais", name: "Bioquímica" },
      { procedure_name: "Laboratoriais", name: "Eletrolitos" },
      { procedure_name: "Eletrocardiograma", name: "Padrão" },
    ]

    const { error: typesErr } = await supabase
      .from("exam_types_list")
      .insert(types)
      .onConflict("procedure_name,name")
      .ignore()

    steps.push({ step: "types_insert", error: typesErr?.message })
  }

  return NextResponse.json({
    message: "Migration attempt complete",
    steps,
    tableExistsError: procInsertError?.message
  })
}
