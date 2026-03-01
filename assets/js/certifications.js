// assets/js/certifications.js

fetch('assets/data/certifications.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load certifications.json');
    return response.json();
  })
  .then(data => {
    const container = document.getElementById('certifications');
    if (!container) {
      console.error('Element with id "certifications" not found.');
      return;
    }

    // Group by type
    const grouped = data.reduce((acc, cert) => {
      if (!acc[cert.type]) acc[cert.type] = [];
      acc[cert.type].push(cert);
      return acc;
    }, {});

    Object.keys(grouped).forEach((type, index) => {
      // Create dropdown section wrapper
      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = `cert-${index}`; // unique id

      // Create clickable heading
      const heading = document.createElement('h4');
      heading.classList.add('dropdown-toggle');
      heading.textContent = type;

      // Create content container
      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      // Sort newest → oldest
      grouped[type].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Create <ul> for this category
      const ul = document.createElement('ul');

      grouped[type].forEach(cert => {
        // Each certificate as one <li>
        const li = document.createElement('li');
        li.classList.add('entry');

        // Certificate title
        if (cert.url && cert.url.trim() !== "") {
          const a = document.createElement('a');
          a.href = cert.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = cert.title;
          li.appendChild(a);
        } else {
          li.textContent = cert.title;
        }

        // Organization and Year
        const details = document.createElement('span');
        details.classList.add('org-year');
        details.innerHTML = `, <em>${cert.organization}</em>, ${cert.date.split('-')[0]}`;
        li.appendChild(details);

        ul.appendChild(li);
      });

      // Assemble section
      content.appendChild(ul);
      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    });
  })
  .catch(error => console.error('Error loading certifications:', error));