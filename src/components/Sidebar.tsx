import { APP_VERSION } from "@/data/meta";

const SECTIONS = [
  {
    label: "Reference",
    links: [
      { icon: "description", text: "Product Brief", href: "/docs/prd.md" },
      { icon: "palette", text: "Design System", href: "/docs/design" },
      {
        icon: "code",
        text: "Source",
        href: "https://github.com/kelvinxxle/algoviz",
      },
    ],
  },
];

export function Sidebar() {
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
        <span
          aria-current="page"
          className="flex w-full items-center gap-md border-l-2 border-primary bg-surface-container-highest px-md py-sm text-left font-label-caps text-label-caps text-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
            grid_view
          </span>
          <span>DASHBOARD</span>
        </span>

        {SECTIONS.map((section) => (
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
