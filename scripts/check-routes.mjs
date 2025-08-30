// scripts/check-routes.mjs
import { glob } from 'glob';
import path from 'path';

const files = await glob('src/app/**/page.{ts,tsx}', { nodir: true });
const routes = files.map(f => {
    const p = f.replace(/^src\/app/, '').replace(/\/page\.(ts|tsx)$/, '') || '/';
    return p.replace(/\[([^\]]+)\]/g, ':$1'); // normalize
});

const map = new Map();
for (const r of routes) {
    const key = r.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
}

const conflicts = [...map.entries()].filter(([, arr]) => new Set(arr).size > 1);
if (conflicts.length) {
    console.log('Route conflicts (case/alias):');
    for (const [k, arr] of conflicts) console.log(`- ${k} -> ${arr.join(' , ')}`);
    process.exitCode = 2;
} else {
    console.log('No route conflicts ✅');
}
