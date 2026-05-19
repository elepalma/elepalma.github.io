(function () {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var twoYearsAgo = today.getFullYear() - 2;

  var items = Array.from(document.querySelectorAll('.event-item'));
  var upcomingList = document.getElementById('upcoming-list');
  var pastList = document.getElementById('past-list');

  var upcoming = [];
  var past = [];

  items.forEach(function (el) {
    var d = new Date(el.dataset.date);
    (d < today ? past : upcoming).push(el);
  });

  upcoming.sort(function (a, b) { return new Date(a.dataset.date) - new Date(b.dataset.date); });
  past.sort(function (a, b) { return new Date(b.dataset.date) - new Date(a.dataset.date); });

  upcoming.forEach(function (el) { upcomingList.appendChild(buildCard(el, false)); });
  past.forEach(function (el) { pastList.appendChild(buildCard(el, true)); });

  document.getElementById('upcoming-empty').hidden = upcoming.length > 0;
  document.getElementById('past-empty').hidden = past.length > 0;

  function buildCard(el, isPast) {
    var d = el.dataset;
    var row = document.createElement('div');

    if (isPast) {
      row.className = 'flex items-start gap-4 sm:gap-6 py-4 opacity-70';

      var isRecent = parseInt(d.year, 10) > twoYearsAgo;
      var dateBox = '<div class="shrink-0 w-14 bg-rule rounded-lg text-center py-2">' +
        (isRecent && d.day ? '<p class="text-2xs font-semibold uppercase tracking-widest text-ink-faint">' + esc(d.day) + '</p>' : '') +
        '<p class="text-2xs font-semibold uppercase tracking-widest text-ink-faint">' + esc(d.month) + '</p>' +
        '<p class="text-2xs font-semibold uppercase tracking-widest text-ink-faint">' + esc(d.year) + '</p>' +
        '</div>';

      var body = '<div class="flex-1 min-w-0">' +
        '<p class="text-sm font-medium">' + esc(d.title) + '</p>' +
        '<p class="text-xs text-ink-faint">' + (d.location ? esc(d.location) + ' · ' : '') + esc(d.year) + '</p>' +
        (d.detail ? '<p class="text-xs text-ink-light italic mt-0.5">' + esc(d.detail) + '</p>' : '') +
        '</div>';

      var badge = '<span class="hidden sm:inline-block text-2xs font-medium text-ink-faint border border-rule px-2 py-0.5 rounded-full">' + esc(d.type) + '</span>';

      row.innerHTML = dateBox + body + badge;
    } else {
      row.className = 'flex items-start gap-4 sm:gap-6 py-5';

      var dateBox = '<div class="shrink-0 w-14 bg-accent text-white rounded-lg text-center py-2">' +
        (d.day ? '<p class="text-2xs font-semibold uppercase tracking-widest opacity-75">' + esc(d.day) + '</p>' : '') +
        '<p class="text-2xs font-semibold uppercase tracking-widest opacity-75">' + esc(d.month) + '</p>' +
        '<p class="text-2xs font-semibold uppercase tracking-widest opacity-75">' + esc(d.year) + '</p>' +
        '</div>';

      var body = '<div class="flex-1 min-w-0">' +
        '<div class="flex flex-wrap items-start gap-2 mb-1">' +
        '<h3 class="text-sm font-medium">' + esc(d.title) + '</h3>' +
        '<span class="text-2xs font-semibold uppercase tracking-wide text-accent bg-accent-light px-2 py-0.5 rounded-full">' + esc(d.type) + '</span>' +
        '</div>' +
        '<p class="text-xs text-ink-faint mb-1">' + esc(d.location) + '</p>' +
        (d.detail ? '<p class="text-xs text-ink-light">' + esc(d.detail) + '</p>' : '') +
        '</div>';

      var link = d.link
        ? '<a href="' + esc(d.link) + '" target="_blank" rel="noopener" class="hidden sm:inline-flex shrink-0 text-xs text-accent border border-accent px-3 py-1.5 rounded hover:bg-accent hover:text-white transition-colors whitespace-nowrap">Info →</a>'
        : '';

      row.innerHTML = dateBox + body + link;
    }

    return row;
  }

  function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
