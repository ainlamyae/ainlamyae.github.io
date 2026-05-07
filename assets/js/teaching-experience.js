fetch('assets/data/experience.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load experience.json');
    return response.json();
  })
  .then(data => {

    const container = document.getElementById("teaching-experience");
    if (!container) return;

    // 1️⃣ Create dropdown section
    const section = document.createElement('div');
    section.classList.add('dropdown-section');

    const heading = document.createElement('h3');
    heading.classList.add('dropdown-toggle');
    heading.textContent = "Supervision & Teaching Experience";
    section.appendChild(heading);

    const content = document.createElement('div');
    content.classList.add('dropdown-content');
    section.appendChild(content);

    const typeEmoji = {
      "Project": "⚙️",
      "Leadership": "🧭",
      "Supervision": "👥",
      "Responsibility": "🗂️",
    };

    // 2️⃣ Keep your original rendering logic, just append to `content` instead of container
    // Group all experiences by organization
    const orgMap = {};
    data.forEach(exp => {
      if (!orgMap[exp.organization]) orgMap[exp.organization] = [];
      orgMap[exp.organization].push(exp);
    });

    Object.keys(orgMap).forEach(orgName => {
      const orgExperiences = orgMap[orgName];
      const firstEntry = orgExperiences[0];

      // Collect Teaching and Supervision items
      const teachingItems = [];
      const supervisionItems = [];

      orgExperiences.forEach(exp => {
        if (exp.type === "Teaching") {
          teachingItems.push(...(exp.items || []));
        } else {
          const items = (exp.items || []).filter(i => i.type === "Supervision");
          supervisionItems.push(...items);
        }
      });

      // Skip organization if nothing to show
      if (teachingItems.length === 0 && supervisionItems.length === 0) return;

      // Create container div for this org
      const entryDiv = document.createElement('div');
      entryDiv.style.display = 'flex';
      entryDiv.style.alignItems = 'flex-start';
      entryDiv.style.marginBottom = '16px';

      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';

      // Organization heading
      const orgHeading = document.createElement('h3');
      orgHeading.textContent = orgName;
      orgHeading.style.margin = '0 0 4px 0';
      textDiv.appendChild(orgHeading);

      // Address
      const addressLine = document.createElement('p');
      addressLine.textContent = firstEntry.address;
      addressLine.style.margin = '0 0 8px 0';
      textDiv.appendChild(addressLine);

      // 1️⃣ Render all Teaching items
      teachingItems.forEach(item => {
        if (item.title) {
          const titleEl = document.createElement('p');
          const emoji = typeEmoji[item.type] || "";
          titleEl.innerHTML = `<strong>${emoji ? emoji + " " : ""}${item.title}</strong>`;
          titleEl.style.margin = '0 0 4px 0';
          textDiv.appendChild(titleEl);
        }

        if (item.description?.length) {
          const ul = document.createElement('ul');
          ul.style.margin = '0 0 8px 20px';
          ul.style.padding = '0';
          item.description.forEach(desc => {
            const li = document.createElement('li');
            li.style.margin = '0 0 2px 0';
            li.textContent = desc;
            ul.appendChild(li);
          });
          textDiv.appendChild(ul);
        }
      });

      // 2️⃣ Render all Supervision items merged into a single <ul>
      if (supervisionItems.length) {
        const headingEl = document.createElement('p');
        const emoji = typeEmoji[supervisionItems[0].type] || "";
        headingEl.innerHTML = `<strong>${emoji ? emoji + " " : ""}${supervisionItems[0].title || "Supervision"}</strong>`;
        headingEl.style.margin = '0 0 4px 0';
        textDiv.appendChild(headingEl);

        const ul = document.createElement('ul');
        ul.style.margin = '0 0 8px 20px';
        ul.style.padding = '0';

        supervisionItems.forEach(item => {
          if (item.description?.length) {
            item.description.forEach(desc => {
              const li = document.createElement('li');
              li.style.margin = '0 0 2px 0';
              li.textContent = desc;
              ul.appendChild(li);
            });
          }
        });

        textDiv.appendChild(ul);
      }

      entryDiv.appendChild(textDiv);
      content.appendChild(entryDiv); // << append to dropdown content, not container
    });

    container.appendChild(section); // finally append the single dropdown to container

  })
  .catch(error => console.error('Error loading experience:', error));