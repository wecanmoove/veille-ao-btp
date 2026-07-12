/** Retry simple avec backoff exponentiel pour les échecs temporaires (réseau, 5xx…). */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 1500;
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts) {
        const delay = baseDelayMs * 2 ** (i - 1);
        console.warn(`[retry] ${opts.label ?? "op"} tentative ${i}/${attempts} échouée, retry dans ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
