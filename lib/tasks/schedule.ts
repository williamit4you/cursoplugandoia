import "server-only";

export type TimeSlot = { hour: number; minute: number; raw: string };

export function parseTimeSlots(value: unknown): TimeSlot[] {
  const raw = Array.isArray(value) ? value : [];
  const slots = raw
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => /^\d{1,2}:\d{2}$/.test(item))
    .map((item) => {
      const [h, m] = item.split(":");
      const hour = Math.min(23, Math.max(0, Number(h)));
      const minute = Math.min(59, Math.max(0, Number(m)));
      return { hour, minute, raw: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
    });
  const unique = new Map(slots.map((s) => [s.raw, s]));
  return Array.from(unique.values()).sort((a, b) => a.hour - b.hour || a.minute - b.minute);
}

function timeZoneOffsetMinutes(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
  const match = tz.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/i);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  return hours * 60 + (hours >= 0 ? minutes : -minutes);
}

function timeZoneDateParts(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value || "0");
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: pick("hour"),
    minute: pick("minute"),
    second: pick("second"),
  };
}

function dateAtTimeZoneWallClock(params: {
  timeZone: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}) {
  const utcGuess = new Date(Date.UTC(params.year, params.month - 1, params.day, params.hour, params.minute, 0));
  const offset = timeZoneOffsetMinutes(params.timeZone, utcGuess);
  return new Date(utcGuess.getTime() - offset * 60_000);
}

export function computeNextScheduleTimes(params: {
  timeZone: string;
  slots: TimeSlot[];
  count: number;
  from: Date;
}): Date[] {
  if (params.slots.length === 0) {
    return Array.from({ length: params.count }).map((_, idx) => new Date(params.from.getTime() + (idx + 1) * 60_000));
  }

  const fromParts = timeZoneDateParts(params.timeZone, params.from);
  const results: Date[] = [];
  let dayOffset = 0;

  while (results.length < params.count && dayOffset < 14) {
    const dayDate = dateAtTimeZoneWallClock({
      timeZone: params.timeZone,
      year: fromParts.year,
      month: fromParts.month,
      day: fromParts.day + dayOffset,
      hour: 0,
      minute: 0,
    });
    const dayParts = timeZoneDateParts(params.timeZone, dayDate);

    for (const slot of params.slots) {
      const candidate = dateAtTimeZoneWallClock({
        timeZone: params.timeZone,
        year: dayParts.year,
        month: dayParts.month,
        day: dayParts.day,
        hour: slot.hour,
        minute: slot.minute,
      });
      if (candidate.getTime() <= params.from.getTime() + 30_000) continue;
      results.push(candidate);
      if (results.length >= params.count) break;
    }

    dayOffset += 1;
  }

  if (results.length === 0) {
    return Array.from({ length: params.count }).map((_, idx) => new Date(params.from.getTime() + (idx + 1) * 60_000));
  }

  return results.slice(0, params.count);
}

export function computeTodaySlotInstants(params: {
  timeZone: string;
  slots: TimeSlot[];
  now: Date;
}): Array<{ slot: TimeSlot; instant: Date }> {
  const nowParts = timeZoneDateParts(params.timeZone, params.now);
  return params.slots.map((slot) => ({
    slot,
    instant: dateAtTimeZoneWallClock({
      timeZone: params.timeZone,
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day,
      hour: slot.hour,
      minute: slot.minute,
    }),
  }));
}

