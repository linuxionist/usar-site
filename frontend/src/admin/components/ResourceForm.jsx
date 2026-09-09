import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "./AdminLayout.jsx";
import MapDrawField from "./MapDrawField.jsx";
import { adminEndpoints } from "../api.js";
import { CRUD_CONFIG } from "../crudConfig.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

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
  const { lang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
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
      .catch(() => setError(t("admin.resource.loadRecordError")))
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
    if (payload.map_area === "" || payload.map_area === null) delete payload.map_area;
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
      setError(data ? Object.values(data).flat().join(" ") : t("admin.resource.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>
          {isEditing
            ? t("admin.resource.editNoun", { noun: t(config.noun) })
            : t("admin.resource.add", { noun: t(config.noun) })}
        </h2>
        <Link to={`/admin/content/${resource}`} className="link-more">
          {t("admin.resource.back", { title: t(config.title) })}
        </Link>
      </div>

      {loading ? (
        <p className="loading-note">{t("admin.resource.loading")}</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          {config.pairs.map((p) => (
            <div key={p.en} className="field full">
              <label>{t(p.label)}</label>
              <div className="lang-pair">
                <div className="field half">
                  <label className="lang-tag">EN</label>
                  {renderInput(p.type, p.en, form[p.en], handleChange, {}, refOptions, t)}
                </div>
                <div className="field half">
                  <label className="lang-tag">ES</label>
                  {renderInput(p.type, p.es, form[p.es], handleChange, {}, refOptions, t)}
                </div>
              </div>
            </div>
          ))}

          {config.singles.map((s) => (
            <div key={s.name} className={`field ${s.type === "textarea" || s.type === "map" ? "full" : ""}`}>
              <label htmlFor={s.name}>{t(s.label)}</label>
              {renderInput(s.type, s.name, form[s.name], handleChange, s, refOptions, t)}
            </div>
          ))}

          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? t("admin.resource.saving")
                : isEditing
                  ? t("admin.resource.saveChanges")
                  : t("admin.resource.add", { noun: t(config.noun) })}
            </button>
            {error && <p className="form-status error" style={{ margin: 0 }}>{error}</p>}
            {success && <p className="form-status" style={{ margin: 0 }}>{t("admin.resource.saved")}</p>}
          </div>
        </form>
      )}
    </AdminLayout>
  );
}

const INPUT_TYPES = { datetime: "datetime-local", date: "date", number: "number", url: "url", email: "email" };

function renderInput(type, name, value, onChange, extra = {}, refOptions, t = (k) => k) {
  if (type === "map") {
    return (
      <MapDrawField
        value={value || null}
        onChange={(geo) => onChange({ target: { name, value: geo } })}
      />
    );
  }
  if (type === "checkbox") {
    return <input type="checkbox" name={name} checked={Boolean(value)} onChange={onChange} />;
  }
  if (type === "textarea") {
    return <textarea name={name} value={value} onChange={onChange} />;
  }
  if (type === "reference") {
    const options = refOptions?.[name] || [];
    const valueKey = extra.valueField || "id";
    const labelKey = extra.labelField || "name";
    return (
      <select name={name} value={value} onChange={onChange} required={extra.required}>
        <option value="">{t(extra.placeholder || "Select…")}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt[valueKey]}>
            {opt[labelKey] ?? opt.status ?? opt.name ?? opt.id}
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
            {t(label)}
          </option>
        ))}
      </select>
    );
  }
  const inputType = type === "text" ? "text" : INPUT_TYPES[type] || "text";
  return <input type={inputType} name={name} value={value} onChange={onChange} />;
}
