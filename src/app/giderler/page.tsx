import { getExpenses } from "@/app/actions/expense";
import { getProjects } from "@/app/actions/project";
import { getCategories } from "@/app/actions/category";
import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function GiderlerPage() {
  const [expenses, projects, categories, sites] = await Promise.all([
    getExpenses(),
    getProjects(),
    getCategories(),
    prisma.site.findMany({ orderBy: { name: "asc" } })
  ]);
  
  const saniyeExpenses = expenses.filter((e: any) => e.expenseType === "SANTIYE");
  
  // Serialize to avoid Next.js date serialization errors
  const serializedExpenses = JSON.parse(JSON.stringify(saniyeExpenses));
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedSites = JSON.parse(JSON.stringify(sites));

  return <ClientPage 
    initialExpenses={serializedExpenses} 
    projects={serializedProjects}
    categories={serializedCategories}
    sites={serializedSites}
  />;
}
