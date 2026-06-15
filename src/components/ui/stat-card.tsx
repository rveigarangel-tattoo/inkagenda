import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  change?: number
}

export function StatCard({ label, value, icon: Icon, change }: StatCardProps) {
  const positive = (change ?? 0) >= 0
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <p className={cn("mt-1 flex items-center gap-1 text-xs", positive ? "text-green-400" : "text-red-400")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% vs mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  )
}
