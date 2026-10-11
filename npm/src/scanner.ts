import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname, relative, sep } from 'path';
import { slash } from './slash.js';
import {
  AI_PATTERNS,
  SKIP_DIRS,
  SCAN_EXTENSIONS,
  TEST_DIRS,
  TEST_FILE,
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

export interface ScanOptions {
  /** Scan test code too (test dirs, *.test.*, *.spec.*, test_*.py). Default false. */
  includeTests?: boolean;
}

/**
 * `.slashignore` at the scan root: one path or pattern per line, relative to
 * the root; `#` comments; a trailing `/` matches a folder; `*` matches within
 * one path segment, `**` across segments.
 */
export function readSlashIgnore(root: string): RegExp[] {
  let text = '';
  try { text = readFileSync(join(root, '.slashignore'), 'utf-8'); } catch { return []; }
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(p => {
    const dir = p.endsWith('/');
    const body = p.replace(/^\/+|\/+$/g, '').split('**').map(part =>
      part.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*');
    return new RegExp(`^${body}${dir ? '/' : '(/|$)'}`);
  });
}

function walkDir(root: string, dir: string, files: string[], skipped: { tests: number; ignored: number }, opts: ScanOptions, ignore: RegExp[]): void {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    const rel = relative(root, full).split(sep).join('/') + (stat.isDirectory() ? '/' : '');
    if (ignore.some(re => re.test(rel))) { skipped.ignored++; continue; }
    if (stat.isDirectory()) {
      if (!opts.includeTests && TEST_DIRS.has(entry)) { skipped.tests++; continue; }
      walkDir(root, full, files, skipped, opts, ignore);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      if (!opts.includeTests && TEST_FILE.test(entry)) { skipped.tests++; continue; }
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
    const usesLines = matchLines(pattern.uses, content);
    // A call counts where it names the provider itself, or where the SDK is in use.
    const callLines = pattern.standalone || !pattern.uses || usesLines.length > 0 ? matchLines(pattern.call, content) : [];
    const siteLines = callLines.length > 0 ? callLines : usesLines.slice(0, 1);
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

export function scan(dir: string, opts: ScanOptions = {}): { sites: CallSite[]; filesScanned: number; timeMs: number; skipped: { tests: number; ignored: number } } {
  const start = performance.now();
  const files: string[] = [];
  const skipped = { tests: 0, ignored: 0 };
  walkDir(dir, dir, files, skipped, opts, readSlashIgnore(dir));

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
    skipped,
  };
}
