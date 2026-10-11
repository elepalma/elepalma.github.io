// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  const setOpen = (open) => {
    mobileMenu.classList.toggle('hidden', !open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', mobileMenu.id);
  hamburger.addEventListener('click', () => setOpen(mobileMenu.classList.contains('hidden')));
  mobileMenu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setOpen(false))
  );
  // Escape closes the menu and returns focus to the toggle
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      setOpen(false);
      hamburger.focus();
    }
  });

  // Accordion for parent items with children
  mobileMenu.querySelectorAll('.mobile-accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const icon  = btn.querySelector('.mobile-accordion-icon');
      const open = panel.classList.toggle('hidden') === false;
      icon.classList.toggle('rotate-180', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}
