"use client"
import { useEffect, useState } from "react"
import { Search, Plus, X, Phone, Mail, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:"", phone:"", email:"", notes:"" })

  const fetchClients = () => { setLoading(true); fetch("/api/clients").then(r=>r.json()).then(d=>{setClients(Array.isArray(d)?d:[]);setLoading(false)}) }
  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.email?.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setEditClient(null); setForm({name:"",phone:"",email:"",notes:""}); setShowModal(true) }
  function openEdit(client: any) { setEditClient(client); setForm({name:client.name,phone:client.phone||"",email:client.email||"",notes:client.notes||""}); setShowModal(true) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (editClient) await fetch("/api/clients",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editClient.id,...form})})
    else await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)})
    setSaving(false); setShowModal(false); fetchClients()
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Clientes</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#d4a853] hover:bg-[#c49840] text-black font-bold rounded-xl text-sm transition-all"><Plus className="w-4 h-4" /> Novo</button>
      </div>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" /><input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#1a1a1a] rounded-xl text-white text-sm placeholder:text-[#444] focus:outline-none focus:border-[#d4a853]" /></div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#d4a853] animate-spin" /></div> : filtered.length===0 ? (
        <div className="p-8 bg-[#111] rounded-2xl border border-[#1a1a1a] text-center"><p className="text-[#555] text-sm">{search?"Nenhum cliente encontrado":"Nenhum cliente cadastrado ainda"}</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => {
            const totalSpent = client.appointments?.filter((a:any)=>a.status==="COMPLETED").reduce((s:number,a:any)=>s+a.price,0)||0
            return (
              <button key={client.id} onClick={() => openEdit(client)} className="w-full text-left p-4 bg-[#111] rounded-2xl border border-[#1a1a1a] hover:border-[#252525] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border border-[#252525] flex items-center justify-center text-white font-bold shrink-0">{client.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {client.phone && <span className="text-xs text-[#666] flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                      {client.email && <span className="text-xs text-[#666] hidden sm:flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-bold text-[#d4a853]">{formatCurrency(totalSpent)}</span>
                    <span className="text-xs text-[#555]">{client.appointments?.length||0} sessões</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111] rounded-2xl border border-[#2a2a2a] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]"><h3 className="font-bold text-white">{editClient?"Editar Cliente":"Novo Cliente"}</h3><button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[#1a1a1a] rounded-lg"><X className="w-4 h-4 text-[#666]" /></button></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {[{label:"Nome *",key:"name",type:"text",placeholder:"Nome completo",required:true},{label:"Telefone",key:"phone",type:"tel",placeholder:"(11) 99999-9999"},{label:"Email",key:"email",type:"email",placeholder:"cliente@email.com"}].map(field => (
                <div key={field.key}><label className="block text-xs font-medium text-[#888] mb-1.5">{field.label}</label><input type={field.type} required={field.required} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] placeholder:text-[#444]" /></div>
              ))}
              <div><label className="block text-xs font-medium text-[#888] mb-1.5">Observações</label><textarea placeholder="Alergias..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#d4a853] resize-none placeholder:text-[#444]" /></div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-[#d4a853] hover:bg-[#c49840] text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editClient?"Salvar Alterações":"Cadastrar Cliente"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
