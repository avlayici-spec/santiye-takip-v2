"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSubcontractors() {
  try {
    return await prisma.subcontractor.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Error fetching subcontractors:", error);
    return [];
  }
}

export async function getContracts() {
  try {
    return await prisma.subcontractorContract.findMany({
      include: {
        subcontractor: true,
        project: {
          include: {
            site: true
          }
        },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return [];
  }
}

export async function createSubcontractor(data: any) {
  try {
    const sub = await prisma.subcontractor.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        specialty: data.specialty
      }
    });
    revalidatePath("/taseron");
    return { success: true, sub };
  } catch (error) {
    console.error("Error creating subcontractor:", error);
    return { success: false, error: "Taşeron oluşturulamadı" };
  }
}

export async function createContract(data: any) {
  try {
    const session = await auth();
    if (!session) throw new Error("Yetkisiz");

    // "id" varsa güncelleme yap
    if (data.id) {
      const existing = await prisma.subcontractorContract.findUnique({
        where: { id: data.id }
      });
      if (!existing) throw new Error("Sözleşme bulunamadı");

      const contract = await prisma.subcontractorContract.update({
        where: { id: data.id },
        data: {
          projectId: data.projectId,
          subcontractorId: data.subcontractorId,
          agreementType: data.agreementType,
          totalAmount: parseFloat(data.totalAmount) || 0,
          unitPrice: parseFloat(data.unitPrice) || 0,
          estimatedM2: parseFloat(data.estimatedM2) || 0,
          guaranteeDeductionRate: parseFloat(data.guaranteeDeductionRate) || 0,
          advancePayment: parseFloat(data.advancePayment) || 0,
          contractFileUrl: data.contractFileUrl || existing.contractFileUrl,
          description: data.description
        }
      });
      
      revalidatePath("/taseron");
      revalidatePath("/projeler");
      return { success: true, contract };
    }

    const totalAmount = parseFloat(data.totalAmount) || 0;
    const unitPrice = parseFloat(data.unitPrice) || 0;
    const estimatedM2 = parseFloat(data.estimatedM2) || 0;

    const contract = await prisma.subcontractorContract.create({
      data: {
        projectId: data.projectId,
        subcontractorId: data.subcontractorId,
        agreementType: data.agreementType,
        totalAmount: totalAmount,
        unitPrice: unitPrice,
        estimatedM2: estimatedM2,
        guaranteeDeductionRate: parseFloat(data.guaranteeDeductionRate) || 0,
        advancePayment: parseFloat(data.advancePayment) || 0,
        contractFileUrl: data.contractFileUrl || null,
        description: data.description
      }
    });
    revalidatePath("/taseron");
    revalidatePath("/projeler");
    return { success: true, contract };
  } catch (error) {
    console.error("Error creating contract:", error);
    return { success: false, error: "Sözleşme oluşturulamadı" };
  }
}

export async function createPayment(data: any) {
  try {
    let categoryObj = await prisma.expenseSubCategory.findFirst({
      where: { name: { contains: "Taşeron" } }
    });
    
    // If no category found, fetch the first one as fallback
    if (!categoryObj) {
      categoryObj = await prisma.expenseSubCategory.findFirst();
    }

    if (!categoryObj) {
      throw new Error("No expense category found to map the payment");
    }

    const payment = await prisma.subcontractorPayment.create({
      data: {
        contractId: data.contractId,
        amount: parseFloat(data.amount),
        completionPercentage: data.completionPercentage || null,
        grossAmount: data.grossAmount || null,
        guaranteeDeductionAmount: data.guaranteeDeductionAmount || null,
        status: "MUHASEBE_ONAYI_BEKLIYOR", // Default to pending approval
        description: data.description,
        expense: {
          create: {
            projectId: data.projectId,
            amount: parseFloat(data.amount),
            categoryId: categoryObj.categoryId,
            subCategoryId: categoryObj.id,
            description: `[Taşeron Hakedişi] ${data.description}`,
            expenseType: "SANTIYE"
          }
        }
      }
    });
    
    // Fallback if category didn't exist: we still linked an expense but might need proper category ID.
    // In our seed, 'Taşeron Hakedişi' exists.
    
    revalidatePath("/taseron");
    revalidatePath("/giderler");
    revalidatePath("/projeler");
    return { success: true, payment };
  } catch (error) {
    console.error("Error creating payment:", error);
    return { success: false, error: "Hakediş ödemesi kaydedilemedi" };
  }
}

export async function deletePayment(id: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Yetkisiz");

    // This will also delete the associated Expense because of onDelete: Cascade
    await prisma.subcontractorPayment.delete({
      where: { id }
    });

    revalidatePath("/taseron");
    revalidatePath("/projeler");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Hakediş silinemedi" };
  }
}

export async function approvePayment(id: string) {
  try {
    const session = await auth();
    if (!session) throw new Error("Yetkisiz");

    await prisma.subcontractorPayment.update({
      where: { id },
      data: { status: "ODENDI" }
    });

    revalidatePath("/taseron");
    revalidatePath("/projeler");
    return { success: true };
  } catch (error) {
    console.error("Error approving payment:", error);
    return { success: false, error: "Hakediş onaylanamadı" };
  }
}

export async function updateSubcontractor(id: string, data: any) {
  try {
    const sub = await prisma.subcontractor.update({
      where: { id },
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        specialty: data.specialty
      }
    });
    revalidatePath("/taseron");
    return { success: true, sub };
  } catch (error) {
    console.error("Error updating subcontractor:", error);
    return { success: false, error: "Taşeron güncellenemedi" };
  }
}

export async function deleteSubcontractor(id: string) {
  try {
    // Aktif sözleşmesi var mı kontrol et
    const activeContracts = await prisma.subcontractorContract.findMany({
      where: {
        subcontractorId: id,
        status: "AKTIF"
      }
    });

    if (activeContracts.length > 0) {
      return { 
        success: false, 
        error: "Bu taşeronun aktif sözleşmeleri bulunmaktadır. Taşeronu silebilmek için önce tüm sözleşmelerini sonlandırmalısınız!" 
      };
    }

    await prisma.subcontractor.delete({
      where: { id }
    });
    revalidatePath("/taseron");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subcontractor:", error);
    return { success: false, error: "Taşeron silinemedi" };
  }
}

export async function terminateContract(contractId: string, reason: string) {
  try {
    const contract = await prisma.subcontractorContract.update({
      where: { id: contractId },
      data: {
        status: "SONLANDIRILDI",
        terminationReason: reason,
        terminationDate: new Date()
      }
    });
    revalidatePath("/taseron");
    revalidatePath("/projeler");
    return { success: true, contract };
  } catch (error) {
    console.error("Error terminating contract:", error);
    return { success: false, error: "Sözleşme sonlandırılamadı" };
  }
}
