"use client"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight, Plus, X, Loader2, Clock, DollarSign } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency, formatTime, STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS } from "@/lib/utils"

export default function SchedulePage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "ADMIN"
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientId: "", date: "", time: "10:00", duration: "60", service: "TATTOO", description: "", price: "", status: "SCHEDULED", artistId: "" })

  const fetchAppointments = useCallback(() => {
    const m = currentMonth.getMonth() + 1
    const y = currentMonth.getFullYear()
    setLoading(true)
    fetch(`/api/appointments?month=${m}&year=${y}`).then(r => r.json()).then(d => { setAppointments(Array.isArray(d) ? d : []); setLoading(false) })
  }, [currentMonth])

  useEffect(() => {
    fetchAppointments()
    fetch("/api/clients").then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []))
    if (isAdmin) fetch("/api/team").then(r => r.json()).then(d => setArtists(Array.isArray(d) ? d : []))
  }, [fetchAppointments, isAdmin])

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }) })
  const filteredApts = selectedDay ? appointments.filter(a => isSameDay(new Date(a.date), selectedDay)) : [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, date: `${form.date}T${form.time}:00` }) })
    setSaving(false)
    setShowModal(false)
    setForm({ clientId: "", date: "", time: "10:00", duration: "60", service: "TATTOO", description: "", price: "", status: "SCHEDULED", artistId: "" })
    fetchAppointments()
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    fetchAppointments()
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Agenda</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4a853] hover:bg-[#c49840] text-black font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#d4a853]/10">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors"><ChevronLeft className="w-4 h-4 text-[#666]" /></button>
          <h3 className="font-semibold text-white capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-[#1a1a1a] rounded-xl transition-colors"><ChevronRight className="w-4 h-4 text-[#666]" /></button>
        </div>
        <div className="grid grid-cols-7 mb-2">
          {["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i} className="text-center text-[10px] font-semibold text-[#444] py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map(day => {
            const dayApts = appointments.filter(a => isSameDay(new Date(a.date), day))
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-center rounded-xl aspect-square text-xs transition-all duration-150 ${
                  isSelected ? "bg-[#d4a853] text-black font-bold" : isToday(day) ? "bg-[#d4a853]/10 text-[#d4a853] font-bold border border-[#d4a853]/20" : isSameMonth(day, currentMonth) ? "hover:bg-[#1a1a1a] text-white" : "text-[#2a2a2a]"
                }`}>
                <span>{format(day, "d")}</span>
                {dayApts.length > 0 && <div className="flex gap-0.5 mt-0.5">{dayApts.slice(0,3).map((_,i) => <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-black/50" : "bg-[#d4a853]"}`} />)}</div>}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">
            {selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : "Todos os agendamentos"}
            {selectedDay && <button onClick={() => setSelectedDay(null)} className="ml-2 text-xs text-[#555] hover:text-[#888]"> · limpar</button>}
          </h3>
          <span className="text-xs text-[#555]">{filteredApts.length}</span>
        </div>
        {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-[#d4a853] animate-spin" /></div> : filteredApts.length === 0 ? (
          <div className="p-8 bg-[#111] rounded-2xl border border-[#1a1a1a] text-center"><p className="text-[#555] text-sm">Nenhum agendamento</p></div>
        ) : (
          <div className="space-y-2">
            {filteredApts.map((apt: any) => (
              <div key={apt.id} className="p-4 bg-[#111] rounded-2xl border border-[#1a1a1a] hover:border-[#252525] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold text-sm shrink-0" style={{ backgroundColor: apt.artist?.avatarColor || "#d4a853" }}>{apt.client?.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white text-sm truncate">{apt.client?.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${STATUS_COLORS[apt.status]}`}>{STATUS_LABELS[apt.status]}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-[#666] flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(apt.date), "dd/MM HH:mm")} · {apt.duration}min</span>
                      <span className="text-xs text-[#d4a853] font-semibold flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(apt.price)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[#555]">{SERVICE_LABELS[apt.service]}{isAdmin && <span className="text-[#d4a853]"> · {apt.artist?.name}</span>}</span>
                      <div className="flex gap-2">
                        {apt.status === "SCHEDULED" && <button onClick={() => updateStatus(apt.id, "CONFIRMED")} className="text-xs text-green-400 hover:text-green-300 font-medium">Confirmar</button>}
                        {apt.status === "CONFIRMED" && <button onClick={() => updateStatus(apt.id, "COMPLETED")} className="text-xs text-[#d4a853] hover:text-[#c49840] font-medium">Concluir</button>}
                        {["SCHEDULED","CONFIRMED"].includes(apt.status) && <button onClick={() => updateStatus(apt.id, "CANCELLED")} className="text-xs text-red-400 hover:text-red-300 font-medium">Cancelar</button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111] rounded-2xl border border-[#2a2a2a] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
              <h3 className="font-bold text-white">Novo Agendamento</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg transition-colors"><X className="w-4 h-4 text-[#666]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-[#888] mb-1.5">Cliente *</label>
                <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all">
                  <option value="">Selecionar cliente...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Tatuador(a)</label>
                  <select value={form.artistId} onChange={e => setForm(f => ({ ...f, artistId: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all">
                    <option value="">Selecionar tatuador...</option>
                    {artists.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Data *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Horário *</label>
                  <input type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Serviço *</label>
                  <select required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all">
                    <option value="TATTOO">Tatuagem</option><option value="TOUCHUP">Retoque</option><option value="CONSULTATION">Consulta</option><option value="PIERCING">Piercing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Duração</label>
                  <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all">
                    <option value="30">30 min</option><option value="60">1 hora</option><option value="90">1h30</option><option value="120">2 horas</option><option value="180">3 horas</option><option value="240">4 horas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#888] mb-1.5">Valor (R$) *</label>
                <input type="number" required placeholder="0" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#888] mb-1.5">Descrição</label>
                <textarea placeholder="Detalhes do trabalho..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] transition-all resize-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-[#d4a853] hover:bg-[#c49840] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? "Criando..." : "Criar Agendamento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
