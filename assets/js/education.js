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

      // ===== Container for logo + first 4 lines =====
      const topDiv = document.createElement('div');
      topDiv.style.display = 'flex';
      topDiv.style.alignItems = 'flex-start';
      topDiv.style.marginBottom = '6px';

      // ===== Logo =====
      if (edu.institution.logo) {
        const logoImg = document.createElement('img');
        logoImg.src = edu.institution.logo;
        logoImg.alt = edu.institution.name + " logo";
        logoImg.style.width = '100px';
        logoImg.style.height = 'auto';
        logoImg.style.objectFit = 'contain';
        logoImg.style.marginRight = '15px';
        topDiv.appendChild(logoImg);
      }

      // ===== Text Block =====
      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';

      // University Name (h3)
      const uniHeading = document.createElement('h3');
      uniHeading.textContent = edu.institution.name;
      uniHeading.style.margin = '0 0 2px 0';
      textDiv.appendChild(uniHeading);

      // Location + Year
      const locationLine = document.createElement('p');
      locationLine.style.margin = '0 0 2px 0';
      locationLine.textContent = `${edu.institution.address}, ${edu.date.start.split('-')[0]}–${edu.date.end.split('-')[0]}`;
      textDiv.appendChild(locationLine);

      // Degree
      const degreeLine = document.createElement('p');
      degreeLine.style.margin = '0 0 2px 0';
      degreeLine.innerHTML = `<strong>${edu.degree.level}</strong> (${edu.degree.abbreviation})`;
      textDiv.appendChild(degreeLine);

      // Field
      const fieldLine = document.createElement('p');
      fieldLine.style.margin = '0 0 2px 0';
      fieldLine.textContent = edu.degree.field;
      textDiv.appendChild(fieldLine);

      topDiv.appendChild(textDiv);
      container.appendChild(topDiv);

      // ===== Extra Details =====
      const detailsDiv = document.createElement('div');
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
        if (edu.supervisor && edu.supervisor.name) {
          const p = document.createElement('p');
          p.style.margin = '2px 0';

          if (edu.supervisor.url) {
            const link = document.createElement('a');
            link.href = edu.supervisor.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = edu.supervisor.name;
            p.textContent = 'Supervisor: ';
            p.appendChild(link);
          } else {
            p.textContent = `Supervisor: ${edu.supervisor.name}`;
          }

          detailsDiv.appendChild(p);
        }

        // Group/Laboratory
        if (edu.research_group && edu.research_group.name) {
          const groupLine = document.createElement('p');
          groupLine.style.margin = '2px 0';

          if (edu.research_group.url) {
            const link = document.createElement('a');
            link.href = edu.research_group.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = edu.research_group.name;
            groupLine.textContent = 'Group/Laboratory: ';
            groupLine.appendChild(link);
          } else {
            groupLine.textContent = `Group/Laboratory: ${edu.research_group.name}`;
          }

          detailsDiv.appendChild(groupLine);
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
        pCourses.textContent = "Selected/Enrolled Courses: " + edu.courses.enrolled.join(", ");
        detailsDiv.appendChild(pCourses);
      }
      // Audited courses (comma separated)
        if (edu.courses && edu.courses.audited && edu.courses.audited.length > 0) {
        const pAudited = document.createElement('p');
        pAudited.style.margin = '2px 0';
        pAudited.textContent = "Audited Courses: " + edu.courses.audited.join(", ");
        detailsDiv.appendChild(pAudited);
        }

      container.appendChild(detailsDiv);
      // Add extra spacing after each education entry
      const spacer = document.createElement('div');
      spacer.style.height = '20px';  // adjust to whatever spacing you like
      container.appendChild(spacer);

    });

  })
  .catch(error => console.error('Error loading education:', error));