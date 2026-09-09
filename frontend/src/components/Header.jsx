import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../admin/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { USFlag, SpainFlag } from "./flags.jsx";

function UserMenu({ user, logout, t }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="header-admin" ref={wrapRef}>
      <button
        type="button"
        className="header-user"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {user.username || t("cta.admin")}
        <span className={`header-user-caret${open ? " open" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="header-user-menu" role="menu">
          <NavLink
            to={user.is_staff ? "/admin/members" : "/member/profile"}
            role="menuitem"
            onClick={close}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {user.is_staff ? t("cta.admin") : t("cta.portal")}
          </NavLink>
          <button type="button" role="menuitem" onClick={() => { close(); logout(); }}>
            {t("cta.signout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const NAV_LINKS = [
    { to: "/about", label: t("nav.about") },
    { to: "/capabilities", label: t("nav.capabilities") },
    { to: "/deployments", label: t("nav.deployments") },
    { to: "/join", label: t("nav.join") },
    { to: "/donate", label: t("nav.donate") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <>
      <div className="dispatch-banner">
        <div className="container">
          <span>{t("banner.hotline")}</span>
          <NavLink to="/contact">{t("banner.dispatch")}</NavLink>
        </div>
      </div>
      <header className="site-header">
        <div className="container">
          <NavLink to="/" className="brand">
            <img src="/images/USAR-LOGO.png" alt={`${t("brand.mark")} logo`} className="brand-logo" />
            <span className="brand-text">
              <span className="brand-mark">{t("brand.mark")}</span>
              <span className="brand-sub">{t("brand.sub")}</span>
            </span>
          </NavLink>
          <nav className={`main-nav${navOpen ? " open" : ""}`} aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="nav-mobile-extra">
              {user ? (
                <button
                  type="button"
                  className="nav-mobile-link"
                  onClick={() => {
                    setNavOpen(false);
                    logout();
                  }}
                >
                  {t("cta.signout")} ({user.username})
                </button>
              ) : (
                <NavLink
                  to="/admin/login"
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {t("cta.signin")}
                </NavLink>
              )}
            </div>
          </nav>
          <div className="header-ctas">
            <button
              type="button"
              className="lang-toggle"
              aria-label={lang === "en" ? t("lang.switch.es") : t("lang.switch.en")}
              title={lang === "en" ? t("lang.switch.es") : t("lang.switch.en")}
              onClick={() => setLang(lang === "en" ? "es" : "en")}
            >
              {lang === "en" ? <USFlag className="lang-flag" /> : <SpainFlag className="lang-flag" />}
            </button>
            {user ? (
              <UserMenu user={user} logout={logout} t={t} />
            ) : (
              <NavLink to="/admin/login" className="btn btn-ghost desktop-signin">
                {t("cta.signin")}
              </NavLink>
            )}
          </div>
          <button
            type="button"
            className={`nav-toggle${navOpen ? " open" : ""}`}
            aria-expanded={navOpen}
            aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setNavOpen((v) => !v)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </header>
    </>
  );
}