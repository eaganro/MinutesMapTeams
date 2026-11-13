// A headline number with its label, e.g. "PTS 26.3".
export function StatTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-2 py-2 text-center ${
        highlight ? "bg-selected" : "bg-card-alt"
      }`}
    >
      <dt className="text-[11px] font-semibold tracking-[0.04em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-xl font-semibold tabular-nums tracking-[-0.02em] text-heading sm:text-2xl">
        {value}
      </dd>
    </div>
  );
}
