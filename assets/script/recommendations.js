document.addEventListener('DOMContentLoaded', () => {
  fetch('assets/data/recommendations.json')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('recommendations');
      if (!container) return console.error('#recommendations not found');

      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "recommendations-1";

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = "Recommendations";

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      const ul = document.createElement('ul');

      // Sort newest first
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      data.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('entry');

        const year = new Date(item.date).getFullYear();

        li.innerHTML = `
          <a href="${item.url}" target="_blank"><strong>${item.name}</strong></a> - 
          ${item.relationship}, 
          <em>${item.organization}</em>, 
          ${year}
          <br>
          ${item.recommendation}
        `;

        ul.appendChild(li);
      });

      content.appendChild(ul);
      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    })
    .catch(err => console.error('Recommendations JS error:', err));
});