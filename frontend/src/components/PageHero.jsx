export default function PageHero({ eyebrow, title, lede }) {
  return (
    <section className="page-hero">
      <div className="container">
        {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
      </div>
    </section>
  );
}
