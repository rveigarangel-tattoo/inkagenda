import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  change?: number
  changeLabel?: string
  variant?: "primary" | "default"
}

export function StatCard({ label, value, icon: Icon, change, changeLabel = "vs período anterior", variant = "default" }: StatCardProps) {
  const positive = (change ?? 0) >= 0
  const isPrimary = variant === "primary"
  return (
    <Card className={cn(isPrimary && "bg-primary text-primary-foreground border-primary")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className={cn("text-sm font-medium", isPrimary ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {label}
          </p>
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            isPrimary ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className={cn("mt-3 text-2xl font-bold", isPrimary && "text-white")}>{value}</p>
        {change !== undefined && (
          <p className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            isPrimary
              ? positive ? "text-green-200" : "text-red-200"
              : positive ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
          )}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% {changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
