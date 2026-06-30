"use client";

import { useState } from "react";
import { 
  Users, 
  Plus, 
  Building2, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle,
  FileText,
  X,
  AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDate, formatPhoneNumber, validatePhone } from "@/lib/utils";
import { SaleForm } from "@/components/sales/SaleForm";
import { SaleDetails } from "@/components/sales/SaleDetails";
import { createSale, collectPayment, createCustomer, updateCustomer } from "@/app/actions/sale";

export default function ClientPage({ initialSales, initialProjects, initialCustomers }: {
  initialSales: any[],
  initialProjects: any[],
  initialCustomers: any[]
}) {
  const [projects] = useState(initialProjects);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [sales, setSales] = useState<any[]>(initialSales);

  const [activeTab, setActiveTab] = useState<"SALES" | "CUSTOMERS">("SALES");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  // Müşteri CRM State & Değişkenleri
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [customerFilter, setCustomerFilter] = useState<"ALL" | "ONGOING" | "COMPLETED">("ALL");

  const handleSaveSale = async (data: any) => {
    const result = await createSale(data);
    if (result.success) {
      window.location.reload();
    } else {
      alert("Hata: " + result.error);
    }
  };

  const handleOpenEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setNewCustName(customer.name);
    setNewCustPhone(customer.phone ? formatPhoneNumber(customer.phone) : "");
    setNewCustEmail(customer.email || "");
    setNewCustNotes(customer.notes || "");
    setIsCustomerFormOpen(true);
  };

  const handleCloseCustomerModal = () => {
    setIsCustomerFormOpen(false);
    setEditingCustomer(null);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustEmail("");
    setNewCustNotes("");
  };

  const handleCustPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustPhone(formatPhoneNumber(e.target.value));
  };

  const isCustPhoneValid = validatePhone(newCustPhone);
  const isCustFormDisabled = !newCustName.trim() || !isCustPhoneValid;

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCustFormDisabled) return;
    
    setIsSavingCustomer(true);

    if (editingCustomer) {
      // Düzenleme/Güncelleme Modu
      const res = await updateCustomer(editingCustomer.id, {
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        notes: newCustNotes
      });
      
      if (res.success && res.customer) {
        // Local listeyi güncelle
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id 
            ? { ...c, ...res.customer } 
            : c
        ));
        handleCloseCustomerModal();
      } else {
        alert(res.error || "Müşteri güncellenirken hata oluştu.");
      }
    } else {
      // Yeni Kayıt Modu
      const res = await createCustomer({
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        notes: newCustNotes
      });
      
      if (res.success && res.customer) {
        const newCust = {
          ...res.customer,
          units: []
        };
        setCustomers([newCust, ...customers]);
        handleCloseCustomerModal();
      } else {
        alert(res.error || "Müşteri kaydedilirken hata oluştu.");
      }
    }
    setIsSavingCustomer(false);
  };

  const handleCollectPayment = async (saleId: string, installmentId: string) => {
    const result = await collectPayment(installmentId);
    if (result.success) {
      setSales(sales.map(s => {
        if (s.id === saleId) {
          const updatedPlan = s.paymentPlan.map((p: any) => {
            if (p.id === installmentId) {
              return { ...p, isPaid: true, paidAmount: p.amount, paidDate: new Date() };
            }
            return p;
          });
          const updatedSale = { ...s, paymentPlan: updatedPlan };
          if (selectedSale && selectedSale.id === saleId) {
            setSelectedSale(updatedSale);
          }
          return updatedSale;
        }
        return s;
      }));
    } else {
      alert("Ödeme tahsilatı yapılamadı.");
    }
  };

  // Sales filtering & metrics
  const filteredSales = sales.filter(s => 
    selectedProjectId === "ALL" || s.projectId === selectedProjectId
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.salePrice, 0);
  
  const totalCollected = filteredSales.reduce((sum, s) => {
    const collectedForSale = s.paymentPlan
      .filter((p: any) => p.isPaid)
      .reduce((sPaid: number, p: any) => sPaid + p.amount, 0);
    return sum + collectedForSale;
  }, 0);

  const totalRemaining = totalRevenue - totalCollected;
  const overallProgress = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

  // Customers filtering
  const filteredCustomers = customers.filter(c => {
    const purchasedUnits = c.units || [];
    if (customerFilter === "ALL") return true;
    if (customerFilter === "ONGOING") {
      return purchasedUnits.some((u: any) => u.project?.status === "DEVAM_EDIYOR");
    }
    if (customerFilter === "COMPLETED") {
      return purchasedUnits.some((u: any) => u.project?.status === "TAMAMLANDI");
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-slate-900 w-8 h-8" />
            Satış & Müşteriler
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Satılan dairelerin taksit takibini yapın, tahsilatları yönetin ve CRM'inizi kontrol edin.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeTab === "SALES" && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 w-fit animate-in fade-in zoom-in duration-200"
            >
              <Plus size={20} />
              <span>Yeni Satış Yap</span>
            </button>
          )}
          {activeTab === "CUSTOMERS" && (
            <button 
              onClick={() => setIsCustomerFormOpen(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 active:scale-95 w-fit animate-in fade-in zoom-in duration-200"
            >
              <Plus size={20} />
              <span>Yeni Müşteri Ekle</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-fit gap-1">
        <button
          onClick={() => setActiveTab("SALES")}
          className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "SALES" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText size={16} /> Satış Sözleşmeleri
        </button>
        <button
          onClick={() => setActiveTab("CUSTOMERS")}
          className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "CUSTOMERS" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={16} /> Müşteri Cari & CRM
        </button>
      </div>

      {activeTab === "SALES" && (
        <>
          <div className="premium-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white animate-in slide-in-from-right-4 duration-300">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 size={16} />
              </span>
              <select
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold text-slate-700 text-sm"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="ALL">Tüm Projeler</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-1.5 w-fit">
              <span>Toplam Satış Adedi: <span className="text-slate-900 font-extrabold">{filteredSales.length}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-right-4 duration-300">
            {/* Toplam Satış Cirosu */}
            <div className="premium-card p-5 border-l-4 border-l-slate-900 bg-white hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Toplam Satış Cirosu</p>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <TrendingUp size={16} />
                </div>
              </div>
              <p 
                className={`font-black text-slate-900 mt-2 truncate ${
                  formatCurrency(totalRevenue).length > 12 ? "text-xl xl:text-2xl" : "text-2xl"
                }`}
                title={formatCurrency(totalRevenue)}
              >
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            {/* Toplam Tahsil Edilen */}
            <div className="premium-card p-5 border-l-4 border-l-green-600 bg-white hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Toplam Tahsil Edilen</p>
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                  <CheckCircle size={16} />
                </div>
              </div>
              <p 
                className={`font-black text-green-600 mt-2 truncate ${
                  formatCurrency(totalCollected).length > 12 ? "text-xl xl:text-2xl" : "text-2xl"
                }`}
                title={formatCurrency(totalCollected)}
              >
                {formatCurrency(totalCollected)}
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 text-right">% {overallProgress.toFixed(1)} tahsil edildi</p>
            </div>

            {/* Bekleyen Tahsilat */}
            <div className="premium-card p-5 border-l-4 border-l-amber-600 bg-white hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Bekleyen Tahsilat</p>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Wallet size={16} />
                </div>
              </div>
              <p 
                className={`font-black text-slate-900 mt-2 truncate ${
                  formatCurrency(totalRemaining).length > 12 ? "text-xl xl:text-2xl" : "text-2xl"
                }`}
                title={formatCurrency(totalRemaining)}
              >
                {formatCurrency(totalRemaining)}
              </p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full transition-all duration-500" style={{ width: `${100 - overallProgress}%` }}></div>
              </div>
              <p className="text-[9px] font-bold text-slate-400 mt-1.5 text-right">% {(100 - overallProgress).toFixed(1)} kalan bakiye</p>
            </div>

            {/* Kayıtlı Müşteri */}
            <div className="premium-card p-5 border-l-4 border-l-blue-600 bg-white hover:shadow-md transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {selectedProjectId === "ALL" ? "Toplam Kayıtlı Müşteri" : "Projedeki Müşteri Sayısı"}
                </p>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Users size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2 truncate">
                {selectedProjectId === "ALL"
                  ? customers.length
                  : Array.from(new Set(filteredSales.map(s => s.customer?.id).filter(Boolean))).length
                } Kişi
              </p>
            </div>
          </div>

          <div className="premium-card overflow-hidden bg-white animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                Aktif Sözleşmeler ve Satış Kayıtları
              </h3>
            </div>

            <div className="overflow-x-auto">
              {filteredSales.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">
                  Kayıtlı herhangi bir daire satışı bulunmuyor.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Alıcı (Müşteri)</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Gayrimenkul / Daire</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Satış Bedeli</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tahsil Edilen</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kalan Bakiye</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tür</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredSales.map((sale) => {
                      const cust = sale.customer || { name: "Bilinmeyen Müşteri", phone: "" };
                      
                      const paid = sale.paymentPlan
                        .filter((p: any) => p.isPaid)
                        .reduce((sum: number, p: any) => sum + p.amount, 0);
                      const remaining = sale.salePrice - paid;
                      const ratio = sale.salePrice > 0 ? (paid / sale.salePrice) * 100 : 0;

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors group">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-sm">{cust.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">{cust.phone}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{sale.projectName}</span>
                              <span className="text-[10px] text-slate-400 font-bold mt-0.5">Kat: {sale.floorNumber} - No: {sale.unitNumber} ({sale.unitType})</span>
                            </div>
                          </td>
                          <td className="p-4 font-black text-slate-900 text-sm">
                            {formatCurrency(sale.salePrice)}
                          </td>
                          <td className="p-4 text-green-600 font-black text-sm">
                            <div className="flex flex-col">
                              <span>{formatCurrency(paid)}</span>
                              <div className="w-16 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div className="bg-green-600 h-full rounded-full" style={{ width: `${ratio}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 font-black text-sm">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              sale.saleType === "PESIN"
                                ? "bg-green-50 text-green-700 border border-green-200/50"
                                : "bg-blue-50 text-blue-700 border border-blue-200/50"
                            }`}>
                              {sale.saleType === "PESIN" ? "PEŞİN" : "TAKSİTLİ"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setSelectedSale(sale)}
                              className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 inline-flex items-center gap-1 group/btn"
                            >
                              <span>Taksit Detayı</span>
                              <ArrowUpRight size={14} className="text-slate-400 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "CUSTOMERS" && (
        <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
          {/* Customer Filters */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setCustomerFilter("ALL")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                customerFilter === "ALL" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tüm Müşteriler ({customers.length})
            </button>
            <button
              onClick={() => setCustomerFilter("ONGOING")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                customerFilter === "ONGOING" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Devam Eden Projelerdekiler ({
                customers.filter((c: any) => c.units?.some((u: any) => u.project?.status === "DEVAM_EDIYOR")).length
              })
            </button>
            <button
              onClick={() => setCustomerFilter("COMPLETED")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${
                customerFilter === "COMPLETED" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Bitmiş Projelerdekiler ({
                customers.filter((c: any) => c.units?.some((u: any) => u.project?.status === "TAMAMLANDI")).length
              })
            </button>
          </div>

          {/* Customers Table */}
          <div className="premium-card overflow-hidden bg-white">
            <div className="overflow-x-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">
                  Bu filtreye uygun herhangi bir müşteri bulunamadı.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Müşteri / Cari</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">İletişim</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Satın Aldığı Üniteler</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Finansal Özet (Ciro / Kalan)</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Notlar</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map((c) => {
                      const custSales = sales.filter(s => s.customer?.id === c.id);
                      const totalAmount = custSales.reduce((sum, s) => sum + s.salePrice, 0);
                      const totalPaid = custSales.reduce((sum, s) => {
                        const paid = s.paymentPlan?.filter((p: any) => p.isPaid).reduce((pSum: number, p: any) => pSum + p.amount, 0) || 0;
                        return sum + paid;
                      }, 0);
                      const totalRemaining = totalAmount - totalPaid;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/30 transition-colors group animate-in fade-in duration-200">
                          <td className="p-4">
                            <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Kayıt: {formatDate(new Date(c.createdAt))}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col text-xs font-semibold text-slate-700">
                              <span>{c.phone || "Telefon Yok"}</span>
                              <span className="text-slate-400">{c.email || "E-Posta Yok"}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {c.units && c.units.length > 0 ? (
                                c.units.map((u: any) => (
                                  <span 
                                    key={u.id}
                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                      u.project?.status === "DEVAM_EDIYOR"
                                        ? "bg-blue-50 text-blue-700 border border-blue-150"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {u.project?.name} • Kat: {u.floorNumber} - No: {u.unitNumber}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 font-bold italic">Satın Alım Yok</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col text-xs">
                              <div className="flex justify-between gap-4 font-bold text-slate-700">
                                <span>Toplam Alım:</span>
                                <span className="font-black text-slate-900">{formatCurrency(totalAmount)}</span>
                              </div>
                              <div className="flex justify-between gap-4 font-bold text-red-600 mt-1">
                                <span>Kalan Borç:</span>
                                <span className="font-black">{formatCurrency(totalRemaining)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-slate-500 max-w-xs truncate" title={c.notes || ""}>
                            {c.notes || "-"}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenEditCustomer(c)}
                              className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm active:scale-95 inline-flex items-center gap-1"
                            >
                              Düzenle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <SaleForm 
          projects={projects}
          customers={customers}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveSale}
        />
      )}

      {selectedSale && (
        <SaleDetails 
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onCollectPayment={handleCollectPayment}
        />
      )}

      {/* Yeni Müşteri Ekle / Düzenle Modal */}
      {isCustomerFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                {editingCustomer ? "Müşteri Bilgilerini Düzenle" : "Yeni Müşteri Ekle"}
              </h2>
              <button 
                type="button" 
                onClick={handleCloseCustomerModal} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Müşteri Adı Soyadı *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ad Soyadı / Firma Adı"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Telefon Numarası</label>
                <input 
                  type="tel"
                  placeholder="0 (5XX) XXX XX XX"
                  className={`w-full px-3 py-2 rounded-lg border bg-white text-sm font-bold focus:outline-none focus:ring-2 transition-all ${
                    newCustPhone.length > 0 && !validatePhone(newCustPhone)
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10 text-red-900"
                      : "border-slate-200 focus:ring-slate-900/5 focus:border-slate-900 text-slate-900"
                  }`}
                  value={newCustPhone}
                  onChange={handleCustPhoneChange}
                />
                {newCustPhone.length > 0 && !validatePhone(newCustPhone) && (
                  <p className="text-xs text-red-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                    <AlertTriangle size={12} className="shrink-0" />
                    Geçersiz telefon numarası! 10 veya 11 hane olmalıdır.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">E-Posta Adresi</label>
                <input 
                  type="email"
                  placeholder="ornek@domain.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Özel Notlar</label>
                <textarea 
                  rows={3}
                  placeholder="Müşteriye dair özel notlar, bütçe veya arayış detayları..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                />
              </div>

              <div className="mt-8 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCustomerModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  disabled={isSavingCustomer}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isCustFormDisabled || isSavingCustomer}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm shadow-lg ${
                    isCustFormDisabled
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/10 active:scale-95"
                  }`}
                >
                  {isSavingCustomer ? "Kaydediliyor..." : (editingCustomer ? "Değişiklikleri Kaydet" : "Müşteriyi Kaydet")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
