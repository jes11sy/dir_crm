export interface LoginForm {
  login: string
  password: string
}

export interface AdminLoginForm {
  login: string
  password: string
}

export interface User {
  id: number
  login: string
  cities: string[]
  name: string
}

export interface CallRecord {
  id: number
  rk: string
  city: string
  avitoName?: string
  phoneClient: string
  phoneAts: string
  dateCreate: string
  operatorId: number
  status: string
  mangoCallId?: number
  recordingPath?: string
  recordingProcessedAt?: string
  recordingEmailSent: boolean
  operator?: {
    id: number
    name: string
    city: string
  }
}

export interface Order {
  id: number
  rk: string
  city: string
  avito_name: string
  phone: string
  type_order: string
  client_name: string
  address: string
  date_meeting: string
  type_equipment: string
  problem: string
  status_order: string
  master_id: number | null
  master_name?: string
  result: number | null
  expenditure: number | null
  clean: number | null
  master_change: number | null
  call_id?: string
  bso_doc?: string
  expenditure_doc?: string
}

export interface Master {
  id: number
  name: string
  cities: string[] // Массив городов
  statusWork: string
  passportDoc?: string
  contractDoc?: string
  dateCreate: string
  note?: string
  tgId?: string
  chatId?: string
}

export interface CashTransaction {
  id: number
  name: string
  amount: number
  note?: string
  receipt_doc?: string
  date_create: string
  name_create: string
}