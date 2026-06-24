import { NetworkError } from '../../core/errors';

const SUPABASE_URL = atob('aHR0cHM6Ly9yZmJ0ZHR2c25mdHliYXpmbWRidy5zdXBhYmFzZS5jbw==');
const SUPABASE_ANON = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFZ6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==');
const TIMEOUT_MS = 10_000;

export interface SupabaseFetchOptions extends RequestInit {
  timeout?: number;
}

export async function supabaseFetch(
  path: string,
  opts: SupabaseFetchOptions = {}
): Promise<Response> {
  const { timeout = TIMEOUT_MS, ...fetchOpts } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...((fetchOpts.headers as Record<string, string>) ?? {}),
    };

    return await fetch(`${SUPABASE_URL}${path}`, {
      ...fetchOpts,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new NetworkError('Timeout: servidor não respondeu', { path });
    }
    throw new NetworkError('Erro de rede', { path, cause: String(e) });
  } finally {
    clearTimeout(timer);
  }
}

export async function supabaseGet<T>(
  table: string,
  query = ''
): Promise<T[]> {
  const resp = await supabaseFetch(`/rest/v1/${table}${query ? '?' + query : ''}`);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new NetworkError(`GET ${table} falhou (${resp.status})`, { status: resp.status, body });
  }
  return resp.json() as Promise<T[]>;
}

export async function supabasePost<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const resp = await supabaseFetch(`/rest/v1/${table}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new NetworkError(`POST ${table} falhou`, { status: resp.status, body });
  }
  const rows = await resp.json() as T[];
  return rows[0]!;
}

export async function supabasePatch<T>(
  table: string,
  query: string,
  data: Partial<T>
): Promise<T[]> {
  const resp = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new NetworkError(`PATCH ${table} falhou`, { status: resp.status, body });
  }
  return resp.json() as Promise<T[]>;
}

export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const resp = await supabaseFetch(`/functions/v1/${name}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new NetworkError(`Edge Function ${name} falhou`, { status: resp.status, body: err });
  }
  return resp.json() as Promise<T>;
}

export { SUPABASE_URL, SUPABASE_ANON };
