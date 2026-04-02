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

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.svelte-kit',
  'coverage', '.turbo', '.cache', '__pycache__', '.venv', 'venv',
  'target', 'zig-out', 'zig-cache',
]);

export const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.py', '.rs',
]);
