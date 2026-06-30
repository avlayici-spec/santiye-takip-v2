"use client";

import { useState } from "react";
import { X, Save, Hammer, AlertTriangle } from "lucide-react";
import { formatPhoneNumber, validatePhone } from "@/lib/utils";

export function SubcontractorForm({ onClose, onSave, subcontractor }: { onClose: () => void, onSave: (data: any) => void, subcontractor?: any }) {
  const predefinedSpecialties = [
    "Kaba İnşaat",
    "Demir",
    "Kalıp",
    "Hafriyat",
    "İnce İnşaat (Sıva/Boya)",
    "Elektrik Tesisatı",
    "Sıhhi Tesisat",
    "Çatı & Yalıtım",
    "Peyzaj"
  ];

  const initialSpecialty = subcontractor?.specialty || "Kaba İnşaat";
  const isInitialCustom = subcontractor?.specialty && !predefinedSpecialties.includes(subcontractor.specialty);

  const [formData, setFormData] = useState({
    name: subcontractor?.name || "",
    contactPerson: subcontractor?.contactPerson || "",
    phone: subcontractor?.phone ? formatPhoneNumber(subcontractor.phone) : "",
    specialty: isInitialCustom ? "Diğer" : initialSpecialty,
  });

  const [customSpecialty, setCustomSpecialty] = useState(isInitialCustom ? subcontractor.specialty : "");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const isPhoneValid = validatePhone(formData.phone) && formData.phone.trim().length > 0;
  const isFormDisabled = !formData.name.trim() || !isPhoneValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormDisabled || (formData.specialty === "Diğer" && !customSpecialty.trim())) return;
    
    const finalData = {
      ...formData,
      specialty: formData.specialty === "Diğer" ? customSpecialty.trim() : formData.specialty
    };
    
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Hammer className="text-amber-600" />
            {subcontractor ? "Taşeron Bilgilerini Düzenle" : "Yeni Taşeron Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Firma / Usta Adı *</label>
            <input
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Demirtaş Yapı / Ahmet Usta"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Yetkili Kişi</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="Adı Soyadı"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">İletişim (Telefon) *</label>
            <input
              type="tel"
              required
              placeholder="0 (5XX) XXX XX XX"
              className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all font-semibold ${
                formData.phone.length > 0 && !validatePhone(formData.phone)
                  ? "border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10"
                  : "border-slate-200 focus:ring-amber-500/20 focus:border-amber-500"
              }`}
              value={formData.phone}
              onChange={handlePhoneChange}
            />
            {formData.phone.length > 0 && !validatePhone(formData.phone) && (
              <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                <AlertTriangle size={12} className="shrink-0" />
                Geçersiz telefon numarası! 10 veya 11 hane olmalıdır.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Uzmanlık / İş Kalemi</label>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white font-semibold text-slate-700"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            >
              {predefinedSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Diğer">Diğer (Kendin Yaz)</option>
            </select>

            {formData.specialty === "Diğer" && (
              <input
                required
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold animate-in fade-in slide-in-from-top-1"
                value={customSpecialty}
                onChange={(e) => setCustomSpecialty(e.target.value)}
                placeholder="Lütfen uzmanlık alanını yazın..."
                autoFocus
              />
            )}
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
              disabled={isFormDisabled || (formData.specialty === "Diğer" && !customSpecialty.trim())}
              className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isFormDisabled || (formData.specialty === "Diğer" && !customSpecialty.trim())
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20 active:scale-95"
              }`}
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
