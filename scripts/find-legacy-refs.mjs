// scripts/find-legacy-refs.mjs
import { glob } from 'glob';
import { promises as fs } from 'fs';

const NEEDLES = [
    'streams_with_url_v2',
    'StreamPageClientV2',
    'GoLiveButtonV1',
    'OldStreamControls',
];

const files = await glob('src/**/*.{ts,tsx}', { nodir: true });
let hits = [];
for (const f of files) {
    const txt = await fs.readFile(f, 'utf8');
    for (const n of NEEDLES) {
        if (txt.includes(n)) hits.push({ file: f, needle: n });
    }
}
if (hits.length === 0) {
    console.log('No legacy refs found ✅');
} else {
    console.log('Legacy refs:');
    for (const h of hits) console.log(`- ${h.needle} @ ${h.file}`);
    process.exitCode = 2;
}
