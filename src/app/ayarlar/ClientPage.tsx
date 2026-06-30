"use client";

import { useState } from "react";
import { 
  Settings, 
  Tags, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers,
  Save,
  CheckCircle,
  AlertCircle,
  Check,
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText
} from "lucide-react";
import { createSubCategory, deleteSubCategory, updateCategory, updateSubCategory, createCategory } from "@/app/actions/category";
import { updateCompanySettings } from "@/app/actions/settings";
import { updateEstimatedM2Price, deleteEstimatedM2Price } from "@/app/actions/estimatedM2Price";

interface ClientPageProps {
  initialCategories: any[];
  initialSettings: any;
  initialPrices: any[];
}

export default function ClientPage({ initialCategories, initialSettings, initialPrices }: ClientPageProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeCategory, setActiveCategory] = useState(initialCategories[0] || null);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"CATEGORIES" | "COMPANY" | "M2_PRICES">("CATEGORIES");

  // Company Information States
  const [companyName, setCompanyName] = useState(initialSettings?.name || "İnşaatTakip");
  const [companyAuthorized, setCompanyAuthorized] = useState(initialSettings?.authorized || "");
  const [companyPhone, setCompanyPhone] = useState(initialSettings?.phone || "");
  const [companyEmail, setCompanyEmail] = useState(initialSettings?.email || "");
  const [companyAddress, setCompanyAddress] = useState(initialSettings?.address || "");
  const [companyTaxOffice, setCompanyTaxOffice] = useState(initialSettings?.taxOffice || "");
  const [companyTaxNo, setCompanyTaxNo] = useState(initialSettings?.taxNo || "");
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SUCCESS" | "ERROR">("IDLE");

  // Estimated m2 price states
  const [prices, setPrices] = useState(initialPrices || []);
  const [newPriceYear, setNewPriceYear] = useState(new Date().getFullYear());
  const [newPriceType, setNewPriceType] = useState("Apartman");
  const [newPriceAmount, setNewPriceAmount] = useState("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newPriceAmount);
    if (!newPriceYear || !newPriceType || isNaN(amountVal) || amountVal <= 0) return;

    setIsSaving(true);
    const result = await updateEstimatedM2Price(newPriceYear, newPriceType, amountVal);
    if (result.success && result.price) {
      // Find if we were editing an entry or it matches year/type
      const targetId = editingPriceId || result.price.id;
      const exists = prices.some((p: any) => p.id === targetId || (p.year === newPriceYear && p.type === newPriceType));
      
      let updatedPrices;
      if (exists) {
        updatedPrices = prices.map((p: any) => 
          (p.id === targetId || (p.year === newPriceYear && p.type === newPriceType)) ? result.price : p
        );
      } else {
        updatedPrices = [...prices, result.price];
      }
      
      updatedPrices.sort((a: any, b: any) => {
        if (b.year !== a.year) return b.year - a.year;
        return a.type.localeCompare(b.type);
      });
      
      setPrices(updatedPrices);
      setNewPriceAmount("");
      setEditingPriceId(null);
    } else {
      alert("Hata: " + result.error);
    }
    setIsSaving(false);
  };

  const handleStartEditPrice = (p: any) => {
    setEditingPriceId(p.id);
    setNewPriceYear(p.year);
    setNewPriceType(p.type);
    setNewPriceAmount(p.price.toString());
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setNewPriceYear(new Date().getFullYear());
    setNewPriceType("Apartman");
    setNewPriceAmount("");
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm("Bu birim fiyat tanımını silmek istediğinize emin misiniz?")) return;
    
    setIsSaving(true);
    const result = await deleteEstimatedM2Price(priceId);
    if (result.success) {
      setPrices(prices.filter((p: any) => p.id !== priceId));
    } else {
      alert("Hata: " + result.error);
    }
    setIsSaving(false);
  };

  // Kategori Düzenleme Durumları
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("blue");

  // Alt Kategori Düzenleme Durumları
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
  const [editingSubCategoryName, setEditingSubCategoryName] = useState("");

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyPhone(formatPhoneInput(e.target.value));
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setSaveStatus("SAVING");
    const result = await updateCompanySettings({
      name: companyName.trim(),
      authorized: companyAuthorized.trim(),
      phone: companyPhone.trim(),
      email: companyEmail.trim(),
      address: companyAddress.trim(),
      taxOffice: companyTaxOffice.trim(),
      taxNo: companyTaxNo.trim()
    });

    if (result.success) {
      setSaveStatus("SUCCESS");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
    } else {
      setSaveStatus("ERROR");
      setTimeout(() => setSaveStatus("IDLE"), 4000);
    }
  };

  const openEditCategory = (cat: any) => {
    if (cat) {
      setEditingCategory(cat);
      setEditCategoryName(cat.name);
      setEditCategoryColor(cat.color || "blue");
    } else {
      setEditingCategory({ id: "NEW" });
      setEditCategoryName("");
      setEditCategoryColor("blue");
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;

    setIsSaving(true);
    if (editingCategory.id === "NEW") {
      const result = await createCategory(editCategoryName.trim(), editCategoryColor);
      if (result.success && result.category) {
        setCategories([...categories, result.category]);
        setActiveCategory(result.category);
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
      } else {
        alert("Hata: " + result.error);
      }
    } else {
      const result = await updateCategory(editingCategory.id, editCategoryName.trim(), editCategoryColor);
      if (result.success && result.category) {
        const updatedCategories = categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, name: result.category.name, color: result.category.color } : cat
        );
        setCategories(updatedCategories);
        if (activeCategory?.id === editingCategory.id) {
          setActiveCategory({ 
            ...activeCategory, 
            name: result.category.name, 
            color: result.category.color 
          });
        }
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
      } else {
        alert("Hata: " + result.error);
      }
    }
    setIsSaving(false);
  };

  const handleStartEditSubCategory = (subCat: any) => {
    setEditingSubCategoryId(subCat.id);
    setEditingSubCategoryName(subCat.name);
  };

  const handleSaveSubCategory = async (e: React.FormEvent, subCatId: string) => {
    e.preventDefault();
    if (!editingSubCategoryName.trim()) return;

    setIsSaving(true);
    const result = await updateSubCategory(subCatId, editingSubCategoryName.trim());
    if (result.success && result.subCategory) {
      const updatedCategories = categories.map(cat => {
        if (cat.id === activeCategory.id) {
          const updatedSub = cat.subCategories.map((s: any) => 
            s.id === subCatId ? result.subCategory : s
          );
          const updated = { ...cat, subCategories: updatedSub };
          setActiveCategory(updated);
          return updated;
        }
        return cat;
      });
      setCategories(updatedCategories);
      setEditingSubCategoryId(null);
    }
    setIsSaving(false);
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-500",
          bgLight: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          ring: "ring-blue-500/20"
        };
      case "green":
        return {
          bg: "bg-green-500",
          bgLight: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          ring: "ring-green-500/20"
        };
      case "amber":
        return {
          bg: "bg-amber-500",
          bgLight: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          ring: "ring-amber-500/20"
        };
      case "red":
        return {
          bg: "bg-red-500",
          bgLight: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          ring: "ring-red-500/20"
        };
      case "purple":
        return {
          bg: "bg-purple-500",
          bgLight: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          ring: "ring-purple-500/20"
        };
      case "rose":
        return {
          bg: "bg-rose-500",
          bgLight: "bg-rose-50",
          border: "border-rose-200",
          text: "text-rose-700",
          ring: "ring-rose-500/20"
        };
      case "teal":
        return {
          bg: "bg-teal-500",
          bgLight: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-700",
          ring: "ring-teal-500/20"
        };
      case "indigo":
        return {
          bg: "bg-indigo-500",
          bgLight: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-700",
          ring: "ring-indigo-500/20"
        };
      default:
        return {
          bg: "bg-slate-500",
          bgLight: "bg-slate-50",
          border: "border-slate-200",
          text: "text-slate-700",
          ring: "ring-slate-500/20"
        };
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategory.trim() || !activeCategory) return;

    setIsSaving(true);
    const result = await createSubCategory(activeCategory.id, newSubCategory.trim());
    if (result.success && result.sub) {
      const updatedCategories = categories.map(cat => {
        if (cat.id === activeCategory.id) {
          const updated = { ...cat, subCategories: [...cat.subCategories, result.sub] };
          setActiveCategory(updated);
          return updated;
        }
        return cat;
      });
      setCategories(updatedCategories);
      setNewSubCategory("");
    }
    setIsSaving(false);
  };

  const handleDeleteSubCategory = async (subCatId: string) => {
    if (!confirm("Bu alt kategoriyi silmek istediğinize emin misiniz?")) return;
    
    setIsSaving(true);
    const result = await deleteSubCategory(subCatId);
    if (result.success) {
      const updatedCategories = categories.map(cat => {
        if (cat.id === activeCategory.id) {
          const updated = { ...cat, subCategories: cat.subCategories.filter((s: any) => s.id !== subCatId) };
          setActiveCategory(updated);
          return updated;
        }
        return cat;
      });
      setCategories(updatedCategories);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Üst Kısım */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-slate-900 w-8 h-8" />
            Sistem Ayarları
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Sistem kategorilerini, gider tanımlamalarını ve şirket kurumsal kimlik bilgilerinizi yönetin.</p>
        </div>
      </div>

      {/* Menü Seçici Sekmesi */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
        <button
          onClick={() => setActiveSettingsTab("CATEGORIES")}
          className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
            activeSettingsTab === "CATEGORIES"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <Tags size={16} />
            Gider Kategorileri
          </div>
        </button>
        <button
          onClick={() => setActiveSettingsTab("COMPANY")}
          className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
            activeSettingsTab === "COMPANY"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} />
            Şirket Kurumsal Bilgileri
          </div>
        </button>
        <button
          onClick={() => setActiveSettingsTab("M2_PRICES")}
          className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
            activeSettingsTab === "M2_PRICES"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-950"
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} />
            Tahmini m² Birim Fiyatları
          </div>
        </button>
      </div>

      {/* --- GİDER KATEGORİLERİ AYARI --- */}
      {activeSettingsTab === "CATEGORIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="premium-card bg-white overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                  <Layers size={16} className="text-slate-500" />
                  Ana Gider Grupları
                </h3>
                <button
                  onClick={() => openEditCategory(null)}
                  className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Yeni Grup Ekle"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="p-3 space-y-1.5">
                {categories.map((cat) => {
                  const colorMap = getColorClasses(cat.color);
                  return (
                    <div 
                      key={cat.id}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-sm font-bold group/item ${
                        activeCategory?.id === cat.id 
                          ? "bg-slate-900 text-white shadow-md" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <button
                        onClick={() => setActiveCategory(cat)}
                        className="flex-1 flex items-center gap-2.5 py-1 text-left truncate"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${colorMap.bg} shrink-0`}></span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            activeCategory?.id === cat.id 
                              ? "text-slate-400 hover:text-white hover:bg-white/15" 
                              : "text-slate-400 hover:text-slate-900 hover:bg-slate-200"
                          } opacity-0 group-hover/item:opacity-100 transition-opacity`}
                          title="Grubu Düzenle"
                        >
                          <Edit3 size={13} />
                        </button>
                        {activeCategory?.id !== cat.id && (
                          <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full group-hover/item:hidden">
                            {cat.subCategories.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <div className="flex gap-3 text-green-800">
                <CheckCircle size={20} className="shrink-0 text-green-600" />
                <div className="text-xs font-semibold leading-relaxed">
                  <strong className="block text-sm mb-1 text-green-900">Veritabanı Bağlantısı Aktif!</strong>
                  Bu sayfada tanımladığınız tüm kategoriler anlık olarak SQLite veritabanına kaydedilir ve şantiye/ofis gider formlarında listelenir.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeCategory ? (
              <div className="premium-card bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      <Tags size={20} className={`text-${activeCategory.color}-500`} />
                      {activeCategory.name} Alt Kategorileri
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Gider formlarında görünecek kalemler</p>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleAddSubCategory} className="flex gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <input
                      type="text"
                      placeholder="Örn: İskele Kurulumu"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-semibold text-sm"
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      disabled={isSaving}
                    />
                    <button 
                      type="submit"
                      disabled={!newSubCategory.trim() || isSaving}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      {isSaving ? "Ekleniyor..." : "Alt Kalem Ekle"}
                    </button>
                  </form>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeCategory.subCategories.map((subCat: any) => {
                      const colorMap = getColorClasses(activeCategory.color);
                      return (
                        <div key={subCat.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all group min-h-[58px]">
                          {editingSubCategoryId === subCat.id ? (
                            <form onSubmit={(e) => handleSaveSubCategory(e, subCat.id)} className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                required
                                className="flex-1 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-slate-50 text-slate-800"
                                value={editingSubCategoryName}
                                onChange={(e) => setEditingSubCategoryName(e.target.value)}
                                autoFocus
                                disabled={isSaving}
                              />
                              <button 
                                type="submit" 
                                disabled={isSaving || !editingSubCategoryName.trim()} 
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-100 transition-colors disabled:opacity-50"
                                title="Kaydet"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingSubCategoryId(null)} 
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                title="İptal"
                              >
                                <X size={14} />
                              </button>
                            </form>
                          ) : (
                            <>
                              <span className="font-bold text-slate-700 text-sm flex items-center gap-2 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full ${colorMap.bg} shrink-0`}></span>
                                <span className="truncate">{subCat.name}</span>
                              </span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button 
                                  onClick={() => handleStartEditSubCategory(subCat)}
                                  disabled={isSaving}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-colors disabled:opacity-50"
                                  title="Düzenle"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteSubCategory(subCat.id)}
                                  disabled={isSaving}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
                                  title="Sil"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {activeCategory.subCategories.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
                      Bu ana gruba ait henüz bir alt gider kalemi tanımlanmamış.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Henüz kategori bulunmamaktadır.</div>
            )}
          </div>
        </div>
      )}

      {/* --- ŞİRKET BİLGİLERİ AYARI (YENİ!) --- */}
      {activeSettingsTab === "COMPANY" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveCompanySettings} className="premium-card bg-white overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 uppercase tracking-wider">
                  <Building2 className="text-slate-600" size={18} />
                  Şirket Kurumsal Kimlik Bilgileri
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Emlak raporları, teklifler ve faturalandırma modüllerinde geçerli olacak resmi firma bilgileri.</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Şirket Adı */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" />
                      Firma / Şirket Unvanı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Avlay İnşaat ve Gayrimenkul A.Ş."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Yetkili Ad Soyad */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      Yetkili Temsilci
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Nuri Avlay"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyAuthorized}
                      onChange={(e) => setCompanyAuthorized(e.target.value)}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Şirket Telefon */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      Şirket Telefonu
                    </label>
                    <input
                      type="text"
                      placeholder="(5xx) xxx-xxxx"
                      maxLength={15}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyPhone}
                      onChange={handlePhoneChange}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Şirket Email */}
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail size={14} className="text-slate-400" />
                      E-Posta Adresi
                    </label>
                    <input
                      type="email"
                      placeholder="info@avlayinsaat.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Vergi Dairesi */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-400" />
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      placeholder="Marmaris V.D."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyTaxOffice}
                      onChange={(e) => setCompanyTaxOffice(e.target.value)}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Vergi Numarası */}
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-400" />
                      Vergi Numarası
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="1234567890"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                      value={companyTaxNo}
                      onChange={(e) => setCompanyTaxNo(e.target.value.replace(/\D/g, ""))}
                      disabled={saveStatus === "SAVING"}
                    />
                  </div>

                  {/* Şirket Adresi */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      Firma Adresi
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Kemeraltı Mah. Atatürk Cad. No:12 Daire:3 Marmaris / Muğla"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800 text-sm"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      disabled={saveStatus === "SAVING"}
                    ></textarea>
                  </div>
                </div>

                {/* Uyarılar ve Durum Mesajları */}
                {saveStatus === "SUCCESS" && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200">
                    <CheckCircle className="text-green-600 shrink-0" size={16} />
                    <span>Şirket kurumsal bilgileri başarıyla kaydedildi! Sol üst köşedeki başlık dinamik olarak güncellendi.</span>
                  </div>
                )}
                {saveStatus === "ERROR" && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200">
                    <AlertCircle className="text-red-600 shrink-0" size={16} />
                    <span>Bilgiler güncellenirken bir veritabanı hatası oluştu. Lütfen tekrar deneyin.</span>
                  </div>
                )}

                {/* Kaydet Butonu */}
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saveStatus === "SAVING" || !companyName.trim()}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Save size={16} />
                    {saveStatus === "SAVING" ? "Kaydediliyor..." : "Şirket Bilgilerini Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sağ Kolon Bilgilendirme */}
          <div className="lg:col-span-1 space-y-4">
            <div className="premium-card p-6 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
              {/* Background abstract decoration */}
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2 text-white/80">
                <Building2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Özel Arayüz Entegrasyonu</span>
              </div>
              <h4 className="text-lg font-black mt-3 leading-tight">Kurumsal Kimlik</h4>
              <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
                Şirketinizin ismi, buraya girdiğiniz andan itibaren sol üst köşede yer alan standart logo yazısının yerini alır.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-slate-400">
                <span>AKTİF MÜŞTERİ YÜZÜ</span>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Aktif</span>
              </div>
            </div>

            <div className="premium-card p-5 bg-white border border-slate-200">
              <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText size={14} className="text-slate-500" />
                İleride Neler Eklenecek?
              </h5>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Bu bilgiler, projenizin ileriki sürümlerinde oluşturulacak resmi sözleşmeler, pdf ödeme planı çıktıları, antetli fatura tasarımları ve komisyon senetlerinin en üstünde kurumsal antet olarak kullanılmak üzere tasarlanmıştır.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* --- TAHMİNİ M2 BİRİM FİYATLARI AYARI --- */}
      {activeSettingsTab === "M2_PRICES" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fiyat Ekleme Formu */}
          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={handleSavePrice} className="premium-card bg-white overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-extrabold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wider">
                  {editingPriceId ? <Edit3 size={16} className="text-slate-500" /> : <Plus size={16} className="text-slate-500" />}
                  {editingPriceId ? "Birim Fiyatı Düzenle" : "Yeni Birim Fiyat Tanımla"}
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">İnşaat Yılı</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold"
                    value={newPriceYear}
                    onChange={(e) => setNewPriceYear(parseInt(e.target.value))}
                    disabled={!!editingPriceId} // disable year/type editing during active edit to avoid unique constraint mismatch
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                      <option key={yr} value={yr}>{yr} Yılı</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">İnşaat Türü</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold"
                    value={newPriceType}
                    onChange={(e) => setNewPriceType(e.target.value)}
                    disabled={!!editingPriceId}
                  >
                    <option value="Apartman">Apartman</option>
                    <option value="Villa">Villa</option>
                    <option value="Bitişik Villa">Bitişik Villa</option>
                    <option value="Ticari">Ticari</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahmini m² Fiyatı (₺/m²)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₺</span>
                    <input
                      type="number"
                      required
                      placeholder="Örn: 20000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-black text-slate-900"
                      value={newPriceAmount}
                      onChange={(e) => setNewPriceAmount(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingPriceId && (
                    <button
                      type="button"
                      onClick={handleCancelEditPrice}
                      className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                    >
                      Vazgeç
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving || !newPriceAmount}
                    className="flex-[2] bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Save size={16} />
                    {isSaving ? "Kaydediliyor..." : (editingPriceId ? "Fiyatı Güncelle" : "Fiyatı Kaydet")}
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-blue-800">
              <div className="flex gap-3">
                <AlertCircle size={20} className="shrink-0 text-blue-600" />
                <div className="text-xs font-semibold leading-relaxed">
                  <strong className="block text-sm mb-1 text-blue-900">Otomatik Maliyet Hesabı</strong>
                  Buraya girdiğiniz m² birim fiyatları, yeni bir Blok (Proje) eklerken girdiğiniz **İnşaat Alanı (m²)** ile çarpılarak blok için tahmini bütçe/maliyeti otomatik hesaplar.
                </div>
              </div>
            </div>
          </div>

          {/* Tanımlı Fiyatlar Listesi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="premium-card bg-white overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Tanımlı Yıllık m² Birim Fiyatları
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {prices.map((p: any) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{p.year} Yılı</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{p.type}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">Birim Fiyat: <strong className="text-slate-900 font-extrabold">{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(p.price)} / m²</strong></p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditPrice(p)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePrice(p.id)}
                        disabled={isSaving}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {prices.length === 0 && (
                  <div className="text-center py-16 text-slate-400 font-bold border-2 border-dashed border-slate-100 m-6 rounded-2xl">
                    Henüz tanımlanmış bir m² birim fiyatı bulunmamaktadır.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Düzenleme Modalı */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className={getColorClasses(editCategoryColor).text} size={20} />
                {editingCategory.id === "NEW" ? "Yeni Ana Gider Grubu" : "Ana Gider Grubunu Düzenle"}
              </h2>
              <button 
                type="button" 
                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grup Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Kaba İnşaat"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-950 transition-all font-semibold text-slate-800"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Grup Rengi</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: "blue", name: "Mavi" },
                    { id: "green", name: "Yeşil" },
                    { id: "amber", name: "Turuncu" },
                    { id: "red", name: "Kırmızı" },
                    { id: "purple", name: "Mor" },
                    { id: "rose", name: "Gül" },
                    { id: "teal", name: "Turkuaz" },
                    { id: "indigo", name: "Çivit" }
                  ].map((color) => {
                    const colorMap = getColorClasses(color.id);
                    const isActive = editCategoryColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setEditCategoryColor(color.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isActive
                            ? `${colorMap.bgLight} ${colorMap.border} ${colorMap.text} ring-2 ${colorMap.ring}`
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${colorMap.bg} shrink-0`}></span>
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                  disabled={isSaving}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editCategoryName.trim()}
                  className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 text-sm"
                >
                  <Save size={16} />
                  {isSaving ? "Kaydediliyor..." : "Grubu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
