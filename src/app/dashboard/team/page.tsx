"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Calendar, DollarSign, Users, Star, TrendingUp, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function TeamPage() {
  const { data: session } = useSession()
  const [artists, setArtists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ((session?.user as any)?.role !== "ADMIN") return
    fetch("/api/team").then(r=>r.json()).then(d=>{setArtists(Array.isArray(d)?d:[]);setLoading(false)})
  }, [session])

  if ((session?.user as any)?.role !== "ADMIN") return <div className="flex flex-col items-center justify-center py-20 text-center"><Users className="w-12 h-12 text-[#333] mb-4" /><p className="text-[#666] text-sm">Acesso restrito ao administrador.</p></div>
  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-52 bg-[#111] rounded-2xl animate-pulse" />)}</div>

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-white">Equipe</h2><span className="text-sm text-[#555]">{artists.length} membros</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {artists.map(artist => {
          const appts = artist.appointments||[]
          const completed = appts.filter((a:any)=>a.status==="COMPLETED")
          const totalRevenue = completed.reduce((s:number,a:any)=>s+a.price,0)
          const now = new Date()
          const monthlyRevenue = appts.filter((a:any)=>{const d=new Date(a.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&a.status==="COMPLETED"}).reduce((s:number,a:any)=>s+a.price,0)
          const uniqueClients = new Set(appts.map((a:any)=>a.clientId)).size
          return (
            <div key={artist.id} className="p-5 bg-[#111] rounded-2xl border border-[#1a1a1a] hover:border-[#252525] transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-black font-bold text-xl shrink-0" style={{backgroundColor:artist.avatarColor}}>{artist.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-bold text-white">{artist.name}</p>{artist.role==="ADMIN"&&<Star className="w-3.5 h-3.5 text-[#d4a853]" fill="currentColor" />}</div>
                  <p className="text-xs text-[#d4a853] mt-0.5 font-medium">{artist.specialty||"Tatuador(a)"}</p>
                  {artist.bio&&<p className="text-xs text-[#555] mt-1.5 line-clamp-2">{artist.bio}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{label:"Receita total",value:formatCurrency(totalRevenue),icon:DollarSign,color:"text-[#d4a853]"},{label:"Este mês",value:formatCurrency(monthlyRevenue),icon:TrendingUp,color:"text-green-400"},{label:"Agendamentos",value:appts.length,icon:Calendar,color:"text-blue-400"},{label:"Clientes únicos",value:uniqueClients,icon:Users,color:"text-purple-400"}].map(stat=>(
                  <div key={stat.label} className="p-3 bg-[#1a1a1a] rounded-xl">
                    <div className={`flex items-center gap-1 text-[10px] ${stat.color} mb-1.5`}><stat.icon className="w-3 h-3" />{stat.label}</div>
                    <div className="font-bold text-white text-sm">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
