"use client";

import { useState } from "react";
import { X, Calendar, User, Phone, Mail, Building, Layers, Check, Coins, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export function SaleDetails({ sale, onClose, onCollectPayment }: {
  sale: any,
  onClose: () => void,
  onCollectPayment: (saleId: string, installmentId: string) => void
}) {
  const customer = sale.customer || { name: "Bilinmeyen Müşteri", phone: "", email: "" };
  
  // Ödeme Planı Hesaplamaları
  const totalPaid = sale.paymentPlan
    .filter((p: any) => p.isPaid)
    .reduce((sum: any, p: any) => sum + p.amount, 0);

  const totalRemaining = sale.salePrice - totalPaid;
  const paymentProgress = (totalPaid / sale.salePrice) * 100;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Başlık */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Satış ve Taksit Detayları</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">{sale.projectName} - Daire: {sale.unitNumber}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* İki Sütunlu Kart: Müşteri ve Daire Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Müşteri Bilgileri */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-2">
                <User size={14} className="text-slate-400" />
                <span>Müşteri Bilgileri</span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900">{customer.name}</p>
                {customer.phone && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-400" />
                    {customer.phone}
                  </p>
                )}
                {customer.email && (
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-400" />
                    {customer.email}
                  </p>
                )}
              </div>
            </div>

            {/* Daire Bilgileri */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/50 pb-2">
                <Building size={14} className="text-slate-400" />
                <span>Daire Detayları</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-900">{sale.projectName}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    Kat: {sale.floorNumber} / No: {sale.unitNumber}
                  </span>
                  <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                    {sale.unitType}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Tahsilat İlerleme Durumu */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Coins size={14} />
                Tahsilat İlerlemesi
              </span>
              <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                Satış Tutarı: {formatCurrency(sale.salePrice)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ödenen</p>
                <p className="text-lg font-black text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalan Bakiye</p>
                <p className="text-lg font-black text-slate-900">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${paymentProgress}%` }}></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 text-right">% {paymentProgress.toFixed(1)} Tahsil Edildi</p>
            </div>
          </div>

          {/* Taksit Listesi */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Layers size={14} />
              Ödeme Planı ve Taksit Durumları
            </h3>

            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 font-black text-slate-400 uppercase tracking-wider">Açıklama</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-wider">Vade Tarihi</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-wider">Tutar</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-wider">Durum</th>
                    <th className="p-3 font-black text-slate-400 uppercase tracking-wider text-right">Hızlı İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.paymentPlan.map((inst: any) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-700">{inst.label || "Taksit"}</td>
                      <td className="p-3 font-semibold text-slate-500">{formatDate(inst.dueDate)}</td>
                      <td className="p-3 font-black text-slate-900">{formatCurrency(inst.amount)}</td>
                      <td className="p-3">
                        {inst.isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black bg-green-100 text-green-700 uppercase tracking-wider">
                            <Check size={10} />
                            Tahsil Edildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-100/50">
                            <AlertCircle size={10} />
                            Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!inst.isPaid && (
                          <button
                            onClick={() => {
                              if (confirm(`${inst.label || "Taksit"} tutarı olan ${formatCurrency(inst.amount)} tahsil edildi olarak işaretlenecek. Emin misiniz?`)) {
                                onCollectPayment(sale.id, inst.id);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white font-extrabold px-3 py-1 rounded-lg hover:shadow-md transition-all active:scale-95 text-[10px]"
                          >
                            Tahsil Et
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
