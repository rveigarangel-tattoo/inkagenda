import { cn, STATUS_LABELS, STATUS_STYLES } from "@/lib/utils"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
