import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const appointmentWhere = session.user.role !== "ADMIN" ? { artistId: (session.user as any).id } : {}
  const clients = await prisma.client.findMany({
    include: { appointments: { where: appointmentWhere, select: { price: true, status: true, date: true }, orderBy: { date: "desc" } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const client = await prisma.client.create({ data: { name: body.name, phone: body.phone, email: body.email, notes: body.notes } })
  return NextResponse.json(client)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json()
  const client = await prisma.client.update({ where: { id: body.id }, data: { name: body.name, phone: body.phone, email: body.email, notes: body.notes } })
  return NextResponse.json(client)
}
