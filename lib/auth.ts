import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Get or generate secret - required for NextAuth
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  
  // In development, generate a temporary secret
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️  NEXTAUTH_SECRET not set. Using temporary dev secret. " +
      "Set NEXTAUTH_SECRET in .env for production."
    );
    return "temporary-dev-secret-change-this-in-production";
  }
  
  // In production, use a fallback (Vercel should have set this)
  console.error(
    "ERROR: NEXTAUTH_SECRET environment variable is not set. " +
    "Add it in Vercel Settings → Environment Variables."
  );
  return "missing-secret-in-production";
};

const secret = getSecret();
const nextAuthUrl =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = nextAuthUrl;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt" },
  secret,
};
