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

    Object.keys(grouped).forEach(type => {

      // Subsection heading (h3 matches shared CSS)
      const categoryHeading = document.createElement('h3');
      categoryHeading.textContent = type;
      container.appendChild(categoryHeading);

      // Sort newest → oldest
      grouped[type].sort((a, b) => new Date(b.date) - new Date(a.date));

      grouped[type].forEach(cert => {

        // Shared entry container
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry');

        // DASH at the beginning
        entryDiv.appendChild(document.createTextNode("- "));

        // Title (hyperlink if exists)
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
        orgSpan.innerHTML = `<em>${cert.organization}</em>`;

        // Year
        const yearSpan = document.createElement('span');
        yearSpan.classList.add('year');
        yearSpan.textContent = cert.date.split('-')[0] + ".";

        // Assemble line
        entryDiv.appendChild(titleElement);
        entryDiv.appendChild(document.createTextNode(", "));
        entryDiv.appendChild(orgSpan);
        entryDiv.appendChild(document.createTextNode(", "));
        entryDiv.appendChild(yearSpan);

        container.appendChild(entryDiv);
      });
    });
  })
  .catch(error => console.error('Error loading certifications:', error));