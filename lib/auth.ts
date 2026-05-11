import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@admin.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("E-mail e senha sÃ£o obrigatÃ³rios.")
        }

        const inputEmail = String(credentials.email || "").trim().toLowerCase()
        const inputPassword = String(credentials.password || "")

        let user: any = null
        try {
          user = await prisma.user.findUnique({
            where: { email: inputEmail }
          })
        } catch (err: any) {
          // Dev fallback: allow ADMIN_EMAIL/ADMIN_PASSWORD when DB is unreachable.
          if (process.env.NODE_ENV !== "production") {
            const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase()
            const adminPassword = String(process.env.ADMIN_PASSWORD || "")
            if (adminEmail && adminPassword && inputEmail === adminEmail && inputPassword === adminPassword) {
              return {
                id: "env-admin",
                email: adminEmail,
                name: "Admin",
                role: "ADMIN"
              }
            }
          }

          throw new Error(err?.message || "Falha ao conectar no banco para autenticar.")
        }

        if (!user || !user.password) {
          throw new Error("Credenciais invÃ¡lidas.")
        }

        const isPasswordValid = await bcrypt.compare(inputPassword, user.password)

        if (!isPasswordValid) {
          throw new Error("Credenciais invÃ¡lidas.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        ;(session.user as any).role = token.role as string
        ;(session.user as any).id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/admin/login"
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET
}
