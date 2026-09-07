import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import { adminEndpoints } from "../api.js";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  id_number: "",
  country: "",
  blood_type: "",
  role: "",
  status: "probation",
  joined_date: "",
  certifications: "",
  notes: "",
};

export default function MemberForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminEndpoints.teamRoles().then(setRoles);
    adminEndpoints.listCountries().then((list) => setCountries(Array.isArray(list) ? list : []));
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    adminEndpoints
      .getMember(id)
      .then((data) =>
        setForm({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || "",
          id_number: data.id_number || "",
          country: data.country || "",
          blood_type: data.blood_type || "",
          role: data.role || "",
          status: data.status,
          joined_date: data.joined_date,
          certifications: data.certifications || "",
          notes: data.notes || "",
        })
      )
      .catch(() => setError("Unable to load this member."))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form, role: form.role || null, country: form.country || null };
    try {
      if (isEditing) {
        await adminEndpoints.updateMember(id, payload);
      } else {
        await adminEndpoints.createMember(payload);
      }
      navigate("/admin/members");
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Unable to save this member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="section-head" style={{ marginBottom: 24 }}>
        <h2>{isEditing ? "Edit Member" : "Add Member"}</h2>
        <Link to="/admin/members" className="link-more">
          ← Back to roster
        </Link>
      </div>

      {loading ? (
        <p className="loading-note">Loading…</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" name="full_name" required value={form.full_name} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="id_number">ID number</label>
            <input id="id_number" name="id_number" value={form.id_number} onChange={handleChange} />
          </div>
          <div className="field">
            <label htmlFor="country">Country</label>
            <select id="country" name="country" value={form.country} onChange={handleChange}>
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="blood_type">Blood type</label>
            <select id="blood_type" name="blood_type" value={form.blood_type} onChange={handleChange}>
              <option value="">—</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="joined_date">Joined date</label>
            <input
              id="joined_date"
              type="date"
              name="joined_date"
              required
              value={form.joined_date}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="role">Role / track</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="">Unassigned</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="probation">Probationary</option>
              <option value="active">Active</option>
              <option value="leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="field full">
            <label htmlFor="certifications">Certifications (one per line)</label>
            <textarea
              id="certifications"
              name="certifications"
              value={form.certifications}
              onChange={handleChange}
            />
          </div>
          <div className="field full">
            <label htmlFor="notes">Internal notes</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
          </div>
          <div className="full" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Member"}
            </button>
            {error && <p className="form-status error" style={{ margin: 0 }}>{error}</p>}
          </div>
        </form>
      )}
    </AdminLayout>
  );
}
