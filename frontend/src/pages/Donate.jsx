import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Donate() {
  const { lang, t } = useLanguage();
  const [needs, setNeeds] = useState([]);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    endpoints.fundingNeeds().then(setNeeds);
    endpoints.sponsorshipTiers().then(setTiers);
  }, [lang]);

  return (
    <>
      <PageHero
        eyebrow={t("donate.hero.eyebrow")}
        title={t("donate.hero.title")}
        lede={t("donate.hero.lede")}
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>{t("donate.wishlist.title")}</h2>
          </div>
          {needs.length === 0 && <p className="empty-note">{t("donate.wishlist.empty")}</p>}
          <div className="grid-2">
            {needs.map((n) => (
              <div className="tile" key={n.id}>
                <h3>{n.item}</h3>
                <p>{n.description}</p>
                <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                  ${Number(n.cost_estimate).toLocaleString()}
                  {n.is_fulfilled && t("donate.wishlist.fulfilled")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>{t("donate.sponsorship.title")}</h2>
          </div>
          <div className="grid-3">
            {tiers.map((tier) => (
              <div className="tile" key={tier.id}>
                <h3>{tier.name}</h3>
                <p style={{ color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                  ${Number(tier.annual_amount).toLocaleString()}/yr
                </p>
                <ul style={{ color: "var(--text-dim)", paddingLeft: 18, margin: "10px 0 0" }}>
                  {(tier.benefits_list || []).map((b, i) => (
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
