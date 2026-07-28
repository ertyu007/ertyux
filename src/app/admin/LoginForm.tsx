"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

import { loginAdmin } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !password) return;

    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin(password);
      if (!result.success) {
        setError(result.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      console.error(requestError);
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <Link href="/" className="admin-login-page__back">
        <ArrowLeft size={16} /> กลับไปเว็บไซต์
      </Link>

      <section className="admin-login-card">
        <div className="admin-login-card__icon">
          <LockKeyhole size={26} />
        </div>

        <h1>Admin Login</h1>
        <p>กรอกรหัสผ่านเพื่อจัดการโปรเจกต์ใน Portfolio</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-password">รหัสผ่าน</label>
          <div className="admin-login-card__input">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              placeholder="กรอกรหัสผ่าน"
              autoComplete="current-password"
              autoFocus
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error ? (
            <div className="admin-login-card__error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="admin-login-card__submit"
            disabled={loading || !password}
          >
            {loading ? (
              <>
                <Loader2 className="admin-login-card__spin" size={18} />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <LockKeyhole size={18} /> เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>
      </section>

      <style jsx>{`
        .admin-login-page,
        .admin-login-page * {
          box-sizing: border-box;
        }

        .admin-login-page {
          min-height: 100svh;
          display: grid;
          place-items: center;
          padding: 72px 18px 32px;
          background: #f5f6f8;
          color: #172033;
          font-family: Arial, Helvetica, sans-serif;
        }

        .admin-login-page__back {
          position: absolute;
          top: 24px;
          left: 24px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #667085;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .admin-login-card {
          width: min(420px, 100%);
          padding: 32px;
          border: 1px solid #d9dee7;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.1);
        }

        .admin-login-card__icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          border-radius: 10px;
          background: #eaf5f8;
          color: #087ea4;
        }

        .admin-login-card h1 {
          margin: 0;
          font-size: 28px;
        }

        .admin-login-card > p {
          margin: 8px 0 24px;
          color: #667085;
          font-size: 14px;
          line-height: 1.5;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        label {
          font-size: 13px;
          font-weight: 700;
        }

        .admin-login-card__input {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 44px;
          align-items: center;
          border: 1px solid #d9dee7;
          border-radius: 8px;
          background: #ffffff;
        }

        .admin-login-card__input:focus-within {
          border-color: #087ea4;
          box-shadow: 0 0 0 3px rgba(8, 126, 164, 0.12);
        }

        .admin-login-card__input input {
          width: 100%;
          min-height: 46px;
          padding: 0 12px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #172033;
          font: inherit;
          font-size: 14px;
        }

        .admin-login-card__input button {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: #667085;
          cursor: pointer;
        }

        .admin-login-card__error {
          padding: 10px 12px;
          border: 1px solid #efb3bf;
          border-radius: 8px;
          background: #fff3f5;
          color: #c4324f;
          font-size: 13px;
          line-height: 1.45;
        }

        .admin-login-card__submit {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          border: 1px solid #087ea4;
          border-radius: 8px;
          background: #087ea4;
          color: #ffffff;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-login-card__submit:hover:not(:disabled) {
          border-color: #066b8c;
          background: #066b8c;
        }

        .admin-login-card__submit:disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .admin-login-card__spin {
          animation: admin-login-spin 0.8s linear infinite;
        }

        @keyframes admin-login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .admin-login-page__back {
            top: 18px;
            left: 18px;
          }

          .admin-login-card {
            padding: 24px;
          }
        }
      `}</style>
    </main>
  );
}
