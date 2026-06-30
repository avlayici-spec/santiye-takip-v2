"use client";

import { Building2, TrendingUp, Users, Wallet, AlertCircle, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";

export default function ClientPage({
  projects,
  expenses,
  sales,
  customers,
  missingAccrualPeriod
}: {
  projects: any[],
  expenses: any[],
  sales: any[],
  customers: any[],
  missingAccrualPeriod?: string | null
}) {
  const activeProjectsCount = projects.length;
  
  const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  
  const totalCollected = sales.reduce((sum, s) => {
    const paid = s.paymentPlan?.filter((p: any) => p.isPaid).reduce((pSum: number, p: any) => pSum + p.amount, 0) || 0;
    return sum + paid;
  }, 0);
  
  const totalRemaining = totalRevenue - totalCollected;

  const stats = [
    { label: "Aktif Projeler", value: activeProjectsCount.toString(), icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Toplam Satış Cirosu", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Bekleyen Tahsilat", value: formatCurrency(totalRemaining), icon: Wallet, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Kayıtlı Müşteri", value: customers.length.toString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  // Prepare chart data (Project based Revenue vs Expense)
  const chartData = projects.map(proj => {
    const projSales = sales.filter(s => s.projectId === proj.id);
    const projExpenses = expenses.filter(e => e.projectId === proj.id);
    
    const revenue = projSales.reduce((sum, s) => sum + s.salePrice, 0);
    const expense = projExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      name: proj.name,
      shortName: proj.name.length > 15 ? proj.name.substring(0, 15) + "..." : proj.name,
      Gelir: revenue,
      Gider: expense,
      Kar: revenue - expense
    };
  });

  // Recent transactions
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
          <p className="font-bold text-slate-900 mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <p className="text-green-600 font-bold text-sm">
              Gelir: {formatCurrency(payload[0].value)}
            </p>
            <p className="text-red-500 font-bold text-sm">
              Gider: {formatCurrency(payload[1].value)}
            </p>
            <p className="text-slate-900 font-black text-sm pt-1 border-t border-slate-100 mt-1">
              Fark: {formatCurrency(payload[0].payload.Kar)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatMissingPeriod = (periodStr: string) => {
    const [year, month] = periodStr.split("-");
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ana Sayfa</h1>
        <p className="text-slate-500 mt-2 font-medium">İnşaat projelerinizin genel durumu ve finansal özeti.</p>
      </div>

      {missingAccrualPeriod && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300 shadow-md shadow-amber-500/5">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Maaş Tahakkuk Uyarısı</h3>
              <p className="text-slate-600 text-sm mt-1 font-semibold">
                <strong>{formatMissingPeriod(missingAccrualPeriod)}</strong> dönemi personel maaş tahakkukları henüz başlatılmamış! Lütfen ilgili dönem için tahakkuk işlemlerini yapınız.
              </p>
            </div>
          </div>
          <Link
            href="/ofis?tab=PAYROLL"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-600/20 active:scale-95 shrink-0 text-sm flex items-center gap-2"
          >
            Tahakkukları Başlat
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="premium-card p-5 flex items-center gap-3 bg-white hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <p className={`font-black text-slate-900 mt-0.5 truncate ${
                stat.value.length > 12 
                  ? "text-lg xl:text-xl" 
                  : "text-xl xl:text-2xl"
              }`} title={stat.value}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card p-6 bg-white flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="text-slate-400" size={20} />
              Proje Bazlı Gelir/Gider (Reel)
            </h2>
          </div>
          
          <div className="flex-1 w-full h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barSize={40}
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="shortName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `₺${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="Gelir" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Gider" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                Henüz grafik verisi bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <div className="premium-card p-6 bg-white">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            Son Çıkan Giderler
          </h2>
          <div className="space-y-4">
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz bir gider kaydedilmedi.</p>
            ) : (
              recentExpenses.map((expense, i) => (
                <div key={expense.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate" title={expense.description || expense.categoryName}>
                      {expense.description || expense.categoryName}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
                      {expense.projectName || "Merkez Ofis"} • {formatDate(expense.date)}
                    </p>
                  </div>
                  <div className="text-sm font-black text-red-600 shrink-0 mt-1">
                    -{formatCurrency(expense.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
