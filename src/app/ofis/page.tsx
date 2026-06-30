import { getStaff } from "@/app/actions/staff";
import { getExpenses } from "@/app/actions/expense";
import { getCategories } from "@/app/actions/category";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function OfisPage() {
  const [personnel, expenses, categories] = await Promise.all([
    getStaff(),
    getExpenses(),
    getCategories()
  ]);
  
  const officeExpenses = expenses.filter((e: any) => e.expenseType === "OFIS");

  // Serialize to avoid Next.js date serialization errors
  const serializedPersonnel = JSON.parse(JSON.stringify(personnel));
  const serializedOfficeExpenses = JSON.parse(JSON.stringify(officeExpenses));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return <ClientPage 
    initialPersonnel={serializedPersonnel} 
    initialOfficeExpenses={serializedOfficeExpenses}
    categories={serializedCategories}
  />;
}
