document.addEventListener('DOMContentLoaded', () => {
  fetch('assets/data/awards.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('awards');
      if (!container) return console.error('#awards not found');

      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "awards-1"; // important for generic.js toggle

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = "Awards & Achievements";

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      const ul = document.createElement('ul');
      data.sort((a,b) => new Date(b.date) - new Date(a.date));
      data.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('entry');
        const year = new Date(item.date).getFullYear();
li.innerHTML = `${item.title} - <em>${item.institution}</em>, ${year}`;        ul.appendChild(li);
      });
      content.appendChild(ul);

      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    })
    .catch(err => console.error('Awards JS error:', err));
});