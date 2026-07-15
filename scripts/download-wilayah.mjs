// One-shot bundler: download provinsi + kabupaten/kota dari emsifa API
// (github.com/emsifa/api-wilayah-indonesia, hosted di GitHub Pages) ke
// public/api-wilayah/ agar dropdown wilayah offline-safe.
//
// Usage: node scripts/download-wilayah.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api';
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'public', 'api-wilayah');

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  await mkdir(join(OUT_DIR, 'regencies'), { recursive: true });

  console.log('Downloading provinces.json …');
  const provinces = await fetchJson(`${BASE}/provinces.json`);
  await writeFile(join(OUT_DIR, 'provinces.json'), JSON.stringify(provinces), 'utf8');
  console.log(`  OK — ${provinces.length} provinsi`);

  console.log('Downloading regencies/*.json …');
  // Parallel 4-at-a-time (be nice to GitHub Pages).
  const concurrency = 4;
  let done = 0;
  for (let i = 0; i < provinces.length; i += concurrency) {
    const batch = provinces.slice(i, i + concurrency);
    await Promise.all(batch.map(async (p) => {
      const list = await fetchJson(`${BASE}/regencies/${p.id}.json`);
      await writeFile(join(OUT_DIR, 'regencies', `${p.id}.json`), JSON.stringify(list), 'utf8');
      done++;
      process.stdout.write(`  ${done}/${provinces.length} ${p.name} (${list.length} kab/kota)      \r`);
    }));
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
