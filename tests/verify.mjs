import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { buildDossier } from '../vendor/makefun-frontend.ts';

const repository = fileURLToPath(new URL('../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const vendor = readFileSync(join(repository, 'vendor/makefun-frontend.ts'));
assert.equal(digest(vendor), '4c8da1c8e76490b3a847670f49137d3ec23953e3c988fe6a6cb320fce5739240', 'Vendor matches supplied kit byte for byte');
const caps = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 };
const directory = mkdtempSync(join(tmpdir(), 'fieldnote-verify-'));
function manifest(root) {
  const result = {};
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = join(path, entry.name);
      assert.ok(!lstatSync(filename).isSymbolicLink(), 'No symbolic links');
      if (entry.isDirectory()) visit(filename);
      else result[relative(root, filename)] = digest(readFileSync(filename));
    }
  }
  visit(root);
  return result;
}
try {
  const outputs = ['first', 'second'].map(name => join(directory, name));
  for (const output of outputs) {
    console.log(`Checking ${relative(directory, output)} packaging run…`);
    const execution = spawnSync(process.execPath, ['--experimental-strip-types', join(repository, 'main.ts')], { cwd: repository, env: { ...process.env, MAKEFUN_OUTPUT_DIR: output }, encoding: 'utf8', timeout: 12000 });
    assert.equal(execution.status, 0, execution.stderr || execution.stdout);
    console.log('Comparing generated dossier with independent rebuild…');
    const generated = readFileSync(join(output, 'dossier.json'));
    const rebuilt = Buffer.from(buildDossier(output, caps));
    assert.ok(generated.equals(rebuilt), 'Dossier bytes exactly match independent library rebuild');
  }
  assert.deepEqual(manifest(outputs[0]), manifest(outputs[1]), 'Two executions produce identical file bytes');
  const images = readdirSync(join(outputs[0], 'screenshots'));
  assert.ok(images.length >= 3 && images.length <= 4);
  for (const name of images) {
    assert.match(name, /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);
    assert.ok(statSync(join(outputs[0], 'screenshots', name)).size <= 262144);
    const image = readFileSync(join(outputs[0], 'screenshots', name));
    assert.equal(image[0], 0xff); assert.equal(image[1], 0xd8);
  }
  const appFiles = readdirSync(join(repository, 'app'), { recursive: true }).filter(name => statSync(join(repository, 'app', name)).isFile());
  const raw = appFiles.reduce((total, name) => total + statSync(join(repository, 'app', name)).size, 0);
  const gzipped = appFiles.reduce((total, name) => total + gzipSync(readFileSync(join(repository, 'app', name)), { level: 9 }).length, 0);
  assert.ok(raw < 16777216 && appFiles.length < 993);
  const html = readFileSync(join(repository, 'app/index.html'), 'utf8');
  assert.ok(!/(?:src|href)=["']https?:/i.test(html), 'Initial document loads local resources only');
  console.log(JSON.stringify({ deterministic: true, vendorUnchanged: true, dossierExact: true, screenshots: images.length, appFiles: appFiles.length, appRawBytes: raw, appGzipBytes: gzipped, outputFiles: Object.keys(manifest(outputs[0])).length }, null, 2));
} finally {
  rmSync(directory, { recursive: true, force: true });
}
