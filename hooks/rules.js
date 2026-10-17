const fs = require('fs');
const path = require('path');

const skillPath = path.join(__dirname, '..', 'skills', 'asd-ste100', 'SKILL.md');

function getRules() {
  return fs.readFileSync(skillPath, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function emit(event, context) {
  const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
  process.stdout.write(JSON.stringify(isCopilot
    ? { additionalContext: context }
    : { hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
}

module.exports = { getRules, emit, skillPath };
