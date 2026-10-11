/**
 * Events — client-side split into upcoming / past, sorted, rendered.
 * Used by the Events page (#upcoming-list / #past-list) and by the
 * home page (#home-upcoming, limited to a few items). The event data is
 * emitted by Hugo into #event-data as data attributes (partial event-data.html).
 *
 * Exposed as window.PalmaEvents so the pure logic can be unit tested.
 */
(function () {
  var HOME_LIMIT = 3;

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function startOfDay(d) {
    var t = new Date(d);
    t.setHours(0, 0, 0, 0);
    return t;
  }

  /** Split a list of {date, ...} records into upcoming and past, sorted. */
  function partition(records, today) {
    var t = startOfDay(today || new Date());
    var upcoming = [];
    var past = [];
    records.forEach(function (r) {
      var d = new Date(r.date);
      (isNaN(d) || d < t ? past : upcoming).push(r);
    });
    upcoming.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    past.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return { upcoming: upcoming, past: past };
  }

  function titleHtml(d, cls) {
    var text = esc(d.title);
    if (d.link) {
      return '<a href="' + esc(d.link) + '" target="_blank" rel="noopener" class="' + cls + ' hover:text-accent transition-colors">' + text + '</a>';
    }
    return '<span class="' + cls + '">' + text + '</span>';
  }

  function dateBox(d, past) {
    var box = past ? 'bg-rule text-ink-light' : 'bg-accent text-white';
    var line = 'text-2xs font-semibold uppercase tracking-widest' + (past ? '' : ' opacity-90');
    return '<div class="shrink-0 w-14 ' + box + ' rounded-lg text-center py-2">' +
      (d.day ? '<p class="' + line + '">' + esc(d.day) + '</p>' : '') +
      '<p class="' + line + '">' + esc(d.month) + '</p>' +
      '<p class="' + line + '">' + esc(d.year) + '</p>' +
      '</div>';
  }

  function buildCard(d, isPast) {
    var row = document.createElement('div');
    var badge = isPast
      ? 'text-2xs font-semibold uppercase tracking-wide text-ink-light bg-rule px-2 py-0.5 rounded-full'
      : 'text-2xs font-semibold uppercase tracking-wide text-accent bg-accent-light px-2 py-0.5 rounded-full';
    var btn = isPast
      ? 'hidden sm:inline-flex shrink-0 text-xs text-ink-light border border-rule px-3 py-1.5 rounded hover:border-accent hover:text-accent transition-colors whitespace-nowrap'
      : 'hidden sm:inline-flex shrink-0 text-xs text-accent border border-accent px-3 py-1.5 rounded hover:bg-accent hover:text-white transition-colors whitespace-nowrap';

    row.className = isPast ? 'flex items-start gap-4 sm:gap-6 py-4' : 'flex items-start gap-4 sm:gap-6 py-5';
    row.innerHTML =
      dateBox(d, isPast) +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex flex-wrap items-start gap-2 mb-1">' +
          '<h3 class="text-sm font-medium">' + titleHtml(d, '') + '</h3>' +
          '<span class="' + badge + '">' + esc(d.type) + '</span>' +
        '</div>' +
        '<p class="text-xs text-ink-light mb-1">' + esc(d.location) + (isPast && d.year ? ' · ' + esc(d.year) : '') + '</p>' +
        (d.detail ? '<p class="text-xs text-ink-light' + (isPast ? ' italic' : '') + ' mt-0.5">' + esc(d.detail) + '</p>' : '') +
      '</div>' +
      (d.link ? '<a href="' + esc(d.link) + '" target="_blank" rel="noopener" class="' + btn + '">Info →</a>' : '');
    return row;
  }

  function buildHomeRow(d) {
    var row = document.createElement('div');
    row.className = 'flex items-center gap-4 sm:gap-5 py-4';
    row.innerHTML =
      '<div class="shrink-0 w-12 bg-accent text-white rounded-md text-center py-1.5">' +
        (d.day ? '<p class="text-2xs font-semibold uppercase tracking-widest opacity-90">' + esc(d.day) + '</p>' : '') +
        '<p class="text-2xs font-semibold uppercase tracking-widest opacity-90">' + esc(d.month) + '</p>' +
        '<p class="text-2xs font-semibold uppercase tracking-widest opacity-90">' + esc(d.year) + '</p>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<p class="text-sm font-medium leading-snug">' + titleHtml(d, '') + '</p>' +
        '<p class="text-xs text-ink-light mt-0.5">' + esc(d.location) + '</p>' +
      '</div>' +
      '<span class="hidden sm:inline-block text-2xs font-semibold uppercase tracking-wide text-accent bg-accent-light px-2.5 py-1 rounded-full shrink-0">' + esc(d.type) + '</span>';
    return row;
  }

  function readRecords() {
    return Array.from(document.querySelectorAll('#event-data .event-item')).map(function (el) {
      var d = el.dataset;
      return { date: d.date, month: d.month, day: d.day, year: d.year, title: d.title,
               type: d.type, location: d.location, detail: d.detail, link: d.link };
    });
  }

  function setHidden(id, hidden) {
    var el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', hidden);
  }

  /** Render into whichever containers exist on the page. */
  function init(today) {
    var split = partition(readRecords(), today);

    var upcomingList = document.getElementById('upcoming-list');
    var pastList = document.getElementById('past-list');
    if (upcomingList && pastList) {
      upcomingList.innerHTML = '';
      pastList.innerHTML = '';
      split.upcoming.forEach(function (d) { upcomingList.appendChild(buildCard(d, false)); });
      split.past.forEach(function (d) { pastList.appendChild(buildCard(d, true)); });
      setHidden('upcoming-empty', split.upcoming.length > 0);
      setHidden('past-empty', split.past.length > 0);
    }

    var home = document.getElementById('home-upcoming');
    if (home) {
      home.innerHTML = '';
      split.upcoming.slice(0, HOME_LIMIT).forEach(function (d) { home.appendChild(buildHomeRow(d)); });
      setHidden('home-upcoming-empty', split.upcoming.length > 0);
    }
    return split;
  }

  window.PalmaEvents = { partition: partition, buildCard: buildCard, buildHomeRow: buildHomeRow, init: init, HOME_LIMIT: HOME_LIMIT };
  init();
})();
