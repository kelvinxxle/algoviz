"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/data/meta";
import { NAV_SECTIONS } from "@/data/nav";

export function Sidebar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-dim py-md">
      <div className="mb-xl px-md">
        <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
          AlgoViz
        </span>
        <p className="font-label-caps text-label-caps text-on-surface-variant opacity-60">
          {APP_VERSION}
        </p>
      </div>

      <nav className="flex-1 space-y-xs px-sm">
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={`flex w-full items-center gap-md border-l-2 px-md py-sm text-left font-label-caps text-label-caps transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary-container ${
            isHome
              ? "border-primary bg-surface-container-highest text-primary"
              : "border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[20px]"
          >
            grid_view
          </span>
          <span>DASHBOARD</span>
        </Link>

        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-md pb-xs pt-md">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant opacity-50">
                {section.label}
              </span>
            </div>
            {section.links.map((link) => (
              <a
                key={link.text}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-md px-md py-sm text-left font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[20px]"
                >
                  {link.icon}
                </span>
                <span>{link.text}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
