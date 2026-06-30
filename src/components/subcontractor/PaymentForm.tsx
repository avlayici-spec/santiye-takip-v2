"use client";

import { useState } from "react";
import { X, Save, Banknote, HardHat, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PaymentForm({ 
  contracts, 
  subcontractors,
  projects,
  onClose, 
  onSave 
}: { 
  contracts: any[],
  subcontractors: any[],
  projects: any[],
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState({
    contractId: contracts[0]?.id || "",
    amount: "",
    completionPercentage: "",
    grossAmount: "",
    guaranteeDeductionAmount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const selectedContract = contracts.find(c => c.id === formData.contractId);
  const subcontractor = subcontractors.find(s => s.id === selectedContract?.subcontractorId);
  const project = projects.find(p => p.id === selectedContract?.projectId) || selectedContract?.project;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      completionPercentage: parseFloat(formData.completionPercentage) || null,
      grossAmount: parseFloat(formData.grossAmount) || null,
      guaranteeDeductionAmount: parseFloat(formData.guaranteeDeductionAmount) || null,
      projectId: project?.id, // To link expense
      category: "İşçilik",
      subCategory: "Taşeron Hakedişi",
    });
  };

  const handleCalculate = () => {
    if (!selectedContract || !formData.completionPercentage) return;
    const perc = parseFloat(formData.completionPercentage);
    if (isNaN(perc)) return;

    // Kümülatif hakediş (bugüne kadar kazanılan brüt)
    const totalEarnedGross = selectedContract.totalAmount * (perc / 100);
    
    // Kesinti (Teminat Oranı)
    const deduction = totalEarnedGross * ((selectedContract.guaranteeDeductionRate || 0) / 100);
    
    // Bugüne kadar kazanılan net
    const totalEarnedNet = totalEarnedGross - deduction;

    // Daha önce ödenen (veya avans olarak verilmiş) net tutarlar
    const prevPayments = selectedContract.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const advance = selectedContract.advancePayment || 0;
    
    // Bu hakedişte ödenecek kalan net tutar
    let currentNetToPay = totalEarnedNet - (prevPayments + advance);
    if (currentNetToPay < 0) currentNetToPay = 0;

    setFormData(prev => ({
      ...prev,
      amount: currentNetToPay.toFixed(2),
      grossAmount: totalEarnedGross.toFixed(2),
      guaranteeDeductionAmount: deduction.toFixed(2),
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-green-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Banknote className="text-green-600" />
            Hakediş (Ödeme) Gir
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">İlgili Sözleşme Seçimi</label>
            <select
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all bg-white font-bold text-slate-800"
              value={formData.contractId}
              onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
            >
              {contracts.map(c => {
                const sub = subcontractors.find(s => s.id === c.subcontractorId);
                const proj = projects.find(p => p.id === c.projectId) || c.project;
                return (
                  <option key={c.id} value={c.id}>
                    {sub?.name} - {proj?.site?.name ? `${proj.site.name} - ` : ""}{proj?.name} ({c.agreementType === "M2" ? "M² Bazlı" : "Götürü"})
                  </option>
                );
              })}
            </select>
          </div>

          {selectedContract && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1"><HardHat size={12}/> Taşeron:</span>
                <span className="text-slate-900">{subcontractor?.name}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Anlaşma Bedeli:</span>
                <span className="text-slate-900">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedContract.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Teminat Kesintisi Oranı:</span>
                <span className="text-amber-600">%{selectedContract.guaranteeDeductionRate || 0}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Sözleşme Avansı:</span>
                <span className="text-slate-900">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedContract.advancePayment || 0)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50/50 p-4 rounded-xl border border-green-100">
            <div className="space-y-2">
              <label className="text-xs font-bold text-green-800">Kümülatif İlerleme (%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Örn: 40"
                  className="w-full px-3 py-2 rounded-lg border border-green-200 font-bold focus:ring-green-500/20"
                  value={formData.completionPercentage}
                  onChange={(e) => setFormData({ ...formData, completionPercentage: e.target.value })}
                />
                <button 
                  type="button" 
                  onClick={handleCalculate}
                  className="bg-green-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Hesapla
                </button>
              </div>
            </div>
            
            {formData.grossAmount && (
              <div className="flex flex-col justify-center text-xs font-bold text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Brüt Hakediş:</span>
                  <span>{formatCurrency(parseFloat(formData.grossAmount))}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>Teminat Kesintisi:</span>
                  <span>-{formatCurrency(parseFloat(formData.guaranteeDeductionAmount))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Ödenen Hakediş Tutarı (₺)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
              <input
                type="number"
                required
                min="1"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-black text-2xl text-green-600"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Tarih</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Açıklama (Opsiyonel)</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: 1. Kat beton dökümü hakedişi"
            />
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-sm text-amber-800">
            <Info size={20} className="shrink-0 text-amber-600" />
            <p className="font-medium">
              Bu ödeme kaydedildiğinde <strong>{subcontractor?.name}</strong> carisinden düşülecek ve eşzamanlı olarak <strong>{project?.site?.name ? `${project.site.name} - ` : ""}{project?.name}</strong> projesine <strong className="text-amber-900">İşçilik Gideri</strong> olarak yansıyacaktır.
            </p>
          </div>

          <div className="mt-8 flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
            >
              <Save size={18} />
              Ödemeyi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
