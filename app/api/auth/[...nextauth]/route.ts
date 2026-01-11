import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/api/db";
import { createNewApiKeyForUser } from "@/lib/api/api-key";
import { BadRequestError } from "@/lib/api/errors";

const allowedEmails =
  process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // sign in only allowed for specific emails
  callbacks: {
    async signIn({ profile }) {
      const email = (profile as { email?: string } | null)?.email?.toLowerCase();
      if (!email) return false;
      return allowedEmails.includes(email);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  events: {
    // add API key to new user
    async createUser({ user }) {
      createNewApiKeyForUser(user.id).catch(() => {
        throw new BadRequestError(
          "API_KEY_CREATION_FAILED",
          "Failed to create API key for new user"
        );
      });
    },
  },
});

export { handler as GET, handler as POST };
