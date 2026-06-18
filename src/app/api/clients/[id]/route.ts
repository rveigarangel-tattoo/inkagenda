import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { artist: true, appointments: { include: { artist: true }, orderBy: { date: "desc" } } },
  })
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(client)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const data: any = {}
  for (const k of ["name", "phone", "email", "notes", "healthNotes", "artistId"]) {
    if (body[k] !== undefined) data[k] = body[k] || null
  }
  if (body.birthdate !== undefined) data.birthdate = body.birthdate ? new Date(body.birthdate) : null
  const client = await prisma.client.update({ where: { id: params.id }, data })
  return NextResponse.json(client)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const studioId = (session.user as any).studioId
  const existing = await prisma.client.findFirst({ where: { id: params.id, studioId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  // Detach appointments (keep history, remove client link)
  await prisma.appointment.updateMany({ where: { clientId: params.id }, data: { clientId: null } })
  await prisma.client.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
