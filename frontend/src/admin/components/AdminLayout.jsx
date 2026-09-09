import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { RESOURCE_LIST } from "../crudConfig.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { adminT } from "../../i18n/adminTranslations.js";
import { USFlag, SpainFlag } from "../../components/flags.jsx";

const ROSTER_LINKS = [
  { to: "/admin/members", labelKey: "admin.layout.members", label: "Members" },
  { to: "/admin/content/teamRoles", labelKey: "admin.layout.roles", label: "Roles" },
  { to: "/admin/content/hierarchy", labelKey: "admin.layout.hierarchy", label: "Hierarchy" },
];

const APPLICANT_LINKS = [
  { to: "/admin/pipeline", labelKey: "admin.layout.pipeline", label: "Pipeline" },
  { to: "/admin/archive", labelKey: "admin.layout.archive", label: "Archive" },
  { to: "/admin/content/applicantPhases", labelKey: "admin.layout.applicantPhases", label: "Applicant Phases" },
];

function activeSection(pathname) {
  if (
    pathname.startsWith("/admin/members") ||
    pathname.startsWith("/admin/content/teamRoles") ||
    pathname.startsWith("/admin/content/hierarchy")
  ) {
    return "roster";
  }
  if (
    pathname.startsWith("/admin/pipeline") ||
    pathname.startsWith("/admin/archive") ||
    pathname.startsWith("/admin/content/applicantPhases")
  ) {
    return "applicants";
  }
  return "content";
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = (key, vars) => adminT(lang, key, vars);
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = Boolean(user?.is_staff);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState(() => {
    if (!isStaff) return { portal: true };
    const active = activeSection(window.location.pathname);
    return {
      roster: active === "roster",
      applicants: active === "applicants",
      content: active === "content",
    };
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function toggle(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  const SECTIONS = isStaff
    ? [
        {
          key: "roster",
          title: t("admin.layout.section.roster"),
          links: ROSTER_LINKS.map((l) => ({ ...l, label: t(l.labelKey) })),
        },
        {
          key: "applicants",
          title: t("admin.layout.section.applicants"),
          links: APPLICANT_LINKS.map((l) => ({ ...l, label: t(l.labelKey) })),
        },
        {
          key: "content",
          title: t("admin.layout.section.content"),
          links: RESOURCE_LIST.map(([key, label, kind]) =>
            kind === "heading" ? { heading: t(label) } : { to: `/admin/content/${key}`, label: t(label) }
          ),
        },
      ]
    : [
        {
          key: "portal",
          title: t("admin.layout.section.portal"),
          links: [{ to: "/member/profile", label: t("admin.layout.profile") }],
        },
      ];

  return (
    <div className="admin-shell">
      <div
        className={`admin-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className="admin-topbar">
        <span className="admin-topbar-brand">Ridgeline Admin</span>
        <button
          type="button"
          className="lang-toggle"
          aria-label={lang === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
          title={lang === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
          onClick={() => setLang(lang === "en" ? "es" : "en")}
        >
          {lang === "en" ? <USFlag className="lang-flag" /> : <SpainFlag className="lang-flag" />}
        </button>
        <button
          type="button"
          className="admin-menu-toggle"
          aria-label={menuOpen ? t("admin.layout.menu") : t("admin.layout.menu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>

      <aside className={`admin-sidebar${menuOpen ? " admin-sidebar--open" : ""}`}>
        <div className="admin-brand">
          <span className="brand-mark" style={{ fontSize: "1.2rem" }}>
            Ridgeline Admin
          </span>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {SECTIONS.map((section) => (
            <div className="admin-nav-group" key={section.key}>
              <button
                type="button"
                className="admin-nav-dropdown-toggle"
                aria-expanded={openSections[section.key]}
                onClick={() => toggle(section.key)}
              >
                <span>{section.title}</span>
                <span className={`admin-nav-chevron ${openSections[section.key] ? "open" : ""}`}>
                  &#9662;
                </span>
              </button>
              {openSections[section.key] && (
                <div className="admin-nav-dropdown-list">
                  {section.links.map((link) =>
                    link.heading ? (
                      <div key={link.heading} className="admin-nav-heading">
                        {link.heading}
                      </div>
                    ) : (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === "/admin/members" || link.to === "/admin/archive"}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => (isActive ? "active" : undefined)}
                      >
                        {link.label}
                      </NavLink>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">{user?.username}</div>
          <button className="btn btn-outline" onClick={handleLogout}>
            {t("admin.layout.logout")}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="container admin-container">{children}</div>
      </div>
    </div>
  );
}