import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Capabilities from "./pages/Capabilities.jsx";
import Deployments from "./pages/Deployments.jsx";
import Join from "./pages/Join.jsx";
import About from "./pages/About.jsx";
import Donate from "./pages/Donate.jsx";
import Contact from "./pages/Contact.jsx";
import MemberProfile from "./pages/MemberProfile.jsx";

import ProtectedRoute from "./admin/ProtectedRoute.jsx";
import Login from "./admin/pages/Login.jsx";
import MembersList from "./admin/pages/MembersList.jsx";
import MemberForm from "./admin/pages/MemberForm.jsx";
import ApplicantsList from "./admin/pages/ApplicantsList.jsx";
import ApplicantsDetail from "./admin/pages/ApplicantsDetail.jsx";
import ApplicantsKanban from "./admin/pages/ApplicantsKanban.jsx";
import ResourceList from "./admin/components/ResourceList.jsx";
import ResourceForm from "./admin/components/ResourceForm.jsx";

export default function App() {
  const location = useLocation();
  // Public header/footer are skipped on standalone shells (admin + member portal).
  const isStandaloneRoute =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/member");

  return (
    <>
      {!isStandaloneRoute && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/capabilities" element={<Capabilities />} />
          <Route path="/deployments" element={<Deployments />} />
          <Route path="/join" element={<Join />} />
          <Route path="/about" element={<About />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/member/login" element={<Navigate to="/admin/login" replace />} />
          <Route
            path="/member/profile"
            element={
              <ProtectedRoute>
                <MemberProfile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute>
                <MembersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/new"
            element={
              <ProtectedRoute>
                <MemberForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/:id"
            element={
              <ProtectedRoute>
                <MemberForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/archive"
            element={
              <ProtectedRoute>
                <ApplicantsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pipeline"
            element={
              <ProtectedRoute>
                <ApplicantsKanban />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/archive/:id"
            element={
              <ProtectedRoute>
                <ApplicantsDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/content/:resource"
            element={
              <ProtectedRoute>
                <ResourceList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content/:resource/new"
            element={
              <ProtectedRoute>
                <ResourceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content/:resource/:id"
            element={
              <ProtectedRoute>
                <ResourceForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isStandaloneRoute && <Footer />}
    </>
  );
}
