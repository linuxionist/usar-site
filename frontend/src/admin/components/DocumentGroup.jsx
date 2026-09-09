import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";

export default function DocumentGroup({ label, items, decide }) {
  const { lang } = useLanguage();
  const t = (key) => adminT(lang, key);
  if (!items || items.length === 0) return null;
  return (
    <div className="doc-list">
      <div className="doc-group-label">{label}</div>
      {items.map((d) => (
        <div className="doc-row" key={d.file || d.id}>
          <a href={d.file} target="_blank" rel="noreferrer">
            {d.filename}
          </a>
          <span className={d.approved ? "status-active" : "status-probation"}>
            {d.approved ? t("admin.docs.approved") : t("admin.docs.pending")}
          </span>
          <div className="doc-actions">
            <button className="link-button" onClick={() => decide(d, true)}>
              {t("admin.docs.approve")}
            </button>
            <button className="link-button" onClick={() => decide(d, false)}>
              {t("admin.docs.reject")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}