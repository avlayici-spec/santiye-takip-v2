"use client";

import { useState } from "react";
import { X, Save, User, MapPin, Briefcase, Banknote } from "lucide-react";

export function PersonnelForm({ personnel, onClose, onSave }: { 
  personnel?: any, 
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState(
    personnel
      ? {
          ...personnel,
          baseSalary: personnel.salary?.toString() || "",
          insurancePremium: personnel.insurancePremium?.toString() || "",
          startDate: personnel.startDate ? new Date(personnel.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          endDate: personnel.endDate ? new Date(personnel.endDate).toISOString().split("T")[0] : "",
        }
      : {
          firstName: "",
          lastName: "",
          title: "",
          phone: "",
          email: "",
          address: "",
          baseSalary: "",
          insurancePremium: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      salary: parseFloat(formData.baseSalary) || 0,
      insurancePremium: parseFloat(formData.insurancePremium) || 0,
      startDate: formData.startDate,
      endDate: formData.endDate || ""
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-600" />
            {personnel ? "Personel Bilgilerini Düzenle" : "Yeni Personel Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest md:col-span-2">
              Kişisel Bilgiler
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Adı</label>
              <input
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Soyadı</label>
              <input
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400"/> Görev / Ünvan</label>
              <input
                required
                placeholder="Örn: Muhasebe Müdürü"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">İşe Giriş Tarihi</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">İşten Çıkış Tarihi (Opsiyonel)</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Telefon</label>
              <input
                type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> Açık İkametgah Adresi</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4 md:col-span-2 border-t border-slate-100 pt-4">
              Maaş ve Özlük Hakları
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Banknote size={14} className="text-slate-400"/> Net Maaş (Aylık)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-slate-900 text-lg"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                />
              </div>
            </div>

          </div>

          <div className="mt-10 flex gap-4 bg-blue-50/50 -mx-8 -mb-8 p-6 border-t border-blue-100 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Save size={18} />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
