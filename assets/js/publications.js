document.addEventListener("DOMContentLoaded", function () {

  // Updated path for new folder structure
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
      data.forEach(pub => { if (groups[pub.type]) groups[pub.type].push(pub); });

      const typePrefix = { article: "J", inproceedings: "C", patent: "P", thesis: "T" };

      // Helper: get year safely
      const getYear = pub => pub.date ? (new Date(pub.date).getFullYear() || "") : "";

      function renderGroup(title, items, typeKey) {
        if (!items || !items.length) return;

        const h3 = document.createElement("h3");
        h3.textContent = title;
        container.appendChild(h3);

        // Sort descending by year
        items.sort((a,b)=> getYear(b)-getYear(a));

        const total = items.length;

        items.forEach((pub, idx) => {
          const div = document.createElement("div");
          div.classList.add("publication");

          // Authors bold "Nasr, Ali"
          let authors = Array.isArray(pub.authors) ? pub.authors.join(", ") : "";
          authors = authors.replace(/Nasr, Ali/g, "<strong>Nasr, Ali</strong>");

          // Venue
          let venue = "";
          if (pub.type === "article") {
            venue = pub.journal ? `<em>${pub.journal}</em>` : "";
          } else if (pub.type === "inproceedings") {
            venue = pub.booktitle ? `<em>${pub.booktitle}</em>` : "";
            if (pub.address) {
              venue += `, ${pub.address}`;
            }
          } else if (pub.type === "patent" || pub.type === "thesis") {
            venue = pub.journal || "";
          }

          // Link for title
          const link = pub.doi ? `https://doi.org/${pub.doi}` : (pub.url || "");
          const titleHTML = link ? `<a href="${link}" target="_blank">${pub.title || ""}</a>` : (pub.title || "");

          // Optional volume/number/pages
          const extra = `${pub.volume ? `, Vol. ${pub.volume}` : ""}${pub.number ? `(${pub.number})` : ""}${pub.pages ? `, pp. ${pub.pages}` : ""}`;

          // Numbering: total down to 1
          const number = total - idx;

          // One-line format with prefix
          div.innerHTML = `[${typePrefix[typeKey]}${number}] ${authors}. "${titleHTML}". ${venue}${extra}, ${getYear(pub)}.`;

          container.appendChild(div);
        });
      }

      // Render all groups
      renderGroup("Journal", groups.article, "article");
      renderGroup("Conference", groups.inproceedings, "inproceedings");
      renderGroup("Patent", groups.patent, "patent");
      renderGroup("Thesis", groups.thesis, "thesis");

    })
    .catch(error => console.error("Error loading publications:", error));

});