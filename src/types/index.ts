export interface User {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  commissionPct: number
  avatarUrl?: string | null
  avatarColor: string
  isActive: boolean
  createdAt: string
}

export interface Client {
  id: string
  studioId?: string | null
  artistId?: string | null
  name: string
  phone?: string | null
  email?: string | null
  birthdate?: string | null
  notes?: string | null
  healthNotes?: string | null
  createdAt: string
  appointments?: Appointment[]
  artist?: User | null
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

export interface Appointment {
  id: string
  clientId: string
  artistId: string
  service: string
  value: number
  deposit: number
  date: string
  durationMinutes: number
  status: AppointmentStatus
  notes?: string | null
  style?: string | null
  paymentMethod?: string | null
  createdAt: string
  client?: Client
  artist?: User
}

export interface Transaction {
  id: string
  appointmentId?: string | null
  artistId?: string | null
  type: "income" | "expense"
  category?: string | null
  description: string
  amount: number
  paymentMethod?: string | null
  date: string
  createdAt: string
  appointment?: Appointment | null
  artist?: User | null
}
