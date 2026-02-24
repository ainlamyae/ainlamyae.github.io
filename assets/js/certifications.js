// assets/js/certifications.js

fetch('assets/data/certifications.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load certifications.json');
    return response.json();
  })
  .then(data => {
    const container = document.getElementById('certifications');
    if (!container) return console.error('Element with id "certifications" not found.');

    // Group by type
    const grouped = data.reduce((acc, cert) => {
      if (!acc[cert.type]) acc[cert.type] = [];
      acc[cert.type].push(cert);
      return acc;
    }, {});

    Object.keys(grouped).forEach(type => {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('type-group');

      // Category heading
      const categoryHeading = document.createElement('h3');
      categoryHeading.textContent = type;
      groupDiv.appendChild(categoryHeading);

      // Sort newest to oldest
      grouped[type].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Create a <ul> for the certificates
      const ul = document.createElement('ul');

      grouped[type].forEach(cert => {
        const li = document.createElement('li');
        li.classList.add('certificate');

        // Title (hyperlink)
        let titleElement;
        if (cert.url && cert.url.trim() !== "") {
          titleElement = document.createElement('a');
          titleElement.href = cert.url;
          titleElement.target = '_blank';
          titleElement.rel = 'noopener noreferrer';
          titleElement.textContent = cert.title;
        } else {
          titleElement = document.createElement('span');
          titleElement.textContent = cert.title;
        }

        // Organization
        const orgSpan = document.createElement('span');
        orgSpan.classList.add('org');
        orgSpan.textContent = cert.organization;

        // Year with dot
        const yearSpan = document.createElement('span');
        yearSpan.classList.add('year');
        yearSpan.textContent = cert.date.split('-')[0] + ".";

        // Combine text: Title, Organization, Year
        li.appendChild(titleElement);
        li.appendChild(document.createTextNode(", "));
        li.appendChild(orgSpan);
        li.appendChild(document.createTextNode(", "));
        li.appendChild(yearSpan);

        ul.appendChild(li);
      });

      groupDiv.appendChild(ul);
      container.appendChild(groupDiv);
    });
  })
  .catch(error => console.error('Error loading certifications:', error));