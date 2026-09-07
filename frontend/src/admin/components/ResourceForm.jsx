import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import { adminEndpoints } from "../api.js";
import { CRUD_CONFIG } from "../crudConfig.js";

function buildInitial(config) {
  const data = {};
  for (const p of config.pairs) {
    data[p.en] = "";
    data[p.es] = "";
  }
  for (const s of config.singles) {
    data[s.name] = s.type === "checkbox" ? false : "";
  }
  return data;
}

export default function ResourceForm() {
  const { resource, id } = useParams();
  const config = CRUD_CONFIG[resource];
  const endpoint = adminEndpoints[config.endpointKey];
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(() => buildInitial(config));
  const [refOptions, setRefOptions] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load dynamic option lists for "reference"-type fields (e.g. a role's hierarchy).
    const refs = config.singles.filter((s) => s.type === "reference");
    if (refs.length === 0) return;
    let cancelled = false;
    Promise.all(
      refs.map((s) =>
        adminEndpoints[s.endpointKey]
          .list()
          .then((data) => ({ name: s.name, rows: data.results ?? data }))
          .catch(() => ({ name: s.name, rows: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      for (const r of results) next[r.name] = r.rows;
      setRefOptions(next);
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    if (!isEditing) return;
    endpoint
      .get(id)
      .then((data) => {
        const next = { ...buildInitial(config) };
        for (const p of config.pairs) {
          next[p.en] = data[p.en] ?? "";
          next[p.es] = data[p.es] ?? "";
        }
        for (const s of config.singles) {
          next[s.name] = data[s.name] ?? (s.type === "checkbox" ? false : "");
        }
        setForm(next);
      })
      .catch(() => setError("Unable to load this record."))
      .finally(() => setLoading(false));
  }, [id, isEditing, endpoint, config]);

  function handleChange(e) {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm({ ...form, [target.name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const payload = { ...form };
    try {
      if (isEditing) {
        await endpoint.update(id, payload);
        setSuccess(true);
      } else {
        const created = await endpoint.create(payload);
        navigate(`/admin/content/${resource}/${created.id}`, { replace: true });
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Unable to save this record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>
          {isEditing ? `Edit ${config.noun}` : `Add ${config.noun}`}
        </h2>
        <Link to={`/admin/content/${resource}`} className="link-more">
          ← Back to {config.title.toLowerCase()}
        </Link>
      </div>

      {loading ? (
        <p className="loading-note">Loading…</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          {config.pairs.map((p) => (
            <div key={p.en} className="field full">
              <label>{p.label}</label>
              <div className="lang-pair">
                <div className="field half">
                  <label className="lang-tag">EN</label>
                  {renderInput(p.type, p.en, form[p.en], handleChange, {}, refOptions)}
                </div>
                <div className="field half">
                  <label className="lang-tag">ES</label>
                  {renderInput(p.type, p.es, form[p.es], handleChange, {}, refOptions)}
                </div>
              </div>
            </div>
          ))}

          {config.singles.map((s) => (
            <div key={s.name} className={`field ${s.type === "textarea" ? "full" : ""}`}>
              <label htmlFor={s.name}>{s.label}</label>
              {renderInput(s.type, s.name, form[s.name], handleChange, s, refOptions)}
            </div>
          ))}

          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save Changes" : `Add ${config.noun}`}
            </button>
            {error && <p className="form-status error" style={{ margin: 0 }}>{error}</p>}
            {success && <p className="form-status" style={{ margin: 0 }}>Saved.</p>}
          </div>
        </form>
      )}
    </AdminLayout>
  );
}

const INPUT_TYPES = { datetime: "datetime-local", date: "date", number: "number", url: "url", email: "email" };

function renderInput(type, name, value, onChange, extra = {}, refOptions) {
  if (type === "checkbox") {
    return <input type="checkbox" name={name} checked={Boolean(value)} onChange={onChange} />;
  }
  if (type === "textarea") {
    return <textarea name={name} value={value} onChange={onChange} />;
  }
  if (type === "reference") {
    const options = refOptions?.[name] || [];
    return (
      <select name={name} value={value} onChange={onChange} required={extra.required}>
        <option value="">{extra.placeholder || "Select…"}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    );
  }
  if (type === "select") {
    return (
      <select name={name} value={value} onChange={onChange}>
        {extra.options.map(([val, label]) => (
          <option key={val} value={val}>
            {label}
          </option>
        ))}
      </select>
    );
  }
  const inputType = type === "text" ? "text" : INPUT_TYPES[type] || "text";
  return <input type={inputType} name={name} value={value} onChange={onChange} />;
}
