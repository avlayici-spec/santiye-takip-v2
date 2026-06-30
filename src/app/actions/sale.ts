"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSales() {
  try {
    const units = await prisma.unit.findMany({
      where: {
        status: "SATILDI"
      },
      include: {
        project: true,
        customer: true,
        paymentPlans: {
          orderBy: { dueDate: "asc" }
        },
        commissions: true
      },
      orderBy: { saleDate: "desc" }
    });

    return units.map(u => ({
      id: u.id,
      projectId: u.projectId,
      projectName: u.project?.name,
      unitId: u.id,
      unitNumber: u.unitNumber,
      unitType: u.type,
      floorNumber: u.floorNumber,
      salePrice: u.salePrice,
      saleType: u.paymentPlans.length > 1 ? "TAKSITLI" : "PESIN",
      customer: u.customer,
      paymentPlan: u.paymentPlans,
      commission: u.commissions[0] || null
    }));
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

export async function getCustomers() {
  try {
    return await prisma.customer.findMany({
      include: {
        units: {
          include: {
            project: true
          }
        }
      },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function createCustomer(data: any) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      }
    });
    revalidatePath("/satislar");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Müşteri kaydedilirken bir hata oluştu." };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      }
    });
    revalidatePath("/satislar");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Müşteri güncellenirken bir hata oluştu." };
  }
}

export async function collectPayment(installmentId: string) {
  try {
    const plan = await prisma.paymentPlan.findUnique({
      where: { id: installmentId }
    });
    if (!plan) {
      return { success: false, error: "Ödeme taksiti bulunamadı." };
    }

    await prisma.paymentPlan.update({
      where: { id: installmentId },
      data: {
        isPaid: true,
        paidDate: new Date(),
        paidAmount: plan.amount
      }
    });
    
    revalidatePath("/satislar");
    return { success: true };
  } catch (error) {
    console.error("Error collecting payment:", error);
    return { success: false };
  }
}

// Complex creation for sale:
// 1. Create or connect Customer
// 2. Update Unit to SATILDI
// 3. Create PaymentPlans
// 4. Create Commission
export async function createSale(data: any) {
  try {
    await prisma.$transaction(async (tx) => {
      let customerId = data.customer?.id;
      if (!customerId || customerId === "NEW" || (typeof customerId === "string" && customerId.startsWith("c_"))) {
        // Create new customer
        const newCust = await tx.customer.create({
          data: {
            name: data.customer.name,
            phone: data.customer.phone,
            email: data.customer.email
          }
        });
        customerId = newCust.id;
      }

      // Update Unit
      await tx.unit.update({
        where: { id: data.unitId },
        data: {
          status: "SATILDI",
          salePrice: parseFloat(data.salePrice),
          customerId,
          saleDate: new Date()
        }
      });

      // Create Payment Plans
      for (const plan of data.paymentPlan) {
        await tx.paymentPlan.create({
          data: {
            unitId: data.unitId,
            amount: parseFloat(plan.amount),
            isPaid: plan.isPaid,
            dueDate: new Date(plan.dueDate),
            paidAmount: plan.isPaid ? parseFloat(plan.amount) : 0,
            paidDate: plan.isPaid ? new Date(plan.paidDate) : null
          }
        });
      }

      // Create Commission if exists
      if (data.commission && data.commission.amount > 0) {
        await tx.commission.create({
          data: {
            unitId: data.unitId,
            agentName: data.commission.agent,
            amount: parseFloat(data.commission.amount),
            isPaid: false
          }
        });
      }
    });

    revalidatePath("/satislar");
    revalidatePath("/projeler");
    return { success: true };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { success: false, error: "Satış eklenirken hata oluştu" };
  }
}
