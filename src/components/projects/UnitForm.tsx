"use client";

import { useState } from "react";
import { X, Save, Layers } from "lucide-react";

const UNIT_TYPES = ["1+0", "1+1", "2+1", "3+1", "4+1", "3+2", "4+2", "5+1", "Dükkan", "Ofis", "Depo", "Diğer"];

const STATUS_OPTIONS = [
  { value: "SATILIK", label: "Satılık" },
  { value: "SATILDI", label: "Satıldı" },
  { value: "REZERVE", label: "Rezerve" },
];

interface ProjectConfig {
  basementCount: number;
  basementType: string; // "ORTAK_ALAN" | "ZEMIN_BAĞLI"
  zeroCount: number;
  normalCount: number;
  roofCount: number;
}

interface UnitFormProps {
  unit?: any;
  projectId: string;
  project: ProjectConfig;
  onClose: () => void;
  onSave: (data: any) => void;
}

/**
 * Projenin kat yapısına göre seçilebilir katları üretir.
 * - basementType === "ORTAK_ALAN"  → bodrum katlar listede yok (ünite eklenemez)
 * - basementType === "ZEMIN_BAĞLI" → bodrum katlar listede var (B1, B2, …)
 * - zeroCount > 0                  → Zemin Kat (0) eklenir
 * - normalCount = N               → 1., 2., … N. kat eklenir (fazlası gelmez)
 * - roofCount > 0                  → Çatı Katı eklenir
 */
function buildFloorOptions(p: ProjectConfig): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];

  // Bodrum katlar — sadece zemine bağlıysa ünitesi olabilir
  if (p.basementCount > 0 && p.basementType === "ZEMIN_BAĞLI") {
    for (let b = p.basementCount; b >= 1; b--) {
      options.push({ value: `-${b}`, label: `B${b} (${b}. Bodrum Kat)` });
    }
  }

  // Zemin kat
  if (p.zeroCount > 0) {
    options.push({ value: "0", label: "Zemin Kat" });
  }

  // Normal katlar — sadece tanımlı sayı kadar
  for (let n = 1; n <= p.normalCount; n++) {
    options.push({ value: `${n}`, label: `${n}. Kat` });
  }

  // Çatı katı
  if (p.roofCount > 0) {
    options.push({ value: "Çatı", label: "Çatı Katı" });
  }

  return options;
}

export function UnitForm({ unit, projectId, project, onClose, onSave }: UnitFormProps) {
  const isEditing = !!unit;
  const floorOptions = buildFloorOptions(project);

  // Varsayılan kat — mevcut üniteninki yoksa listedeki ilk seçenek
  const defaultFloor = unit?.floorNumber && floorOptions.find(f => f.value === unit.floorNumber)
    ? unit.floorNumber
    : floorOptions[0]?.value || "0";

  const [formData, setFormData] = useState({
    unitNumber: unit?.unitNumber || "",
    floorNumber: defaultFloor,
    type: unit?.type || "2+1",
    isDuplex: unit?.isDuplex || false,
    linkedFloors: unit?.linkedFloors || "",
    netArea: unit?.netArea?.toString() || "",
    brutArea: unit?.brutArea?.toString() || "",
    ownerType: unit?.ownerType || "MUTEAHHIT",
    estimatedPrice: unit?.estimatedPrice?.toString() || "",
    status: unit?.ownerType === "ARSA_SAHIBI" ? "ARSA_SAHIBI_PAYI" : (unit?.status || "SATILIK"),
  });

  // Arsa sahibine geçince durumu otomatik değiştir, müteahhide geçince sıfırla
  const handleOwnerTypeChange = (ownerType: string) => {
    const status = (ownerType === "ARSA_SAHIBI" || ownerType === "MUTEAHHIT_ORTAK") ? "ARSA_SAHIBI_PAYI" : "SATILIK";
    setFormData(prev => ({ ...prev, ownerType, status }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ ...formData, projectId });
    setIsSaving(false);
  };

  // Bodrum tüm ortak alansa ve tanımlı kat yoksa uyar
  const noFloorsAvailable = floorOptions.length === 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="text-slate-700" size={22} />
            {isEditing ? "Ünite Düzenle" : "Yeni Bağımsız Bölüm Ekle"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Bodrum ortak alan uyarısı */}
        {project.basementCount > 0 && project.basementType === "ORTAK_ALAN" && (
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2">
            🏗️ Bu projede <strong>bodrum katlar ortak alan</strong> olarak tanımlandığından bodrum katlara ünite eklenemez.
          </div>
        )}

        {noFloorsAvailable ? (
          <div className="p-8 text-center text-slate-500 font-bold">
            <p>Bu proje için seçilebilecek kat bulunamadı.</p>
            <p className="text-xs mt-2 text-slate-400">Lütfen proje tanımındaki kat düzenini kontrol edin.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* BB No + Kat */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Bağımsız Bölüm No *</label>
                <input
                  required
                  placeholder="Örn: 1, 2A, B-01"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-bold transition-all"
                  value={formData.unitNumber}
                  onChange={e => setFormData({ ...formData, unitNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Bulunduğu Kat *</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white font-bold transition-all"
                  value={formData.floorNumber}
                  onChange={e => setFormData({ ...formData, floorNumber: e.target.value })}
                >
                  {floorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tip + Pay Sahibi */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Daire Tipi</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white font-bold transition-all"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Pay Sahibi (Mülkiyet)</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { value: "MUTEAHHIT", label: "🏢 Firmamız Payı" },
                    { value: "MUTEAHHIT_ORTAK", label: "🤝 Ortak Firma Payı" },
                    { value: "ARSA_SAHIBI", label: "🏡 Arsa Sahibi Payı" },
                    { value: "ORTAK_HAVUZ", label: "🔄 Ortak Havuz (%50)" }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleOwnerTypeChange(opt.value)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-black border transition-all text-left truncate ${
                        (formData.ownerType === opt.value || (formData.ownerType === "MUTEAHHIT_BIZ" && opt.value === "MUTEAHHIT"))
                          ? "bg-slate-900 text-white border-slate-900 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alan */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Net Alan (m²)</label>
                <div className="relative">
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-bold transition-all"
                    value={formData.netArea}
                    onChange={e => setFormData({ ...formData, netArea: e.target.value })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">m²</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Brüt Alan (m²)</label>
                <div className="relative">
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-bold transition-all"
                    value={formData.brutArea}
                    onChange={e => setFormData({ ...formData, brutArea: e.target.value })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">m²</span>
                </div>
              </div>
            </div>

            {/* Fiyat + Durum — Arsa sahibi ünitelerde durum sabit, gösterilmez */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Liste Fiyatı (₺)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                  <input
                    type="number" min="0" step="1000" placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-bold transition-all"
                    value={formData.estimatedPrice}
                    onChange={e => setFormData({ ...formData, estimatedPrice: e.target.value })}
                  />
                </div>
              </div>
              {(formData.ownerType === "MUTEAHHIT" || formData.ownerType === "MUTEAHHIT_BIZ" || formData.ownerType === "ORTAK_HAVUZ") ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Durum</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-white font-bold transition-all"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Durum</label>
                  <div className="px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50 flex items-center gap-1.5">
                    <span className="text-amber-700 font-black text-[11px] uppercase tracking-wider truncate">
                      {formData.ownerType === "MUTEAHHIT_ORTAK" ? "🤝 Ortak Payı — Ortağa Ait" : "🏠 Arsa Payı — Satılamaz"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Dubleks */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                id="isDuplex"
                className="w-5 h-5 rounded accent-slate-900"
                checked={formData.isDuplex}
                onChange={e => setFormData({ ...formData, isDuplex: e.target.checked })}
              />
              <label htmlFor="isDuplex" className="text-sm font-bold text-slate-700 cursor-pointer">
                Dubleks / Piyesli Daire
              </label>
              {formData.isDuplex && (
                <input
                  placeholder="Bağlı katlar (Örn: 3-4)"
                  className="ml-auto px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={formData.linkedFloors}
                  onChange={e => setFormData({ ...formData, linkedFloors: e.target.value })}
                />
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-60"
              >
                <Save size={18} />
                {isSaving ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Ekle"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
