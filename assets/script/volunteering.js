document.addEventListener('DOMContentLoaded', () => {
  fetch('assets/data/volunteering.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load volunteering.json');
      return res.json();
    })
    .then(data => {
      const container = document.getElementById('volunteering');
      if (!container) return console.error('#volunteering not found');

      const section = document.createElement('div');
      section.classList.add('dropdown-section');
      section.dataset.sectionId = "volunteering-1";

      const heading = document.createElement('h3');
      heading.classList.add('dropdown-toggle');
      heading.textContent = `Volunteering (${data.length})`;

      const content = document.createElement('div');
      content.classList.add('dropdown-content');

      // Group by organization
      const orgMap = {};
      data.forEach(entry => {
        if (!orgMap[entry.organization]) orgMap[entry.organization] = [];
        orgMap[entry.organization].push(entry);
      });

      // Sort each org's roles newest → oldest
      Object.values(orgMap).forEach(entries =>
        entries.sort((a, b) => {
          const end = e => e.date?.end ? new Date(e.date.end) : new Date();
          return end(b) - end(a);
        })
      );

      // Sort orgs by their most recent end date
      const sortedOrgs = Object.keys(orgMap).sort((a, b) => {
        const latest = org => {
          const e = orgMap[org][0].date?.end;
          return e ? new Date(e) : new Date();
        };
        return latest(b) - latest(a);
      });

      sortedOrgs.forEach(orgName => {
        const orgEntries = orgMap[orgName];
        const first = orgEntries[0];

        const orgBlock = document.createElement('div');
        orgBlock.style.marginBottom = '20px';

        // Line 1: org · address (subtle, secondary)
        const orgLine = document.createElement('p');
        orgLine.style.cssText = 'margin:0 0 2px; font-size:0.9em; color:#555;';
        let orgText = orgName;
        if (first.address) orgText += ` · ${first.address}`;
        orgLine.textContent = orgText;
        orgBlock.appendChild(orgLine);

        orgEntries.forEach(entry => {
          // Line 2: bold position [— group] | date range · duration
          const roleLine = document.createElement('p');
          roleLine.style.cssText = 'margin:0 0 4px;';
          const posStrong = document.createElement('strong');
          posStrong.textContent = entry.position;
          roleLine.appendChild(posStrong);
          let suffix = '';
          if (entry.group) suffix += ` — ${entry.group}`;
          if (entry.date?.start) {
            const start = formatDate(entry.date.start);
            const end   = formatDate(entry.date.end);
            const dur   = calculateDuration(entry.date.start, entry.date.end);
            suffix += ` | ${start} – ${end} · ${dur}`;
          }
          if (suffix) roleLine.appendChild(document.createTextNode(suffix));
          orgBlock.appendChild(roleLine);

          const allDescs = entry.items?.flatMap(item => item.description || []) ?? [];
          if (allDescs.length) {
            const ul = document.createElement('ul');
            allDescs.forEach(desc => {
              const li = document.createElement('li');
              li.textContent = desc;
              ul.appendChild(li);
            });
            orgBlock.appendChild(ul);
          }
        });

        content.appendChild(orgBlock);
      });

      section.appendChild(heading);
      section.appendChild(content);
      container.appendChild(section);
    })
    .catch(err => console.error('Volunteering JS error:', err));
});
