import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFrequencyDays } from "@/lib/utils"

function normalizeMethod(m: string | null | undefined) {
  if (!m) return "other"
  const l = m.toLowerCase()
  if (l.includes("pix")) return "pix"
  if (l.includes("dinheiro")) return "cash"
  if (l.includes("cart")) return "card"
  return "other"
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId

  const { searchParams } = new URL(req.url)
  const artistIdFilter = searchParams.get("artistId")

  const artists = await prisma.user.findMany({
    where: {
      studioId,
      isArtist: true,
      isActive: true,
      ...(artistIdFilter ? { id: artistIdFilter } : {}),
    },
    select: {
      id: true, name: true, avatarColor: true, commissionPct: true,
      settlementFrequency: true, settlementDays: true, settlementCycleStart: true,
    },
  })

  const previews = await Promise.all(
    artists.map(async (artist) => {
      // Last settlement (any status) determines where this period starts
      const lastSettlement = await prisma.settlement.findFirst({
        where: { studioId, artistId: artist.id },
        orderBy: { periodEnd: "desc" },
      })

      let periodStart: Date
      if (lastSettlement) {
        periodStart = new Date(lastSettlement.periodEnd)
        periodStart.setDate(periodStart.getDate() + 1)
        periodStart.setHours(0, 0, 0, 0)
      } else if (artist.settlementCycleStart) {
        periodStart = new Date(artist.settlementCycleStart)
        periodStart.setHours(0, 0, 0, 0)
      } else {
        const now = new Date()
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      }

      const freqDays = getFrequencyDays(artist.settlementFrequency, artist.settlementDays)
      const scheduledEnd = new Date(periodStart)
      scheduledEnd.setDate(scheduledEnd.getDate() + freqDays - 1)
      scheduledEnd.setHours(23, 59, 59, 999)

      const isOverdue = new Date() > scheduledEnd

      const appointments = await prisma.appointment.findMany({
        where: { studioId, artistId: artist.id, status: "completed", date: { gte: periodStart } },
        include: { client: { select: { name: true } } },
        orderBy: { date: "desc" },
      })

      const commissionPct = artist.commissionPct
      const totalGross = appointments.reduce((s, a) => s + a.value, 0)
      const artistAmount = totalGross * (commissionPct / 100)
      const studioAmount = totalGross - artistAmount

      let pixAmount = 0, cashAmount = 0, cardAmount = 0, otherAmount = 0
      for (const a of appointments) {
        const m = normalizeMethod(a.paymentMethod)
        if (m === "pix") pixAmount += a.value
        else if (m === "cash") cashAmount += a.value
        else if (m === "card") cardAmount += a.value
        else otherAmount += a.value
      }

      return {
        artist: { id: artist.id, name: artist.name, avatarColor: artist.avatarColor, commissionPct },
        periodStart,
        scheduledEnd,
        isOverdue,
        totalGross,
        artistAmount,
        studioAmount,
        pixAmount,
        cashAmount,
        cardAmount,
        otherAmount,
        appointmentsCount: appointments.length,
        appointments: appointments.map((a) => ({
          id: a.id,
          clientName: a.client?.name ?? null,
          service: a.service,
          date: a.date,
          value: a.value,
          paymentMethod: a.paymentMethod ?? null,
          artistAmount: a.value * (commissionPct / 100),
          studioAmount: a.value * (1 - commissionPct / 100),
        })),
      }
    })
  )

  return NextResponse.json(previews)
}
