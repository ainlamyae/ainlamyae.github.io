document.addEventListener('DOMContentLoaded', function () {

  fetch('assets/data/education.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load education.json');
      return response.json();
    })
    .then(data => {
      const container = document.getElementById('education');
      if (!container) return console.error('Element with id "education" not found.');

      // Sort newest → oldest
      data.sort((a, b) => new Date(b.date.end) - new Date(a.date.end));

      data.forEach((edu, index) => {

        // --- Main flex container: logo + left column ---
        const entryDiv = document.createElement('div');
        entryDiv.style.display = 'flex';
        entryDiv.style.alignItems = 'flex-start';
        entryDiv.style.marginBottom = '20px';
        entryDiv.style.width = '100%';

        // Logo
        if (edu.institution.logo) {
          const logoImg = document.createElement('img');
          logoImg.src = edu.institution.logo;
          logoImg.alt = edu.institution.name + " logo";
          logoImg.style.width = '80px';
          logoImg.style.marginRight = '15px';
          logoImg.style.flex = '0 0 80px';
          entryDiv.appendChild(logoImg);
        }

        // Right text column
        const textDiv = document.createElement('div');
        textDiv.style.flex = '1';
        textDiv.style.minWidth = '0';

        // University Name + Location line (always visible)
        const uniHeading = document.createElement('h4');
        uniHeading.textContent = edu.institution.name;
        uniHeading.style.margin = '0 0 2px 0';
        textDiv.appendChild(uniHeading);

        const locationLine = document.createElement('p');
        const startDate = new Date(edu.date.start);
        const endDate = new Date(edu.date.end);
        const options = { month: 'short', year: 'numeric' };
        const startStr = startDate.toLocaleDateString('en-US', options);
        const endStr = endDate.toLocaleDateString('en-US', options);
        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months += endDate.getMonth() - startDate.getMonth();
        const years = Math.floor(months / 12);
        const remMonths = months % 12;
        const durationStr = `${years > 0 ? years + ' yr' + (years > 1 ? 's' : '') : ''}${years && remMonths ? ' ' : ''}${remMonths > 0 ? remMonths + ' mos' : ''}`;
        locationLine.textContent = `${edu.institution.address} | ${startStr} - ${endStr} · ${durationStr}`;
        textDiv.appendChild(locationLine);

        // --- Dropdown Section for degree + details ---
        const section = document.createElement('div');
        section.classList.add('dropdown-section');
        section.dataset.sectionId = `edu-${index}`;

        // Degree line (clickable)
        const degreeHeading = document.createElement('h5');
        degreeHeading.classList.add('dropdown-toggle');
        degreeHeading.textContent = `${edu.degree.level} (${edu.degree.abbreviation}) in ${edu.degree.field}`;
        section.appendChild(degreeHeading);

        // Hidden content container
        const content = document.createElement('div');
        content.classList.add('dropdown-content');

        // Extra details as bullet points
        const detailsList = document.createElement('ul');
        detailsList.style.margin = '5px 0 0 0';
        detailsList.style.paddingLeft = '20px';

        if (edu.major) {
          const li = document.createElement('li');
          li.textContent = `Major: ${edu.major}`;
          detailsList.appendChild(li);
        }

        if (edu.thesis && edu.thesis.title) {
          const li = document.createElement('li');
          if (edu.thesis.url) {
            const link = document.createElement('a');
            link.href = edu.thesis.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = edu.thesis.title;
            li.textContent = 'Thesis: ';
            li.appendChild(link);
          } else {
            li.textContent = `Thesis: ${edu.thesis.title}`;
          }
          detailsList.appendChild(li);
        }

        if (edu.supervisor && edu.supervisor.name) {
          const li = document.createElement('li');
          if (edu.supervisor.url) {
            const link = document.createElement('a');
            link.href = edu.supervisor.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = edu.supervisor.name;
            li.textContent = 'Supervisor: ';
            li.appendChild(link);
          } else {
            li.textContent = `Supervisor: ${edu.supervisor.name}`;
          }
          detailsList.appendChild(li);
        }

        if (edu.research_group && edu.research_group.name) {
          const li = document.createElement('li');
          if (edu.research_group.url) {
            const link = document.createElement('a');
            link.href = edu.research_group.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = edu.research_group.name;
            li.textContent = 'Group/Laboratory: ';
            li.appendChild(link);
          } else {
            li.textContent = `Group/Laboratory: ${edu.research_group.name}`;
          }
          detailsList.appendChild(li);
        }

        if (edu.gpa && edu.gpa.value !== null) {
          const li = document.createElement('li');
          li.textContent = `GPA: ${edu.gpa.value}/${edu.gpa.scale}`;
          detailsList.appendChild(li);
        }

        if (edu.courses && edu.courses.enrolled && edu.courses.enrolled.length > 0) {
          const li = document.createElement('li');
          li.textContent = "Selected/Enrolled Courses: " + edu.courses.enrolled.join(", ");
          detailsList.appendChild(li);
        }

        if (edu.courses && edu.courses.audited && edu.courses.audited.length > 0) {
          const li = document.createElement('li');
          li.textContent = "Audited Courses: " + edu.courses.audited.join(", ");
          detailsList.appendChild(li);
        }

        content.appendChild(detailsList);
        section.appendChild(content);

        // Append section after the visible uni + location line
        textDiv.appendChild(section);
        entryDiv.appendChild(textDiv);
        container.appendChild(entryDiv);

      });

    })
    .catch(error => console.error('Error loading education:', error));

});
