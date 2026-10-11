export interface Pattern {
  name: string;
  /** A request to the model. Each match is one call site. */
  call?: RegExp;
  /** The SDK is in use (an import, a client being built). Not a request:
   * it counts as one call site only in a file with no matched call, e.g. a
   * client built here and passed to a wrapper. An import plus a client plus
   * one request is one call site, not three. */
  uses?: RegExp;
  /** The call names the provider by itself (an API URL, a provider-named
   * client), so it counts without `uses` in the file. Otherwise a call counts
   * only where the SDK is in use: `.messages.create(` is also Twilio's SMS
   * API, and `.invoke(` is also Tauri / Electron IPC. */
  standalone?: boolean;
}

export const AI_PATTERNS: Pattern[] = [
  // OpenAI
  { name: 'OpenAI', call: /\.(?:chat\.completions|responses)\.create\(/g, uses: /\b(?:Async|Azure)?OpenAI\(|from\s+['"]openai['"]|^\s*(?:from\s+openai\s+import|import\s+openai)\b/gm },
  // Anthropic
  { name: 'Anthropic', call: /\.messages\.(?:create|stream)\(/g, uses: /\b(?:Async)?Anthropic\(|from\s+['"]@anthropic-ai|^\s*(?:from\s+anthropic\s+import|import\s+anthropic)\b/gm },
  // Vercel AI SDK
  { name: 'Vercel AI', call: /\b(?:generateText|streamText|generateObject|streamObject)\(/g, uses: /from\s+['"]ai['"]/g },
  // LangChain
  { name: 'LangChain', call: /\.invoke\(/g, uses: /from\s+['"]@?langchain|^\s*(?:from|import)\s+langchain|ChatOpenAI|ChatAnthropic/gm },
  // Google Gemini
  { name: 'Gemini', call: /\.(?:generateContent(?:Stream)?|generate_content(?:_stream)?)\(/g, uses: /GoogleGenerativeAI|from\s+['"]@google\/gen|^\s*(?:import\s+google\.generativeai|from\s+google(?:\.genai|\s+import\s+genai))/gm },
  // AWS Bedrock
  { name: 'Bedrock', call: /InvokeModelCommand\(/g, uses: /BedrockRuntimeClient/g },
  // xAI Grok
  { name: 'Grok', call: /x\.ai\/api|xai\.chat/g, uses: /from\s+['"]grok/g, standalone: true },
  // Raw fetch to AI endpoints
  { name: 'fetch (AI)', call: /fetch\(.*api\.openai\.com|fetch\(.*api\.anthropic\.com|fetch\(.*generativelanguage\.googleapis/g, standalone: true },
  // Cohere
  { name: 'Cohere', call: /cohere\.chat/g, uses: /from\s+['"]cohere|CohereClient/g, standalone: true },
  // Mistral
  { name: 'Mistral', uses: /from\s+['"]@mistralai|MistralClient/g },
];

// Representative model per detected SDK — the scanner only ever sees an
// SDK name (a regex match on import/call syntax), never the actual model
// string passed at runtime, so there's no way to know the exact model a
// found call site uses. Fixed 2026-08-23: this used to mean every SDK got
// the raw, uncalibrated token estimate AND one flat hardcoded $3/$15
// "GPT-4o class" price regardless of provider — the product's own
// top-of-funnel "here's what you'd save" numbers were both uncalibrated
// and mispriced for every provider except whichever one happened to match
// that flat rate by coincidence. Mapping each identified SDK to one real,
// representative model lets the scanner apply that model's real
// calibration factor and real price — still an approximation (we don't
// know the exact model), but a real per-provider one instead of a single
// guess applied to everyone.
export const SDK_REPRESENTATIVE_MODEL: Record<string, string> = {
  'Anthropic': 'claude-sonnet-5',
  'OpenAI': 'gpt-5.6-sol',
  'Gemini': 'gemini-3.1-pro',
  'Grok': 'grok-4.6',
};

// Fallback for SDKs that don't map to one specific provider (Vercel AI,
// LangChain, and Bedrock can all wrap any underlying provider; raw
// fetch-to-AI-endpoint and Cohere/Mistral have no pricing data in MODELS
// at all). claude-sonnet is used as a documented, honest middle-of-the-
// road placeholder — not a claim about which model is actually running.
export const UNKNOWN_SDK_REPRESENTATIVE_MODEL = 'claude-sonnet-5';

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', '.turbo', '.cache', '__pycache__', '.venv', 'venv',
  'target', 'zig-out', 'zig-cache',
]);

/** Test code: mocked and example LLM calls, not production traffic. Skipped unless includeTests. */
export const TEST_DIRS = new Set(['test', 'tests', '__tests__', '__mocks__', 'spec', 'fixtures']);
export const TEST_FILE = /(\.(test|spec)\.[cm]?[jt]sx?$)|(^test_.*\.py$)|(_test\.py$)/;

export const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.py', '.rs',
]);
