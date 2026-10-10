/**
 * Open-source repos in the savings study, pinned to the commit measured.
 *
 * `scan` repos are read by a call-site extractor: one site per call matching
 * `call`, model from the call's own arguments, else the file's MODEL / MODEL_ID,
 * else `defaultModel` (the SDK default when the code names none).
 * `sites` repos are listed by hand where models are passed as variables.
 */

export type Site = { file: string; line: number; model: string; maxTokens: number; job: string };

export type Repo = {
  name: string;
  url: string;
  commit: string;
  provider: string;
} & (
  | { scan: { glob: string; call: string; defaultModel?: string } }
  | { sites: Site[] }
);

export const REPOS: Repo[] = [
  {
    name: 'anthropics/claude-quickstarts',
    url: 'https://github.com/anthropics/claude-quickstarts',
    commit: '9ec32b91df50b0d4906cae64b13c6298055ff40d',
    provider: 'Anthropic',
    sites: [
      { file: 'agents/agent.py', line: 113, model: 'claude-sonnet-5-5', maxTokens: 4096, job: 'general agent loop' },
      { file: 'computer-use-best-practices/computer_use/loop.py', line: 268, model: 'claude-sonnet-4-6', maxTokens: 16000, job: 'computer-use agent (CLI default)' },
      { file: 'computer-use-best-practices/dev_ui/localization_demo/server.py', line: 128, model: 'claude-haiku-4-5', maxTokens: 2048, job: 'UI element localization' },
      { file: 'financial-data-analyst/app/api/finance/route.ts', line: 214, model: 'claude-sonnet-5-5', maxTokens: 4096, job: 'chart data via a tool call' },
      { file: 'customer-support-agent/app/api/chat/route.ts', line: 226, model: 'claude-haiku-4-5-20251001', maxTokens: 1000, job: 'support chat' },
      { file: 'computer-use-demo/computer_use_demo/loop.py', line: 169, model: 'claude-opus-4-8', maxTokens: 4096, job: 'computer-use agent' },
      { file: 'browser-use-demo/browser_use_demo/loop.py', line: 140, model: 'claude-sonnet-4-5-20250929', maxTokens: 4096, job: 'browser agent' },
      { file: 'browser-use-demo/browser_use_demo/tools/browser.py', line: 948, model: 'claude-sonnet-5-5', maxTokens: 800, job: 'find elements in an accessibility tree' },
    ],
  },
  {
    name: 'xai-org/xai-cookbook',
    url: 'https://github.com/xai-org/xai-cookbook',
    commit: '316ba56c8e389b7c6b8b8e6c5eb625ab7b5359c5',
    provider: 'xAI',
    scan: { glob: 'examples/**/typescript/src/*.ts', call: 'responses\\.create\\(' },
  },
  {
    name: 'openai/openai-agents-python',
    url: 'https://github.com/openai/openai-agents-python',
    commit: '125efa029b4bfd84238bd2c4fd69c3406f802663',
    provider: 'OpenAI',
    // src/agents/models/default_models.py: get_default_model() -> "gpt-5.6-luna"
    scan: { glob: 'examples/**/*.py', call: '\\bAgent\\(', defaultModel: 'gpt-5.6-luna' },
  },
  {
    name: 'google-gemini/cookbook',
    url: 'https://github.com/google-gemini/cookbook',
    commit: 'dd5b15da88a49309f3e66d30d3ee8de70ab99f9d',
    provider: 'Google',
    scan: { glob: 'quickstarts/*.ipynb', call: 'generate_content(_stream)?\\(' },
  },
];
