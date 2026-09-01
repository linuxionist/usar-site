import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function Join() {
  const [roles, setRoles] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_interest: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    endpoints.teamRoles().then(setRoles);
    endpoints.trainingPipeline().then(setPipeline);
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await endpoints.submitVolunteerApplication({
        ...form,
        role_interest: form.role_interest || null,
      });
      setStatus("success");
      setForm({ full_name: "", email: "", phone: "", role_interest: "", message: "" });
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Join the Team"
        title="Five specialization tracks. One selection process."
        lede="We recruit rescue specialists, K9 handlers, medical officers, HazMat specialists, and logistics support personnel."
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Team Roles &amp; Requirements</h2>
          </div>
          <div className="grid-2">
            {roles.map((r) => (
              <div className="tile" key={r.id}>
                <span className="tile-tag">{r.track_display}</span>
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
            <h2>Training Pipeline</h2>
          </div>
          <div className="pipeline">
            {pipeline.map((stage) => (
              <div className="pipeline-step" key={stage.id}>
                <div className="pipeline-num">{String(stage.order).padStart(2, "0")}</div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 6 }}>{stage.title}</h3>
                  <p style={{ margin: 0 }}>{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>Application</h2>
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                name="full_name"
                required
                value={form.full_name}
                onChange={handleChange}
              />
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
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" required value={form.phone} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="role_interest">Role of interest</label>
              <select
                id="role_interest"
                name="role_interest"
                value={form.role_interest}
                onChange={handleChange}
              >
                <option value="">Select a track</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label htmlFor="message">Relevant experience</label>
              <textarea id="message" name="message" value={form.message} onChange={handleChange} />
            </div>
            <div className="full">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Application"}
              </button>
              {status === "success" && (
                <p className="form-status success">
                  Application received. A recruitment officer will contact you soon.
                </p>
              )}
              {status === "error" && (
                <p className="form-status error">
                  Something went wrong submitting your application. Please try again.
                </p>
              )}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
