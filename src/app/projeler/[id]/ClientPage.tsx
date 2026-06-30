"use client";

import { useState } from "react";
import { 
  Building2, 
  ArrowLeft, 
  Plus, 
  User, 
  Briefcase, 
  Layers,
  ArrowUpRight,
  HardHat,
  Edit3,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UnitForm } from "@/components/projects/UnitForm";
import { createUnit, updateUnit, deleteUnit } from "@/app/actions/unit";

const STATUS_STYLES: Record<string, string> = {
  SATILIK: "bg-green-50 text-green-700 border-green-200",
  SATILDI: "bg-blue-50 text-blue-700 border-blue-200",
  REZERVE: "bg-amber-50 text-amber-700 border-amber-200",
  ARSA_SAHIBI_PAYI: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  SATILIK: "Satılık",
  SATILDI: "Satıldı",
  REZERVE: "Rezerve",
  ARSA_SAHIBI_PAYI: "🏠 Arsa Sahibi Payı",
};

export default function ClientPage({ initialProject, initialSubcontracts }: { initialProject: any, initialSubcontracts: any[] }) {
  const [units, setUnits] = useState<any[]>(initialProject?.units || []);
  const [subcontracts] = useState(initialSubcontracts || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  if (!initialProject) {
    return <div className="p-8 text-center text-slate-500">Proje bulunamadı.</div>;
  }

  const handleSave = async (data: any) => {
    if (editingUnit) {
      const res = await updateUnit(editingUnit.id, data);
      if (res.success) {
        setUnits(units.map(u => u.id === editingUnit.id ? res.unit : u));
      }
    } else {
      const res = await createUnit(data);
      if (res.success) {
        setUnits(prev => [...prev, res.unit].sort((a, b) => {
          const fa = parseInt(a.floorNumber) || 0;
          const fb = parseInt(b.floorNumber) || 0;
          return fa - fb;
        }));
      }
    }
    setIsFormOpen(false);
    setEditingUnit(null);
  };

  const handleDelete = async (unit: any) => {
    if (!confirm(`"${unit.unitNumber}" numaralı üniteyi silmek istediğinize emin misiniz?`)) return;
    const res = await deleteUnit(unit.id, initialProject.id);
    if (res.success) {
      setUnits(units.filter(u => u.id !== unit.id));
    }
  };

  const openEdit = (unit: any) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  const openNew = () => {
    setEditingUnit(null);
    setIsFormOpen(true);
  };

  const muteahhitBizCount = units.filter(u => u.ownerType === "MUTEAHHIT" || u.ownerType === "MUTEAHHIT_BIZ").length;
  const muteahhitOrtakCount = units.filter(u => u.ownerType === "MUTEAHHIT_ORTAK").length;
  const ortakHavuzCount = units.filter(u => u.ownerType === "ORTAK_HAVUZ").length;
  const arsaCount = units.filter(u => u.ownerType === "ARSA_SAHIBI").length;
  const satildiCount = units.filter(u => u.status === "SATILDI").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projeler" className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
          <ArrowLeft size={20} className="text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{initialProject.name}</h1>
          <p className="text-slate-500 text-sm font-medium">Proje Detayları ve Bağımsız Bölüm Yönetimi</p>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="premium-card p-5 border-l-4 border-l-slate-900 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Ünite</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{units.length}</p>
        </div>
        <div className="premium-card p-5 border-l-4 border-l-blue-500 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firmamız Payı</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{muteahhitBizCount}</p>
        </div>
        <div className="premium-card p-5 border-l-4 border-l-purple-500 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ortak Firma Payı</p>
          <p className="text-3xl font-black text-purple-700 mt-1">{muteahhitOrtakCount}</p>
        </div>
        <div className="premium-card p-5 border-l-4 border-l-amber-500 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arsa Sahibi Payı</p>
          <p className="text-3xl font-black text-amber-700 mt-1">{arsaCount}</p>
        </div>
        <div className="premium-card p-5 border-l-4 border-l-green-500 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Satılan Ünite</p>
          <p className="text-3xl font-black text-green-700 mt-1">{satildiCount}</p>
        </div>
      </div>

      {/* Ünite Tablosu */}
      <div className="premium-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-slate-900" />
            <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">
              Bağımsız Bölüm Listesi
            </h2>
            <span className="ml-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{units.length}</span>
          </div>
          <button
            onClick={openNew}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-md"
          >
            <Plus size={16} />
            Ünite Ekle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">B.B. No</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kat</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tür / Özellik</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Pay Sahibi</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Alan</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Liste Fiyatı</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Durum</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {units.map((unit: any) => (
                <tr key={unit.id} className="hover:bg-slate-50/40 transition-colors group">
                  <td className="p-4">
                    <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {unit.unitNumber}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    {unit.floorNumber === "0" ? "Zemin" : 
                     unit.floorNumber === "Çatı" ? "Çatı" :
                     parseInt(unit.floorNumber) < 0 ? `B${Math.abs(parseInt(unit.floorNumber))}` :
                     `${unit.floorNumber}. Kat`}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{unit.type || "-"}</span>
                      {unit.isDuplex && (
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded mt-1 w-fit border border-blue-100">
                          Dubleks {unit.linkedFloors && `(${unit.linkedFloors})`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                      unit.ownerType === "MUTEAHHIT" || unit.ownerType === "MUTEAHHIT_BIZ"
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : unit.ownerType === "MUTEAHHIT_ORTAK"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : unit.ownerType === "ORTAK_HAVUZ"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-amber-50 text-amber-700 border-amber-200/50"
                    }`}>
                      <Briefcase size={10} />
                      {unit.ownerType === "MUTEAHHIT" || unit.ownerType === "MUTEAHHIT_BIZ" ? "🏢 Firmamız" : unit.ownerType === "MUTEAHHIT_ORTAK" ? "🤝 Ortak Firma" : unit.ownerType === "ORTAK_HAVUZ" ? "🔄 Ortak Havuz" : "🏡 Arsa Sahibi"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-700">
                      {unit.netArea ? `${unit.netArea} m²` : "-"}
                      {unit.brutArea && <span className="text-[10px] font-bold text-slate-400 block">(Brüt: {unit.brutArea} m²)</span>}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">
                    {unit.estimatedPrice ? formatCurrency(unit.estimatedPrice) : "-"}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${STATUS_STYLES[unit.status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {STATUS_LABELS[unit.status] || unit.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(unit)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                        title="Düzenle"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(unit)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {units.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Layers size={40} className="opacity-30" />
                      <p className="font-bold">Bu projeye henüz bağımsız bölüm eklenmemiş.</p>
                      <button
                        onClick={openNew}
                        className="mt-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                      >
                        <Plus size={14} /> İlk Üniteyi Ekle
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Taşeronlar */}
      {subcontracts.length > 0 && (
        <div className="premium-card overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <HardHat size={20} className="text-amber-600" />
              <h2 className="font-black text-slate-900 uppercase tracking-wider text-sm">Projedeki Taşeronlar ve Anlaşmalar</h2>
            </div>
            <Link href="/taseron" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Taşeron Modülüne Git <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Firma / Usta</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sözleşme Tipi</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Toplam Bütçe</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ödenen Hakediş</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan (Bakiye)</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">İlerleme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subcontracts.map((contract: any) => {
                  const progress = contract.totalAmount > 0 ? (contract.paid / contract.totalAmount) * 100 : 0;
                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{contract.subcontractorName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{contract.specialty}</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          contract.agreementType === "M2" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {contract.agreementType === "M2" ? `${contract.unitPrice} ₺/m²` : "Götürü Bedel"}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900">{formatCurrency(contract.totalAmount)}</td>
                      <td className="p-4 font-black text-green-600">{formatCurrency(contract.paid)}</td>
                      <td className="p-4 font-black text-red-600">{formatCurrency(contract.totalAmount - contract.paid)}</td>
                      <td className="p-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-slate-500 shrink-0">%{progress.toFixed(0)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isFormOpen && (
        <UnitForm
          unit={editingUnit}
          projectId={initialProject.id}
          project={{
            basementCount: initialProject.basementCount || 0,
            basementType: initialProject.basementType || "ORTAK_ALAN",
            zeroCount: initialProject.zeroCount || 1,
            normalCount: initialProject.normalCount || 0,
            roofCount: initialProject.roofCount || 0,
          }}
          onClose={() => { setIsFormOpen(false); setEditingUnit(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
