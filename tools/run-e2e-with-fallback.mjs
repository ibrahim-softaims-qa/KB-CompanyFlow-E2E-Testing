// Runs the e2e suite against the local app. Falls back to the hosted
// Netlify demo — loudly, since that deployed build has none of this
// project's data-testid attributes, so most specs beyond smoke.spec.ts are
// expected to fail there — for any of three distinct ways "the local app
// isn't usable" can happen:
//
//   1. The local server's command crashes before ever serving anything
//      (wrong Node version, missing deps, a broken build).
//   2. webServer.url is misconfigured (e.g. a typo like "locahost"), so
//      Playwright polls the wrong address and just times out even though
//      the app itself booted fine.
//   3. Something else entirely is already answering on port 4300 (a
//      leftover dev server, etc.) — Playwright's own readiness check only
//      asks "does anything respond?", so it silently adopts it as if it
//      were the app; there's no error for it to react to at all.
//
// (1) and (2) show up as different error text from Playwright itself,
// matched below. (3) produces no error whatsoever from Playwright's side,
// so it needs its own pre-flight content check before Playwright ever runs.
import { spawn } from 'node:child_process';

const LOCAL_URL = 'http://localhost:4300';
const FALLBACK_URL = 'https://company-flow.netlify.app';
const APP_MARKER = '<app-root'; // unique to this app's index.html — see src/index.html

const WEBSERVER_FAILURE_PATTERNS = [
  /Process from config\.webServer was not able to start/, // case 1
  /Timed out waiting \d+ms from config\.webServer/, // case 2
];

function printFallbackWarning(reason) {
  console.warn(
    '\n' +
      `⚠️  WARNING: ${reason}\n` +
      `   Falling back to the hosted demo (${FALLBACK_URL}).\n` +
      '   That deployed build does NOT have this project’s data-testid attributes,\n' +
      '   so every spec beyond smoke.spec.ts is expected to fail here — this is\n' +
      '   informational coverage only, not a real run of the suite.\n' +
      '   Fix your local setup and re-run for the real result.\n',
  );
}

// 'ok'            — the real app is already up and running locally
// 'wrong-content' — something answered, but it isn't this app (case 3)
// 'nothing'       — nothing is listening yet; let Playwright try to boot it
async function checkLocalPort() {
  try {
    const res = await fetch(LOCAL_URL, { signal: AbortSignal.timeout(2000) });
    const body = res.ok ? await res.text() : '';
    return body.includes(APP_MARKER) ? 'ok' : 'wrong-content';
  } catch {
    return 'nothing';
  }
}

function runPlaywright(extraEnv) {
  return new Promise((resolve) => {
    let combinedOutput = '';
    // No `shell: true` here deliberately — with an argument array, Node
    // would join it into one shell command string, losing the quoting
    // around any multi-word argument (e.g. `-g "some spec name"` silently
    // splits into six separate words). Spawning directly preserves each
    // array element as its own argument, spaces and all.
    const child = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
      env: { ...process.env, ...extraEnv },
    });

    child.stdout.on('data', (chunk) => {
      combinedOutput += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      combinedOutput += chunk;
      process.stderr.write(chunk);
    });
    child.on('close', (code) => resolve({ code, combinedOutput }));
  });
}

async function main() {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    // Caller already chose a target explicitly — run as-is, no fallback logic.
    const { code } = await runPlaywright({});
    process.exit(code ?? 1);
  }

  // Case 3 — check this *before* ever invoking Playwright, since Playwright
  // itself would never detect it (it'd just quietly adopt whatever's there).
  const portStatus = await checkLocalPort();
  if (portStatus === 'wrong-content') {
    printFallbackWarning(`something other than this app is already answering on ${LOCAL_URL}`);
    const { code } = await runPlaywright({ PLAYWRIGHT_BASE_URL: FALLBACK_URL });
    process.exit(code ?? 1);
  }

  // 'ok' or 'nothing' — either the real app is already up, or the port's
  // free and Playwright can try to boot it. Either way, run normally.
  const first = await runPlaywright({});
  if (first.code === 0) {
    process.exit(0);
  }

  // Cases 1 and 2 — a genuine setup failure, not a test/assertion failure
  // against a working local app.
  const isSetupFailure = WEBSERVER_FAILURE_PATTERNS.some((pattern) => pattern.test(first.combinedOutput));
  if (!isSetupFailure) {
    process.exit(first.code ?? 1);
  }

  printFallbackWarning('the local app failed to start');
  const second = await runPlaywright({ PLAYWRIGHT_BASE_URL: FALLBACK_URL });
  process.exit(second.code ?? 1);
}

main();
