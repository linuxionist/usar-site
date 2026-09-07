import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../admin/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

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
            to="/admin/members"
            role="menuitem"
            onClick={close}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {t("cta.admin")}
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
            <span className="brand-mark">Ridgeline Task Force</span>
            <span className="brand-sub">Urban Search &amp; Rescue</span>
          </NavLink>
          <nav className="main-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-ctas">
            <button type="button" className="lang-toggle" onClick={() => setLang(lang === "en" ? "es" : "en")}>
              {lang === "en" ? "ES" : "EN"}
            </button>
            <NavLink to="/donate" className="btn btn-outline">
              {t("cta.donate")}
            </NavLink>
            {user && user.is_staff ? (
              <UserMenu user={user} logout={logout} t={t} />
            ) : (
              <NavLink to="/admin/login" className="btn btn-ghost">
                {t("cta.signin")}
              </NavLink>
            )}
            <NavLink to="/join" className="btn btn-primary">
              {t("cta.join")}
            </NavLink>
          </div>
        </div>
      </header>
    </>
  );
}