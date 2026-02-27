document.addEventListener("DOMContentLoaded", function () {

  fetch("assets/data/publications.json")
    .then(response => {
      if (!response.ok) throw new Error("Failed to load JSON file.");
      return response.json();
    })
    .then(data => {

      const container = document.getElementById("publications");
      if (!container) return;

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
        // more than 2 authors: separate last with ', and'
        return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1];
      }

      function renderGroup(title, items, typeKey) {
        if (!items || !items.length) return;

        const h5 = document.createElement("h5");
        h5.textContent = title;
        container.appendChild(h5);

        // Sort descending by year
        items.sort((a, b) => getYear(b) - getYear(a));

        const total = items.length;

        items.forEach((pub, idx) => {

          const entryDiv = document.createElement("div");
          entryDiv.classList.add("entry");

          // ===== AUTHORS =====
          const authors = formatAuthors(pub.authors);

          // ===== PUBLISHER + JOURNAL/BOOKTITLE =====
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
            let parts = [];
            let degreePart = "";
            let publisherPart = "";

            if (pub.degree) degreePart = pub.degree;               // keep degree plain
            if (pub.publisher) publisherPart = `<em>${pub.publisher}</em>`;  // italic university

            if (degreePart && publisherPart) {
              parts = `${degreePart}, ${publisherPart}`;
            } else if (degreePart) {
              parts = degreePart;
            } else if (publisherPart) {
              parts = publisherPart;
            }

            venue = parts;
          }

          // ===== VOLUME / NUMBER / PAGES =====
          const extraParts = [];
          if (pub.volume) extraParts.push(`vol. ${pub.volume}`);
          if (pub.number) extraParts.push(`no. ${pub.number}`);
          if (pub.pages) {
            const pages = pub.pages.replace(/\s+/g, ""); // remove spaces
            if (pages.includes("-")) {
              extraParts.push(`pp. ${pages}`);
            } else {
              extraParts.push(`p. ${pages}`);
            }
          }
          const extra = extraParts.length ? ", " + extraParts.join(", ") : "";

          // ===== TITLE =====
          const link = pub.doi ? `https://doi.org/${pub.doi}` : (pub.url || "");
          const titleHTML = link
            ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${pub.title || ""}</a>`
            : (pub.title || "");

          const number = total - idx;

          // ===== FINAL ENTRY =====
          entryDiv.innerHTML =  `[${typePrefix[typeKey]}${number}] ${authors}, "${titleHTML}," ${venue}${extra}, <span class="year">${getYear(pub)}</span>`;
          container.appendChild(entryDiv);
        });
      }

      renderGroup("Patent", groups.patent, "patent");
      renderGroup("Journal", groups.article, "article");
      renderGroup("Conference", groups.inproceedings, "inproceedings");
      renderGroup("Thesis", groups.thesis, "thesis");

    })
    .catch(error => console.error("Error loading publications:", error));

});
