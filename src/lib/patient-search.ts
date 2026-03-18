/**
 * Utilitários de busca e upsert de pacientes no cadastro central (master_patients).
 * Use em qualquer módulo para buscar ou registrar pacientes sem duplicidade.
 */
import { createBrowserClient } from "@supabase/ssr"

export interface MasterPatient {
  id: string
  full_name: string
  cpf?: string | null
  sus?: string | null
  rg?: string | null
  data_nascimento?: string | null
  idade?: string | null
  sexo?: string | null
  tipagem_sanguinea?: string | null
  estado_civil?: string | null
  telefone?: string | null
  telefone2?: string | null
  email?: string | null
  estado?: string | null
  municipio?: string | null
  endereco?: string | null
  bairro?: string | null
  cep?: string | null
  nome_mae?: string | null
  nome_pai?: string | null
  primeira_visita_em?: string | null
  ultima_atualizacao_em?: string | null
  origem_cadastro?: string | null
}

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Busca pacientes pelo nome, CPF ou SUS.
 * Retorna até 10 resultados.
 */
export async function searchMasterPatients(term: string): Promise<MasterPatient[]> {
  if (!term || term.trim().length < 2) return []
  const supabase = getSupabase()
  const t = term.trim().toUpperCase()

  const { data, error } = await supabase
    .from("master_patients")
    .select("*")
    .or(`full_name.ilike.%${t}%,cpf.ilike.%${t}%,sus.ilike.%${t}%`)
    .order("ultima_atualizacao_em", { ascending: false })
    .limit(10)

  if (error) {
    console.error("[searchMasterPatients]", error)
    return []
  }
  return data || []
}

/**
 * Busca paciente pelo CPF exato. Retorna null se não encontrar.
 */
export async function findPatientByCpf(cpf: string): Promise<MasterPatient | null> {
  if (!cpf) return null
  const supabase = getSupabase()
  const { data } = await supabase
    .from("master_patients")
    .select("*")
    .eq("cpf", cpf.trim())
    .single()
  return data || null
}

/**
 * Faz upsert do paciente no cadastro central.
 * Se CPF já existir, atualiza apenas campos que estejam faltando.
 * Se não houver CPF, insere como novo.
 * Retorna o paciente salvo.
 */
export async function upsertMasterPatient(
  patient: Partial<MasterPatient> & { full_name: string; origem_cadastro: string }
): Promise<MasterPatient | null> {
  const supabase = getSupabase()

  if (patient.cpf) {
    // Tenta atualizar apenas campos nulos/vazios
    const existing = await findPatientByCpf(patient.cpf)
    if (existing) {
      const updates: Partial<MasterPatient> = {}
      const fields: (keyof MasterPatient)[] = [
        "sus", "telefone", "data_nascimento", "estado", "municipio",
        "rg", "sexo", "tipagem_sanguinea", "estado_civil", "nome_mae",
        "nome_pai", "endereco", "bairro", "cep", "email"
      ]
      for (const f of fields) {
        if (!existing[f] && patient[f]) {
          ;(updates as any)[f] = patient[f]
        }
      }
      if (Object.keys(updates).length > 0) {
        const { data } = await supabase
          .from("master_patients")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single()
        return data || existing
      }
      return existing
    }
  }

  // Insere novo
  const { data, error } = await supabase
    .from("master_patients")
    .insert([{
      full_name: patient.full_name.toUpperCase(),
      cpf: patient.cpf || null,
      sus: patient.sus || null,
      rg: patient.rg || null,
      data_nascimento: patient.data_nascimento || null,
      sexo: patient.sexo || null,
      tipagem_sanguinea: patient.tipagem_sanguinea || null,
      estado_civil: patient.estado_civil || null,
      telefone: patient.telefone || null,
      email: patient.email || null,
      estado: patient.estado || "MA",
      municipio: patient.municipio || null,
      endereco: patient.endereco || null,
      bairro: patient.bairro || null,
      cep: patient.cep || null,
      nome_mae: patient.nome_mae || null,
      nome_pai: patient.nome_pai || null,
      origem_cadastro: patient.origem_cadastro,
    }])
    .select()
    .single()

  if (error) {
    console.error("[upsertMasterPatient]", error)
    return null
  }
  return data
}
