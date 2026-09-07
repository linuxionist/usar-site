import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";

const PAGE_SIZE = 10;

const STATUS_META = {
  active: { label: "Active", css: "status-active" },
  in_progress: { label: "In progress", css: "status-probation" },
  rejected: { label: "Rejected", css: "status-rejected" },
};

const SORTABLE_COLUMNS = [
  { key: "full_name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role_interest__title", label: "Interested role" },
  { key: "submitted_at", label: "Submitted" },
  { key: "status", label: "Status" },
];

export default function ApplicantsList() {
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
      .catch(() => setError("Unable to load applications."))
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
    if (!window.confirm(`Delete application from ${row.full_name}?`)) return;
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
          Archive ({count})
        </h2>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Search by name, email, ID, phone, country…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select value={reviewed} onChange={(e) => { setReviewed(e.target.value); setPage(1); }}>
          <option value="">All applications</option>
          <option value="false">Not reviewed</option>
          <option value="true">Reviewed</option>
        </select>
      </div>

      {loading && <p className="loading-note">Loading applications…</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="empty-note">No applications match your filters.</p>
      )}

      {!loading && rows.length > 0 && (
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
                    {col.label}
                    <span className="th-sort-indicator">
                      {ordering === col.key ? "▲" : ordering === `-${col.key}` ? "▼" : ""}
                    </span>
                  </button>
                </th>
              ))}
              <th aria-label="Actions" style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = STATUS_META[row.status] || { label: "In progress", css: "status-probation" };
              return (
                <tr key={row.id}>
                  <td>{row.full_name}</td>
                  <td>{row.email}</td>
                  <td>{row.role_interest_title || "Not specified"}</td>
                  <td>{formatDate(row.submitted_at)}</td>
                  <td>
                    <span className={`status-tag ${status.css}`}>{status.label}</span>
                  </td>
                  <td className="admin-row-actions">
                    <Link to={`/admin/archive/${row.id}`}>View</Link>
                    <button className="link-button" onClick={() => handleDelete(row)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && !error && count > 0 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="admin-pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </AdminLayout>
  );
}