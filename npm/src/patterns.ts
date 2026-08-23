export interface Pattern {
  name: string;
  regex: RegExp;
}

export const AI_PATTERNS: Pattern[] = [
  // OpenAI
  { name: 'OpenAI', regex: /openai\.chat\.completions\.create|new OpenAI\(|from\s+['"]openai['"]/g },
  // Anthropic
  { name: 'Anthropic', regex: /anthropic\.messages\.create|new Anthropic\(|from\s+['"]@anthropic-ai/g },
  // Vercel AI SDK
  { name: 'Vercel AI', regex: /from\s+['"]ai['"]|generateText|streamText|generateObject/g },
  // LangChain
  { name: 'LangChain', regex: /from\s+['"]langchain|ChatOpenAI|ChatAnthropic|\.invoke\(/g },
  // Google Gemini
  { name: 'Gemini', regex: /GoogleGenerativeAI|generateContent|from\s+['"]@google\/generative/g },
  // AWS Bedrock
  { name: 'Bedrock', regex: /BedrockRuntimeClient|InvokeModelCommand/g },
  // xAI Grok
  { name: 'Grok', regex: /x\.ai\/api|xai\.chat|from\s+['"]grok/g },
  // Raw fetch to AI endpoints
  { name: 'fetch (AI)', regex: /fetch\(.*api\.openai\.com|fetch\(.*api\.anthropic\.com|fetch\(.*generativelanguage\.googleapis/g },
  // Cohere
  { name: 'Cohere', regex: /from\s+['"]cohere|CohereClient|cohere\.chat/g },
  // Mistral
  { name: 'Mistral', regex: /from\s+['"]@mistralai|MistralClient/g },
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
  'Anthropic': 'claude-sonnet',
  'OpenAI': 'gpt-5.4',
  'Gemini': 'gemini-3.1-pro',
  'Grok': 'grok-4.20',
};

// Fallback for SDKs that don't map to one specific provider (Vercel AI,
// LangChain, and Bedrock can all wrap any underlying provider; raw
// fetch-to-AI-endpoint and Cohere/Mistral have no pricing data in MODELS
// at all). claude-sonnet is used as a documented, honest middle-of-the-
// road placeholder — not a claim about which model is actually running.
export const UNKNOWN_SDK_REPRESENTATIVE_MODEL = 'claude-sonnet';

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', '.turbo', '.cache', '__pycache__', '.venv', 'venv',
  'target', 'zig-out', 'zig-cache',
]);

export const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.py', '.rs',
]);
