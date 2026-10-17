import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { getRules } = require('../../hooks/rules');
const { isOff } = require('../../hooks/state');
const skillsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../skills');

export default async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
  },
  'experimental.chat.system.transform': async (_input, output) => {
    if (!isOff()) output.system.push(getRules());
  },
});
