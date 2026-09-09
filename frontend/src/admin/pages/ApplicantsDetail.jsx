import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import DocumentGroup from "../components/DocumentGroup.jsx";
import { adminEndpoints } from "../api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

export default function ApplicantsDetail() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const { id } = useParams();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminEndpoints.volunteerApplications
      .get(id)
      .then(setApp)
      .catch(() => setError(t("admin.applicants.detail.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      t("admin.applicants.detail.docError")
    );
  }

  async function decideMedical(doc, approve) {
    await runAction(
      () =>
        approve
          ? adminEndpoints.approveMedical(id, doc.id)
          : adminEndpoints.rejectMedical(id, doc.id),
      t("admin.applicants.detail.medicalError")
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="loading-note">{t("admin.resource.loading")}</p>
      </AdminLayout>
    );
  }

  if (error && !app) {
    return (
      <AdminLayout>
        <p className="empty-note">{error}</p>
        <Link to="/admin/archive" className="link-more">{t("admin.applicants.detail.back")}</Link>
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
          {t("admin.applicants.detail.back")}
        </Link>
      </div>

      {error && <p className="form-status error">{error}</p>}

      <div className="admin-detail">
        <div className="admin-detail-grid">
          <div className="field">
            <label>{t("admin.members.email")}</label>
            <p>{app.email}</p>
          </div>
          <div className="field">
            <label>{t("admin.members.phone")}</label>
            <p>{app.phone || "—"}</p>
          </div>
          <div className="field">
            <label>{t("admin.members.idNumber")}</label>
            <p>{app.id_number || "—"}</p>
          </div>
          <div className="field">
            <label>{t("admin.members.country")}</label>
            <p>{app.country_name || "—"}</p>
          </div>
          <div className="field">
            <label>{t("admin.applicants.role")}</label>
            <p>{app.role_interest_title || t("admin.applicants.notSpecified")}</p>
          </div>
          <div className="field">
            <label>{t("admin.applicants.submitted")}</label>
            <p>{new Date(app.submitted_at).toLocaleString()}</p>
          </div>
          <div className="field full">
            <label>{t("admin.applicants.detail.message")}</label>
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
                  t("admin.applicants.detail.advanceError")
                )
              }
            >
              {t("admin.applicants.detail.advance")}
            </button>
          )}
          {app.pipeline_phase === "board" && app.pipeline_phase !== "active" && (
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
                runAction(adminEndpoints.activateApplication, t("admin.applicants.detail.activateError"))
              }
            >
              {t("admin.applicants.detail.approve")}
            </button>
          )}
          {!app.is_rejected && app.pipeline_phase !== "active" && (
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={() =>
                window.confirm(t("admin.applicants.detail.rejectConfirm", { name: app.full_name })) &&
                runAction(adminEndpoints.rejectApplication, t("admin.applicants.detail.rejectError"))
              }
            >
              {t("admin.applicants.detail.reject")}
            </button>
          )}
        </div>

        {(app.documents?.length > 0 || app.medical_documents?.length > 0) && (
          <div className="kanban-panel-section">
            <h4>{t("admin.applicants.detail.documents")}</h4>
            <DocumentGroup
              label={t("admin.applicants.detail.documents")}
              items={(app.documents || []).filter((d) => d.kind === "document")}
              decide={(d, ok) => decideDocument(d, ok)}
            />
            <DocumentGroup
              label={t("admin.applicants.detail.certifications")}
              items={(app.documents || []).filter((d) => d.kind === "certification")}
              decide={(d, ok) => decideDocument(d, ok)}
            />
            <DocumentGroup
              label={t("admin.applicants.detail.medical")}
              items={app.medical_documents || []}
              decide={(d, ok) => decideMedical(d, ok)}
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}