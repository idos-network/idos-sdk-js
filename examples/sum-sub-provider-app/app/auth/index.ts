import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../lib/db";
import { getHumanId } from "../lib/idos/backend";
import { authorizeCrypto } from "./provider";

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "crypto",
      name: "Crypto Wallet Auth",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      authorize: authorizeCrypto,
    }),
  ],
  callbacks: {
    signIn: async ({ user, credentials }) => {
      if (credentials && user.id) {
        await prisma.user.upsert({
          where: {
            address: user.id,
          },
          update: {
            loginMessage: credentials.message as string,
            loginSignature: credentials.signature as string,
          },
          create: {
            address: user.id,
            loginMessage: credentials.message as string,
            loginSignature: credentials.signature as string,
          },
        });

        const dbUser = await prisma.user.findFirstOrThrow({
          where: {
            address: user.id,
          },
        });

        // Check user in idOS and set human id and wallet id
        if (!dbUser.idosHumanId) {
          const { idosHumanId, idosWalletId } = (await getHumanId(dbUser)) ?? {};

          if (idosHumanId && idosWalletId) {
            await prisma.user.update({
              where: {
                address: user.id,
              },
              data: { idosHumanId, idosWalletId },
            });
          }
        }
      }
      return true;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        // @ts-expect-error Not yet fully typed
        session.user.address = token.sub;
      }

      return session;
    },
  },
  pages: {
    signIn: "/steps/wallet",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
