/**
 * Publications filter — DOM wiring.
 * Pure filtering logic lives in js/publications-filter.js (used by unit tests).
 */

function filterPubs(value, type) {
  let visible = 0;
  document.querySelectorAll('.pub-item').forEach(el => {
    const show = type === 'year'
      ? value === 'all' || el.dataset.year === String(value)
      : el.dataset.authors.includes(value);
    el.style.display = show ? 'flex' : 'none';
    if (show) visible++;
  });

  const empty = document.getElementById('pub-empty');
  if (empty) empty.classList.toggle('hidden', visible > 0);

  document.querySelectorAll('.pub-filter').forEach(btn => {
    const active = type === 'year'
      ? btn.textContent.trim() === (value === 'all' ? 'All' : String(value))
      : btn.dataset.pubname === value;
    btn.classList.toggle('bg-accent',     active);
    btn.classList.toggle('text-white',    active);
    btn.classList.toggle('border-accent', active);
    btn.classList.toggle('border-rule',   !active);
    btn.classList.toggle('text-ink-light',!active);
  });
}

// Explicit global so the inline onclick handlers (and tests) can reach it
window.filterPubs = filterPubs;

document.addEventListener('DOMContentLoaded', () => {
  const author = new URLSearchParams(location.search).get('author');
  if (author) filterPubs(author, 'author');
});
