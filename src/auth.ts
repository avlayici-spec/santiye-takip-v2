import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { verifyPassword } from "@/lib/auth-utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        });

        if (!user || !user.isActive) return null;
        if (!verifyPassword(credentials.password as string, user.password)) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.username,
          isAdmin: user.isAdmin,
          permissions: user.permissions,
          username: user.username,
          jobTitle: user.jobTitle,
        };
      },
    }),
  ],
});
