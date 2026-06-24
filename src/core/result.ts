export type Result<T, E extends Error = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const fail = <E extends Error>(error: E): Result<never, E> => ({ ok: false, error });

export function isOk<T, E extends Error>(r: Result<T, E>): r is { ok: true; value: T } {
  return r.ok;
}

export function unwrap<T>(r: Result<T>, fallback?: T): T {
  if (r.ok) return r.value;
  if (fallback !== undefined) return fallback;
  throw r.error;
}

export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return fail(e instanceof Error ? e : new Error(String(e)));
  }
}
