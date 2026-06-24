"use client";

import { useState } from "react";
import type { Topic, TopicFlavor } from "@/data/topics";
import { TopicCard } from "./TopicCard";

type Filter = "all" | TopicFlavor;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ALL TOPICS" },
  { id: "canonical", label: "CANONICAL" },
  { id: "systems", label: "SYSTEMS" },
];

export function TopicLibrary({ topics }: { topics: Topic[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible =
    filter === "all" ? topics : topics.filter((t) => t.flavor === filter);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-center justify-between gap-sm border border-outline-variant bg-surface-container p-sm">
        <div className="flex flex-wrap gap-sm">
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(id)}
                className={
                  active
                    ? "bg-primary px-md py-1 font-label-caps text-label-caps font-bold text-on-primary-container"
                    : "border border-outline-variant px-md py-1 font-label-caps text-label-caps text-on-surface-variant transition-colors hover:bg-surface-container-high"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
        <span className="font-label-caps text-label-caps text-outline">
          {visible.length} {visible.length === 1 ? "TOPIC" : "TOPICS"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-px bg-grid-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((topic) => (
          <TopicCard key={topic.slug} topic={topic} />
        ))}
      </div>
    </div>
  );
}
