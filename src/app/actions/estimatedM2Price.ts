"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEstimatedM2Prices() {
  try {
    const prices = await prisma.estimatedM2Price.findMany({
      orderBy: [
        { year: "desc" },
        { type: "asc" }
      ]
    });
    return { success: true, prices };
  } catch (error: any) {
    console.error("Error fetching estimated m2 prices:", error);
    return { success: false, error: error.message, prices: [] };
  }
}

export async function updateEstimatedM2Price(year: number, type: string, price: number) {
  try {
    const record = await prisma.estimatedM2Price.upsert({
      where: {
        year_type: { year, type }
      },
      update: {
        price
      },
      create: {
        year,
        type,
        price
      }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/projeler");
    return { success: true, price: record };
  } catch (error: any) {
    console.error("Error updating estimated m2 price:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEstimatedM2Price(id: string) {
  try {
    await prisma.estimatedM2Price.delete({
      where: { id }
    });
    revalidatePath("/ayarlar");
    revalidatePath("/projeler");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting estimated m2 price:", error);
    return { success: false, error: error.message };
  }
}
