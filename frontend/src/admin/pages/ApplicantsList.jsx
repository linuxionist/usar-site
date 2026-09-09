import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

const PAGE_SIZE = 10;

const STATUS_META = {
  active: { labelKey: "admin.applicants.active", css: "status-active" },
  in_progress: { labelKey: "admin.applicants.inProgress", css: "status-probation" },
  rejected: { labelKey: "admin.applicants.rejected", css: "status-rejected" },
};

const SORTABLE_COLUMNS = [
  { key: "full_name", labelKey: "admin.members.name" },
  { key: "email", labelKey: "admin.members.email" },
  { key: "role_interest__title", labelKey: "admin.applicants.role" },
  { key: "submitted_at", labelKey: "admin.applicants.submitted" },
  { key: "status", labelKey: "admin.applicants.status" },
];

export default function ApplicantsList() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [reviewed, setReviewed] = useState("");
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("-submitted_at");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { page, page_size: PAGE_SIZE, ordering };
    if (search) params.search = search;
    if (reviewed !== "") params.reviewed = reviewed;
    adminEndpoints.volunteerApplications
      .list(params)
      .then((data) => {
        const list = data.results ?? data;
        setRows(list);
        setCount(data.count ?? list.length);
      })
      .catch(() => setError(t("admin.applicants.loadError")))
      .finally(() => setLoading(false));
  }, [page, ordering, search, reviewed]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce typing filters
    return () => clearTimeout(timeout);
  }, [load]);

  function toggleOrdering(key) {
    setPage(1);
    setOrdering((current) => {
      if (current === key) return `-${key}`;
      if (current === `-${key}`) return key;
      return key;
    });
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  async function handleDelete(row) {
    if (!window.confirm(t("admin.applicants.deleteConfirm", { name: row.full_name }))) return;
    await adminEndpoints.volunteerApplications.remove(row.id);
    load();
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>
          {t("admin.applicants.title")} ({count})
        </h2>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder={t("admin.applicants.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select value={reviewed} onChange={(e) => { setReviewed(e.target.value); setPage(1); }}>
          <option value="">{t("admin.applicants.all")}</option>
          <option value="false">{t("admin.applicants.notReviewed")}</option>
          <option value="true">{t("admin.applicants.reviewed")}</option>
        </select>
      </div>

      {loading && <p className="loading-note">{t("admin.applicants.loading")}</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="empty-note">{t("admin.applicants.empty")}</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="admin-table-scroll">
          <table className="admin-table">
          <thead>
            <tr>
              {SORTABLE_COLUMNS.map((col) => (
                <th key={col.key}>
                  <button
                    type="button"
                    className={`th-sort ${ordering === col.key || ordering === `-${col.key}` ? "th-sort-active" : ""}`}
                    onClick={() => toggleOrdering(col.key)}
                  >
                    {t(col.labelKey)}
                    <span className="th-sort-indicator">
                      {ordering === col.key ? "▲" : ordering === `-${col.key}` ? "▼" : ""}
                    </span>
                  </button>
                </th>
              ))}
              <th aria-label={t("admin.members.actions")} style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = STATUS_META[row.status] || { labelKey: "admin.applicants.inProgress", css: "status-probation" };
              return (
                <tr key={row.id}>
                  <td data-label={t("admin.applicants.name")}>{row.full_name}</td>
                  <td data-label={t("admin.applicants.email")}>{row.email}</td>
                  <td data-label={t("admin.applicants.role")}>{row.role_interest_title || t("admin.applicants.notSpecified")}</td>
                  <td data-label={t("admin.applicants.submitted")}>{formatDate(row.submitted_at)}</td>
                  <td data-label={t("admin.applicants.status")}>
                    <span className={`status-tag ${status.css}`}>{t(status.labelKey)}</span>
                  </td>
                  <td className="admin-row-actions" data-label={t("admin.members.actions")}>
                    <Link to={`/admin/archive/${row.id}`}>{t("admin.applicants.view")}</Link>
                    <button className="link-button" onClick={() => handleDelete(row)}>
                      {t("admin.applicants.delete")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {!loading && !error && count > 0 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("admin.applicants.prev")}
          </button>
          <span className="admin-pagination-info">
            {t("admin.applicants.page", { page, total: totalPages })}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("admin.applicants.next")}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}