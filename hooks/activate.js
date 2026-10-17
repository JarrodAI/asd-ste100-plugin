#!/usr/bin/env node
// SessionStart hook for Claude Code, Codex and Copilot. Emits the rules as hidden context.
const { getRules } = require('./rules');

const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const context = getRules();

process.stdout.write(JSON.stringify(isCopilot
  ? { additionalContext: context }
  : { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context } }));
