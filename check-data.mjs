import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const sitelessProjects = await prisma.project.findMany({
      where: { siteId: null },
      select: { id: true, name: true }
    });
    console.log("Siteless Projects:", sitelessProjects);

    const sitelessExpenses = await prisma.expense.findMany({
      where: {
        AND: [
          { siteId: null },
          { expenseType: "SANTIYE" }
        ]
      },
      select: { id: true, description: true, amount: true }
    });
    console.log("Siteless Expenses:", sitelessExpenses);
  } catch (error) {
    console.error("Error reading database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
