import { getCashFlowData } from "@/app/actions/cashflow";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function FinansPage() {
  const cashFlowRes = await getCashFlowData(12); // Forecast for 12 months
  
  return <ClientPage 
    initialData={cashFlowRes.success ? cashFlowRes.data : null} 
  />;
}
