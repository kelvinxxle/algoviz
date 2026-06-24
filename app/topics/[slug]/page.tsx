import { notFound } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-base">
        <Header title={topic.title} subtitle={topic.complexity} />
        <TopicStage slug={slug} />
        <Footer />
      </main>
    </div>
  );
}
