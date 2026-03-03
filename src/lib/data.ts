export interface Doctor {
  id: string
  name: string
  specialty: string
}

export interface Receptionist {
  id: string
  name: string
  username: string
  allowedModules?: string[]
  allowedSubmodules?: string[]
}

export interface Patient {
  id: number
  ordem?: number
  data: string
  paciente: string
  cidadeOrigem: string
  estado: string
  horario: string
  leito: string
  sus: string
  cpf: string
  dataNascimento: string
  idade: string
  procedencia: string
  isResidencia: boolean
  destino: string
  prontuario?: string
  medico: string
  procedimento: string
  recepcionista: string
  telefone: string
  mae?: string
  pai?: string
  estadoCivil?: string
  rg?: string
  sexo?: string
  municipioNascimento?: string
  endereco?: string
  bairro?: string
  cep?: string
}

export interface User {
  id: string
  name: string
  username: string
  password: string
  role: "admin" | "user"
  allowedModules?: string[]
  allowedSubmodules?: string[]
}

export const doctors: Doctor[] = [
  { id: "1", name: "PLANTONISTA", specialty: "GERAL" },
  { id: "2", name: "DR. HUMBERTO", specialty: "ORTOPEDIA" },
  { id: "3", name: "DR. WELLINGTON", specialty: "ORTOPEDIA" },
  { id: "4", name: "DRA. REGINA", specialty: "ORTOPEDIA" },
  { id: "5", name: "DR. ROBSON", specialty: "ORTOPEDIA" },
  { id: "6", name: "DR. GERARDO", specialty: "ORTOPEDIA" },
  { id: "7", name: "DR. TARCISO", specialty: "ORTOPEDIA" },
  { id: "8", name: "DR. JORGE WILLIAM", specialty: "ORTOPEDIA" },
  { id: "9", name: "DR. RAPHAEL", specialty: "ORTOPEDIA" },
  { id: "10", name: "DR. ARNALDO", specialty: "ORTOPEDIA" },
]

export const receptionists: Receptionist[] = [
  { id: "1", name: "FRANCINALVA", username: "francinalva" },
  { id: "2", name: "GILSEANE", username: "gilseane" },
  { id: "3", name: "ANA AMÉLIA", username: "ana amelia" },
  { id: "4", name: "MARY", username: "mary" },
  { id: "5", name: "JACQUE", username: "jacque" },
  { id: "6", name: "LINDICÁSSIA", username: "lindicassia" },
  { id: "7", name: "REJANE", username: "rejane" },
  { id: "8", name: "XAIANA", username: "xaiana" },
  { id: "9", name: "MEGUES", username: "megues" },
]

export const users: User[] = [
  { id: "1", name: "Administrador Master", username: "admin", password: "@htocaxias", role: "admin" },
  { id: "2", name: "Francinalva", username: "francinalva", password: "@htocaxias", role: "user" },
  { id: "3", name: "Gilseane", username: "gilseane", password: "@htocaxias", role: "user" },
  { id: "4", name: "Ana Amélia", username: "ana amelia", password: "@htocaxias", role: "user" },
  { id: "5", name: "Mary", username: "mary", password: "@htocaxias", role: "user" },
  { id: "6", name: "Jacque", username: "jacque", password: "@htocaxias", role: "user" },
  { id: "7", name: "Lindicássia", username: "lindicassia", password: "@htocaxias", role: "user" },
  { id: "8", name: "Rejane", username: "rejane", password: "@htocaxias", role: "user" },
  { id: "9", name: "Xaiana", username: "xaiana", password: "@htocaxias", role: "user" },
  { id: "10", name: "Megues", username: "megues", password: "@htocaxias", role: "user" },
]

export const patients: Patient[] = [
  {
    id: 1,
    ordem: 1,
    data: "01.11",
    horario: "05:11",
    paciente: "JOSE RIBAMAR SILVA RODRIGUES",
    cidadeOrigem: "COELHO NETO",
    estado: "MA",
    leito: "ALA B ENF 05 LT 03",
    sus: "898 0006 5684 9982",
    cpf: "",
    dataNascimento: "02/01/1960",
    idade: "64",
    procedencia: "UPA/TIMON",
    isResidencia: false,
    destino: "CENTRO CIRÚRGICO",
    prontuario: "P9428/25",
    medico: "PLANTONISTA",
    procedimento: "FRATURA DE TIBIA",
    recepcionista: "FRANCINALVA",
    telefone: "(99) 99999-9999",
  },
]

