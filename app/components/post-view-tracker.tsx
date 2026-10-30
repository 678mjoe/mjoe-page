"use client";

import { useEffect } from "react";

const VISIBLE_DELAY_MS = 5_000;
const VISITOR_IDLE_MS = 30 * 60 * 1_000;
const STORAGE_KEY = "post_view_visitor";

// Fallback keeps counting available for browsers that block localStorage.
let temporaryVisitor: { id: string; lastUsed: number } | undefined;

function getOrCreateViewVisitorId(): string {
  const now = Date.now();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      let visitor: unknown;
      try {
        visitor = JSON.parse(stored);
      } catch {
        visitor = null;
      }
      if (
        visitor && typeof visitor === "object" &&
        "id" in visitor && typeof visitor.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visitor.id) &&
        "lastUsed" in visitor && typeof visitor.lastUsed === "number" &&
        now - visitor.lastUsed >= 0 && now - visitor.lastUsed < VISITOR_IDLE_MS
      ) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: visitor.id, lastUsed: now }));
        return visitor.id;
      }
    }

    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, lastUsed: now }));
    return id;
  } catch {
    if (!temporaryVisitor || now - temporaryVisitor.lastUsed >= VISITOR_IDLE_MS || now < temporaryVisitor.lastUsed) {
      temporaryVisitor = { id: crypto.randomUUID(), lastUsed: now };
    }
    temporaryVisitor.lastUsed = now;
    return temporaryVisitor.id;
  }
}

async function getViewVisitorId(): Promise<string> {
  if (navigator.locks) {
    return navigator.locks.request(STORAGE_KEY, getOrCreateViewVisitorId);
  }
  return getOrCreateViewVisitorId();
}

export function PostViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;

    function scheduleView() {
      if (timer !== undefined) clearTimeout(timer);
      if (document.visibilityState !== "visible" || sent) return;

      timer = setTimeout(() => {
        if (document.visibilityState !== "visible" || sent) return;
        sent = true;

        void getViewVisitorId().then((visitorId) => fetch(`/api/views/${encodeURIComponent(slug)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
          keepalive: true,
        })).catch((error) => console.error("Failed to record post view:", error));
      }, VISIBLE_DELAY_MS);
    }

    document.addEventListener("visibilitychange", scheduleView);
    scheduleView();

    return () => {
      document.removeEventListener("visibilitychange", scheduleView);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [slug]);

  return null;
}
