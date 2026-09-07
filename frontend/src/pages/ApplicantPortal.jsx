import { useState } from "react";
import { endpoints } from "../api/client.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function ApplicantPortal() {
  const { t } = useLanguage();
  const [step, setStep] = useState("lookup"); // lookup | result
  const [form, setForm] = useState({ email: "", code: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [looking, setLooking] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleLookup(e) {
    e.preventDefault();
    setLooking(true);
    setError(null);
    setUploadMsg(null);
    try {
      const data = await endpoints.portalLookup(form);
      setResult(data);
      setStep("result");
    } catch (err) {
      setError(err?.response?.data?.detail || t("join.portal.notfound"));
    } finally {
      setLooking(false);
    }
  }

  function handleFileChange(e) {
    setFiles(Array.from(e.target.files || []));
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, j) => j !== i));
  }

  async function handleUpload() {
    if (!result || files.length === 0) return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append("email", result.email);
    fd.append("code", result.application_code);
    fd.append("kind", "medical");
    files.forEach((f) => fd.append("files", f));
    try {
      const data = await endpoints.portalUpload(fd);
      setUploadMsg(`${t("join.portal.uploadOk")} (${data.uploaded})`);
      setFiles([]);
    } catch (err) {
      setUploadMsg(err?.response?.data?.detail || t("join.portal.uploadErr"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="portal-wrap">
      {step === "lookup" ? (
        <form className="form-grid" onSubmit={handleLookup}>
          <div className="field">
            <label htmlFor="portal_email">{t("join.form.email")}</label>
            <input
              id="portal_email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="portal_code">{t("join.portal.code")}</label>
            <input
              id="portal_code"
              name="code"
              required
              placeholder="USAR-XXXXXX"
              value={form.code}
              onChange={handleChange}
            />
          </div>
          <div className="full">
            <button type="submit" className="btn btn-primary" disabled={looking}>
              {looking ? t("join.portal.checking") : t("join.portal.lookupBtn")}
            </button>
            {error && <p className="form-status error">{error}</p>}
          </div>
        </form>
      ) : (
        <div className="portal-result">
          {result && (
            <>
              <div className="portal-head">
                <h3>{result.full_name}</h3>
                <span className="code-badge">{result.application_code}</span>
              </div>
              <p className="portal-role">
                {result.role_interest_title} — {result.pipeline_phase_display}
              </p>

              <div className="portal-steps">
                {(result.phase_sequence || []).map((ph) => (
                  <div
                    key={ph.phase}
                    className={`portal-step portal-step-${ph.state}`}
                  >
                    <div className="portal-step-dot" />
                    <div>
                      <div className="portal-step-name">{ph.name}</div>
                      {ph.state === "active" && (
                        <div className="portal-step-label">
                          {t("join.portal.current")}
                        </div>
                      )}
                      {ph.state === "completed" && (
                        <div className="portal-step-label">
                          {t("join.portal.completed")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(result.checklist || []).length > 0 && (
                <div className="portal-checklist">
                  <strong>{t("join.portal.checklistTitle")}</strong>
                  <ul className="portal-checklist-list">
                    {(result.checklist || []).map((item, idx) => (
                      <li
                        key={idx}
                        className={`portal-checklist-item ${item.done ? "done" : ""}`}
                      >
                        <span className="portal-checklist-check">
                          {item.done ? "✓" : ""}
                        </span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.visible_comment && (
                <div className="portal-comment">
                  <strong>{t("join.portal.commentTitle")}</strong>
                  <p>{result.visible_comment}</p>
                </div>
              )}

              {result.can_submit_medical && (
                <div className="portal-upload">
                  <strong>{t("join.portal.uploadTitle")}</strong>
                  <div className="file-upload">
                    <label htmlFor="medical" className="file-upload-trigger">
                      {files.length > 0
                        ? `${files.length} ${files.length === 1 ? t("join.form.fileSelected") : t("join.form.filesSelected")}`
                        : t("join.form.chooseFiles")}
                    </label>
                    <input
                      id="medical"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                    />
                    {files.length > 0 && (
                      <div className="file-chips">
                        {files.map((f, i) => (
                          <span className="file-chip" key={`m${i}`}>
                            {f.name}
                            <button
                              type="button"
                              className="file-chip-x"
                              onClick={() => removeFile(i)}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0}
                  >
                    {uploading ? t("join.portal.uploading") : t("join.portal.upload")}
                  </button>
                  {uploadMsg && (
                    <p className={uploadMsg.startsWith("OK") ? "form-status success" : "form-status error"}>
                      {uploadMsg}
                    </p>
                  )}
                </div>
              )}

              <button
                className="link-button"
                onClick={() => setStep("lookup")}
              >
                ← {t("join.portal.back")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
