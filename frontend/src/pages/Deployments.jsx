import { useEffect, useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { endpoints } from "../api/client.js";

export default function Deployments() {
  const [deployments, setDeployments] = useState([]);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    endpoints.deployments().then(setDeployments);
    endpoints.trainingExercises().then(setExercises);
  }, []);

  const active = deployments.filter((d) => d.status === "active");
  const archive = deployments.filter((d) => d.status !== "active");

  return (
    <>
      <PageHero
        eyebrow="Deployments &amp; Field Log"
        title="Where the task force has responded."
        lede="Details on ongoing missions are limited where public-safety protocol requires it."
      />

      {active.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2>Active Operations</h2>
            </div>
            {active.map((d) => (
              <div className="record-row" key={d.id}>
                <span className="record-date">{d.start_date}</span>
                <span className="record-title">
                  {d.name} — {d.location}
                </span>
                <span className="pill active">Active</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Mission Archive</h2>
          </div>
          {archive.length === 0 && <p className="empty-note">No archived missions published yet.</p>}
          {archive.map((d) => (
            <div className="record-row" key={d.id}>
              <span className="record-date">{d.start_date}</span>
              <span className="record-title">
                {d.name} — {d.location}
              </span>
              <span className="pill">{d.status_display}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ borderBottom: "none" }}>
        <div className="container">
          <div className="section-head">
            <h2>Training &amp; Exercises</h2>
          </div>
          {exercises.length === 0 && <p className="empty-note">No exercises logged yet.</p>}
          {exercises.map((e) => (
            <div className="record-row" key={e.id}>
              <span className="record-date">{e.date}</span>
              <span className="record-title">{e.title}</span>
              <span className="pill">{e.partner_agencies || "Internal"}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
