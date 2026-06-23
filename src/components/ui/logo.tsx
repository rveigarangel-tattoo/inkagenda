import { cn } from "@/lib/utils"

export function InkagendaIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="inkagenda" className={className} />
  )
}

export function InkagendaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <InkagendaIcon className="w-20" />
      <span className="text-2xl font-light tracking-widest text-foreground">
        inkagenda
      </span>
    </div>
  )
}
