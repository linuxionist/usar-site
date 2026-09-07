import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Ridgeline Task Force</h4>
            <p>{t("footer.description")}</p>
          </div>
          <div>
            <h4>{t("footer.org")}</h4>
            <Link to="/about">{t("footer.about")}</Link>
            <Link to="/capabilities">{t("footer.capabilities")}</Link>
            <Link to="/deployments">{t("footer.archive")}</Link>
          </div>
          <div>
            <h4>{t("footer.involved")}</h4>
            <Link to="/join">{t("footer.volunteer")}</Link>
            <Link to="/donate">{t("footer.sponsor")}</Link>
          </div>
          <div>
            <h4>{t("footer.contact")}</h4>
            <Link to="/contact">{t("footer.inquiries")}</Link>
            <Link to="/contact">{t("footer.media")}</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Ridgeline Task Force. {t("footer.rights")}</span>
          <span>{t("footer.hq")}</span>
        </div>
      </div>
    </footer>
  );
}
