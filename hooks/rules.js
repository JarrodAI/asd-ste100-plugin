const fs = require('fs');
const path = require('path');

const skillPath = path.join(__dirname, '..', 'skills', 'asd-ste100', 'SKILL.md');

function getRules() {
  return fs.readFileSync(skillPath, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

module.exports = { getRules, skillPath };
