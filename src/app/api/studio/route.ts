import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const studio = await prisma.studio.findUnique({ where: { id: studioId } })
  if (!studio) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(studio)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const studioId = (session.user as any).studioId
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.logo !== undefined) data.logo = body.logo || null
  if (body.commissionPct !== undefined) data.commissionPct = body.commissionPct
  const studio = await prisma.studio.update({ where: { id: studioId }, data })
  return NextResponse.json(studio)
}
