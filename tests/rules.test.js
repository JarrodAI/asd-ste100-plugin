const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { getRules } = require('../hooks/rules');
const { copies } = require('../scripts/sync');
const { install, remove } = require('../bin/install');
const { parseToggle } = require('../hooks/state');

const root = path.join(__dirname, '..');
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ste-'));
const hook = (file, { env = {}, input } = {}) => {
  const out = execFileSync('node', [file], { cwd: root, input, env: { ...process.env, ...env } }).toString();
  return out ? JSON.parse(out) : null;
};

test('generated copies match the skill file', () => {
  for (const [rel, body] of Object.entries(copies)) {
    assert.strictEqual(fs.readFileSync(path.join(root, rel), 'utf8'), body, `${rel} is stale: run npm run sync`);
  }
});

test('session hook emits the rules for Claude/Codex and Copilot', () => {
  const env = { ASD_STE100_OFF_FILE: path.join(tmp(), 'off') };
  assert.strictEqual(hook('hooks/activate.js', { env }).hookSpecificOutput.additionalContext, getRules());
  assert.strictEqual(hook('hooks/activate.js', { env: { ...env, COPILOT_PLUGIN_DATA: 'x' } }).additionalContext, getRules());
});

test('toggle phrases parse', () => {
  for (const p of ['asd off', 'ASD OFF', '/asd-ste100 off', '/asd-ste100-plugin:asd-ste100 off', 'stop asd-ste100', 'normal mode']) {
    assert.strictEqual(parseToggle(p), 'off', p);
  }
  for (const p of ['asd on', '/asd-ste100 on', 'start asd-ste100']) assert.strictEqual(parseToggle(p), 'on', p);
  for (const p of ['what is asd off?', 'turn asd off please', 'explain normal mode in git', '']) assert.strictEqual(parseToggle(p), null, p);
});

test('off and on persist across sessions through the hooks', () => {
  const env = { ASD_STE100_OFF_FILE: path.join(tmp(), 'off') };
  const off = hook('hooks/toggle.js', { env, input: JSON.stringify({ prompt: 'asd off' }) });
  assert.match(off.hookSpecificOutput.additionalContext, /now OFF/);
  assert.match(hook('hooks/activate.js', { env }).hookSpecificOutput.additionalContext, /mode is OFF/);
  const on = hook('hooks/toggle.js', { env, input: JSON.stringify({ prompt: '/asd-ste100 on' }) });
  assert.ok(on.hookSpecificOutput.additionalContext.includes(getRules()));
  assert.strictEqual(hook('hooks/activate.js', { env }).hookSpecificOutput.additionalContext, getRules());
  assert.strictEqual(hook('hooks/toggle.js', { env, input: JSON.stringify({ prompt: 'fix the bug' }) }), null);
  assert.strictEqual(hook('hooks/toggle.js', { env, input: 'not json' }), null);
});

test('CLI on/off/status flips the switch', () => {
  const env = { ...process.env, ASD_STE100_OFF_FILE: path.join(tmp(), 'off') };
  const run = (a) => execFileSync('node', ['bin/install.js', a], { cwd: root, env }).toString();
  assert.match(run('status'), /: on/);
  run('off');
  assert.match(run('status'), /: off/);
  run('on');
  assert.match(run('status'), /: on/);
});

test('installer writes, appends once, removes cleanly, and rejects bad targets', () => {
  const dir = tmp();
  const f = install('kiro', { cwd: dir });
  assert.match(fs.readFileSync(f, 'utf8'), /inclusion: always/);
  assert.strictEqual(remove('kiro', { cwd: dir }), f);
  assert.ok(!fs.existsSync(f));
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), 'mine\n');
  install('agents', { cwd: dir });
  install('agents', { cwd: dir });
  const agents = fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8');
  assert.ok(agents.startsWith('mine'));
  assert.strictEqual(agents.split('<!-- asd-ste100-plugin -->').length, 2);
  remove('agents', { cwd: dir });
  assert.strictEqual(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), 'mine\n');
  install('vscode', { cwd: dir });
  remove('vscode', { cwd: dir });
  assert.ok(!fs.existsSync(path.join(dir, '.github', 'copilot-instructions.md')));
  assert.throws(() => install('nope', { cwd: dir }));
});

test('OpenCode plugin adds the rules, and stays silent when off', async () => {
  const off = path.join(tmp(), 'off');
  process.env.ASD_STE100_OFF_FILE = off;
  const mod = await import(pathToFileURL(path.join(root, '.opencode', 'plugins', 'asd-ste100.mjs')).href);
  const hooks = await mod.default();
  const run = async () => {
    const out = { system: ['base'] };
    await hooks['experimental.chat.system.transform']({}, out);
    return out.system;
  };
  assert.deepStrictEqual(await run(), ['base', getRules()]);
  fs.writeFileSync(off, '');
  assert.deepStrictEqual(await run(), ['base']);
});
