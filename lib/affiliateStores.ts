export function normalizeAffiliateHost(value: string) {
  return value.toLowerCase().replace(/^www\./, "");
}

export function resolveAffiliateStoreDestination(affiliateUrl: string, requestedDestination: string | null | undefined) {
  const tracked = new URL(affiliateUrl);
  if (!requestedDestination) return tracked;

  try {
    const destination = new URL(requestedDestination);
    if (destination.protocol !== "https:" || normalizeAffiliateHost(destination.hostname) !== normalizeAffiliateHost(tracked.hostname)) {
      return tracked;
    }
    tracked.searchParams.forEach((value, key) => destination.searchParams.set(key, value));
    return destination;
  } catch {
    return tracked;
  }
}
