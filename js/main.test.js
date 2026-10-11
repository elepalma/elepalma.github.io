import { beforeEach, describe, it, expect, vi } from 'vitest';

function setupDOM() {
  document.body.innerHTML = `
    <button id="hamburger" aria-label="Toggle menu"></button>
    <div id="mobile-menu" class="hidden">
      <div>
        <button class="mobile-accordion-btn">
          Research
          <svg class="mobile-accordion-icon"></svg>
        </button>
        <div class="mobile-accordion-panel hidden">
          <a href="/research/" class="mobile-nav-link">Projects</a>
          <a href="/research/techniques/" class="mobile-nav-link">Techniques</a>
        </div>
      </div>
      <a href="/events/" class="mobile-nav-link">Events</a>
    </div>
  `;
}

beforeEach(async () => {
  setupDOM();
  vi.resetModules();
  await import('../static/js/main.js');
});

// ---------------------------------------------------------------------------
// Hamburger
// ---------------------------------------------------------------------------

describe('hamburger toggle', () => {
  it('opens the mobile menu on first click', () => {
    document.getElementById('hamburger').click();
    expect(document.getElementById('mobile-menu').classList.contains('hidden')).toBe(false);
  });

  it('closes the mobile menu on second click', () => {
    const btn = document.getElementById('hamburger');
    btn.click();
    btn.click();
    expect(document.getElementById('mobile-menu').classList.contains('hidden')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Nav link closes menu
// ---------------------------------------------------------------------------

describe('nav link closes menu', () => {
  it('hides the mobile menu when any nav link is clicked', () => {
    document.getElementById('hamburger').click();
    document.querySelector('.mobile-nav-link').click();
    expect(document.getElementById('mobile-menu').classList.contains('hidden')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

describe('accordion panel', () => {
  it('reveals the panel when accordion button is clicked', () => {
    document.querySelector('.mobile-accordion-btn').click();
    expect(document.querySelector('.mobile-accordion-panel').classList.contains('hidden')).toBe(false);
  });

  it('re-hides the panel on second click', () => {
    const btn = document.querySelector('.mobile-accordion-btn');
    btn.click();
    btn.click();
    expect(document.querySelector('.mobile-accordion-panel').classList.contains('hidden')).toBe(true);
  });
});

describe('accordion icon rotation', () => {
  it('adds rotate-180 to the icon when opened', () => {
    document.querySelector('.mobile-accordion-btn').click();
    expect(document.querySelector('.mobile-accordion-icon').classList.contains('rotate-180')).toBe(true);
  });

  it('removes rotate-180 from the icon when closed', () => {
    const btn = document.querySelector('.mobile-accordion-btn');
    btn.click();
    btn.click();
    expect(document.querySelector('.mobile-accordion-icon').classList.contains('rotate-180')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Accessibility state
// ---------------------------------------------------------------------------

describe('hamburger aria state', () => {
  it('starts collapsed and points at the menu it controls', () => {
    const btn = document.getElementById('hamburger');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-controls')).toBe('mobile-menu');
  });

  it('reports expanded when open and collapsed when closed', () => {
    const btn = document.getElementById('hamburger');
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and returns focus to the toggle', () => {
    const btn = document.getElementById('hamburger');
    btn.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('mobile-menu').classList.contains('hidden')).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(btn);
  });

  it('accordion button reports its expanded state', () => {
    const acc = document.querySelector('.mobile-accordion-btn');
    acc.click();
    expect(acc.getAttribute('aria-expanded')).toBe('true');
    acc.click();
    expect(acc.getAttribute('aria-expanded')).toBe('false');
  });
});
