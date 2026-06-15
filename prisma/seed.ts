import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { subDays, addDays, setHours, setMinutes } from "date-fns"

const prisma = new PrismaClient()

async function main() {
  await prisma.appointment.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  const adminPass = await bcrypt.hash("admin123", 10)
  const artistPass = await bcrypt.hash("artist123", 10)

  const admin = await prisma.user.create({ data: { name: "Rafael Veiga", email: "admin@inkagenda.com", password: adminPass, role: "ADMIN", specialty: "Blackwork & Fineline", bio: "Fundador do estúdio com 15 anos de experiência.", hourlyRate: 300, avatarColor: "#d4a853" } })
  const ana = await prisma.user.create({ data: { name: "Ana Lima", email: "ana@inkagenda.com", password: artistPass, role: "ARTIST", specialty: "Realismo", bio: "Especialista em realismo fotográfico e retratos.", hourlyRate: 250, avatarColor: "#e879f9" } })
  const carlos = await prisma.user.create({ data: { name: "Carlos Mendes", email: "carlos@inkagenda.com", password: artistPass, role: "ARTIST", specialty: "Old School", bio: "Apaixonado pelo estilo tradicional americano.", hourlyRate: 200, avatarColor: "#34d399" } })
  const julia = await prisma.user.create({ data: { name: "Julia Santos", email: "julia@inkagenda.com", password: artistPass, role: "ARTIST", specialty: "Aquarela & Geométrico", bio: "Arte colorida com técnicas de aquarela únicas.", hourlyRate: 220, avatarColor: "#60a5fa" } })

  const clients = await Promise.all([
    prisma.client.create({ data: { name: "Lucas Oliveira", phone: "(11) 99999-0001", email: "lucas@email.com" } }),
    prisma.client.create({ data: { name: "Mariana Costa", phone: "(11) 99999-0002", email: "mariana@email.com" } }),
    prisma.client.create({ data: { name: "Pedro Alves", phone: "(11) 99999-0003", email: "pedro@email.com" } }),
    prisma.client.create({ data: { name: "Fernanda Silva", phone: "(11) 99999-0004", email: "fernanda@email.com" } }),
    prisma.client.create({ data: { name: "Rodrigo Santos", phone: "(11) 99999-0005", email: "rodrigo@email.com" } }),
    prisma.client.create({ data: { name: "Camila Ferreira", phone: "(11) 99999-0006", email: "camila@email.com" } }),
    prisma.client.create({ data: { name: "Thiago Rocha", phone: "(11) 99999-0007" } }),
    prisma.client.create({ data: { name: "Beatriz Nunes", phone: "(11) 99999-0008" } }),
    prisma.client.create({ data: { name: "Eduardo Lima", phone: "(11) 99999-0009" } }),
    prisma.client.create({ data: { name: "Amanda Gomes", phone: "(11) 99999-0010" } }),
    prisma.client.create({ data: { name: "Felipe Martins", phone: "(11) 99999-0011" } }),
    prisma.client.create({ data: { name: "Gabriela Torres", phone: "(11) 99999-0012" } }),
  ])

  const artists = [admin, ana, carlos, julia]
  const services = ["TATTOO", "TOUCHUP", "CONSULTATION", "PIERCING"]
  const doneStatuses = ["COMPLETED", "COMPLETED", "COMPLETED", "CANCELLED"]
  const prices = [350, 500, 800, 1200, 1500, 200, 150, 600, 900, 250]
  const data: any[] = []

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 90) + 1
    const hour = 9 + Math.floor(Math.random() * 9)
    data.push({ date: setMinutes(setHours(subDays(new Date(), daysAgo), hour), 0), duration: [60,90,120,180][Math.floor(Math.random()*4)], service: services[Math.floor(Math.random()*services.length)], price: prices[Math.floor(Math.random()*prices.length)], status: doneStatuses[Math.floor(Math.random()*doneStatuses.length)], artistId: artists[Math.floor(Math.random()*artists.length)].id, clientId: clients[Math.floor(Math.random()*clients.length)].id })
  }
  const futureStatuses = ["SCHEDULED","CONFIRMED","SCHEDULED","CONFIRMED"]
  for (let i = 1; i <= 14; i++) {
    if (i % 2 === 0 || i <= 4) data.push({ date: setMinutes(setHours(addDays(new Date(),i), 9+Math.floor(Math.random()*9)), 0), duration: [60,90,120][Math.floor(Math.random()*3)], service: services[Math.floor(Math.random()*3)], price: prices[Math.floor(Math.random()*prices.length)], status: futureStatuses[Math.floor(Math.random()*futureStatuses.length)], artistId: artists[Math.floor(Math.random()*artists.length)].id, clientId: clients[Math.floor(Math.random()*clients.length)].id })
  }
  for (let i = 0; i < 4; i++) data.push({ date: setMinutes(setHours(new Date(), 9+i*2), 0), duration: 120, service: "TATTOO", price: prices[i], status: i===0?"IN_PROGRESS":i===1?"CONFIRMED":"SCHEDULED", artistId: artists[i%artists.length].id, clientId: clients[i].id, description: "Sessão agendada" })

  await prisma.appointment.createMany({ data })
  console.log("✅ Seed concluído!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
