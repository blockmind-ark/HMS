import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { verifyBiometricLoginToken } from "@/lib/biometrics/auth-token";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "HMS Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@hms.local" },
        password: { label: "Password", type: "password" },
        biometricLoginToken: { label: "Biometric Login Token", type: "text" },
      },
      async authorize(credentials) {
        // 1. Biometric Token Authentication
        if (credentials?.biometricLoginToken) {
          const verification = verifyBiometricLoginToken(credentials.biometricLoginToken);
          if (verification.valid && verification.userId) {
            const user = await prisma.user.findUnique({
              where: { id: verification.userId },
            });
            if (user) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }
          throw new Error("Invalid or expired biometric login session. Please scan your thumb again.");
        }

        // 2. Standard Email and Password Authentication
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "hospital-management-system-super-secret-key-2026",
};

