"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  Users, 
  Receipt, 
  Plus, 
  Building2, 
  Wallet,
  Calendar,
  Banknote,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Printer
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PersonnelForm } from "@/components/office/PersonnelForm";
import { OfficeExpenseForm } from "@/components/office/OfficeExpenseForm";
import { createStaff, updateStaff, deleteStaff, bulkGenerateAccruals } from "@/app/actions/staff";
import { createExpense, updateExpense, deleteExpense } from "@/app/actions/expense";

export default function ClientPage({
  initialPersonnel,
  initialOfficeExpenses,
  categories
}: {
  initialPersonnel: any[],
  initialOfficeExpenses: any[],
  categories: any[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"PERSONNEL" | "EXPENSES" | "PAYROLL">("PERSONNEL");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "PAYROLL") {
      setActiveTab("PAYROLL");
    } else if (tabParam === "EXPENSES") {
      setActiveTab("EXPENSES");
    }
  }, [searchParams]);
  
  const [personnel, setPersonnel] = useState(initialPersonnel);
  const [expenses, setExpenses] = useState(initialOfficeExpenses);

  // Sync state with server-side props after revalidation
  useEffect(() => {
    setPersonnel(initialPersonnel);
  }, [initialPersonnel]);

  useEffect(() => {
    setExpenses(initialOfficeExpenses);
  }, [initialOfficeExpenses]);

  const [isPersonnelFormOpen, setIsPersonnelFormOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);

  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [subTabs, setSubTabs] = useState<Record<string, "SUMMARY" | "LEDGER">>({});

  const [selectedAccrualPeriod, setSelectedAccrualPeriod] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [generatingAccrual, setGeneratingAccrual] = useState(false);
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  const handleRunAccrual = async () => {
    setGeneratingAccrual(true);
    const res = await bulkGenerateAccruals(selectedAccrualPeriod);
    setGeneratingAccrual(false);
    if (res.success) {
      alert(`${res.createdCount} personelin ${selectedAccrualPeriod} dönemi tahakkuk kaydı oluşturuldu!`);
      router.refresh();
    } else {
      alert(res.error || "Tahakkuk kaydı oluşturulurken hata oluştu.");
    }
  };

  const handleSavePersonnel = async (data: any) => {
    if (editingPersonnel) {
      const res = await updateStaff(editingPersonnel.id, data);
      if (res.success) {
        router.refresh();
      }
    } else {
      const res = await createStaff(data);
      if (res.success) {
        router.refresh();
      }
    }
    setIsPersonnelFormOpen(false);
    setEditingPersonnel(null);
  };

  const [editingExpense, setEditingExpense] = useState<any>(null);

  const handleSaveExpense = async (data: any) => {
    if (editingExpense) {
      const res = await updateExpense(editingExpense.id, {
        ...data,
        expenseType: "OFIS"
      });
      if (res.success) {
        router.refresh();
      }
    } else {
      const res = await createExpense({
        ...data,
        expenseType: "OFIS"
      });
      if (res.success) {
        router.refresh();
      }
    }
    setIsExpenseFormOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Bu ofis giderini silmek istediğinize emin misiniz?")) {
      const res = await deleteExpense(id);
      if (res.success) {
        router.refresh();
      } else {
        alert("Gider silinirken hata oluştu.");
      }
    }
  };

  const handlePrintLedger = (p: any, ledgerWithBalance: any[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup engelleyiciyi kaldırıp tekrar deneyiniz.");
      return;
    }
    
    const formatCurrencyLocal = (val: number) => {
      return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
    };
    
    const formatDateLocal = (date: any) => {
      const d = new Date(date);
      return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(d);
    };

    const rows = ledgerWithBalance.map(entry => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${formatDateLocal(entry.date)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background-color: ${entry.isDebit ? '#fef3c7' : '#d1fae5'}; color: ${entry.isDebit ? '#b45309' : '#047857'}; border: 1px solid ${entry.isDebit ? '#fde68a' : '#a7f3d0'};">
            ${entry.isDebit ? 'Tahakkuk' : 'Ödeme'}
          </span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">${entry.description}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 11px; color: #0f172a;">
          ${entry.isDebit ? formatCurrencyLocal(entry.amount) : "-"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 11px; color: #059669;">
          ${!entry.isDebit ? formatCurrencyLocal(entry.amount) : "-"}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; font-size: 11px; color: #0f172a;">
          ${formatCurrencyLocal(entry.balance)}
        </td>
      </tr>
    `).join("");

    const htmlContent = `
      <html>
        <head>
          <title>${p.firstName} ${p.lastName} - Cari Hesap Ekstresi</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
            body { font-family: 'Outfit', sans-serif; color: #1e293b; padding: 40px; margin: 0; background-color: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 35px; }
            .header-left h1 { margin: 0; font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .header-left p { margin: 5px 0 0 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
            .header-right { text-align: right; }
            .header-right h2 { margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-right p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 35px; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
            .info-item { font-size: 13px; line-height: 1.6; color: #475569; }
            .info-item strong { color: #0f172a; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; }
            th { padding: 14px 10px; text-align: left; background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 25px; font-weight: 500; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h1>İNŞAAT TAKİP SİSTEMİ</h1>
              <p>Personel Cari Hesap Ekstresi</p>
            </div>
            <div class="header-right">
              <h2>Maaş & Tahakkuk Dökümü</h2>
              <p>Yazdırma Tarihi: ${new Date().toLocaleDateString("tr-TR")}</p>
            </div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <strong>Personel Adı Soyadı:</strong> ${p.firstName} ${p.lastName}<br/>
              <strong>Görevi / Unvanı:</strong> ${p.title || "Çalışan"}<br/>
              <strong>Telefon No:</strong> ${p.phone || "-"}
            </div>
            <div class="info-item" style="text-align: right;">
              <strong>İşe Giriş Tarihi:</strong> ${p.startDate ? formatDateLocal(p.startDate) : "-"}<br/>
              ${p.endDate ? `<strong>İşten Çıkış Tarihi:</strong> ${formatDateLocal(p.endDate)}<br/>` : ""}
              <strong style="font-size: 14px; color: #ef4444;">Net Maaş Borç Bakiyesi:</strong> <span style="font-size: 14px; font-weight: 900; color: #ef4444;">${formatCurrencyLocal(ledgerWithBalance[ledgerWithBalance.length - 1]?.balance || 0)}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Tarih</th>
                <th style="width: 15%;">İşlem Türü</th>
                <th style="width: 30%;">Açıklama</th>
                <th style="width: 15%; text-align: right;">Tahakkuk (Alacak)</th>
                <th style="width: 15%; text-align: right;">Ödenen (Borç Kapatma)</th>
                <th style="width: 10%; text-align: right;">Kalan Bakiye</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <div class="footer">
            Bu cari hesap ekstresi İnşaat Takip Sistemi tarafından dijital olarak üretilmiştir.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const totalMonthlyPayroll = personnel.reduce((sum, p) => sum + p.salary, 0);
  const totalOfficeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="text-slate-900 w-8 h-8" />
            Ofis & Personel
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Ofis çalışanlarınızı, maaşları ve şirketin genel (dağıtılabilir) maliyetlerini yönetin.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setEditingPersonnel(null); setIsPersonnelFormOpen(true); }}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus size={18} />
            Personel Ekle
          </button>
          <button 
            onClick={() => { setEditingExpense(null); setIsExpenseFormOpen(true); }}
            className="bg-red-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
          >
            <Plus size={18} />
            Ofis Gideri İşle
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("PERSONNEL")}
          className={`px-6 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "PERSONNEL"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={18} />
          Personel Yönetimi
        </button>
        <button
          onClick={() => setActiveTab("EXPENSES")}
          className={`px-6 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "EXPENSES"
              ? "bg-white text-red-700 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Receipt size={18} />
          Genel Giderler (Dağıtılabilir)
        </button>
        <button
          onClick={() => setActiveTab("PAYROLL")}
          className={`px-6 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "PAYROLL"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Banknote size={18} />
          Maaş & Tahakkuk Takibi
        </button>
      </div>

      {activeTab === "PERSONNEL" && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="premium-card p-6 border-l-4 border-l-blue-600 bg-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif Çalışan Sayısı</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{personnel.length} <span className="text-sm text-slate-500">Kişi</span></p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
            </div>
            <div className="premium-card p-6 border-l-4 border-l-amber-500 bg-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Tahmini Net Maaş Yükü</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{formatCurrency(totalMonthlyPayroll)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Wallet size={24}/></div>
            </div>
          </div>

          <div className="premium-card bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm">Personel Listesi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Personel</th>
                    <th className="p-4 border-b border-slate-100">İletişim</th>
                    <th className="p-4 border-b border-slate-100">Aylık Net Maaş</th>
                    <th className="p-4 border-b border-slate-100 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {personnel.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {p.firstName.charAt(0)}{p.lastName?.charAt(0) || ""}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                              {p.endDate && (
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 text-[9px] font-black border border-red-100 rounded">AYRILDI</span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{p.title}</p>
                            <div className="text-[9px] text-slate-400 font-bold mt-1">
                              Giriş: {formatDate(p.startDate)}
                              {p.endDate && ` | Çıkış: ${formatDate(p.endDate)}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {p.phone} <br/> <span className="text-slate-400 font-medium">{p.address}</span>
                      </td>
                      <td className="p-4 font-black text-slate-900">{formatCurrency(p.salary)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => {setEditingPersonnel(p); setIsPersonnelFormOpen(true);}} className="text-blue-600 font-bold text-xs hover:underline">Düzenle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "EXPENSES" && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          
          <div className="premium-card p-6 border-l-4 border-l-red-600 bg-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıtlı Toplam Merkez Gideri (Şantiyelere Dağıtılacak Yük)</p>
              <p className="text-3xl font-black text-red-600 mt-1">{formatCurrency(totalOfficeExpenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><Building2 size={24}/></div>
          </div>

          <div className="premium-card bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                <Receipt size={16} className="text-slate-500"/>
                Ofis Genel Gider Hareketleri
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="p-4 border-b border-slate-100">Tarih</th>
                    <th className="p-4 border-b border-slate-100">Kategori / Alt Kategori</th>
                    <th className="p-4 border-b border-slate-100">Tutar</th>
                    <th className="p-4 border-b border-slate-100">Açıklama</th>
                    <th className="p-4 border-b border-slate-100 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Calendar size={14}/> {formatDate(e.date)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="w-fit px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                            {e.categoryName || "Ofis Gideri"}
                          </span>
                          {e.subCategoryName && (
                            <span className="w-fit px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase tracking-wide border border-blue-100">
                              {e.subCategoryName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-black text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {e.description && (
                            <p className="text-xs text-slate-700 font-semibold truncate" title={e.description}>
                              {e.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {e.documentNo && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black border border-slate-200 whitespace-nowrap" title="Fiş/Belge No">
                                🧾 {e.documentNo}
                              </span>
                            )}
                            {e.supplier && (
                              <span className="text-[10px] bg-amber-50/70 text-amber-800 px-1.5 py-0.5 rounded font-bold border border-amber-100/50 whitespace-nowrap" title="Kimden Alındı / Satıcı">
                                🏢 {e.supplier}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => { setEditingExpense(e); setIsExpenseFormOpen(true); }} 
                          className="text-blue-600 font-bold text-xs hover:underline"
                        >
                          Düzenle
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(e.id)} 
                          className="text-red-600 font-bold text-xs hover:underline ml-2"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "PAYROLL" && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          
          {/* Top Panel: Accrual Period Generation Tool */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Activity size={24} className="text-emerald-400 animate-pulse" />
                Dönem Maaş & Prim Tahakkuku Başlat
              </h2>
              <p className="text-emerald-100 text-sm max-w-xl font-semibold">
                Her ay için personellerin hak ettiği net maaş ve SGK prim borçlarını sisteme tahakkuk ettirerek cari borç kaydı oluşturun. Ödemeler yapıldıkça bu borçtan düşülecektir.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center bg-white/10 p-4 rounded-2xl border border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 block">Dönem Seçin</span>
                <select
                  className="bg-slate-900 text-white font-bold rounded-xl px-4 py-2 text-sm border-0 focus:ring-2 focus:ring-emerald-500"
                  value={selectedAccrualPeriod}
                  onChange={(e) => setSelectedAccrualPeriod(e.target.value)}
                >
                  {/* Last 6 months and next 2 months for flexibilities */}
                  {(() => {
                    const periods = [];
                    const d = new Date();
                    d.setMonth(d.getMonth() + 2); // Start from 2 months ahead
                    for (let i = 0; i < 12; i++) {
                      const yr = d.getFullYear();
                      const mn = String(d.getMonth() + 1).padStart(2, "0");
                      periods.push(`${yr}-${mn}`);
                      d.setMonth(d.getMonth() - 1);
                    }
                    return periods;
                  })().map(p => (
                    <option key={p} value={p}>
                      {(() => {
                        const [year, month] = p.split("-");
                        const monthNames = [
                          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
                        ];
                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                      })()}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                disabled={generatingAccrual}
                onClick={handleRunAccrual}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black px-6 py-3 rounded-xl transition-all flex items-center gap-2 text-sm mt-2 sm:mt-0 shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <CheckCircle size={18} />
                {generatingAccrual ? "Oluşturuluyor..." : "Tahakkukları Başlat"}
              </button>
            </div>
          </div>

          {/* Personnel Accrual & Payments Ledger */}
          <div className="premium-card bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" />
                Personel Tahakkuk ve Ödeme Defteri
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-4">Personel / Görev</th>
                    <th className="p-4">İşe Giriş Tarihi</th>
                    <th className="p-4 text-right">Net Maaş Tahakkuku</th>
                    <th className="p-4 text-right text-emerald-600">Ödenen Net Maaş</th>
                    <th className="p-4 text-right">Kalan Net Maaş Borcu</th>
                    <th className="p-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personnel.map(p => {
                    const accruals = p.accruals || [];
                    const payments = p.payments || [];
                    
                    const totalSalaryAccrued = accruals.reduce((sum: number, a: any) => sum + a.salary, 0);
                    const totalAccrued = totalSalaryAccrued;
                    
                    const totalSalaryPaid = payments.filter((py: any) => py.paymentType === "MAAS").reduce((sum: number, py: any) => sum + py.amount, 0);
                    const totalPaid = totalSalaryPaid;
                    
                    const balance = totalAccrued - totalPaid;
                    const isExpanded = expandedStaffId === p.id;
                    
                    return (
                      <>
                        <tr key={p.id} className="hover:bg-slate-50/30 transition-all font-semibold">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{p.firstName} {p.lastName}</div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">{p.title || "Çalışan"}</div>
                          </td>
                          <td className="p-4 text-xs text-slate-500 font-semibold">
                            <div>Giriş: {p.startDate ? formatDate(p.startDate) : "-"}</div>
                            {p.endDate && <div className="text-red-500 font-bold mt-0.5">Çıkış: {formatDate(p.endDate)}</div>}
                          </td>
                          <td className="p-4 text-right font-black text-slate-800">{formatCurrency(totalSalaryAccrued)}</td>
                          <td className="p-4 text-right font-black text-emerald-600">{formatCurrency(totalSalaryPaid)}</td>
                          <td className="p-4 text-right font-black">
                            <span className={balance > 0 ? "text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100" : "text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100"}>
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setExpandedStaffId(isExpanded ? null : p.id)}
                              className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-1.5"
                            >
                              {isExpanded ? (
                                <>
                                  Kapat <ChevronUp size={16} />
                                </>
                              ) : (
                                <>
                                  Detay <ChevronDown size={16} />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (() => {
                          const activeSubTab = subTabs[p.id] || "SUMMARY";
                          return (
                            <tr key={`${p.id}-expanded`}>
                              <td colSpan={8} className="bg-slate-50/50 p-6 border-y border-slate-100">
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
                                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                                      {p.firstName} {p.lastName} - Maaş & Tahakkuk Detayları
                                    </h4>
                                    
                                    <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                      <button
                                        onClick={() => setSubTabs(prev => ({ ...prev, [p.id]: "SUMMARY" }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          activeSubTab === "SUMMARY" 
                                            ? "bg-white text-slate-900 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-900"
                                        }`}
                                      >
                                        Aylık Özet
                                      </button>
                                      <button
                                        onClick={() => setSubTabs(prev => ({ ...prev, [p.id]: "LEDGER" }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          activeSubTab === "LEDGER" 
                                            ? "bg-white text-slate-900 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-900"
                                        }`}
                                      >
                                        Cari Hesap Ekstresi (Döküm)
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {activeSubTab === "SUMMARY" ? (
                                    accruals.length === 0 ? (
                                      <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                        Bu personel için henüz tahakkuk kaydı oluşturulmamış. Üst kısımdan tahakkuk başlatabilirsiniz!
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-semibold">
                                          <thead>
                                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                              <th className="py-2.5">Dönem</th>
                                              <th className="py-2.5 text-right">Tahakkuk Eden Net Maaş</th>
                                              <th className="py-2.5 text-right text-emerald-600">Ödenen Net Maaş</th>
                                              <th className="py-2.5 text-right">Kalan Dönem Borcu</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {accruals.map((ac: any) => {
                                              const periodPayments = payments.filter((py: any) => py.accrualId === ac.id);
                                              const pSalaryPaid = periodPayments.filter((py: any) => py.paymentType === "MAAS").reduce((sum: number, py: any) => sum + py.amount, 0);
                                              const periodBalance = ac.salary - pSalaryPaid;
                                              
                                              const [yr, mn] = ac.period.split("-");
                                              const mnName = [
                                                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                                                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
                                              ][parseInt(mn) - 1];
                                              
                                              return (
                                                <tr key={ac.id} className="hover:bg-slate-50/50">
                                                  <td className="py-3 font-bold text-slate-800">{mnName} {yr}</td>
                                                  <td className="py-3 text-right font-black text-slate-700">{formatCurrency(ac.salary)}</td>
                                                  <td className="py-3 text-right font-black text-emerald-600">{formatCurrency(pSalaryPaid)}</td>
                                                  <td className="py-3 text-right font-black">
                                                    <span className={periodBalance > 0 ? "text-red-600" : "text-emerald-600"}>
                                                      {formatCurrency(periodBalance)}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )
                                  ) : (
                                    (() => {
                                      const ledgerEntries: any[] = [];
                                      
                                      accruals.forEach((ac: any) => {
                                        const [year, month] = ac.period.split("-").map(Number);
                                        const accrualDate = new Date(year, month - 1, 1);
                                        const monthNames = [
                                          "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                                          "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
                                        ];
                                        ledgerEntries.push({
                                          id: `accrual-${ac.id}`,
                                          date: accrualDate,
                                          type: "TAHAKKUK",
                                          description: `${monthNames[month - 1]} ${year} Maaş Tahakkuku`,
                                          amount: ac.salary,
                                          isDebit: true
                                        });
                                      });
                                      
                                      payments.forEach((py: any) => {
                                        ledgerEntries.push({
                                          id: `payment-${py.id}`,
                                          date: new Date(py.date),
                                          type: py.paymentType || "MAAS",
                                          description: py.description || "Maaş Ödemesi",
                                          amount: py.amount,
                                          isDebit: false
                                        });
                                      });
                                      
                                      ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());
                                      
                                      let runningBalance = 0;
                                      const ledgerWithBalance = ledgerEntries.map(entry => {
                                        if (entry.isDebit) {
                                          runningBalance += entry.amount;
                                        } else {
                                          runningBalance -= entry.amount;
                                        }
                                        return {
                                          ...entry,
                                          balance: runningBalance
                                        };
                                      });
                                      
                                      if (ledgerWithBalance.length === 0) {
                                        return (
                                          <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                            Herhangi bir tahakkuk veya ödeme hareketi bulunamadı.
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                              <FileSpreadsheet size={14} className="text-slate-400" />
                                              Cari Hesap Hareket Dökümü
                                            </span>
                                            <button
                                              onClick={() => handlePrintLedger(p, ledgerWithBalance)}
                                              className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-200 transition-all shadow-sm active:scale-95"
                                            >
                                              <Printer size={14} className="text-slate-500" />
                                              Yazdır / PDF Kaydet
                                            </button>
                                          </div>

                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-semibold">
                                              <thead>
                                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                                                  <th className="p-3">Tarih</th>
                                                  <th className="p-3">İşlem Türü</th>
                                                  <th className="p-3">Açıklama</th>
                                                  <th className="p-3 text-right">Tahakkuk Borcu (Alacak)</th>
                                                  <th className="p-3 text-right text-emerald-600">Ödenen Tutar (Borç Kapatma)</th>
                                                  <th className="p-3 text-right">Kalan Bakiye</th>
                                                </tr>
                                              </thead>
                                            <tbody className="divide-y divide-slate-100">
                                              {ledgerWithBalance.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-slate-50/50">
                                                  <td className="p-3 text-slate-500">{formatDate(entry.date)}</td>
                                                  <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                      entry.isDebit 
                                                        ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                    }`}>
                                                      {entry.isDebit ? "Tahakkuk" : "Ödeme"}
                                                    </span>
                                                  </td>
                                                  <td className="p-3 text-slate-700">{entry.description}</td>
                                                  <td className="p-3 text-right font-bold text-slate-800">
                                                    {entry.isDebit ? formatCurrency(entry.amount) : "-"}
                                                  </td>
                                                  <td className="p-3 text-right font-bold text-emerald-600">
                                                    {!entry.isDebit ? formatCurrency(entry.amount) : "-"}
                                                  </td>
                                                  <td className="p-3 text-right font-black text-slate-900">
                                                    {formatCurrency(entry.balance)}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    );
                                    })()
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isPersonnelFormOpen && (
        <PersonnelForm 
          personnel={editingPersonnel}
          onClose={() => { setIsPersonnelFormOpen(false); setEditingPersonnel(null); }}
          onSave={handleSavePersonnel}
        />
      )}

      {isExpenseFormOpen && (
        <OfficeExpenseForm 
          categories={categories}
          onClose={() => { setIsExpenseFormOpen(false); setEditingExpense(null); }}
          onSave={handleSaveExpense}
          personnel={personnel}
          expense={editingExpense}
        />
      )}

    </div>
  );
}
