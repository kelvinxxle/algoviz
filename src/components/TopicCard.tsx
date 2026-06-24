import Link from "next/link";
import type { Topic } from "@/data/topics";

function CardBody({ topic }: { topic: Topic }) {
  const isLocked = topic.status === "coming-soon";
  const accent = topic.flavor === "systems" ? "text-secondary" : "text-primary";

  return (
    <div className="flex h-48 flex-col border border-outline-variant bg-base p-md">
      <div className="mb-md flex items-start justify-between">
        <span className="border border-secondary bg-secondary/10 px-2 py-0.5 font-label-caps text-[10px] uppercase tracking-widest text-secondary">
          {topic.flavor.toUpperCase()}
        </span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined ${isLocked ? "text-outline" : "text-primary"}`}
        >
          {topic.icon}
        </span>
      </div>

      <div className="mt-auto">
        <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
          {topic.title}
        </h3>
        <p className="line-clamp-1 font-body-md text-body-md text-on-surface-variant">
          {topic.blurb}
        </p>
      </div>

      <div className="mt-md flex items-end justify-between">
        {isLocked ? (
          <span className="flex items-center gap-1 font-label-caps text-label-caps uppercase tracking-widest text-outline">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">
              lock
            </span>
            Coming Soon
          </span>
        ) : (
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-secondary">
            Available
          </span>
        )}
        <span className={`font-code-md text-code-md ${accent}`}>
          {topic.complexity}
        </span>
      </div>
    </div>
  );
}

export function TopicCard({ topic }: { topic: Topic }) {
  if (topic.status === "available") {
    return (
      <Link
        href={`/topics/${topic.slug}`}
        data-testid="topic-card"
        data-status={topic.status}
        className="topic-card group block transition-colors duration-150 hover:outline hover:outline-1 hover:outline-primary-container focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary-container"
      >
        <CardBody topic={topic} />
      </Link>
    );
  }

  return (
    <div
      data-testid="topic-card"
      data-status={topic.status}
      aria-disabled="true"
      className="topic-card block opacity-60"
    >
      <CardBody topic={topic} />
    </div>
  );
}
