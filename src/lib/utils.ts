import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date))
}

export const SERVICE_LABELS: Record<string, string> = {
  TATTOO: "Tatuagem",
  TOUCHUP: "Retoque",
  CONSULTATION: "Consulta",
  PIERCING: "Piercing",
}

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
}

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CONFIRMED: "bg-green-500/20 text-green-400 border-green-500/30",
  IN_PROGRESS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  COMPLETED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const AVATAR_COLORS = ["#d4a853","#e879f9","#34d399","#60a5fa","#f87171","#fb923c","#a78bfa","#2dd4bf"]
