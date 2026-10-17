#!/usr/bin/env node
// Single source: skills/asd-ste100/SKILL.md. Writes the always-on copies for tools without hooks.
const fs = require('fs');
const path = require('path');
const { getRules } = require('../hooks/rules');

const root = path.join(__dirname, '..');
const rules = getRules() + '\n';
const kiroHeader = '---\ntitle: ASD-STE100 mode\ninclusion: always\n---\n\n';

const copies = {
  'AGENTS.md': rules,
  '.agents/rules/asd-ste100.md': rules,
  '.github/copilot-instructions.md': rules,
  '.kiro/steering/asd-ste100.md': kiroHeader + rules,
};

module.exports = { copies };

if (require.main === module) {
  for (const [rel, body] of Object.entries(copies)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  }
}
