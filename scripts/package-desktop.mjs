import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const version = '44.4.0';
const zipName = `electron-v${version}-win32-x64.zip`;
const checksums = JSON.parse(await readFile(join(dirname(createRequire(import.meta.url).resolve('electron/package.json')), 'checksums.json'), 'utf8'));
let electronZipDir;
const cache = join(process.env.LOCALAPPDATA || '', 'electron/Cache');
for (const entry of await readdir(cache, { withFileTypes: true }).catch(() => [])) {
  if (!entry.isDirectory()) continue;
  const dir = join(cache, entry.name);
  try {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(join(dir, zipName))) hash.update(chunk);
    if (hash.digest('hex') === checksums[zipName]) { electronZipDir = dir; break; }
  } catch { /* use normal verified download when cache is absent */ }
}
// Only disposable output under this project's dist directory is replaced.
const paths = await packager({ dir: 'dist/desktop', out: 'dist/releases', name: 'Tessera', platform: 'win32', arch: 'x64', electronVersion: version, ...(electronZipDir ? { electronZipDir } : {}), asar: false, overwrite: true, prune: false });
execFileSync('tar.exe', ['-a', '-c', '-f', resolve('dist/releases/Tessera-win32-x64.zip'), '-C', resolve('dist/releases'), 'Tessera-win32-x64'], { windowsHide: true });
console.log(paths.join('\n'));
