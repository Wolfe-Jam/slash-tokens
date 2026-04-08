let _key: string | null = null;
let _endpoint: string = 'https://mcpaas.live/api/slash/transact';
let _route: boolean = true; // default: route to cheapest model
let _models: Set<string> | null = null; // null = all models allowed

export function init(opts: { key?: string; endpoint?: string; route?: boolean; models?: string[] }): void {
  if (opts.key !== undefined) _key = opts.key;
  if (opts.endpoint) _endpoint = opts.endpoint;
  if (opts.route !== undefined) _route = opts.route;
  if (opts.models) _models = new Set(opts.models.map(m => m.toLowerCase()));
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

export function isModelAllowed(model: string): boolean {
  if (!_models) return true; // null = all allowed
  return _models.has(model.toLowerCase());
}
