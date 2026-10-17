const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { getRules } = require('../hooks/rules');
const { copies } = require('../scripts/sync');
const { install } = require('../bin/install');

const root = path.join(__dirname, '..');

test('generated copies match the skill file', () => {
  for (const [rel, body] of Object.entries(copies)) {
    assert.strictEqual(fs.readFileSync(path.join(root, rel), 'utf8'), body, `${rel} is stale: run npm run sync`);
  }
});

test('hook emits the rules for Claude/Codex and Copilot', () => {
  const run = (env) => JSON.parse(execFileSync('node', ['hooks/activate.js'], { cwd: root, env: { ...process.env, ...env } }));
  assert.strictEqual(run({}).hookSpecificOutput.additionalContext, getRules());
  assert.strictEqual(run({ COPILOT_PLUGIN_DATA: 'x' }).additionalContext, getRules());
});

test('installer writes, appends once, and rejects bad targets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ste-'));
  const f = install('kiro', { cwd: dir });
  assert.match(fs.readFileSync(f, 'utf8'), /inclusion: always/);
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'mine\n');
  install('agents', { cwd: dir });
  install('agents', { cwd: dir });
  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(agents.startsWith('mine'));
  assert.strictEqual(agents.split('asd-ste100-plugin -->').length, 2);
  assert.throws(() => install('nope', { cwd: dir }));
});

test('OpenCode plugin appends the rules to the system prompt', async () => {
  const mod = await import(pathToFileURL(path.join(root, '.opencode', 'plugins', 'asd-ste100.mjs')).href);
  const hooks = await mod.default();
  const out = { system: ['base'] };
  await hooks['experimental.chat.system.transform']({}, out);
  assert.strictEqual(out.system[1], getRules());
});
