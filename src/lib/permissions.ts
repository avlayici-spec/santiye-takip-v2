// Uygulama modülleri ve izin yapısı

export type PermissionKey =
  | "santiyeler_goruntule" | "santiyeler_duzenle"
  | "projeler_goruntule" | "projeler_duzenle"
  | "giderler_goruntule" | "giderler_duzenle"
  | "taseron_goruntule"  | "taseron_duzenle" | "hakedis_onay"
  | "satislar_goruntule" | "satislar_duzenle"
  | "analiz_goruntule"
  | "raporlar_goruntule"
  | "ofis_goruntule"     | "ofis_duzenle"
  | "ayarlar_goruntule"  | "ayarlar_duzenle"
  | "finans_goruntule";

export type Permissions = Partial<Record<PermissionKey, boolean>>;

export interface ModuleDef {
  key: string;
  label: string;
  href: string;
  icon: string;
  hasEdit: boolean;
  viewKey: PermissionKey;
  editKey?: PermissionKey;
}

export const MODULES: ModuleDef[] = [
  {
    key: "santiyeler",
    label: "Şantiyeler",
    href: "/santiyeler",
    icon: "Building2",
    hasEdit: true,
    viewKey: "santiyeler_goruntule" as any,
    editKey: "santiyeler_duzenle" as any,
  },
  {
    key: "projeler",
    label: "Bloklar (Projeler)",
    href: "/projeler",
    icon: "Folder",
    hasEdit: true,
    viewKey: "projeler_goruntule",
    editKey: "projeler_duzenle",
  },
  {
    key: "giderler",
    label: "Şantiye Giderleri",
    href: "/giderler",
    icon: "HardHat",
    hasEdit: true,
    viewKey: "giderler_goruntule",
    editKey: "giderler_duzenle",
  },
  {
    key: "taseron",
    label: "Taşeron & Hakediş",
    href: "/taseron",
    icon: "Wrench",
    hasEdit: true,
    viewKey: "taseron_goruntule",
    editKey: "taseron_duzenle",
  },
  {
    key: "satislar",
    label: "Satış & Müşteriler",
    href: "/satislar",
    icon: "Users",
    hasEdit: true,
    viewKey: "satislar_goruntule",
    editKey: "satislar_duzenle",
  },
  {
    key: "analiz",
    label: "Kar/Zarar Analizi",
    href: "/analiz",
    icon: "TrendingUp",
    hasEdit: false,
    viewKey: "analiz_goruntule",
  },
  {
    key: "raporlar",
    label: "Raporlar & Çıktılar",
    href: "/raporlar",
    icon: "FileText",
    hasEdit: false,
    viewKey: "raporlar_goruntule",
  },
  {
    key: "finans",
    label: "Nakit Akışı",
    href: "/finans",
    icon: "Wallet",
    hasEdit: false,
    viewKey: "finans_goruntule" as any,
  },
  {
    key: "ofis",
    label: "Ofis & Personel",
    href: "/ofis",
    icon: "Briefcase",
    hasEdit: true,
    viewKey: "ofis_goruntule",
    editKey: "ofis_duzenle",
  },
  {
    key: "ayarlar",
    label: "Ayarlar",
    href: "/ayarlar",
    icon: "Settings",
    hasEdit: true,
    viewKey: "ayarlar_goruntule",
    editKey: "ayarlar_duzenle",
  },
];

/** Kullanıcının belirtilen izne sahip olup olmadığını kontrol eder */
export function hasPermission(
  isAdmin: boolean,
  permissionsJson: string,
  key: PermissionKey
): boolean {
  if (isAdmin) return true;
  try {
    const perms: Permissions = JSON.parse(permissionsJson || "{}");
    return !!perms[key];
  } catch {
    return false;
  }
}

/** Kullanıcının düzenleme yetkisi var mı? */
export function canEdit(
  isAdmin: boolean,
  permissionsJson: string,
  editKey: PermissionKey
): boolean {
  return hasPermission(isAdmin, permissionsJson, editKey);
}
