const SUPABASE_URL = atob('aHR0cHM6Ly9yZmJ0ZHR2c25mdHliYXpmbWRidy5zdXBhYmFzZS5jbw==');
const SUPABASE_ANON = atob('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5KbVluUmtkSFp6Ym1aMGVXSmhlbVp0WkdKM0lpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RFNU1UQXpOakFzSW1WNGNDSTZNakE1TnpRNE5qTTJNSDAuSHc2OGpRRkZtd0xndndGOXpqaGdWV1BjM0QxUTJwZmdBbjFUUWxKRVZ1NA==');
const DB_TIMEOUT = 10_000;

type FetchOptions = RequestInit & { timeout?: number };

export async function dbFetch(url: string, opts: FetchOptions = {}): Promise<Response> {
  const { timeout = DB_TIMEOUT, ...fetchOpts } = opts;
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
    const resp = await fetch(url, { ...fetchOpts, headers, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

export async function dbGet<T>(tabela: string, filtro = ''): Promise<T[]> {
  const resp = await dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}${filtro ? '?' + filtro : ''}`);
  if (!resp.ok) throw new Error(`DB GET ${tabela}: ${resp.status}`);
  return resp.json() as Promise<T[]>;
}

export async function dbPost<T>(tabela: string, dados: Partial<T>): Promise<T> {
  const resp = await dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DB POST ${tabela}: ${err}`);
  }
  const rows = await resp.json() as T[];
  return rows[0]!;
}

export async function dbPatch<T>(tabela: string, filtro: string, dados: Partial<T>): Promise<T[]> {
  const resp = await dbFetch(`${SUPABASE_URL}/rest/v1/${tabela}?${filtro}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`DB PATCH ${tabela}: ${err}`);
  }
  return resp.json() as Promise<T[]>;
}

export async function callEdgeFunction<T>(nome: string, body: unknown): Promise<T> {
  const resp = await dbFetch(`${SUPABASE_URL}/functions/v1/${nome}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Edge Function ${nome}: ${err}`);
  }
  return resp.json() as Promise<T>;
}

export { SUPABASE_URL, SUPABASE_ANON };
