// Checks that no HTML element has both `hidden` and a conflicting display class
// (flex, grid, block, etc.) in the same static class attribute.
// These are mutually exclusive — one silently wins based on CSS source order.

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LAYOUTS_DIR = join(ROOT, 'layouts');

const DISPLAY_CONFLICT = ['flex', 'inline-flex', 'grid', 'inline-grid', 'block', 'inline-block', 'inline', 'table'];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

let violations = 0;

for (const file of walk(LAYOUTS_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const pattern = /\bclass\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      const classes = match[1].split(/\s+/);
      if (classes.includes('hidden')) {
        const conflicts = DISPLAY_CONFLICT.filter(c => classes.includes(c));
        if (conflicts.length > 0) {
          const rel = relative(ROOT, file);
          console.error(`${rel}:${i + 1} — "hidden" conflicts with: ${conflicts.join(', ')}`);
          console.error(`  ${match[0].trim()}`);
          violations++;
        }
      }
    }
  });
}

if (violations > 0) {
  console.error(`\n${violations} conflict(s) found. Remove conflicting display classes from static HTML.`);
  process.exit(1);
} else {
  console.log(`✓ No hidden/display conflicts in ${walk(LAYOUTS_DIR).length} layout files.`);
}
