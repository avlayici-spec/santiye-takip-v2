"use client";

import { useState } from "react";
import { 
  FileText, 
  Users, 
  Building2, 
  Calendar, 
  ArrowUpRight, 
  Coins,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  Clock,
  ChevronRight,
  Search,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ClientPageProps {
  initialCommissions: any[];
  initialProjects: any[];
  initialExpenses?: any[];
  sites?: any[];
}

export default function ClientPage({ initialCommissions, initialProjects, initialExpenses = [], sites = [] }: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<"AGENT" | "PROJECT" | "REAL_ESTATE" | "INSTALLMENTS" | "SITE_EXPENSES">("REAL_ESTATE");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

  // Filters for Real Estate / Installments reports
  const [selectedSiteId, setSelectedSiteId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("ALL");
  const [selectedInstallmentStatus, setSelectedInstallmentStatus] = useState<"ALL" | "OVERDUE" | "FUTURE">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filters for Site Expenses report
  const [selectedExpenseSiteId, setSelectedExpenseSiteId] = useState<string>("ALL");
  const [selectedExpenseProjectId, setSelectedExpenseProjectId] = useState<string>("ALL");
  const [selectedExpenseCategoryId, setSelectedExpenseCategoryId] = useState<string>("ALL");
  const [selectedExpensePaidBy, setSelectedExpensePaidBy] = useState<string>("ALL");

  // Sort projects: first by site name (if exists), then by project name
  const sortedProjects = [...initialProjects].sort((a, b) => {
    const siteA = a.site?.name || "";
    const siteB = b.site?.name || "";
    if (siteA !== siteB) {
      return siteA.localeCompare(siteB);
    }
    return a.name.localeCompare(b.name);
  });

  // Map database commissions to previous structure
  const commissionRecords = initialCommissions.map((c: any) => ({
    id: c.id,
    agent: c.agentName,
    project: c.unit?.project?.name || "Bilinmeyen Proje",
    date: new Date(c.createdAt),
    amount: c.amount,
    customer: c.unit?.customer?.name || "Belirtilmedi",
    status: c.isPaid ? "ÖDENDİ" : "BEKLİYOR"
  }));

  // Filtering for Commission report
  const filteredCommissionRecords = commissionRecords.filter(record => 
    selectedYear === "ALL" || record.date.getFullYear().toString() === selectedYear
  );

  // General Totals for Commissions
  const totalCommission = filteredCommissionRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = filteredCommissionRecords.filter(r => r.status === "ÖDENDİ").reduce((sum, r) => sum + r.amount, 0);
  const totalPending = filteredCommissionRecords.filter(r => r.status === "BEKLİYOR").reduce((sum, r) => sum + r.amount, 0);

  // Emlakçı Bazlı Gruplama
  const agentGroups = filteredCommissionRecords.reduce((acc, record) => {
    if (!acc[record.agent]) {
      acc[record.agent] = { total: 0, count: 0, projects: {} };
    }
    acc[record.agent].total += record.amount;
    acc[record.agent].count += 1;
    
    if (!acc[record.agent].projects[record.project]) {
      acc[record.agent].projects[record.project] = 0;
    }
    acc[record.agent].projects[record.project] += record.amount;
    
    return acc;
  }, {} as Record<string, any>);

  // Proje Bazlı Gruplama
  const projectGroups = filteredCommissionRecords.reduce((acc, record) => {
    if (!acc[record.project]) {
      acc[record.project] = { total: 0, count: 0, agents: {} };
    }
    acc[record.project].total += record.amount;
    acc[record.project].count += 1;
    
    if (!acc[record.project].agents[record.agent]) {
      acc[record.project].agents[record.agent] = 0;
    }
    acc[record.project].agents[record.agent] += record.amount;
    
    return acc;
  }, {} as Record<string, any>);

  // --- GAYRİMENKUL & TAKSİT HESAPLAMALARI ---
  const calculateUnitPayments = (unit: any) => {
    const plans = unit.paymentPlans || [];
    if (plans.length === 0) {
      return {
        isInstallment: false,
        totalPaid: unit.status === "SATILDI" ? (unit.salePrice || 0) : 0,
        totalOverdue: 0,
        totalFuture: 0,
        totalRemaining: 0
      };
    }

    const now = new Date();
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalFuture = 0;

    plans.forEach((p: any) => {
      const dueDate = new Date(p.dueDate);
      const amount = p.amount;
      const paidAmount = p.paidAmount || 0;

      // Toplam ödenen
      totalPaid += paidAmount;

      // Kalan ödeme vadeli
      const remaining = amount - paidAmount;
      if (remaining > 0) {
        if (dueDate < now) {
          totalOverdue += remaining;
        } else {
          totalFuture += remaining;
        }
      }
    });

    return {
      isInstallment: plans.length > 1,
      totalPaid,
      totalOverdue,
      totalFuture,
      totalRemaining: totalOverdue + totalFuture
    };
  };

  // Process all units
  const processedUnits = initialProjects.flatMap(project => {
    return (project.units || []).map((unit: any) => {
      const payments = calculateUnitPayments(unit);
      return {
        ...unit,
        projectName: project.name,
        siteId: project.siteId,
        payments
      };
    });
  });

  // Filter Units based on search & selectors
  const filteredUnits = processedUnits.filter(unit => {
    const matchesSite = selectedSiteId === "ALL" || unit.siteId === selectedSiteId;
    const matchesProject = selectedProjectId === "ALL" || unit.projectId === selectedProjectId;
    const matchesStatus = selectedStatus === "ALL" || unit.status === selectedStatus;
    
    let matchesPaymentType = true;
    if (selectedPaymentType === "PESIN") {
      matchesPaymentType = unit.status === "SATILDI" && !unit.payments.isInstallment;
    } else if (selectedPaymentType === "TAKSITLI") {
      matchesPaymentType = unit.status === "SATILDI" && unit.payments.isInstallment;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      unit.unitNumber.toLowerCase().includes(searchLower) ||
      unit.projectName.toLowerCase().includes(searchLower) ||
      (unit.customer?.name || "").toLowerCase().includes(searchLower);

    return matchesSite && matchesProject && matchesStatus && matchesPaymentType && matchesSearch;
  });

  // Totals for Real Estate Report
  const totalUnitsCount = filteredUnits.length;
  const soldUnitsCount = filteredUnits.filter(u => u.status === "SATILDI").length;
  const rezerveUnitsCount = filteredUnits.filter(u => u.status === "REZERVE").length;
  
  const totalListPrice = filteredUnits.reduce((sum, u) => sum + (u.estimatedPrice || 0), 0);
  const totalSalePrice = filteredUnits.reduce((sum, u) => sum + (u.salePrice || 0), 0);
  
  const overallPaid = filteredUnits.reduce((sum, u) => sum + u.payments.totalPaid, 0);
  const overallOverdue = filteredUnits.reduce((sum, u) => sum + u.payments.totalOverdue, 0);
  const overallFuture = filteredUnits.reduce((sum, u) => sum + u.payments.totalFuture, 0);

  // --- BEKLEYEN TEKİL TAKSİTLER LİSTELEME VE HESAPLAMA (YENİ!) ---
  const pendingInstallments = initialProjects.flatMap(project => {
    return (project.units || []).flatMap((unit: any) => {
      if (unit.status !== "SATILDI") return [];
      
      const plans = unit.paymentPlans || [];
      return plans
        .filter((p: any) => !p.isPaid) // Sadece ödenmeyenler
        .map((p: any) => {
          const dueDate = new Date(p.dueDate);
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          const isOverdue = dueDate < now;
          const diffTime = Math.abs(now.getTime() - dueDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            id: p.id,
            projectId: unit.projectId,
            siteId: project.siteId,
            dueDate,
            amount: p.amount,
            isOverdue,
            diffDays,
            unitNumber: unit.unitNumber,
            unitType: unit.type,
            floorNumber: unit.floorNumber,
            projectName: project.name,
            customerName: unit.customer?.name || "Bilinmeyen Müşteri",
            customerPhone: unit.customer?.phone || "Telefon Yok"
          };
        });
    });
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  // Filter individual installments
  const filteredInstallments = pendingInstallments.filter(inst => {
    const matchesSite = selectedSiteId === "ALL" || inst.siteId === selectedSiteId;
    const matchesProject = selectedProjectId === "ALL" || inst.projectId === selectedProjectId;
    
    let matchesStatus = true;
    if (selectedInstallmentStatus === "OVERDUE") {
      matchesStatus = inst.isOverdue;
    } else if (selectedInstallmentStatus === "FUTURE") {
      matchesStatus = !inst.isOverdue;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      inst.unitNumber.toLowerCase().includes(searchLower) ||
      inst.projectName.toLowerCase().includes(searchLower) ||
      inst.customerName.toLowerCase().includes(searchLower);

    return matchesSite && matchesProject && matchesStatus && matchesSearch;
  });

  const totalPendingInstallmentsAmount = filteredInstallments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalOverdueInstallmentsAmount = filteredInstallments.filter(inst => inst.isOverdue).reduce((sum, inst) => sum + inst.amount, 0);
  const totalFutureInstallmentsAmount = filteredInstallments.filter(inst => !inst.isOverdue).reduce((sum, inst) => sum + inst.amount, 0);

  // --- ŞANTİYE GİDERLERİ HESAPLAMALARI ---
  const filteredExpenses = initialExpenses.filter(exp => {
    const matchesSite = selectedExpenseSiteId === "ALL" || 
      exp.siteId === selectedExpenseSiteId || 
      (exp.project && exp.project.siteId === selectedExpenseSiteId);

    const matchesProject = selectedExpenseProjectId === "ALL" || exp.projectId === selectedExpenseProjectId;
    const matchesCategory = selectedExpenseCategoryId === "ALL" || exp.categoryId === selectedExpenseCategoryId;
    const matchesPaidBy = selectedExpensePaidBy === "ALL" || exp.paidBy === selectedExpensePaidBy;
    return matchesSite && matchesProject && matchesCategory && matchesPaidBy;
  });

  const totalSiteExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const expenseProjectGroups = filteredExpenses.reduce((acc, exp) => {
    const pName = exp.project?.name 
      ? `${exp.site?.name ? exp.site.name + " - " : ""}${exp.project.name}` 
      : (exp.site?.name || "Merkez / Belirsiz");
    if (!acc[pName]) {
      acc[pName] = { total: 0, count: 0, categories: {} };
    }
    acc[pName].total += exp.amount;
    acc[pName].count += 1;
    
    const catName = exp.category?.name || exp.categoryName || "Diğer";
    if (!acc[pName].categories[catName]) {
      acc[pName].categories[catName] = { total: 0, subCategories: {} };
    }
    acc[pName].categories[catName].total += exp.amount;

    const subCatName = exp.subCategory?.name || exp.subCategoryName || "Genel";
    if (!acc[pName].categories[catName].subCategories[subCatName]) {
      acc[pName].categories[catName].subCategories[subCatName] = 0;
    }
    acc[pName].categories[catName].subCategories[subCatName] += exp.amount;

    return acc;
  }, {} as Record<string, any>);

  const uniqueCategories = Array.from(new Set(initialExpenses.map(e => e.categoryId).filter(Boolean))).map(id => {
    const exp = initialExpenses.find(e => e.categoryId === id);
    return { id, name: exp?.category?.name || exp?.categoryName || "Diğer" };
  });

  const selectedExpenseProjectName = selectedExpenseSiteId !== "ALL"
    ? (sites.find(s => s.id === selectedExpenseSiteId)?.name || "Seçili Şantiye") + (selectedExpenseProjectId !== "ALL" ? ` - ${initialProjects.find(p => p.id === selectedExpenseProjectId)?.name || ""}` : "")
    : "Tüm Şantiyeler";

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Üst Kısım */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-slate-900 w-8 h-8" />
            Raporlar & Analizler
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Emlak satışları, vadeli taksit yaşlandırmaları, vadesi gelmiş/gelmemiş alacaklar ve komisyonlar.</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95 w-fit cursor-pointer print:hidden"
        >
          <Download size={18} />
          <span>Yazdır / PDF Kaydet</span>
        </button>
      </div>

      {/* Kontrol & Filtre Barı */}
      <div className="premium-card p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white print:hidden">
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-fit gap-1">
          <button
            onClick={() => setActiveTab("REAL_ESTATE")}
            className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeTab === "REAL_ESTATE"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 size={16} />
              Gayrimenkul Satış Raporu
            </div>
          </button>
          <button
            onClick={() => setActiveTab("INSTALLMENTS")}
            className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeTab === "INSTALLMENTS"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} />
              Bekleyen Taksitler Raporu
            </div>
          </button>
          <button
            onClick={() => setActiveTab("AGENT")}
            className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeTab === "AGENT"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              Emlakçı Komisyon Raporu
            </div>
          </button>
          <button
            onClick={() => setActiveTab("PROJECT")}
            className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeTab === "PROJECT"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} />
              Proje Komisyon Raporu
            </div>
          </button>
          <button
            onClick={() => setActiveTab("SITE_EXPENSES")}
            className={`px-5 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
              activeTab === "SITE_EXPENSES"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={16} />
              Şantiye Giderleri
            </div>
          </button>
        </div>

        {activeTab === "REAL_ESTATE" && (
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Daire, proje veya müşteri..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-xs font-bold text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Şantiye Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedProjectId("ALL");
              }}
            >
              <option value="ALL">Tüm Şantiyeler</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Blok Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="ALL">Tüm Bloklar / Projeler</option>
              {sortedProjects
                .filter(p => selectedSiteId === "ALL" || p.siteId === selectedSiteId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.site ? `${p.site.name} - ${p.name}` : p.name}
                  </option>
                ))}
            </select>

            <select
              className="w-full sm:w-36 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="SATILIK">Satılık</option>
              <option value="SATILDI">Satıldı</option>
              <option value="REZERVE">Rezerve</option>
            </select>

            <select
              className="w-full sm:w-40 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedPaymentType}
              onChange={(e) => setSelectedPaymentType(e.target.value)}
            >
              <option value="ALL">Tüm Satış Tipleri</option>
              <option value="PESIN">Peşin Satışlar</option>
              <option value="TAKSITLI">Taksitli Satışlar</option>
            </select>
          </div>
        )}

        {activeTab === "INSTALLMENTS" && (
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Daire veya müşteri..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 text-xs font-bold text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Şantiye Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedProjectId("ALL");
              }}
            >
              <option value="ALL">Tüm Şantiyeler</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Blok Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="ALL">Tüm Bloklar / Projeler</option>
              {sortedProjects
                .filter(p => selectedSiteId === "ALL" || p.siteId === selectedSiteId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.site ? `${p.site.name} - ${p.name}` : p.name}
                  </option>
                ))}
            </select>

            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedInstallmentStatus}
              onChange={(e) => setSelectedInstallmentStatus(e.target.value as any)}
            >
              <option value="ALL">Tüm Bekleyenler</option>
              <option value="OVERDUE">Günü Geçmiş Taksitler</option>
              <option value="FUTURE">Vadesi Gelmemişler</option>
            </select>
          </div>
        )}

        {activeTab === "SITE_EXPENSES" && (
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Şantiye Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedExpenseSiteId}
              onChange={(e) => {
                setSelectedExpenseSiteId(e.target.value);
                setSelectedExpenseProjectId("ALL"); // reset project selection
              }}
            >
              <option value="ALL">Tüm Şantiyeler</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Blok Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedExpenseProjectId}
              onChange={(e) => setSelectedExpenseProjectId(e.target.value)}
            >
              <option value="ALL">Tüm Bloklar / Projeler</option>
              {sortedProjects
                .filter(p => selectedExpenseSiteId === "ALL" || p.siteId === selectedExpenseSiteId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.site ? `${p.site.name} - ${p.name}` : p.name}
                  </option>
                ))}
            </select>

            {/* Kategori Seçimi */}
            <select
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedExpenseCategoryId}
              onChange={(e) => setSelectedExpenseCategoryId(e.target.value)}
            >
              <option value="ALL">Tüm Kategoriler</option>
              {uniqueCategories.map(c => (
                <option key={c.id as string} value={c.id as string}>{c.name}</option>
              ))}
            </select>

            {/* Ödemeyi / Harcamayı Yapan Seçimi */}
            <select
              className="w-full sm:w-48 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-xs font-bold text-slate-700 bg-white cursor-pointer"
              value={selectedExpensePaidBy}
              onChange={(e) => setSelectedExpensePaidBy(e.target.value)}
            >
              <option value="ALL">🤝 Ödeyen: Tümü</option>
              <option value="BIZ">🏢 Kendi Kasamız (Biz)</option>
              <option value="ORTAK">🤝 Ortak Ödedi</option>
              <option value="ORTAK_KASA">💰 Ortak Havuz Kasası</option>
            </select>
          </div>
        )}

        {(activeTab === "AGENT" || activeTab === "PROJECT") && (
          <div className="relative w-full sm:w-48">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Calendar size={16} />
            </span>
            <select
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all bg-white font-bold text-slate-700 text-sm cursor-pointer"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="ALL">Tüm Zamanlar</option>
              <option value="2026">2026 Yılı</option>
              <option value="2025">2025 Yılı</option>
            </select>
          </div>
        )}
      </div>

      {/* --- GAYRİMENKUL DETAYLI SATIŞ VE YAŞLANDIRMA RAPORU --- */}
      {activeTab === "REAL_ESTATE" && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
            <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gayrimenkul Stoğu</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{totalUnitsCount} Adet</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-3 flex items-center gap-1.5">
                <span className="text-green-600 font-extrabold">{soldUnitsCount} Satıldı</span>
                <span className="text-slate-300">•</span>
                <span className="text-amber-500 font-extrabold">{rezerveUnitsCount} Rezerve</span>
                <span className="text-slate-300">•</span>
                <span>{totalUnitsCount - soldUnitsCount - rezerveUnitsCount} Satılık</span>
              </div>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-emerald-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Satış Cirosu</p>
                  <p className="text-2xl font-black text-slate-900 mt-2 truncate max-w-[170px]">{formatCurrency(totalSalePrice)}</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-3.5 flex items-center justify-between">
                <span>İstenen Fiyat (Liste):</span>
                <span className="font-extrabold text-slate-700">{formatCurrency(totalListPrice)}</span>
              </div>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-indigo-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerçekleşen Tahsilat</p>
                  <p className="text-2xl font-black text-indigo-600 mt-2 truncate max-w-[170px]">{formatCurrency(overallPaid)}</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-3.5 flex items-center justify-between">
                <span>Tahsilat Oranı:</span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">% {totalSalePrice > 0 ? ((overallPaid / totalSalePrice) * 100).toFixed(1) : 0}</span>
              </div>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-red-500 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vadesi Geçen Alacak</p>
                  <p className="text-2xl font-black text-red-600 mt-2 truncate max-w-[170px]">{formatCurrency(overallOverdue)}</p>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 mt-3.5 flex items-center justify-between">
                <span>Gelecek Vadeli Alacak:</span>
                <span className="font-extrabold text-slate-700">{formatCurrency(overallFuture)}</span>
              </div>
            </div>
          </div>

          {/* Gayrimenkul Listesi Tablosu */}
          <div className="premium-card bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Building2 className="text-slate-600" size={18} />
                Gayrimenkul Portföy, Satış ve Tahsilat Yaşlandırma Analizi
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full w-fit">
                {filteredUnits.length} Gayrimenkul Listeleniyor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Gayrimenkul / Şantiye</th>
                    <th className="p-4 border-b border-slate-100">Kat / Tip / Mülkiyet</th>
                    <th className="p-4 border-b border-slate-100">Müşteri</th>
                    <th className="p-4 border-b border-slate-100">İstenen Ücret</th>
                    <th className="p-4 border-b border-slate-100">Satış Tutarı</th>
                    <th className="p-4 border-b border-slate-100">Ödeme Modeli</th>
                    <th className="p-4 border-b border-slate-100 w-64">Tahsilat & Taksit Yaşlandırma Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUnits.map((u) => {
                    const pay = u.payments;
                    const percentPaid = u.salePrice > 0 ? ((pay.totalPaid / u.salePrice) * 100) : 0;
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-extrabold text-slate-900 text-sm">{u.unitNumber}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{u.projectName}</p>
                        </td>

                        <td className="p-4 font-semibold text-slate-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit uppercase font-black">
                              {u.type || "Belirtilmedi"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold mt-1">
                              Kat {u.floorNumber} • {u.ownerType === "MUTEAHHIT" ? "Müteahhit" : "Arsa Sahibi"}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {u.status === "SATILDI" ? (
                            u.customer?.name || "Bilinmiyor"
                          ) : u.status === "REZERVE" ? (
                            <span className="text-amber-500 font-extrabold italic">Rezerve</span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">Boşta (Satılık)</span>
                          )}
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {u.estimatedPrice ? formatCurrency(u.estimatedPrice) : "-"}
                        </td>

                        <td className="p-4 font-extrabold text-slate-900 text-sm">
                          {u.status === "SATILDI" && u.salePrice ? (
                            formatCurrency(u.salePrice)
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="p-4">
                          {u.status === "SATILDI" ? (
                            pay.isInstallment ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50 border border-purple-150 text-purple-700 text-[10px] font-bold">
                                Taksitli Satış
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] font-bold">
                                Peşin Satış
                              </span>
                            )
                          ) : u.status === "REZERVE" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-150 text-amber-700 text-[10px] font-bold">
                              Rezerve
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                              Satış Bekliyor
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {u.status === "SATILDI" ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                                <span>Tahsilat: {percentPaid.toFixed(0)}%</span>
                                <span className="font-extrabold text-slate-800">{formatCurrency(pay.totalPaid)}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    percentPaid >= 100 ? "bg-emerald-500" : "bg-indigo-600"
                                  }`} 
                                  style={{ width: `${percentPaid}%` }}
                                ></div>
                              </div>
                              
                              {pay.isInstallment && (
                                <div className="flex flex-col gap-1 mt-1 text-[9px] font-semibold leading-none pt-1 border-t border-slate-50">
                                  {pay.totalOverdue > 0 && (
                                    <span className="text-red-600 font-extrabold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></span>
                                      Vadesi Geçen: {formatCurrency(pay.totalOverdue)} (Ödenmedi)
                                    </span>
                                  )}
                                  {pay.totalFuture > 0 && (
                                    <span className="text-blue-600 font-extrabold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                      Vadesi Var: {formatCurrency(pay.totalFuture)} (Gelecek Vade)
                                    </span>
                                  )}
                                  {pay.totalOverdue === 0 && pay.totalFuture === 0 && (
                                    <span className="text-green-600 font-extrabold flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                      Tüm Taksitler Ödendi
                                    </span>
                                  )}
                                </div>
                              )}
                              {!pay.isInstallment && (
                                <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  Peşinat Kapatıldı
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Tahsilat Yok</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-500 font-bold">
                        Arama kriterlerine uygun gayrimenkul kaydı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- BEKLEYEN TEKİL TAKSİTLER RAPORU (YENİ!) --- */}
      {activeTab === "INSTALLMENTS" && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
            <div className="premium-card p-6 border-l-4 border-l-indigo-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Toplam Alacak</p>
                  <p className="text-2xl font-black text-slate-900 mt-2 truncate max-w-[170px]">{formatCurrency(totalPendingInstallmentsAmount)}</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Coins size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">Toplam {filteredInstallments.length} adet bekleyen senet/taksit</p>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-red-500 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gecikmiş / Günü Geçmiş</p>
                  <p className="text-2xl font-black text-red-600 mt-2 truncate max-w-[170px]">{formatCurrency(totalOverdueInstallmentsAmount)}</p>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-red-600 mt-3 font-bold">{filteredInstallments.filter(inst => inst.isOverdue).length} adet taksidin günü geçmiş</p>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vadesi Gelmemiş</p>
                  <p className="text-2xl font-black text-blue-600 mt-2 truncate max-w-[170px]">{formatCurrency(totalFutureInstallmentsAmount)}</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">{filteredInstallments.filter(inst => !inst.isOverdue).length} adet taksidin vadesi var</p>
            </div>

            <div className="premium-card p-6 border-l-4 border-l-slate-900 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Taksit Sayısı</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{filteredInstallments.length} Adet</p>
                </div>
                <div className="p-2 bg-slate-50 text-slate-700 rounded-xl">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">Tüm açık taksit senetleri</p>
            </div>
          </div>

          {/* Bekleyen Taksitler Tablosu */}
          <div className="premium-card bg-white overflow-hidden shadow-sm animate-in slide-in-from-right-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Clock className="text-slate-600" size={18} />
                Bekleyen Taksit Tahsilatları Detaylı Yaşlandırma Listesi
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full w-fit">
                {filteredInstallments.length} Açık Taksit Listeleniyor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Gayrimenkul / Proje</th>
                    <th className="p-4 border-b border-slate-100">Alıcı (Müşteri)</th>
                    <th className="p-4 border-b border-slate-100">Vade Tarihi</th>
                    <th className="p-4 border-b border-slate-100">Durum / Kalan Süre</th>
                    <th className="p-4 border-b border-slate-100 text-right">Taksit Tutarı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInstallments.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 text-sm">{inst.unitNumber}</p>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">{inst.projectName}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900">{inst.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{inst.customerPhone}</p>
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        {formatDate(inst.dueDate)}
                      </td>
                      <td className="p-4">
                        {inst.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-150 text-red-700 text-[10px] font-black uppercase tracking-wider">
                            Günü Geçmiş • {inst.diffDays} Gün Gecikti
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-150 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                            Vadesi Gelmedi • {inst.diffDays} Gün Kaldı
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(inst.amount)}
                      </td>
                    </tr>
                  ))}

                  {filteredInstallments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-500 font-bold">
                        Arama kriterlerine uygun bekleyen taksit bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- ŞANTİYE GİDERLERİ RAPORU (YENİ!) --- */}
      {activeTab === "SITE_EXPENSES" && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
            <div className="premium-card p-6 border-l-4 border-l-red-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Şantiye Gideri</p>
                  <p className="text-3xl font-black text-slate-900 mt-2 truncate max-w-[200px]">{formatCurrency(totalSiteExpenses)}</p>
                </div>
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">Tüm projelerdeki harcamalar</p>
            </div>
            
            <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gider Kalemi Sayısı</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{filteredExpenses.length} Adet</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">İşlenmiş toplam fiş/fatura sayısı</p>
            </div>
            
            <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-white shadow-sm hover:shadow transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Proje Sayısı</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{Object.keys(expenseProjectGroups).length} Şantiye</p>
                </div>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Building2 size={20} />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-3">Gider kaydedilen projeler</p>
            </div>
          </div>

          {/* Detaylı Gider Kalemleri Tablosu */}
          <div className="premium-card bg-white overflow-hidden shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <FileText className="text-slate-600" size={18} />
                {selectedExpenseProjectName} - Detaylı Gider Kalemleri
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full w-fit">
                {filteredExpenses.length} Gider Listeleniyor
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Tarih</th>
                    <th className="p-4 border-b border-slate-100">Kategori / Alt Kategori</th>
                    <th className="p-4 border-b border-slate-100">Açıklama</th>
                    <th className="p-4 border-b border-slate-100">Ödeyen Taraf</th>
                    <th className="p-4 border-b border-slate-100 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-800">
                            {exp.category?.name || exp.categoryName || "Diğer"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {exp.subCategory?.name || exp.subCategoryName || "Genel"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {exp.description || "-"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {exp.paidBy === "ORTAK" ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            🤝 Ortak Ödedi
                          </span>
                        ) : exp.paidBy === "ORTAK_KASA" ? (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            💰 Ortak Kasa
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-extrabold flex items-center gap-1 w-fit">
                            🏢 Bizim Kasa
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-500 font-bold">
                        Arama kriterlerine uygun şantiye gideri bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- EMLAKÇI KOMİSYON RAPORU --- */}
      {activeTab === "AGENT" && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
            <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seçili Dönem Toplam Komisyon</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(totalCommission)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">Toplam {filteredCommissionRecords.length} adet işlem</p>
            </div>
            <div className="premium-card p-6 border-l-4 border-l-green-600 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ödenen Komisyonlar</p>
              <p className="text-3xl font-black text-green-600 mt-2">{formatCurrency(totalPaid)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">% {totalCommission > 0 ? ((totalPaid / totalCommission) * 100).toFixed(1) : 0} tamamlandı</p>
            </div>
            <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Ödemeler</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{formatCurrency(totalPending)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">İşlem sırası bekleyen hakedişler</p>
            </div>
          </div>

          {/* Detaylı Tablo */}
          <div className="premium-card bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                Emlakçı / Temsilci Bazlı Detaylı Komisyon Raporu
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {Object.entries(agentGroups).map(([agent, data]: [string, any]) => (
                <div key={agent} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-black text-lg">
                        {agent.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">{agent}</h4>
                        <p className="text-[10px] font-bold text-slate-500">Toplam {data.count} satış işleminden komisyon alacağı</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Toplam Komisyon</p>
                      <p className="font-black text-base sm:text-lg text-slate-900">{formatCurrency(data.total)}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Proje Dağılımı</p>
                    <div className="space-y-3">
                      {Object.entries(data.projects).map(([proj, amount]: [string, any]) => (
                        <div key={proj} className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-2">
                            <Building2 size={14} className="text-slate-400" />
                            {proj}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 font-bold text-[10px]">% {((amount / data.total) * 100).toFixed(1)}</span>
                            <span className="font-black text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {Object.keys(agentGroups).length === 0 && (
                <div className="text-center py-12 text-slate-500 font-bold">
                  Bu döneme ait herhangi bir komisyon kaydı bulunmamaktadır.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- PROJE KOMİSYON RAPORU --- */}
      {activeTab === "PROJECT" && (
        <>
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:hidden">
            <div className="premium-card p-6 border-l-4 border-l-indigo-600 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seçili Dönem Toplam Komisyon</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{formatCurrency(totalCommission)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">Toplam {filteredCommissionRecords.length} adet işlem</p>
            </div>
            <div className="premium-card p-6 border-l-4 border-l-green-600 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ödenen Komisyonlar</p>
              <p className="text-3xl font-black text-green-600 mt-2">{formatCurrency(totalPaid)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">% {totalCommission > 0 ? ((totalPaid / totalCommission) * 100).toFixed(1) : 0} tamamlandı</p>
            </div>
            <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-white">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bekleyen Ödemeler</p>
              <p className="text-3xl font-black text-amber-600 mt-2">{formatCurrency(totalPending)}</p>
              <p className="text-xs font-bold text-slate-500 mt-2">İşlem sırası bekleyen hakedişler</p>
            </div>
          </div>

          {/* Detaylı Tablo */}
          <div className="premium-card bg-white overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                İnşaat Projesi Bazlı Detaylı Komisyon Raporu
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {Object.entries(projectGroups).map(([project, data]: [string, any]) => (
                <div key={project} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-black text-lg">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">{project}</h4>
                        <p className="text-[10px] font-bold text-slate-500">Toplam {data.count} aracılı satış</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proje Toplam Komisyon Gideri</p>
                      <p className="font-black text-base sm:text-lg text-red-600">{formatCurrency(data.total)}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Emlakçı Dağılımı</p>
                    <div className="space-y-3">
                      {Object.entries(data.agents).map(([agent, amount]: [string, any]) => (
                        <div key={agent} className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-2">
                            <Users size={14} className="text-slate-400" />
                            {agent}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500 font-bold text-[10px]">% {((amount / data.total) * 100).toFixed(1)}</span>
                            <span className="font-black text-slate-900">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {Object.keys(projectGroups).length === 0 && (
                <div className="text-center py-12 text-slate-500 font-bold">
                  Bu döneme ait herhangi bir komisyon kaydı bulunmamaktadır.
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
