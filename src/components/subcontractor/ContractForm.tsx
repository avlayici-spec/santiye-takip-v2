"use client";

import { useState } from "react";
import { X, Save, FileSignature, Calculator, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ContractForm({ 
  projects, 
  sites = [],
  subcontractors, 
  initialData,
  onClose, 
  onSave 
}: { 
  projects: any[], 
  sites?: any[],
  subcontractors: any[], 
  initialData?: any,
  onClose: () => void, 
  onSave: (data: any) => void 
}) {
  const [selectedSiteId, setSelectedSiteId] = useState(initialData?.project?.siteId || "");
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    projectId: initialData?.projectId || "",
    subcontractorId: initialData?.subcontractorId || subcontractors[0]?.id || "",
    agreementType: initialData?.agreementType || "TOTAL", 
    totalAmount: initialData?.totalAmount ? initialData.totalAmount.toString() : "",
    unitPrice: initialData?.unitPrice ? initialData.unitPrice.toString() : "",
    estimatedM2: initialData?.estimatedM2 ? initialData.estimatedM2.toString() : "",
    description: initialData?.description || "",
    guaranteeDeductionRate: initialData?.guaranteeDeductionRate ? initialData.guaranteeDeductionRate.toString() : "0",
    advancePayment: initialData?.advancePayment ? initialData.advancePayment.toString() : "0",
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    contractFileUrl: initialData?.contractFileUrl || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const calculatedTotal = formData.agreementType === "M2" 
    ? (parseFloat(formData.unitPrice) || 0) * (parseFloat(formData.estimatedM2) || 0)
    : (parseFloat(formData.totalAmount) || 0);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setErrorMsg("Lütfen şantiye seçin.");
      return;
    }
    if (!formData.projectId) {
      setErrorMsg("Lütfen blok/proje seçin.");
      return;
    }
    if (calculatedTotal <= 0) {
      setErrorMsg("Lütfen geçerli bir tutar girin.");
      return;
    }
    setIsSaving(true);
    setErrorMsg("");
    try {
      let contractFileUrl = formData.contractFileUrl;
      
      // Upload file if selected
      if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fileData
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) {
          contractFileUrl = uploadResult.url;
        } else {
          setErrorMsg("Sözleşme dosyası yüklenemedi: " + uploadResult.error);
          setIsSaving(false);
          return;
        }
      }

      await onSave({
        ...formData,
        contractFileUrl,
        totalAmount: calculatedTotal,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        estimatedM2: parseFloat(formData.estimatedM2) || 0,
        guaranteeDeductionRate: parseFloat(formData.guaranteeDeductionRate) || 0,
        advancePayment: parseFloat(formData.advancePayment) || 0,
      });
    } catch (err) {
      setErrorMsg("Kaydederken hata oluştu, tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="text-blue-600" />
            {initialData ? "Sözleşmeyi Düzenle" : "Yeni Taşeron Sözleşmesi"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Şantiye</label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-bold text-slate-800"
                value={selectedSiteId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setSelectedSiteId(sId);
                  setFormData(prev => ({ ...prev, projectId: "" }));
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
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-bold text-slate-800"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                disabled={!selectedSiteId}
              >
                {!selectedSiteId ? (
                  <option value="">Önce Şantiye Seçin</option>
                ) : (
                  <>
                    <option value="" disabled>Blok Seçin</option>
                    {projects
                      .filter(p => p.siteId === selectedSiteId)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Taşeron Firma / Usta</label>
            <select
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-bold text-slate-800"
              value={formData.subcontractorId}
              onChange={(e) => setFormData({ ...formData, subcontractorId: e.target.value })}
            >
              {subcontractors.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.specialty})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-700">Anlaşma Türü</label>
            <div className="flex bg-slate-100 p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, agreementType: "TOTAL" })}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  formData.agreementType === "TOTAL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Götürü Bedel (Toplam)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, agreementType: "M2" })}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  formData.agreementType === "M2" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                M² / Birim Fiyat
              </button>
            </div>
          </div>

          {formData.agreementType === "M2" ? (
            <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Birim Fiyat (₺/M²)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Tahmini Miktar (M²)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold"
                  value={formData.estimatedM2}
                  onChange={(e) => setFormData({ ...formData, estimatedM2: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex justify-between items-center pt-2 mt-2 border-t border-blue-200/50">
                <span className="text-xs font-bold text-blue-800 flex items-center gap-1"><Calculator size={12}/> Hesaplanan Toplam Cari:</span>
                <span className="font-black text-blue-900">{formatCurrency(calculatedTotal)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Toplam Anlaşma Bedeli (₺)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₺</span>
                <input
                  type="number"
                  required
                  min="0"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-black text-2xl text-blue-600"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Teminat Kesintisi (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                value={formData.guaranteeDeductionRate}
                onChange={(e) => setFormData({ ...formData, guaranteeDeductionRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Başlangıç Avansı (₺)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                value={formData.advancePayment}
                onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Açıklama (Opsiyonel)</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: 1. ve 2. katın kaba işçiliği"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Islak İmzalı Sözleşme PDF (Opsiyonel)</label>
            <input
              type="file"
              accept=".pdf, .png, .jpg, .jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-sm text-slate-600">
            <Info size={20} className="shrink-0 text-blue-500" />
            <p>
              Bu sözleşme kaydedildiğinde, taşeronun cari hesabına <strong className="text-slate-900">{formatCurrency(calculatedTotal)}</strong> alacak (şirket borcu) eklenecektir. Ödeme (hakediş) yapıldıkça bu bakiye düşecektir.
            </p>
          </div>

          {errorMsg && (
            <div className="text-red-600 text-sm font-bold bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {errorMsg}
            </div>
          )}

          <div className="mt-8 flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedSiteId || !formData.projectId || calculatedTotal <= 0}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Kaydediliyor..." : "Sözleşmeyi Onayla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
