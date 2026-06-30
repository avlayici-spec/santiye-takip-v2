"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function getUTCDayDifference(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
  const utc2 = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export async function getStaff() {
  try {
    return await prisma.staff.findMany({
      include: {
        accruals: {
          include: {
            payments: true
          },
          orderBy: { period: "desc" }
        },
        payments: {
          orderBy: { date: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function createStaff(data: any) {
  try {
    const salaryVal = parseFloat(data.salary || data.baseSalary) || 0;
    const premiumVal = parseFloat(data.insurancePremium) || 0;
    const startDateObj = data.startDate ? new Date(data.startDate) : new Date();
    const endDateObj = data.endDate ? new Date(data.endDate) : null;

    const staff = await prisma.staff.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        salary: salaryVal,
        insurancePremium: premiumVal,
        phone: data.phone,
        address: data.address,
        startDate: startDateObj,
        endDate: endDateObj
      }
    });

    // Personel işe girdikten sonra ilk ayı için otomatik tahakkuk kaydı oluştur (gün bazlı orantılı)
    const periodStr = `${startDateObj.getUTCFullYear()}-${String(startDateObj.getUTCMonth() + 1).padStart(2, "0")}`;
    
    const year = startDateObj.getUTCFullYear();
    const month = startDateObj.getUTCMonth() + 1;
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    
    const effStart = startDateObj;
    const effEnd = (endDateObj === null || endDateObj > periodEnd) ? periodEnd : endDateObj;
    
    const workedDays = Math.max(0, getUTCDayDifference(effEnd, effStart) + 1);

    let finalSalary = salaryVal;
    let finalPremium = premiumVal;
    
    if (workedDays < totalDaysInMonth) {
      finalSalary = Math.round((salaryVal / totalDaysInMonth) * workedDays * 100) / 100;
      finalPremium = Math.round((premiumVal / totalDaysInMonth) * workedDays * 100) / 100;
    }

    await prisma.staffAccrual.create({
      data: {
        staffId: staff.id,
        period: periodStr,
        salary: finalSalary,
        insurancePremium: finalPremium
      }
    }).catch(err => console.error("Initial accrual already exists:", err));

    revalidatePath("/ofis");
    return { success: true, staff };
  } catch (error) {
    console.error("Error creating staff:", error);
    return { success: false, error: "Personel oluşturulamadı" };
  }
}

export async function updateStaff(id: string, data: any) {
  try {
    const salaryVal = parseFloat(data.salary || data.baseSalary) || 0;
    const premiumVal = parseFloat(data.insurancePremium) || 0;
    const startDateObj = data.startDate ? new Date(data.startDate) : undefined;
    const endDateObj = data.endDate === "" ? null : (data.endDate ? new Date(data.endDate) : undefined);

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        title: data.title,
        salary: salaryVal,
        insurancePremium: premiumVal,
        phone: data.phone,
        address: data.address,
        startDate: startDateObj,
        endDate: endDateObj
      }
    });
    revalidatePath("/ofis");
    return { success: true, staff };
  } catch (error) {
    console.error("Error updating staff:", error);
    return { success: false, error: "Personel güncellenemedi" };
  }
}

export async function deleteStaff(id: string) {
  try {
    await prisma.staff.delete({
      where: { id }
    });
    revalidatePath("/ofis");
    return { success: true };
  } catch (error) {
    console.error("Error deleting staff:", error);
    return { success: false, error: "Personel silinemedi" };
  }
}

export async function bulkGenerateAccruals(period: string) {
  try {
    // Check if any accruals exist for this period to prevent double accrual generation
    const existingCount = await prisma.staffAccrual.count({
      where: { period: period }
    });
    
    if (existingCount > 0) {
      const [year, month] = period.split("-");
      const monthName = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ][parseInt(month) - 1];
      return { 
        success: false, 
        error: `${monthName} ${year} dönemi için zaten maaş tahakkuku yapılmıştır. Her ay için yalnızca bir kez tahakkuk başlatabilirsiniz.` 
      };
    }

    const staffList = await prisma.staff.findMany();
    let createdCount = 0;
    
    for (const staff of staffList) {
      const [year, month] = period.split("-").map(Number);
      const periodStart = new Date(Date.UTC(year, month - 1, 1));
      const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      
      const staffStart = new Date(staff.startDate);
      const staffEnd = staff.endDate ? new Date(staff.endDate) : null;
      
      // Eğer işe giriş tarihi bu dönemin sonundan sonraysa, henüz başlamamıştır.
      if (staffStart > periodEnd) continue;
      
      // Eğer işten çıkış tarihi bu dönemin başlangıcından önceyse, zaten ayrılmıştır.
      if (staffEnd !== null && staffEnd < periodStart) continue;
      
      // Dönem içindeki aktif çalışma günlerini hesapla
      const effStart = staffStart < periodStart ? periodStart : staffStart;
      const effEnd = (staffEnd === null || staffEnd > periodEnd) ? periodEnd : staffEnd;
      
      const workedDays = Math.max(0, getUTCDayDifference(effEnd, effStart) + 1);
      
      // Tam ay mı yoksa kısmi çalışma mı?
      let salaryVal = staff.salary;
      let premiumVal = staff.insurancePremium;
      
      if (workedDays < totalDaysInMonth) {
        salaryVal = Math.round((staff.salary / totalDaysInMonth) * workedDays * 100) / 100;
        premiumVal = Math.round((staff.insurancePremium / totalDaysInMonth) * workedDays * 100) / 100;
      }
      
      await prisma.staffAccrual.create({
        data: {
          staffId: staff.id,
          period: period,
          salary: salaryVal,
          insurancePremium: premiumVal
        }
      });
      createdCount++;
    }
    
    revalidatePath("/ofis");
    return { success: true, createdCount };
  } catch (error) {
    console.error("Error bulk generating accruals:", error);
    return { success: false, error: "Tahakkuklar oluşturulamadı" };
  }
}
