import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getCashFlowData(monthsToForecast = 6) {
  try {
    const session = await auth();
    if (!session) throw new Error("Yetkisiz");

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Generate months array (e.g. "2026-05", "2026-06", ...)
    const forecastMonths = [];
    for (let i = 0; i < monthsToForecast; i++) {
      const d = new Date(currentYear, currentMonth + i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      forecastMonths.push({
        id: `${year}-${month}`,
        label: `${month}/${year}`,
        year,
        month: d.getMonth(),
        income: 0,
        staffExpense: 0,
        subcontractorExpense: 0,
        netCashFlow: 0,
        cumulativeCash: 0
      });
    }

    // 2. Calculate Active Staff Monthly Cost
    const activeStaff = await prisma.staff.findMany({
      where: { endDate: null }
    });
    const monthlyStaffCost = activeStaff.reduce((sum, s) => sum + s.salary + s.insurancePremium, 0);

    // 3. Fetch Future Incomes (PaymentPlan)
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + monthsToForecast, 0); // End of the last forecasted month

    const pendingIncomes = await prisma.paymentPlan.findMany({
      where: {
        isPaid: false,
        dueDate: {
          gte: startDate
        }
      }
    });

    const allPaidInstallments = await prisma.paymentPlan.aggregate({
      where: { isPaid: true },
      _sum: { paidAmount: true }
    });
    
    // Some installments might be partially paid even if isPaid is false
    const partialPaidInstallments = await prisma.paymentPlan.aggregate({
      where: { isPaid: false },
      _sum: { paidAmount: true }
    });

    const totalCollected = (allPaidInstallments._sum.paidAmount || 0) + (partialPaidInstallments._sum.paidAmount || 0);

    const allExpenses = await prisma.expense.aggregate({
      _sum: { amount: true }
    });
    const totalSpent = allExpenses._sum.amount || 0;

    let currentCashBalance = totalCollected - totalSpent;

    // 4. Group Incomes into Forecast Months
    forecastMonths.forEach(fm => {
      // Add staff cost
      fm.staffExpense = monthlyStaffCost;

      // Add income
      const monthIncomes = pendingIncomes.filter(p => {
        const pDate = new Date(p.dueDate);
        return pDate.getFullYear() === fm.year && pDate.getMonth() === fm.month;
      });
      fm.income = monthIncomes.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

      // Calculate Net
      fm.netCashFlow = fm.income - fm.staffExpense - fm.subcontractorExpense;
      
      // Calculate Cumulative Cash
      currentCashBalance += fm.netCashFlow;
      fm.cumulativeCash = currentCashBalance;
    });

    // 5. Calculate Unallocated Subcontractor Debt (Senaryo B)
    const activeContracts = await prisma.subcontractorContract.findMany({
      where: { status: "AKTIF" },
      include: { payments: true }
    });

    let totalSubcontractorDebt = 0;
    activeContracts.forEach(contract => {
      const paid = contract.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = contract.totalAmount - paid;
      if (remaining > 0) {
        totalSubcontractorDebt += remaining;
      }
    });

    return {
      success: true,
      data: {
        forecast: forecastMonths,
        unallocatedDebt: totalSubcontractorDebt,
        monthlyStaffCost,
        currentCashBalance: totalCollected - totalSpent
      }
    };

  } catch (error) {
    console.error("Error fetching cash flow data:", error);
    return { success: false, error: "Nakit akışı hesaplanamadı." };
  }
}
