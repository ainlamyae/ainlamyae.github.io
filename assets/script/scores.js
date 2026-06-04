document.addEventListener('DOMContentLoaded', () => {
  fetch('assets/data/scores.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load scores.json');
      return res.json();
    })
    .then(data => {
      const container = document.getElementById('scores');
      if (!container) return console.error('#scores not found');

      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "scores-1";

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = `Language Scores (${data.length})`;

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      const ul = document.createElement('ul');

      // Sort newest → oldest
      data.sort((a, b) => new Date(b.date.issued) - new Date(a.date.issued));

      data.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('entry');

        const orgStrong = document.createElement('strong');
        orgStrong.textContent = item.organization;
        li.appendChild(orgStrong);

        li.appendChild(document.createTextNode(' – '));

        const nameEm = document.createElement('em');
        nameEm.textContent = item.fullName;
        li.appendChild(nameEm);

        const year = new Date(item.date.issued).getFullYear();
        li.appendChild(document.createTextNode(`, ${year}`));

        const scoreLine = document.createElement('div');
        scoreLine.style.cssText = 'margin-top: 3px; font-size: 0.9em; color: #444;';

        const { overall, listening, reading, speaking, writing } = item.score;
        scoreLine.textContent =
          `Overall: ${overall} — L: ${listening}  R: ${reading}  S: ${speaking}  W: ${writing}`;

        li.appendChild(scoreLine);
        ul.appendChild(li);
      });

      content.appendChild(ul);
      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);

      if (typeof unhideMedia === "function") unhideMedia();
    })
    .catch(err => console.error('Scores JS error:', err));
});
