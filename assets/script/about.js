document.addEventListener('DOMContentLoaded', function () {

  const container = document.getElementById('about-content');
  if (!container) return console.error('Element with id "about-content" not found.');
  showSectionLoading(container);

  fetch('assets/data/about.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load about.json');
      return response.json();
    })
    .then(data => {
      container.innerHTML = ''; // clear loading placeholder

      if (data.summary) {
        const summary = document.createElement('p');
        summary.textContent = data.summary;
        container.appendChild(summary);
      }

      (data.groups || []).forEach(group => {
        const heading = document.createElement('h4');
        heading.textContent = group.title;
        container.appendChild(heading);

        const list = document.createElement('ul');
        group.items.forEach(item => {
          const li = document.createElement('li');

          if (group.style === 'tag') {
            const tag = document.createElement('span');
            tag.classList.add('tag');

            const strong = document.createElement('strong');
            strong.textContent = `${item.label}:`;
            tag.appendChild(strong);
            tag.appendChild(document.createTextNode(` ${item.text}`));

            li.appendChild(tag);
          } else {
            li.textContent = item;
          }

          list.appendChild(li);
        });
        container.appendChild(list);
      });
    })
    .catch(error => {
      console.error('Error loading about:', error);
      showSectionError(container, 'about');
    });

});
