document.addEventListener("DOMContentLoaded", function () {
    // ==============================
    // Footer: Update year dynamically
    // ==============================
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = '© ' + new Date().getFullYear() + ' ';
    }

    // ==============================
    // Click-to-toggle dropdown sections
    // ==============================
    document.addEventListener("click", function (e) {
        const toggle = e.target.closest(".dropdown-toggle");
        if (!toggle)
            return;

        const section = toggle.closest(".dropdown-section");
        if (!section)
            return;

        section.classList.toggle("active"); // toggle show/hide with CSS
    });
    // ==============================
    // Keyword-based auto-expand dropdowns
    // Works with ?g=group query in URL
    // ==============================
    const urlParams = new URLSearchParams(window.location.search);
    const groupQuery = urlParams.get('g'); // e.g., ?g=ai

    if (groupQuery) {
        // Delay to ensure dynamically loaded sections exist
        setTimeout(() => {
            fetch('assets/data/keyword.json')
            .then(resp => {
                if (!resp.ok)
                    throw new Error('Failed to load keyword.json');
                return resp.json();
            })
            .then(keywordData => {
                const targetGroup = keywordData.find(g => g.group.toLowerCase() === groupQuery.toLowerCase());
                if (!targetGroup)
                    return;

                const keywords = targetGroup.keywords || [];
                let delay = 0;

                function keywordMatch(text, keyword) {
                    if (!text || !keyword)
                        return false;
                    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escaped}\\b(?:-[\\w]+)?`, 'i');
                    return regex.test(text);
                }

                // ==============================
                // Highlight matched keywords in text
                // ==============================
                function highlightKeywords(container, keywords) {
                    if (!container || !keywords || !keywords.length)
                        return;

                    const skipTags = ['IMG', 'EMBED', 'VIDEO', 'AUDIO', 'IFRAME']; // tags to ignore

                    // Recursive function to walk text nodes
                    function walk(node) {
                        if (!node)
                            return;

                        if (node.nodeType === Node.TEXT_NODE) {
                            let text = node.nodeValue;
                            keywords.forEach(keyword => {
                                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(`\\b(${escaped})(?:-[\\w]+)?\\b`, 'gi');
                                text = text.replace(regex, match => `<span class="keyword-highlight">${match}</span>`);
                            });

                            if (text !== node.nodeValue) {
                                const span = document.createElement('span');
                                span.innerHTML = text;
                                node.parentNode.replaceChild(span, node);
                            }
                        } else if (node.nodeType === Node.ELEMENT_NODE && !skipTags.includes(node.tagName)) {
                            // walk children
                            Array.from(node.childNodes).forEach(child => walk(child));
                        }
                    }

                    walk(container);
                }

                // Loop all dropdown sections
                document.querySelectorAll('.dropdown-section.keyword-expandable').forEach(section => {
                    const toggleEl = section.querySelector('.dropdown-toggle');
                    const contentEl = section.querySelector('.dropdown-content');
                    if (!toggleEl || !contentEl)
                        return;

                    const textToSearch = (toggleEl.textContent + ' ' + contentEl.textContent);

                    const matched = keywords.some(kw => keywordMatch(textToSearch, kw));
                    if (matched) {
                        setTimeout(() => {
                            section.classList.add('active');

                            // Highlight keywords safely, skip captions/media
                            highlightKeywords(toggleEl, keywords);
                            highlightKeywords(contentEl, keywords);

                            toggleEl.style.backgroundColor = '#fffae6';
                            setTimeout(() => toggleEl.style.backgroundColor = '', 1000);
                        }, delay);
                        delay += 100; // stagger effect
                    }

                });
            })
            .catch(err => console.error('Keyword auto-expand error:', err));
        }, 100); // small delay to wait for other JS sections to render
    }

    // ==============================
    // Control functions for dropdowns by ID
    // ==============================
    function toggleDropdownById(id) {
        const section = document.querySelector(`[data-section-id="${id}"]`);
        if (section)
            section.classList.toggle("active");
    }

    function expandDropdownById(id) {
        const section = document.querySelector(`[data-section-id="${id}"]`);
        if (section)
            section.classList.add("active");
    }

    function collapseDropdownById(id) {
        const section = document.querySelector(`[data-section-id="${id}"]`);
        if (section)
            section.classList.remove("active");
    }
});
// ==============================
// Modal setup for certificates / media
// ==============================
const modal = document.getElementById("cert-modal");
const closeBtn = document.querySelector(".cert-close");
const prevBtn = document.querySelector(".cert-prev");
const nextBtn = document.querySelector(".cert-next");

let currentMediaList = [];
let currentMediaIndex = 0;

// Universal media open function (image or PDF)
function openMediaModal(mediaList, index) {
    if (!mediaList || mediaList.length === 0)
        return;

    currentMediaList = mediaList;
    currentMediaIndex = index;

    modal.style.display = "block";

    const modalContent = document.getElementById("cert-modal-content");
    modalContent.innerHTML = ""; // clear previous

    const current = currentMediaList[currentMediaIndex];
    const isPDF = current.src.toLowerCase().endsWith(".pdf");

    if (isPDF) {
        const embed = document.createElement("embed");
        embed.src = current.src;
        embed.type = "application/pdf";
        embed.style.width = "100%";
        embed.style.height = "100%";
        embed.style.display = "block";
        modalContent.appendChild(embed);
    } else {
        const img = document.createElement("img");
        img.src = current.src;
        img.alt = current.caption || "";
        img.title = current.caption || "";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "80vh";
        modalContent.appendChild(img);
    }
}

// Modal close
closeBtn.onclick = () => {
    modal.style.display = "none";
};
modal.onclick = e => {
    if (e.target === modal)
        modal.style.display = "none";
};

// Navigate media
prevBtn.addEventListener("click", () => {
    if (!currentMediaList.length)
        return;
    currentMediaIndex = (currentMediaIndex - 1 + currentMediaList.length) % currentMediaList.length;
    openMediaModal(currentMediaList, currentMediaIndex);
});
nextBtn.addEventListener("click", () => {
    if (!currentMediaList.length)
        return;
    currentMediaIndex = (currentMediaIndex + 1) % currentMediaList.length;
    openMediaModal(currentMediaList, currentMediaIndex);
});