"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: {
        project: true,
        site: true,
        category: true,
        subCategory: true
      }
    });

    return expenses.map((e: any) => ({
      ...e,
      projectName: e.project?.name || e.site?.name || "Bilinmeyen Şantiye",
      categoryName: e.category?.name || e.categoryName,
      subCategoryName: e.subCategory?.name || e.subCategoryName
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function createExpense(data: any) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          siteId: data.siteId || null,
          projectId: data.projectId || null,
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId,
          amount: data.amount ? parseFloat(data.amount) : 0,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          documentNo: data.documentNo || null,
          supplier: data.supplier || null,
          paidBy: data.paidBy || "BIZ",
          expenseType: (data.projectId || data.siteId) ? "SANTIYE" : "OFIS"
        }
      });

      // Eğer personel ödemesi bilgileri varsa otomatik olarak tahakkuk ve ödeme kaydı oluştur/ilişkilendir
      if (data.staffId && data.paymentType && data.period) {
        const staff = await tx.staff.findUnique({
          where: { id: data.staffId }
        });
        
        if (staff) {
          let accrual = await tx.staffAccrual.findUnique({
            where: {
              staffId_period: {
                staffId: data.staffId,
                period: data.period
              }
            }
          });
          
          if (!accrual) {
            accrual = await tx.staffAccrual.create({
              data: {
                staffId: data.staffId,
                period: data.period,
                salary: staff.salary,
                insurancePremium: staff.insurancePremium
              }
            });
          }
          
          await tx.staffPayment.create({
            data: {
              staffId: data.staffId,
              accrualId: accrual.id,
              amount: data.amount ? parseFloat(data.amount) : 0,
              date: data.date ? new Date(data.date) : new Date(),
              description: data.description || `${data.period} dönemi ${data.paymentType === "MAAS" ? "Maaş" : "SGK"} Ödemesi`,
              paymentType: data.paymentType,
              expenseId: expense.id
            }
          });
        }
      }

      return expense;
    });

    revalidatePath("/giderler");
    revalidatePath("/projeler");
    revalidatePath("/analiz");
    revalidatePath("/ofis");
    return { success: true, expense: result };
  } catch (error) {
    console.error("Error creating expense:", error);
    return { success: false, error: "Gider eklenirken hata oluştu" };
  }
}

export async function updateExpense(id: string, data: any) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: {
          siteId: data.siteId || null,
          projectId: data.projectId || null,
          categoryId: data.categoryId,
          subCategoryId: data.subCategoryId,
          amount: data.amount ? parseFloat(data.amount) : 0,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description,
          documentNo: data.documentNo || null,
          supplier: data.supplier || null,
          paidBy: data.paidBy || "BIZ",
          expenseType: (data.projectId || data.siteId) ? "SANTIYE" : "OFIS"
        },
        include: {
          project: true,
          site: true,
          category: true,
          subCategory: true
        }
      });

      // Eğer personel ödemesi güncelleniyorsa ödeme tablosundaki tutarı da güncelle
      await tx.staffPayment.updateMany({
        where: { expenseId: id },
        data: {
          amount: data.amount ? parseFloat(data.amount) : 0,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description
        }
      });

      return expense;
    });

    revalidatePath("/giderler");
    revalidatePath("/projeler");
    revalidatePath("/analiz");
    revalidatePath("/ofis");
    return { success: true, expense: {
      ...result,
      projectName: result.project?.name || result.site?.name || "Bilinmeyen Şantiye",
      categoryName: result.category?.name || result.categoryName,
      subCategoryName: result.subCategory?.name || result.subCategoryName,
    }};
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error: "Gider güncellenirken hata oluştu" };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/giderler");
    revalidatePath("/projeler");
    revalidatePath("/analiz");
    revalidatePath("/ofis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Gider silinirken hata oluştu" };
  }
}
