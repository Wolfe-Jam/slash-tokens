import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { slash } from './slash.js';
import {
  AI_PATTERNS,
  SKIP_DIRS,
  SCAN_EXTENSIONS,
  Pattern,
  SDK_REPRESENTATIVE_MODEL,
  UNKNOWN_SDK_REPRESENTATIVE_MODEL,
} from './patterns.js';

export interface CallSite {
  file: string;
  line: number;
  sdk: string;
  tokensPerCall: number;
  /** The representative model used to calibrate/price this site — see
   * patterns.ts SDK_REPRESENTATIVE_MODEL. Not the actual runtime model
   * (the scanner can't know that from source alone). */
  estimatedModel: string;
}

function walkDir(dir: string, files: string[]): void {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      walkDir(full, files);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
}

function matchLines(regex: RegExp | undefined, content: string): number[] {
  if (!regex) return [];
  const found: number[] = [];
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const line = content.substring(0, match.index).split('\n').length;
    if (!found.includes(line)) found.push(line);
  }
  return found;
}

function findCallSites(filePath: string, content: string): CallSite[] {
  const sites: CallSite[] = [];
  const lines = content.split('\n');

  for (const pattern of AI_PATTERNS) {
    const callLines = matchLines(pattern.call, content);
    const siteLines = callLines.length > 0 ? callLines : matchLines(pattern.uses, content).slice(0, 1);
    const estimatedModel = SDK_REPRESENTATIVE_MODEL[pattern.name] ?? UNKNOWN_SDK_REPRESENTATIVE_MODEL;

    for (const lineNum of siteLines) {
      // Estimate tokens from surrounding context (grab the function/block)
      const startLine = Math.max(0, lineNum - 5);
      const endLine = Math.min(lines.length, lineNum + 20);
      const context = lines.slice(startLine, endLine).join('\n');
      sites.push({
        file: filePath,
        line: lineNum,
        sdk: pattern.name,
        tokensPerCall: slash(context, estimatedModel),
        estimatedModel,
      });
    }
  }

  return sites;
}

export function scan(dir: string): { sites: CallSite[]; filesScanned: number; timeMs: number } {
  const start = performance.now();
  const files: string[] = [];
  walkDir(dir, files);

  const sites: CallSite[] = [];
  for (const file of files) {
    let content;
    try { content = readFileSync(file, 'utf-8'); } catch { continue; }
    sites.push(...findCallSites(file, content));
  }

  return {
    sites,
    filesScanned: files.length,
    timeMs: Math.round(performance.now() - start),
  };
}
