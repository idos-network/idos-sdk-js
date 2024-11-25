import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // @ts-expect-error Global is not defined
  if (!global.prisma) {
    // @ts-expect-error Global is not defined
    global.prisma = new PrismaClient();
  }
  // @ts-expect-error Global is not defined
  prisma = global.prisma;
}

export default prisma;
