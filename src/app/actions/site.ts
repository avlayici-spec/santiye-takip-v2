"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSites() {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        projects: true,
        expenses: true,
      }
    });
    return { success: true, sites };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSite(data: {
  name: string;
  location?: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  municipality?: string;
  neighborhood?: string;
  island?: string;
  parcel?: string;
  areaSize?: number;
  constructionModel?: string;
  landownerShare?: number;
  isJointVenture?: boolean;
  partnerName?: string;
  ourShare?: number;
  partnerShare?: number;
  projects?: { name: string }[];
}) {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Yetkisiz işlem." };

    const site = await prisma.site.create({
      data: {
        name: data.name,
        location: data.location,
        status: data.status || "DEVAM_EDIYOR",
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        municipality: data.municipality || null,
        neighborhood: data.neighborhood || null,
        island: data.island || null,
        parcel: data.parcel || null,
        areaSize: data.areaSize ? parseFloat(data.areaSize as any) : null,
        constructionModel: data.constructionModel || "ARSA_BIZIM",
        landownerShare: data.landownerShare ? parseFloat(data.landownerShare as any) : null,
        isJointVenture: data.isJointVenture || false,
        partnerName: data.partnerName || null,
        ourShare: data.ourShare !== undefined ? parseFloat(data.ourShare as any) : 100,
        partnerShare: data.partnerShare !== undefined ? parseFloat(data.partnerShare as any) : 0,
        projects: data.projects && data.projects.length > 0 ? {
          create: data.projects.map((p) => ({
            name: p.name,
            type: "Apartman",
            ownerName: "",
            constructionModel: data.constructionModel || "ARSA_BIZIM",
            landownerShare: data.landownerShare ? parseFloat(data.landownerShare as any) : null,
            isJointVenture: data.isJointVenture || false,
            partnerName: data.partnerName || null,
            ourShare: data.ourShare !== undefined ? parseFloat(data.ourShare as any) : 100,
            partnerShare: data.partnerShare !== undefined ? parseFloat(data.partnerShare as any) : 0,
          }))
        } : undefined
      },
      include: {
        projects: true
      }
    });

    revalidatePath("/santiyeler");
    return { success: true, site };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSite(
  id: string,
  data: {
    name: string;
    location?: string;
    status: string;
    startDate?: Date;
    endDate?: Date;
    municipality?: string;
    neighborhood?: string;
    island?: string;
    parcel?: string;
    areaSize?: number;
    constructionModel?: string;
    landownerShare?: number;
    isJointVenture?: boolean;
    partnerName?: string;
    ourShare?: number;
    partnerShare?: number;
  }
) {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Yetkisiz işlem." };

    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        municipality: data.municipality || null,
        neighborhood: data.neighborhood || null,
        island: data.island || null,
        parcel: data.parcel || null,
        areaSize: data.areaSize ? parseFloat(data.areaSize as any) : null,
        constructionModel: data.constructionModel || "ARSA_BIZIM",
        landownerShare: data.landownerShare ? parseFloat(data.landownerShare as any) : null,
        isJointVenture: data.isJointVenture || false,
        partnerName: data.partnerName || null,
        ourShare: data.ourShare !== undefined ? parseFloat(data.ourShare as any) : 100,
        partnerShare: data.partnerShare !== undefined ? parseFloat(data.partnerShare as any) : 0,
      },
    });

    revalidatePath("/santiyeler");
    return { success: true, site };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSite(id: string) {
  try {
    const session = await auth();
    if (!session) return { success: false, error: "Yetkisiz işlem." };

    const projectCount = await prisma.project.count({
      where: { siteId: id }
    });
    if (projectCount > 0) {
      return { success: false, error: "Bu şantiyeye bağlı bloklar (projeler) bulunmaktadır. Önce onları silmeli veya taşımalısınız." };
    }

    const expenseCount = await prisma.expense.count({
      where: { siteId: id }
    });
    if (expenseCount > 0) {
      return { success: false, error: "Bu şantiyeye ait gider kayıtları bulunmaktadır. Önce gider kayıtlarını silmeli veya taşımalısınız." };
    }

    await prisma.site.delete({ where: { id } });

    revalidatePath("/santiyeler");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
