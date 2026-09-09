import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  id_number: "",
  country: "",
  blood_type: "",
  role: "",
  status: "",
  joined_date: "",
  certifications: "",
  photo: "",
  notes: "",
};

export default function MemberForm() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [bloodTypes, setBloodTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [memberNumber, setMemberNumber] = useState("");
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    adminEndpoints.teamRoles().then(setRoles);
    adminEndpoints.listCountries().then((list) => setCountries(Array.isArray(list) ? list : []));
    adminEndpoints.memberStatuses
      .list()
      .then((data) => setStatuses(data.results ?? data))
      .catch(() => setStatuses([]));
    adminEndpoints.bloodTypes
      .list()
      .then((data) => setBloodTypes(data.results ?? data))
      .catch(() => setBloodTypes([]));
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    adminEndpoints
      .getMember(id)
      .then((data) => {
        setForm({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || "",
          id_number: data.id_number || "",
          country: data.country || "",
          blood_type: data.blood_type || "",
          role: data.role || "",
          status: data.status || "",
          joined_date: data.joined_date,
          certifications: data.certifications || "",
          photo: data.photo || "",
          notes: data.notes || "",
        });
        setMemberNumber(data.member_number || "");
        if (data.photo) setPhotoUrl(data.photo);
      })
      .catch(() => setError(t("admin.members.loadRecordError")))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const hasPhoto = Boolean(photoFile);
    let payload;
    if (hasPhoto) {
      const fd = new FormData();
      for (const [key, val] of Object.entries(form)) {
        if (key === "photo") continue;
        if (val !== null && val !== undefined) fd.append(key, val);
      }
      fd.append("photo", photoFile);
      payload = fd;
    } else {
      payload = { ...form, role: form.role || null, country: form.country || null };
      delete payload.photo;
      if (form.status === "") delete payload.status;
      if (form.blood_type === "") delete payload.blood_type;
    }
    try {
      if (isEditing) {
        await adminEndpoints.updateMember(id, payload);
      } else {
        await adminEndpoints.createMember(payload);
      }
      navigate("/admin/members");
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : t("admin.members.saveError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError(t("admin.members.passwordMismatch"));
      setPwSuccess(null);
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(null);
    try {
      const res = await adminEndpoints.setMemberPassword(
        id,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setMemberNumber(res.username);
      setPwSuccess(t("admin.members.passwordChanged", { username: res.username }));
    } catch (err) {
      const data = err.response?.data;
      setPwError(data ? Object.values(data).flat().join(" ") : t("admin.members.passwordError"));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>{isEditing ? t("admin.members.editTitle") : t("admin.members.addTitle")}</h2>
        <Link to="/admin/members" className="link-more">
          {t("admin.members.back")}
        </Link>
      </div>

      {loading ? (
        <p className="loading-note">{t("admin.resource.loading")}</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="full_name">{t("admin.members.fullName")}</label>
            <input id="full_name" name="full_name" required value={form.full_name} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="email">{t("admin.members.email")}</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">{t("admin.members.phone")}</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="id_number">{t("admin.members.idNumber")}</label>
            <input id="id_number" name="id_number" value={form.id_number} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="country">{t("admin.members.country")}</label>
            <select id="country" name="country" value={form.country} onChange={handleChange}>
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="blood_type">{t("admin.members.bloodType")}</label>
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
            <label htmlFor="joined_date">{t("admin.members.joinedDate")}</label>
            <input
              id="joined_date"
              type="date"
              name="joined_date"
              required
              value={form.joined_date}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="role">{t("admin.members.roleTrack")}</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="">{t("admin.members.unassigned")}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">{t("admin.members.status")}</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="">—</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.status}>
                  {s.label || s.status}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="photo">{t("admin.members.photo")}</label>
            {(photoUrl || photoFile) && (
              <img
                src={photoFile ? URL.createObjectURL(photoFile) : photoUrl}
                alt={t("admin.members.photo")}
                style={{ display: "block", width: 120, height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
              />
            )}
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPhotoFile(file);
              }}
            />
          </div>
          <div className="field full">
            <label htmlFor="certifications">{t("admin.members.certifications")}</label>
            <textarea
              id="certifications"
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
            />
          </div>
          <div className="field full">
            <label htmlFor="notes">{t("admin.members.notes")}</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
          </div>
          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? t("admin.members.saving")
                : isEditing
                  ? t("admin.members.saveChanges")
                  : t("admin.members.add")}
            </button>
            {error && <p className="form-status error" style={{ margin: 0 }}>{error}</p>}
          </div>
        </form>
      )}

      {isEditing && (
        <form className="kanban-panel-section" onSubmit={handleSetPassword}>
          <h4>{t("admin.members.account")}</h4>
          <div className="field" style={{ marginBottom: 16 }}>
            <label>{t("portal.profile.username")}</label>
            <p>{memberNumber || "—"}</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="new_password">{t("admin.members.newPassword")}</label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="confirm_password">{t("admin.members.confirmPassword")}</label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button type="submit" className="btn btn-outline" disabled={pwSaving || !passwordForm.newPassword}>
              {pwSaving ? t("admin.members.saving") : t("admin.members.changePassword")}
            </button>
            {pwError && <p className="form-status error" style={{ margin: 0 }}>{pwError}</p>}
            {pwSuccess && <p className="form-status" style={{ margin: 0 }}>{pwSuccess}</p>}
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
