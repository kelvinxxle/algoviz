import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DijkstraWorkbench } from "@/components/dijkstra/DijkstraWorkbench";
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
        {slug === "dijkstra" ? (
          <DijkstraWorkbench />
        ) : (
          <div className="flex flex-1 items-center justify-center p-lg">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Visualization for this topic is not available yet.
            </p>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}
