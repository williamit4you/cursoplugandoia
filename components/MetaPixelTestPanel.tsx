"use client";

import {
  addToCart,
  initiateCheckout,
  lead,
  pageView,
  purchase,
  viewContent,
} from "@/lib/metaPixel";

const buttonClassName =
  "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10";

export function MetaPixelTestPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button className={buttonClassName} onClick={() => pageView()} type="button">
        Disparar PageView
      </button>
      <button
        className={buttonClassName}
        onClick={() =>
          viewContent({
            content_name: "Curso Fundamentos IA",
            content_category: "Curso",
          })
        }
        type="button"
      >
        Disparar ViewContent
      </button>
      <button
        className={buttonClassName}
        onClick={() =>
          lead({
            source: "pixel-test",
          })
        }
        type="button"
      >
        Disparar Lead
      </button>
      <button
        className={buttonClassName}
        onClick={() =>
          initiateCheckout({
            content_name: "Curso Fundamentos IA",
            value: 19.9,
            currency: "BRL",
          })
        }
        type="button"
      >
        Disparar InitiateCheckout
      </button>
      <button
        className={buttonClassName}
        onClick={() =>
          purchase({
            content_name: "Curso Fundamentos IA",
            value: 19.9,
            currency: "BRL",
          })
        }
        type="button"
      >
        Disparar Purchase
      </button>
      <button
        className={buttonClassName}
        onClick={() =>
          addToCart({
            content_name: "Curso Fundamentos IA",
            value: 19.9,
            currency: "BRL",
          })
        }
        type="button"
      >
        Disparar AddToCart
      </button>
    </div>
  );
}
