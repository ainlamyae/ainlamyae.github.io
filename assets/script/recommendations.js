document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('recommendations');
  if (!container) return console.error('#recommendations not found');
  showSectionLoading(container);

  fetch('assets/data/recommendations.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load recommendations.json');
      return res.json();
    })
    .then(data => {
      container.innerHTML = ''; // clear loading placeholder
      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "recommendations-1";

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = `Recommendations (${data.length})`;

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      const ul = document.createElement('ul');

      // Sort newest first
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      data.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('entry');

        const formattedDate = new Date(item.date).toLocaleString('en-US', {
          month: 'short',
          year: 'numeric'
        });

        // Name (linked or plain)
        const nameEl = document.createElement('strong');
        if (item.url) {
          const a = document.createElement('a');
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = item.name;
          nameEl.appendChild(a);
        } else {
          nameEl.textContent = item.name;
        }
        li.appendChild(nameEl);

        li.appendChild(document.createTextNode(` (${item.relationship}), `));

        const orgEl = document.createElement('em');
        orgEl.textContent = item.organization;
        li.appendChild(orgEl);

        li.appendChild(document.createTextNode(`, ${formattedDate}`));

        li.appendChild(document.createElement('br'));

        li.appendChild(document.createTextNode(item.recommendation));

        ul.appendChild(li);
      });

      content.appendChild(ul);
      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    })
    .catch(err => {
      console.error('Recommendations JS error:', err);
      showSectionError(container, 'recommendations');
    });
});