#!/usr/bin/env node
// npx asd-ste100-plugin <kiro|antigravity|vscode|opencode|agents> [--global]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { copies } = require('../scripts/sync');

const MARK = '<!-- asd-ste100-plugin -->';
const targets = {
  kiro: { file: '.kiro/steering/asd-ste100.md', shared: false },
  antigravity: { file: '.agents/rules/asd-ste100.md', shared: false },
  vscode: { file: '.github/copilot-instructions.md', shared: true },
  opencode: { file: 'AGENTS.md', shared: true },
  agents: { file: 'AGENTS.md', shared: true },
};

function install(target, { cwd = process.cwd(), global = false } = {}) {
  const t = targets[target];
  if (!t) throw new Error(`Unknown target "${target}". Use: ${Object.keys(targets).join(', ')}`);
  if (global && target !== 'kiro') throw new Error('--global works for kiro only.');
  const dest = global ? path.join(os.homedir(), t.file) : path.join(cwd, t.file);
  const body = copies[t.file];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (t.shared && fs.existsSync(dest)) {
    const old = fs.readFileSync(dest, 'utf8');
    if (old.includes(MARK)) return dest;
    fs.writeFileSync(dest, `${old.trimEnd()}\n\n${MARK}\n${body}`);
  } else {
    fs.writeFileSync(dest, t.shared ? `${MARK}\n${body}` : body);
  }
  return dest;
}

module.exports = { install };

if (require.main === module) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  if (!target) {
    console.error(`Usage: npx asd-ste100-plugin <${Object.keys(targets).join('|')}> [--global]`);
    process.exit(1);
  }
  try {
    console.log(`Installed: ${install(target, { global: args.includes('--global') })}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
