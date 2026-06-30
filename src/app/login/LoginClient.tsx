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
    <div className="split-layout">
      {/* Sol Taraf - Kurumsal Marka Alanı */}
      <div className="brand-section">
        <div className="brand-overlay" />
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <Building2 className="brand-icon" size={42} />
          </div>
          <h1 className="brand-title">HIZIR</h1>
          <p className="brand-subtitle">İNŞAAT MÜHENDİSLİK MİMARLIK LTD. ŞTİ.</p>
          <div className="brand-divider" />
          <p className="brand-description">
            Kurumsal Proje Yönetim ve Şantiye Takip Sistemi
          </p>
        </div>
      </div>

      {/* Sağ Taraf - Giriş Formu */}
      <div className="form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>Hoş Geldiniz</h2>
            <p>Lütfen devam etmek için giriş yapın.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Kullanıcı Adı</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Şifre</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="form-footer">
            <p>© 2026 HIZIR İnşaat Mühendislik Mimarlık Ltd. Şti. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Genel Düzen (Split Layout) */
        .split-layout {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #ffffff;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* Sol Taraf - Kurumsal Alan */
        .brand-section {
          flex: 1.25;
          position: relative;
          background-color: #0f172a;
          background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4.5rem;
          overflow: hidden;
        }

        .brand-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.93) 0%, rgba(15, 23, 42, 0.78) 100%);
          z-index: 1;
        }

        .brand-content {
          position: relative;
          z-index: 2;
          max-width: 540px;
        }

        .brand-logo-wrap {
          width: 84px;
          height: 84px;
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.25);
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.25rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 25px rgba(234, 179, 8, 0.15);
        }

        .brand-icon {
          color: #eab308;
        }

        .brand-title {
          font-size: 3.75rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.025em;
          margin: 0 0 0.5rem 0;
        }

        .brand-subtitle {
          font-size: 1.05rem;
          font-weight: 700;
          color: #eab308;
          letter-spacing: 0.12em;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .brand-divider {
          width: 70px;
          height: 4px;
          background: #eab308;
          border-radius: 2px;
          margin-bottom: 2rem;
        }

        .brand-description {
          font-size: 1.25rem;
          color: #94a3b8;
          line-height: 1.6;
          font-weight: 300;
          margin: 0;
        }

        /* Sağ Taraf - Form Alanı */
        .form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 2rem;
        }

        .form-container {
          width: 100%;
          max-width: 440px;
        }

        .form-header {
          margin-bottom: 2.5rem;
        }

        .form-header h2 {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .form-header p {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
          font-weight: 500;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #334155;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          font-size: 1rem;
          color: #0f172a;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-wrapper input:focus {
          background: #ffffff;
          border-color: #eab308;
          box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.15);
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .eye-button {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eye-button:hover {
          color: #475569;
        }

        .error-message {
          background: #fef2f2;
          color: #b91c1c;
          padding: 1rem;
          border-radius: 14px;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1px solid #fecaca;
        }

        .submit-button {
          margin-top: 0.5rem;
          width: 100%;
          padding: 1.125rem;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
        }

        .submit-button:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          margin-top: 3.5rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 500;
        }

        /* Mobil Uyum */
        @media (max-width: 900px) {
          .split-layout {
            flex-direction: column;
          }
          .brand-section {
            padding: 3rem 2rem;
            flex: none;
            min-height: 280px;
          }
          .brand-title {
            font-size: 2.75rem;
          }
          .form-section {
            padding: 2.5rem 1.5rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
