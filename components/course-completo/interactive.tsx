"use client";

import { MouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CTAButton } from "@/components/landing/cta-button";
import { MetaPixelEventData, initiateCheckout } from "@/lib/metaPixel";
import { SALES_PAGE_EVENT_TYPES, trackSalesEvent } from "@/lib/salesAnalytics";

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function buildTrackedHref(baseHref: string) {
  if (typeof window === "undefined") {
    return baseHref;
  }

  try {
    const destination = new URL(baseHref);
    const current = new URL(window.location.href);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

    for (const key of keys) {
      const currentValue = current.searchParams.get(key);
      if (currentValue && !destination.searchParams.has(key)) {
        destination.searchParams.set(key, currentValue);
      }
    }

    return destination.toString();
  } catch {
    return baseHref;
  }
}

async function trackCustomEvent(
  pageKey: string,
  pagePath: string,
  pageTitle: string,
  eventName: string,
  metadata?: Record<string, unknown>,
) {
  await trackSalesEvent({
    pageKey,
    pagePath,
    pageTitle,
    eventType: SALES_PAGE_EVENT_TYPES.OUTBOUND_CLICK,
    metadata: {
      eventName,
      ...metadata,
    },
  });
}

export function LaunchCountdown({
  endDate,
  className,
  itemClassName,
  valueClassName,
  labelClassName,
}: {
  endDate: string;
  className?: string;
  itemClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  const target = useMemo(() => new Date(endDate).getTime(), [endDate]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const items = [
    { label: "Dias", value: String(days).padStart(2, "0") },
    { label: "Horas", value: pad(hours) },
    { label: "Minutos", value: pad(minutes) },
    { label: "Segundos", value: pad(seconds) },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className ?? ""}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${itemClassName ?? ""}`}
        >
          <div className={`text-2xl font-extrabold tracking-tight text-white md:text-3xl ${valueClassName ?? ""}`}>
            {item.value}
          </div>
          <div className={`mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 ${labelClassName ?? ""}`}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

type TrackedCheckoutButtonProps = {
  href: string;
  label: string;
  pageKey: string;
  pagePath: string;
  pageTitle: string;
  value: number;
  currency: string;
  customEvent: string;
  variant?: "primary" | "secondary";
  eventData?: MetaPixelEventData;
  className?: string;
  hideGlow?: boolean;
};

export function TrackedCheckoutButton({
  href,
  label,
  pageKey,
  pagePath,
  pageTitle,
  value,
  currency,
  customEvent,
  variant = "primary",
  eventData,
  className,
  hideGlow,
}: TrackedCheckoutButtonProps) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const trackedHref = buildTrackedHref(href);
    initiateCheckout(eventData);

    await Promise.all([
      trackCustomEvent(pageKey, pagePath, pageTitle, customEvent, {
        buttonLabel: label,
        checkoutUrl: trackedHref,
      }),
      trackSalesEvent({
        pageKey,
        pagePath,
        pageTitle,
        eventType: SALES_PAGE_EVENT_TYPES.INITIATE_CHECKOUT,
        checkoutUrl: trackedHref,
        value,
        currency,
        metadata: {
          buttonLabel: label,
          eventName: "checkout_click",
          sourceEvent: customEvent,
        },
      }),
    ]);

    window.setTimeout(() => {
      window.location.assign(trackedHref);
    }, 150);
  }

  return (
    <CTAButton
      href={href}
      label={label}
      onClick={handleClick}
      variant={variant}
      className={className}
      hideGlow={hideGlow}
    />
  );
}

export function SectionViewTracker({
  selectorId,
  pageKey,
  pagePath,
  pageTitle,
  eventName,
}: {
  selectorId: string;
  pageKey: string;
  pagePath: string;
  pageTitle: string;
  eventName: string;
}) {
  const trackedRef = useRef(false);

  useEffect(() => {
    const element = document.getElementById(selectorId);
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (trackedRef.current) {
          return;
        }

        const visible = entries.some((entry) => entry.isIntersecting);
        if (!visible) {
          return;
        }

        trackedRef.current = true;
        void trackCustomEvent(pageKey, pagePath, pageTitle, eventName, {
          sectionId: selectorId,
        });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eventName, pageKey, pagePath, pageTitle, selectorId]);

  return null;
}

export function TrackedAccordion({
  title,
  children,
  pageKey,
  pagePath,
  pageTitle,
  eventName,
  className,
  titleClassName,
  contentClassName,
  iconClassName,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  pageKey: string;
  pagePath: string;
  pageTitle: string;
  eventName: string;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  iconClassName?: string;
  variant?: "default" | "light";
}) {
  async function handleToggle(open: boolean) {
    if (!open) {
      return;
    }

    await trackCustomEvent(pageKey, pagePath, pageTitle, eventName, {
      itemTitle: title,
    });
  }

  return (
    <details
      className={`group rounded-[22px] border p-6 ${
        variant === "light"
          ? "border-[#d8d1c4] bg-[#fffdf8] open:border-[#f27d52] open:bg-[#fffdf8]"
          : "border-white/10 bg-white/5 open:bg-white/[0.07]"
      } ${className ?? ""}`}
      onToggle={(event) => void handleToggle((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
        <span
          className={`text-left text-base font-semibold ${
            variant === "light" ? "text-[#14221d]" : "text-white"
          } ${titleClassName ?? ""}`}
        >
          {title}
        </span>
        <span
          className={`mt-1 flex h-8 w-8 items-center justify-center rounded-xl border transition group-open:rotate-45 ${
            variant === "light"
              ? "border-[#d8d1c4] bg-[#f5f0e6] text-[#173d32]"
              : "border-white/10 bg-white/5 text-white/70"
          } ${iconClassName ?? ""}`}
        >
          +
        </span>
      </summary>
      <div
        className={`mt-4 text-sm leading-relaxed ${
          variant === "light" ? "text-[#64736c]" : "text-slate-300"
        } ${contentClassName ?? ""}`}
      >
        {children}
      </div>
    </details>
  );
}

export function MobileStickyCTA({
  title,
  priceLabel,
  href,
  label,
  pageKey,
  pagePath,
  pageTitle,
  value,
  currency,
  className,
  titleClassName,
  priceClassName,
  buttonClassName,
  hideGlow,
}: {
  title: string;
  priceLabel: string;
  href: string;
  label: string;
  pageKey: string;
  pagePath: string;
  pageTitle: string;
  value: number;
  currency: string;
  className?: string;
  titleClassName?: string;
  priceClassName?: string;
  buttonClassName?: string;
  hideGlow?: boolean;
}) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#070b14]/95 px-4 py-3 backdrop-blur md:hidden ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className={`truncate text-sm font-semibold text-white ${titleClassName ?? ""}`}>{title}</div>
          <div className={`text-xs text-amber-300 ${priceClassName ?? ""}`}>{priceLabel}</div>
        </div>
        <div className="shrink-0">
          <TrackedCheckoutButton
            href={href}
            label={label}
            pageKey={pageKey}
            pagePath={pagePath}
            pageTitle={pageTitle}
            value={value}
            currency={currency}
            customEvent="mobile_sticky_cta_click"
            className={buttonClassName}
            hideGlow={hideGlow}
            eventData={{
              content_name: title,
              content_category: "Curso",
              content_type: "product",
              value,
              currency,
            }}
          />
        </div>
      </div>
    </div>
  );
}
