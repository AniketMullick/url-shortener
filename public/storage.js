const KEY = 'url_shortener_links';

// Read all saved links (newest first)
export function getSavedLinks() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];   // corrupted data guard
  }
}

// Save a newly created link
export function saveLink({ shortCode, shortUrl, original }) {
  const links = getSavedLinks();

  // Avoid duplicates (re-shortening same URL)
  const filtered = links.filter(l => l.shortCode !== shortCode);
  
  const newEntry = {
    shortCode,
    shortUrl,
    original,
    createdAt: new Date().toISOString()
  };

  // Prepend so newest is first; cap at 50 entries
  const updated = [newEntry, ...filtered].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

// Delete one link from history (user-initiated)
export function removeLink(shortCode) {
  const updated = getSavedLinks().filter(l => l.shortCode !== shortCode);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

// Wipe entire history
export function clearAllLinks() {
  localStorage.removeItem(KEY);
}