/**
 * Swap globalThis.fetch for one test, so report() can be tested without the
 * network. Returns the bodies report() sent. Always restores the real fetch.
 */
export async function withStubFetch<T>(
  reply: { status: number; body?: unknown },
  fn: (sent: any[]) => Promise<T>,
): Promise<T> {
  const real = globalThis.fetch;
  const sent: any[] = [];
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    sent.push(init?.body ? JSON.parse(init.body as string) : undefined);
    return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status });
  }) as typeof fetch;
  try {
    return await fn(sent);
  } finally {
    globalThis.fetch = real;
  }
}
