"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Coins, 
  Briefcase, 
  FileSpreadsheet, 
  PieChart,
  HardHat,
  Percent,
  CheckCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ClientPage({
  initialProjects,
  initialExpenses,
  initialSales
}: {
  initialProjects: any[],
  initialExpenses: any[],
  initialSales: any[]
}) {
  const [projects] = useState(initialProjects);
  const [expenses] = useState(initialExpenses);
  const [sales] = useState(initialSales);
  
  const [selectedProjId, setSelectedProjId] = useState<string>(projects[0]?.id || "");

  const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;
  const generalProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const officeExpenseTotal = expenses
    .filter(e => e.expenseType === "OFIS")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalEstimatedCost = projects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0);

  const projectBalances = projects.map(proj => {
    const projSales = sales.filter(s => s.projectId === proj.id);
    const projExpenses = expenses.filter(e => e.projectId === proj.id);

    const weight = totalEstimatedCost > 0 ? (proj.estimatedCost || 0) / totalEstimatedCost : 0;
    const allocatedOfficeExpense = officeExpenseTotal * weight;

    const revenue = projSales.reduce((sum, s) => sum + s.salePrice, 0);
    const directExpense = projExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expense = directExpense + allocatedOfficeExpense;
    
    const profit = revenue - expense;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const collected = projSales.reduce((sum, s) => {
      const paid = s.paymentPlan.filter((p: any) => p.isPaid).reduce((pSum: number, p: any) => pSum + p.amount, 0);
      return sum + paid;
    }, 0);
    const pending = revenue - collected;

    // Gider Kategorileri Kırılımı 
    const kaba = projExpenses.filter(e => e.categoryName === "Kaba İnşaat").reduce((sum, e) => sum + e.amount, 0);
    const ince = projExpenses.filter(e => e.categoryName === "İnce İnşaat").reduce((sum, e) => sum + e.amount, 0);
    const iscilik = projExpenses.filter(e => e.categoryName === "İşçilik").reduce((sum, e) => sum + e.amount, 0);
    const diger = directExpense - kaba - ince - iscilik;

    return {
      ...proj,
      unitsCount: proj.units?.length || 0,
      soldUnits: proj.units?.filter((u:any) => u.status === "SATILDI").length || 0,
      revenue,
      expense, 
      directExpense,
      allocatedOfficeExpense,
      profit,
      margin,
      collected,
      pending,
      breakdown: { kaba, ince, iscilik, diger, allocatedOfficeExpense }
    };
  });

  const activeProj = projectBalances.find(p => p.id === selectedProjId) || projectBalances[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PieChart className="text-slate-900 w-8 h-8" />
          Kar / Zarar Analizi
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Şantiyelerinizin satış ciroları ile yapım maliyetlerini karşılaştırarak karlılık oranlarını analiz edin.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-slate-900 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şirket Toplam Geliri</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-red-500 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şirket Toplam Maliyeti</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <TrendingDown size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2">
            Ofis Genel Gideri dahil: <span className="font-extrabold text-red-600">{formatCurrency(officeExpenseTotal)}</span>
          </p>
        </div>

        <div className={`premium-card p-6 border-l-4 bg-white ${netProfit >= 0 ? "border-l-green-600" : "border-l-red-600"}`}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Şirket Karı</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netProfit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              <TrendingUp size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genel Kar Oranı (Net)</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">% {generalProfitMargin.toFixed(1)}</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${generalProfitMargin}%` }}></div>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
            <Briefcase size={18} className="text-slate-500" />
            Şantiye Projeleri Karlılık Karşılaştırması
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tablodan proje seçerek detaylı kırılımı inceleyin</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Şantiye Projesi</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Daire Satış Geliri</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Yapım Maliyet Gideri</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Net Karlılık (₺)</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kar Marjı</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Detaylı Görünüm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectBalances.map((proj) => (
                <tr 
                  key={proj.id} 
                  onClick={() => setSelectedProjId(proj.id)}
                  className={`hover:bg-slate-50/50 transition-all cursor-pointer group ${
                    selectedProjId === proj.id ? "bg-slate-50/80 font-bold border-l-4 border-l-slate-900" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 text-sm">{proj.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">{proj.type || "Proje"} - Satış: {proj.soldUnits}/{proj.unitsCount} daire</span>
                    </div>
                  </td>
                  <td className="p-4 font-black text-slate-950 text-sm">
                    {formatCurrency(proj.revenue)}
                  </td>
                  <td className="p-4 font-black text-red-600 text-sm">
                    {formatCurrency(proj.expense)}
                  </td>
                  <td className={`p-4 font-black text-sm ${proj.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {proj.profit >= 0 ? "+" : ""}{formatCurrency(proj.profit)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-700">% {proj.margin.toFixed(1)}</span>
                      <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-600 h-full rounded-full" style={{ width: `${proj.margin}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-all ${
                        selectedProjId === proj.id 
                          ? "bg-slate-900 text-white border-transparent" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Seçili
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeProj && (
        <div className="premium-card p-8 bg-white space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <FileSpreadsheet className="text-slate-500" />
                Detay Analiz Raporu: <span className="text-slate-900 font-black">{activeProj.name}</span>
              </h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">{activeProj.type || "Proje"} PROJESİ MALİ DETAYLARI</p>
            </div>
            <span className="text-xs font-black bg-slate-100 border border-slate-200/50 text-slate-700 px-3.5 py-1.5 rounded-xl">
              Proje Net Karı: <span className="text-green-600 font-extrabold">{formatCurrency(activeProj.profit)}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/40 pb-2">
                <Coins size={14} className="text-slate-500" />
                Gelir & Nakit Akışı Kırılımı
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tahsil Edilen Tutar</p>
                  <p className="text-lg font-black text-green-600 mt-0.5">{formatCurrency(activeProj.collected)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bekleyen Gelecek Alacak</p>
                  <p className="text-lg font-black text-slate-700 mt-0.5">{formatCurrency(activeProj.pending)}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-slate-500">Gelirin Nakde Dönüşüm Oranı</p>
                <div className="w-full bg-slate-200 h-4 rounded-xl overflow-hidden flex">
                  <div 
                    className="bg-green-600 h-full rounded-l-xl transition-all duration-500" 
                    style={{ width: `${activeProj.revenue > 0 ? (activeProj.collected / activeProj.revenue) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="bg-amber-400 h-full transition-all duration-500" 
                    style={{ width: `${activeProj.revenue > 0 ? (activeProj.pending / activeProj.revenue) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-600 rounded-full"></span>Tahsil Edildi (% {activeProj.revenue > 0 ? ((activeProj.collected / activeProj.revenue) * 100).toFixed(0) : 0})</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full"></span>Bekleyen Alacak (% {activeProj.revenue > 0 ? ((activeProj.pending / activeProj.revenue) * 100).toFixed(0) : 0})</span>
                </div>
              </div>
            </div>

            <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/40 pb-2">
                <HardHat size={14} className="text-slate-500" />
                Maliyet Segment Dağılımı
              </h4>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Kaba İnşaat (Demir, Beton vb.)</span>
                    <span className="text-slate-900 font-extrabold">{formatCurrency(activeProj.breakdown.kaba)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-lg overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-lg transition-all duration-500" 
                      style={{ width: `${activeProj.expense > 0 ? (activeProj.breakdown.kaba / activeProj.expense) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>İnce İnşaat (Sıva, Tesisat vb.)</span>
                    <span className="text-slate-900 font-extrabold">{formatCurrency(activeProj.breakdown.ince)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-lg overflow-hidden">
                    <div 
                      className="bg-green-600 h-full rounded-lg transition-all duration-500" 
                      style={{ width: `${activeProj.expense > 0 ? (activeProj.breakdown.ince / activeProj.expense) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>İşçilik & Taşeron Ödemeleri</span>
                    <span className="text-slate-900 font-extrabold">{formatCurrency(activeProj.breakdown.iscilik)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-lg overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-lg transition-all duration-500" 
                      style={{ width: `${activeProj.expense > 0 ? (activeProj.breakdown.iscilik / activeProj.expense) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {activeProj.breakdown.diger > 0 && (
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Şantiye İçi Diğer Giderler</span>
                      <span className="text-slate-900 font-extrabold">{formatCurrency(activeProj.breakdown.diger)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-lg overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-lg transition-all duration-500" 
                        style={{ width: `${activeProj.expense > 0 ? (activeProj.breakdown.diger / activeProj.expense) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {activeProj.breakdown.allocatedOfficeExpense > 0 && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span className="flex items-center gap-1"><Building2 size={12} className="text-red-500"/> Merkez Ofis Gideri Dağılım Payı</span>
                      <span className="text-red-600 font-black">{formatCurrency(activeProj.breakdown.allocatedOfficeExpense)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-lg overflow-hidden">
                      <div 
                        className="bg-red-500 h-full rounded-lg transition-all duration-500" 
                        style={{ width: `${activeProj.expense > 0 ? (activeProj.breakdown.allocatedOfficeExpense / activeProj.expense) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Bu proje, şirket toplam bütçesinin %{totalEstimatedCost > 0 ? (((activeProj.estimatedCost || 0) / totalEstimatedCost) * 100).toFixed(1) : "0"}'sini oluşturduğu için genel giderler bu oranda yansıtılmıştır.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="p-2 bg-white rounded-lg text-slate-700 border border-slate-200/50 shadow-sm shrink-0">
              <CheckCircle size={16} className="text-slate-900" />
            </span>
            <div className="text-xs text-slate-600 font-semibold leading-relaxed">
              <span className="text-slate-900 font-black">Mali Sağlık Özeti:</span> Bu raporlanan veriler, şantiyelerinizde kaydedilmiş gider makbuzları ve sözleşmeli müşteri tahsilat planlarından anlık olarak hesaplanır. Merkez ofis giderleri, projelerinizin <strong>Tahmini Maliyet büyüklüklerine oranlanarak (Gider Yükü)</strong> şantiyelerin maliyetine otomatik dahil edilmiştir.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
