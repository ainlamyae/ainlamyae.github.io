/**
 * include.js
 * Fetches an HTML partial and swaps it in for a placeholder element.
 * Returns a promise resolving to the inserted element (or null if no placeholder/failure).
 */
function includePartial(placeholderId, url) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return Promise.resolve(null);

  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      return response.text();
    })
    .then(html => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html.trim();
      const el = wrapper.firstElementChild;
      placeholder.replaceWith(el);
      return el;
    })
    .catch(error => {
      console.error(`Error loading partial ${url}:`, error);
      return null;
    });
}
