export type MetaPixelEventData = Record<string, unknown>;

function track(eventName: string, data?: MetaPixelEventData) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  if (data) {
    window.fbq("track", eventName, data);
    return;
  }

  window.fbq("track", eventName);
}

export function pageView() {
  track("PageView");
}

export function viewContent(data?: MetaPixelEventData) {
  track("ViewContent", data);
}

export function initiateCheckout(data?: MetaPixelEventData) {
  track("InitiateCheckout", data);
}

export function purchase(data?: MetaPixelEventData) {
  track("Purchase", data);
}

export function lead(data?: MetaPixelEventData) {
  track("Lead", data);
}

export function completeRegistration(data?: MetaPixelEventData) {
  track("CompleteRegistration", data);
}

export function search(data?: MetaPixelEventData) {
  track("Search", data);
}

export function addToCart(data?: MetaPixelEventData) {
  track("AddToCart", data);
}
