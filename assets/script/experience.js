/**
 * experience.js
 * Load experience data from JSON and render the Experience section
 * Each item title is now a dropdown that shows/hides its details
 */

fetch('assets/data/experience.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load experience.json');
    return response.json();
  })
  .then(data => {

    // ==============================
    // SECTION 1: INITIAL SETUP
    // ==============================

    // Container for all experiences
    const container = document.getElementById("experience");
    if (!container) return; // Exit if container is not found

    // Emoji mapping for item categories
    const categoryEmoji = {
      "Project": "⚙️",
      "Leadership": "🧭",
      "Service": "🗂️",
      "Teaching": "📖"
    };

    // ==============================
    // SECTION 2: GROUP EXPERIENCES BY ORGANIZATION
    // ==============================

    // Create a map where key = organization name, value = array of experiences
    const orgMap = {};
    data.forEach(exp => {
      if (!orgMap[exp.organization]) orgMap[exp.organization] = [];
      orgMap[exp.organization].push(exp);
    });

    // ==============================
    // SECTION 3: RENDER EACH ORGANIZATION
    // ==============================

    Object.keys(orgMap).forEach(orgName => {

      const orgExperiences = orgMap[orgName];

      // Sort experiences within organization by most recent end date
      orgExperiences.sort((a, b) => {
        const getEnd = e => e.date?.end ? new Date(e.date.end) : new Date();
        return getEnd(b) - getEnd(a);
      });

      const firstEntry = orgExperiences[0];

      // ===== ORGANIZATION CONTAINER =====
      const entryDiv = document.createElement('div');
      entryDiv.style.display = 'flex';
      entryDiv.style.alignItems = 'flex-start';
      entryDiv.style.marginBottom = '40px';

      // ==============================
      // SECTION 3.1: LOGO (LEFT SIDE)
      // ==============================
      if (firstEntry.logo) {
        const logoImg = document.createElement('img');
        logoImg.src = firstEntry.logo;
        logoImg.alt = orgName + " logo";
        logoImg.style.width = '80px';
        logoImg.style.marginRight = '15px';
        logoImg.style.flex = '0 0 80px';
        logoImg.style.marginTop = '2px'; // subtle top alignment tweak
        entryDiv.appendChild(logoImg);
      }

      // ==============================
      // SECTION 3.2: ORGANIZATION HEADER (RIGHT SIDE)
      // ==============================
      const textDiv = document.createElement('div');
      textDiv.style.flex = '1';

      const orgHeading = document.createElement('h3');
      orgHeading.textContent = orgName;
      orgHeading.style.marginTop = '0';
      orgHeading.style.marginBottom = '4px';
      textDiv.appendChild(orgHeading);

      if (firstEntry.address) {
        const addressLine = document.createElement('p');
        addressLine.textContent = firstEntry.address;
        textDiv.appendChild(addressLine);
      }

      // ==============================
      // SECTION 4: RENDER EACH ROLE
      // ==============================
      orgExperiences.forEach(exp => {

        // Role / position title
        const positionHeading = document.createElement('h4');
        positionHeading.textContent = exp.position;
        textDiv.appendChild(positionHeading);

        // Group / lab info (italic)
        if (exp.group) {
          const groupLine = document.createElement('p');
          groupLine.style.fontStyle = 'italic';
          groupLine.textContent = exp.group;
          textDiv.appendChild(groupLine);
        }

        // Employment type + dates + duration
        if (exp.date?.start) {
          const startFormatted = formatDate(exp.date.start);
          const endFormatted = formatDate(exp.date.end);
          const duration = calculateDuration(exp.date.start, exp.date.end);

          const metaLine = document.createElement('p');
          metaLine.textContent = `${exp.employmentType || ""} | ${startFormatted} - ${endFormatted} · ${duration}`;
          textDiv.appendChild(metaLine);
        }

        // ==============================
        // SECTION 5: RENDER EACH ITEM WITH DROPDOWN
        // ==============================
        exp.items?.forEach(item => {

        // ==============================
        // NEW: Dropdown Section Wrapper
        // ==============================
        const section = document.createElement('div');
        section.classList.add('dropdown-section', 'keyword-expandable');

        // ==============================
        // TITLE (Dropdown Toggle)
        // ==============================
        if (item.title) {
          const titleEl = document.createElement('p');
          const emoji = categoryEmoji[item.category] || "";

          titleEl.innerHTML =
            `<strong>${emoji ? emoji + " " : ""}${item.title}</strong>`;

          titleEl.classList.add('dropdown-toggle');
          titleEl.style.cursor = 'pointer';

          section.appendChild(titleEl);
        }

        // ==============================
        // CONTENT (Dropdown Body)
        // ==============================
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('dropdown-content');

        // Contributor + Date
        if (item.contributor || item.date?.start) {
          const contributorLine = document.createElement('p');

          contributorLine.style.marginTop = '-4px';
          contributorLine.style.marginBottom = '4px';
          contributorLine.style.fontSize = '0.95em';
          contributorLine.style.color = '#666';

          let contributorText = item.contributor || "";
          let dateText = "";

          if (item.date?.start) {
            const startFormatted = formatDate(item.date.start);
            const endFormatted = formatDate(item.date.end);
            const duration = calculateDuration(item.date.start, item.date.end);

            dateText = `${startFormatted} - ${endFormatted} · ${duration}`;
          }

          contributorLine.textContent =
            contributorText && dateText
              ? `${contributorText} | ${dateText}`
              : contributorText || dateText;

          contentDiv.appendChild(contributorLine);
        }

        // Description
        if (item.description?.length) {
          const ul = document.createElement('ul');

          item.description.forEach(desc => {
            const li = document.createElement('li');
            li.textContent = desc;
            ul.appendChild(li);
          });

          contentDiv.appendChild(ul);
        }

        // Media
        if (item.media?.length) {
          const mediaRow = document.createElement('div');
          mediaRow.className = 'media-row';

          item.media.forEach((media, index) => {
            if (!media.src) return;

            const img = document.createElement('img');
            img.src = media.src;
            img.alt = media.caption || "";
            img.title = media.caption || "";
            img.className = 'media-img';

            img.addEventListener("click", (e) => {
              e.preventDefault();
              if (typeof openMediaModal === "function") {
                openMediaModal(item.media, index);
              }
            });

            mediaRow.appendChild(img);
          });

          contentDiv.appendChild(mediaRow);
        }

        // ==============================
        // Assemble Section
        // ==============================
        section.appendChild(contentDiv);
        textDiv.appendChild(section);
      });
      });

      // Append organization block to main container
      entryDiv.appendChild(textDiv);
      container.appendChild(entryDiv);

    });

  })
  .catch(error => console.error('Error loading experience:', error));