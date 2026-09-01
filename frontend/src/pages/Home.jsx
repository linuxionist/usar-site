import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { endpoints } from "../api/client.js";
import StatusDot from "../components/StatusDot.jsx";

export default function Home() {
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
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="hero-eyebrow">Urban Search &amp; Rescue</div>
            <h1>Specialized technical rescue when seconds count.</h1>
            <p className="lede">
              Ridgeline Task Force is a FEMA-aligned volunteer team providing structural
              collapse, canine search, and technical rescue response to our region and
              mutual-aid partners nationwide.
            </p>
            <div className="hero-actions">
              <Link to="/join" className="btn btn-primary">
                Join the Team
              </Link>
              <Link to="/capabilities" className="btn btn-outline">
                See Our Capabilities
              </Link>
            </div>
          </div>

          <div className="readout">
            <div className="readout-title">CURRENT STATUS</div>
            {status ? (
              <StatusDot status={status.status} label={status.status_display} />
            ) : (
              <p className="loading-note">Loading status…</p>
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
                : !error && <p className="loading-note">Loading metrics…</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Core Capabilities</h2>
            <Link to="/capabilities" className="link-more">
              Full capability roster →
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
              : !error && <p className="loading-note">Loading capabilities…</p>}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>Latest News &amp; Dispatch Logs</h2>
            <Link to="/deployments" className="link-more">
              Full deployment archive →
            </Link>
          </div>
          {news.length
            ? news.map((n) => (
                <div className="record-row" key={n.id}>
                  <span className="record-date">
                    {new Date(n.published_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="record-title">{n.title}</span>
                  <span className="pill">{n.category_display}</span>
                </div>
              ))
            : !error && <p className="loading-note">Loading recent updates…</p>}
          {error && (
            <p className="empty-note">
              Unable to reach the API right now. Confirm the Django backend is running at the
              address configured in VITE_API_BASE_URL.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
