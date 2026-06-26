"use client";

import { getTopicModule } from "@/engine/registry";
import { TopicWorkbench } from "@/components/player/TopicWorkbench";
import { SmallScreenNotice } from "@/components/player/SmallScreenNotice";

/**
 * Client seam that resolves a slug to its registered topic module and renders
 * the shared workbench. Keeping resolution on the client avoids passing a
 * client renderer component across the server boundary, and means the page
 * never special-cases any single topic.
 */
export function TopicStage({ slug }: { slug: string }) {
  const topicModule = getTopicModule(slug);

  if (!topicModule) {
    return (
      <div className="flex flex-1 items-center justify-center p-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Visualization for this topic is not available yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 md:hidden">
        <SmallScreenNotice />
      </div>
      <div className="hidden min-h-0 flex-1 md:flex">
        <TopicWorkbench
          topic={topicModule.topic}
          Renderer={topicModule.Renderer}
        />
      </div>
    </>
  );
}
