// scripts/stream-doctor.mjs
import { execSync } from 'node:child_process';

function run(cmd) {
    try {
        const out = execSync(cmd, { stdio: 'pipe' }).toString().trim();
        console.log(`$ ${cmd}\n${out}\n`);
        return 0;
    } catch (e) {
        console.log(`$ ${cmd}\nEXIT ${e.status}\n${e.stdout?.toString() || ''}${e.stderr?.toString() || ''}\n`);
        return e.status || 1;
    }
}

let rc = 0;
rc |= run('node scripts/find-duplicates.mjs');
rc |= run('node scripts/check-routes.mjs');
rc |= run('node scripts/find-legacy-refs.mjs');
// type & lint
rc |= run('pnpm -s tsc --noEmit');
rc |= run('pnpm -s next lint');
process.exit(rc);
