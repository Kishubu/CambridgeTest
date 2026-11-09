import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';

const SERVER_ENTRY = './scripts/local-server.mjs';
const PORT = 5001;

// Démarre un serveur statique local détourné (détaché du processus parent)
const serverProc = spawn(process.execPath, [SERVER_ENTRY], {
  detached: true,
  stdio: 'ignore',
  cwd: process.cwd(),
});
serverProc.unref();

let ready = false;
for (let i = 0; i < 40; i++) {
  try {
    await fetch(`http://127.0.0.1:${PORT}/`);
    ready = true;
    break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 250));
  }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  if (!ready) {
    console.error('[run-local-test] SERVEUR NON DISPONIBLE sur le port', PORT);
    try { serverProc.kill(); } catch (e) {}
    process.exit(1);
  }
  console.error('[run-local-test] serveur prêt');

  let code = 0;
  try {
    const cmd = `npx playwright test --reporter=list --timeout=20000 --workers=1 > test-results/part1-repro-run.log 2>&1`;
    execSync(cmd, { shell: true, cwd: process.cwd(), timeout: 25000 });
  } catch (e) {
    code = e.status != null ? e.status : 1;
    console.error('[run-local-test] tests échoués (code', code, ')');
  }
  const fs = await import('node:fs');
  console.error('[run-local-test] sortie dans test-results/part1-repro-run.log');
  process.exitCode = code;

  try { serverProc.kill(); } catch (e) {}
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  try { serverProc.kill(); } catch (_) {}
  process.exit(1);
});
