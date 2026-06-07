document.addEventListener('DOMContentLoaded', () => {

  fetch('assets/data/certifications.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load certifications.json');
      return response.json();
    })
    .then(data => {
      const container = document.getElementById('certifications');
      if (!container) return console.error('Element with id "certifications" not found.');

      // Outer dropdown — "Certifications" heading
      const outerSection = document.createElement('div');
      outerSection.classList.add('dropdown-section');
      outerSection.dataset.sectionId = 'certifications-1';

      const outerHeading = document.createElement('h3');
      outerHeading.classList.add('dropdown-toggle');
      outerHeading.textContent = 'Certifications';

      const outerContent = document.createElement('div');
      outerContent.classList.add('dropdown-content');

      // Group by type
      const grouped = data.reduce((acc, cert) => {
        if (!acc[cert.type]) acc[cert.type] = [];
        acc[cert.type].push(cert);
        return acc;
      }, {});

      Object.keys(grouped).forEach((type, index) => {
        // Inner dropdown per category
        const section = document.createElement('div');
        section.classList.add('dropdown-section', 'keyword-expandable');
        section.dataset.sectionId = `cert-${index}`;

        const heading = document.createElement('h4');
        heading.classList.add('dropdown-toggle');
        heading.textContent = `${type} (${grouped[type].length})`;

        const content = document.createElement('div');
        content.classList.add('dropdown-content');

        // Sort newest → oldest
        grouped[type].sort((a, b) => new Date(b.date) - new Date(a.date));

        const ul = document.createElement('ul');

        grouped[type].forEach(cert => {
          const li = document.createElement('li');
          li.classList.add('entry');

          if (cert.url && cert.url.trim() !== '') {
            const a = document.createElement('a');
            a.href = cert.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = cert.title;
            li.appendChild(a);
          } else {
            li.textContent = cert.title;
          }

          const details = document.createElement('span');
          details.classList.add('org-year');
          details.innerHTML = `, <em>${cert.organization}</em>, ${cert.date.split('-')[0]}`;
          li.appendChild(details);

          if (cert.file && cert.file.trim() !== '') {
            const fileLink = document.createElement('a');
            fileLink.href = '#';
            fileLink.textContent = ' 📜';
            fileLink.title = 'View Certificate';
            fileLink.className = 'media-icon';
            fileLink.addEventListener('click', (e) => {
              e.preventDefault();
              openMediaModal([{ src: cert.file, caption: cert.title }], 0);
            });
            li.appendChild(fileLink);
          }

          ul.appendChild(li);
        });

        content.appendChild(ul);
        section.appendChild(heading);
        section.appendChild(content);
        outerContent.appendChild(section);
      });

      outerSection.appendChild(outerHeading);
      outerSection.appendChild(outerContent);
      container.appendChild(outerSection);

      if (typeof unhideMedia === 'function') unhideMedia();
    })
    .catch(error => console.error('Error loading certifications:', error));

});