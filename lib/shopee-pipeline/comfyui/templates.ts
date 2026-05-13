import "server-only";

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function replacePlaceholders<T>(obj: T, replacements: Record<string, string | number>): T {
  const json = JSON.stringify(obj);
  const replaced = Object.entries(replacements).reduce((acc, [key, val]) => {
    return acc.split(key).join(String(val));
  }, json);
  return JSON.parse(replaced) as T;
}

