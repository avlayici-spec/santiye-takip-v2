"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { formatCurrency, formatPhoneNumber, validatePhone } from "@/lib/utils";

export function SaleForm({ projects, customers, onClose, onSave }: {
  projects: any[],
  customers: any[],
  onClose: () => void,
  onSave: (data: any) => void
}) {
  const uniqueSites = Array.from(new Map(projects.filter(p => p.site).map(p => [p.site.id, p.site])).values());
  const [selectedSiteId, setSelectedSiteId] = useState<string>(uniqueSites[0]?.id || "");
  
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleType, setSaleType] = useState<"PESIN" | "TAKSITLI">("TAKSITLI");
  
  // Komisyon bilgileri
  const [hasCommission, setHasCommission] = useState(false);
  const [commissionAgent, setCommissionAgent] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  
  // Müşteri seçimi
  const [customerId, setCustomerId] = useState(customers[0]?.id || "NEW");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  // Taksitler (Taksitli satışlar için)
  const [installments, setInstallments] = useState<any[]>([
    { id: "i1", dueDate: new Date().toISOString().split("T")[0], amount: "" }
  ]);

  // Seçilen projeye göre satılık daireleri filtrele
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  // Şantiye seçildiğinde o şantiyeye ait projeleri filtrele
  useEffect(() => {
    let filtered = projects;
    if (selectedSiteId) {
      filtered = projects.filter(p => p.siteId === selectedSiteId);
    } else if (uniqueSites.length > 0) {
      filtered = projects.filter(p => !p.siteId);
    }
    
    setAvailableProjects(filtered);
    if (filtered.length > 0) {
      setSelectedProjectId(filtered[0].id);
    } else {
      setSelectedProjectId("");
    }
  }, [selectedSiteId, projects]);

  useEffect(() => {
    const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
    if (selectedProject && selectedProject.units) {
      const units = selectedProject.units.filter(
        (u: any) => u.ownerType !== "ARSA_SAHIBI" && u.status !== "SATILDI"
      );
      setAvailableUnits(units);
      if (units.length > 0) {
        setSelectedUnitId(units[0].id);
      } else {
        setSelectedUnitId("");
      }
    } else {
      setAvailableUnits([]);
      setSelectedUnitId("");
    }
  }, [selectedProjectId, availableProjects]);

  // Seçilen dairenin tahmini fiyatını (Liste Fiyatı) satış fiyatına otomatik yerleştir
  useEffect(() => {
    const unit = availableUnits.find(u => u.id === selectedUnitId);
    const defaultPrice = unit ? (unit.estimatedPrice || unit.salePrice || 0) : 0;
    
    if (defaultPrice > 0) {
      setSalePrice(defaultPrice.toString());
      setInstallments([
        { id: "inst_1", dueDate: new Date().toISOString().split("T")[0], amount: defaultPrice.toString() }
      ]);
    } else {
      setSalePrice("");
      setInstallments([
        { id: "inst_1", dueDate: new Date().toISOString().split("T")[0], amount: "" }
      ]);
    }
  }, [selectedUnitId, availableUnits]);

  // Satış tipi "Peşin" ise tek taksit yap
  useEffect(() => {
    if (saleType === "PESIN") {
      setInstallments([
        { id: "inst_1", dueDate: new Date().toISOString().split("T")[0], amount: salePrice }
      ]);
    }
  }, [saleType, salePrice]);

  // Satış fiyatı veya komisyon seçeneği değiştiğinde otomatik %2 hesapla
  useEffect(() => {
    if (hasCommission && salePrice) {
      const price = parseFloat(salePrice) || 0;
      const calculated = (price * 0.02).toFixed(0);
      setCommissionAmount(calculated);
    } else if (!hasCommission) {
      setCommissionAmount("");
    }
  }, [hasCommission, salePrice]);

  // Taksit Ekle
  const handleAddInstallment = () => {
    const newId = `inst_${Math.random().toString()}`;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + installments.length);
    
    // Kalan tutarı hesapla ve yeni taksidin varsayılan değeri yap
    const priceNum = parseFloat(salePrice) || 0;
    const installmentsTotal = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
    const remainingDiff = priceNum - installmentsTotal;
    const defaultAmount = remainingDiff > 0 ? remainingDiff.toFixed(0) : "";

    setInstallments([
      ...installments,
      { id: newId, dueDate: nextMonth.toISOString().split("T")[0], amount: defaultAmount }
    ]);
  };

  // Taksit Sil
  const handleRemoveInstallment = (id: string) => {
    if (installments.length > 1) {
      setInstallments(installments.filter(inst => inst.id !== id));
    }
  };

  // Taksit Değişikliği
  const handleInstallmentChange = (id: string, field: string, value: string) => {
    setInstallments(installments.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  // Taksit Toplamı ve Farkı Hesaplama
  const priceNum = parseFloat(salePrice) || 0;
  const installmentsTotal = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
  const remainingDiff = priceNum - installmentsTotal;
  const isMatch = Math.abs(remainingDiff) < 0.01;

  // Eşit Tutar Paylaştırıcı
  const distributeEvenly = () => {
    if (installments.length === 0) return;
    const evenAmount = (priceNum / installments.length).toFixed(2);
    setInstallments(installments.map(inst => ({
      ...inst,
      amount: evenAmount
    })));
  };

  // Phone Validation variables
  const isPhoneValid = customerId !== "NEW" || (validatePhone(newCustomerPhone) && newCustomerPhone.trim().length > 0);
  const isPhoneWarningVisible = customerId === "NEW" && newCustomerPhone.trim().length > 0 && !validatePhone(newCustomerPhone);
  const isSubmitDisabled = (saleType === "TAKSITLI" && !isMatch) || !isPhoneValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    const selectedUnit = availableUnits.find(u => u.id === selectedUnitId);
    const selectedProj = projects.find(p => p.id === selectedProjectId);

    const saleData = {
      projectId: selectedProjectId,
      projectName: selectedProj?.name,
      unitId: selectedUnitId,
      unitNumber: selectedUnit?.unitNumber,
      unitType: selectedUnit?.type,
      floorNumber: selectedUnit?.floorNumber,
      salePrice: priceNum,
      saleType,
      customer: customerId === "NEW" ? {
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail
      } : customers.find(c => c.id === customerId),
      commission: hasCommission ? {
        agent: commissionAgent,
        amount: parseFloat(commissionAmount) || 0
      } : null,
      paymentPlan: installments.map((inst, index) => ({
        id: inst.id,
        dueDate: new Date(inst.dueDate),
        amount: parseFloat(inst.amount) || 0,
        isPaid: saleType === "PESIN",
        paidAmount: saleType === "PESIN" ? (parseFloat(inst.amount) || 0) : 0,
        paidDate: saleType === "PESIN" ? new Date() : null,
        label: saleType === "PESIN" ? "Peşinat" : `${index + 1}. Taksit`
      }))
    };

    onSave(saleData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Başlık */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Yeni Gayrimenkul Satışı
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* 1. Müşteri Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              1. Alıcı (Müşteri) Bilgileri
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Müşteri Seçimi</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="NEW">+ Yeni Müşteri Kaydet</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone || "Telefon yok"})</option>
                ))}
              </select>
            </div>

            {customerId === "NEW" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Ad Soyad *</label>
                  <input
                    type="text"
                    required={customerId === "NEW"}
                    placeholder="Örn: Mehmet Can"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Telefon *</label>
                  <input
                    type="tel"
                    required={customerId === "NEW"}
                    placeholder="0 (5XX) XXX XX XX"
                    className={`w-full px-3 py-2 rounded-lg border bg-white text-sm font-semibold transition-all ${
                      isPhoneWarningVisible
                        ? "border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/10 text-red-900"
                        : "border-slate-200 focus:ring-slate-900/5 focus:border-slate-900 text-slate-900"
                    }`}
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(formatPhoneNumber(e.target.value))}
                  />
                  {isPhoneWarningVisible && (
                    <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <AlertTriangle size={12} className="shrink-0" />
                      Geçersiz telefon! 10 veya 11 hane olmalıdır.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">E-Posta</label>
                  <input
                    type="email"
                    placeholder="mehmet@gmail.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Daire / Proje Seçimi */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              2. Satışa Konu Gayrimenkul (Ünite)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Şantiye Seçimi</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                >
                  <option value="">-- Şantiye Seç --</option>
                  {uniqueSites.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  {projects.some(p => !p.siteId) && <option value="">Şantiyesiz Projeler</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Blok / Proje</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={availableProjects.length === 0}
                >
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Satılık Bağımsız Bölüm</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-semibold"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={availableUnits.length === 0}
                >
                  {availableUnits.map(u => (
                    <option key={u.id} value={u.id}>
                      Kat: {u.floorNumber} - No: {u.unitNumber} ({u.type} - {u.netArea || u.brutArea || 0} m²)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Satış Finansı ve Ödeme Planı */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              3. Satış Bedeli & Ödeme Koşulları
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">Gerçek Satış Fiyatı (₺)</label>
                  {selectedUnitId && (
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Liste Fiyatı: {formatCurrency(availableUnits.find(u => u.id === selectedUnitId)?.estimatedPrice || 0)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-black text-slate-900"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Ödeme Türü</label>
                <div className="flex bg-slate-100 p-1 rounded-xl h-[46px] items-center">
                  <button
                    type="button"
                    onClick={() => setSaleType("PESIN")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      saleType === "PESIN"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Peşin Satış
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleType("TAKSITLI")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      saleType === "TAKSITLI"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Vadeli / Taksitli
                  </button>
                </div>
              </div>
            </div>

            {saleType === "TAKSITLI" && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    Taksit Planlama Tablosu
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={distributeEvenly}
                      className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all"
                    >
                      Tüm Taksitlere Eşit Dağıt
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInstallment}
                      className="text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Taksit Ekle
                    </button>
                  </div>
                </div>

                {/* Taksit Giriş Alanları */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                  {installments.map((inst, index) => (
                    <div key={inst.id} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm">
                      <span className="w-6 h-6 rounded bg-slate-100 text-[10px] font-black text-slate-500 flex items-center justify-center">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1 flex gap-2">
                        <input
                           type="date"
                          required
                          className="w-1/2 px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none font-semibold"
                          value={inst.dueDate}
                          onChange={(e) => handleInstallmentChange(inst.id, "dueDate", e.target.value)}
                        />
                        <div className="relative w-1/2">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₺</span>
                          <input
                            type="number"
                            required
                            placeholder="Tutar"
                            className="w-full pl-6 pr-2 py-1.5 rounded border border-slate-200 text-xs font-black focus:outline-none"
                            value={inst.amount}
                            onChange={(e) => handleInstallmentChange(inst.id, "amount", e.target.value)}
                          />
                        </div>
                      </div>

                      {installments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInstallment(inst.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Doğrulama Durum Alanı */}
                <div className={`p-4 rounded-xl border flex items-start gap-2.5 transition-all duration-300 ${
                  isMatch
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  {isMatch ? (
                    <>
                      <Check size={18} className="text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black">Taksit Toplamı Eşleşti!</p>
                        <p className="text-[10px] font-medium opacity-90 mt-0.5">Tüm taksitler satış bedeline birebir uymaktadır.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black">Taksit Toplamı Eşleşmiyor!</p>
                          <p className="text-[10px] font-semibold opacity-90 mt-0.5">
                            Toplam Taksit: <span className="font-extrabold">{formatCurrency(installmentsTotal)}</span> | Fark: <span className="font-extrabold">{formatCurrency(remainingDiff)}</span>
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Komisyon & Aracı Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>4. Emlakçı / Aracı Komisyonu</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  checked={hasCommission}
                  onChange={(e) => setHasCommission(e.target.checked)}
                />
                <span className="text-xs font-bold text-slate-700 normal-case tracking-normal">Komisyon Ödenecek</span>
              </label>
            </h3>

            {hasCommission && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Emlakçı / Temsilci Adı</label>
                  <input
                    type="text"
                    required={hasCommission}
                    placeholder="Örn: Remax / Ahmet Bey"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold"
                    value={commissionAgent}
                    onChange={(e) => setCommissionAgent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    <span>Komisyon Tutarı (₺)</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">%2 Otomatik Hesaplandı</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₺</span>
                    <input
                      type="number"
                      required={hasCommission}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900"
                      value={commissionAmount}
                      onChange={(e) => setCommissionAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSubmitDisabled
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10 active:scale-95"
              }`}
            >
              Satışı Tamamla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
