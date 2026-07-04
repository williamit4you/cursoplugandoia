"use client";

import { useEffect } from "react";
import { SALES_PAGE_EVENT_TYPES, SalesPageTrackPayload, trackSalesEvent } from "@/lib/salesAnalytics";

type SalesPageTrackerProps = {
  pageKey: string;
  pagePath: string;
  pageTitle?: string;
  metadata?: Record<string, unknown>;
};

export function SalesPageTracker({ pageKey, pagePath, pageTitle, metadata }: SalesPageTrackerProps) {
  useEffect(() => {
    trackSalesEvent({
      pageKey,
      pagePath,
      pageTitle,
      eventType: SALES_PAGE_EVENT_TYPES.PAGE_VIEW,
      metadata,
    });
  }, [metadata, pageKey, pagePath, pageTitle]);

  return null;
}

type SalesViewContentTrackerProps = {
  pageKey: string;
  pagePath: string;
  pageTitle?: string;
  currency?: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

export function SalesViewContentTracker({
  pageKey,
  pagePath,
  pageTitle,
  currency,
  value,
  metadata,
}: SalesViewContentTrackerProps) {
  useEffect(() => {
    trackSalesEvent({
      pageKey,
      pagePath,
      pageTitle,
      eventType: SALES_PAGE_EVENT_TYPES.VIEW_CONTENT,
      currency,
      value,
      metadata,
    });
  }, [currency, metadata, pageKey, pagePath, pageTitle, value]);

  return null;
}
