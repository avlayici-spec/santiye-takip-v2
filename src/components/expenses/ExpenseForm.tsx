"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export function ExpenseForm({ expense, projects, categories, sites = [], onClose, onSave }: { 
  expense?: any,
  projects: any[],
  categories: any[],
  sites?: any[],
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const defaultCategory = categories.find(c => !c.name.includes("Ofis") && !c.name.includes("Genel")) || categories[0];
  const defaultSubCategory = defaultCategory && defaultCategory.subCategories.length > 0 ? defaultCategory.subCategories[0] : null;
  const isEditing = !!expense;

  const [formData, setFormData] = useState({
    id: expense?.id || "",
    siteId: expense?.siteId || (expense?.project?.siteId || ""),
    projectId: expense?.projectId || "",
    categoryId: expense?.categoryId || defaultCategory?.id || "",
    subCategoryId: expense?.subCategoryId || defaultSubCategory?.id || "",
    amount: expense?.amount?.toString() || "",
    date: expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    description: expense?.description || "",
    documentNo: expense?.documentNo || "",
    supplier: expense?.supplier || "",
    paidBy: expense?.paidBy || "BIZ",
    expenseType: "SANTIYE"
  });

  const handleCategoryChange = (categoryId: string) => {
    const selectedCat = categories.find(c => c.id === categoryId);
    const firstSub = selectedCat?.subCategories[0]?.id || "";
    setFormData(prev => ({
      ...prev,
      categoryId,
      subCategoryId: firstSub
    }));
  };

  const visibleCategories = categories.filter(cat => !cat.name.includes("Ofis") && !cat.name.includes("Genel"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siteId) {
      alert("Lütfen bir Şantiye seçin.");
      return;
    }
    onSave({
      ...formData,
      amount: parseFloat(formData.amount.toString()) || 0,
      date: new Date(formData.date)
    });
  };

  const activeCategoryObj = categories.find(c => c.id === formData.categoryId);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">
            {expense ? "Gideri Düzenle" : "Yeni Gider Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Şantiye ve Blok Seçimleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Şantiye</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold text-slate-800"
                value={formData.siteId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    siteId: sId,
                    projectId: "" // reset project when site changes
                  }));
                }}
              >
                <option value="" disabled>Şantiye Seçin</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Blok / Proje</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold text-slate-800"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                {formData.siteId ? (
                  <>
                    <option value="">Ortak Gider (Şantiye Geneli)</option>
                    {projects
                      .filter(p => p.siteId === formData.siteId)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </>
                ) : (
                  <option value="">Önce Şantiye Seçin</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ana Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white"
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {visibleCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Alt Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white"
                value={formData.subCategoryId}
                onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
              >
                {activeCategoryObj?.subCategories.map((sub:any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tutar (₺)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Gider Tarihi</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Fiş / Belge No</label>
              <input
                type="text"
                placeholder="Örn: F-12345 veya 2026-00012"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold text-slate-800"
                value={formData.documentNo}
                onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Kimden Alındı (Firma/Şahıs)</label>
              <input
                type="text"
                placeholder="Örn: Yılmazlar Beton A.Ş."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold text-slate-800"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          {/* Ödemeyi Yapan Taraf (Ortaklık Mahsuplaşma için) */}
          <div className="space-y-2 p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
            <label className="text-xs font-black text-amber-800 uppercase tracking-wider block">💳 Ödemeyi Yapan Taraf (Ortaklık Hesabı)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "BIZ", label: "🏢 Firmamız Ödedi" },
                { value: "ORTAK", label: "🤝 Ortak Firma Ödedi" },
                { value: "ORTAK_KASA", label: "💼 Ortak Havuz Kasa" }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, paidBy: opt.value })}
                  className={`py-2 px-2 rounded-lg text-xs font-black border transition-all truncate text-left ${
                    formData.paidBy === opt.value
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-white text-slate-700 border-amber-200/80 hover:border-amber-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Açıklama / Detay</label>
            <textarea
              rows={3}
              placeholder="Örn: C30 beton dökümü, 40 mikser veya Demir faturası bedeli..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="mt-8 flex gap-4 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
            >
              <Save size={18} />
              Gideri Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
