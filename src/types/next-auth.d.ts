// NextAuth tip genişletmeleri
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      permissions: string; // JSON string
      username: string;
      jobTitle?: string;
    } & DefaultSession["user"];
  }
}
