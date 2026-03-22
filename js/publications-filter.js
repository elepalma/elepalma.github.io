/**
 * Pure filtering logic for the publications page.
 * These functions are DOM-free and fully unit-testable.
 * The DOM wiring lives in static/js/publications-filter.js.
 */

/**
 * Whether a publication item should be visible given the active filter.
 * @param {string} dataYear    - The item's data-year attribute value
 * @param {string} dataAuthors - The item's data-authors attribute value
 * @param {string} value       - The filter value (year string, author pub_name, or "all")
 * @param {'year'|'author'} type - The filter type
 * @returns {boolean}
 */
export function shouldShow(dataYear, dataAuthors, value, type) {
  if (type === 'year') {
    return value === 'all' || dataYear === String(value);
  }
  return dataAuthors.includes(value);
}

/**
 * Whether a filter button should be rendered as active.
 * @param {string} btnText    - The button's trimmed text content (for year buttons)
 * @param {string} btnPubname - The button's data-pubname attribute (for author buttons)
 * @param {string} value      - The active filter value
 * @param {'year'|'author'} type - The filter type
 * @returns {boolean}
 */
export function isActiveButton(btnText, btnPubname, value, type) {
  if (type === 'year') {
    const label = value === 'all' ? 'All' : String(value);
    return btnText === label;
  }
  return btnPubname === value;
}
