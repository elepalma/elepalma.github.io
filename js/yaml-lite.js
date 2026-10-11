/**
 * Minimal reader for the flat YAML used in data/*.yaml.
 * Supports: top-level keys, lists of mappings, quoted/unquoted scalars,
 * inline arrays ["a", "b"], nested block lists under a key, and comments.
 * It is deliberately small — the site has no YAML dependency installed.
 */
export function parseYamlLite(text) {
  const root = {};
  let currentList = null;   // array for the active top-level key
  let item = null;          // current mapping in that list
  let pendingListKey = null; // key awaiting block-list entries ("awards:")

  const scalar = (raw) => {
    const v = raw.trim();
    if (v === '') return '';
    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      if (!inner) return [];
      return inner.match(/"([^"]*)"|'([^']*)'|[^,]+/g).map(s => scalar(s));
    }
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
    return v;
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;

    let m;
    if ((m = line.match(/^([A-Za-z_][\w-]*):\s*$/))) {            // top-level key
      currentList = root[m[1]] = [];
      item = null; pendingListKey = null;
    } else if ((m = line.match(/^(\s+)- ([A-Za-z_][\w-]*):\s*(.*)$/))) { // new list item with first key
      item = {}; currentList.push(item);
      item[m[2]] = scalar(m[3]);
      pendingListKey = m[3].trim() === '' ? m[2] : null;
      if (pendingListKey) item[pendingListKey] = [];
    } else if ((m = line.match(/^(\s+)- (.*)$/)) && pendingListKey) {   // block-list entry
      item[pendingListKey].push(scalar(m[2]));
    } else if ((m = line.match(/^(\s+)([A-Za-z_][\w-]*):\s*(.*)$/))) {  // key inside item
      if (!item) throw new Error('Key outside list item: ' + line);
      item[m[2]] = scalar(m[3]);
      pendingListKey = m[3].trim() === '' ? m[2] : null;
      if (pendingListKey) item[pendingListKey] = [];
    } else {
      throw new Error('Unrecognised YAML line: ' + line);
    }
  }
  return root;
}
