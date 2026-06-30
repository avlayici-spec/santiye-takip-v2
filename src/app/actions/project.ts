"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        site: true, // load site info for municipality, neighborhood, etc.
        expenses: true, // for calculating actualExpense
        units: true // for sale form
      }
    });

    return projects.map((p: any) => ({
      ...p,
      actualExpense: p.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function createProject(data: any) {
  try {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        ownerName: data.ownerName,
        type: data.type,
        basementCount: parseInt(data.basementCount) || 0,
        basementType: data.basementType || "ORTAK_ALAN",
        zeroCount: parseInt(data.zeroCount) || 1,
        normalCount: parseInt(data.normalCount) || 0,
        roofCount: parseInt(data.roofCount) || 0,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : null,
        siteId: data.siteId || null,
        totalConstructionArea: data.totalConstructionArea ? parseFloat(data.totalConstructionArea) : null,
        constructionModel: data.constructionModel || "ARSA_BIZIM",
        landownerShare: data.landownerShare ? parseFloat(data.landownerShare) : null,
        isJointVenture: data.isJointVenture || false,
        partnerName: data.partnerName || null,
        ourShare: data.ourShare !== undefined ? parseFloat(data.ourShare) : 100,
        partnerShare: data.partnerShare !== undefined ? parseFloat(data.partnerShare) : 0,
      }
    });
    revalidatePath("/projeler");
    return { success: true, project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Projeyi oluştururken hata oluştu" };
  }
}

export async function updateProject(id: string, data: any) {
  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        ownerName: data.ownerName,
        type: data.type,
        basementCount: parseInt(data.basementCount) || 0,
        basementType: data.basementType || "ORTAK_ALAN",
        zeroCount: parseInt(data.zeroCount) || 1,
        normalCount: parseInt(data.normalCount) || 0,
        roofCount: parseInt(data.roofCount) || 0,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : null,
        siteId: data.siteId || null,
        totalConstructionArea: data.totalConstructionArea ? parseFloat(data.totalConstructionArea) : null,
        constructionModel: data.constructionModel || "ARSA_BIZIM",
        landownerShare: data.landownerShare ? parseFloat(data.landownerShare) : null,
        isJointVenture: data.isJointVenture || false,
        partnerName: data.partnerName || null,
        ourShare: data.ourShare !== undefined ? parseFloat(data.ourShare) : 100,
        partnerShare: data.partnerShare !== undefined ? parseFloat(data.partnerShare) : 0,
      }
    });
    revalidatePath("/projeler");
    return { success: true, project };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Projeyi güncellerken hata oluştu" };
  }
}

export async function deleteProject(id: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            paymentPlans: true,
            commissions: true,
          }
        },
        expenses: true,
        contracts: true,
      }
    });

    if (!project) {
      return { success: false, error: "Blok bulunamadı." };
    }

    const hasActiveUnits = project.units.some(u => 
      u.status !== "SATILIK" || 
      u.customerId !== null || 
      u.paymentPlans.length > 0 || 
      u.commissions.length > 0
    );

    const hasExpenses = project.expenses.length > 0;
    const hasContracts = project.contracts.length > 0;

    if (hasActiveUnits || hasExpenses || hasContracts) {
      return { 
        success: false, 
        error: "Bu blokta satış, gider veya taşeron sözleşmesi kaydı bulunmaktadır. Sadece hiç işlem görmemiş (boş) bloklar silinebilir." 
      };
    }

    await prisma.project.delete({
      where: { id }
    });

    revalidatePath("/projeler");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Blok silinirken bir hata oluştu: " + error.message };
  }
}
