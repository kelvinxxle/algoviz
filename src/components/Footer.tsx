import { APP_VERSION } from "@/data/meta";
import { topics } from "@/data/topics";

export function Footer() {
  const available = topics.filter((t) => t.status === "available").length;

  return (
    <footer className="z-20 flex h-8 shrink-0 items-center justify-between border-t border-outline-variant bg-surface px-md">
      <div className="flex items-center gap-md">
        <span className="flex items-center gap-1 font-label-caps text-[10px] uppercase tracking-widest text-secondary">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-secondary" />
          Catalog Ready
        </span>
        <span className="font-code-md text-[10px] text-on-surface-variant opacity-60">
          {topics.length} topics, {available} available
        </span>
      </div>
      <div className="flex items-center gap-md font-code-md text-[10px] text-on-surface-variant">
        <span>MILESTONE: M0</span>
        <span>{APP_VERSION}</span>
      </div>
    </footer>
  );
}
