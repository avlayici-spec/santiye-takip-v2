"use client";

import { useState } from "react";
import { 
  HardHat, 
  Plus, 
  Building2, 
  Hammer, 
  Paintbrush, 
  Coins, 
  Trash2, 
  Edit3,
  Calendar,
  Filter,
  Layers
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { createExpense, updateExpense, deleteExpense } from "@/app/actions/expense";

export default function ClientPage({ 
  initialExpenses, 
  projects,
  categories,
  sites = []
}: { 
  initialExpenses: any[],
  projects: any[],
  categories: any[],
  sites?: any[]
}) {
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  
  // Filtreleme Durumları
  const [selectedSiteId, setSelectedSiteId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  const handleSave = async (data: any) => {
    if (editingExpense) {
      const result = await updateExpense(editingExpense.id, data);
      if (result.success) {
        setExpenses(expenses.map(e => e.id === editingExpense.id ? result.expense : e));
      }
    } else {
      const result = await createExpense(data);
      if (result.success && result.expense?.expenseType === "SANTIYE") {
        const cat = categories.find(c => c.id === data.categoryId);
        const subCat = cat?.subCategories.find((s:any) => s.id === data.subCategoryId);
        const proj = projects.find(p => p.id === data.projectId);
        const site = sites.find(s => s.id === data.siteId);
        const newExpense = {
          ...result.expense,
          projectName: proj?.name || site?.name || "Merkez Ofis",
          categoryName: cat?.name || result.expense?.categoryName,
          subCategoryName: subCat?.name || result.expense?.subCategoryName,
          project: proj || null,
          site: site || null,
        };
        setExpenses([newExpense, ...expenses]);
      }
    }
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async (expense: any) => {
    if (!confirm(`"${expense.categoryName} - ${expense.subCategoryName}" gider kaydını silmek istediğinizden emin misiniz?`)) return;
    const result = await deleteExpense(expense.id);
    if (result.success) {
      setExpenses(expenses.filter(e => e.id !== expense.id));
    }
  };

  const openEdit = (expense: any) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSite = selectedSiteId === "ALL" || 
      e.siteId === selectedSiteId || 
      (e.project && e.project.siteId === selectedSiteId);
      
    const matchesProject = selectedProjectId === "ALL" || e.projectId === selectedProjectId;
    
    return matchesSite && matchesProject;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const kabaAmount = filteredExpenses
    .filter(e => e.categoryName === "Kaba İnşaat")
    .reduce((sum, e) => sum + e.amount, 0);
    
  const inceAmount = filteredExpenses
    .filter(e => e.categoryName === "İnce İnşaat")
    .reduce((sum, e) => sum + e.amount, 0);
    
  const iscilikAmount = filteredExpenses
    .filter(e => e.categoryName === "İşçilik")
    .reduce((sum, e) => sum + e.amount, 0);
    
  const digerAmount = totalAmount - kabaAmount - inceAmount - iscilikAmount;

  const kabaPercent = totalAmount > 0 ? (kabaAmount / totalAmount) * 100 : 0;
  const incePercent = totalAmount > 0 ? (inceAmount / totalAmount) * 100 : 0;
  const iscilikPercent = totalAmount > 0 ? (iscilikAmount / totalAmount) * 100 : 0;
  const digerPercent = totalAmount > 0 ? (digerAmount / totalAmount) * 100 : 0;

  // Ortaklık ve Ödeyen Taraf hesaplamaları
  const bizPaidAmount = filteredExpenses.filter(e => e.paidBy === "BIZ" || !e.paidBy).reduce((sum, e) => sum + e.amount, 0);
  const ortakPaidAmount = filteredExpenses.filter(e => e.paidBy === "ORTAK").reduce((sum, e) => sum + e.amount, 0);
  const ortakKasaAmount = filteredExpenses.filter(e => e.paidBy === "ORTAK_KASA").reduce((sum, e) => sum + e.amount, 0);

  const activeSite = sites.find(s => s.id === selectedSiteId);
  const isJVActive = activeSite?.isJointVenture || (selectedSiteId === "ALL" && sites.some(s => s.isJointVenture));
  const ourShareRate = activeSite?.isJointVenture ? (activeSite.ourShare || 50) : 50;
  const partnerShareRate = activeSite?.isJointVenture ? (activeSite.partnerShare || 50) : 50;
  const partnerName = activeSite?.partnerName || "Ortak Firma";

  // Toplam harcamada hissemize düşen sorumluluk ve fark
  const ourTargetExpense = (totalAmount * ourShareRate) / 100;
  const partnerTargetExpense = (totalAmount * partnerShareRate) / 100;
  const balanceDiff = bizPaidAmount - ourTargetExpense; // >0 ise biz fazla ödedik (ortağın bize borcu var)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HardHat className="text-slate-900 w-8 h-8" />
            Şantiye Giderleri
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Şantiyelerinizin kaba inşaat, ince inşaat ve işçilik giderlerini detaylı takip edin.</p>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 w-fit"
        >
          <Plus size={20} />
          <span>Yeni Gider Ekle</span>
        </button>
      </div>

      <div className="premium-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Şantiye Seçimi */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Building2 size={16} />
            </span>
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold text-slate-700 text-sm cursor-pointer"
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedProjectId("ALL"); // reset project selection
              }}
            >
              <option value="ALL">Tüm Şantiyeler</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Blok Seçimi */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Layers size={16} />
            </span>
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold text-slate-700 text-sm cursor-pointer"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="ALL">Tüm Bloklar / Projeler</option>
              {projects
                .filter(p => selectedSiteId === "ALL" || p.siteId === selectedSiteId)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-1.5 w-fit">
          <Filter size={14} className="text-slate-400" />
          <span>Filtrelenen: <span className="text-slate-900 font-extrabold">{filteredExpenses.length}</span></span>
        </div>
      </div>

      {/* Finansal Metrik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-slate-900 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrelenen Toplam</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaba İnşaat Gideri</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Hammer size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(kabaAmount)}</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-green-600 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İnce İnşaat Gideri</p>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Paintbrush size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(inceAmount)}</p>
        </div>

        <div className="premium-card p-6 border-l-4 border-l-amber-600 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İşçilik & Diğer</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <HardHat size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{formatCurrency(iscilikAmount + digerAmount)}</p>
        </div>
      </div>

      {/* Ortaklık Mahsuplaşma ve Harcama Özeti Kartı */}
      {isJVActive && (
        <div className="premium-card p-6 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300/60 shadow-xl rounded-2xl animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-600 text-white shadow-sm mb-2">
                👥 YÜKLENİCİ ORTAKLIĞI (JV) HESAPLAŞMA ÖZETİ
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {activeSite ? `${activeSite.name} — Ortaklık Cari Mahsuplaşması` : "Tüm Ortaklı Şantiyeler Harcama Özeti"}
              </h2>
              <p className="text-xs text-slate-600 font-bold mt-0.5">
                Ortak: <span className="text-amber-800 font-extrabold">{partnerName}</span> (%{partnerShareRate}) | Firmamız (%{ourShareRate})
              </p>
            </div>
            <div className={`p-4 rounded-2xl border flex flex-col items-end shrink-0 ${
              balanceDiff > 0 
                ? "bg-green-50 border-green-300 text-green-900" 
                : balanceDiff < 0 
                ? "bg-red-50 border-red-300 text-red-900" 
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                {balanceDiff > 0 ? `⚖️ ${partnerName} FİRMAMIZA BORÇLUDUR:` : balanceDiff < 0 ? `⚖️ FİRMAMIZ ${partnerName}'A BORÇLUDUR:` : "⚖️ HESAPLAR DENGELİ"}
              </span>
              <span className="text-2xl font-black mt-1">
                {formatCurrency(Math.abs(balanceDiff))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            <div className="p-4 bg-white rounded-xl border border-amber-200/50 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">🏢 Firmamızın Ödediği Toplam</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(bizPaidAmount)}</span>
              <span className="text-[11px] font-bold text-slate-500 block pt-1 border-t border-slate-100">
                Sorumluluğumuz (%{ourShareRate}): <b className="text-slate-800">{formatCurrency(ourTargetExpense)}</b>
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-amber-200/50 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">🤝 {partnerName} Ödediği Toplam</span>
              <span className="text-xl font-black text-amber-700">{formatCurrency(ortakPaidAmount)}</span>
              <span className="text-[11px] font-bold text-slate-500 block pt-1 border-t border-slate-100">
                Sorumluluğu (%{partnerShareRate}): <b className="text-slate-800">{formatCurrency(partnerTargetExpense)}</b>
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-amber-200/50 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">💼 Ortak Havuz Kasa Harcaması</span>
              <span className="text-xl font-black text-indigo-700">{formatCurrency(ortakKasaAmount)}</span>
              <span className="text-[11px] font-bold text-slate-500 block pt-1 border-t border-slate-100">
                Ortak havuzdan direkt ödenen tutar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gider Tablosu */}
      <div className="premium-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            Gider Hareketleri Kaydı
          </h3>
        </div>

        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold">
              Bu filtrelere uygun herhangi bir gider kaydı bulunamadı.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tarih</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Şantiye</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Kategori</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Açıklama</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ödeyen</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Tutar</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((expense) => {
                  const proj = projects.find(p => p.id === expense.projectId);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-4 text-sm font-semibold text-slate-600 whitespace-nowrap">
                        {formatDate(expense.date)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {expense.expenseType === "OFIS" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-600 uppercase tracking-wide">
                              MERKEZ OFİS
                            </span>
                          ) : (
                            <div className="flex flex-col">
                              {expense.site && (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {expense.site.name}
                                </span>
                              )}
                              <span className="font-extrabold text-slate-900 text-sm">
                                {expense.project?.name || "Ortak Gider"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className={`text-xs font-black uppercase tracking-wider w-fit px-2 py-0.5 rounded ${
                            expense.categoryName === "Kaba İnşaat" ? "bg-blue-50 text-blue-700 border border-blue-100/50" :
                            expense.categoryName === "İnce İnşaat" ? "bg-green-50 text-green-700 border border-green-100/50" :
                            expense.categoryName === "İşçilik" ? "bg-amber-50 text-amber-700 border border-amber-200/30" :
                            "bg-purple-50 text-purple-700 border border-purple-100/30"
                          }`}>
                            {expense.categoryName || expense.category}
                          </span>
                          <span className="text-xs text-slate-500 font-bold mt-1 ml-1">{expense.subCategoryName || expense.subCategory}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {expense.description && (
                            <p className="text-sm text-slate-700 font-medium truncate" title={expense.description}>
                              {expense.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {expense.documentNo && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black border border-slate-200 whitespace-nowrap" title="Fiş/Belge No">
                                🧾 {expense.documentNo}
                              </span>
                            )}
                            {expense.supplier && (
                              <span className="text-[10px] bg-amber-50/70 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-100/50 whitespace-nowrap" title="Kimden Alındı / Satıcı">
                                🏢 {expense.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          expense.paidBy === "ORTAK" 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : expense.paidBy === "ORTAK_KASA" 
                            ? "bg-indigo-50 text-indigo-800 border-indigo-200" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {expense.paidBy === "ORTAK" ? "🤝 Ortak Firma" : expense.paidBy === "ORTAK_KASA" ? "💼 Ortak Havuz" : "🏢 Firmamız"}
                        </span>
                      </td>
                      <td className="p-4 font-black text-red-600 text-sm whitespace-nowrap">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEdit(expense)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                            title="Düzenle"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
 
      {isFormOpen && (
        <ExpenseForm 
          expense={editingExpense}
          projects={projects}
          categories={categories}
          sites={sites}
          onClose={() => { setIsFormOpen(false); setEditingExpense(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
