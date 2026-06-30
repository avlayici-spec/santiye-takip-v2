import { getUsers } from "@/app/actions/users";
import { UsersClient } from "./ClientPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function KullanicilarPage() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) redirect("/");

  const result = await getUsers();
  const users = result.success ? result.users : [];

  return <UsersClient initialUsers={users} />;
}
