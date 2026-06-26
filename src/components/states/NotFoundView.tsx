import Link from "next/link";

/**
 * Branded 404 view. Presentational and prop-free so it can be unit-tested under
 * src/ (vitest excludes app/**). app/not-found.tsx renders it.
 */
export function NotFoundView() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-base px-lg text-center">
      <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
        AlgoViz
      </span>
      <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
        That topic does not exist yet
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        This page is not in the catalog. It may be coming soon, or the link may
        be wrong.
      </p>
      <Link
        href="/"
        className="font-label-caps text-label-caps uppercase tracking-widest text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container"
      >
        Back to the topic library
      </Link>
    </main>
  );
}
