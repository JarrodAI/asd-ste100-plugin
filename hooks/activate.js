#!/usr/bin/env node
// SessionStart hook for Claude Code, Codex and Copilot. Emits the rules as hidden context.
const { getRules, emit } = require('./rules');
const { isOff } = require('./state');

emit('SessionStart', isOff()
  ? 'ASD-STE100 mode is OFF. Write normally. If the user says "asd on", turn it on.'
  : getRules());
