// Normalises the `notes` list in content.js.
// Input group: [title, items, tags]; item: string or [text, tags].
// Output: [{ title, tags, items: [{ text, tags }] }]
function normalizeNotes(notes) {
  return notes.map(([title, items, tags = []]) => ({
    title,
    tags,
    items: items.map(it => Array.isArray(it) ? { text: it[0], tags: it[1] } : { text: it, tags }),
  }));
}

module.exports = { normalizeNotes };
