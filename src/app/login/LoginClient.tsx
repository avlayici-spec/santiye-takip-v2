"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, LogIn, Lock, User } from "lucide-react";

export function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Kullanıcı adı veya şifre hatalı.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-glow" />
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Building2 size={32} className="text-white" />
          </div>
        </div>

        <h1 className="login-title">İnşaatTakip</h1>
        <p className="login-subtitle">Sisteme giriş yapın</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Kullanıcı Adı */}
          <div className="login-field">
            <label className="login-label">Kullanıcı Adı</label>
            <div className="login-input-wrap">
              <User size={16} className="login-input-icon" />
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullanici.adi"
                className="login-input"
                required
              />
            </div>
          </div>

          {/* Şifre */}
          <div className="login-field">
            <label className="login-label">Şifre</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input login-input-pw"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="login-footer">
          İnşaat Yönetim Sistemi © 2026
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }
        .login-bg-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .login-card {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          position: relative;
          box-shadow: 0 25px 50px rgba(0,0,0,0.4);
        }
        .login-logo {
          margin-bottom: 1rem;
        }
        .login-logo-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(59,130,246,0.4);
        }
        .login-title {
          color: #f1f5f9;
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0 0 0.25rem;
          letter-spacing: -0.03em;
        }
        .login-subtitle {
          color: #94a3b8;
          font-size: 0.9rem;
          margin: 0 0 2rem;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .login-label {
          color: #cbd5e1;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #64748b;
          pointer-events: none;
        }
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 0.75rem 0.75rem 0.75rem 2.75rem;
          color: #f1f5f9;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .login-input::placeholder { color: #475569; }
        .login-input:focus {
          border-color: #3b82f6;
          background: rgba(59,130,246,0.08);
        }
        .login-input-pw { padding-right: 3rem; }
        .login-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .login-eye-btn:hover { color: #94a3b8; }
        .login-error {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 0.65rem 1rem;
          color: #fca5a5;
          font-size: 0.875rem;
          text-align: center;
        }
        .login-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 16px rgba(59,130,246,0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(59,130,246,0.45);
        }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .login-footer {
          color: #475569;
          font-size: 0.78rem;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}
