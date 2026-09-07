import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function About() {
  const { lang, t } = useLanguage();
  const [leadership, setLeadership] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    endpoints.commandLeadership().then(setLeadership);
    endpoints.affiliations().then(setAffiliations);
    endpoints.partners().then(setPartners);
  }, [lang]);

  return (
    <>
      <PageHero
        eyebrow={t("about.hero.eyebrow")}
        title={t("about.hero.title")}
        lede={t("about.hero.lede")}
      />

      <section className="section">
        <div className="container two-col">
          <div>
            <h2 style={{ marginBottom: 14 }}>{t("about.mission.title")}</h2>
            <p>{t("about.mission.body")}</p>
          </div>
          <div>
            <h2 style={{ marginBottom: 14 }}>{t("about.affiliations.title")}</h2>
            <p>{t("about.affiliations.body")}</p>
            <ul style={{ color: "var(--text-dim)", paddingLeft: 18 }}>
              {affiliations.map((a) => (
                <li key={a.id}>{a.url ? <a href={a.url}>{a.name}</a> : a.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("about.leadership.title")}</h2>
          </div>
          <div className="grid-3">
            {leadership.length === 0 && <p className="empty-note">{t("about.leadership.empty")}</p>}
            {leadership.map((m) => (
              <div className="tile" key={m.id}>
                <h3>{m.name}</h3>
                <span className="tile-tag" style={{ marginTop: 0 }}>
                  {m.role_title}
                </span>
                {m.hierarchy_name && (
                  <span className="tile-tag tile-tag-secondary" style={{ marginTop: 4 }}>
                    {m.hierarchy_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("about.partners.title")}</h2>
          </div>
          {partners.length === 0 && <p className="empty-note">{t("about.partners.empty")}</p>}
          {partners.map((p) => (
            <div className="record-row" key={p.id}>
              <span className="record-date">{p.partner_type_display}</span>
              <span className="record-title">{p.url ? <a href={p.url}>{p.name}</a> : p.name}</span>
              <span />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
