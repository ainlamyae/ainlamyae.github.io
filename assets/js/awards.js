document.addEventListener('DOMContentLoaded', () => {
  fetch('assets/data/awards.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('awards');
      if (!container) return console.error('#awards not found');

      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "awards-1";

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = "Awards";

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      const ul = document.createElement('ul');

      // Sort newest → oldest
      data.sort((a,b) => new Date(b.date) - new Date(a.date));

      data.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('entry');

        const year = new Date(item.date).getFullYear();

        // Award title (hyperlink if url exists)
        if (item.url && item.url.trim() !== "") {
          const titleLink = document.createElement('a');
          titleLink.href = item.url;
          titleLink.textContent = item.title;
          titleLink.target = "_blank"; // open in new tab
          titleLink.rel = "noopener noreferrer";
          li.appendChild(titleLink);
          li.appendChild(document.createTextNode(" - "));
        } else {
          const titleText = document.createTextNode(`${item.title} - `);
          li.appendChild(titleText);
        }

        // Institution
        const inst = document.createElement('em');
        inst.textContent = item.institution;
        li.appendChild(inst);

        const yearText = document.createTextNode(`, ${year}`);
        li.appendChild(yearText);

        // 📜 Award file icon (same logic as certifications)
        if (item.file && item.file.trim() !== "") {
          const fileLink = document.createElement('a');
          fileLink.href = "#";
          fileLink.textContent = " 🏆";
          fileLink.title = "View Award";

          fileLink.addEventListener("click", (e) => {
            e.preventDefault();
            // Wrap the single award file in a mediaList
            openMediaModal([{ src: item.file, caption: item.title }], 0);
          });

          li.appendChild(fileLink);
        }

        ul.appendChild(li);
      });

      content.appendChild(ul);

      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    })
    .catch(err => console.error('Awards JS error:', err));
});