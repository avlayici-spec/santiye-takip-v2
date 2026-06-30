import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        name: true,
        username: true,
        password: true,
        isActive: true,
        isAdmin: true
      }
    });
    console.log("USERS_JSON_START");
    console.log(JSON.stringify(users, null, 2));
    console.log("USERS_JSON_END");
  } catch (error) {
    console.error("Error reading users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
