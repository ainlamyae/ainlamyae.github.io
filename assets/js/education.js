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

    data.forEach(edu => {

      // ===== Main container: logo + all text =====
      const entryDiv = document.createElement('div');
      entryDiv.style.display = 'flex';
      entryDiv.style.alignItems = 'flex-start';
      entryDiv.style.marginBottom = '20px';
      entryDiv.style.width = '100%';

      // ===== Logo =====
      if (edu.institution.logo) {
        const logoImg = document.createElement('img');
        logoImg.src = edu.institution.logo;
        logoImg.alt = edu.institution.name + " logo";
        logoImg.style.width = '80px';
        logoImg.style.marginRight = '15px';
        logoImg.style.flex = '0 0 80px';
        entryDiv.appendChild(logoImg);
      }

      // ===== Text Column =====
      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';
      textDiv.style.minWidth = '0';

      // University Name
      const uniHeading = document.createElement('h4');
      uniHeading.textContent = edu.institution.name;
      uniHeading.style.margin = '0 0 2px 0';
      textDiv.appendChild(uniHeading);

      // Location + Year
      const locationLine = document.createElement('p');
      locationLine.textContent = `${edu.institution.address}, ${edu.date.start.split('-')[0]}–${edu.date.end.split('-')[0]}`;
      textDiv.appendChild(locationLine);

      // Degree
      const degreeLine = document.createElement('p');
      degreeLine.innerHTML = `<strong>${edu.degree.level}</strong> (${edu.degree.abbreviation})`;
      textDiv.appendChild(degreeLine);

      // Field
      const fieldLine = document.createElement('p');
      fieldLine.textContent = edu.degree.field;
      textDiv.appendChild(fieldLine);

      // ===== Extra Details as Bullets =====
      const detailsList = document.createElement('ul');
      detailsList.style.margin = '5px 0 0 0';
      detailsList.style.paddingLeft = '20px';

      // Major
      if (edu.major) {
        const li = document.createElement('li');
        li.textContent = `Major: ${edu.major}`;
        detailsList.appendChild(li);
      }

      // Thesis
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

      // Supervisor
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

      // Group/Laboratory
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

      // GPA
      if (edu.gpa && edu.gpa.value !== null) {
        const li = document.createElement('li');
        li.textContent = `GPA: ${edu.gpa.value}/${edu.gpa.scale}`;
        detailsList.appendChild(li);
      }

      // Selected/Enrolled Courses
      if (edu.courses && edu.courses.enrolled.length > 0) {
        const li = document.createElement('li');
        li.textContent = "Selected/Enrolled Courses: " + edu.courses.enrolled.join(", ");
        detailsList.appendChild(li);
      }

      // Audited Courses
      if (edu.courses && edu.courses.audited && edu.courses.audited.length > 0) {
        const li = document.createElement('li');
        li.textContent = "Audited Courses: " + edu.courses.audited.join(", ");
        detailsList.appendChild(li);
      }

      textDiv.appendChild(detailsList);
      entryDiv.appendChild(textDiv);
      container.appendChild(entryDiv);

    });
  })
  .catch(error => console.error('Error loading education:', error));
