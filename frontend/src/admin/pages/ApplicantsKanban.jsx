import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import DocumentGroup from "../components/DocumentGroup.jsx";
import { adminEndpoints } from "../api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

export default function ApplicantsKanban() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const [phases, setPhases] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [params] = useSearchParams();

  const load = useCallback((fromUrl) => {
    setLoading(true);
    setError(null);
    const q = { page_size: 100 };
    if (search) q.search = search;
    adminEndpoints.volunteerApplications
      .list(q)
      .then((data) => {
        const list = data.results ?? data;
        setApps(list);
        const appId = fromUrl;
        if (appId) {
          const found = list.find((a) => String(a.id) === appId);
          if (found) setSelected(found);
        }
      })
      .catch(() => setError(t("admin.pipeline.loadError")))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load(params.get("app"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    adminEndpoints.applicantPipelinePhases
      .list({ page_size: 50 })
      .then((data) => setPhases(data.results ?? data))
      .catch(() => {});
  }, []);

  function currentPhase(a) {
    return a.pipeline_phase || "application";
  }

  function refreshRow(next) {
    setApps((prev) => prev.map((a) => (a.id === next.id ? next : a)));
    setSelected(next);
  }

  function flash(msg) {
    setActionNotice(msg);
    window.setTimeout(() => setActionNotice(null), 3500);
  }

  async function run(fn, okMsg) {
    try {
      const updated = await fn();
      refreshRow(updated);
      flash(okMsg);
    } catch (e) {
      flash(t("admin.pipeline.error", { message: e?.response?.data?.detail || t("admin.pipeline.requestFailed") }));
    }
  }

  const groups = useMemo(
    () =>
      (phases.length ? phases : []).map((ph) => ({
        key: ph.pipeline_key,
        label: t("admin.pipeline.phase", { number: ph.phase_number }),
        short: ph.name,
        items: apps.filter((a) => {
          if (currentPhase(a) !== ph.pipeline_key) return false;
          if (ph.pipeline_key === "active" && a.archived) return false;
          return true;
        }),
      })),
    [phases, apps]
  );

  const [openCols, setOpenCols] = useState(null);

  useEffect(() => {
    if (openCols !== null) return;
    const first = groups.find((g) => g.items.length > 0);
    setOpenCols(first ? new Set([first.key]) : new Set());
  }, [groups, openCols]);

  function toggleCol(key) {
    setOpenCols((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function isColOpen(key) {
    return (openCols ?? new Set()).has(key);
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>{t("admin.pipeline.title")}</h2>
        <Link to="/admin/archive" className="link-more">
          {t("admin.pipeline.tableView")}
        </Link>
      </div>

      <div className="admin-toolbar" style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="admin-search"
          placeholder={t("admin.pipeline.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {actionNotice && <span className="form-status success">{actionNotice}</span>}
      </div>

      {loading && <p className="loading-note">{t("admin.pipeline.loading")}</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && apps.length === 0 && (
        <p className="empty-note">{t("admin.pipeline.empty")}</p>
      )}

      {!loading && apps.length > 0 && (
        <div className="kanban-board">
          {groups.map((group) => {
            const open = isColOpen(group.key);
            return (
              <div className="kanban-col kanban-phase" key={group.key}>
                <button
                  type="button"
                  className="kanban-col-head"
                  aria-expanded={open}
                  onClick={() => toggleCol(group.key)}
                >
                  <span className="kanban-col-label">
                    <span className="kanban-col-phase">{group.label}</span>
                    <span className="kanban-col-title">{group.short}</span>
                  </span>
                  <span className="kanban-col-meta">
                    <span className="kanban-col-count">{group.items.length}</span>
                    <span className={`kanban-col-chevron${open ? " open" : ""}`}>&#9662;</span>
                  </span>
                </button>
                <div className={`kanban-col-body${open ? "" : " kanban-col-body--collapsed"}`}>
                  {group.items.map((a) => (
                    <button
                      type="button"
                      key={a.id}
                      className={`kanban-card ${selected?.id === a.id ? "selected" : ""} ${
                        a.is_flagged ? "flagged" : ""
                      }`}
                      onClick={() => setSelected(a)}
                    >
                      <div className="kanban-card-name">{a.full_name}</div>
                      <div className="kanban-card-sub">{a.role_interest_title || t("admin.pipeline.noRole")}</div>
                      <div className="kanban-card-meta">
                        <span>{a.application_code}</span>
                        {a.is_flagged && <span className="flag-badge">{t("admin.pipeline.flag")}</span>}
                      </div>
                    </button>
                  ))}
                  {group.items.length === 0 && <div className="kanban-col-empty" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
            <ApplicationPanel
              app={selected}
              t={t}
              onClose={() => setSelected(null)}
              onAdvance={() =>
                run(() => adminEndpoints.advanceApplicationPhase(selected.id), t("admin.pipeline.phaseAdvanced"))
              }
              onActivate={() =>
                run(() => adminEndpoints.activateApplication(selected.id), t("admin.pipeline.activated"))
              }
              onReject={() =>
                window.confirm(t("admin.pipeline.rejectConfirm", { name: selected.full_name })) &&
                run(() => adminEndpoints.rejectApplication(selected.id), t("admin.pipeline.rejectedMsg"))
              }
              onFlag={() =>
                run(() => adminEndpoints.flagApplication(selected.id), t("admin.pipeline.flagged"))
              }
              onArchive={() =>
                run(() => adminEndpoints.archiveApplication(selected.id), t("admin.pipeline.archived"))
              }
              refresh={refreshRow}
              flash={flash}
              run={run}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ApplicationPanel({ app, t, onClose, onAdvance, onActivate, onReject, onFlag, onArchive, refresh, run }) {
  const [comment, setComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const currentComment = (app.comments || []).find((c) => c.phase === app.pipeline_phase);

  useEffect(() => {
    setComment((app.comments || []).find((c) => c.phase === app.pipeline_phase)?.text || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id, app.pipeline_phase]);

  async function saveComment() {
    setSavingComment(true);
    try {
      const updated = await adminEndpoints.setPhaseComment(app.id, app.pipeline_phase, comment);
      refresh(updated);
    } catch {
      /* handled by parent flash via run? just ignore */
    } finally {
      setSavingComment(false);
    }
  }

  async function toggleChecklist(item) {
    run(() => adminEndpoints.setChecklistItem(app.id, item.id, !item.done), t("admin.pipeline.checklistUpdated"));
  }

  async function decideDocument(doc, approve) {
    run(
      () =>
        approve
          ? adminEndpoints.approveDocument(app.id, doc.id)
          : adminEndpoints.rejectDocument(app.id, doc.id),
      t("admin.pipeline.docUpdated")
    );
  }

  async function decideMedical(doc, approve) {
    run(
      () =>
        approve
          ? adminEndpoints.approveMedical(app.id, doc.id)
          : adminEndpoints.rejectMedical(app.id, doc.id),
      t("admin.pipeline.medicalUpdated")
    );
  }

  const closed = app.pipeline_phase === "active" || app.pipeline_phase === "rejected";
  const checklist = (app.checklist || []).filter((i) => i.phase === app.pipeline_phase);
  const documents = app.documents || [];
  const medical = app.medical_documents || [];

  return (
    <div className="kanban-panel">
      <div className="kanban-panel-head">
        <div>
          <h3>{app.full_name}</h3>
          <div className="kanban-card-sub">
            {app.role_interest_title} · {app.application_code} ·{" "}
            {app.is_rejected ? t("admin.pipeline.rejected") : app.pipeline_phase_display}
          </div>
        </div>
        <button type="button" className="link-button" onClick={onClose}>
          {t("admin.pipeline.close")}
        </button>
      </div>

      <div className="kanban-panel-grid">
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
        {app.message && (
          <div className="field full">
            <label>{t("admin.applicants.detail.message")}</label>
            <p>{app.message}</p>
          </div>
        )}
      </div>

      <div className="full" style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
        {!closed && app.pipeline_phase !== "rejected" && app.pipeline_phase !== "board" && (
          <button className="btn btn-primary" onClick={onAdvance}>
            {t("admin.pipeline.advance")}
          </button>
        )}
        {app.pipeline_phase === "board" && !closed && (
          <button className="btn btn-primary" onClick={onActivate}>
            {t("admin.pipeline.approve")}
          </button>
        )}
        {!closed && (
          <button className="btn btn-outline" onClick={onReject}>
            {t("admin.pipeline.reject")}
          </button>
        )}
        <button className="btn btn-outline" onClick={onFlag}>
          {app.is_flagged ? t("admin.pipeline.unflag") : t("admin.pipeline.flagReview")}
        </button>
        {!app.archived && app.pipeline_phase === "active" && (
          <button
            className="btn btn-outline"
            onClick={() =>
              window.confirm(t("admin.pipeline.archiveConfirm", { name: app.full_name })) &&
              onArchive()
            }
          >
            {t("admin.pipeline.archive")}
          </button>
        )}
      </div>

      <div className="kanban-panel-section">
        <h4>{t("admin.pipeline.checklistTitle", { phase: app.pipeline_phase_display })}</h4>
        {checklist.length === 0 ? (
          <p className="empty-note">{t("admin.pipeline.checklistEmpty")}</p>
        ) : (
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.id}>
                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklist(item)}
                  />
                  <span className={item.done ? "done" : ""}>{item.label}</span>
                  {item.done && item.done_by_name && (
                    <span className="checklist-by">— {item.done_by_name}</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="kanban-panel-section">
        <h4>{t("admin.pipeline.commentTitle", { phase: app.pipeline_phase_display })}</h4>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("admin.pipeline.commentPlaceholder")}
        />
        <button
          className="btn btn-outline"
          onClick={saveComment}
          disabled={savingComment || !comment.trim()}
        >
          {currentComment ? t("admin.pipeline.commentUpdate") : t("admin.pipeline.commentSave")}
        </button>
      </div>

      {(documents.length > 0 || medical.length > 0) && (
        <div className="kanban-panel-section">
          <h4>{t("admin.applicants.detail.documents")}</h4>
          <DocumentGroup
            label={t("admin.applicants.detail.documents")}
            items={documents.filter((d) => d.kind === "document")}
            decide={(d, ok) => decideDocument(d, ok)}
          />
          <DocumentGroup
            label={t("admin.applicants.detail.certifications")}
            items={documents.filter((d) => d.kind === "certification")}
            decide={(d, ok) => decideDocument(d, ok)}
          />
          <DocumentGroup
            label={t("admin.applicants.detail.medical")}
            items={medical}
            decide={(d, ok) => decideMedical(d, ok)}
          />
        </div>
      )}
    </div>
  );
}
