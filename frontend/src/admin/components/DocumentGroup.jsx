export default function DocumentGroup({ label, items, decide }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="doc-list">
      <div className="doc-group-label">{label}</div>
      {items.map((d) => (
        <div className="doc-row" key={d.file || d.id}>
          <a href={d.file} target="_blank" rel="noreferrer">
            {d.filename}
          </a>
          <span className={d.approved ? "status-active" : "status-probation"}>
            {d.approved ? "Approved" : "Pending"}
          </span>
          <div className="doc-actions">
            <button className="link-button" onClick={() => decide(d, true)}>
              Approve
            </button>
            <button className="link-button" onClick={() => decide(d, false)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}