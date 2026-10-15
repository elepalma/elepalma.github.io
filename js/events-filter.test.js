import { beforeEach, describe, it, expect, vi } from 'vitest';

const TODAY = new Date('2026-10-11T12:00:00');

function item(attrs) {
  return `<div class="event-item" ${Object.entries(attrs).map(([k, v]) => `data-${k}="${v}"`).join(' ')}></div>`;
}

const DATA = `
  <div id="event-data" class="hidden">
    ${item({ date: '2026-09-22', month: 'Sep', day: '20–22', year: '2026', title: 'FEBS Advanced Course 2026', type: 'Course', location: 'Spetses, Greece', link: 'https://febscongress.org/' })}
    ${item({ date: '2026-10-20', month: 'Oct', day: '18–20', year: '2026', title: 'DDM Summit', type: 'Conference', location: 'Barcelona, Spain', link: 'https://ueg.eu/' })}
    ${item({ date: '2027-01-15', month: 'Jan', day: '15', year: '2027', title: 'Future A', type: 'Seminar', location: 'London', link: '' })}
    ${item({ date: '2026-12-01', month: 'Dec', day: '1', year: '2026', title: 'Future B <script>', type: 'Webinar', location: 'Virtual', link: '' })}
    ${item({ date: '2027-03-01', month: 'Mar', day: '1', year: '2027', title: 'Future C', type: 'Course', location: 'Rome', link: '' })}
    ${item({ date: '2025-05-31', month: 'May', day: '', year: '2025', title: 'EASL 2025', type: 'Conference', location: 'Amsterdam', link: '' })}
  </div>`;

async function load(markup) {
  document.body.innerHTML = DATA + markup;
  vi.resetModules();
  await import('../static/js/events-filter.js');
  return window.PalmaEvents.init(TODAY);
}

describe('partition', () => {
  it('puts events before today in past and today-or-later in upcoming', async () => {
    await load('');
    const { upcoming, past } = window.PalmaEvents.partition([
      { date: '2026-10-10', title: 'yesterday' },
      { date: '2026-10-11', title: 'today' },
      { date: '2026-10-12', title: 'tomorrow' },
    ], TODAY);
    expect(past.map(e => e.title)).toEqual(['yesterday']);
    expect(upcoming.map(e => e.title)).toEqual(['today', 'tomorrow']);
  });

  it('sorts upcoming ascending and past descending', async () => {
    const { upcoming, past } = await load('');
    expect(upcoming.map(e => e.title)).toEqual(['DDM Summit', 'Future B <script>', 'Future A', 'Future C']);
    expect(past.map(e => e.title)).toEqual(['FEBS Advanced Course 2026', 'EASL 2025']);
  });

  it('treats an unparseable date as past rather than crashing', async () => {
    await load('');
    const { past } = window.PalmaEvents.partition([{ date: 'not a date', title: 'x' }], TODAY);
    expect(past).toHaveLength(1);
  });
});

describe('events page rendering', () => {
  const PAGE = `
    <div id="upcoming-list"></div><p id="upcoming-empty" class="hidden"></p>
    <div id="past-list"></div><p id="past-empty" class="hidden"></p>`;

  it('renders a past September 2026 event under Past, not Upcoming', async () => {
    await load(PAGE);
    expect(document.getElementById('upcoming-list').textContent).not.toContain('FEBS');
    expect(document.getElementById('past-list').textContent).toContain('FEBS');
  });

  it('links the title when the event has a link (reachable on phones where the Info button is hidden)', async () => {
    await load(PAGE);
    const a = document.querySelector('#upcoming-list h3 a');
    expect(a).not.toBeNull();
    expect(a.getAttribute('href')).toBe('https://ueg.eu/');
    expect(a.getAttribute('rel')).toBe('noopener');
  });

  it('does not render an anchor when there is no link', async () => {
    await load(PAGE);
    const rows = document.querySelectorAll('#upcoming-list h3');
    expect(rows[1].querySelector('a')).toBeNull();
  });

  it('escapes HTML in event fields', async () => {
    await load(PAGE);
    expect(document.querySelector('#upcoming-list script')).toBeNull();
    expect(document.getElementById('upcoming-list').innerHTML).toContain('&lt;script&gt;');
  });

  it('shows the empty message when nothing is upcoming', async () => {
    document.body.innerHTML = `<div id="event-data">${item({ date: '2020-01-01', title: 'old', month: 'Jan', year: '2020' })}</div>` + PAGE;
    vi.resetModules();
    await import('../static/js/events-filter.js');
    window.PalmaEvents.init(TODAY);
    expect(document.getElementById('upcoming-empty').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('past-empty').classList.contains('hidden')).toBe(true);
  });
});

describe('home page rendering', () => {
  const HOME = `<div id="home-upcoming"></div><p id="home-upcoming-empty" class="hidden"></p>
    <div id="home-recent"></div><p id="home-recent-empty" class="hidden"></p>`;

  it('shows only upcoming events, at most HOME_LIMIT, soonest first', async () => {
    await load(HOME);
    const rows = document.querySelectorAll('#home-upcoming > div');
    expect(rows).toHaveLength(window.PalmaEvents.HOME_LIMIT);
    expect(rows[0].textContent).toContain('DDM Summit');
    expect(document.getElementById('home-upcoming').textContent).not.toContain('FEBS');
  });

  it('links the title on the home row when a link exists', async () => {
    await load(HOME);
    expect(document.querySelector('#home-upcoming a').getAttribute('href')).toBe('https://ueg.eu/');
  });

  it('shows the most recent past events, newest first, in the Recent column with grey date boxes', async () => {
    await load(HOME);
    const rows = [...document.querySelectorAll('#home-recent > div')];
    expect(rows.map(r => r.textContent)).toEqual([expect.stringContaining('FEBS'), expect.stringContaining('EASL 2025')]);
    expect(rows[0].firstElementChild.className).toMatch(/bg-rule/);
    expect(document.getElementById('home-recent').textContent).not.toContain('DDM Summit');
    expect(document.getElementById('home-recent-empty').classList.contains('hidden')).toBe(true);
  });

  it('caps the Recent column at HOME_LIMIT', async () => {
    const past = [1, 2, 3, 4, 5].map(i => item({ date: `2024-0${i}-01`, month: 'Jan', year: '2024', title: `Past ${i}`, type: 'Talk', location: 'X', link: '' })).join('');
    document.body.innerHTML = `<div id="event-data">${past}</div>` + HOME;
    vi.resetModules();
    await import('../static/js/events-filter.js');
    window.PalmaEvents.init(TODAY);
    const rows = [...document.querySelectorAll('#home-recent > div')];
    expect(rows).toHaveLength(window.PalmaEvents.HOME_LIMIT);
    expect(rows[0].textContent).toContain('Past 5');
  });

  it('shows the empty message when nothing is upcoming', async () => {
    document.body.innerHTML = `<div id="event-data">${item({ date: '2020-01-01', title: 'old', month: 'Jan', year: '2020' })}</div>` + HOME;
    vi.resetModules();
    await import('../static/js/events-filter.js');
    window.PalmaEvents.init(TODAY);
    expect(document.getElementById('home-upcoming-empty').classList.contains('hidden')).toBe(false);
  });
});
