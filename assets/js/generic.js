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
const modalImg = document.getElementById("cert-modal-img");
const closeBtn = document.querySelector(".cert-close");
const prevBtn = document.querySelector(".cert-prev");
const nextBtn = document.querySelector(".cert-next");

let currentMediaList = [];
let currentMediaIndex = 0;

// Universal open function for media (projects & certificates)
function openMediaModal(mediaList, index) {
  if (!mediaList || mediaList.length === 0) return;

  currentMediaList = mediaList;
  currentMediaIndex = index;

  modal.style.display = "block";
  const current = currentMediaList[currentMediaIndex];
  modalImg.src = current.src;
  modalImg.alt = current.caption || "";
  modalImg.title = current.caption || ""; // <-- add this line
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