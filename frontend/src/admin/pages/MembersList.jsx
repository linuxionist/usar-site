import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

export default function MembersList() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const [members, setMembers] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    adminEndpoints.memberStatuses
      .list()
      .then((data) => setStatuses(data.results ?? data))
      .catch(() => setStatuses([]));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    adminEndpoints
      .listMembers(params)
      .then((data) => {
        setMembers(data.results ?? data);
        setCount(data.count ?? (data.results ?? data).length);
      })
      .catch(() => setError(t("admin.members.loadError")))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleDelete(member) {
    if (!window.confirm(t("admin.members.removeConfirm", { name: member.full_name }))) return;
    await adminEndpoints.deleteMember(member.id);
    load();
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>{t("admin.members.title")} ({count})</h2>
        <Link to="/admin/members/new" className="btn btn-primary">
          {t("admin.members.add")}
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder={t("admin.members.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t("admin.members.allStatuses")}</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.status}>
              {s.label || s.status}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="loading-note">{t("admin.members.loading")}</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p className="empty-note">{t("admin.members.empty")}</p>
      )}

      {!loading && members.length > 0 && (
        <div className="admin-table-scroll">
          <table className="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>{t("admin.members.name")}</th>
              <th>{t("admin.members.role")}</th>
              <th>{t("admin.members.status")}</th>
              <th>{t("admin.members.joined")}</th>
              <th>{t("admin.members.email")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td style={{ width: 48 }}>
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.full_name}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "50%" }}
                    />
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--surface-2, #334155)",
                      }}
                    />
                  )}
                </td>
                <td data-label={t("admin.members.name")}>
                  <Link to={`/admin/members/${m.id}`}>{m.full_name}</Link>
                </td>
                <td data-label={t("admin.members.role")}>{m.role_title || "—"}</td>
                <td data-label={t("admin.members.status")}>
                  <span className={`status-tag status-${m.status}`}>{m.status_display}</span>
                </td>
                <td data-label={t("admin.members.joined")}>{m.joined_date}</td>
                <td data-label={t("admin.members.email")}>{m.email}</td>
                <td className="admin-row-actions" data-label={t("admin.members.actions")}>
                  <Link to={`/admin/members/${m.id}`}>{t("admin.members.edit")}</Link>
                  <button className="link-button" onClick={() => handleDelete(m)}>
                    {t("admin.members.remove")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </AdminLayout>
  );
}
