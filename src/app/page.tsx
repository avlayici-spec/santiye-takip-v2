import { getProjects } from "@/app/actions/project";
import { getExpenses } from "@/app/actions/expense";
import { getSales, getCustomers } from "@/app/actions/sale";
import prisma from "@/lib/prisma";
import ClientPage from "./ClientPage";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [projects, expenses, sales, customers] = await Promise.all([
    getProjects(),
    getExpenses(),
    getSales(),
    getCustomers()
  ]);

  // Check if any accruals are missing for the previous months or the current month (if it's the last day or later)
  const [existingPeriods, staffList] = await Promise.all([
    prisma.staffAccrual.findMany({
      select: { period: true },
      distinct: ['period']
    }),
    prisma.staff.findMany()
  ]);
  const existingPeriodStrings = existingPeriods.map((p: any) => p.period);

  let missingAccrualPeriod = null;
  const today = new Date();

  // Check the last 3 months
  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    // For the current month (i === 0), only warn if today is the last day of the month
    if (i === 0) {
      const lastDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      if (today.getDate() < lastDayOfCurrentMonth) {
        continue;
      }
    }

    // Check if there was any active staff member during this period
    const [year, month] = periodStr.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    const activeStaffCount = staffList.filter((staff: any) => {
      const staffStart = new Date(staff.startDate);
      const staffEnd = staff.endDate ? new Date(staff.endDate) : null;
      return staffStart <= periodEnd && (staffEnd === null || staffEnd >= periodStart);
    }).length;

    // If there were no active employees in that month, no accrual is needed
    if (activeStaffCount === 0) {
      continue;
    }

    if (!existingPeriodStrings.includes(periodStr)) {
      missingAccrualPeriod = periodStr;
      break;
    }
  }

  // Serialize objects to avoid Next.js date serialization errors
  const serializedProjects = JSON.parse(JSON.stringify(projects));
  const serializedExpenses = JSON.parse(JSON.stringify(expenses));
  const serializedSales = JSON.parse(JSON.stringify(sales));
  const serializedCustomers = JSON.parse(JSON.stringify(customers));

  return (
    <ClientPage 
      projects={serializedProjects}
      expenses={serializedExpenses}
      sales={serializedSales}
      customers={serializedCustomers}
      missingAccrualPeriod={missingAccrualPeriod}
    />
  );
}
