export function Header() {
  return (
    <header className="z-20 flex h-12 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-lg">
      <div className="flex h-full items-center gap-xl">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">
          Topic Library
        </span>
        <span className="hidden font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant opacity-60 md:inline">
          Flat and browsable
        </span>
      </div>

      <div className="flex items-center gap-md">
        <label className="relative block">
          <span className="sr-only">Search the catalog</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-outline">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              search
            </span>
          </span>
          <input
            type="text"
            disabled
            title="Catalog search is coming soon"
            placeholder="Search coming soon"
            className="w-56 cursor-not-allowed border border-field-border bg-field py-1 pl-10 pr-md font-code-md text-code-md text-on-surface opacity-60"
          />
        </label>
      </div>
    </header>
  );
}
