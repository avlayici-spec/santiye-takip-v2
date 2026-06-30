"use client";

import { useState } from "react";
import {
  Users, Plus, Edit2, Trash2, Eye, EyeOff, Shield,
  ShieldOff, Power, PowerOff, X, Save, Check,
} from "lucide-react";
import {
  createUser, updateUser, deleteUser, toggleUserActive,
} from "@/app/actions/users";
import { MODULES } from "@/lib/permissions";

type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  jobTitle: string | null;
  isAdmin: boolean;
  isActive: boolean;
  permissions: string;
  lastLogin: Date | null;
  createdAt: Date;
};

type FormData = {
  name: string;
  username: string;
  password: string;
  jobTitle: string;
  isAdmin: boolean;
  permissions: Record<string, boolean>;
};

const defaultForm = (): FormData => ({
  name: "",
  username: "",
  password: "",
  jobTitle: "",
  isAdmin: false,
  permissions: {},
});

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm());
  const [visiblePws, setVisiblePws] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingUser(null);
    setForm(defaultForm());
    setError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    let perms: Record<string, boolean> = {};
    try { perms = JSON.parse(u.permissions || "{}"); } catch {}
    setForm({
      name: u.name,
      username: u.username,
      password: "", // Do not load hashed password into the edit form
      jobTitle: u.jobTitle || "",
      isAdmin: u.isAdmin,
      permissions: perms,
    });
    setError("");
    setShowModal(true);
  }

  function setPerm(key: string, checked: boolean) {
    setForm((prev) => {
      const perms = { ...prev.permissions };
      perms[key] = checked;
      // Görüntüle kapatılınca düzenle de kapansın
      if (!checked && key.endsWith("_goruntule")) {
        const editKey = key.replace("_goruntule", "_duzenle");
        perms[editKey] = false;
      }
      // Düzenle açılınca görüntüle de açılsın
      if (checked && key.endsWith("_duzenle")) {
        const viewKey = key.replace("_duzenle", "_goruntule");
        perms[viewKey] = true;
      }
      return { ...prev, permissions: perms };
    });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.username.trim() || (!editingUser && !form.password.trim())) {
      setError(editingUser ? "Ad ve kullanıcı adı zorunludur." : "Ad, kullanıcı adı ve şifre zorunludur.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      jobTitle: form.jobTitle.trim() || undefined,
      isAdmin: form.isAdmin,
      permissions: JSON.stringify(form.permissions),
    };

    let res;
    if (editingUser) {
      res = await updateUser(editingUser.id, payload);
    } else {
      res = await createUser(payload);
    }

    setSaving(false);
    if (!res.success) {
      setError(res.error || "Bir hata oluştu.");
    } else {
      setShowModal(false);
      // Listeyi yenile
      window.location.reload();
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(`"${u.name}" kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    const res = await deleteUser(u.id);
    if (!res.success) { alert(res.error); return; }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  async function handleToggleActive(u: User) {
    await toggleUserActive(u.id);
    setUsers((prev) =>
      prev.map((x) => x.id === u.id ? { ...x, isActive: !x.isActive } : x)
    );
  }

  function togglePwVisible(id: string) {
    setVisiblePws((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Başlık */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="text-white" size={20} />
            </div>
            Kullanıcı Yönetimi
          </h1>
          <p className="page-subtitle">Sisteme erişecek kullanıcıları tanımlayın ve yetkilendirin</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5">
          <Plus size={18} /> Yeni Kullanıcı Ekle
        </button>
      </div>

      {/* Kullanıcı Kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
        {users.map((u) => {
          let perms: Record<string, boolean> = {};
          try { perms = JSON.parse(u.permissions || "{}"); } catch {}
          const accessibleModules = MODULES.filter((m) => u.isAdmin || perms[m.viewKey]);

          return (
            <div key={u.id} className="card" style={{ opacity: u.isActive ? 1 : 0.6 }}>
              {/* Kart Başlık */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: u.isAdmin ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "linear-gradient(135deg,#0ea5e9,#2563eb)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.1rem", fontWeight: 700, color: "white"
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>{u.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>@{u.username}</div>
                    {u.jobTitle && <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>{u.jobTitle}</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {u.isAdmin ? (
                    <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 8, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <Shield size={11} /> YÖNETİCİ
                    </span>
                  ) : (
                    <span style={{ background: "#f0fdf4", color: "#16a34a", borderRadius: 8, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700 }}>
                      KULLANICI
                    </span>
                  )}
                  {!u.isActive && (
                    <span style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 700 }}>
                      PASİF
                    </span>
                  )}
                </div>
              </div>



              {/* Erişim */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  Erişim ({u.isAdmin ? "Tüm Modüller" : `${accessibleModules.length}/${MODULES.length} modül`})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {u.isAdmin ? (
                    <span style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600 }}>
                      Tam Yetki
                    </span>
                  ) : accessibleModules.length === 0 ? (
                    <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Erişim yok</span>
                  ) : (
                    accessibleModules.map((m) => (
                      <span key={m.key} style={{
                        background: perms[m.editKey || ""] ? "#dbeafe" : "#f0fdf4",
                        color: perms[m.editKey || ""] ? "#1d4ed8" : "#15803d",
                        borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600
                      }}>
                        {m.label} {perms[m.editKey || ""] ? "(Tam)" : "(Görüntüle)"}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Son giriş */}
              {u.lastLogin && (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.85rem" }}>
                  Son giriş: {new Date(u.lastLogin).toLocaleString("tr-TR")}
                </div>
              )}

              {/* Butonlar */}
              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem" }}>
                <button onClick={() => openEdit(u)} className="btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "0.82rem" }}>
                  <Edit2 size={14} /> Düzenle
                </button>
                <button onClick={() => handleToggleActive(u)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0.45rem 0.75rem", borderRadius: 10, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                  background: u.isActive ? "#fef3c7" : "#d1fae5",
                  color: u.isActive ? "#b45309" : "#065f46",
                  border: "none"
                }}>
                  {u.isActive ? <><PowerOff size={14} /> Pasif Yap</> : <><Power size={14} /> Aktif Yap</>}
                </button>
                <button onClick={() => handleDelete(u)} style={{
                  padding: "0.45rem 0.65rem", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
                  background: "#fef2f2", color: "#dc2626", border: "none", fontWeight: 600
                }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: "white", borderRadius: 20, width: "100%", maxWidth: 640,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
          }}>
            {/* Modal Başlık */}
            <div style={{ padding: "1.5rem 1.75rem 1rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                {editingUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: "1.25rem 1.75rem" }}>
              {/* Temel Bilgiler */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad *</label>
                  <input className="form-input" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ahmet Yılmaz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Görev Tanımı</label>
                  <input className="form-input" value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    placeholder="Şantiye Şefi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kullanıcı Adı *</label>
                  <input className="form-input" value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="ahmet.yilmaz" />
                </div>
                <div className="form-group">
                  <label className="form-label">{editingUser ? "Yeni Şifre" : "Şifre *"}</label>
                  <input 
                    type="password"
                    className="form-input" 
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingUser ? "Değiştirmek istemiyorsanız boş bırakın" : "Şifre girin"}
                    required={!editingUser} 
                  />
                </div>
              </div>

              {/* Admin Toggle */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem",
                background: form.isAdmin ? "#f5f3ff" : "#f8fafc", borderRadius: 12, marginBottom: "1.25rem",
                border: `1px solid ${form.isAdmin ? "#ddd6fe" : "#e2e8f0"}`, cursor: "pointer"
              }} onClick={() => setForm({ ...form, isAdmin: !form.isAdmin })}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: form.isAdmin ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {form.isAdmin ? <Shield size={20} color="white" /> : <ShieldOff size={20} color="#94a3b8" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: form.isAdmin ? "#4f46e5" : "#64748b" }}>
                    {form.isAdmin ? "Yönetici (Admin)" : "Normal Kullanıcı"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    {form.isAdmin ? "Tüm modüllere tam erişim, kullanıcı yönetimi" : "Yetki tablosuyla özelleştirilmiş erişim"}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.isAdmin ? "#7c3aed" : "#cbd5e1",
                    position: "relative", transition: "background 0.2s"
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: form.isAdmin ? 23 : 3,
                      width: 18, height: 18, borderRadius: "50%", background: "white",
                      transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
                    }} />
                  </div>
                </div>
              </div>

              {/* İzin Tablosu — Sadece admin değilse göster */}
              {!form.isAdmin && (
                <div>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Modül Erişim İzinleri
                  </h3>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                    {/* Tablo Başlığı */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px", background: "#f8fafc", padding: "0.65rem 1rem", borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Modül</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Görüntüle</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Düzenle</div>
                    </div>

                    {MODULES.map((mod, i) => (
                      <div key={mod.key} style={{
                        display: "grid", gridTemplateColumns: "1fr 110px 110px",
                        padding: "0.75rem 1rem", alignItems: "center",
                        borderBottom: i < MODULES.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: form.permissions[mod.viewKey] ? "#fafeff" : "white"
                      }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#374151" }}>
                          {mod.label}
                        </div>
                        {/* Görüntüle checkbox */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <button
                            type="button"
                            onClick={() => setPerm(mod.viewKey, !form.permissions[mod.viewKey])}
                            style={{
                              width: 26, height: 26, borderRadius: 7,
                              border: `2px solid ${form.permissions[mod.viewKey] ? "#3b82f6" : "#cbd5e1"}`,
                              background: form.permissions[mod.viewKey] ? "#3b82f6" : "white",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.15s"
                            }}
                          >
                            {form.permissions[mod.viewKey] && <Check size={14} color="white" strokeWidth={3} />}
                          </button>
                        </div>
                        {/* Düzenle checkbox */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          {mod.hasEdit ? (
                            <button
                              type="button"
                              onClick={() => mod.editKey && setPerm(mod.editKey, !form.permissions[mod.editKey || ""])}
                              disabled={!form.permissions[mod.viewKey]}
                              style={{
                                width: 26, height: 26, borderRadius: 7,
                                border: `2px solid ${form.permissions[mod.editKey || ""] ? "#10b981" : "#cbd5e1"}`,
                                background: form.permissions[mod.editKey || ""] ? "#10b981" : "white",
                                cursor: form.permissions[mod.viewKey] ? "pointer" : "not-allowed",
                                opacity: form.permissions[mod.viewKey] ? 1 : 0.4,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s"
                              }}
                            >
                              {form.permissions[mod.editKey || ""] && <Check size={14} color="white" strokeWidth={3} />}
                            </button>
                          ) : (
                            <span style={{ fontSize: "1rem", color: "#cbd5e1" }}>—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} /> Görüntüleme yetkisi
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: "#10b981" }} /> Ekleme/Düzenleme/Silme yetkisi
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "0.65rem 1rem", color: "#dc2626", fontSize: "0.875rem", marginTop: "1rem" }}>
                  {error}
                </div>
              )}

              {/* Kaydet */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  <X size={16} /> İptal
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {saving ? <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> : <Save size={16} />}
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
