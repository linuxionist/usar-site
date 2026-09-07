import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Capabilities() {
  const { lang, t } = useLanguage();
  const [capabilities, setCapabilities] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    endpoints
      .capabilities()
      .then(setCapabilities)
      .finally(() => setLoaded(true));
  }, [lang]);

  return (
    <>
      <PageHero
        eyebrow={t("capabilities.hero.eyebrow")}
        title={t("capabilities.hero.title")}
        lede={t("capabilities.hero.lede")}
      />
      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          {!loaded && <p className="loading-note">{t("capabilities.loading")}</p>}
          {loaded && !capabilities.length && (
            <p className="empty-note">{t("capabilities.empty")}</p>
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
