"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  HardHat,
  Users,
  TrendingUp,
  Briefcase,
  Settings,
  X,
  FileText,
  Wrench,
  Shield,
  LogOut,
  UserCog,
  Folder,
  PieChart,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES } from "@/lib/permissions";

const iconMap: Record<string, React.ComponentType<any>> = {
  Building2, HardHat, Wrench, Users, TrendingUp, FileText, Briefcase, Settings, Folder, PieChart, Wallet,
};

type SessionUser = {
  id: string;
  name?: string | null;
  isAdmin: boolean;
  permissions: string;
  username: string;
  jobTitle?: string;
};

export function Sidebar({
  className,
  onClose,
  companyName,
  sessionUser,
}: {
  className?: string;
  onClose?: () => void;
  companyName?: string;
  sessionUser?: SessionUser;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Kullanıcının görebileceği menü öğeleri
  const visibleModules = MODULES.filter((mod) => {
    if (sessionUser?.isAdmin) return true;
    try {
      const perms = JSON.parse(sessionUser?.permissions || "{}");
      return !!perms[mod.viewKey];
    } catch {
      return false;
    }
  });

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0",
        className
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span
            className="font-bold text-lg tracking-tight text-slate-900 truncate max-w-[140px]"
            title={companyName || "İnşaatTakip"}
          >
            {companyName || "İnşaatTakip"}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Menü */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {/* Ana Sayfa her zaman görünür */}
        <Link
          href="/"
          className={cn("sidebar-link", pathname === "/" && "active")}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Ana Sayfa</span>
        </Link>

        {visibleModules.map((mod) => {
          const Icon = iconMap[mod.icon] || Building2;
          const isActive = pathname.startsWith(mod.href);
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={cn("sidebar-link", isActive && "active")}
            >
              <Icon size={20} />
              <span className="font-medium">{mod.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Alt alan */}
      <div className="p-4 border-t border-slate-100 space-y-1">
        {/* Ayarlar */}
        {(sessionUser?.isAdmin ||
          (() => {
            try {
              return JSON.parse(sessionUser?.permissions || "{}")[
                "ayarlar_goruntule"
              ];
            } catch {
              return false;
            }
          })()) && (
          <Link
            href="/ayarlar"
            className={cn(
              "sidebar-link",
              pathname === "/ayarlar" && "active"
            )}
          >
            <Settings size={20} />
            <span className="font-medium">Ayarlar</span>
          </Link>
        )}

        {/* Kullanıcı Yönetimi — sadece admin */}
        {sessionUser?.isAdmin && (
          <Link
            href="/kullanicilar"
            className={cn(
              "sidebar-link",
              pathname === "/kullanicilar" && "active"
            )}
          >
            <UserCog size={20} />
            <span className="font-medium">Kullanıcı Yönetimi</span>
          </Link>
        )}

        {/* Kullanıcı Bilgisi + Çıkış */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: sessionUser?.isAdmin
                  ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
                  : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {sessionUser?.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-slate-800 truncate">
                {sessionUser?.name || sessionUser?.username}
              </div>
              <div className="flex items-center gap-1">
                {sessionUser?.isAdmin ? (
                  <>
                    <Shield size={10} className="text-violet-600" />
                    <span className="text-xs text-violet-600 font-medium">
                      Yönetici
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 truncate">
                    {sessionUser?.jobTitle || "Kullanıcı"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>
        </div>
      </div>
    </aside>
  );
}
