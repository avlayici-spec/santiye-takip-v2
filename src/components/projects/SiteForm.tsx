"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

export function SiteForm({ site, onClose, onSave }: { 
  site?: any, 
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const [formData, setFormData] = useState(site ? {
    ...site,
    startDate: site.startDate ? new Date(site.startDate).toISOString().split('T')[0] : "",
    endDate: site.endDate ? new Date(site.endDate).toISOString().split('T')[0] : "",
  } : {
    name: "",
    location: "",
    status: "DEVAM_EDIYOR",
    startDate: "",
    endDate: "",
    municipality: "",
    neighborhood: "",
    island: "",
    parcel: "",
    areaSize: "",
    constructionModel: "ARSA_BIZIM",
    landownerShare: "",
    isJointVenture: false,
    partnerName: "",
    ourShare: 100,
    partnerShare: 0,
  });

  const [blockCount, setBlockCount] = useState(0);
  const [blocks, setBlocks] = useState<{ name: string }[]>([]);

  const getBlockLetter = (index: number) => {
    return String.fromCharCode(65 + index) + " Blok";
  };

  const handleBlockCountChange = (countStr: string) => {
    const count = Math.max(0, parseInt(countStr) || 0);
    setBlockCount(count);
    
    setBlocks(prev => {
      const newBlocks = [...prev];
      if (count > prev.length) {
        // Add new blocks
        for (let i = prev.length; i < count; i++) {
          newBlocks.push({ name: getBlockLetter(i) });
        }
      } else if (count < prev.length) {
        // Remove blocks from the end
        newBlocks.splice(count);
      }
      return newBlocks;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      projects: !site && blockCount > 0 ? blocks : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">
            {site ? "Şantiyeyi Düzenle" : "Yeni Şantiye Ekle"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Şantiye Adı</label>
              <input
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Güneş Evleri Sitesi"
              />
            </div>

            {!site && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Blok Sayısı</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                  value={blockCount || ""}
                  onChange={(e) => handleBlockCountChange(e.target.value)}
                  placeholder="Şantiyedeki toplam blok/proje sayısı (Örn: 3)"
                />
              </div>
            )}

            {blockCount > 0 && !site && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Blok İsimleri</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {blocks.map((block, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Blok {idx + 1} Adı</label>
                      <input
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-sm font-semibold"
                        value={block.name}
                        onChange={(e) => {
                          const updated = [...blocks];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setBlocks(updated);
                        }}
                        placeholder={`Örn: ${getBlockLetter(idx)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Konum / Adres</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all"
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Örn: Bodrum, Muğla"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Durum</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="DEVAM_EDIYOR">Devam Ediyor</option>
                <option value="TAMAMLANDI">Tamamlandı</option>
                <option value="PLANLANIYOR">Planlanıyor</option>
              </select>
            </div>

            {/* Yapım Modeli (Arsa Durumu) */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="text-xs font-black text-indigo-600 uppercase tracking-wider block">🏗️ Yapım Modeli & Arsa Sözleşmesi</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Proje Sözleşme Türü</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 font-bold bg-white"
                    value={formData.constructionModel || "ARSA_BIZIM"}
                    onChange={(e) => setFormData({ ...formData, constructionModel: e.target.value })}
                  >
                    <option value="ARSA_BIZIM">🏗️ Arsa Bize Ait (Özkaynak)</option>
                    <option value="KAT_KARSILIGI">🤝 Kat Karşılığı İnşaat</option>
                    <option value="TAAHHUT">📋 Taahhüt (Hakedişli İş)</option>
                  </select>
                </div>

                {formData.constructionModel === "KAT_KARSILIGI" && (
                  <div className="space-y-1 animate-in fade-in">
                    <label className="text-sm font-bold text-slate-700">Arsa Sahibi Payı (%)</label>
                    <input
                      type="number"
                      step="any"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 font-semibold"
                      value={formData.landownerShare || ""}
                      onChange={(e) => setFormData({ ...formData, landownerShare: e.target.value })}
                      placeholder="Örn: 40 (Yükleniciye %60 kalır)"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Yüklenici Ortaklık Yapısı (JV) */}
            <div className="pt-4 border-t border-slate-100 space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-amber-700 uppercase tracking-wider block">👥 Yüklenici Ortaklık Yapısı</label>
                  <p className="text-xs text-amber-600 mt-0.5 font-medium">Bu şantiyeyi başka firma ile ortak mı yükleniyorsunuz?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isJointVenture || false}
                    onChange={(e) => {
                      const isJV = e.target.checked;
                      setFormData({
                        ...formData,
                        isJointVenture: isJV,
                        ourShare: isJV ? 50 : 100,
                        partnerShare: isJV ? 50 : 0
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {formData.isJointVenture && (
                <div className="space-y-4 pt-2 border-t border-amber-200/40 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700">Ortak Firma / Kişi Adı</label>
                    <input
                      className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-600 font-semibold bg-white"
                      value={formData.partnerName || ""}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      placeholder="Örn: ABC İnşaat A.Ş."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Firmamızın Hissesi (%)</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:outline-none font-bold text-slate-800 bg-white"
                        value={formData.ourShare ?? 50}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, ourShare: val, partnerShare: 100 - val });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700">Ortağın Hissesi (%)</label>
                      <input
                        type="number"
                        step="any"
                        className="w-full px-4 py-2 rounded-xl border border-amber-200 focus:outline-none font-bold text-slate-800 bg-white"
                        value={formData.partnerShare ?? 50}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, partnerShare: val, ourShare: 100 - val });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Başlangıç Tarihi</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-700"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Hedef Bitiş Tarihi</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none font-semibold text-slate-700"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Tapu & Kadastro Bilgileri */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">Tapu & Kadastro Bilgileri</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Belediye</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                    value={formData.municipality || ""}
                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    placeholder="Örn: Bodrum"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Mahalle</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                    value={formData.neighborhood || ""}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Örn: Yalıkavak"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Ada</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                    value={formData.island || ""}
                    onChange={(e) => setFormData({ ...formData, island: e.target.value })}
                    placeholder="Örn: 104"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Parsel</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                    value={formData.parcel || ""}
                    onChange={(e) => setFormData({ ...formData, parcel: e.target.value })}
                    placeholder="Örn: 12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">Arsa Alanı (m²)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold"
                    value={formData.areaSize || ""}
                    onChange={(e) => setFormData({ ...formData, areaSize: e.target.value })}
                    placeholder="Örn: 2450"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
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
