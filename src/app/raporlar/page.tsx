import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";

export const dynamic = "force-dynamic";

export default async function RaporlarPage() {
  // Fetch real commission records from database
  const commissions = await prisma.commission.findMany({
    include: {
      unit: {
        include: {
          project: true,
          customer: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch real estate units with project and payment details
  const projects = await prisma.project.findMany({
    include: {
      site: true,
      units: {
        include: {
          customer: true,
          paymentPlans: true,
          commissions: true
        },
        orderBy: { unitNumber: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });

  // Fetch expenses with category and project details
  const expenses = await prisma.expense.findMany({
    where: {
      expenseType: "SANTIYE" // Only fetch site expenses for this specific report
    },
    include: {
      project: true,
      site: true,
      category: true,
      subCategory: true
    },
    orderBy: { date: "desc" }
  });

  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <ClientPage 
      initialCommissions={JSON.parse(JSON.stringify(commissions))} 
      initialProjects={JSON.parse(JSON.stringify(projects))} 
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      sites={JSON.parse(JSON.stringify(sites))}
    />
  );
}
