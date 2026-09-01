import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function Capabilities() {
  const [capabilities, setCapabilities] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    endpoints
      .capabilities()
      .then(setCapabilities)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Operational Capabilities"
        title="Five disciplines, one integrated task force."
        lede="Each specialty trains and certifies independently, then deploys together under a single incident command structure."
      />
      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          {!loaded && <p className="loading-note">Loading capabilities…</p>}
          {loaded && !capabilities.length && (
            <p className="empty-note">No capabilities published yet.</p>
          )}
          <div className="grid-2">
            {capabilities.map((c) => (
              <div className="tile" key={c.id}>
                <span className="tile-tag">{c.category_display}</span>
                <h3>{c.title}</h3>
                <p>{c.description || c.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
