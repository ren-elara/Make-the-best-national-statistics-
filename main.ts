import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The executable entry point packages the already-rendered, completely local atlas.
const repository = fileURLToPath(new URL('.', import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
if ([resolve(repository), resolve(repository, 'app'), resolve(repository, 'screenshots')].includes(destination)) {
  throw new Error('Choose an output directory outside the source directories.');
}
const screenshots = join(repository, 'screenshots');
if (!existsSync(screenshots)) throw new Error('Capture the running site with node tests/browser.mjs --capture first.');
const images = readdirSync(screenshots).filter(name => /\.(?:png|jpe?g)$/i.test(name));
if (images.length < 3 || images.length > 4) throw new Error('The submission requires three or four genuine browser screenshots.');
mkdirSync(destination, { recursive: true });
cpSync(join(repository, 'app'), join(destination, 'app'), { recursive: true });
cpSync(screenshots, join(destination, 'screenshots'), { recursive: true });
const caps = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 };
const dossier = buildDossier(destination, caps);
writeFileSync(join(destination, 'dossier.json'), dossier);
console.log(`Fieldnote packaged: ${images.length} screenshots; ${Buffer.byteLength(dossier)} dossier bytes.`);
