import type { ActionFunctionArgs } from "react-router";
import { getPost } from "@/lib/posts";
import { isValidVisitorId } from "@/lib/security";
import { allowViewRequest, cleanupPostViews, isAutomatedView, recordPostView } from "@/lib/views.server";

export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }

  const slug = params.slug;
  if (!slug || !getPost(slug)?.frontmatter) {
    return new Response(null, { status: 404 });
  }

  // A successful response prevents automated clients from probing the filters.
  if (isAutomatedView(request)) {
    return new Response(null, { status: 204 });
  }

  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return new Response(null, { status: 415 });
  }

  let visitorId: unknown;
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "visitorId" in body) {
      visitorId = body.visitorId;
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  if (typeof visitorId !== "string" || !isValidVisitorId(visitorId)) {
    return new Response(null, { status: 400 });
  }

  const db = context.cloudflare.env.DB;
  const now = Date.now();

  try {
    const ip = request.headers.get("CF-Connecting-IP");
    const allowed = await allowViewRequest(db, ip, now);
    if (!allowed) return new Response(null, { status: 429 });

    await recordPostView(db, slug, visitorId.toLowerCase(), ip, now);
    context.cloudflare.ctx.waitUntil(
      cleanupPostViews(db, now).catch((error) => console.error("Failed to clean up view records:", error)),
    );
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to record post view:", error);
    return new Response(null, { status: 500 });
  }
}
