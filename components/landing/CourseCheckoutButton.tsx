"use client";

import { MouseEvent } from "react";
import { CTAButton } from "@/components/landing/cta-button";
import { MetaPixelEventData, initiateCheckout } from "@/lib/metaPixel";

type CourseCheckoutButtonProps = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
  eventData?: MetaPixelEventData;
};

export function CourseCheckoutButton({
  href,
  label,
  variant = "primary",
  eventData,
}: CourseCheckoutButtonProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    // Checkout buttons send InitiateCheckout before leaving the site for Hotmart.
    initiateCheckout(eventData);

    window.setTimeout(() => {
      window.location.assign(href);
    }, 150);
  }

  return <CTAButton href={href} label={label} onClick={handleClick} variant={variant} />;
}
