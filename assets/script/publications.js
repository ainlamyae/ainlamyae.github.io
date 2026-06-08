document.addEventListener("DOMContentLoaded", function () {

  const container = document.getElementById("publications-list");
  if (!container) return;
  showSectionLoading(container);

  fetch("assets/data/publications.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load JSON file.");
      return response.json();
    })
    .then(data => {
      container.innerHTML = ''; // clear loading placeholder

      // Group publications by type
      const groups = { article: [], inproceedings: [], patent: [], thesis: [] };
      data.forEach(pub => {
        if (groups[pub.type]) groups[pub.type].push(pub);
      });

      const typePrefix = { article: "J", inproceedings: "C", patent: "P", thesis: "T" };
      const getYear = pub => pub.date ? (new Date(pub.date).getFullYear() || "") : "";

      function formatAuthors(authors) {
        if (!Array.isArray(authors) || authors.length === 0) return "";
        const formatted = authors.map(author => {
          const parts = author.split(",");
          if (parts.length === 2) {
            const last = parts[0].trim();
            const first = parts[1].trim();
            const initial = first.charAt(0).toUpperCase() + ".";
            return last === "Nasr" && first === "Ali" ? `<strong>${initial} ${last}</strong>` : `${initial} ${last}`;
          }
          return author;
        });
        if (formatted.length === 1) return formatted[0];
        if (formatted.length === 2) return formatted.join(" and ");
        return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1];
      }

      function renderGroup(title, items, typeKey, index) {
        if (!items || !items.length) return;

        const section = document.createElement("div");
        section.classList.add('dropdown-section', 'keyword-expandable');
        section.dataset.sectionId = `pub-${index}`;

        const heading = document.createElement("h3");
        heading.classList.add("dropdown-toggle");
        heading.textContent = `${title} (${items.length})`;
        section.appendChild(heading);

        const content = document.createElement("div");
        content.classList.add("dropdown-content");

        items.sort((a, b) => getYear(b) - getYear(a));

        const total = items.length;

        items.forEach((pub, idx) => {
          const number = total - idx;
          const authors = formatAuthors(pub.authors);

          let venue = "";
          if (pub.type === "article") {
            const parts = [];
            if (pub.publisher) parts.push(pub.publisher);
            if (pub.journal) parts.push(pub.journal);
            if (parts.length > 0) venue = `<span class="org"><em>${parts.join(" ")}</em></span>`;
          } else if (pub.type === "inproceedings") {
            const parts = [];
            if (pub.publisher) parts.push(pub.publisher);
            if (pub.booktitle) parts.push(pub.booktitle);
            if (parts.length > 0) venue = `<span class="org"><em>${parts.join(" ")}</em></span>`;
            if (pub.address) venue += `, ${pub.address}`;
          } else if (pub.type === "patent") {
            if (pub.publisher) venue = `<span class="org"><em>${pub.publisher}</em></span>`;
          } else if (pub.type === "thesis") {
            const degreePart = pub.degree || "";
            const publisherPart = pub.publisher ? `<em>${pub.publisher}</em>` : "";
            venue = degreePart && publisherPart ? `${degreePart}, ${publisherPart}` : (degreePart || publisherPart);
          }

          const extraParts = [];
          if (pub.volume) extraParts.push(`vol. ${pub.volume}`);
          if (pub.number) extraParts.push(`no. ${pub.number}`);
          if (pub.pages) {
            const pages = pub.pages.replace(/\s+/g, "");
            extraParts.push(pages.includes("-") ? `pp. ${pages}` : `p. ${pages}`);
          }
          const extra = extraParts.length ? ", " + extraParts.join(", ") : "";

          const link = pub.doi ? `https://doi.org/${pub.doi}` : (pub.url || "");
          const titleHTML = link
            ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${pub.title || ""}</a>`
            : (pub.title || "");

          // ===== Create entry =====
          const entryDiv = document.createElement("div");
          entryDiv.classList.add("entry");

          // ===== Wrap text + icon in a single span =====
          const fullSpan = document.createElement("span");
          fullSpan.innerHTML = `[${typePrefix[typeKey]}${number}] ${authors}, "${titleHTML}," ${venue}${extra}, <span class="year">${getYear(pub)}</span>`;

          // Add icon HTML if file exists
          if (pub.file && pub.file.trim() !== "") {
            fullSpan.innerHTML += ` <a href="#" class="media-icon" title="View PDF">📄</a>`;
          }

          entryDiv.appendChild(fullSpan);
          content.appendChild(entryDiv);

          // Add event listener to icon
          if (pub.file && pub.file.trim() !== "") {
            const fileLink = fullSpan.querySelector(".media-icon");
            fileLink.addEventListener("click", e => {
              e.preventDefault();
              openMediaModal([{ src: pub.file, caption: pub.title || "Publication" }], 0);
            });
          }
        });

        section.appendChild(content);
        container.appendChild(section);
      }

      let i = 0;
      renderGroup("Journal", groups.article, "article", i++);
      renderGroup("Conference", groups.inproceedings, "inproceedings", i++);
      renderGroup("Patent", groups.patent, "patent", i++);
      renderGroup("Thesis", groups.thesis, "thesis", i++);

    })
    .catch(error => {
      console.error("Error loading publications:", error);
      showSectionError(container, 'publications');
    });

});