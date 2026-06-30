import { getProjects } from "@/app/actions/project";
import { getExpenses } from "@/app/actions/expense";
import { getSales } from "@/app/actions/sale";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function AnalizPage() {
  const [projects, expenses, sales] = await Promise.all([
    getProjects(),
    getExpenses(),
    getSales()
  ]);
  
  // Serialize to avoid Next.js date serialization errors
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedExpenses = JSON.parse(JSON.stringify(expenses));
  const serializedSales = JSON.parse(JSON.stringify(sales));

  return <ClientPage 
    initialProjects={serializedProjects} 
    initialExpenses={serializedExpenses}
    initialSales={serializedSales}
  />;
}
