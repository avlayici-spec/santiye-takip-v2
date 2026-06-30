import { getSales, getCustomers } from "@/app/actions/sale";
import { getProjects } from "@/app/actions/project";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function SatislarPage() {
  const [sales, projects, customers] = await Promise.all([
    getSales(),
    getProjects(),
    getCustomers()
  ]);
  
  // Serialize to avoid Next.js date serialization errors
  const serializedSales = JSON.parse(JSON.stringify(sales));
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedCustomers = JSON.parse(JSON.stringify(customers));

  return <ClientPage 
    initialSales={serializedSales} 
    initialProjects={serializedProjects}
    initialCustomers={serializedCustomers}
  />;
}
