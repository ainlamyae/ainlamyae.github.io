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

// === Modal setup ===
const modal = document.getElementById("cert-modal");
const closeBtn = document.querySelector(".cert-close");
const prevBtn = document.querySelector(".cert-prev");
const nextBtn = document.querySelector(".cert-next");

let currentMediaList = [];
let currentMediaIndex = 0;

// Universal open function for media (image or pdf)
function openMediaModal(mediaList, index) {
  if (!mediaList || mediaList.length === 0) return;

  currentMediaList = mediaList;
  currentMediaIndex = index;

  modal.style.display = "block";

  const modalContent = document.getElementById("cert-modal-content");
  modalContent.innerHTML = ""; // clear previous content

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

// Close modal
closeBtn.onclick = function () {
  modal.style.display = "none";
}

modal.onclick = function (e) {
  if (e.target === modal) {
    modal.style.display = "none";
  }
}

// Navigate media
prevBtn.addEventListener("click", () => {
  if (currentMediaList.length === 0) return;

  currentMediaIndex =
    (currentMediaIndex - 1 + currentMediaList.length) % currentMediaList.length;

  openMediaModal(currentMediaList, currentMediaIndex);
});

nextBtn.addEventListener("click", () => {
  if (currentMediaList.length === 0) return;

  currentMediaIndex =
    (currentMediaIndex + 1) % currentMediaList.length;

  openMediaModal(currentMediaList, currentMediaIndex);
});