"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires a single analytics event when the page/section mounts. */
export function ViewTracker({
  event = "view_item",
  params = {},
}: {
  event?: AnalyticsEvent;
  params?: Record<string, unknown>;
}) {
  useEffect(() => {
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
  return null;
}
