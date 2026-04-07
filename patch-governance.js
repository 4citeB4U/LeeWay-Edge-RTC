import fs from 'fs';
import path from 'path';

const HEADER = `/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.ARCH.SECURE
TAG: CORE.INTERNAL.SYSTEM
COLOR_ONION_HEX: NEON=#00FFD1 FLUO=#00B4FF PASTEL=#C7F0FF
ICON_ASCII: family=lucide glyph=binary
5WH:
  WHAT = LeeWay Core Logic
  WHY  = Ensures baseline architectural compliance with the Living Organism integrity guard
  WHO  = LeeWay Industries | LeeWay Innovation
  WHERE = e:/AgentLeecompletesystem/LeeWay-Edge-RTC-main/
  WHEN = 2026
  HOW  = Governance Recursive Patch v43.5
AGENTS: AUDIT
LICENSE: PROPRIETARY
*/
`;

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scan(fullPath);
      }
    } else if (entry.isFile() && /\.(ts|tsx|js)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('LEEWAY HEADER — DO NOT REMOVE')) {
        console.log(`Patching ${fullPath}...`);
        fs.writeFileSync(fullPath, HEADER + content);
      }
    }
  }
}

const root = process.cwd();
['src', 'services/sfu/src'].forEach(reg => {
  const p = path.join(root, reg);
  if (fs.existsSync(p)) scan(p);
});
