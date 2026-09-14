/** Shared decorative seam between related content groups. */
export function GoldDivider() {
  return (
    <div className="gold-divider" aria-hidden="true">
      <span className="gold-divider__line" />
      <span className="gold-divider__seal">
        <span className="gold-divider__gem" />
      </span>
      <span className="gold-divider__line" />
    </div>
  );
}
