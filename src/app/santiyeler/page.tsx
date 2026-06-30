import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SantiyelerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const canView = hasPermission(
    session.user.isAdmin,
    session.user.permissions,
    "santiyeler_goruntule" as any
  );
  if (!canView) redirect("/");

  const canEdit = hasPermission(
    session.user.isAdmin,
    session.user.permissions,
    "santiyeler_duzenle" as any
  );

  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      projects: true,
      expenses: {
        select: {
          id: true,
          amount: true
        }
      }
    }
  });

  return <ClientPage initialSites={JSON.parse(JSON.stringify(sites))} canEdit={canEdit} />;
}
