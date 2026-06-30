"use client";

import { useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  HardHat,
  Briefcase
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function ClientPage({ initialData }: { initialData: any }) {
  if (!initialData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nakit akışı verileri yüklenirken bir sorun oluştu.
      </div>
    );
  }

  const { forecast, unallocatedDebt, monthlyStaffCost, currentCashBalance } = initialData;

  // Convert month numbers to Turkish names
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const chartData = forecast.map((f: any) => ({
    name: `${monthNames[f.month]} ${f.year}`,
    Gelir: f.income,
    Gider: f.staffExpense + f.subcontractorExpense,
    Fark: f.netCashFlow,
    "Kümülatif Kasa": f.cumulativeCash
  }));

  const totalExpectedIncome = forecast.reduce((sum: number, f: any) => sum + f.income, 0);
  const totalExpectedExpense = forecast.reduce((sum: number, f: any) => sum + f.staffExpense, 0);
  
  // Find months with negative CUMULATIVE cash flow
  const negativeMonths = forecast.filter((f: any) => f.cumulativeCash < 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="text-blue-600 w-8 h-8" />
          Nakit Akış Projeksiyonu
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Gelecek aylara ait beklenen taksit tahsilatları ve sabit giderleri karşılaştırın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-blue-500 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şu Anki Kasa (Net)</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(currentCashBalance)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Geçmiş Tahsilatlar - Gerçekleşen Giderler</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-red-500 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">12 Aylık Sabit Gider</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <Briefcase size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(totalExpectedExpense)}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2">Personel Maaş & SGK (Aylık: {formatCurrency(monthlyStaffCost)})</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Tahsis Edilmemiş Taşeron Borcu</p>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <HardHat size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-3">{formatCurrency(unallocatedDebt)}</p>
          <p className="text-[10px] font-bold text-amber-600/70 mt-2">Bu tutar hakediş onaylandıkça ilgili ayın giderine yansıyacaktır.</p>
        </div>
      </div>

      {negativeMonths.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800">Kritik Kasa Açığı Uyarısı</h4>
            <p className="text-sm text-red-700 mt-1">
              Geçmişten gelen kasanızdaki para, aşağıdaki aylarda yaşanacak giderleri karşılamaya yetmiyor. Bu aylarda ek finansman gerekebilir:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {negativeMonths.map((m: any) => (
                <span key={m.id} className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-md">
                  {monthNames[m.month]} {m.year} (Kasa: {formatCurrency(m.cumulativeCash)})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="premium-card p-6 bg-white">
        <h3 className="font-extrabold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
          <TrendingUp className="text-blue-600" />
          Aylık Gelir - Gider Çakıştırması
        </h3>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} dy={10} />
              <YAxis 
                tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                dx={-10}
              />
              <Tooltip 
                formatter={(value: any) => formatCurrency(Number(value))}
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Gelir" name="Beklenen Tahsilat" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="Gider" name="Sabit Giderler (Maaş)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Line type="monotone" dataKey="Kümülatif Kasa" name="Kümülatif Kasa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
