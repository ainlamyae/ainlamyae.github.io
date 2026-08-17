document.addEventListener("DOMContentLoaded", function () {
    // ==============================
    // Deep-link: expand + scroll to the title matching the URL hash
    // (titles are rendered async, so keep watching until one is found)
    // ==============================
    window.addEventListener("hashchange", revealHashTarget);
    if (!revealHashTarget()) {
        const hashObserver = new MutationObserver(() => {
            if (revealHashTarget()) hashObserver.disconnect();
        });
        hashObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => hashObserver.disconnect(), 5000);
    }

    // ==============================
    // Footer: Update year dynamically
    // ==============================
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = '© ' + new Date().getFullYear() + ' ';
    }

    // ==============================
    // Click/keyboard-to-toggle dropdown sections (with ARIA wiring)
    // ==============================
    let dropdownContentCounter = 0;

    function wireDropdownAria(section) {
        const toggle = section.querySelector(":scope > .dropdown-toggle");
        const content = section.querySelector(":scope > .dropdown-content");
        if (!toggle || !content || toggle.dataset.ariaWired)
            return;

        if (!content.id) content.id = `dropdown-content-${++dropdownContentCounter}`;

        toggle.dataset.ariaWired = "true";
        toggle.setAttribute("role", "button");
        toggle.setAttribute("tabindex", "0");
        toggle.setAttribute("aria-controls", content.id);
        toggle.setAttribute("aria-expanded", section.classList.contains("active") ? "true" : "false");
    }

    function syncDropdownAria(section) {
        const toggle = section.querySelector(":scope > .dropdown-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", section.classList.contains("active") ? "true" : "false");
    }

    function toggleDropdownSection(section) {
        section.classList.toggle("active"); // toggle show/hide with CSS
        syncDropdownAria(section);
    }

    document.querySelectorAll(".dropdown-section").forEach(wireDropdownAria);
    const dropdownAriaObserver = new MutationObserver(() => {
        document.querySelectorAll(".dropdown-section").forEach(wireDropdownAria);
    });
    dropdownAriaObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => dropdownAriaObserver.disconnect(), 5000);

    document.addEventListener("click", function (e) {
        const toggle = e.target.closest(".dropdown-toggle");
        if (!toggle)
            return;

        const section = toggle.closest(".dropdown-section");
        if (!section)
            return;

        toggleDropdownSection(section);
    });

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ")
            return;

        const toggle = e.target.closest(".dropdown-toggle");
        if (!toggle)
            return;

        const section = toggle.closest(".dropdown-section");
        if (!section)
            return;

        e.preventDefault(); // stop page scroll on Space
        toggleDropdownSection(section);
    });


    // ==============================
    // Keyword-based auto-expand dropdowns
    // Works with ?g=group query in URL
    // ==============================
    const params = new URLSearchParams(window.location.search);
    const groupQuery = params.get('k') || null; // e.g., ?k=ai → "ai"

    if (groupQuery) {
        fetch('assets/data/keywords.json')
        .then(resp => {
            if (!resp.ok)
                throw new Error('Failed to load keywords.json');
            return resp.json();
        })
        .then(keywordData => {
            const targetGroup = keywordData.find(g => g.group.toLowerCase() === groupQuery.toLowerCase());
            if (!targetGroup)
                return;

            const keywords = targetGroup.keywords || [];

            function keywordMatch(text, keyword) {
                if (!text || !keyword)
                    return false;
                const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b(?:-[\\w]+)?`, 'i');
                return regex.test(text);
            }

            function highlightKeywords(container, keywords) {
                if (!container || !keywords || !keywords.length)
                    return;

                const skipTags = ['IMG', 'EMBED', 'VIDEO', 'AUDIO', 'IFRAME'];

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
                        Array.from(node.childNodes).forEach(child => walk(child));
                    }
                }

                walk(container);
            }

            const processed = new WeakSet();

            function expandMatching() {
                document.querySelectorAll('.dropdown-section.keyword-expandable').forEach(section => {
                    if (processed.has(section))
                        return;
                    processed.add(section);

                    const toggleEl = section.querySelector('.dropdown-toggle');
                    const contentEl = section.querySelector('.dropdown-content');
                    if (!toggleEl || !contentEl)
                        return;

                    const textToSearch = toggleEl.textContent + ' ' + contentEl.textContent;
                    const matched = keywords.some(kw => keywordMatch(textToSearch, kw));

                    if (matched) {
                        section.classList.add('active');

                        // Open every ancestor dropdown so nested sections aren't hidden
                        let ancestor = section.parentElement?.closest('.dropdown-section');
                        while (ancestor) {
                            ancestor.classList.add('active');
                            ancestor = ancestor.parentElement?.closest('.dropdown-section');
                        }

                        highlightKeywords(toggleEl, keywords);
                        highlightKeywords(contentEl, keywords);

                        toggleEl.style.backgroundColor = '#fffae6';
                        setTimeout(() => toggleEl.style.backgroundColor = '', 1000);
                    }
                });
            }

            // Run immediately for any sections already in the DOM
            expandMatching();

            // Watch for sections added later by async scripts (experience, education, etc.)
            const observer = new MutationObserver(expandMatching);
            observer.observe(document.body, { childList: true, subtree: true });
            // Stop watching once all async renderers have had time to finish
            setTimeout(() => observer.disconnect(), 5000);
        })
        .catch(err => console.error('Keyword auto-expand error:', err));
    }

});

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

// ==============================
// Expand/collapse all dropdown sections
// ==============================
function setAllDropdowns(expand) {
    document.querySelectorAll(".dropdown-section").forEach(section => {
        section.classList.toggle("active", expand);
        const toggle = section.querySelector(":scope > .dropdown-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", expand ? "true" : "false");
    });
}

function toggleAllDropdowns() {
    const sections = document.querySelectorAll(".dropdown-section");
    const allExpanded = sections.length > 0 &&
        Array.from(sections).every(s => s.classList.contains("active"));
    setAllDropdowns(!allExpanded);
    return !allExpanded; // true => now expanded
}
// ==============================
// Modal setup for certificates / media
// ==============================
const modal = document.getElementById("cert-modal");
const closeBtn = document.querySelector(".cert-close");
const prevBtn = document.querySelector(".cert-prev");
const nextBtn = document.querySelector(".cert-next");

let currentMediaList = [];
let currentMediaIndex = 0;
let modalTriggerEl = null;

const modalFocusables = [closeBtn, prevBtn, nextBtn];

function closeModal() {
    modal.style.display = "none";
    if (modalTriggerEl && typeof modalTriggerEl.focus === "function") {
        modalTriggerEl.focus();
    }
    modalTriggerEl = null;
}

document.addEventListener("keydown", e => {
    if (modal.style.display !== "flex")
        return;

    if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
    }

    if (e.key === "Tab") {
        const focusable = modalFocusables.filter(el => el && el.offsetParent !== null);
        if (!focusable.length)
            return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});

// Universal media open function (image or PDF)
function openMediaModal(mediaList, index) {
    if (!mediaList || mediaList.length === 0)
        return;

    currentMediaList = mediaList;
    currentMediaIndex = index;

    if (!modalTriggerEl) modalTriggerEl = document.activeElement;

    modal.style.display = "flex";
    closeBtn.focus();

    const modalContent = document.getElementById("cert-modal-content");
    modalContent.innerHTML = ""; // clear previous

    const current = currentMediaList[currentMediaIndex];
    const src = current.src.toLowerCase();
    const isPDF = src.endsWith(".pdf");
    const isVideo = /\.(mp4|webm|ogg)$/.test(src);

    if (isPDF) {
        const embed = document.createElement("embed");
        embed.src = current.src;
        embed.type = "application/pdf";
        embed.style.width = "100%";
        embed.style.height = "100%";
        embed.style.display = "block";
        modalContent.appendChild(embed);
    } else if (isVideo) {
        const video = document.createElement("video");
        video.src = current.src;
        video.controls = true;
        video.style.maxWidth = "100%";
        video.style.maxHeight = "80vh";
        modalContent.appendChild(video);
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
    closeModal();
};
modal.onclick = e => {
    if (e.target === modal)
        closeModal();
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

// Make the <span> modal controls operable via keyboard (Enter/Space → click)
modalFocusables.forEach(el => {
    if (!el) return;
    el.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            el.click();
        }
    });
});

// ==============================
// Function to unhide media for special visitors
// ==============================
function unhideMedia() {
    if (!MEDIA_UNLOCKED) return;
    document.querySelectorAll('.media-row').forEach(row => {
        row.style.display = 'flex';
        row.style.opacity = '1';
    });
    document.querySelectorAll('.media-icon').forEach(icon => {
        icon.style.display = 'inline-block';
        icon.style.opacity = '1';
    });
}

// Make sure DOM is loaded first
document.addEventListener('DOMContentLoaded', unhideMedia);