"use client";

import { useState } from "react";
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

  const [selectedBarometerProjectId, setSelectedBarometerProjectId] = useState<string>("ALL");

  // Filter projects based on selected project id
  const barometerProjects = selectedBarometerProjectId === "ALL" 
    ? projects 
    : projects.filter(p => p.id === selectedBarometerProjectId);

  // --- HEDEF vs GERÇEKLEŞEN FİNANSAL BAROMETRE HESAPLAMALARI ---
  // 1. Hedef Satış Cirosu (Seçilen projelerdeki dairelerin tahmini/gerçek satış fiyatı toplamı)
  const targetRevenue = barometerProjects.reduce((sum, p) => {
    const projUnits = p.units || [];
    const unitsTotal = projUnits.reduce((uSum: number, u: any) => uSum + (u.salePrice || u.estimatedPrice || 0), 0);
    return sum + unitsTotal;
  }, 0);

  // 2. Hedef Proje Maliyeti
  const targetCost = barometerProjects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);

  // 3. Hedef Net Kâr
  const targetProfit = targetRevenue - targetCost;
  const targetProfitMargin = targetRevenue > 0 ? ((targetProfit / targetRevenue) * 100).toFixed(1) : "0.0";

  // 4. Gerçekleşen Satış Geliri & Harcama
  const barometerSales = selectedBarometerProjectId === "ALL"
    ? sales
    : sales.filter(s => s.projectId === selectedBarometerProjectId);

  const barometerExpenses = selectedBarometerProjectId === "ALL"
    ? expenses
    : expenses.filter(e => e.projectId === selectedBarometerProjectId);

  const barometerActualRevenue = barometerSales.reduce((sum, s) => sum + s.salePrice, 0);
  const barometerActualExpense = barometerExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. Gerçekleşen Kâr Durumu
  const actualProfit = barometerActualRevenue - barometerActualExpense;

  // İlerleme yüzdeleri
  const revenueProgress = targetRevenue > 0 ? Math.min(Math.round((barometerActualRevenue / targetRevenue) * 100), 100) : 0;
  const costProgress = targetCost > 0 ? Math.round((barometerActualExpense / targetCost) * 100) : 0;

  const selectedProjectName = selectedBarometerProjectId === "ALL" 
    ? "Tüm Projeler (Genel Toplam)" 
    : projects.find(p => p.id === selectedBarometerProjectId)?.name || "Seçili Proje";

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

      {/* Hedef vs Gerçekleşen Finansal Barometre (Proje Seçilebilir) */}
      <div className="premium-card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl rounded-3xl border border-slate-700/80 animate-in fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider mb-2">
              🎯 STRATEJİK FİNANS BAROMETRESİ
            </span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Hedef (Bütçelenen) vs. Gerçekleşen Kârlılık Performansı
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Tanımlanan daire satış hedefleri ile fiili harcamaların anlık karlılık kıyası
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* Proje Seçim Filtresi */}
            <div className="flex flex-col items-start bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Analiz Edilen Proje</span>
              <select
                value={selectedBarometerProjectId}
                onChange={(e) => setSelectedBarometerProjectId(e.target.value)}
                className="bg-slate-900 text-amber-400 font-bold text-xs sm:text-sm border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[240px] truncate"
              >
                <option value="ALL">🏢 Tüm Projeler (Genel Toplam)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏗️ {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 px-5 py-3 rounded-2xl flex flex-col items-end shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beklenen Kâr Marjı</span>
              <span className="text-2xl font-black text-amber-400 mt-0.5">%{targetProfitMargin}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          {/* Sol Panel: Hedeflenen */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                📋 HEDEF / BÜTÇELENEN DURUM
              </span>
              <span className="text-[11px] font-bold text-slate-300 truncate max-w-[180px]">{selectedProjectName}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">Beklenen Satış Geliri</span>
                <span className="text-lg font-black text-green-400 mt-0.5 block">{formatCurrency(targetRevenue)}</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">Tahmini Proje Gideri</span>
                <span className="text-lg font-black text-red-400 mt-0.5 block">{formatCurrency(targetCost)}</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Öngörülen Net Kâr</span>
                <span className="text-xl font-black text-white mt-0.5 block">{formatCurrency(targetProfit)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Hedef Kar / Zarar</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${targetProfit >= 0 ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {targetProfit >= 0 ? "KÂRLI PROJE" : "ZARAR RİSKİ"}
                </span>
              </div>
            </div>
          </div>

          {/* Sağ Panel: Gerçekleşen */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                📈 GERÇEKLEŞEN (FİİLİ) DURUM
              </span>
              <span className="text-[11px] font-bold text-slate-300">Canlı Veri</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Satış Geliri Gerçekleşmesi</span>
                  <span className="text-green-400 font-black">{formatCurrency(barometerActualRevenue)} ({revenueProgress}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${revenueProgress}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-300">Bütçe / Maliyet Kullanımı</span>
                  <span className={`font-black ${costProgress > 100 ? "text-red-400" : "text-amber-400"}`}>
                    {formatCurrency(barometerActualExpense)} ({costProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${costProgress > 100 ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${Math.min(costProgress, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Gerçekleşen Net Kâr / Nakit Fark</span>
                <span className={`text-xl font-black mt-0.5 block ${actualProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatCurrency(actualProfit)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Anlık Durum</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${actualProfit >= 0 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                  {actualProfit >= 0 ? "POZİTİF BAKİYE" : "HARCAMA AĞIRLIKLI"}
                </span>
              </div>
            </div>
          </div>
        </div>
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
