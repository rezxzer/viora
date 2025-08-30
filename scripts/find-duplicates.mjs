// scripts/find-duplicates.mjs
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { glob } from 'glob';

const GLOBS = [
    'src/app/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
];

function sha1(buf) {
    return createHash('sha1').update(buf).digest('hex');
}

const groups = new Map();

for (const pattern of GLOBS) {
    const files = await glob(pattern, { nodir: true, ignore: ['**/*.d.ts', '**/*.test.*'] });
    for (const file of files) {
        const buf = await fs.readFile(file);
        const hash = sha1(buf);
        if (!groups.has(hash)) groups.set(hash, []);
        groups.get(hash).push(file);
    }
}

const dupes = [...groups.values()].filter(a => a.length > 1);
if (dupes.length === 0) {
    console.log('No exact-content duplicates found ✅');
} else {
    console.log('Duplicate file groups:');
    for (const g of dupes) console.log('- ' + g.join(' | '));
    process.exitCode = 2; // signal attention
}
