import { getAvailableTopic } from "@/data/topics";
import { resolveConfig } from "@/explain/config";
import { handleExplain } from "@/explain/handler";
import { getProvider } from "@/explain/provider";

// Reads the server-side API key at request time, so the route is always
// evaluated dynamically and never prerendered with a stale configuration.
export const dynamic = "force-dynamic";

/**
 * Thin adapter: wire the real dependencies into the dependency-injected
 * {@link handleExplain} core and translate its result into an HTTP response.
 * All branch logic lives in the handler; this file is covered by e2e.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const result = await handleExplain(body, {
    config: resolveConfig(),
    resolveTopic: getAvailableTopic,
    getProvider,
  });

  return Response.json(result.body, { status: result.status });
}

export function GET(): Response {
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}
