import { useEffect, useState } from "react";
import AdminLayout from "../admin/components/AdminLayout.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { adminT } from "../i18n/adminTranslations.js";
import { portalEndpoints } from "../admin/portalApi.js";
import { adminEndpoints, tokenStore } from "../admin/api.js";
import { useAuth } from "../admin/AuthContext.jsx";

export default function MemberProfile() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [countries, setCountries] = useState([]);
  const [bloodTypes, setBloodTypes] = useState([]);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    country: "",
    blood_type: "",
    certifications: "",
    notes: "",
  });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  useEffect(() => {
    adminEndpoints.listCountries().then((list) => setCountries(Array.isArray(list) ? list : []));
    adminEndpoints.bloodTypes
      .list()
      .then((data) => setBloodTypes(data.results ?? data))
      .catch(() => setBloodTypes([]));

    portalEndpoints
      .profile()
      .then((data) => {
        setProfile(data);
        setForm({
          username: data.member_number || "",
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          id_number: data.id_number || "",
          country: data.country || "",
          blood_type: data.blood_type || "",
          certifications: data.certifications || "",
          notes: data.notes || "",
        });
      })
      .catch(() => setLoadError(t("portal.profile.error")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaveError(null);
    setSaveSuccess(null);
  }

  function handlePasswordChange(e) {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    setPwError(null);
    setPwSuccess(null);
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    const payload = {
      username: form.username.trim().toLowerCase(),
      full_name: form.full_name,
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      id_number: form.id_number,
      country: form.country ? Number(form.country) : null,
      blood_type: form.blood_type || null,
      certifications: form.certifications,
      notes: form.notes,
    };
    try {
      const res = await portalEndpoints.updateProfile(payload);
      if (res.new_token) tokenStore.set(res.new_token);
      setProfile(res);
      setForm((prev) => ({ ...prev, username: res.member_number || prev.username }));
      setSaveSuccess(t("portal.profile.saved"));
      refreshUser().catch(() => {});
    } catch (err) {
      const data = err.response?.data;
      setSaveError(data ? Object.values(data).flat().join(" ") : t("portal.profile.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError(t("portal.profile.passwordMismatch"));
      setPwSuccess(null);
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(null);
    try {
      const payload = {
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      };
      const res = await portalEndpoints.updateProfile(payload);
      if (res.new_token) tokenStore.set(res.new_token);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setPwSuccess(t("portal.profile.passwordChanged"));
      refreshUser().catch(() => {});
    } catch (err) {
      const data = err.response?.data;
      setPwError(data ? Object.values(data).flat().join(" ") : t("portal.profile.passwordError"));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>{t("portal.profile.title")}</h2>
      </div>

      {loading && <p className="loading-note">{t("admin.resource.loading")}</p>}
      {loadError && <p className="empty-note">{loadError}</p>}

      {profile && (
        <>
          <div className="kanban-panel-section" style={{ marginBottom: 24 }}>
            <div className="form-grid">
              <div className="field">
                <label>{t("portal.profile.role")}</label>
                <p>{profile.role_title || t("portal.profile.none")}</p>
              </div>
              <div className="field">
                <label>{t("portal.profile.status")}</label>
                <p>
                  <span className={`status-tag status-${profile.status || "probation"}`}>
                    {profile.status_display || t("portal.profile.none")}
                  </span>
                </p>
              </div>
              <div className="field">
                <label>{t("portal.profile.joined")}</label>
                <p>{profile.joined_date || t("portal.profile.none")}</p>
              </div>
              {profile.photo && (
                <div className="field">
                  <label>&nbsp;</label>
                  <img src={profile.photo} alt="" style={{ maxWidth: 120, borderRadius: 8 }} />
                </div>
              )}
            </div>
            <p className="form-status">{t("portal.profile.readOnly")}</p>
          </div>

          <form className="kanban-panel-section" style={{ marginBottom: 24 }} onSubmit={handleSaveProfile}>
            <h4>{t("portal.profile.title")}</h4>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="username">{t("portal.profile.username")}</label>
                <input id="username" name="username" value={form.username} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="full_name">{t("portal.profile.fullName")}</label>
                <input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="email">{t("portal.profile.email")}</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="phone">{t("portal.profile.phone")}</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="id_number">{t("portal.profile.idNumber")}</label>
                <input id="id_number" name="id_number" value={form.id_number} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="country">{t("portal.profile.country")}</label>
                <select id="country" name="country" value={String(form.country)} onChange={handleChange}>
                  <option value="">—</option>
                  {countries.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="blood_type">{t("portal.profile.bloodType")}</label>
                <select id="blood_type" name="blood_type" value={form.blood_type} onChange={handleChange}>
                  <option value="">—</option>
                  {bloodTypes.map((bt) => (
                    <option key={bt.id} value={bt.status}>
                      {bt.label || bt.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="certifications">{t("portal.profile.certifications")}</label>
                <textarea
                  id="certifications"
                  name="certifications"
                  rows={3}
                  value={form.certifications}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="notes">{t("portal.profile.notes")}</label>
                <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={handleChange} />
              </div>
            </div>
            <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t("portal.profile.saving") : t("admin.resource.saveChanges")}
              </button>
              {saveError && <p className="form-status error" style={{ margin: 0 }}>{saveError}</p>}
              {saveSuccess && <p className="form-status" style={{ margin: 0 }}>{saveSuccess}</p>}
            </div>
          </form>

          <form className="kanban-panel-section" style={{ marginBottom: 24 }} onSubmit={handleChangePassword}>
            <h4>{t("portal.profile.changePassword")}</h4>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="new_password">{t("portal.profile.newPassword")}</label>
                <input
                  id="new_password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="field">
                <label htmlFor="confirm_password">{t("portal.profile.confirmPassword")}</label>
                <input
                  id="confirm_password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
            </div>
            <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
              <button
                type="submit"
                className="btn btn-outline"
                disabled={pwSaving || !passwordForm.newPassword}
              >
                {pwSaving ? t("portal.profile.saving") : t("portal.profile.changePassword")}
              </button>
              {pwError && <p className="form-status error" style={{ margin: 0 }}>{pwError}</p>}
              {pwSuccess && <p className="form-status" style={{ margin: 0 }}>{pwSuccess}</p>}
            </div>
          </form>
        </>
      )}
    </AdminLayout>
  );
}