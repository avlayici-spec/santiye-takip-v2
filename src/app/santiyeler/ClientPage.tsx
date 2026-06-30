"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus, MapPin, Edit3, ArrowUpRight, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { SiteForm } from "@/components/projects/SiteForm";
import { formatDate } from "@/lib/utils";
import { createSite, updateSite, deleteSite } from "@/app/actions/site";

export default function ClientPage({ 
  initialSites, 
  canEdit 
}: { 
  initialSites: any[], 
  canEdit: boolean 
}) {
  const [sites, setSites] = useState(initialSites);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [siteToDelete, setSiteToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingSite) {
        const result = await updateSite(editingSite.id, data);
        if (result.success) {
          setSites(sites.map(s => s.id === editingSite.id ? { ...s, ...result.site } : s));
        }
      } else {
        const result = await createSite(data);
        if (result.success) {
          setSites([{ ...result.site, projects: [], expenses: [] }, ...sites]);
        }
      }
      setIsFormOpen(false);
      setEditingSite(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!siteToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteSite(siteToDelete.id);
      if (result.success) {
        setSites(sites.filter(s => s.id !== siteToDelete.id));
        setSiteToDelete(null);
      } else {
        alert("Hata: " + result.error);
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Hata oluştu: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (site: any) => {
    setEditingSite(site);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Şantiyeler</h1>
          <p className="text-slate-500 mt-2">Çoklu blok projelerinizi şantiyeler altında gruplandırın, genel ve ortak giderleri yönetin.</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => { setEditingSite(null); setIsFormOpen(true); }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 cursor-pointer"
          >
            <Plus size={20} />
            <span>Yeni Şantiye Ekle</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => {
          const blockCount = site.projects?.length || 0;
          return (
            <div key={site.id} className="premium-card p-6 flex flex-col justify-between min-h-[290px]">
              <div className="space-y-3">
                {/* Şantiye Adı ve Durumu */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <Building2 size={18} />
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 truncate" title={site.name}>
                      {site.name}
                    </h2>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                    site.status === "DEVAM_EDIYOR" 
                      ? "bg-green-50 text-green-700 border border-green-200/50" 
                      : site.status === "TAMAMLANDI"
                      ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {site.status === "DEVAM_EDIYOR" ? "Devam Ediyor" : site.status === "TAMAMLANDI" ? "Tamamlandı" : "Planlanıyor"}
                  </span>
                </div>

                {/* Yapım Modeli ve Ortaklık Rozetleri */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                    site.constructionModel === "KAT_KARSILIGI"
                      ? "bg-purple-50 text-purple-700 border border-purple-200/50"
                      : site.constructionModel === "TAAHHUT"
                      ? "bg-cyan-50 text-cyan-700 border border-cyan-200/50"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                  }`}>
                    {site.constructionModel === "KAT_KARSILIGI" ? `🤝 Kat Karşılığı (%${site.landownerShare || 40} Arsa Payı)` : site.constructionModel === "TAAHHUT" ? "📋 Taahhüt (Hakedişli)" : "🏗️ Arsa Bizim (Özkaynak)"}
                  </span>
                  {site.isJointVenture && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/50 flex items-center gap-1">
                      👥 Ortaklı: {site.partnerName || "Ortak"} (%{site.ourShare || 50}-%{site.partnerShare || 50})
                    </span>
                  )}
                </div>

                {/* Tapu ve Adres Bilgileri */}
                <div className="bg-slate-50/70 border border-slate-100/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{site.location || "Konum belirtilmedi"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                    <div className="truncate">Belediye: <span className="text-slate-700 font-extrabold">{site.municipality || "-"}</span></div>
                    <div className="truncate">Mahalle: <span className="text-slate-700 font-extrabold">{site.neighborhood || "-"}</span></div>
                    <div className="truncate">Ada/Parsel: <span className="text-slate-700 font-extrabold">{site.island || "-"}/{site.parcel || "-"}</span></div>
                    <div className="truncate">Arsa: <span className="text-slate-700 font-extrabold">{site.areaSize ? `${site.areaSize} m²` : "-"}</span></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  <span className="text-indigo-600 font-black">{blockCount}</span> Blok / Proje
                </div>
                
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <>
                      <button 
                        onClick={() => openEdit(site)}
                        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => setSiteToDelete(site)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  <Link 
                    href={`/projeler?siteId=${site.id}`}
                    className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
                    title="Blokları Görüntüle"
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {sites.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
            Henüz sisteme eklenmiş bir şantiye bulunmamaktadır.
          </div>
        )}
      </div>

      {isFormOpen && (
        <SiteForm 
          site={editingSite} 
          onClose={() => { setIsFormOpen(false); setEditingSite(null); }} 
          onSave={handleSave} 
        />
      )}

      {siteToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Şantiyeyi Sil</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  <strong className="text-slate-900">"{siteToDelete.name}"</strong> şantiyesini silmek istediğinize emin misiniz?
                  <br />
                  Altındaki bloklar/projeler silinmeyecek fakat şantiyesiz kalacaktır. Şantiyeye ait ortak giderler ise kalıcı olarak silinir.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setSiteToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/10 disabled:opacity-50"
                >
                  {isDeleting ? "Siliniyor..." : "Evet, Sil"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
