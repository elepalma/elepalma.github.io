/**
 * Data validation — catches the content errors a human reviewer would:
 * trailing spaces inside quotes, unbalanced quotes, duplicate punctuation,
 * bad enum values, malformed dates/URLs, and journal fields that are just a year.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseYamlLite } from './yaml-lite.js';

// vitest runs from the project root; import.meta.url is not a file: URL under happy-dom
const ROOT = process.cwd();
const DATA = join(ROOT, 'data');
const read = (f) => readFileSync(join(DATA, f), 'utf8');
const load = (f) => parseYamlLite(read(f));

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ROLE_TYPES = ['pi', 'postdoc', 'phd', 'msc', 'ra', 'visiting'];
const COLLAB_TYPES = ['Academic', 'Clinical', 'Industry', 'Consortium', 'Societies and Committees'];

describe('text-level checks on every data file', () => {
  const files = readdirSync(DATA).filter(f => f.endsWith('.yaml'));

  it.each(files)('%s has no trailing space inside a quoted string', (f) => {
    const bad = read(f).split('\n').filter(l => /\s"$/.test(l) || /\s'$/.test(l));
    expect(bad).toEqual([]);
  });

  it.each(files)('%s has balanced double quotes on every line', (f) => {
    const bad = read(f).split('\n').filter(l => !l.trim().startsWith('#') && (l.match(/"/g) || []).length % 2 === 1);
    expect(bad).toEqual([]);
  });

  it.each(files)('%s has no duplicate punctuation', (f) => {
    const bad = read(f).split('\n').filter(l => /\.\.(?!\.)|,,|(?<!: )""/.test(l) && !/https?:\/\//.test(l));
    expect(bad).toEqual([]);
  });

  it.each(files)('%s parses', (f) => {
    expect(() => load(f)).not.toThrow();
  });
});

describe('people.yaml', () => {
  const { members, alumni } = load('people.yaml');

  it('has members and alumni', () => {
    expect(members.length).toBeGreaterThan(0);
    expect(alumni.length).toBeGreaterThan(0);
  });

  it.each(members.map(m => [m.name, m]))('%s has required fields and a valid role_type', (_, m) => {
    expect(m.pub_name).toMatch(/^[A-Z][A-Za-z'\-]+ [A-Z]{1,3}$/);
    expect(m.initials).toMatch(/^[A-Z]{2,3}$/);
    expect(m.role).toBeTruthy();
    expect(ROLE_TYPES).toContain(m.role_type);
  });

  it('has exactly one PI', () => {
    expect(members.filter(m => m.role_type === 'pi')).toHaveLength(1);
  });

  it.each(members.filter(m => m.photo).map(m => [m.name, m.photo]))('%s photo file exists', (_, photo) => {
    expect(existsSync(join(ROOT, 'static', photo))).toBe(true);
  });

  it.each(alumni.map(a => [a.name, a]))('%s has pub_name, years, and a readable "now"', (_, a) => {
    expect(a.pub_name).toMatch(/^[A-Z][A-Za-z'\-]+ [A-Z]{1,3}$/);
    expect(a.years).toMatch(/^\d{4}–\d{4}$/);
    expect(a.now).not.toMatch(/in the industry|a PhD at/);
  });

  it("the PI's bio leads with the mitochondria framing", () => {
    expect(members.find(m => m.role_type === 'pi').bio).toMatch(/mitochondri/i);
  });
});

describe('publications.yaml', () => {
  const { papers } = load('publications.yaml');

  it.each(papers.map(p => [p.title.slice(0, 50), p]))('%s… has valid year, journal, doi, keywords', (_, p) => {
    expect(p.year).toMatch(/^\d{4}$/);
    expect(p.journal).not.toMatch(/^\d{4}$/);
    expect(p.journal).not.toMatch(/·\s*\d{4}$/);
    expect(p.journal.length).toBeGreaterThan(2);
    if (p.doi) expect(p.doi).toMatch(/^https:\/\/doi\.org\//);
    expect(Array.isArray(p.keywords) && p.keywords.length > 0).toBe(true);
    expect(p.authors).toMatch(/^[A-Z]/);
  });

  it('is sorted newest first', () => {
    const years = papers.map(p => Number(p.year));
    expect([...years].sort((a, b) => b - a)).toEqual(years);
  });
});

describe('events.yaml', () => {
  const { events } = load('events.yaml');

  it.each(events.map(e => [e.title, e]))('%s has an ISO date matching its display year', (_, e) => {
    expect(e.date).toMatch(ISO);
    expect(e.year).toBe(e.date.slice(0, 4));
    expect(e.title && e.location && e.type).toBeTruthy();
    if (e.link) expect(e.link).toMatch(/^https?:\/\//);
  });
});

describe('opportunities.yaml', () => {
  const { roles } = load('opportunities.yaml');

  it.each(roles.map(r => [r.title, r]))('%s has valid status, dates, and apply_url', (_, r) => {
    expect(r.status).toBeTruthy();
    if (r.deadline) expect(r.deadline).toMatch(ISO);
    if (r.opens) expect(r.opens).toMatch(ISO);
    expect(r.apply_url).toMatch(/^(https?:\/\/|\/)/);
    if (r.apply_url.startsWith('/')) expect(r.apply_url.endsWith('/')).toBe(true);
  });
});

describe('collaborators.yaml', () => {
  const { groups } = load('collaborators.yaml');

  it.each(groups.map(g => [g.name, g]))('%s has a known type and a description', (_, g) => {
    expect(COLLAB_TYPES).toContain(g.type);
    expect(g.description).toBeTruthy();
    if (g.url) expect(g.url).toMatch(/^https?:\/\//);
  });
});

describe('research project front matter', () => {
  const dir = join(ROOT, 'content', 'research');
  const files = readdirSync(dir).filter(f => f.endsWith('.md') && f !== '_index.md');

  it.each(files)('%s has a clean tag, keywords, and no H1 in the body', (f) => {
    const text = readFileSync(join(dir, f), 'utf8');
    const fm = text.split('\n---')[0];
    const body = text.slice(fm.length + 4);
    const tag = (fm.match(/^tag:\s*"([^"]*)"/m) || [])[1];
    expect(tag).toBeTruthy();
    expect(tag).toBe(tag.trim());
    expect(fm).toMatch(/^keywords:\s*\[.+\]/m);
    expect(body).not.toMatch(/^# /m);
  });
});

describe('events.yaml dates agree with their display fields', () => {
  const { events } = load('events.yaml');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  it.each(events.map(e => [e.title, e]))('%s: month and last day match `date`', (_, e) => {
    expect(e.month).toBe(MONTHS[Number(e.date.slice(5, 7)) - 1]);
    if (e.day) {
      // `date` is the last day of a multi-day event, e.g. day "11–13" -> date ends in -13
      const last = String(e.day).split(/[–-]/).pop().trim();
      expect(Number(last)).toBe(Number(e.date.slice(8, 10)));
    }
  });
});

describe('British spelling in site copy', () => {
  // US spellings to catch; publication titles are left alone (they are quoted as published)
  const US = /\b(tumors?|colou?r(?<!colour)|centers?|behaviors?|analyz\w*|characteriz\w*|organiz\w*|modeling|labor|favorite|fiber)\b/i;
  const PROPER_NOUNS = ['Center for Biomedical Research'];
  const strip = (t) => PROPER_NOUNS.reduce((acc, n) => acc.split(n).join(''), t);
  const files = [
    ...readdirSync(DATA).filter(f => f.endsWith('.yaml') && f !== 'publications.yaml').map(f => join(DATA, f)),
    ...readdirSync(join(ROOT, 'content'), { recursive: true }).filter(f => f.endsWith('.md')).map(f => join(ROOT, 'content', f)),
  ];

  it.each(files.map(f => [f.replace(ROOT + '/', ''), f]))('%s uses British spelling', (_, f) => {
    const bad = readFileSync(f, 'utf8').split('\n').map(strip).filter(l => !/https?:\/\//.test(l) && US.test(l));
    expect(bad).toEqual([]);
  });
});

describe('collaborators.yaml entries are unique and cleanly formatted', () => {
  const { groups } = load('collaborators.yaml');

  it('has no duplicate collaborator names', () => {
    const names = groups.map(g => g.name.trim().toLowerCase());
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it.each(groups.map(g => [g.name, g]))('%s has no stray commas or double spaces', (_, g) => {
    [g.name, g.affiliation || '', g.description].forEach(t => {
      expect(t).not.toMatch(/ {2}|,\s*,|,\s*$|^\s*,|\s+[,.]/);
    });
  });
});
