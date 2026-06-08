document.addEventListener('DOMContentLoaded', function () {

  const container = document.getElementById('projects-list');
  if (!container) return;
  showSectionLoading(container);

  fetch('assets/data/projects.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load projects.json');
      return response.json();
    })
    .then(data => {
      container.innerHTML = ''; // clear loading placeholder

      data.forEach(project => {
        const section = document.createElement('div');
        section.classList.add('dropdown-section', 'keyword-expandable');

        // Title row (dropdown toggle)
        const titleEl = document.createElement('p');
        titleEl.classList.add('dropdown-toggle');
        titleEl.style.cursor = 'pointer';
        titleEl.innerHTML = `<strong>${project.title}</strong>`;
        section.appendChild(titleEl);

        // Hidden content
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('dropdown-content');

        // Category + date line
        if (project.category || project.date?.start) {
          const metaLine = document.createElement('p');
          metaLine.style.marginTop = '-4px';
          metaLine.style.marginBottom = '4px';
          metaLine.style.fontSize = '0.95em';
          metaLine.style.color = '#666';

          const datePart = project.date?.start
            ? `${formatDate(project.date.start)} – ${formatDate(project.date.end)} · ${calculateDuration(project.date.start, project.date.end)}`
            : '';

          metaLine.textContent = project.category && datePart
            ? `${project.category} | ${datePart}`
            : project.category || datePart;

          contentDiv.appendChild(metaLine);
        }

        // Description bullets
        if (project.description?.length) {
          const ul = document.createElement('ul');
          project.description.forEach(point => {
            const li = document.createElement('li');
            li.textContent = point;
            ul.appendChild(li);
          });
          contentDiv.appendChild(ul);
        }

        // Media row
        if (project.media?.length) {
          const mediaRow = document.createElement('div');
          mediaRow.className = 'media-row';

          project.media.forEach((media, index) => {
            if (!media.src) return;
            const img = document.createElement('img');
            img.src = media.src;
            img.alt = media.caption || '';
            img.title = media.caption || '';
            img.className = 'media-img';
            img.addEventListener('click', (e) => {
              e.preventDefault();
              if (typeof openMediaModal === 'function') {
                openMediaModal(project.media, index);
              }
            });
            mediaRow.appendChild(img);
          });

          contentDiv.appendChild(mediaRow);
        }

        section.appendChild(contentDiv);
        container.appendChild(section);
      });

      if (typeof unhideMedia === 'function') unhideMedia();
    })
    .catch(error => {
      console.error('Error loading projects:', error);
      showSectionError(container, 'projects');
    });

});
