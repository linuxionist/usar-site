import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { endpoints } from "../api/client.js";
import StatusDot from "../components/StatusDot.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Home() {
  const { lang, t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [news, setNews] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      endpoints.status(),
      endpoints.impactMetrics(),
      endpoints.capabilities(),
      endpoints.news(),
    ])
      .then(([statusData, metricsData, capabilitiesData, newsData]) => {
        setStatus(statusData);
        setMetrics(metricsData);
        setCapabilities(capabilitiesData.slice(0, 5));
        setNews(newsData.slice(0, 4));
      })
      .catch(() => setError(true));
  }, [lang]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="hero-eyebrow">{t("home.hero.eyebrow")}</div>
            <h1>{t("home.hero.title")}</h1>
            <p className="lede">{t("home.hero.lede")}</p>
            <div className="hero-actions">
              <Link to="/join" className="btn btn-primary">
                {t("home.hero.join")}
              </Link>
              <Link to="/capabilities" className="btn btn-outline">
                {t("home.hero.capabilities")}
              </Link>
            </div>
          </div>

          <div className="readout">
            <div className="readout-title">{t("home.status.title")}</div>
            {status ? (
              <StatusDot status={status.status} label={status.status_display} />
            ) : (
              <p className="loading-note">{t("home.status.loading")}</p>
            )}
            {status?.note && <p style={{ marginTop: -8, marginBottom: 18 }}>{status.note}</p>}
            <div className="metric-grid">
              {metrics.length
                ? metrics.map((m) => (
                    <div key={m.id}>
                      <div className="metric-value">{m.value}</div>
                      <div className="metric-label">{m.label}</div>
                    </div>
                  ))
                : !error && <p className="loading-note">{t("home.metrics.loading")}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("home.capabilities.title")}</h2>
            <Link to="/capabilities" className="link-more">
              {t("home.capabilities.more")}
            </Link>
          </div>
          <div className="grid-3">
            {capabilities.length
              ? capabilities.map((c) => (
                  <div className="tile" key={c.id}>
                    <span className="tile-tag">{c.category_display}</span>
                    <h3>{c.title}</h3>
                    <p>{c.summary}</p>
                  </div>
                ))
              : !error && <p className="loading-note">{t("home.capabilities.loading")}</p>}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("home.news.latest")}</h2>
            <Link to="/deployments" className="link-more">
              {t("home.news.fullArchive")}
            </Link>
          </div>
          {news.length
            ? news.map((n) => (
                <div className="record-row" key={n.id}>
                  <span className="record-date">
                    {new Date(n.published_at).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="record-title">{n.title}</span>
                  <span className="pill">{n.category_display}</span>
                </div>
              ))
            : !error && <p className="loading-note">{t("home.news.loadingRecent")}</p>}
          {error && <p className="empty-note">{t("home.news.error")}</p>}
        </div>
      </section>
    </>
  );
}
