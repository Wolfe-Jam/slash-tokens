// rewrite-server-json.ts — the one-time io.github.* -> one.faf/* identity rewrite
// for a server.json, used by /migrate-onefaf.
//
//   name   -> registryName(.faf)            (e.g. one.faf/<server>)
//   _meta  -> registryMeta(.faf)            (honest-first, nested under publisher-provided)
//   remotes-> DROPPED                       (a remote URL belongs to one entry during the
//                                            transition; re-add after the old entry is deprecated)
// Everything else (packages, icons, version, repository, websiteUrl) is preserved.
//
// Usage:  bun rewrite-server-json.ts <server-dir>
// Read-only on the .faf; writes only <server-dir>/server.json.
import { writeFileSync, readFileSync } from "fs";
import { findFafFile, readFaf } from "/Users/wolfejam/FAF/cli/src/interop/faf.ts";
import { registryName, registryMeta } from "/Users/wolfejam/FAF/cli/src/interop/servercard.ts";

const dir = process.argv[2] || ".";
const fafPath = findFafFile(dir);
if (!fafPath) { console.error(`🚫 no .faf found in ${dir}`); process.exit(1); }
const data = readFaf(fafPath);

const sjPath = `${dir}/server.json`;
const sj = JSON.parse(readFileSync(sjPath, "utf8"));
const oldName = sj.name;

const newName = registryName(data);
if (!newName.startsWith("one.faf/")) {
  console.error(`🚫 registryName derived '${newName}', not one.faf/* — add 'homepage: https://faf.one' to the .faf first.`);
  process.exit(1);
}

sj.name = newName;
const dropped = (sj.remotes || []).map((r: { url: string }) => r.url);
delete sj.remotes;
sj._meta = registryMeta(data);

writeFileSync(sjPath, JSON.stringify(sj, null, 2) + "\n");
console.log(`✓ name: ${oldName} → ${sj.name}`);
if (dropped.length) console.log(`  dropped ${dropped.length} remote(s) (transition; re-add after deprecating old): ${dropped.join(", ")}`);
console.log(`  _meta: ${Object.keys(sj._meta)[0]}`);
