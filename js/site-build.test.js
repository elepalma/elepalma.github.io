/**
 * Build-output tests: run Hugo into a temp dir and assert on the generated HTML.
 * These guard the review fixes (accessibility structure, link behaviour,
 * date-aware badges, related publications, positioning copy) against regression.
 * Requires `hugo` on PATH and `npm run build:css` to have been run.
 */
import { beforeAll, describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync, mkdtempSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Window } from 'happy-dom';
import { parseYamlLite } from './yaml-lite.js';

// A parser window that never fetches stylesheets or scripts referenced by the page
const parserWindow = new Window({
  settings: { disableJavaScriptFileLoading: true, disableCSSFileLoading: true, disableJavaScriptEvaluation: true },
});

// vitest runs from the project root; import.meta.url is not a file: URL under happy-dom
const ROOT = process.cwd();
let OUT;
const pages = {};

function page(path) {
  if (!pages[path]) {
    const html = readFileSync(join(OUT, path, 'index.html'), 'utf8');
    pages[path] = new parserWindow.DOMParser().parseFromString(html, 'text/html');
  }
  return pages[path];
}

const ALL = ['', 'research', 'people', 'publications', 'join', 'contact', 'events', 'collaborators',
  'research/alcohol-mitochondria', 'research/mito-models', 'research/preclinical-drug-testing',
  'research/mitochondrial-plasticity', 'research/cca-mito', 'research/techniques'];
const PROJECTS = ALL.filter(p => p.startsWith('research/') && p !== 'research/techniques');

beforeAll(() => {
  OUT = mkdtempSync(join(tmpdir(), 'palmalab-build-'));
  execFileSync('hugo', ['--quiet', '-d', OUT], { cwd: ROOT, stdio: 'pipe' });
}, 60_000);

describe('document structure and accessibility', () => {
  it.each(ALL)('/%s has one h1, a skip link, and a focusable main landmark', (p) => {
    const doc = page(p);
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    const skip = doc.querySelector('a.skip-link');
    expect(skip?.getAttribute('href')).toBe('#main');
    expect(doc.querySelector('main#main')?.getAttribute('tabindex')).toBe('-1');
  });

  it.each(ALL)('/%s heading levels never skip downwards', (p) => {
    const levels = [...page(p).querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1], `jump from h${levels[i - 1]} to h${levels[i]} on /${p}`).toBeLessThanOrEqual(1);
    }
  });

  it.each(ALL)('/%s never opens an internal link in a new tab', (p) => {
    const bad = [...page(p).querySelectorAll('a[target="_blank"]')]
      .map(a => a.getAttribute('href'))
      .filter(h => h && !/^https?:\/\//.test(h));
    expect(bad).toEqual([]);
  });

  it('hamburger exposes its state and the menu it controls', () => {
    const btn = page('').querySelector('#hamburger');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-controls')).toBe('mobile-menu');
  });

  it('social icon links have accessible names', () => {
    const unnamed = [...page('').querySelectorAll('nav a[target="_blank"], footer a[target="_blank"]')]
      .filter(a => !a.getAttribute('aria-label') && !a.textContent.trim());
    expect(unnamed).toEqual([]);
  });

  it('compiled CSS opens dropdowns on keyboard focus and shows focus rings', () => {
    const css = readFileSync(join(ROOT, 'static', 'css', 'main.css'), 'utf8');
    expect(css).toMatch(/\.nav-item:focus-within\s+\.dropdown/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/\.skip-link:focus/);
  });

  it('contact form fields keep a visible focus style', () => {
    const fields = [...page('contact').querySelectorAll('form input:not([type=text][name=_gotcha]), form select, form textarea')];
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach(f => expect(f.className).toMatch(/focus:ring/));
  });
});

describe('home page', () => {
  it('hero heading has no forced line breaks and the four cards stack on phones', () => {
    const doc = page('');
    expect(doc.querySelector('h1').innerHTML).not.toMatch(/<br/i);
    expect(doc.querySelector('.fade-up-2').className).toMatch(/\bgrid-cols-1\b/);
  });

  it('opportunity cards in the Join CTA stack on phones', () => {
    const grid = page('').querySelector('a[href="/join/"].flex').parentElement;
    expect(grid.className).toMatch(/\bgrid-cols-1\b/);
    expect(grid.className).toMatch(/\bsm:grid-cols-2\b/);
  });

  it('shows every project except Techniques', () => {
    const titles = [...page('').querySelectorAll('section h3 a')].map(a => a.textContent.trim());
    expect(titles).toHaveLength(PROJECTS.length);
    expect(titles).not.toContain('Techniques & Platforms');
    expect(titles).toContain('Patient derived models of cholangiocarcinoma');
  });

  it('renders upcoming events client-side from the shared data block, not at build time', () => {
    const doc = page('');
    expect(doc.querySelector('#home-upcoming')).not.toBeNull();
    expect(doc.querySelector('#home-upcoming').children).toHaveLength(0);
    expect(doc.querySelectorAll('#event-data .event-item').length).toBeGreaterThan(5);
    expect(doc.querySelector('script[src="/js/events-filter.js"]')).not.toBeNull();
  });

  it('exposes the X/Twitter profile in the footer when configured', () => {
    expect(page('').querySelector('footer a[href*="x.com/"]')).not.toBeNull();
  });
});

describe('positioning copy is consistent (mitochondria framing)', () => {
  it('home meta description and hero agree', () => {
    const doc = page('');
    expect(doc.querySelector('meta[name=description]').getAttribute('content')).toMatch(/mitochondri/i);
    expect(doc.querySelector('h1').textContent).toMatch(/mitochondria/);
  });

  it.each(['research', 'people', 'publications'])('/%s intro mentions mitochondria', (p) => {
    const doc = page(p);
    const hero = doc.querySelector('.page-hero').textContent;
    const desc = doc.querySelector('meta[name=description]').getAttribute('content');
    expect(hero + ' ' + desc).toMatch(/mitochondri/i);
  });

  it("the PI's bio on the People page mentions mitochondria", () => {
    expect(page('people').querySelector('h3 + p + p + p').textContent).toMatch(/mitochondri/i);
  });
});

describe('people page photos', () => {
  it('uses square boxes with intrinsic size attributes and no inline sizing', () => {
    const doc = page('people');
    const imgs = [...doc.querySelectorAll('img')];
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach(img => {
      expect(img.getAttribute('width')).toBe(img.getAttribute('height'));
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('alt')).toMatch(/^Portrait of /);
    });
    expect(doc.body.innerHTML).not.toMatch(/style="width:2\d\dpx/);
  });
});

describe('publications page', () => {
  it('links every paper title to its DOI so phones can reach it', () => {
    const items = [...page('publications').querySelectorAll('.pub-item')];
    expect(items.length).toBeGreaterThan(10);
    items.forEach(it => {
      const btn = it.querySelector('a[href^="https://doi.org/"]');
      if (btn) expect(it.querySelector('p a[href^="https://doi.org/"]')).not.toBeNull();
    });
  });

  it('only shows author filter buttons for people who appear on a paper', () => {
    const doc = page('publications');
    const authors = [...doc.querySelectorAll('.pub-item')].map(i => i.getAttribute('data-authors')).join(' | ');
    const buttons = [...doc.querySelectorAll('button[data-pubname]')].map(b => b.getAttribute('data-pubname'));
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach(name => expect(authors).toContain(name));
    expect(buttons).not.toContain('Schulz A');
  });

  it('has an empty-state message element for the client-side filter', () => {
    expect(page('publications').querySelector('#pub-empty')).not.toBeNull();
  });

  it('journal line does not repeat the year shown in the margin', () => {
    const journals = [...page('publications').querySelectorAll('.pub-item p.italic')].map(p => p.textContent.trim());
    journals.forEach(j => expect(j).not.toMatch(/\d{4}$/));
  });
});

describe('join page badges and buttons', () => {
  const { roles } = parseYamlLite(readFileSync(join(ROOT, 'data', 'opportunities.yaml'), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);

  it('derives Open / Closed / Opens from the dates in the data', () => {
    const cards = [...page('join').querySelectorAll('h3')].map(h => h.parentElement);
    roles.forEach((role, i) => {
      const badge = cards[i].querySelector('[data-status-state]');
      const label = badge.textContent.trim();
      if (role.deadline && today > role.deadline) {
        expect(label).toBe('Closed');
        expect(badge.getAttribute('data-status-state')).toBe('closed');
      } else if (role.opens && today < role.opens) {
        expect(label).toMatch(/^Opens [A-Z][a-z]+ \d{4}$/);
        expect(badge.getAttribute('data-status-state')).toBe('closed');
      } else if (/open/i.test(role.status)) {
        expect(badge.getAttribute('data-status-state')).toBe('open');
      } else {
        expect(badge.getAttribute('data-status-state')).toBe('closed');
      }
    });
  });

  it('labels enquiry roles "Enquire" and keeps internal links in the same tab', () => {
    const rows = [...page('join').querySelectorAll('#open-positions > div')];
    expect(rows).toHaveLength(roles.length);
    roles.forEach((role, i) => {
      const a = rows[i].querySelector('a.inline-flex');
      expect(a.textContent.trim()).toBe(/enquire/i.test(role.status) ? 'Enquire →' : 'Apply →');
      if (role.apply_url.startsWith('/')) expect(a.getAttribute('target')).toBeNull();
      else expect(a.getAttribute('target')).toBe('_blank');
    });
  });
});

describe('research pages', () => {
  it('projects grid excludes Techniques & Platforms', () => {
    const titles = [...page('research').querySelectorAll('a.card-hover h3')].map(h => h.textContent.trim());
    expect(titles).toHaveLength(PROJECTS.length);
    expect(titles).not.toContain('Techniques & Platforms');
  });

  it.each(PROJECTS)('/%s lists related publications with links', (p) => {
    const box = page(p).querySelector('#related-publications');
    expect(box).not.toBeNull();
    const links = box.querySelectorAll('a[href^="https://doi.org/"]');
    expect(links.length).toBeGreaterThan(0);
    expect(links.length).toBeLessThanOrEqual(5);
  });

  it.each(PROJECTS)('/%s body uses h2 section headings (no stray H1s)', (p) => {
    const prose = page(p).querySelector('.prose-lab');
    expect(prose.querySelectorAll('h1')).toHaveLength(0);
    expect(prose.querySelectorAll('h2').length).toBeGreaterThanOrEqual(2);
  });
});

describe('events page', () => {
  it('emits the shared data block and the renderer script', () => {
    const doc = page('events');
    expect(doc.querySelectorAll('#event-data .event-item').length).toBeGreaterThan(5);
    expect(doc.querySelector('script[src="/js/events-filter.js"]')).not.toBeNull();
  });
});

describe('news section stays unpublished', () => {
  it('does not build the placeholder news pages', () => {
    expect(existsSync(join(OUT, 'news', 'index.html'))).toBe(false);
  });
});
