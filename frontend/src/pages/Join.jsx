import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import ApplicantPortal from "./ApplicantPortal.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Join() {
  const { lang, t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [phases, setPhases] = useState([]);
  const [countries, setCountries] = useState([]);
  const [mode, setMode] = useState("apply"); // apply | portal
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    id_number: "",
    country: "",
    role_interest: "",
    message: "",
  });
  const [documents, setDocuments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [appCode, setAppCode] = useState(null);

  useEffect(() => {
    endpoints.teamRoles().then(setRoles);
    endpoints.applicantPhases().then(setPhases);
    endpoints.countries().then((list) => setCountries(list || []));
  }, [lang]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFiles(name, e) {
    const list = Array.from(e.target.files || []);
    if (name === "certificates") {
      setCertificates((prev) => [...prev, ...list]);
    } else {
      setDocuments((prev) => [...prev, ...list]);
    }
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    setServerError(null);
    setAppCode(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") fd.append(k, v);
      });
      documents.forEach((f) => fd.append("documents", f));
      certificates.forEach((f) => fd.append("certificates", f));
      const res = await endpoints.submitVolunteerApplication(fd);
      setStatus("success");
      setAppCode(res.data.application_code || null);
      setForm({ full_name: "", email: "", phone: "", id_number: "", country: "", role_interest: "", message: "" });
      setDocuments([]);
      setCertificates([]);
    } catch (err) {
      const idMsg =
        err?.response?.data?.id_number ||
        err?.response?.data?.idNumber ||
        err?.response?.data?.detail;
      setServerError(Array.isArray(idMsg) ? idMsg.join(" ") : idMsg || null);
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow={t("join.hero.eyebrow")}
        title={t("join.hero.title")}
        lede={t("join.hero.lede")}
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("join.roles.title")}</h2>
          </div>
          <div className="grid-2">
            {roles.map((r) => (
              <div className="tile" key={r.id}>
                <h3>{r.title}</h3>
                <p>{r.summary}</p>
                <ul style={{ color: "var(--text-dim)", paddingLeft: 18, margin: "10px 0 0" }}>
                  {(r.requirements_list || []).map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("join.phases.title")}</h2>
            <p className="section-subtitle">{t("join.phases.subtitle")}</p>
          </div>
          <div className="phases-grid">
            {phases.map((ph) => (
              <div className="phase-card" key={ph.id}>
                <div className="phase-card-num">{ph.phase_number}</div>
                <h3>{ph.name}</h3>
                {ph.description && <p>{ph.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("join.application.title")}</h2>
          </div>

          <div className="portal-tabs">
            <button
              type="button"
              className={`portal-tab ${mode === "apply" ? "active" : ""}`}
              onClick={() => setMode("apply")}
            >
              {t("join.tabs.apply")}
            </button>
            <button
              type="button"
              className={`portal-tab ${mode === "portal" ? "active" : ""}`}
              onClick={() => setMode("portal")}
            >
              {t("join.tabs.status")}
            </button>
          </div>

          {mode === "portal" ? (
            <ApplicantPortal />
          ) : (
            <form className="form-grid" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="full_name">{t("join.form.fullname")}</label>
                <input
                  id="full_name"
                  name="full_name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="email">{t("join.form.email")}</label>
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
                <label htmlFor="phone">{t("join.form.phone")}</label>
                <input id="phone" name="phone" required value={form.phone} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="id_number">{t("join.form.idNumber")}</label>
                <input id="id_number" name="id_number" value={form.id_number} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="country">{t("join.form.country")}</label>
                <select
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                >
                  <option value="">{t("join.form.countryOption")}</option>
                  {(countries || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="role_interest">{t("join.form.role")}</label>
                <select
                  id="role_interest"
                  name="role_interest"
                  value={form.role_interest}
                  onChange={handleChange}
                >
                  <option value="">{t("join.form.roleOption")}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label htmlFor="message">{t("join.form.experience")}</label>
                <textarea id="message" name="message" value={form.message} onChange={handleChange} />
              </div>
              <div className="field full">
                <label htmlFor="documents">{t("join.form.documents")}</label>
                <div className="file-upload">
                  <label htmlFor="documents" className="file-upload-trigger">
                    {documents.length > 0
                      ? `${documents.length} ${documents.length === 1 ? t("join.form.fileSelected") : t("join.form.filesSelected")}`
                      : t("join.form.chooseFiles")}
                  </label>
                  <input
                    id="documents"
                    type="file"
                    multiple
                    onChange={(e) => handleFiles("documents", e)}
                  />
                  {documents.length > 0 && (
                    <div className="file-chips">
                      {documents.map((f, i) => (
                        <span className="file-chip" key={`d${i}`}>
                          {f.name}
                          <button
                            type="button"
                            className="file-chip-x"
                            onClick={() =>
                              setDocuments((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="field-hint">{t("join.form.documentsHint")}</p>
              </div>
              <div className="field full">
                <label htmlFor="certificates">{t("join.form.certificates")}</label>
                <div className="file-upload">
                  <label htmlFor="certificates" className="file-upload-trigger">
                    {certificates.length > 0
                      ? `${certificates.length} ${certificates.length === 1 ? t("join.form.fileSelected") : t("join.form.filesSelected")}`
                      : t("join.form.chooseFiles")}
                  </label>
                  <input
                    id="certificates"
                    type="file"
                    multiple
                    onChange={(e) => handleFiles("certificates", e)}
                  />
                  {certificates.length > 0 && (
                    <div className="file-chips">
                      {certificates.map((f, i) => (
                        <span className="file-chip" key={`c${i}`}>
                          {f.name}
                          <button
                            type="button"
                            className="file-chip-x"
                            onClick={() =>
                              setCertificates((prev) => prev.filter((_, j) => j !== i))
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="field-hint">{t("join.form.certificatesHint")}</p>
              </div>
              <div className="full">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t("join.form.submitting") : t("join.form.submit")}
                </button>
                {status === "success" && (
                  <p className="form-status success">{t("join.form.success")}</p>
                )}
                {status === "success" && appCode && (
                  <div className="portal-code">
                    <span>{t("join.form.yourCode")}</span>
                    <strong className="code-badge">{appCode}</strong>
                    <p>{t("join.form.codeHint")}</p>
                  </div>
                )}
                {status === "error" && (
                  <p className="form-status error">
                    {serverError || t("join.form.error")}
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
