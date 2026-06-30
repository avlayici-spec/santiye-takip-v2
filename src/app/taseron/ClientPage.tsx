"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wrench, 
  Users, 
  FileSignature, 
  Banknote,
  Plus,
  Hammer,
  HardHat,
  Calculator,
  Trash2,
  AlertCircle,
  X,
  Save
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SubcontractorForm } from "@/components/subcontractor/SubcontractorForm";
import { ContractForm } from "@/components/subcontractor/ContractForm";
import { PaymentForm } from "@/components/subcontractor/PaymentForm";
import { createSubcontractor, updateSubcontractor, deleteSubcontractor, createContract, createPayment, terminateContract, deletePayment, approvePayment } from "@/app/actions/subcontractor";

export default function ClientPage({
  initialSubcontractors,
  initialContracts,
  initialProjects,
  sites = []
}: {
  initialSubcontractors: any[],
  initialContracts: any[],
  initialProjects: any[],
  sites?: any[]
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"SUBCONTRACTORS" | "CONTRACTS" | "PAYMENTS">("SUBCONTRACTORS");
  
  const [subcontractors, setSubcontractors] = useState(initialSubcontractors);
  const [contracts, setContracts] = useState(initialContracts);
  const [projects] = useState(initialProjects);

  // Sözleşme Sonlandırma Durumları
  const [isSaving, setIsSaving] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [terminatingContractId, setTerminatingContractId] = useState<string | null>(null);
  const [terminationReason, setTerminationReason] = useState("IS_BITTI");

  const handleSaveTermination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminatingContractId) return;

    setIsSaving(true);
    const res = await terminateContract(terminatingContractId, terminationReason);
    if (res.success && res.contract) {
      setContracts(contracts.map(c => 
        c.id === terminatingContractId 
          ? { 
              ...c, 
              status: "SONLANDIRILDI", 
              terminationReason: res.contract.terminationReason, 
              terminationDate: res.contract.terminationDate 
            } 
          : c
      ));
      setIsTerminateModalOpen(false);
      setTerminatingContractId(null);
    } else {
      alert(res.error || "Sözleşme sonlandırılırken hata oluştu.");
    }
    setIsSaving(false);
  };

  // Sync state with server-side props after revalidation
  useEffect(() => {
    setSubcontractors(initialSubcontractors);
  }, [initialSubcontractors]);

  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  // Derive payments from contracts
  const allPayments = contracts.flatMap(c => c.payments.map((p: any) => ({ ...p, contractId: c.id })));
  const [payments, setPayments] = useState(allPayments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  useEffect(() => {
    setPayments(allPayments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, [contracts]);

  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState<any>(null);
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  const handleSaveSubcontractor = async (data: any) => {
    if (editingSubcontractor) {
      const res = await updateSubcontractor(editingSubcontractor.id, data);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Taşeron güncellenirken hata oluştu.");
      }
    } else {
      const res = await createSubcontractor(data);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Taşeron eklenirken hata oluştu.");
      }
    }
    setIsSubFormOpen(false);
    setEditingSubcontractor(null);
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm("Bu hakediş/ödeme hareketini silmek istediğinize emin misiniz? (Bağlı gider kaydı da silinecektir!)")) {
      const result = await deletePayment(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Ödeme silinirken hata oluştu.");
      }
    }
  };

  const handleApprovePayment = async (id: string) => {
    if (confirm("Bu hakedişi ONAYLAMAK ve ödendi olarak işaretlemek istediğinize emin misiniz?")) {
      const result = await approvePayment(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Ödeme onaylanırken hata oluştu.");
      }
    }
  };

  const handleDeleteSubcontractor = async (id: string) => {
    // Aktif sözleşmesi var mı kontrol et
    const activeSubContracts = contracts.filter(c => c.subcontractorId === id && (c.status === "AKTIF" || !c.status));
    
    if (activeSubContracts.length > 0) {
      alert("Bu taşeronun aktif sözleşmeleri bulunmaktadır! Taşeronu silebilmek için önce sözleşmeler sekmesinden tüm aktif sözleşmelerini sonlandırmalısınız.");
      setActiveTab("CONTRACTS");
      return;
    }

    if (confirm("Bu taşeronu silmek istediğinize emin misiniz? Bu işlem taşerona ait tüm geçmiş (sonlandırılmış) sözleşmeleri ve ödemeleri de kalıcı olarak silecektir!")) {
      const res = await deleteSubcontractor(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Taşeron silinirken hata oluştu.");
      }
    }
  };

  const handleSaveContract = async (data: any) => {
    const res = await createContract(data);
    if (res.success && res.contract) {
      // Simulate inclusion
      const newContract = {
        ...res.contract,
        subcontractor: subcontractors.find(s => s.id === res.contract.subcontractorId),
        project: projects.find(p => p.id === res.contract.projectId),
        payments: []
      };
      setContracts([newContract, ...contracts]);
      setIsContractFormOpen(false);
    }
  };

  const handleSavePayment = async (data: any) => {
    const res = await createPayment(data);
    if (res.success) {
      const newPayment = { ...res.payment, contractId: data.contractId };
      setPayments([newPayment, ...payments]);
      // Update contract state locally
      setContracts(contracts.map(c => {
        if (c.id === data.contractId) {
          return { ...c, payments: [newPayment, ...c.payments] };
        }
        return c;
      }));
      setIsPaymentFormOpen(false);
    }
  };

  const getSubcontractorBalance = (subId: string) => {
    const subContracts = contracts.filter(c => c.subcontractorId === subId);
    const totalAgreed = subContracts.reduce((sum, c) => sum + c.totalAmount, 0);
    
    const subPayments = payments.filter(p => {
      const contract = contracts.find(c => c.id === p.contractId);
      return contract?.subcontractorId === subId;
    });
    const totalPaid = subPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return { totalAgreed, totalPaid, balance: totalAgreed - totalPaid };
  };

  const totalCompanyDebt = subcontractors.reduce((sum, s) => sum + getSubcontractorBalance(s.id).balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="text-amber-600 w-8 h-8" />
            Taşeron & Hakediş Yönetimi
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Alt yüklenici anlaşmalarını, cari bakiyelerini ve hakediş ödemelerini yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === "SUBCONTRACTORS" && (
            <button 
              onClick={() => setIsSubFormOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95 animate-in fade-in zoom-in duration-200"
            >
              <Plus size={18} />
              Taşeron Ekle
            </button>
          )}
          {activeTab === "CONTRACTS" && (
            <button 
              onClick={() => {
                setEditingContract(null);
                setIsContractFormOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 animate-in fade-in zoom-in duration-200"
            >
              <FileSignature size={18} />
              Yeni Sözleşme
            </button>
          )}
          {activeTab === "PAYMENTS" && (
            <button 
              onClick={() => setIsPaymentFormOpen(true)}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95 animate-in fade-in zoom-in duration-200"
            >
              <Banknote size={18} />
              Hakediş Öde
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Taşeron Sayısı</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{subcontractors.length}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><HardHat size={24}/></div>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-slate-800 bg-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Sözleşme Hacmi</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(contracts.reduce((sum, c) => sum + c.totalAmount, 0))}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center"><Calculator size={24}/></div>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-red-500 bg-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taşeronlara Toplam Kalan Borç</p>
            <p className="text-3xl font-black text-red-600 mt-1">{formatCurrency(totalCompanyDebt)}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><Banknote size={24}/></div>
        </div>
      </div>

      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-fit gap-1">
        <button
          onClick={() => setActiveTab("SUBCONTRACTORS")}
          className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "SUBCONTRACTORS" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={16} /> Taşeron Listesi & Cari
        </button>
        <button
          onClick={() => setActiveTab("CONTRACTS")}
          className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "CONTRACTS" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileSignature size={16} /> Sözleşmeler
        </button>
        <button
          onClick={() => setActiveTab("PAYMENTS")}
          className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "PAYMENTS" ? "bg-white text-green-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Banknote size={16} /> Hakediş Hareketleri
        </button>
      </div>

      <div className="premium-card bg-white overflow-hidden">
        
        {activeTab === "SUBCONTRACTORS" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <HardHat size={16} className="text-amber-500"/> Cari Bakiye Durumları
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Firma / Usta</th>
                    <th className="p-4 border-b border-slate-100">Uzmanlık</th>
                    <th className="p-4 border-b border-slate-100">Toplam Anlaşılan İş</th>
                    <th className="p-4 border-b border-slate-100">Toplam Ödenen</th>
                    <th className="p-4 border-b border-slate-100">Kalan Cari (Borç)</th>
                    <th className="p-4 border-b border-slate-100">Ödeme İlerlemesi</th>
                    <th className="p-4 border-b border-slate-100 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subcontractors.map(sub => {
                    const stats = getSubcontractorBalance(sub.id);
                    const progress = stats.totalAgreed > 0 ? (stats.totalPaid / stats.totalAgreed) * 100 : 0;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{sub.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{sub.contactPerson} - {sub.phone}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                            {sub.specialty}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{formatCurrency(stats.totalAgreed)}</td>
                        <td className="p-4 font-bold text-green-600">{formatCurrency(stats.totalPaid)}</td>
                        <td className="p-4 font-black text-red-600">{formatCurrency(stats.balance)}</td>
                        <td className="p-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-green-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500">%{progress.toFixed(0)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button 
                            onClick={() => { setEditingSubcontractor(sub); setIsSubFormOpen(true); }} 
                            className="text-blue-600 font-bold text-xs hover:underline"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => handleDeleteSubcontractor(sub.id)} 
                            className="text-red-600 font-bold text-xs hover:underline ml-2"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "CONTRACTS" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <FileSignature size={16} className="text-blue-500"/> Sözleşmeler & Durumları
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Tarih</th>
                    <th className="p-4 border-b border-slate-100">Şantiye</th>
                    <th className="p-4 border-b border-slate-100">Taşeron</th>
                    <th className="p-4 border-b border-slate-100">Anlaşma Tipi</th>
                    <th className="p-4 border-b border-slate-100">Toplam Bütçe</th>
                    <th className="p-4 border-b border-slate-100">Durum</th>
                    <th className="p-4 border-b border-slate-100 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contracts.map(c => {
                    const sub = c.subcontractor || subcontractors.find(s => s.id === c.subcontractorId);
                    const proj = projects.find(p => p.id === c.projectId) || c.project;
                    const isContractActive = !c.status || c.status === "AKTIF";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-xs font-semibold text-slate-500">{formatDate(new Date(c.createdAt))}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{proj?.site?.name ? `${proj.site.name} - ` : ""}{proj?.name}</p>
                          {c.description && <p className="text-[10px] font-medium text-slate-500 mt-0.5">{c.description}</p>}
                        </td>
                        <td className="p-4 font-bold text-slate-700">{sub?.name}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className={`w-fit inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              c.agreementType === "M2" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {c.agreementType === "M2" ? "M² Birim Fiyat" : "Götürü Bedel"}
                            </span>
                            {c.agreementType === "M2" && (
                              <span className="text-[10px] font-extrabold text-slate-500">
                                {c.unitPrice} ₺/m² ({c.estimatedM2} m²)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-black text-slate-900">{formatCurrency(c.totalAmount)}</td>
                        <td className="p-4">
                          {isContractActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-150 text-green-700 text-[10px] font-bold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                              Aktif Sözleşme
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="w-fit inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                Sonlandırıldı
                              </span>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">
                                Neden: {
                                  c.terminationReason === "IS_BITTI" ? "İş Bitti" :
                                  c.terminationReason === "ANLASARAK" ? "Anlaşarak" :
                                  c.terminationReason === "YARIM_BIRAKTI" ? "İşi Yarım Bıraktı" : c.terminationReason || "Bilinmiyor"
                                }
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {c.contractFileUrl && (
                              <a 
                                href={c.contractFileUrl} 
                                target="_blank" 
                                className="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline px-2 py-1 bg-blue-50 rounded"
                              >
                                Sözleşme Göster
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setEditingContract(c);
                                setIsContractFormOpen(true);
                              }}
                              className="text-slate-500 hover:text-blue-600 text-xs font-bold px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 transition-colors"
                            >
                              Düzenle
                            </button>
                            {isContractActive && (
                              <button
                                onClick={() => {
                                  setTerminatingContractId(c.id);
                                  setTerminationReason("IS_BITTI");
                                  setIsTerminateModalOpen(true);
                                }}
                                className="text-slate-500 hover:text-red-600 text-xs font-bold px-2 py-1 rounded bg-slate-100 hover:bg-red-50 transition-colors"
                              >
                                Sonlandır
                              </button>
                            )}
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

        {activeTab === "PAYMENTS" && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Banknote size={16} className="text-green-500"/> Yapılan Hakediş Ödemeleri
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Tarih</th>
                    <th className="p-4 border-b border-slate-100">Taşeron & Şantiye</th>
                    <th className="p-4 border-b border-slate-100">Açıklama</th>
                    <th className="p-4 border-b border-slate-100">İlerleme</th>
                    <th className="p-4 border-b border-slate-100">Brüt Hakediş</th>
                    <th className="p-4 border-b border-slate-100">Ödenecek Net</th>
                    <th className="p-4 border-b border-slate-100">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(p => {
                    const c = contracts.find(c => c.id === p.contractId);
                    const sub = subcontractors.find(s => s.id === c?.subcontractorId);
                    const proj = projects.find(proj => proj.id === c?.projectId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-xs font-semibold text-slate-500">{formatDate(new Date(p.createdAt))}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{sub?.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{proj?.site?.name ? `${proj.site.name} - ` : ""}{proj?.name}</p>
                        </td>
                        <td className="p-4 text-xs text-slate-600 font-medium">{p.description}</td>
                        <td className="p-4">
                          {p.completionPercentage ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold border border-green-200">
                              %{p.completionPercentage}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {p.grossAmount ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{formatCurrency(p.grossAmount)}</span>
                              {p.guaranteeDeductionAmount > 0 && (
                                <span className="text-[10px] text-amber-600 font-bold">- {formatCurrency(p.guaranteeDeductionAmount)} (Kesinti)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">-</span>
                          )}
                        </td>
                        <td className="p-4 font-black text-green-600">{formatCurrency(p.amount)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.status === "MUHASEBE_ONAYI_BEKLIYOR" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                Muhasebe Onayı Bekliyor
                              </span>
                            ) : p.status === "ODENDI" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                Ödendi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold">
                                {p.status}
                              </span>
                            )}
                            
                            {p.status === "MUHASEBE_ONAYI_BEKLIYOR" && (
                              <button
                                onClick={() => handleApprovePayment(p.id)}
                                className="text-white bg-amber-500 hover:bg-amber-600 px-3 py-1 text-[10px] font-bold rounded shadow-sm transition-colors flex items-center gap-1"
                                title="Muhasebe Onayı Ver ve Öde"
                              >
                                <Banknote size={12} />
                                Onayla & Öde
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-red-500 hover:text-red-700 text-[10px] font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                              title="Hareketi Sil"
                            >
                              Sil
                            </button>
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
      </div>

      {isSubFormOpen && (
        <SubcontractorForm 
          subcontractor={editingSubcontractor} 
          onClose={() => { setIsSubFormOpen(false); setEditingSubcontractor(null); }} 
          onSave={handleSaveSubcontractor} 
        />
      )}
      {isContractFormOpen && (
        <ContractForm 
          projects={projects}
          sites={sites}
          subcontractors={subcontractors}
          initialData={editingContract}
          onClose={() => {
            setIsContractFormOpen(false);
            setEditingContract(null);
          }}
          onSave={handleSaveContract} 
        />
      )}
      {isPaymentFormOpen && <PaymentForm contracts={contracts} subcontractors={subcontractors} projects={projects} onClose={() => setIsPaymentFormOpen(false)} onSave={handleSavePayment} />}

      {isTerminateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileSignature className="text-amber-600" size={20} />
                Sözleşmeyi Sonlandır
              </h2>
              <button 
                type="button" 
                onClick={() => { setIsTerminateModalOpen(false); setTerminatingContractId(null); }} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTermination} className="p-6 space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-xs text-amber-800 font-semibold leading-relaxed">
                <AlertCircle className="shrink-0 text-amber-600" size={20} />
                <p>
                  Sözleşmeyi sonlandırmadan önce yapılan işi ve hakediş ödemelerini kontrol edin. 
                  Sözleşme sonlandırıldıktan sonra aktif ödeme veya hakediş kaydı girilemez.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Sözleşme Nasıl Sonlandırıldı?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "IS_BITTI", title: "İş Bitti", desc: "Taşeron üstlendiği işi eksiksiz tamamladı ve iş sonlandı." },
                    { id: "ANLASARAK", title: "Karşılıklı Anlaşarak", desc: "Taraflar ortak bir kararla sözleşmeyi anlaşmalı feshetti." },
                    { id: "YARIM_BIRAKTI", title: "İşi Yarım Bıraktı", desc: "Taşeron işi tamamlamadan yarıda bırakıp ayrıldı." }
                  ].map((option) => (
                    <label 
                      key={option.id}
                      onClick={() => setTerminationReason(option.id)}
                      className={`flex gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        terminationReason === option.id
                          ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/15"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="terminationReason" 
                        value={option.id}
                        checked={terminationReason === option.id}
                        onChange={() => {}} // Controlled by label click
                        className="mt-1 text-amber-600 focus:ring-amber-500" 
                      />
                      <div>
                        <p className={`text-sm font-bold ${terminationReason === option.id ? "text-amber-900" : "text-slate-800"}`}>{option.title}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsTerminateModalOpen(false); setTerminatingContractId(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  disabled={isSaving}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/10 text-sm"
                >
                  <Save size={16} />
                  {isSaving ? "Kaydediliyor..." : "Sözleşmeyi Sonlandır"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
