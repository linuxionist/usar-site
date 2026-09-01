import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "probation", label: "Probationary" },
  { value: "leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
];

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    adminEndpoints
      .listMembers(params)
      .then((data) => {
        setMembers(data.results ?? data);
        setCount(data.count ?? (data.results ?? data).length);
      })
      .catch(() => setError("Unable to load members."))
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleDelete(member) {
    if (!window.confirm(`Remove ${member.full_name} from the roster?`)) return;
    await adminEndpoints.deleteMember(member.id);
    load();
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>Members ({count})</h2>
        <Link to="/admin/members/new" className="btn btn-primary">
          Add Member
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder="Search by name, email, certification…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-note">Loading members…</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="empty-note">No members match your filters.</p>
      )}

      {!loading && members.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Email</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.full_name}</td>
                <td>{m.role_title || "—"}</td>
                <td>
                  <span className={`status-tag status-${m.status}`}>{m.status_display}</span>
                </td>
                <td>{m.joined_date}</td>
                <td>{m.email}</td>
                <td className="admin-row-actions">
                  <Link to={`/admin/members/${m.id}`}>Edit</Link>
                  <button className="link-button" onClick={() => handleDelete(m)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
