import Link from "next/link";
import { NAV_SECTIONS } from "@/data/nav";

/**
 * Replaces the desktop Sidebar below lg. The full Sidebar rail does not fit
 * next to a stacked workbench, so the topic page shows this compact bar that
 * still exposes the dashboard link and the reference links.
 */
export function MobileTopBar() {
  return (
    <div className="flex shrink-0 items-center justify-between gap-md border-b border-outline-variant bg-surface-dim px-lg py-sm lg:hidden">
      <Link
        href="/"
        aria-label="Dashboard"
        className="font-headline-md text-headline-md font-bold tracking-tighter text-primary"
      >
        AlgoViz
      </Link>
      <nav aria-label="Reference" className="flex items-center gap-md">
        {NAV_SECTIONS.flatMap((section) =>
          section.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.text}
              className="flex items-center text-on-surface-variant hover:text-on-surface"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[20px]"
              >
                {link.icon}
              </span>
            </a>
          ))
        )}
      </nav>
    </div>
  );
}
