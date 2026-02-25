// assets/js/education.js

fetch('assets/data/education.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load education.json');
    return response.json();
  })
  .then(data => {

    const container = document.getElementById('education');
    if (!container) {
      console.error('Element with id "education" not found.');
      return;
    }

    // Sort newest → oldest
    data.sort((a, b) => new Date(b.date.end) - new Date(a.date.end));

    data.forEach(edu => {

      // ===== University Name (h3) =====
      const uniHeading = document.createElement('h3');
      uniHeading.textContent = edu.institution.name;
      container.appendChild(uniHeading);

      // ===== Location + Year =====
      const locationLine = document.createElement('p');
      locationLine.style.margin = '2px 0';
      locationLine.textContent = `${edu.institution.address}, ${edu.date.start.split('-')[0]}–${edu.date.end.split('-')[0]}`;
      container.appendChild(locationLine);

        // ===== Degree =====
        const degreeLine = document.createElement('p');
        degreeLine.style.margin = '2px 0';

        // Bold the level, keep abbreviation normal
        degreeLine.innerHTML = `<strong>${edu.degree.level}</strong> (${edu.degree.abbreviation})`;
        container.appendChild(degreeLine);

      // ===== Field =====
      const fieldLine = document.createElement('p');
      fieldLine.style.margin = '2px 0';
      fieldLine.textContent = edu.degree.field;
      container.appendChild(fieldLine);

      // ===== Extra Details =====
      const detailsDiv = document.createElement('div');
      detailsDiv.style.marginLeft = '1.5em';
      detailsDiv.style.marginTop = '2px';
      detailsDiv.style.lineHeight = '1.3';

      // Major
      if (edu.major) {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        p.textContent = `Major: ${edu.major}`;
        detailsDiv.appendChild(p);
      }

      // Thesis
      if (edu.thesis && edu.thesis.title) {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        if (edu.thesis.url) {
          const link = document.createElement('a');
          link.href = edu.thesis.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = edu.thesis.title;
          p.textContent = 'Thesis: ';
          p.appendChild(link);
        } else {
          p.textContent = `Thesis: ${edu.thesis.title}`;
        }
        detailsDiv.appendChild(p);
      }

      // Supervisor
      if (edu.research_group && edu.research_group.supervisor) {
        const p = document.createElement('p');
        p.style.margin = '2px 0';
        p.textContent = `Supervisor: ${edu.research_group.supervisor}`;
        detailsDiv.appendChild(p);

        // Group/Laboratory with hyperlink
        if (edu.research_group.name) {
          const groupLine = document.createElement('p');
          groupLine.style.margin = '2px 0';
          groupLine.innerHTML = `Group/Laboratory: <a href="${edu.research_group.url}" target="_blank" rel="noopener noreferrer">${edu.research_group.name}</a>`;
          detailsDiv.appendChild(groupLine);
        }
      }

      // GPA (only if value exists)
      if (edu.gpa && edu.gpa.value !== null) {
        const pGPA = document.createElement('p');
        pGPA.style.margin = '2px 0';
        pGPA.textContent = `GPA: ${edu.gpa.value}/${edu.gpa.scale}`;
        detailsDiv.appendChild(pGPA);
      }

      // Courses (comma separated)
      if (edu.courses && edu.courses.enrolled.length > 0) {
        const pCourses = document.createElement('p');
        pCourses.style.margin = '2px 0';
        pCourses.textContent = "Selected Courses: " + edu.courses.enrolled.join(", ");
        detailsDiv.appendChild(pCourses);
      }

      container.appendChild(detailsDiv);

    });

  })
  .catch(error => console.error('Error loading education:', error));