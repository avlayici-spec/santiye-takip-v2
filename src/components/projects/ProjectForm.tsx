"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

export function ProjectForm({ project, sites = [], defaultSiteId, estimatedPrices = [], onClose, onSave }: { 
  project?: any, 
  sites?: any[],
  defaultSiteId?: string,
  estimatedPrices?: any[],
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState(project ? {
    ...project,
    estimatedEndDate: project.estimatedEndDate ? new Date(project.estimatedEndDate).toISOString().split('T')[0] : "",
    siteId: project.siteId || (sites.length > 0 ? sites[0].id : ""),
    totalConstructionArea: project.totalConstructionArea || "",
  } : {
    name: "",
    ownerName: "",
    type: "Apartman",
    basementCount: 0,
    basementType: "ORTAK_ALAN",
    zeroCount: 1,
    normalCount: 0,
    roofCount: 0,
    estimatedCost: "",
    estimatedEndDate: "",
    siteId: defaultSiteId || (sites.length > 0 ? sites[0].id : ""),
    totalConstructionArea: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">
            {project ? "Bloğu Düzenle" : "Yeni Blok Ekle"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sites.length > 0 && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-slate-700">Bağlı Olduğu Şantiye</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold"
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700">Blok Adı</label>
              <input
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Modern Plaza A Blok"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Mal Sahibi</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.ownerName || ""}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">İnşaat Türü</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const year = formData.estimatedEndDate ? new Date(formData.estimatedEndDate).getFullYear() : new Date().getFullYear();
                  const matchedPrice = estimatedPrices.find((p: any) => p.year === year && p.type === newType);
                  const area = parseFloat(formData.totalConstructionArea) || 0;
                  
                  setFormData({
                    ...formData,
                    type: newType,
                    estimatedCost: matchedPrice && area > 0 ? area * matchedPrice.price : formData.estimatedCost
                  });
                }}
              >
                <option>Apartman</option>
                <option>Villa</option>
                <option>Bitişik Villa</option>
                <option>Ticari</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Toplam İnşaat Alanı (m²)</label>
              <input
                type="number"
                placeholder="Örn: 1500"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold"
                value={formData.totalConstructionArea || ""}
                onChange={(e) => {
                  const areaStr = e.target.value;
                  const area = parseFloat(areaStr) || 0;
                  const year = formData.estimatedEndDate ? new Date(formData.estimatedEndDate).getFullYear() : new Date().getFullYear();
                  const matchedPrice = estimatedPrices.find((p: any) => p.year === year && p.type === formData.type);
                  
                  setFormData({
                    ...formData,
                    totalConstructionArea: areaStr ? parseFloat(areaStr) : "",
                    estimatedCost: matchedPrice && area > 0 ? area * matchedPrice.price : formData.estimatedCost
                  });
                }}
              />
            </div>

            <div className="space-y-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4 md:col-span-2">
              Bütçe & Planlama
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tahmini Bütçe/Maliyet (₺)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                <input
                  type="number"
                  required
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-black text-slate-900"
                  value={formData.estimatedCost || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) || "" })}
                />
              </div>
              {(() => {
                const year = formData.estimatedEndDate ? new Date(formData.estimatedEndDate).getFullYear() : new Date().getFullYear();
                const matchedPrice = estimatedPrices.find((p: any) => p.year === year && p.type === formData.type);
                return matchedPrice ? (
                  <p className="text-[10px] font-semibold text-indigo-600 mt-1">
                    💡 {year} yılı {formData.type} için m² birim fiyatı: {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(matchedPrice.price)} / m²
                  </p>
                ) : null;
              })()}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tahmini Bitiş Tarihi</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.estimatedEndDate || ""}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const year = newDate ? new Date(newDate).getFullYear() : new Date().getFullYear();
                  const matchedPrice = estimatedPrices.find((p: any) => p.year === year && p.type === formData.type);
                  const area = parseFloat(formData.totalConstructionArea) || 0;

                  setFormData({
                    ...formData,
                    estimatedEndDate: newDate,
                    estimatedCost: matchedPrice && area > 0 ? area * matchedPrice.price : formData.estimatedCost
                  });
                }}
              />
            </div>

            <div className="space-y-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4 md:col-span-2">
              Kat Planı Detayları
            </div>

            <div className="grid grid-cols-4 gap-4 md:col-span-2">
              <div className="space-y-2 text-center">
                <label className="block text-[10px] font-bold text-slate-600">Bodrum Kat</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2 py-2 text-center rounded-lg border border-slate-200"
                  value={formData.basementCount}
                  onChange={(e) => setFormData({ ...formData, basementCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="block text-[10px] font-bold text-slate-600">Zemin Kat</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2 py-2 text-center rounded-lg border border-slate-200"
                  value={formData.zeroCount}
                  onChange={(e) => setFormData({ ...formData, zeroCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="block text-[10px] font-bold text-slate-600">Normal Kat</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2 py-2 text-center rounded-lg border border-slate-200"
                  value={formData.normalCount}
                  onChange={(e) => setFormData({ ...formData, normalCount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2 text-center">
                <label className="block text-[10px] font-bold text-slate-600">Çatı Katı</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-2 py-2 text-center rounded-lg border border-slate-200"
                  value={formData.roofCount}
                  onChange={(e) => setFormData({ ...formData, roofCount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Bodrum tipi - sadece bodrum varsa göster */}
            {formData.basementCount > 0 && (
              <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-widest">Bodrum Kat Kullanım Türü</label>
                <p className="text-xs text-slate-500">Bodrum katlar bağımsız bölüm (daire/dükkan) olarak mı kullanılacak, yoksa ortak alan mı (otopark, sığınak, teknik)?</p>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, basementType: "ORTAK_ALAN" })}
                    className={`flex-1 py-3 rounded-xl text-sm font-black border transition-all ${
                      formData.basementType === "ORTAK_ALAN"
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    🏗️ Ortak Alan
                    <span className="block text-[10px] font-bold mt-0.5 opacity-70">Otopark, sığınak, teknik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, basementType: "ZEMIN_BAĞLI" })}
                    className={`flex-1 py-3 rounded-xl text-sm font-black border transition-all ${
                      formData.basementType === "ZEMIN_BAĞLI"
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    🏠 Zemine Bağlı
                    <span className="block text-[10px] font-bold mt-0.5 opacity-70">Dubleks, bodrum dairesi</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex gap-4">
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
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
