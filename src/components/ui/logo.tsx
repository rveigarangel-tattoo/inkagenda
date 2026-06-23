import { cn } from "@/lib/utils"

export function InkagendaIcon({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="inkagenda" className={className} />
}

export function InkagendaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <InkagendaIcon className="w-24" />
    </div>
  )
}
