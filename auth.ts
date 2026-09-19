import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "4c9a6e78f110c2e9b87a4891e4f4d2a1b9e83719c2a3847e912401fba45c6123",
})
