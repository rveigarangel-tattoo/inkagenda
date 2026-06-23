import { cn } from "@/lib/utils"

export function InkagendaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 70"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M13 20 L17 20 L17 3 Q17 0 20 0 Q23 0 23 3 L23 20
          L37 20 L37 3 Q37 0 40 0 Q43 0 43 3 L43 20
          L47 20 Q53 20 53 26 L53 62 Q53 68 47 68
          L13 68 Q7 68 7 62 L7 26 Q7 20 13 20 Z
          M7 27 L53 27 L53 32 L7 32 Z
          M30 37 C22 44 18 52 18 56 A12 12 0 0 0 42 56 C42 52 38 44 30 37 Z
        "
      />
    </svg>
  )
}

export function InkagendaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <InkagendaIcon className="w-20 text-primary" />
      <span className="text-2xl font-light tracking-widest text-foreground">
        inkagenda
      </span>
    </div>
  )
}
