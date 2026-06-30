"use client";

import { useState } from "react";
import { X, Save, Receipt, Calendar, Info } from "lucide-react";

export function OfficeExpenseForm({ categories, onClose, onSave, personnel, expense }: { 
  categories: any[],
  onClose: () => void, 
  onSave: (data: any) => void,
  personnel?: any[],
  expense?: any
}) {
  const officeCategories = categories.filter(c => c.name.includes("Ofis") || c.name.includes("Genel"));
  const defaultCategory = officeCategories.length > 0 ? officeCategories[0] : (categories.length > 0 ? categories[0] : null);
  const defaultSubCategory = defaultCategory && defaultCategory.subCategories.length > 0 ? defaultCategory.subCategories[0] : null;

  const generatePeriods = () => {
    const periods = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      periods.push(`${year}-${month}`);
      date.setMonth(date.getMonth() - 1);
    }
    return periods;
  };

  const formatPeriod = (periodStr: string) => {
    const [year, month] = periodStr.split("-");
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Split combined description back into Title and Description if editing
  let initialTitle = "";
  let initialDescription = "";
  if (expense) {
    initialTitle = expense.description || "";
    const match = initialTitle.match(/(.*)\s*\(([^)]+)\)$/);
    if (match) {
      initialTitle = match[1].trim();
      initialDescription = match[2].trim();
    }
  }

  const [formData, setFormData] = useState(
    expense
      ? {
          title: initialTitle,
          categoryId: expense.categoryId || defaultCategory?.id || "",
          subCategoryId: expense.subCategoryId || defaultSubCategory?.id || "",
          amount: expense.amount?.toString() || "",
          date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          description: initialDescription,
          documentNo: expense.documentNo || "",
          supplier: expense.supplier || "",
          staffId: expense.staffPayment?.staffId || "",
          paymentType: "MAAS",
          period: expense.staffPayment?.accrual?.period || generatePeriods()[0]
        }
      : {
          title: "",
          categoryId: defaultCategory?.id || "",
          subCategoryId: defaultSubCategory?.id || "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          documentNo: "",
          supplier: "",
          staffId: "",
          paymentType: "MAAS",
          period: generatePeriods()[0]
        }
  );

  const handleCategoryChange = (categoryId: string) => {
    const selectedCat = officeCategories.find(c => c.id === categoryId);
    const firstSub = selectedCat?.subCategories[0]?.id || "";
    setFormData(prev => ({
      ...prev,
      categoryId,
      subCategoryId: firstSub
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedDescription = formData.title + (formData.description ? ` (${formData.description})` : "");
    onSave({
      ...formData,
      description: combinedDescription,
      amount: parseFloat(formData.amount) || 0,
      date: new Date(formData.date)
    });
  };

  const activeCategoryObj = officeCategories.find(c => c.id === formData.categoryId);
  const activeSubCategoryObj = activeCategoryObj?.subCategories.find((s:any) => s.id === formData.subCategoryId);
  const isPayroll = activeSubCategoryObj?.name.includes("Maaş") || activeSubCategoryObj?.name.includes("SGK") || activeSubCategoryObj?.name.includes("Personel");


  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="text-red-500" />
            Yeni Ofis Gideri
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
            <Info size={20} className="shrink-0 text-blue-600" />
            <p>
              Buraya eklediğiniz tüm genel giderler, projelerinizin <strong>tahmini bütçe büyüklüklerine oranlanarak</strong> otomatik olarak şantiyelere dağıtılır ve kar hesaplamasına dahil edilir.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Gider Başlığı</label>
            <input
              required
              placeholder="Örn: Haziran Ayı TEDAŞ Faturası"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-semibold"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ana Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white font-semibold"
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {officeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Alt Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white font-semibold"
                value={formData.subCategoryId}
                onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
              >
                {activeCategoryObj?.subCategories.map((sub:any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          {isPayroll && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 animate-in fade-in duration-200">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Ödeme Yapılan Personel</label>
                <select
                  required={isPayroll}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white font-semibold text-xs"
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                >
                  <option value="">Seçiniz...</option>
                  {personnel?.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Dönem / Ay</label>
                <select
                  required={isPayroll}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white font-semibold text-xs"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                >
                  {generatePeriods().map(p => (
                    <option key={p} value={p}>{formatPeriod(p)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Fatura Tutarı (₺)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-black text-2xl text-red-600"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-400" />Tarih</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-semibold"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Fiş / Belge No</label>
              <input
                type="text"
                placeholder="Örn: F-12345"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-semibold"
                value={formData.documentNo}
                onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Kimden Alındı (Firma/Şahıs)</label>
              <input
                type="text"
                placeholder="Örn: Metro Market"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-semibold"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Açıklama (Opsiyonel)</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
            >
              <Save size={18} />
              Kaydet ve Dağıt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
