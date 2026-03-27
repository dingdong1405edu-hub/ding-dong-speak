import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

function isActivePremium(premiumUntil: Date | null | undefined) {
  return Boolean(premiumUntil && premiumUntil.getTime() > Date.now());
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      return account?.provider === "google" && Boolean(profile?.email);
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.credits = user.credits ?? 30;
        token.isPro = user.isPro ?? false;
        token.streak = user.streak ?? 0;
      }

      if ((trigger === "update" || token.credits === undefined || token.isPro === undefined || token.streak === undefined) && token.email) {
        const freshUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (freshUser) {
          const activePro = isActivePremium(freshUser.premiumUntil);
          if (freshUser.isPro !== activePro) {
            await prisma.user.update({ where: { id: freshUser.id }, data: { isPro: activePro } });
          }
          token.id = freshUser.id;
          token.credits = freshUser.credits;
          token.isPro = activePro;
          token.streak = freshUser.streak;
          token.picture = freshUser.image ?? token.picture;
          token.name = freshUser.name ?? token.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.credits = token.credits ?? 30;
        session.user.isPro = token.isPro ?? false;
        session.user.streak = token.streak ?? 0;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
