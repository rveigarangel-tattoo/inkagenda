import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfMonth, endOfMonth, subDays, format } from "date-fns"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function normalizePaymentMethod(m: string | null | undefined): string {
  if (!m) return "Não informado"
  const l = m.toLowerCase()
  if (l.includes("pix")) return "PIX"
  if (l.includes("dinheiro")) return "Dinheiro"
  if (l.includes("cart")) return "Cartão"
  return m
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const transactions = await prisma.transaction.findMany({
    where: { studioId },
    include: { artist: true, appointment: { include: { client: true } } },
    orderBy: { date: "desc" },
    take: 100,
  })

  const monthTx = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd)
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const cashflow: { date: string; income: number; expense: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const day = subDays(now, i)
    const key = format(day, "yyyy-MM-dd")
    const dayTx = transactions.filter((t) => format(t.date, "yyyy-MM-dd") === key)
    cashflow.push({
      date: format(day, "dd/MM"),
      income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    })
  }

  // Payment method breakdown for current month income
  const rawByMethod: Record<string, number> = {}
  for (const tx of monthTx.filter((t) => t.type === "income")) {
    const method = normalizePaymentMethod(tx.paymentMethod)
    rawByMethod[method] = (rawByMethod[method] || 0) + tx.amount
  }
  const STANDARD_METHODS = ["PIX", "Dinheiro", "Cartão"]
  const paymentBreakdown = [
    ...STANDARD_METHODS.map((m) => ({ method: m, amount: rawByMethod[m] || 0 })),
    ...(rawByMethod["Não informado"] ? [{ method: "Não informado", amount: rawByMethod["Não informado"] }] : []),
  ]

  return NextResponse.json({
    summary: { income, expense, balance: income - expense },
    cashflow,
    transactions,
    paymentBreakdown,
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const body = await req.json()
  const tx = await prisma.transaction.create({
    data: {
      studioId,
      type: body.type,
      category: body.category || null,
      description: body.description,
      amount: body.amount,
      paymentMethod: body.paymentMethod || null,
      artistId: body.artistId || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  })
  return NextResponse.json(tx, { status: 201 })
}
