import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)
}

export function formatDate(date: Date | string, fmt: string = "dd/MM/yyyy"): string {
  return format(new Date(date), fmt, { locale: ptBR })
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: ptBR })
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
}

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  no_show: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
}

export const ARTIST_PALETTE = [
  "#7c3aed",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
]

export function artistColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return ARTIST_PALETTE[h % ARTIST_PALETTE.length]
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão"]
export const TATTOO_STYLES = ["Realismo", "Blackwork", "Aquarela", "Old School", "Fineline", "Geométrico", "Pontilhismo", "Tribal"]
