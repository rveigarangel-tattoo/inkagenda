"use client"
import { useEffect, useState } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/ui/stat-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CashflowChart } from "@/components/charts/cashflow-chart"
import { TransactionForm } from "@/components/forms/transaction-form"
import { cn, formatCurrency, formatDate } from "@/lib/utils"

export default function FinancesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/finances")
      const d = await res.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary ?? { income: 0, expense: 0, balance: 0 }
  const cashflow = data?.cashflow ?? []
  const transactions: any[] = data?.transactions ?? []

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finanças</h1>
          <p className="text-sm text-muted-foreground">Acompanhe receitas, despesas e fluxo de caixa</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onSuccess={() => {
                setOpen(false)
                load()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Receitas" value={formatCurrency(summary.income)} icon={TrendingUp} />
          <StatCard label="Despesas" value={formatCurrency(summary.expense)} icon={TrendingDown} />
          <StatCard label="Saldo" value={formatCurrency(summary.balance)} icon={Wallet} />
        </div>
      )}

      {/* Payment method breakdown */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Receita por Forma de Pagamento</CardTitle>
          <p className="text-sm text-muted-foreground">Receitas do mês atual</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(data?.paymentBreakdown ?? []).map((item: { method: string; amount: number }) => {
                const pct = summary.income > 0 ? Math.round((item.amount / summary.income) * 100) : 0
                return (
                  <div key={item.method} className="rounded-xl border p-4">
                    <p className="text-xs font-medium text-muted-foreground truncate">{item.method}</p>
                    <p className="mt-1.5 text-lg font-bold tabular-nums">{formatCurrency(item.amount)}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pct}% do total</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fluxo de Caixa (30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-[280px] w-full" /> : <CashflowChart data={cashflow} />}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
                  <Skeleton className="h-4 w-20 text-right" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhuma transação registrada"
              description="Registre receitas e despesas do estúdio para acompanhar o fluxo de caixa."
              action={{ label: "Registrar primeira transação", onClick: () => setOpen(true) }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isIncome = t.type === "income"
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(t.date, "dd/MM")}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{t.description}</TableCell>
                      <TableCell className="hidden md:table-cell">{t.category || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            isIncome
                              ? "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400"
                              : "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400"
                          )}
                        >
                          {isIncome ? "Receita" : "Despesa"}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", isIncome ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{t.paymentMethod || "—"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
