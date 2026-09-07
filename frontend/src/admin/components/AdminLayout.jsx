import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { RESOURCE_LIST } from "../crudConfig.js";

const ROSTER_LINKS = [
  { to: "/admin/members", label: "Members" },
  { to: "/admin/content/teamRoles", label: "Roles" },
  { to: "/admin/content/hierarchy", label: "Hierarchy" },
];

const APPLICANT_LINKS = [
  { to: "/admin/pipeline", label: "Pipeline" },
  { to: "/admin/archive", label: "Archive" },
  { to: "/admin/content/applicantPhases", label: "Applicant Phases" },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState({
    roster: true,
    applicants: true,
    content: true,
  });

  function toggle(section) {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark" style={{ fontSize: "1.2rem" }}>
            Ridgeline Admin
          </span>
        </div>
        <nav className="admin-nav">
          <button
            type="button"
            className="admin-nav-dropdown-toggle"
            onClick={() => toggle("roster")}
          >
            <span>Roster</span>
            <span className={`admin-nav-chevron ${openSections.roster ? "open" : ""}`}>
              &#9662;
            </span>
          </button>
          {openSections.roster && (
            <div className="admin-nav-dropdown-list">
              {ROSTER_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin/members"}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <button
            type="button"
            className="admin-nav-dropdown-toggle"
            onClick={() => toggle("applicants")}
          >
            <span>Applicants</span>
            <span className={`admin-nav-chevron ${openSections.applicants ? "open" : ""}`}>
              &#9662;
            </span>
          </button>
          {openSections.applicants && (
            <div className="admin-nav-dropdown-list">
              {APPLICANT_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/admin/archive"}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <button
            type="button"
            className="admin-nav-dropdown-toggle"
            onClick={() => toggle("content")}
          >
            <span>Content</span>
            <span className={`admin-nav-chevron ${openSections.content ? "open" : ""}`}>
              &#9662;
            </span>
          </button>
          {openSections.content && (
            <div className="admin-nav-dropdown-list">
              {RESOURCE_LIST.map(([key, label]) => (
                <NavLink
                  key={key}
                  to={`/admin/content/${key}`}
                  className={({ isActive }) => (isActive ? "active" : undefined)}
                >
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">{user?.username}</div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="container admin-container">{children}</div>
      </div>
    </div>
  );
}
