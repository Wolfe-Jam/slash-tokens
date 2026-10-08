/**
 * The catalog — one source for every priced model.
 *
 * Each entry carries its prices (USD per million tokens), context window,
 * provider, capability tier and the date the price was checked. `MODELS`
 * (models.ts) and the quote / decide policy (quote.ts) both read from here.
 *
 * Tiers are the vendor's own line position, not a benchmark:
 *   4 frontier — the vendor's top line above its flagship (Fable/Mythos, GPT-6 Astra)
 *   3 flagship — Opus, Sol, Grok 4.5+, Gemini Pro, Nemotron Ultra, GPT-5.4
 *   2 mid      — Sonnet, Terra, Grok 4.3, Gemini Flash, Nemotron Super, GPT-5.4 mini
 *   1 small    — Haiku, Luna, Flash-Lite, GPT-5.4 nano, Nemotron Nano / Lightning
 * A quality floor compares tiers within one provider only; tiers never rank
 * one vendor's model against another's.
 */

export type Tier = 1 | 2 | 3 | 4;

export const TIER_NAMES: Record<Tier, string> = {
  4: 'frontier',
  3: 'flagship',
  2: 'mid',
  1: 'small',
};

export interface CatalogEntry {
  provider: string;
  tier: Tier;
  /** Date the price was checked against the provider's own pricing page. */
  asOf: string;
  /** Last day this price holds, when the provider has announced a change. */
  priceUntil?: string;
  input: number;    // $/M input tokens (base/short-context rate)
  output: number;   // $/M output tokens (base/short-context rate)
  context: number;  // max context window
  // Optional long-context pricing tier. xAI (and Gemini 3.1 Pro) bill the
  // WHOLE request at a higher rate once the prompt exceeds this threshold.
  longContextThreshold?: number;
  longContextInput?: number;
  longContextOutput?: number;
}

type Price = Pick<CatalogEntry, 'input' | 'output' | 'context' | 'longContextThreshold' | 'longContextInput' | 'longContextOutput' | 'priceUntil'>;

const OPUS = { input: 5.00, output: 25.00, context: 1_000_000 };
const OPUS_55 = { input: 4.00, output: 20.00, context: 1_000_000 };
const FABLE = { input: 10.00, output: 50.00, context: 1_000_000 };
const SONNET_4X = { input: 3.00, output: 15.00, context: 1_000_000 };
const SONNET = { input: 2.00, output: 10.00, context: 1_000_000 };
const HAIKU = { input: 1.00, output: 5.00, context: 200_000 };
const GROK_46 = {
  input: 2.00, output: 6.00, context: 500_000,
  longContextThreshold: 200_000, longContextInput: 4.00, longContextOutput: 12.00,
};
const GROK_43 = {
  input: 1.25, output: 2.50, context: 1_000_000,
  longContextThreshold: 200_000, longContextInput: 2.50, longContextOutput: 5.00,
};
const GEMINI_PRO = {
  input: 2.00, output: 12.00, context: 1_000_000,
  longContextThreshold: 200_000, longContextInput: 4.00, longContextOutput: 18.00,
};
const GEMINI_FLASH = { input: 0.30, output: 2.50, context: 1_000_000 };
// Gemini 3.6–3.8 Flash: launch price through 2026-12-31; Google lists $1.50/$7.50
// from 2027-01-01. priceUntil makes the freshness check fail before then.
const GEMINI_FLASH_3X = { input: 0.75, output: 3.75, context: 1_000_000, priceUntil: '2026-12-31' };
const GEMINI_35_FLASH = { input: 1.50, output: 9.00, context: 1_000_000 };
const GEMINI_31_FLASH_LITE = { input: 0.25, output: 1.50, context: 1_000_000 };
const GROK_BUILD = {
  input: 1.00, output: 2.00, context: 256_000,
  longContextThreshold: 200_000, longContextInput: 2.00, longContextOutput: 4.00,
};
const GPT_6_ASTRA = { input: 10.00, output: 50.00, context: 1_050_000 };
const GPT_6_SOL = { input: 2.00, output: 10.00, context: 1_050_000 };
const GPT_6_LUNA = { input: 0.10, output: 0.50, context: 1_050_000 };
const GPT_SOL = { input: 4.00, output: 20.00, context: 1_050_000 };
const GPT_TERRA = { input: 2.00, output: 12.00, context: 1_050_000 };
const GPT_LUNA = { input: 0.20, output: 1.20, context: 1_050_000 };
const GPT_54 = { input: 2.50, output: 15.00, context: 1_000_000 };
const GPT_54_MINI = { input: 0.75, output: 4.50, context: 128_000 };
const GPT_54_NANO = { input: 0.20, output: 1.25, context: 128_000 };
// NVIDIA Nemotron on Nebius Token Factory. Prices and context windows are
// exactly what the API reports (GET /v1/models?verbose=true, 2026-10-08).
const NEMOTRON_ULTRA = { input: 1.00, output: 3.00, context: 1_048_576 };
const NEMOTRON_SUPER = { input: 0.30, output: 0.90, context: 262_144 };
const NEMOTRON_NANO = { input: 0.06, output: 0.24, context: 262_144 };
const NEMOTRON_LIGHTNING = { input: 0.06, output: 0.24, context: 1_048_576 };

// Prices as of 2026-10-07 — first-party pages:
//   platform.claude.com/docs/en/about-claude/pricing
//   developers.openai.com/api/docs/models
//   docs.x.ai/developers/models
//   ai.google.dev/gemini-api/docs/pricing
const ASOF = '2026-10-07';
// Nemotron: read from the Token Factory API (see above).
const ASOF_NEBIUS = '2026-10-08';

function e(provider: string, tier: Tier, price: Price): CatalogEntry {
  return { provider, tier, asOf: provider === 'Nebius' ? ASOF_NEBIUS : ASOF, ...price };
}

// Order is kept from the 1.6.6 MODELS table (new entries appended), so
// preflight()'s option ordering for equal costs doesn't move.
export const CATALOG: Record<string, CatalogEntry> = {
  // Anthropic — live names + generic aliases (same rates)
  'claude-fable-5.1':  e('Anthropic', 4, FABLE),
  'claude-fable-5':    e('Anthropic', 4, FABLE),
  'claude-mythos-5.1': e('Anthropic', 4, FABLE),
  'claude-mythos-5':   e('Anthropic', 4, FABLE),
  'claude-opus-5.5':   e('Anthropic', 3, OPUS_55),
  'claude-opus-5':     e('Anthropic', 3, OPUS),
  'claude-opus-4.8':   e('Anthropic', 3, OPUS),
  'claude-opus':       e('Anthropic', 3, OPUS),
  'claude-opus-4.7':   e('Anthropic', 3, OPUS),
  'claude-opus-4.6':   e('Anthropic', 3, OPUS),
  'claude-opus-4.5':   e('Anthropic', 3, OPUS),
  'claude-sonnet-5.5': e('Anthropic', 2, SONNET),
  'claude-sonnet-5':   e('Anthropic', 2, SONNET),
  'claude-sonnet':     e('Anthropic', 2, SONNET),
  'claude-sonnet-4.6': e('Anthropic', 2, SONNET_4X),
  'claude-sonnet-4.5': e('Anthropic', 2, SONNET_4X),
  'claude-haiku-4.5':  e('Anthropic', 1, HAIKU),
  'claude-haiku':      e('Anthropic', 1, HAIKU),
  // xAI — flagship 4.6, cheap same-provider 4.3. 4.20 / fast are aliases.
  'grok-4.7':          e('xAI', 3, GROK_46),
  'grok-4.6':          e('xAI', 3, GROK_46),
  'grok-4.5':          e('xAI', 3, GROK_46),
  'grok-build-0.1':    e('xAI', 2, GROK_BUILD),
  'grok-4.3':          e('xAI', 2, GROK_43),
  'grok-4.20':         e('xAI', 2, GROK_43),
  'grok-4-1-fast':     e('xAI', 2, GROK_43),
  // Google
  'gemini-3.1-pro':         e('Google', 3, GEMINI_PRO),
  'gemini-3.1-pro-preview': e('Google', 3, GEMINI_PRO),
  'gemini-3.8-flash':       e('Google', 2, GEMINI_FLASH_3X),
  'gemini-3.7-flash':       e('Google', 2, GEMINI_FLASH_3X),
  'gemini-3.6-flash':       e('Google', 2, GEMINI_FLASH_3X),
  'gemini-3.5-flash':       e('Google', 2, GEMINI_35_FLASH),
  'gemini-3.1-flash-lite':  e('Google', 1, GEMINI_31_FLASH_LITE),
  'gemini-3.5-flash-lite':  e('Google', 1, GEMINI_FLASH),
  'gemini-2.5-flash':       e('Google', 2, GEMINI_FLASH),
  // OpenAI — live 5.6 ladder + GPT-6. 5.4 family kept as aliases (old prices).
  'gpt-6-astra':       e('OpenAI', 4, GPT_6_ASTRA),
  'gpt-6.1-sol':       e('OpenAI', 3, GPT_6_SOL),
  'gpt-6-sol':         e('OpenAI', 3, GPT_6_SOL),
  'gpt-6-luna':        e('OpenAI', 1, GPT_6_LUNA),
  'gpt-5.6-sol':       e('OpenAI', 3, GPT_SOL),
  'gpt-5.6-terra':     e('OpenAI', 2, GPT_TERRA),
  'gpt-5.6-luna':      e('OpenAI', 1, GPT_LUNA),
  'gpt-5.4':           e('OpenAI', 3, GPT_54),
  'gpt-5.4-mini':      e('OpenAI', 2, GPT_54_MINI),
  'gpt-5.4-nano':      e('OpenAI', 1, GPT_54_NANO),
  // NVIDIA Nemotron, served and billed by Nebius Token Factory
  'nemotron-3-ultra':       e('Nebius', 3, NEMOTRON_ULTRA),
  'nemotron-3-super':       e('Nebius', 2, NEMOTRON_SUPER),
  'nemotron-3-nano':        e('Nebius', 1, NEMOTRON_NANO),
  'nemotron-3.5-lightning': e('Nebius', 1, NEMOTRON_LIGHTNING),
};

/**
 * Real API IDs that don't follow the table's naming → table keys.
 * Lowercased; canonicalModel() lowercases before looking here. The Nebius IDs
 * are the ones Token Factory lists (GET /v1/models, 2026-10-08).
 */
export const API_ALIASES: Record<string, string> = {
  'nvidia/nemotron-3-ultra-550b-a55b': 'nemotron-3-ultra',
  'nvidia/nemotron-3-super-120b-a12b': 'nemotron-3-super',
  'nvidia/nemotron-3_5-lightning': 'nemotron-3.5-lightning',
  'nvidia/nvidia-nemotron-3-nano-30b-a3b': 'nemotron-3-nano',
};
