export interface IBGEMunicipio {
  id: number
  nome: string
}

export async function fetchMunicipiosByEstado(siglaEstado: string): Promise<string[]> {
  if (!siglaEstado) return []
  
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${siglaEstado}/municipios?orderBy=nome`)
    if (!response.ok) {
      throw new Error("Falha ao buscar municípios do IBGE")
    }
    
    const data: IBGEMunicipio[] = await response.ok ? await response.json() : []
    return data.map((m) => m.nome.toUpperCase())
  } catch (error) {
    console.error("Erro ao buscar municípios:", error)
    return []
  }
}
