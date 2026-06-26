/**
 * Branded error view. Presentational so it can be unit-tested under src/. It
 * deliberately renders no error.message or stack, so a production user never
 * sees a raw trace. The retry control is wired by the app/*.tsx boundaries.
 */
export function ErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-base px-lg text-center">
      <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
        AlgoViz
      </span>
      <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
        Something went wrong rendering this visualization
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        An unexpected error interrupted the page. You can try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="font-label-caps text-label-caps uppercase tracking-widest text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container"
      >
        Try again
      </button>
    </main>
  );
}
