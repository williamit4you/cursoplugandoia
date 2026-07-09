export function toPlainJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, currentValue) => {
      if (typeof currentValue === "bigint") return currentValue.toString();
      return currentValue;
    })
  ) as T;
}
