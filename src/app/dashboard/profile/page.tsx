"use client"
import { useSession, signOut } from "next-auth/react"
import { User, Mail, Briefcase, Shield, LogOut, Zap } from "lucide-react"

export default function ProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white">Perfil</h2>
      <div className="p-5 bg-[#111] rounded-2xl border border-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-black font-bold text-2xl shrink-0" style={{ backgroundColor: user?.avatarColor||"#d4a853" }}>{user?.name?.charAt(0)||"U"}</div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{user?.name}</h3>
            <p className="text-sm text-[#d4a853] mt-0.5">{user?.specialty||(user?.role==="ADMIN"?"Administrador":"Tatuador(a)")}</p>
            <p className="text-xs text-[#555] mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="p-5 bg-[#111] rounded-2xl border border-[#1a1a1a] space-y-4">
        <h4 className="text-xs font-semibold text-[#555] uppercase tracking-wider">Informações da conta</h4>
        {[
          {label:"Nome completo",value:user?.name||"—",icon:User},
          {label:"Email",value:user?.email||"—",icon:Mail},
          {label:"Especialidade",value:user?.specialty||"—",icon:Briefcase},
          {label:"Função",value:user?.role==="ADMIN"?"Administrador":"Tatuador(a)",icon:Shield},
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] rounded-xl shrink-0"><item.icon className="w-4 h-4 text-[#555]" /></div>
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">{item.label}</p>
              <p className="text-sm text-white font-medium mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-[#111] rounded-2xl border border-[#1a1a1a] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#d4a853]/10 border border-[#d4a853]/20 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-[#d4a853]" fill="currentColor" /></div>
        <div><p className="text-sm font-semibold text-white">InkAgenda</p><p className="text-xs text-[#555]">Studio Management System · v1.0</p></div>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all">
        <LogOut className="w-4 h-4" /> Sair da conta
      </button>
    </div>
  )
}
