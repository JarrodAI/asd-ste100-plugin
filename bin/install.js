#!/usr/bin/env node
// npx @threegroup/asd-ste100-plugin <kiro|antigravity|vscode|opencode|agents> [--global] [--remove]
// npx @threegroup/asd-ste100-plugin <on|off|status>
const fs = require('fs');
const os = require('os');
const path = require('path');
const { copies } = require('../scripts/sync');
const { isOff, setOff } = require('../hooks/state');

const MARK = '<!-- asd-ste100-plugin -->';
const END = '<!-- /asd-ste100-plugin -->';
const targets = {
  kiro: { file: '.kiro/steering/asd-ste100.md', shared: false },
  antigravity: { file: '.agents/rules/asd-ste100.md', shared: false },
  vscode: { file: '.github/copilot-instructions.md', shared: true },
  opencode: { file: 'AGENTS.md', shared: true },
  agents: { file: 'AGENTS.md', shared: true },
};

function resolve(target, cwd, global) {
  const t = targets[target];
  if (!t) throw new Error(`Unknown target "${target}". Use: ${Object.keys(targets).join(', ')}`);
  if (global && target !== 'kiro') throw new Error('--global works for kiro only.');
  return { t, dest: global ? path.join(os.homedir(), t.file) : path.join(cwd, t.file) };
}

function install(target, { cwd = process.cwd(), global = false } = {}) {
  const { t, dest } = resolve(target, cwd, global);
  const body = copies[t.file];
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!t.shared) {
    fs.writeFileSync(dest, body);
  } else if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, `${MARK}\n${body}${END}\n`);
  } else {
    const old = fs.readFileSync(dest, 'utf8');
    if (!old.includes(MARK)) fs.writeFileSync(dest, `${old.trimEnd()}\n\n${MARK}\n${body}${END}\n`);
  }
  return dest;
}

function remove(target, { cwd = process.cwd(), global = false } = {}) {
  const { t, dest } = resolve(target, cwd, global);
  if (!fs.existsSync(dest)) return null;
  if (!t.shared) {
    fs.rmSync(dest);
    return dest;
  }
  const old = fs.readFileSync(dest, 'utf8');
  const start = old.indexOf(MARK);
  if (start < 0) return null;
  const end = old.indexOf(END, start);
  const rest = (old.slice(0, start) + (end < 0 ? '' : old.slice(end + END.length))).trim();
  if (rest) fs.writeFileSync(dest, rest + '\n');
  else fs.rmSync(dest);
  return dest;
}

module.exports = { install, remove };

if (require.main === module) {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  const usage = `Usage:\n  npx @threegroup/asd-ste100-plugin <${Object.keys(targets).join('|')}> [--global] [--remove]\n  npx @threegroup/asd-ste100-plugin <on|off|status>`;
  if (!target) {
    console.error(usage);
    process.exit(1);
  }
  try {
    if (target === 'on' || target === 'off') {
      setOff(target === 'off');
      console.log(`ASD-STE100 mode: ${target}. Plugin installs follow this switch in new sessions.`);
    } else if (target === 'status') {
      console.log(`ASD-STE100 mode: ${isOff() ? 'off' : 'on'}`);
    } else if (args.includes('--remove')) {
      const f = remove(target, { global: args.includes('--global') });
      console.log(f ? `Removed: ${f}` : 'Nothing to remove.');
    } else {
      console.log(`Installed: ${install(target, { global: args.includes('--global') })}`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
