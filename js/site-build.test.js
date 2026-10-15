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

const ALL = ['', 'research', 'people', 'publications', 'contact', 'events', 'collaborators',
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
    expect(doc.querySelector('#home-recent').children).toHaveLength(0);
    expect(doc.querySelectorAll('#event-data .event-item').length).toBeGreaterThan(5);
    expect([...doc.querySelectorAll('script[src]')].some(el => el.getAttribute('src').startsWith('/js/events-filter.js?v='))).toBe(true);
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

// Opportunities page is hidden (content/join.md build: never). Un-skip when it is re-enabled.
describe.skip('join page badges and buttons', () => {
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
    expect([...doc.querySelectorAll('script[src]')].some(el => el.getAttribute('src').startsWith('/js/events-filter.js?v='))).toBe(true);
  });
});

describe('opportunities stay hidden', () => {
  it('does not build the join page', () => {
    expect(existsSync(join(OUT, 'join', 'index.html'))).toBe(false);
  });

  it.each(ALL)('/%s has no link to /join/ and no "Join the Lab" or "Work with us" call to action', (p) => {
    const doc = page(p);
    expect(doc.querySelector('a[href="/join/"]')).toBeNull();
    expect(doc.body.textContent).not.toMatch(/Join the Lab|Work with us/);
  });
});

describe('work with me', () => {
  it('the home hero has a second "Work with me" button that goes to the contact page', () => {
    const btn = [...page('').querySelectorAll('h1 ~ div a')].find(a => a.textContent.trim() === 'Work with me');
    expect(btn?.getAttribute('href')).toBe('/contact/');
    expect(btn.getAttribute('target')).toBeNull();
  });

  it('the contact page opens with a "Work with me" section above "Find me online"', () => {
    const headings = [...page('contact').querySelectorAll('h2')].map(h => h.textContent.trim());
    expect(headings.indexOf('Work with me')).toBeGreaterThanOrEqual(0);
    expect(headings.indexOf('Work with me')).toBeLessThan(headings.indexOf('Find me online'));
    const intro = [...page('contact').querySelectorAll('h2')].find(h => h.textContent.trim() === 'Work with me').nextElementSibling;
    expect(intro.textContent).toBe('For collaborations, consultancy, speaking invitations or roles send me a message and I will reply personally.');
  });
});

describe('no King\'s College London affiliation for Elena or the lab', () => {
  const KINGS = /King's College|kcl\.ac\.uk|Roger Williams|Faculty of Life Sciences/;

  it.each(ALL)('/%s structured data names no institution for Elena or the lab', (p) => {
    const ld = [...page(p).querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent).join('\n');
    expect(ld).not.toMatch(KINGS);
    expect(ld).not.toMatch(/parentOrganization|"affiliation"/);
  });

  it('Elena\'s People card has no KCL profile link', () => {
    const card = [...page('people').querySelectorAll('h3')].find(h => h.textContent.includes('Elena Palma')).closest('div').parentElement;
    expect(card.querySelector('a[href*="kcl.ac.uk"]')).toBeNull();
  });
});

describe('no "our" in site copy', () => {
  it.each([...ALL, '404.html'])('/%s never says "our"', (p) => {
    const doc = p === '404.html'
      ? new parserWindow.DOMParser().parseFromString(readFileSync(join(OUT, '404.html'), 'utf8'), 'text/html')
      : page(p);
    const body = doc.body.cloneNode(true);
    body.querySelectorAll('script, style').forEach(el => el.remove());
    expect(body.textContent).not.toMatch(/\bour\b/i);
  });
});

describe('cache-busted assets', () => {
  it.each(ALL)('/%s links CSS and JS with a content-hash version so browsers never run stale copies', (p) => {
    const doc = page(p);
    const urls = [...doc.querySelectorAll('link[rel=stylesheet][href^="/css/"], script[src^="/js/"]')]
      .map(el => el.getAttribute('href') || el.getAttribute('src'));
    expect(urls.length).toBeGreaterThan(0);
    urls.forEach(u => expect(u).toMatch(/^\/(css|js)\/[\w-]+\.(css|js)\?v=[0-9a-f]{10}$/));
  });
});

describe('collaborators', () => {
  const cards = (p) => [...page(p).querySelectorAll('h3')]
    .filter(h => h.previousElementSibling?.matches('p.uppercase'))
    .map(h => ({ type: h.previousElementSibling.textContent.trim(), name: h.textContent.trim(), grid: h.closest('.grid').className }));

  it('the Collaborators page shows the same cards, in the same style, as Key Collaborations on /research/', () => {
    const onResearch = cards('research');
    expect(onResearch.length).toBeGreaterThan(5);
    expect(cards('collaborators')).toEqual(onResearch);
  });
});

// happy-dom leaves numeric character references (e.g. &#43; for "+") undecoded in attribute values; browsers decode them.
const attr = (el, name) => el.getAttribute(name)?.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(c)).replace(/&amp;/g, '&');

const page404 = () => new parserWindow.DOMParser().parseFromString(readFileSync(join(OUT, '404.html'), 'utf8'), 'text/html');
const withAll404 = [...ALL.map(p => [p, () => page(p)]), ['404.html', page404]];

describe('Papers buttons', () => {
  const { papers } = parseYamlLite(readFileSync(join(ROOT, 'data', 'publications.yaml'), 'utf8'));
  const { members, alumni } = parseYamlLite(readFileSync(join(ROOT, 'data', 'people.yaml'), 'utf8'));
  const withPapers = [...members, ...alumni].map(m => m.pub_name)
    .filter(n => n && papers.some(pp => pp.authors.includes(n)));

  it('appear exactly for people with at least one paper, never leading to an empty list', () => {
    const shown = [...page('people').querySelectorAll('a')]
      .filter(a => a.textContent.trim() === 'Papers')
      .map(a => new URLSearchParams(attr(a, 'href').split('?')[1]).get('author'));
    expect(shown.sort()).toEqual([...withPapers].sort());
  });
});

describe('structured data', () => {
  it.each(ALL)('/%s has only valid JSON-LD blocks', (p) => {
    const blocks = [...page(p).querySelectorAll('script[type="application/ld+json"]')];
    blocks.forEach(b => expect(() => JSON.parse(b.textContent)).not.toThrow());
  });
});

describe('no email address or phone number on the site', () => {
  it.each(withAll404.map(([p]) => p))('/%s has no mailto:/tel: link, email address or phone number', (p) => {
    const doc = withAll404.find(([q]) => q === p)[1]();
    expect(doc.querySelector('a[href^="mailto:"], a[href^="tel:"]')).toBeNull();
    const body = doc.body.cloneNode(true);
    body.querySelectorAll('script, style').forEach(el => el.remove());
    const text = body.textContent;
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/\(?\+44\)?\s?\d|\b0\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/);
  });
});

describe('internal links', () => {
  const resolve = (path) => {
    const rel = decodeURI(path).replace(/^\//, '');
    return [rel, join(rel, 'index.html')].map(r => join(OUT, r)).find(f => existsSync(f) && f.endsWith('.html') || (existsSync(f) && !f.endsWith('/')));
  };

  it.each(withAll404.map(([p]) => p))('/%s links only to pages and anchors that exist', (p) => {
    const doc = withAll404.find(([q]) => q === p)[1]();
    const broken = [];
    [...doc.querySelectorAll('a[href^="/"], link[href^="/"], script[src^="/"]')].forEach(el => {
      const url = attr(el, 'href') || attr(el, 'src');
      if (url.startsWith('/livereload')) return;
      const [beforeHash, frag] = url.split('#');
      const path = beforeHash.split('?')[0] || `/${p}`;
      const file = resolve(path);
      if (!file) return broken.push(url);
      if (frag && file.endsWith('.html')) {
        const target = new parserWindow.DOMParser().parseFromString(readFileSync(file, 'utf8'), 'text/html');
        if (!target.getElementById(frag)) broken.push(url);
      }
    });
    expect(broken).toEqual([]);
  });
});

describe('sitemap', () => {
  const locs = () => [...readFileSync(join(OUT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => new URL(m[1]).pathname.replace(/^\/|\/$/g, ''));

  it('lists every public page and only pages that exist', () => {
    const listed = locs();
    ALL.forEach(p => expect(listed).toContain(p));
    listed.forEach(p => expect(existsSync(join(OUT, p, 'index.html'))).toBe(true));
  });

  it('leaves out hidden sections', () => {
    expect(locs().filter(p => /^(join|news)(\/|$)/.test(p))).toEqual([]);
  });
});

describe('page metadata', () => {
  it('every page has its own <title> and meta description', () => {
    const titles = ALL.map(p => page(p).querySelector('title').textContent.trim());
    const descs = ALL.map(p => page(p).querySelector('meta[name=description]').getAttribute('content').trim());
    expect(new Set(titles).size).toBe(ALL.length);
    expect(new Set(descs).size).toBe(ALL.length);
    descs.forEach(d => expect(d.length).toBeGreaterThan(20));
  });

  it.each(ALL)('/%s has a social sharing image that exists', (p) => {
    const img = page(p).querySelector('meta[property="og:image"]')?.getAttribute('content');
    expect(img).toBeTruthy();
    expect(existsSync(join(ROOT, 'static', new URL(img, 'https://x.invalid').pathname))).toBe(true);
  });
});

describe('contact form', () => {
  it('offers only Consultancy, Collaboration and Media/Press as reasons', () => {
    const options = [...page('contact').querySelectorAll('select#reason option')].map(o => o.textContent.trim());
    expect(options).toEqual(['Consultancy', 'Collaboration', 'Media/Press']);
  });
});

describe('home events section', () => {
  it('has an Upcoming column and a Recent column side by side on desktop', () => {
    const recent = page('').querySelector('#home-recent');
    const grid = recent.parentElement.parentElement;
    expect(grid.className).toMatch(/\bgrid-cols-1\b/);
    expect(grid.className).toMatch(/\blg:grid-cols-2\b/);
    const labels = [...grid.children].map(col => col.querySelector('h3').textContent.trim());
    expect(labels).toEqual(['Upcoming', 'Recent']);
  });
});

describe('footer', () => {
  it('is a single flat row of links with no lab name or address block', () => {
    const footer = page('').querySelector('footer');
    expect(footer.querySelector('address, h2')).toBeNull();
    expect(footer.textContent).not.toMatch(/Palma Lab|Roger Williams|Faculty of Life Sciences/);
    const links = [...footer.querySelectorAll('nav[aria-label="Footer"] > ul > li > a')].map(a => a.textContent.trim());
    expect(links).toEqual(['Projects', 'Techniques', 'Publications', 'Lab Members', 'Alumni', 'Collaborators', 'Events', 'Contact me →']);
  });
});

describe('news section stays unpublished', () => {
  it('does not build the placeholder news pages', () => {
    expect(existsSync(join(OUT, 'news', 'index.html'))).toBe(false);
  });
});

describe('honorary affiliation (no implied institutional lab base)', () => {
  it('home title names the lab and research focus, not the institution', () => {
    expect(page('').querySelector('title').textContent).toBe('Palma Lab · Mitochondrial medicine and human liver models');
  });

  it.each(ALL)('/%s shows no postal address, map link, or street address', (p) => {
    const doc = page(p);
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('a[href*="maps.google"]')).toBeNull();
    expect(doc.documentElement.outerHTML).not.toMatch(/Coldharbour|PostalAddress|"telephone"/);
  });

  it('footer links to the contact form with "Contact me"', () => {
    const link = [...page('').querySelectorAll('footer a')].find(a => a.textContent.includes('Contact me'));
    expect(link?.getAttribute('href')).toBe('/contact/');
  });

  it('the PI card lists her appointments, one per line', () => {
    const lines = [...page('people').querySelectorAll('h3 + p span.block')].map(s => s.textContent);
    expect(lines).toEqual(['Principal Scientist']);
  });

  it('the home Lab Members grid shows her current title, not the old honorary one', () => {
    const card = [...page('').querySelectorAll('section p.font-medium')].find(n => n.textContent.includes('Elena Palma'));
    expect(card.nextElementSibling.textContent.trim()).toBe('Principal Scientist');
    expect(page('').body.textContent).not.toMatch(/Honorary Principal Investigator|Visiting Lecturer/);
  });

  it('home intro describes a research programme, not a group', () => {
    const intro = page('').querySelector('h1 + p').textContent;
    expect(intro).toMatch(/research programme on/);
    expect(intro).not.toMatch(/research group/);
  });
});
