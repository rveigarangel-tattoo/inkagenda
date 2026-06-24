import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email ou username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.login },
              { username: credentials.login },
            ],
          },
        })
        if (!user || !user.isActive) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isArtist: user.isArtist,
          avatarColor: user.avatarColor,
          studioId: user.studioId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.isArtist = (user as any).isArtist
        token.avatarColor = (user as any).avatarColor
        token.studioId = (user as any).studioId
      }
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
        if (dbUser) {
          token.name = dbUser.name
          token.avatarColor = dbUser.avatarColor
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).isArtist = token.isArtist
        ;(session.user as any).avatarColor = token.avatarColor
        ;(session.user as any).studioId = token.studioId
      }
      return session
    },
  },
}
