// others.js

// Move Certifications
const certSection = document.getElementById('certifications');
const othersContainer = document.getElementById('others');
if (certSection && othersContainer) {
  // Move all child nodes of #certifications to #others
  while (certSection.firstChild) {
    othersContainer.appendChild(certSection.firstChild);
  }
}

// Move Awards
const awardsSection = document.getElementById('awards');
if (awardsSection && othersContainer) {
  while (awardsSection.firstChild) {
    othersContainer.appendChild(awardsSection.firstChild);
  }
}