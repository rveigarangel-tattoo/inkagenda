"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { DollarSign, TrendingUp, Award, Filter, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency, STATUS_LABELS, STATUS_COLORS, SERVICE_LABELS } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function CustomTooltip({ active, payload, label }: any) {
  if (!active||!payload?.length) return null
  return <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl"><p className="text-xs text-[#888] mb-1">{label}</p><p className="text-sm font-bold text-[#d4a853]">{formatCurrency(payload[0].value)}</p><p className="text-xs text-[#666]">{payload[0].payload.count} sessões</p></div>
}

export default function FinancesPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === "ADMIN"
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [artists, setArtists] = useState<any[]>([])
  const [selectedArtist, setSelectedArtist] = useState("")

  const fetchData = (artistId="") => { setLoading(true); fetch(artistId?`/api/finances?artistId=${artistId}`:"/api/finances").then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }
  useEffect(() => { fetchData(); if (isAdmin) fetch("/api/team").then(r=>r.json()).then(d=>setArtists(Array.isArray(d)?d:[])) }, [isAdmin])

  return (
    <div className="space-y-5 max-w-2xl mx-auto lg:max-w-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Finanças</h2>
        {isAdmin && <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-[#555]" /><select value={selectedArtist} onChange={e=>{setSelectedArtist(e.target.value);fetchData(e.target.value)}} className="px-3 py-2 bg-[#111] border border-[#1a1a1a] rounded-xl text-white text-xs focus:outline-none focus:border-[#d4a853]"><option value="">Todos os artistas</option>{artists.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>}
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 text-[#d4a853] animate-spin" /></div> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[{label:"Receita Total",value:formatCurrency(data?.totalRevenue||0),icon:DollarSign,color:"text-[#d4a853]",bg:"bg-[#d4a853]/10 border-[#d4a853]/10"},{label:"Ticket Médio",value:formatCurrency(data?.avgRevenue||0),icon:TrendingUp,color:"text-green-400",bg:"bg-green-500/10 border-green-500/10"},{label:"Concluídas",value:data?.completedCount||0,icon:Award,color:"text-blue-400",bg:"bg-blue-500/10 border-blue-500/10"}].map(stat=>(
              <div key={stat.label} className={`p-3 sm:p-4 rounded-2xl bg-[#111] border ${stat.bg}`}>
                <div className={`inline-flex p-1.5 sm:p-2 rounded-xl ${stat.bg} mb-2`}><stat.icon className={`w-3.5 h-3.5 ${stat.color}`} /></div>
                <div className="text-base sm:text-xl font-bold text-white leading-none">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-[#555] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="p-4 sm:p-5 bg-[#111] rounded-2xl border border-[#1a1a1a]">
            <h3 className="font-semibold text-white text-sm mb-4">Faturamento — últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data?.monthlyData} margin={{top:0,right:0,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="month" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v===0?"0":`${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill:"#1a1a1a"}} />
                <Bar dataKey="revenue" fill="#d4a853" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1a1a1a]"><h3 className="font-semibold text-white text-sm">Histórico de Sessões</h3></div>
            <div className="divide-y divide-[#1a1a1a]">
              {data?.appointments?.length===0 ? <div className="p-8 text-center text-[#555] text-sm">Nenhuma sessão registrada</div> : data?.appointments?.slice(0,25).map((apt:any)=>(
                <div key={apt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold text-xs shrink-0" style={{backgroundColor:apt.artist?.avatarColor||"#d4a853"}}>{apt.client?.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-white truncate">{apt.client?.name}</p><p className="text-xs text-[#555]">{SERVICE_LABELS[apt.service]} · {format(new Date(apt.date),"dd/MM/yy",{locale:ptBR})}{isAdmin&&<span className="text-[#d4a853]"> · {apt.artist?.name}</span>}</p></div>
                  <div className="flex flex-col items-end gap-1 shrink-0"><span className="text-sm font-bold text-[#d4a853]">{formatCurrency(apt.price)}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[apt.status]}`}>{STATUS_LABELS[apt.status]}</span></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
