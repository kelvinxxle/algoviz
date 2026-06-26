import { Sidebar } from "@/components/Sidebar";
import { MobileTopBar } from "@/components/MobileTopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CatalogStats } from "@/components/CatalogStats";
import { TopicLibrary } from "@/components/TopicLibrary";
import { topics } from "@/data/topics";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <Sidebar />
      <MobileTopBar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-base">
        <Header />
        <div className="relative flex-1 overflow-y-auto p-lg">
          <h1 className="sr-only">Topic Library</h1>
          <TopicLibrary topics={topics} />
          <CatalogStats topics={topics} />
        </div>
        <Footer />
      </main>
    </div>
  );
}
