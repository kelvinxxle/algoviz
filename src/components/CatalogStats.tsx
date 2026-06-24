import type { Topic } from "@/data/topics";

function Stat({
  testId,
  label,
  value,
  accent,
}: {
  testId: string;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      data-testid={testId}
      className="border border-outline-variant bg-surface-container p-md"
    >
      <span className="mb-sm block font-label-caps text-label-caps uppercase tracking-widest text-outline">
        {label}
      </span>
      <span className={`font-display text-display ${accent}`}>{value}</span>
    </div>
  );
}

export function CatalogStats({ topics }: { topics: Topic[] }) {
  const total = topics.length;
  const available = topics.filter((t) => t.status === "available").length;
  const comingSoon = topics.filter((t) => t.status === "coming-soon").length;

  return (
    <div className="mt-lg grid grid-cols-1 gap-lg md:grid-cols-3">
      <Stat
        testId="stat-total"
        label="Total Topics"
        value={total}
        accent="text-on-surface"
      />
      <Stat
        testId="stat-available"
        label="Available Now"
        value={available}
        accent="text-secondary"
      />
      <Stat
        testId="stat-coming-soon"
        label="Coming Soon"
        value={comingSoon}
        accent="text-primary"
      />
    </div>
  );
}
