import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAvailableTopic, topics } from "@/data/topics";

export function generateStaticParams() {
  return topics
    .filter((topic) => topic.status === "available")
    .map((topic) => ({ slug: topic.slug }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getAvailableTopic(slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-base">
        <Header title={topic.title} subtitle={topic.complexity} />
        <div className="relative flex-1 overflow-y-auto p-lg">
          <Link
            href="/"
            className="inline-flex items-center gap-xs font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              arrow_back
            </span>
            Topic Library
          </Link>

          <h1 className="mt-md font-headline-lg text-headline-lg font-bold tracking-tighter text-on-surface">
            {topic.title}
          </h1>
          <p className="mt-xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
            {topic.blurb}
          </p>

          <div
            data-testid="topic-stub"
            className="mt-lg flex max-w-2xl flex-col items-start gap-sm border border-outline-variant bg-surface-dim p-lg"
          >
            <span className="flex items-center gap-xs font-label-caps text-label-caps uppercase tracking-widest text-primary">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px]"
              >
                construction
              </span>
              In progress
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              Visualization coming in M1.
            </p>
            <p className="font-code-md text-code-md text-on-surface-variant opacity-70">
              {topic.complexity}
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
