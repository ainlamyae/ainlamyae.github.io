// Shared date utilities used by experience.js and education.js

function formatDate(dateString) {
  if (!dateString) return "Present";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  months = months % 12;

  let result = '';
  if (years > 0) result += `${years} yr${years > 1 ? 's' : ''} `;
  if (months > 0) result += `${months} mo${months > 1 ? 's' : ''}`;
  return result.trim();
}

function showSectionLoading(container) {
  container.innerHTML = '<p class="section-status">Loading…</p>';
}

function showSectionError(container, label) {
  container.innerHTML = `<p class="section-status section-status-error">Couldn't load ${label}. Please try refreshing the page.</p>`;
}
