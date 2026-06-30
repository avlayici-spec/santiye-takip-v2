import { getProjects } from "@/app/actions/project";
import ClientPage from "./ClientPage";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function ProjelerPage({ searchParams }: { searchParams: Promise<{ siteId?: string }> | any }) {
  const projects = await getProjects();
  const sites = await prisma.site.findMany({
    orderBy: { name: "asc" },
  });
  const m2Prices = await prisma.estimatedM2Price.findMany();
  
  const resolvedParams = await searchParams;
  const filterSiteId = resolvedParams?.siteId || null;
  
  // Serialize to avoid Date object to Client Component error
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedSites = JSON.parse(JSON.stringify(sites));
  const serializedM2Prices = JSON.parse(JSON.stringify(m2Prices));
  
  return (
    <ClientPage 
      initialProjects={serializedProjects} 
      sites={serializedSites} 
      filterSiteId={filterSiteId} 
      estimatedPrices={serializedM2Prices}
    />
  );
}
