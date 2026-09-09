import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

export default function Login() {
  const { login, user, checking } = useAuth();
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (checking) {
    return (
      <div className="container" style={{ padding: "60px 24px" }}>
        <p className="loading-note">Checking session…</p>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={user.is_staff ? location.state?.from || "/admin/members" : "/member/profile"}
        replace
      />
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(form.username, form.password);
      const dest = user.is_staff
        ? location.state?.from || "/admin/members"
        : "/member/profile";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.response?.status === 400
          ? t("admin.login.error.bad")
          : err.message || t("admin.login.error.generic")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="hero-eyebrow">{t("admin.login.eyebrow")}</div>
        <h1 style={{ fontSize: "1.8rem", marginBottom: 24 }}>{t("admin.login.title")}</h1>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="username">{t("admin.login.username")}</label>
          <input
            id="username"
            required
            autoFocus
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </div>
        <div className="field" style={{ marginBottom: 20 }}>
          <label htmlFor="password">{t("admin.login.password")}</label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? t("admin.login.submitting") : t("admin.login.submit")}
        </button>
        {error && <p className="form-status error">{error}</p>}
      </form>
    </div>
  );
}