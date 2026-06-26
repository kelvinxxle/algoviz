import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TopicStage } from "@/components/player/TopicStage";
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
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <a
        href="#visualization"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-md focus:py-sm focus:font-label-caps focus:text-label-caps focus:uppercase focus:tracking-widest focus:text-primary focus:outline focus:outline-2 focus:outline-primary-container"
      >
        Skip to visualization
      </a>
      <Sidebar />
      <MobileTopBar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-base">
        <Header title={topic.title} subtitle={topic.complexity} />
        <TopicStage slug={slug} />
        <Footer />
      </main>
    </div>
  );
}
