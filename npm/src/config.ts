let _key: string | null = null;
let _endpoint: string = 'https://mcpaas.live/api/slash/transact';
let _route: boolean = true; // default: route to cheapest model

export function init(opts: { key?: string; endpoint?: string; route?: boolean }): void {
  if (opts.key !== undefined) _key = opts.key;
  if (opts.endpoint) _endpoint = opts.endpoint;
  if (opts.route !== undefined) _route = opts.route;
}

export function resolveKey(perCallKey?: string): string {
  const key = perCallKey || _key || process.env.SLASH_KEY;
  if (!key) {
    throw new Error(
      'No Slash API key. Set SLASH_KEY env var, call init({ key }), or pass key to report().\n' +
      'Register: POST https://mcpaas.live/api/slash/register'
    );
  }
  return key;
}

export function getEndpoint(): string {
  return _endpoint;
}

export function hasKey(): boolean {
  return !!(_key || process.env.SLASH_KEY);
}

export function shouldRoute(): boolean {
  return _route;
}
