import { useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    is_media_inquiry: false,
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await endpoints.submitContactMessage(form);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "", is_media_inquiry: false });
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow={t("contact.hero.eyebrow")}
        title={t("contact.hero.title")}
      />

      <section className="section">
        <div className="container two-col">
          <div>
            <h2 style={{ marginBottom: 14 }}>{t("contact.hotline.title")}</h2>
            <p>{t("contact.hotline.body")}</p>
            <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
              (555) 019-4477
            </p>
          </div>
          <div>
            <h2 style={{ marginBottom: 14 }}>{t("contact.hq.title")}</h2>
            <p>{t("contact.hq.address")}</p>
            <p>{t("contact.hq.media")}</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("contact.inquiries.title")}</h2>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">{t("contact.form.name")}</label>
              <input id="name" name="name" required value={form.name} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="email">{t("contact.form.email")}</label>
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
              <label htmlFor="phone">{t("contact.form.phone")}</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="subject">{t("contact.form.subject")}</label>
              <input id="subject" name="subject" value={form.subject} onChange={handleChange} />
            </div>
            <div className="field full">
              <label htmlFor="message">{t("contact.form.message")}</label>
              <textarea
                id="message"
                name="message"
                required
                value={form.message}
                onChange={handleChange}
              />
            </div>
            <div className="field full" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="is_media_inquiry"
                name="is_media_inquiry"
                checked={form.is_media_inquiry}
                onChange={handleChange}
                style={{ width: "auto" }}
              />
              <label htmlFor="is_media_inquiry" style={{ margin: 0 }}>
                {t("contact.form.media")}
              </label>
            </div>
            <div className="full">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? t("contact.form.sending") : t("contact.form.send")}
              </button>
              {status === "success" && (
                <p className="form-status success">{t("contact.form.success")}</p>
              )}
              {status === "error" && (
                <p className="form-status error">{t("contact.form.error")}</p>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
