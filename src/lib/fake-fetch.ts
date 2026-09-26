export function fakeFetch<T>(data: T, delayMs = 800): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delayMs);
  });
}
