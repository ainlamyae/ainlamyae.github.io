// assets/js/experience.js

fetch('assets/data/experience.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load experience.json');
    return response.json();
  })
  .then(data => {

    const container = document.getElementById('experience');
    if (!container) {
      console.error('Element with id "experience" not found.');
      return;
    }

    // ===== Group by organization =====
    const orgMap = new Map();
    data.forEach(job => {
      const orgKey = job.organization?.name || job.organization || "Unknown Organization";
      if (!orgMap.has(orgKey)) orgMap.set(orgKey, []);
      orgMap.get(orgKey).push(job);
    });

    // ===== Sort jobs inside each organization by start date ascending =====
    orgMap.forEach((jobs, orgName) => {
      jobs.sort((a, b) => {
  const aEnd = a.date.end ? new Date(a.date.end) : new Date(); // treat ongoing as today
  const bEnd = b.date.end ? new Date(b.date.end) : new Date();
  return bEnd - aEnd; // descending: newest first
});
    });

    // ===== Render each organization =====
    orgMap.forEach((jobs, orgName) => {

      // ===== Calculate org-wide start/end and duration =====
      const orgStartDate = new Date(Math.min(...jobs.map(j => new Date(j.date.start))));
      const orgEndDate = new Date(Math.max(...jobs.map(j => new Date(j.date.end))));
      const monthsDiff = (orgEndDate.getFullYear() - orgStartDate.getFullYear()) * 12 +
                         (orgEndDate.getMonth() - orgStartDate.getMonth());
      const orgYears = Math.floor(monthsDiff / 12);
      const orgMonths = monthsDiff % 12;
      const options = { month: 'short', year: 'numeric' };
      const orgStartStr = orgStartDate.toLocaleDateString('en-US', options);
      const orgEndStr = orgEndDate.toLocaleDateString('en-US', options);

      // ===== Top container for org + first job =====
      const topDiv = document.createElement('div');
      topDiv.style.display = 'flex';
      topDiv.style.alignItems = 'flex-start'; // logo aligned with org container
      topDiv.style.marginBottom = '6px';

      // Logo
      if (jobs[0].logo) {
        const logoImg = document.createElement('img');
        logoImg.src = jobs[0].logo;
        logoImg.alt = jobs[0].organization + " logo";
        logoImg.style.width = '100px';
        logoImg.style.height = 'auto';
        logoImg.style.objectFit = 'contain';
        logoImg.style.marginRight = '15px';
        logoImg.style.alignSelf = 'flex-start'; // explicitly align top with orgHeading
        topDiv.appendChild(logoImg);
      }

      // Text block
      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';

      // ===== Org Heading + Address/Date =====
      const orgContainer = document.createElement('div'); // container for h3 + address/date
      orgContainer.style.display = 'flex';
      orgContainer.style.flexDirection = 'column';

      const orgHeading = document.createElement('h3');
      orgHeading.textContent = orgName || (jobs[0].organization?.name || "Organization");
      orgHeading.style.margin = '0 0 2px 0';
      orgContainer.appendChild(orgHeading);

      const infoLine = document.createElement('p');
      infoLine.style.margin = '0';
      infoLine.style.fontStyle = 'italic';
      infoLine.style.fontSize = '0.95em';

      let text = jobs[0].address || "Unknown Location";
      text += ` | ${orgStartStr} - ${orgEndStr} · ${orgYears} yrs ${orgMonths} mos`;
      infoLine.textContent = text;
      orgContainer.appendChild(infoLine);

      textDiv.appendChild(orgContainer);

      // ===== First Position =====
      if (jobs[0].position) {
        const posHeading = document.createElement('h4');
        posHeading.textContent = jobs[0].position;
        textDiv.appendChild(posHeading);

        const startDate = new Date(jobs[0].date.start);
        const endDate = new Date(jobs[0].date.end);
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                          (endDate.getMonth() - startDate.getMonth());
        const years = Math.floor(monthsDiff / 12);
        const months = monthsDiff % 12;
        const startStr = startDate.toLocaleDateString('en-US', options);
        const endStr = endDate.toLocaleDateString('en-US', options);

        const metaLine = document.createElement('p');
        metaLine.textContent = `${jobs[0].employmentType} | ${startStr} - ${endStr} · ${years} yrs ${months} mos`;
        textDiv.appendChild(metaLine);
      }

      topDiv.appendChild(textDiv);
      container.appendChild(topDiv);

      // ===== Extra details for all jobs =====
      const detailsDiv = document.createElement('div');
      detailsDiv.style.marginTop = '2px';
      detailsDiv.style.lineHeight = '1.3';

      jobs.forEach((job, index) => {
        const isFirstJob = index === 0;

        // Skip rendering position heading for first job (already done)
        if (!isFirstJob && job.position) {
          const posHeading = document.createElement('h4');
          posHeading.textContent = job.position;
          detailsDiv.appendChild(posHeading);

          // Position-specific duration
          const startDate = new Date(job.date.start);
          const endDate = new Date(job.date.end);
          const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                             (endDate.getMonth() - startDate.getMonth());
          const years = Math.floor(monthsDiff / 12);
          const months = monthsDiff % 12;
          const startStr = startDate.toLocaleDateString('en-US', options);
          const endStr = endDate.toLocaleDateString('en-US', options);

          const metaLine = document.createElement('p');
          metaLine.textContent = `${job.employmentType} | ${startStr} - ${endStr} · ${years} yrs ${months} mos`;
          detailsDiv.appendChild(metaLine);
        }

        // Responsibilities
        if (job.responsibilities?.length > 0) {
          const ul = document.createElement('ul');
          job.responsibilities.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
          });
          detailsDiv.appendChild(ul);
        }

        // Projects
        if (job.projects?.length > 0) {
          job.projects.forEach(project => {
            const projTitle = document.createElement('h5');
            projTitle.textContent = project.title;
            detailsDiv.appendChild(projTitle);

            if (project.description?.length > 0) {
              const ul = document.createElement('ul');
              project.description.forEach(desc => {
                const li = document.createElement('li');
                li.textContent = desc;
                ul.appendChild(li);
              });
              detailsDiv.appendChild(ul);
            }
          });
        }

        // Courses
        if (job.courses?.length > 0) {
          const cTitle = document.createElement('h5');
          cTitle.textContent = "Courses";
          detailsDiv.appendChild(cTitle);

          const ul = document.createElement('ul');
          job.courses.forEach(course => {
            const li = document.createElement('li');
            li.textContent = `${course.code} – ${course.title} (${course.term}), ${course.instructor}`;
            ul.appendChild(li);
          });
          detailsDiv.appendChild(ul);
        }

        // Supervision
        if (job.supervision?.length > 0) {
          const supTitle = document.createElement('h5');
          supTitle.textContent = "Student Supervision";
          detailsDiv.appendChild(supTitle);

          const ul = document.createElement('ul');
          job.supervision.forEach(student => {
            const li = document.createElement('li');
            li.textContent = `${student.student} (${student.year}) – ${student.project}`;
            ul.appendChild(li);
          });
          detailsDiv.appendChild(ul);
        }

        // Conferences
        if (job.conferences?.length > 0) {
          const confTitle = document.createElement('h5');
          confTitle.textContent = "Conferences & Academic Activities";
          detailsDiv.appendChild(confTitle);

          const ul = document.createElement('ul');
          job.conferences.forEach(conf => {
            const li = document.createElement('li');
            li.textContent = conf;
            ul.appendChild(li);
          });
          detailsDiv.appendChild(ul);
        }

      });

      container.appendChild(detailsDiv);
    });

  })
  .catch(error => console.error('Error loading experience:', error));