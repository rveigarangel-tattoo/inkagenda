"use client"
import { useEffect, useState } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react"
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
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Receitas" value={formatCurrency(summary.income)} icon={TrendingUp} />
          <StatCard label="Despesas" value={formatCurrency(summary.expense)} icon={TrendingDown} />
          <StatCard label="Saldo" value={formatCurrency(summary.balance)} icon={Wallet} />
        </div>
      )}

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
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => {
                  const isIncome = t.type === "income"
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date, "dd/MM/yyyy")}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category || "—"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            isIncome
                              ? "border-green-500/30 bg-green-500/15 text-green-400"
                              : "border-red-500/30 bg-red-500/15 text-red-400"
                          )}
                        >
                          {isIncome ? "Receita" : "Despesa"}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", isIncome ? "text-green-400" : "text-red-400")}>
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>{t.paymentMethod || "—"}</TableCell>
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
