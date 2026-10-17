#!/usr/bin/env node
// UserPromptSubmit hook: "asd on" / "asd off" switches the mode and persists it.
const { getRules, emit } = require('./rules');
const { parseToggle, setOff } = require('./state');

let raw = '';
process.stdin.on('data', (d) => { raw += d; }).on('end', () => {
  let prompt = '';
  try {
    const j = JSON.parse(raw);
    prompt = j.prompt || j.user_prompt || j.userPrompt || '';
  } catch (e) { /* not JSON: no toggle */ }
  const t = parseToggle(prompt);
  if (!t) return;
  setOff(t === 'off');
  emit('UserPromptSubmit', t === 'off'
    ? 'ASD-STE100 mode is now OFF. Reply with one line: "ASD-STE100 mode: off. Say asd on to turn it on." Then write normally.'
    : `ASD-STE100 mode is now ON. Reply with one line: "ASD-STE100 mode: on." Then follow these rules:\n\n${getRules()}`);
});
