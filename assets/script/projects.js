document.addEventListener('DOMContentLoaded', function () {

  const container = document.getElementById('projects');
  if (!container) return;
  showSectionLoading(container);

  fetch('assets/data/projects.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load projects.json');
      return response.json();
    })
    .then(data => {
      container.innerHTML = ''; // clear loading placeholder

      // Sort projects from newest to oldest by start date
      data.sort((a, b) => {
        const getStart = p => p.date?.start ? new Date(p.date.start) : new Date(0);
        return getStart(b) - getStart(a);
      });

      // Outer dropdown — "Projects" heading
      const outerSection = document.createElement('div');
      outerSection.classList.add('dropdown-section');
      outerSection.dataset.sectionId = 'projects-1';

      const outerHeading = document.createElement('h3');
      outerHeading.classList.add('dropdown-toggle');
      outerHeading.textContent = `Projects (${data.length})`;

      const outerContent = document.createElement('div');
      outerContent.classList.add('dropdown-content');

      data.forEach(project => {
        const section = document.createElement('div');
        section.classList.add('dropdown-section', 'keyword-expandable');

        // Title row (dropdown toggle)
        const titleEl = document.createElement('h4');
        titleEl.classList.add('dropdown-toggle');
        titleEl.appendChild(document.createTextNode(project.title));

        makePermalink(section, titleEl, project.id, project.title);

        // "file" may be a single path, or a list of { src, caption } for
        // projects with multiple related documents/recordings
        const files = Array.isArray(project.file)
          ? project.file
          : (project.file && project.file.trim() !== '') ? [{ src: project.file, caption: project.title }] : [];

        files.forEach((file, index) => {
          if (!MEDIA_UNLOCKED || !file.src) return;
          const isVideo = /\.(mp4|webm|ogg)$/i.test(file.src);
          const fileLink = document.createElement('a');
          fileLink.href = '#';
          fileLink.textContent = isVideo ? ' 🎬' : ' 📄';
          fileLink.title = file.caption || (isVideo ? 'View Project Recording' : 'View Project File');
          fileLink.className = 'media-icon';
          fileLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof openMediaModal === 'function') {
              openMediaModal(files, index);
            }
          });
          titleEl.appendChild(fileLink);
        });

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
        if (MEDIA_UNLOCKED && project.media?.length) {
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
        outerContent.appendChild(section);
      });

      outerSection.appendChild(outerHeading);
      outerSection.appendChild(outerContent);
      container.appendChild(outerSection);

      if (typeof unhideMedia === 'function') unhideMedia();
    })
    .catch(error => {
      console.error('Error loading projects:', error);
      showSectionError(container, 'projects');
    });

});
