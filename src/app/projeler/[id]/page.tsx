import { getProjectDetails } from "@/app/actions/unit";
import ClientPage from "./ClientPage";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectDetails(id);
  
  if (!data) {
    notFound();
  }

  // Serialize to avoid Next.js date serialization errors
  const serializedProject = JSON.parse(JSON.stringify(data.project));
  const serializedSubcontracts = JSON.parse(JSON.stringify(data.subcontracts));
  
  return <ClientPage initialProject={serializedProject} initialSubcontracts={serializedSubcontracts} />;
}
