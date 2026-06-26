import Link from "next/link";

/**
 * Honest below-md notice. The interactive workbench is dense (stage plus four
 * side panels plus transport), so on a phone we tell the user plainly rather
 * than ship a cramped, unusable layout. Pure presentation, no store access.
 */
export function SmallScreenNotice() {
  return (
    <div className="flex flex-1 items-center justify-center p-lg">
      <div className="max-w-sm space-y-md border border-outline-variant bg-surface-container p-lg text-center">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[40px] text-primary"
        >
          devices
        </span>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
          Best on a larger screen
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          AlgoViz&apos;s interactive walkthrough is built for a tablet or
          larger. Rotate your device or open it on a wider screen to explore the
          visualization.
        </p>
        <Link
          href="/"
          className="inline-block border border-primary-container px-md py-sm font-label-caps text-label-caps text-primary"
        >
          Back to the library
        </Link>
      </div>
    </div>
  );
}
