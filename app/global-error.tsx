"use client";

import "./globals.css";
import { ErrorView } from "@/components/states/ErrorView";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base text-on-surface">
        <ErrorView onRetry={reset} />
      </body>
    </html>
  );
}
