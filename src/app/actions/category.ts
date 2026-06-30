"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      include: {
        subCategories: true
      },
      orderBy: { createdAt: "asc" }
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(name: string, color?: string) {
  try {
    const category = await prisma.expenseCategory.create({
      data: {
        name,
        color: color || "blue"
      }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/giderler");
    return { success: true, category: { ...category, subCategories: [] } };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Ana kategori eklenirken hata oluştu" };
  }
}

export async function createSubCategory(categoryId: string, name: string) {
  try {
    const sub = await prisma.expenseSubCategory.create({
      data: {
        name,
        categoryId
      }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/giderler");
    return { success: true, sub };
  } catch (error) {
    console.error("Error creating sub category:", error);
    return { success: false, error: "Alt kategori eklenirken hata oluştu" };
  }
}

export async function deleteSubCategory(subId: string) {
  try {
    await prisma.expenseSubCategory.delete({
      where: { id: subId }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/giderler");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sub category:", error);
    return { success: false, error: "Alt kategori silinirken hata oluştu" };
  }
}

export async function updateCategory(id: string, name: string, color?: string) {
  try {
    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name,
        color: color || "blue"
      }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/giderler");
    return { success: true, category: updated };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Kategori güncellenirken hata oluştu" };
  }
}

export async function updateSubCategory(id: string, name: string) {
  try {
    const updated = await prisma.expenseSubCategory.update({
      where: { id },
      data: {
        name
      }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/giderler");
    return { success: true, subCategory: updated };
  } catch (error) {
    console.error("Error updating sub category:", error);
    return { success: false, error: "Alt kategori güncellenirken hata oluştu" };
  }
}
