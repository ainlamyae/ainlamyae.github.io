document.addEventListener("DOMContentLoaded", function () {
    // === Footer dynamic year ===
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = '© ' + new Date().getFullYear() + ' ';
    }

    // === Toggle dropdown sections on click ===
    document.addEventListener("click", function (e) {
        const toggle = e.target.closest(".dropdown-toggle");
        if (!toggle) return;

        const section = toggle.closest(".dropdown-section");
        if (!section) return;

        section.classList.toggle("active"); // toggle show/hide
    });
});

// === Future control functions (can use later) ===
function toggleDropdownById(id) {
    const section = document.querySelector(`[data-section-id="${id}"]`);
    if (section) section.classList.toggle("active");
}

function expandDropdownById(id) {
    const section = document.querySelector(`[data-section-id="${id}"]`);
    if (section) section.classList.add("active");
}

function collapseDropdownById(id) {
    const section = document.querySelector(`[data-section-id="${id}"]`);
    if (section) section.classList.remove("active");
}