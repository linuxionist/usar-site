import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import DocumentGroup from "../components/DocumentGroup.jsx";
import { adminEndpoints } from "../api.js";

export default function ApplicantsKanban() {
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
      .catch(() => setError("Unable to load applicants."))
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
      flash(`Error: ${e?.response?.data?.detail || "request failed"}`);
    }
  }

  const groups = (phases.length ? phases : []).map((ph) => ({
    key: ph.pipeline_key,
    label: `Phase ${ph.phase_number}`,
    short: ph.name,
    items: apps.filter((a) => {
      if (currentPhase(a) !== ph.pipeline_key) return false;
      if (ph.pipeline_key === "active" && a.archived) return false;
      return true;
    }),
  }));

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>Applicant Pipeline</h2>
        <Link to="/admin/archive" className="link-more">
          Table view →
        </Link>
      </div>

      <div className="admin-toolbar" style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search name, email or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        {actionNotice && <span className="form-status success">{actionNotice}</span>}
      </div>

      {loading && <p className="loading-note">Loading applicants…</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && apps.length === 0 && (
        <p className="empty-note">No applications submitted yet.</p>
      )}

      {!loading && apps.length > 0 && (
        <div className="kanban-board">
          {groups.map((group) => (
            <div className={`kanban-col kanban-phase`} key={group.key}>
              <div className="kanban-col-head">
                <span className="kanban-col-phase">{group.label}</span>
                <span className="kanban-col-count">{group.items.length}</span>
              </div>
              <div className="kanban-col-title">{group.short}</div>
              <div className="kanban-col-body">
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
                    <div className="kanban-card-sub">{a.role_interest_title || "No role"}</div>
                    <div className="kanban-card-meta">
                      <span>{a.application_code}</span>
                      {a.is_flagged && <span className="flag-badge">flag</span>}
                    </div>
                  </button>
                ))}
                {group.items.length === 0 && <div className="kanban-col-empty" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-shell" onClick={(e) => e.stopPropagation()}>
            <ApplicationPanel
              app={selected}
              onClose={() => setSelected(null)}
              onAdvance={() =>
                run(() => adminEndpoints.advanceApplicationPhase(selected.id), "Phase advanced.")
              }
              onActivate={() =>
                run(() => adminEndpoints.activateApplication(selected.id), "Activated into Active Duty.")
              }
              onReject={() =>
                window.confirm(`Reject ${selected.full_name}?`) &&
                run(() => adminEndpoints.rejectApplication(selected.id), "Application rejected.")
              }
              onFlag={() =>
                run(() => adminEndpoints.flagApplication(selected.id), "Flag toggled.")
              }
              onArchive={() =>
                run(() => adminEndpoints.archiveApplication(selected.id), "Application archived.")
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

function ApplicationPanel({ app, onClose, onAdvance, onActivate, onReject, onFlag, onArchive, refresh, run }) {
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
    run(() => adminEndpoints.setChecklistItem(app.id, item.id, !item.done), "Checklist updated.");
  }

  async function decideDocument(doc, approve) {
    run(
      () =>
        approve
          ? adminEndpoints.approveDocument(app.id, doc.id)
          : adminEndpoints.rejectDocument(app.id, doc.id),
      "Document updated."
    );
  }

  async function decideMedical(doc, approve) {
    run(
      () =>
        approve
          ? adminEndpoints.approveMedical(app.id, doc.id)
          : adminEndpoints.rejectMedical(app.id, doc.id),
      "Medical document updated."
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
            {app.is_rejected ? "Rejected" : app.pipeline_phase_display}
          </div>
        </div>
        <button type="button" className="link-button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="kanban-panel-grid">
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
        {app.message && (
          <div className="field full">
            <label>Message</label>
            <p>{app.message}</p>
          </div>
        )}
      </div>

      <div className="full" style={{ display: "flex", gap: 10, margin: "14px 0", flexWrap: "wrap" }}>
        {!closed && app.pipeline_phase !== "rejected" && app.pipeline_phase !== "board" && (
          <button className="btn btn-primary" onClick={onAdvance}>
            Advance phase
          </button>
        )}
        {app.pipeline_phase === "board" && !closed && (
          <button className="btn btn-primary" onClick={onActivate}>
            Approve
          </button>
        )}
        {!closed && (
          <button className="btn btn-outline" onClick={onReject}>
            Reject
          </button>
        )}
        <button className="btn btn-outline" onClick={onFlag}>
          {app.is_flagged ? "Unflag" : "Flag for review"}
        </button>
        {!app.archived && app.pipeline_phase === "active" && (
          <button
            className="btn btn-outline"
            onClick={() =>
              window.confirm(`Archive ${app.full_name} and hide from the pipeline?`) &&
              onArchive()
            }
          >
            Archive
          </button>
        )}
      </div>

      <div className="kanban-panel-section">
        <h4>Checklist — {app.pipeline_phase_display}</h4>
        {checklist.length === 0 ? (
          <p className="empty-note">No checklist items for this phase yet.</p>
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
        <h4>Phase comment — {app.pipeline_phase_display}</h4>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Visible to the applicant on their status page…"
        />
        <button
          className="btn btn-outline"
          onClick={saveComment}
          disabled={savingComment || !comment.trim()}
        >
          {currentComment ? "Update comment" : "Save comment"}
        </button>
      </div>

      {(documents.length > 0 || medical.length > 0) && (
        <div className="kanban-panel-section">
          <h4>Documents</h4>
          <DocumentGroup
            label="Documents"
            items={documents.filter((d) => d.kind === "document")}
            decide={(d, ok) => decideDocument(d, ok)}
          />
          <DocumentGroup
            label="Certifications"
            items={documents.filter((d) => d.kind === "certification")}
            decide={(d, ok) => decideDocument(d, ok)}
          />
          <DocumentGroup
            label="Medical"
            items={medical}
            decide={(d, ok) => decideMedical(d, ok)}
          />
        </div>
      )}
    </div>
  );
}
