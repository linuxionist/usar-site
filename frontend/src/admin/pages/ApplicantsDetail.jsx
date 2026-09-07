import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import DocumentGroup from "../components/DocumentGroup.jsx";
import { adminEndpoints } from "../api.js";

export default function ApplicantsDetail() {
  const { id } = useParams();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminEndpoints.volunteerApplications
      .get(id)
      .then(setApp)
      .catch(() => setError("Unable to load this application."))
      .finally(() => setLoading(false));
  }, [id]);

  async function runAction(action, msg) {
    setSaving(true);
    setError(null);
    try {
      const updated = await action(id);
      setApp(updated);
    } catch (e) {
      setError(e?.response?.data?.detail || msg);
    } finally {
      setSaving(false);
    }
  }

  async function decideDocument(doc, approve) {
    await runAction(
      () =>
        approve
          ? adminEndpoints.approveDocument(id, doc.id)
          : adminEndpoints.rejectDocument(id, doc.id),
      "Unable to update document."
    );
  }

  async function decideMedical(doc, approve) {
    await runAction(
      () =>
        approve
          ? adminEndpoints.approveMedical(id, doc.id)
          : adminEndpoints.rejectMedical(id, doc.id),
      "Unable to update medical document."
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="loading-note">Loading…</p>
      </AdminLayout>
    );
  }

  if (error && !app) {
    return (
      <AdminLayout>
        <p className="empty-note">{error}</p>
        <Link to="/admin/archive" className="link-more">← Back to applicants</Link>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>
          {app.full_name}{" "}
          {app.application_code && (
            <span className="code-badge">{app.application_code}</span>
          )}
        </h2>
        <Link to="/admin/archive" className="link-more">
          ← Back to applicants
        </Link>
      </div>

      {error && <p className="form-status error">{error}</p>}

      <div className="admin-detail">
        <div className="admin-detail-grid">
          <div className="field">
            <label>Email</label>
            <p>{app.email}</p>
          </div>
          <div className="field">
            <label>Phone</label>
            <p>{app.phone || "—"}</p>
          </div>
          <div className="field">
            <label>ID number</label>
            <p>{app.id_number || "—"}</p>
          </div>
          <div className="field">
            <label>Country</label>
            <p>{app.country_name || "—"}</p>
          </div>
          <div className="field">
            <label>Interested role</label>
            <p>{app.role_interest_title || "Not specified"}</p>
          </div>
          <div className="field">
            <label>Submitted</label>
            <p>{new Date(app.submitted_at).toLocaleString()}</p>
          </div>
          <div className="field full">
            <label>Message</label>
            <p>{app.message || "—"}</p>
          </div>
        </div>

        <div className="full" style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
          {app.pipeline_phase !== "active" && (
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
                runAction(
                  adminEndpoints.advanceApplicationPhase,
                  "Unable to advance phase."
                )
              }
            >
              Advance phase
            </button>
          )}
          {app.pipeline_phase === "board" && app.pipeline_phase !== "active" && (
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
                runAction(adminEndpoints.activateApplication, "Unable to activate.")
              }
            >
              Approve → Active
            </button>
          )}
          {!app.is_rejected && app.pipeline_phase !== "active" && (
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={() =>
                window.confirm(`Reject application from ${app.full_name}?`) &&
                runAction(adminEndpoints.rejectApplication, "Unable to reject.")
              }
            >
              Reject
            </button>
          )}
        </div>

        {(app.documents?.length > 0 || app.medical_documents?.length > 0) && (
          <div className="kanban-panel-section">
            <h4>Documents</h4>
            <DocumentGroup
              label="Documents"
              items={(app.documents || []).filter((d) => d.kind === "document")}
              decide={(d, ok) => decideDocument(d, ok)}
            />
            <DocumentGroup
              label="Certifications"
              items={(app.documents || []).filter((d) => d.kind === "certification")}
              decide={(d, ok) => decideDocument(d, ok)}
            />
            <DocumentGroup
              label="Medical"
              items={app.medical_documents || []}
              decide={(d, ok) => decideMedical(d, ok)}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}