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

      // Safely extract year
      const getYear = pub => pub.date ? (new Date(pub.date).getFullYear() || "") : "";

      function renderGroup(title, items, typeKey) {
        if (!items || !items.length) return;

        const h3 = document.createElement("h3");
        h3.textContent = title;
        container.appendChild(h3);

        // Sort descending by year
        items.sort((a, b) => getYear(b) - getYear(a));

        const total = items.length;

        items.forEach((pub, idx) => {
          const p = document.createElement("p");
          p.classList.add("publication");

          // Format authors: "Last, First" -> "F Last"
          let authors = "";
          
          if (Array.isArray(pub.authors)) {
            authors = pub.authors.map(author => {
          
              // Expecting format: "Last, First"
              const parts = author.split(",");
          
              if (parts.length === 2) {
                const last = parts[0].trim();
                const first = parts[1].trim();
          
                const initial = first.charAt(0).toUpperCase();
          
                // Bold your own name
                if (last === "Nasr" && first === "Ali") {
                  return `<strong>${initial} ${last}</strong>`;
                }
          
                return `${initial} ${last}`;
              }
          
              // fallback if format is different
              return author;
            }).join(", ");
          }

          // ===== VENUE & DEGREE =====
          const venueParts = [];

          if (pub.type === "article") {
            if (pub.publisher) venueParts.push(pub.publisher);
            if (pub.journal) venueParts.push(`<em>${pub.journal}</em>`);
          } else if (pub.type === "inproceedings") {
            if (pub.publisher) venueParts.push(pub.publisher);
            if (pub.booktitle) venueParts.push(`<em>${pub.booktitle}</em>`);
            if (pub.address) venueParts.push(pub.address);
          } else if (pub.type === "patent") {
            if (pub.publisher) venueParts.push(pub.publisher);
          } else if (pub.type === "thesis") {
            // For thesis, degree comes first
            if (pub.degree) venueParts.push(pub.degree);
            if (pub.publisher) venueParts.push(pub.publisher);
          }

          const venue = venueParts.join(", ");

          // Volume / number / pages
          const extraParts = [];
          if (pub.volume) extraParts.push(`Vol. ${pub.volume}`);
          if (pub.number) extraParts.push(`(${pub.number})`);
          if (pub.pages) extraParts.push(`pp. ${pub.pages}`);
          const extra = extraParts.length ? ", " + extraParts.join(", ") : "";

          // DOI or URL
          const link = pub.doi ? `https://doi.org/${pub.doi}` : (pub.url || "");
          const titleHTML = link ? `<a href="${link}" target="_blank">${pub.title || ""}</a>` : (pub.title || "");

          // Numbering descending
          const number = total - idx;

          // Final formatted line
          p.innerHTML = `[${typePrefix[typeKey]}${number}] ${authors}. "${titleHTML}". ${venue}${extra}, ${getYear(pub)}.`;

          container.appendChild(p);
        });
      }

      // Render sections
      renderGroup("Journal", groups.article, "article");
      renderGroup("Conference", groups.inproceedings, "inproceedings");
      renderGroup("Patent", groups.patent, "patent");
      renderGroup("Thesis", groups.thesis, "thesis");

    })
    .catch(error => console.error("Error loading publications:", error));

});
