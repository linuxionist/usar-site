import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminEndpoints } from "../api.js";
import { CRUD_CONFIG } from "../crudConfig.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

function formatCell(value, type, yesLabel, noLabel) {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "boolean") return value ? yesLabel : noLabel;
  if (type === "number") return Number(value).toLocaleString();
  return String(value);
}

export default function ResourceList() {
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const { resource } = useParams();
  const config = CRUD_CONFIG[resource];
  const endpoint = adminEndpoints[config.endpointKey];

  const pageSize = config.pageSize ?? 20;
  const sortable = config.sortable ?? false;
  const filters = config.filters ?? [];

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onApply = async () => {
      const next = {};
      for (const f of filters) {
        if (!f.options?.endpointKey) continue;
        try {
          const data = await adminEndpoints[f.options.endpointKey].list({ page_size: 100 });
          const list = data.results ?? data;
          const labelField = f.options.labelField ?? "name";
          next[f.param] = list.map((item) => ({
            value: item.id,
            label: item[labelField] ?? item.id,
          }));
        } catch {
          next[f.param] = [];
        }
      }
      setFilterOptions(next);
    };
    onApply();
  }, [resource]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = { page, page_size: pageSize };
    if (search) params.search = search;
    if (ordering) params.ordering = ordering;
    for (const [key, value] of Object.entries(filterValues)) {
      if (value !== "") params[key] = value;
    }
    endpoint
      .list(params)
      .then((data) => {
        const list = data.results ?? data;
        setRows(list);
        setCount(data.count ?? list.length);
      })
      .catch(() => setError(t("admin.resource.loadError")))
      .finally(() => setLoading(false));
  }, [endpoint, page, pageSize, search, ordering, filterValues]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  function toggleOrdering(key) {
    setPage(1);
    setOrdering((current) => {
      if (current === key) return `-${key}`;
      if (current === `-${key}`) return "";
      return key;
    });
  }

  function sortKeyFor(col) {
    return col.sortKey ?? col.key;
  }

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  async function handleDelete(row) {
    const name = row[config.listColumns[0]?.key] ?? row.id;
    if (!window.confirm(t("admin.resource.deleteConfirm", { name }))) return;
    await endpoint.remove(row.id);
    load();
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>
          {t(config.title)} ({count})
        </h2>
        <Link to={`/admin/content/${resource}/new`} className="btn btn-primary">
          {t("admin.resource.add", { noun: t(config.noun) })}
        </Link>
      </div>

      <div className="admin-toolbar">
        <input
          className="admin-search"
          placeholder={t("admin.resource.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {filters.map((f) => (
          <select
            key={f.param}
            value={filterValues[f.param] ?? ""}
            onChange={(e) => {
              setFilterValues((prev) => ({ ...prev, [f.param]: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">{t(f.label)}</option>
            {(filterOptions[f.param] ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      {loading && <p className="loading-note">{t("admin.resource.loading")}</p>}
      {error && <p className="empty-note">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="empty-note">{t("admin.resource.empty")}</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="admin-table-scroll">
          <table className="admin-table">
          <thead>
            <tr>
              {config.listColumns.map((col) => (
                <th key={col.key}>
                  {sortable ? (
                    <button
                      type="button"
                      className={`th-sort ${ordering === sortKeyFor(col) || ordering === `-${sortKeyFor(col)}` ? "th-sort-active" : ""}`}
                      onClick={() => toggleOrdering(sortKeyFor(col))}
                    >
                      {t(col.label || col.key)}
                      <span className="th-sort-indicator">
                        {ordering === sortKeyFor(col) ? "▲" : ordering === `-${sortKeyFor(col)}` ? "▼" : ""}
                      </span>
                    </button>
                  ) : (
                    t(col.label || col.key)
                  )}
                </th>
              ))}
              <th aria-label={t("admin.resource.actions")} style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {config.listColumns.map((col, idx) => (
                  <td key={col.key} data-label={t(col.label || col.key)}>
                    {idx === 0 ? (
                      <Link to={`/admin/content/${resource}/${row.id}`}>
                        {formatCell(row[col.key], col.type, t("admin.resource.yes"), t("admin.resource.no"))}
                      </Link>
                    ) : (
                      formatCell(row[col.key], col.type, t("admin.resource.yes"), t("admin.resource.no"))
                    )}
                  </td>
                ))}
                <td className="admin-row-actions" data-label={t("admin.resource.actions")}>
                  <Link to={`/admin/content/${resource}/${row.id}`}>{t("admin.resource.edit")}</Link>
                  <button className="link-button" onClick={() => handleDelete(row)}>
                    {t("admin.resource.delete")}
                  </button>
                </td>
              </tr>
            ))}
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
            {t("admin.resource.prev")}
          </button>
          <span className="admin-pagination-info">
            {t("admin.resource.page", { page, total: totalPages })}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("admin.resource.next")}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}