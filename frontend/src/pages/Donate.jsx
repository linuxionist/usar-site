import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function Donate() {
  const [needs, setNeeds] = useState([]);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    endpoints.fundingNeeds().then(setNeeds);
    endpoints.sponsorshipTiers().then(setTiers);
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Support &amp; Donate"
        title="Every donation funds specific, itemized equipment."
        lede="We publish exactly what your contribution buys — from sonar life-detection units to K9 protective gear."
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Wishlist / Needed Assets</h2>
          </div>
          {needs.length === 0 && <p className="empty-note">Wishlist coming soon.</p>}
          <div className="grid-2">
            {needs.map((n) => (
              <div className="tile" key={n.id}>
                <h3>{n.item}</h3>
                <p>{n.description}</p>
                <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                  ${Number(n.cost_estimate).toLocaleString()}
                  {n.is_fulfilled && " — Fulfilled"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>Sponsorship Opportunities</h2>
          </div>
          <div className="grid-3">
            {tiers.map((t) => (
              <div className="tile" key={t.id}>
                <h3>{t.name}</h3>
                <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                  ${Number(t.annual_amount).toLocaleString()}/yr
                </p>
                <ul style={{ color: "var(--text-dim)", paddingLeft: 18, margin: "10px 0 0" }}>
                  {(t.benefits_list || []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
