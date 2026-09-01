import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function About() {
  const [leadership, setLeadership] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    endpoints.leadership().then(setLeadership);
    endpoints.affiliations().then(setAffiliations);
    endpoints.partners().then(setPartners);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Twenty-seven years of technical rescue response."
        lede="Ridgeline Task Force organizes trained volunteers into a deployable, standards-aligned rescue capability for our region and mutual-aid partners."
      />

      <section className="section">
        <div className="container two-col">
          <div>
            <h2 style={{ marginBottom: 14 }}>Mission &amp; Values</h2>
            <p>
              We exist to locate, stabilize, and extract survivors of structural collapse and
              disaster events, and to do so safely, quickly, and in close coordination with
              local emergency management.
            </p>
          </div>
          <div>
            <h2 style={{ marginBottom: 14 }}>Affiliations &amp; Standards</h2>
            <p>
              Our training and equipment are aligned with the following governing bodies and
              standards:
            </p>
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
            <h2>Command &amp; Leadership</h2>
          </div>
          <div className="grid-3">
            {leadership.length === 0 && <p className="empty-note">Leadership roster coming soon.</p>}
            {leadership.map((m) => (
              <div className="tile" key={m.id}>
                <h3>{m.name}</h3>
                <span className="tile-tag" style={{ marginTop: 0 }}>
                  {m.role_title}
                </span>
                <p>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>Partners &amp; Mutual Aid</h2>
          </div>
          {partners.length === 0 && <p className="empty-note">Partner list coming soon.</p>}
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
