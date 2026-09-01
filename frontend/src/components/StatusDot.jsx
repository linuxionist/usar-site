export default function StatusDot({ status, label }) {
  return (
    <div className="status-row">
      <span className={`status-dot ${status}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
