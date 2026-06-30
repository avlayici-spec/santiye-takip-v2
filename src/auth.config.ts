import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [], // auth.ts içerisinde eklenecek
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
        token.permissions = (user as any).permissions;
        token.username = (user as any).username;
        token.jobTitle = (user as any).jobTitle;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).isAdmin = token.isAdmin;
      (session.user as any).permissions = token.permissions;
      (session.user as any).username = token.username;
      (session.user as any).jobTitle = token.jobTitle;
      return session;
    },
  },
} satisfies NextAuthConfig;
