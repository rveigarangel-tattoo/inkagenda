import { cn } from "@/lib/utils"

export function InkagendaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/*
        Combined path with evenodd:
        - Outer silhouette: calendar body + two thick hooks (one continuous path)
        - Subpath 1: horizontal separator line (cutout)
        - Subpath 2: ink drop / teardrop (cutout)
      */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 17 20
          L 25 20 L 25 5 Q 25 0 30 0 L 34 0 Q 39 0 39 5 L 39 20
          L 61 20 L 61 5 Q 61 0 66 0 L 70 0 Q 75 0 75 5 L 75 20
          L 83 20 Q 95 20 95 32
          L 95 88 Q 95 100 83 100
          L 17 100 Q 5 100 5 88
          L 5 32 Q 5 20 17 20 Z

          M 5 34 L 95 34 L 95 41 L 5 41 Z

          M 50 50
          C 39 61 35 71 35 77
          A 15 15 0 0 1 65 77
          C 65 71 61 61 50 50 Z
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
