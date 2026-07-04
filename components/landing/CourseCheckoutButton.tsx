"use client";

import { MouseEvent } from "react";
import { CTAButton } from "@/components/landing/cta-button";
import { MetaPixelEventData, initiateCheckout } from "@/lib/metaPixel";
import { SALES_PAGE_EVENT_TYPES, trackSalesEvent } from "@/lib/salesAnalytics";

type CourseCheckoutButtonProps = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  eventData?: MetaPixelEventData;
  pageKey?: string;
  pagePath?: string;
};

export function CourseCheckoutButton({
  href,
  label,
  variant = "primary",
  eventData,
  pageKey = "curso-fundamentos-ia",
  pagePath = "/curso-fundamentos-ia",
}: CourseCheckoutButtonProps) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    // Checkout buttons send InitiateCheckout before leaving the site for Hotmart.
    initiateCheckout(eventData);
    await trackSalesEvent({
      pageKey,
      pagePath,
      eventType: SALES_PAGE_EVENT_TYPES.INITIATE_CHECKOUT,
      checkoutUrl: href,
      currency: typeof eventData?.currency === "string" ? eventData.currency : undefined,
      value: typeof eventData?.value === "number" ? eventData.value : undefined,
      metadata: {
        buttonLabel: label,
      },
    });

    window.setTimeout(() => {
      window.location.assign(href);
    }, 150);
  }

  return <CTAButton href={href} label={label} onClick={handleClick} variant={variant} />;
}
