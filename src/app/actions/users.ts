"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth-utils";

async function requireAdmin() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) {
    throw new Error("Yetkisiz işlem");
  }
}

export async function getUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  return { success: true, users };
}

export async function createUser(data: {
  name: string;
  username: string;
  password: string;
  jobTitle?: string;
  isAdmin: boolean;
  permissions: string;
}) {
  await requireAdmin();

  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existing) {
    return { success: false, error: "Bu kullanıcı adı zaten kullanılıyor." };
  }

  const hashedPassword = hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword
    }
  });
  revalidatePath("/kullanicilar");
  return { success: true, user };
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    username?: string;
    password?: string;
    jobTitle?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    permissions?: string;
  }
) {
  await requireAdmin();

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: "Bu kullanıcı adı zaten kullanılıyor." };
    }
  }

  const updateData: any = { ...data };
  if (updateData.password && updateData.password.trim() !== "") {
    updateData.password = hashPassword(updateData.password.trim());
  } else {
    delete updateData.password;
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  revalidatePath("/kullanicilar");
  return { success: true, user };
}

export async function deleteUser(id: string) {
  await requireAdmin();
  // Tek admin silinemesin
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.isAdmin) {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      return { success: false, error: "Son admin kullanıcı silinemez." };
    }
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/kullanicilar");
  return { success: true };
}

export async function toggleUserActive(id: string) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { success: false, error: "Kullanıcı bulunamadı." };
  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
  revalidatePath("/kullanicilar");
  return { success: true };
}
