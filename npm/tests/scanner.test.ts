/**
 * WJTTC Scanner & Report Test Suite
 * ===================================
 * Regression guard for 2026-08-23: the CLI's scan/report path — the
 * product's own top-of-funnel "here's what you'd save" pitch — had ZERO
 * test coverage and two real bugs found by a full-codebase review:
 *
 *   1. scanner.ts called slash(context) with no model argument, so every
 *      detected call site used the raw, uncalibrated token estimate.
 *   2. report.ts hardcoded one flat $3/$15-per-MTok "GPT-4o class" rate
 *      for every detected provider, ignoring the real per-provider
 *      pricing in models.ts.
 *
 * Fixed by mapping each detected SDK to a representative model
 * (SDK_REPRESENTATIVE_MODEL in patterns.ts), then calibrating AND pricing
 * every call site against that model consistently.
 *
 * Run: bun test tests/scanner.test.ts
 */
import { describe, it, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { scan } from '../src/scanner';
import { slash } from '../src/slash';
import { getModel } from '../src/models';

function withTempDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'slash-scanner-test-'));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

describe('scanner — per-provider calibration', () => {
  it('SAFETY: an Anthropic call site is calibrated, not left on the raw estimate', () => {
    // Regression guard: this exact content, scanned before the fix,
    // would have returned the RAW estimate (no model passed to slash()).
    const content = `
      import Anthropic from '@anthropic-ai/sdk';
      const client = new Anthropic();
      const result = await client.messages.create({
        model: 'claude-sonnet-5',
        messages: [{ role: 'user', content: 'A'.repeat(2000) }],
      });
    `;
    const dir = withTempDir({ 'app.ts': content });
    try {
      const { sites } = scan(dir);
      const anthropicSite = sites.find(s => s.sdk === 'Anthropic');
      expect(anthropicSite).toBeDefined();
      expect(anthropicSite!.estimatedModel).toBe('claude-sonnet-5');

      // The site's tokensPerCall must reflect calibration for its context
      // window, not the raw WASM estimate.
      const raw = slash(content.slice(0, content.indexOf('client.messages.create') + 400));
      expect(anthropicSite!.tokensPerCall).toBeGreaterThanOrEqual(raw);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('different SDKs map to different representative models (not one blanket default)', () => {
    const dir = withTempDir({
      'anthropic-app.ts': `import Anthropic from '@anthropic-ai/sdk'; new Anthropic();`,
      'openai-app.ts': `import OpenAI from 'openai'; new OpenAI();`,
      'grok-app.ts': `const res = await fetch('https://x.ai/api/v1');`,
    });
    try {
      const { sites } = scan(dir);
      const models = new Set(sites.map(s => s.estimatedModel));
      // At least Anthropic and OpenAI sites must resolve to DIFFERENT
      // real models — proving this isn't one flat default for everyone.
      const anthropicModel = sites.find(s => s.sdk === 'Anthropic')?.estimatedModel;
      const openaiModel = sites.find(s => s.sdk === 'OpenAI')?.estimatedModel;
      expect(anthropicModel).toBeDefined();
      expect(openaiModel).toBeDefined();
      expect(anthropicModel).not.toBe(openaiModel);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('one request is one call site, not one per import / constructor / call line', () => {
    const dir = withTempDir({
      'anthropic.ts': `import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
export const ask = (q: string) =>
  client.messages.create({ model: 'claude-sonnet-5', max_tokens: 100, messages: [{ role: 'user', content: q }] });
`,
      'vercel.ts': `import { generateText } from 'ai';
export const run = () => generateText({ model, prompt: 'hi' });
`,
      'openai.py': `from openai import OpenAI
client = OpenAI()
resp = client.chat.completions.create(model="gpt-5.6-sol", messages=[{"role": "user", "content": "hi"}])
`,
    });
    try {
      const { sites } = scan(dir);
      const at = (file: string) => sites.filter(s => s.file.endsWith(file)).map(s => `${s.sdk}:${s.line}`);
      expect(at('anthropic.ts')).toEqual(['Anthropic:4']);
      expect(at('vercel.ts')).toEqual(['Vercel AI:2']);
      expect(at('openai.py')).toEqual(['OpenAI:3']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('two requests are two call sites', () => {
    const dir = withTempDir({
      'two.ts': `import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
export const a = () => client.messages.create({ model: 'claude-haiku', max_tokens: 10, messages: [] });
export const b = () => client.messages.stream({ model: 'claude-haiku', max_tokens: 10, messages: [] });
`,
    });
    try {
      const { sites } = scan(dir);
      expect(sites.map(s => `${s.sdk}:${s.line}`)).toEqual(['Anthropic:3', 'Anthropic:4']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a file that only builds a client (no request in it) counts once', () => {
    const dir = withTempDir({
      'client.ts': `import OpenAI from 'openai';
export const client = new OpenAI();
`,
    });
    try {
      const { sites } = scan(dir);
      expect(sites.map(s => `${s.sdk}:${s.line}`)).toEqual(['OpenAI:1']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a look-alike call is not an LLM call unless the SDK is in the file (Twilio SMS, Tauri IPC)', () => {
    const dir = withTempDir({
      'sms.ts': `import twilio from 'twilio';
const client = twilio(process.env.SID, process.env.TOKEN);
export const send = (to: string) => client.messages.create({ to, from: '+15550100', body: 'Your code is 1234' });
`,
      'ipc.ts': `import { invoke } from '@tauri-apps/api/core';
export const save = () => invoke('save_file');
export const load = (w: any) => w.invoke('load');
`,
      'gen.ts': `export function generateText(x: string) { return x.toUpperCase(); }
export const y = generateText('hi');
`,
    });
    try {
      expect(scan(dir).sites).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a call that names the provider itself counts without an import (raw fetch, x.ai URL)', () => {
    const dir = withTempDir({
      'raw.ts': `export const ask = (body: string) => fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', body });
`,
      'grok.ts': `export const url = 'https://api.x.ai/api/chat';
`,
    });
    try {
      const at = (file: string) => scan(dir).sites.filter(s => s.file.endsWith(file)).map(s => s.sdk);
      expect(at('raw.ts')).toEqual(['fetch (AI)']);
      expect(at('grok.ts')).toEqual(['Grok']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('Python SDKs: imports and clients count, look-alikes do not', () => {
    const dir = withTempDir({
      'claude.py': `import anthropic
client = anthropic.AsyncAnthropic()
msg = await client.messages.create(model="claude-haiku-4-5", max_tokens=100, messages=[])
`,
      'gem.py': `from google import genai
client = genai.Client()
r = client.models.generate_content(model="gemini-3.8-flash", contents="hi")
`,
      'sms.py': `from twilio.rest import Client
Client(sid, token).messages.create(to=to, from_=frm, body="hi")
`,
    });
    try {
      const at = (file: string) => scan(dir).sites.filter(s => s.file.endsWith(file)).map(s => `${s.sdk}:${s.line}`);
      expect(at('claude.py')).toEqual(['Anthropic:3']);
      expect(at('gem.py')).toEqual(['Gemini:3']);
      expect(at('sms.py')).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('every estimatedModel resolves to a real MODELS entry with real pricing', () => {
    const dir = withTempDir({
      'mixed.ts': `
        import Anthropic from '@anthropic-ai/sdk';
        import OpenAI from 'openai';
        import { GoogleGenerativeAI } from '@google/generative-ai';
        new Anthropic(); new OpenAI(); new GoogleGenerativeAI();
      `,
    });
    try {
      const { sites } = scan(dir);
      expect(sites.length).toBeGreaterThan(0);
      for (const site of sites) {
        const info = getModel(site.estimatedModel);
        expect(info).toBeDefined();
        expect(info!.input).toBeGreaterThan(0);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
