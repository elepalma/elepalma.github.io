// Checks that every class applied via classList.add/remove/toggle in JS
// is present in the compiled CSS. Run after `npm run build:css`.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT   = fileURLToPath(new URL('..', import.meta.url));
const JS_DIR = join(ROOT, 'static', 'js');
const CSS    = join(ROOT, 'static', 'css', 'main.css');

let compiledCSS;
try {
  compiledCSS = readFileSync(CSS, 'utf8');
} catch {
  console.error('Cannot read static/css/main.css — run npm run build:css first.');
  process.exit(1);
}

// Load safelist from tailwind.config.js
const configUrl = new URL('../tailwind.config.js', import.meta.url).href;
const { default: twConfig } = await import(configUrl);
const safelist = (twConfig.safelist || []).filter(e => typeof e === 'string');

// Collect all classes mutated via JS
const dynamic = new Map(); // class -> 'file:line'

for (const f of readdirSync(JS_DIR).filter(n => n.endsWith('.js'))) {
  const lines = readFileSync(join(JS_DIR, f), 'utf8').split('\n');
  lines.forEach((line, i) => {
    const re = /classList\.(?:add|remove|toggle)\(['"]([^'"]+)['"]\)/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (!dynamic.has(m[1])) dynamic.set(m[1], `${f}:${i + 1}`);
    }
  });
}

let violations = 0;

for (const [cls, loc] of dynamic) {
  // Escape brackets for CSS selector matching
  const escaped = cls.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  const inCSS      = compiledCSS.includes(`.${escaped}`) || compiledCSS.includes(`.${cls}`);
  const inSafelist = safelist.includes(cls);

  if (!inCSS && !inSafelist) {
    console.error(`"${cls}" (${loc}) is applied via JS but missing from compiled CSS.`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`\n${violations} class(es) not compiled. Add them to safelist in tailwind.config.js.`);
  process.exit(1);
} else {
  console.log(`✓ All ${dynamic.size} dynamically-applied classes are present in compiled CSS.`);
}
