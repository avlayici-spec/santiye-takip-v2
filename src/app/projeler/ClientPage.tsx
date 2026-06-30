"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus, MapPin, Edit3, ArrowUpRight, Calendar, Banknote, Trash2, AlertTriangle } from "lucide-react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createProject, updateProject, deleteProject } from "@/app/actions/project";

export default function ClientPage({ 
  initialProjects, 
  sites, 
  filterSiteId,
  estimatedPrices = []
}: { 
  initialProjects: any[], 
  sites: any[], 
  filterSiteId: string | null,
  estimatedPrices?: any[]
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedSiteId, setSelectedSiteId] = useState(filterSiteId || "ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProjects = projects.filter(p => selectedSiteId === "ALL" || p.siteId === selectedSiteId);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      if (editingProject) {
        const result = await updateProject(editingProject.id, data);
        if (result.success) {
          setProjects(projects.map(p => p.id === editingProject.id ? { ...result.project, actualExpense: p.actualExpense } : p));
        }
      } else {
        const result = await createProject(data);
        if (result.success) {
          setProjects([{ ...result.project, actualExpense: 0 }, ...projects]);
        }
      }
      setIsFormOpen(false);
      setEditingProject(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteProject(projectToDelete.id);
      if (result.success) {
        setProjects(projects.filter(p => p.id !== projectToDelete.id));
        setProjectToDelete(null);
      } else {
        setDeleteError(result.error || "Bir hata oluştu.");
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError("Hata oluştu: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (project: any) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Bloklar (Projeler)</h1>
          <p className="text-slate-500 mt-2">Tüm inşaat projelerinizin detaylı listesi ve teknik bilgileri.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setIsFormOpen(true); }}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 cursor-pointer"
        >
          <Plus size={20} />
          <span>Yeni Blok Ekle</span>
        </button>
      </div>

      {/* Şantiye Filtresi */}
      {sites.length > 0 && (
        <div className="flex flex-col gap-2.5 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Şantiye Filtresi</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSiteId("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedSiteId === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              Tüm Şantiyeler
            </button>
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSiteId(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedSiteId === s.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="premium-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                  <Building2 size={28} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{project.name}</h2>
                  <p className="text-slate-500 font-semibold text-sm">Mal Sahibi: <span className="text-slate-700">{project.ownerName}</span></p>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    {project.site && (project.site.municipality || project.site.neighborhood) && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{project.site.municipality || ""}{project.site.municipality && project.site.neighborhood ? " / " : ""}{project.site.neighborhood || ""}</span>
                      </div>
                    )}
                    {project.site && (project.site.island || project.site.parcel) && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                        {project.site.island && <><span className="text-slate-400">Ada:</span><span>{project.site.island}</span></>}
                        {project.site.parcel && <><span className="text-slate-400 ml-1.5">Parsel:</span><span>{project.site.parcel}</span></>}
                      </div>
                    )}
                    {project.site && project.site.areaSize && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600">
                        <span className="text-slate-400">Arsa:</span>
                        <span>{project.site.areaSize} m²</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-4 gap-2 bg-slate-900 p-4 rounded-2xl shadow-inner min-w-[280px]">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Bodrum</p>
                    <p className="text-xl font-black text-white">{project.basementCount}</p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Zemin</p>
                    <p className="text-xl font-black text-white">{project.zeroCount}</p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Normal</p>
                    <p className="text-xl font-black text-white">{project.normalCount}</p>
                  </div>
                  <div className="text-center border-l border-slate-800">
                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">Çatı</p>
                    <p className="text-xl font-black text-white">{project.roofCount}</p>
                  </div>
                </div>

                {/* Bütçe Gerçekleşme Oranı */}
                {project.estimatedCost && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Banknote size={14} className="text-slate-400" />
                        Gerçekleşen Maliyet
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        % {project.actualExpense ? ((project.actualExpense / project.estimatedCost) * 100).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.actualExpense ? (project.actualExpense / project.estimatedCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold text-slate-500">Bütçe: {formatCurrency(project.estimatedCost)}</span>
                      <span className="text-[10px] font-black text-blue-700">{formatCurrency(project.actualExpense || 0)}</span>
                    </div>

                    {project.estimatedEndDate && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Calendar size={12} className="text-slate-400" />
                          Tahmini Bitiş
                        </div>
                        <span className="text-xs font-black text-slate-900">{formatDate(new Date(project.estimatedEndDate))}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 uppercase tracking-widest">
                  {project.type}
                </span>
                {project.totalConstructionArea && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 uppercase tracking-widest border border-slate-200/50">
                    {project.totalConstructionArea} m² Alan
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-widest border border-green-200/50">
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  href={`/projeler/${project.id}`}
                  className="text-sm font-bold text-slate-900 hover:underline flex items-center gap-1 group/link mr-2"
                >
                  <span>Üniteler & Detay</span>
                  <ArrowUpRight size={16} className="transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                </Link>
                <button 
                  onClick={() => openEdit(project)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Edit3 size={16} />
                  <span>Düzenle</span>
                </button>
                <button 
                  onClick={() => setProjectToDelete(project)}
                  className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-100 hover:text-red-700 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
            Henüz seçili kriterlere uygun bir blok bulunamadı.
          </div>
        )}
      </div>

      {isFormOpen && (
        <ProjectForm 
          project={editingProject} 
          sites={sites}
          defaultSiteId={selectedSiteId !== "ALL" ? selectedSiteId : undefined}
          estimatedPrices={estimatedPrices}
          onClose={() => { setIsFormOpen(false); setEditingProject(null); }} 
          onSave={handleSave} 
        />
      )}

      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">Bloğu Sil</h3>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                  <strong className="text-slate-900">"{projectToDelete.name}"</strong> bloğunu silmek istediğinize emin misiniz?
                  <br />
                  Bu işlem bu bloğu ve ona ait bağımsız bölümleri kalıcı olarak silecektir. 
                  <br />
                  <span className="text-red-500 font-bold text-xs mt-1 block">
                    (Not: Eğer blokta aktif bir satış, gider veya taşeron sözleşmesi varsa silme işlemi engellenecektir.)
                  </span>
                </p>
              </div>
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-bold text-left animate-in fade-in duration-200">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setProjectToDelete(null);
                    setDeleteError(null);
                  }}
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
