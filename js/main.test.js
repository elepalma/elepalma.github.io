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
