"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCompanySettings() {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: "singleton" }
    });
    
    if (!settings) {
      // Create default singleton settings if they don't exist yet
      settings = await prisma.companySettings.create({
        data: {
          id: "singleton",
          name: "İnşaatTakip",
          authorized: "",
          phone: "",
          email: "",
          address: "",
          taxOffice: "",
          taxNo: ""
        }
      });
    }
    
    return { success: true, settings };
  } catch (error: any) {
    console.error("Error in getCompanySettings:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCompanySettings(data: {
  name: string;
  authorized?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxOffice?: string;
  taxNo?: string;
}) {
  try {
    const settings = await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: {
        id: "singleton",
        ...data
      }
    });
    
    revalidatePath("/");
    revalidatePath("/ayarlar");
    return { success: true, settings };
  } catch (error: any) {
    console.error("Error in updateCompanySettings:", error);
    return { success: false, error: error.message };
  }
}
