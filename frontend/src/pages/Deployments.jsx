import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Deployments() {
  const { lang, t } = useLanguage();
  const [deployments, setDeployments] = useState([]);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    endpoints.deployments().then(setDeployments);
    endpoints.trainingExercises().then(setExercises);
  }, [lang]);

  const active = deployments.filter((d) => d.status === "active");
  const archive = deployments.filter((d) => d.status !== "active");

  const fmtDate = (dateStr) => {
    if (!dateStr) return "—";
    // Date-only values (YYYY-MM-DD) are parsed as local so we don't shift a day.
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const d = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : new Date(dateStr);
    return d.toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <>
      <PageHero
        eyebrow={t("deployments.hero.eyebrow")}
        title={t("deployments.hero.title")}
        lede={t("deployments.hero.lede")}
      />

      {active.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>{t("deployments.active.title")}</h2>
            </div>
            {active.map((d) => (
              <div className="record-row" key={d.id}>
                <span className="record-date">{fmtDate(d.start_date)}</span>
                <span className="record-title">
                  {d.name} — {d.location}
                </span>
                <span className="pill active">{t("deployments.active.pill")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("deployments.archive.title")}</h2>
          </div>
          {archive.length === 0 && <p className="empty-note">{t("deployments.archive.empty")}</p>}
          {archive.map((d) => (
            <div className="record-row" key={d.id}>
              <span className="record-date">{fmtDate(d.start_date)}</span>
              <span className="record-title">
                {d.name} — {d.location}
              </span>
              <span className="pill">{d.status_display}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("deployments.training.title")}</h2>
          </div>
          {exercises.length === 0 && <p className="empty-note">{t("deployments.training.empty")}</p>}
          {exercises.map((e) => (
            <div className="record-row" key={e.id}>
              <span className="record-date">{fmtDate(e.date)}</span>
              <span className="record-title">{e.title}</span>
              <span className="pill">{e.partner_agencies || t("deployments.internal")}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
