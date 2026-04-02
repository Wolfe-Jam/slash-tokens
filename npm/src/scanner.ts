import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { slash } from './slash';
import { AI_PATTERNS, SKIP_DIRS, SCAN_EXTENSIONS, Pattern } from './patterns';

export interface CallSite {
  file: string;
  line: number;
  sdk: string;
  tokensPerCall: number;
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

function findCallSites(filePath: string, content: string): CallSite[] {
  const sites: CallSite[] = [];
  const lines = content.split('\n');

  for (const pattern of AI_PATTERNS) {
    // Reset regex
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNum = beforeMatch.split('\n').length;

      // Estimate tokens from surrounding context (grab the function/block)
      const startLine = Math.max(0, lineNum - 5);
      const endLine = Math.min(lines.length, lineNum + 20);
      const context = lines.slice(startLine, endLine).join('\n');
      const tokensPerCall = slash(context);

      // Avoid duplicates at same location
      if (!sites.some(s => s.line === lineNum && s.sdk === pattern.name)) {
        sites.push({
          file: filePath,
          line: lineNum,
          sdk: pattern.name,
          tokensPerCall,
        });
      }
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
