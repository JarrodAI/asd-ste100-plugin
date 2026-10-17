const fs = require('fs');
const os = require('os');
const path = require('path');

const flagFile = () => process.env.ASD_STE100_OFF_FILE || path.join(os.homedir(), '.asd-ste100', 'off');
const isOff = () => fs.existsSync(flagFile());

function setOff(off) {
  const f = flagFile();
  if (off) {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, '');
  } else {
    fs.rmSync(f, { force: true });
  }
}

const TOGGLE = /^\s*(?:\/?(?:asd-ste100-plugin:)?(?:asd-ste100|asd)\s+(on|off)|(stop|start)\s+asd-ste100|(normal mode))\s*[.!]?\s*$/i;

function parseToggle(prompt) {
  const m = TOGGLE.exec(String(prompt || ''));
  if (!m) return null;
  return m[1] ? m[1].toLowerCase() : m[2] ? (m[2].toLowerCase() === 'stop' ? 'off' : 'on') : 'off';
}

module.exports = { flagFile, isOff, setOff, parseToggle };
