import { getSubcontractors, getContracts } from "@/app/actions/subcontractor";
import { getProjects } from "@/app/actions/project";
import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function TaseronPage() {
  const [subcontractors, contracts, projects, sites] = await Promise.all([
    getSubcontractors(),
    getContracts(),
    getProjects(),
    prisma.site.findMany({ orderBy: { name: "asc" } })
  ]);
  
  // Serialize to avoid Next.js date serialization errors
  const serializedSubcontractors = JSON.parse(JSON.stringify(subcontractors));
  const serializedContracts = JSON.parse(JSON.stringify(contracts));
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedSites = JSON.parse(JSON.stringify(sites));

  return <ClientPage 
    initialSubcontractors={serializedSubcontractors} 
    initialContracts={serializedContracts}
    initialProjects={serializedProjects}
    sites={serializedSites}
  />;
}
