"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProjectDetails(projectId: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        units: {
          orderBy: [
            { floorNumber: 'asc' },
            { unitNumber: 'asc' }
          ]
        },
        contracts: {
          include: {
            subcontractor: true,
            payments: true
          }
        }
      }
    });

    if (!project) return null;

    const subcontracts = project.contracts.map(c => ({
      ...c,
      paid: c.payments.reduce((sum, p) => sum + p.amount, 0),
      subcontractorName: c.subcontractor.name,
      specialty: c.subcontractor.specialty
    }));

    return { project, subcontracts };
  } catch (error) {
    console.error("Error fetching project details:", error);
    return null;
  }
}

export async function createUnit(data: any) {
  try {
    const unit = await prisma.unit.create({
      data: {
        projectId: data.projectId,
        unitNumber: data.unitNumber,
        floorNumber: data.floorNumber,
        type: data.type || null,
        isDuplex: data.isDuplex || false,
        linkedFloors: data.linkedFloors || null,
        netArea: data.netArea ? parseFloat(data.netArea) : null,
        brutArea: data.brutArea ? parseFloat(data.brutArea) : null,
        ownerType: data.ownerType || "MUTEAHHIT",
        estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : null,
        status: data.status || "SATILIK",
      }
    });
    revalidatePath(`/projeler/${data.projectId}`);
    return { success: true, unit };
  } catch (error) {
    console.error("Error creating unit:", error);
    return { success: false, error: "Ünite oluşturulamadı" };
  }
}

export async function updateUnit(id: string, data: any) {
  try {
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        unitNumber: data.unitNumber,
        floorNumber: data.floorNumber,
        type: data.type || null,
        isDuplex: data.isDuplex || false,
        linkedFloors: data.linkedFloors || null,
        netArea: data.netArea ? parseFloat(data.netArea) : null,
        brutArea: data.brutArea ? parseFloat(data.brutArea) : null,
        ownerType: data.ownerType || "MUTEAHHIT",
        estimatedPrice: data.estimatedPrice ? parseFloat(data.estimatedPrice) : null,
        status: data.status || "SATILIK",
      }
    });
    revalidatePath(`/projeler/${unit.projectId}`);
    return { success: true, unit };
  } catch (error) {
    console.error("Error updating unit:", error);
    return { success: false, error: "Ünite güncellenemedi" };
  }
}

export async function deleteUnit(id: string, projectId?: string) {
  try {
    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const unit = await prisma.unit.findUnique({
        where: { id },
        select: { projectId: true }
      });
      if (!unit) return { success: false, error: "Ünite bulunamadı" };
      resolvedProjectId = unit.projectId;
    }

    await prisma.unit.delete({ where: { id } });
    revalidatePath(`/projeler/${resolvedProjectId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting unit:", error);
    return { success: false, error: "Ünite silinemedi" };
  }
}
