fetch('assets/data/experience.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load experience.json');
    return response.json();
  })
  .then(data => {

    const container = document.getElementById('experience');
    if (!container) return;

    // Map item types to emojis
    const typeEmoji = {
      "Project": "⚙️",
      "Leadership": "🧭",
      "Supervision": "👥",
      "Conference": "🎤",
      "Course": "📖",
      "Responsibility": "🗂️",
    };

    function formatDate(dateString) {
      if (!dateString || dateString === "Present") {
        return "Present";
      }

      const date = new Date(dateString);
      return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    function calculateDuration(startDate, endDate) {
      const start = new Date(startDate);
      const end = (endDate === "Present" || !endDate)
        ? new Date()
        : new Date(endDate);

      let months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());

      const years = Math.floor(months / 12);
      months = months % 12;

      let result = '';
      if (years > 0) result += `${years} yr${years > 1 ? 's' : ''} `;
      if (months > 0) result += `${months} mo${months > 1 ? 's' : ''}`;

      return result.trim();
    }

    // Group experiences by organization
    const orgMap = {};
    data.forEach(exp => {
      if (!orgMap[exp.organization]) orgMap[exp.organization] = [];
      orgMap[exp.organization].push(exp);
    });

    // Render each organization once
    Object.keys(orgMap).forEach(orgName => {
      const orgExperiences = orgMap[orgName];

      // Use the first entry for logo and address
      const firstEntry = orgExperiences[0];

      const entryDiv = document.createElement('div');
      entryDiv.style.display = 'flex';
      entryDiv.style.alignItems = 'flex-start';
      entryDiv.style.marginBottom = '40px';

      // Logo
      if (firstEntry.logo) {
        const logoImg = document.createElement('img');
        logoImg.src = firstEntry.logo;
        logoImg.alt = orgName + " logo";
        logoImg.style.width = '80px';
        logoImg.style.marginRight = '15px';
        logoImg.style.flex = '0 0 80px';
        entryDiv.appendChild(logoImg);
      }

      // Text content
      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';

      // Organization name and address once
      const orgHeading = document.createElement('h3');
      orgHeading.textContent = orgName;
      orgHeading.style.margin = '0 0 4px 0';
      textDiv.appendChild(orgHeading);

      const addressLine = document.createElement('p');
      addressLine.textContent = firstEntry.address;
      textDiv.appendChild(addressLine);

      // Sort positions by end date descending
      orgExperiences.sort((a, b) => {

        const getEndDate = (exp) => {
          if (!exp.date.end || exp.date.end === "Present") {
            return new Date(); // treat Present as today
          }
          return new Date(exp.date.end);
        };

        return getEndDate(b) - getEndDate(a); // descending
      });

      orgExperiences.forEach(exp => {

        // Position title
        const positionHeading = document.createElement('h4');
        positionHeading.style.margin = '12px 0 4px 0';
        positionHeading.textContent = exp.position;
        textDiv.appendChild(positionHeading);

        // Employment type + date + duration on same line
        const startFormatted = formatDate(exp.date.start);
        const endFormatted = formatDate(exp.date.end);
        const duration = calculateDuration(exp.date.start, exp.date.end);

        const typeDateLine = document.createElement('p');
        typeDateLine.style.margin = '0 0 6px 0';
        typeDateLine.textContent = `${exp.employmentType} | ${startFormatted} - ${endFormatted} · ${duration}`;
        textDiv.appendChild(typeDateLine);

        // Loop over all items for this position
        exp.items.forEach(item => {

          // Optional section title with emoji
          if (item.title) {
            const titleEl = document.createElement('p');
            const emoji = typeEmoji[item.type] || "";
            titleEl.innerHTML = `<strong>${emoji ? emoji + " " : ""}${item.title}</strong>`;
            textDiv.appendChild(titleEl);
          }

          // Item description list
          if (item.description?.length) {
            const ul = document.createElement('ul');
            item.description.forEach(desc => {
              const li = document.createElement('li');
              li.textContent = desc;
              ul.appendChild(li);
            });
            textDiv.appendChild(ul);
          }

        });

      });

      entryDiv.appendChild(textDiv);
      container.appendChild(entryDiv);

    });

  })
  .catch(error => console.error('Error loading experience:', error));