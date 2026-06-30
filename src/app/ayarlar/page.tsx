import { getCategories } from "@/app/actions/category";
import { getCompanySettings } from "@/app/actions/settings";
import { getEstimatedM2Prices } from "@/app/actions/estimatedM2Price";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function AyarlarPage() {
  const categories = await getCategories();
  const settingsResult = await getCompanySettings();
  const pricesResult = await getEstimatedM2Prices();
  
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedSettings = settingsResult.success ? JSON.parse(JSON.stringify(settingsResult.settings)) : null;
  const serializedPrices = pricesResult.success ? JSON.parse(JSON.stringify(pricesResult.prices)) : [];

  return (
    <ClientPage 
      initialCategories={serializedCategories} 
      initialSettings={serializedSettings} 
      initialPrices={serializedPrices}
    />
  );
}
