"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Calendar, DollarSign, Users, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatTime, STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DashboardData {
  todayAppointments: number
  weekRevenue: number
  totalClients: number
  pendingConfirmations: number
  upcomingAppointments: any[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const isAdmin = (session?.user as any)?.role === "ADMIN"
  const firstName = session?.user?.name?.split(" ")[0] || ""

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none animate-pulse">
        <div className="h-8 bg-[#1a1a1a] rounded-xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#111] rounded-2xl" />)}</div>
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-[#111] rounded-2xl" />)}</div>
      </div>
    )
  }

  const stats = [
    { label: "Hoje", value: data?.todayAppointments || 0, sub: "agendamentos", icon: Calendar, color: "text-blue-400", iconBg: "bg-blue-500/10", border: "border-blue-500/10" },
    { label: "Esta semana", value: formatCurrency(data?.weekRevenue || 0), sub: "faturamento", icon: DollarSign, color: "text-[#d4a853]", iconBg: "bg-[#d4a853]/10", border: "border-[#d4a853]/10" },
    { label: "Clientes", value: data?.totalClients || 0, sub: "cadastrados", icon: Users, color: "text-green-400", iconBg: "bg-green-500/10", border: "border-green-500/10" },
    { label: "Pendentes", value: data?.pendingConfirmations || 0, sub: "a confirmar", icon: Clock, color: "text-amber-400", iconBg: "bg-amber-500/10", border: "border-amber-500/10" },
  ]

  return (
    <div className="space-y-6 max-w-2xl mx-auto lg:max-w-none">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Olá, {firstName}! 👋</h2>
          <p className="text-[#666] text-sm mt-0.5 capitalize">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <Link href="/dashboard/schedule" className="flex items-center gap-2 px-4 py-2.5 bg-[#d4a853] hover:bg-[#c49840] text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#d4a853]/10">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl bg-[#111] border ${stat.border}`}>
            <div className={`inline-flex p-2 rounded-xl ${stat.iconBg} mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-xl lg:text-2xl font-bold text-white leading-none">{stat.value}</div>
            <div className="text-xs text-[#666] mt-1.5"><span className="text-[#999]">{stat.label}</span><span className="mx-1">·</span>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Próximos Agendamentos</h3>
          <Link href="/dashboard/schedule" className="text-xs text-[#d4a853] hover:text-[#c49840] transition-colors font-medium">Ver todos →</Link>
        </div>
        {!data?.upcomingAppointments?.length ? (
          <div className="p-10 bg-[#111] rounded-2xl border border-[#1a1a1a] text-center">
            <Calendar className="w-8 h-8 text-[#333] mx-auto mb-3" />
            <p className="text-[#666] text-sm">Nenhum agendamento próximo</p>
            <Link href="/dashboard/schedule" className="text-xs text-[#d4a853] mt-2 inline-block">Criar agendamento →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {data.upcomingAppointments.map((apt: any) => (
              <div key={apt.id} className="flex items-center gap-3 p-4 bg-[#111] rounded-2xl border border-[#1a1a1a] hover:border-[#252525] transition-all">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ backgroundColor: apt.artist?.avatarColor || "#d4a853" }}>{apt.client?.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{apt.client?.name}</p>
                  <p className="text-xs text-[#666] mt-0.5">{SERVICE_LABELS[apt.service]} · {formatTime(apt.date)}{isAdmin && <span className="text-[#d4a853]"> · {apt.artist?.name}</span>}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[apt.status]}`}>{STATUS_LABELS[apt.status]}</span>
                  <span className="text-xs font-bold text-[#d4a853]">{formatCurrency(apt.price)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
