import { useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function Contact() {
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
        eyebrow="Contact &amp; Emergency Info"
        title="Reach the right desk, whether it's dispatch or a general question."
      />

      <section className="section">
        <div className="container two-col">
          <div>
            <h2 style={{ marginBottom: 14 }}>24/7 Activation Hotline</h2>
            <p>
              Emergency management agencies and dispatch centers requesting task force
              deployment should call the activation line directly:
            </p>
            <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)", fontSize: "1.4rem" }}>
              (555) 019-4477
            </p>
          </div>
          <div>
            <h2 style={{ marginBottom: 14 }}>HQ &amp; Training Facility</h2>
            <p>412 Ridgeline Way, your city — visitors must check in at the main gate.</p>
            <p>Media inquiries: press@ridgelinetaskforce.org</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>General Inquiries</h2>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" required value={form.name} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
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
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input id="subject" name="subject" value={form.subject} onChange={handleChange} />
            </div>
            <div className="field full">
              <label htmlFor="message">Message</label>
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
                This is a media inquiry
              </label>
            </div>
            <div className="full">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Sending…" : "Send Message"}
              </button>
              {status === "success" && (
                <p className="form-status success">Message sent. We'll be in touch shortly.</p>
              )}
              {status === "error" && (
                <p className="form-status error">
                  Something went wrong sending your message. Please try again.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
