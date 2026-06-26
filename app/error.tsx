"use client";

import { ErrorView } from "@/components/states/ErrorView";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView onRetry={reset} />;
}
