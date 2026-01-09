import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/api/db";
import { generateApiKey, hashApiKey } from "@/lib/api/api-key";
import { hash } from "crypto";

const allowedEmails =
  process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

// NextAuth handler
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
      // temp solution;
      // the user now only has apiKey and not the hashed version stored
      // so generate the hashed version of the api key and store it

      const email = (profile as { email?: string } | null)?.email?.toLowerCase();
      const apiKey = prisma.user.findUnique({
        where: { email },
        select: { apiKey: true },
      });

      const userWithApiKey = await apiKey;
      if (userWithApiKey && userWithApiKey.apiKey) {
        await prisma.user.update({
          where: { email },
          data: { apiKeyHash: hashApiKey(userWithApiKey.apiKey) },
        });
      }

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
      const rawApiKey = generateApiKey();
      await prisma.user.update({
        where: { id: user.id },
        data: { apiKeyHash: hashApiKey(rawApiKey) },
      });
    },
  },
});

export { handler as GET, handler as POST };
