document.addEventListener('header:loaded', function () {

  const container = document.getElementById('wordcloud-container');
  if (!container) return console.error('Element with id "wordcloud-container" not found.');
  showSectionLoading(container);

  fetch('assets/data/wordcloud.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load wordcloud.json');
      return response.json();
    })
    .then(words => {
      container.innerHTML = '';
      if (!Array.isArray(words) || !words.length) return;

      const topWords = [...words]
        .sort((a, b) => b.weight - a.weight)
        .slice(0, WORDCLOUD_DISPLAY_LIMIT);

      renderWordCloud(container, topWords);

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => renderWordCloud(container, topWords), 250);
      });
    })
    .catch(error => {
      console.error('Error loading word cloud:', error);
      showSectionError(container, 'word cloud');
    });

});

const WORDCLOUD_DISPLAY_LIMIT = 75;
const WORDCLOUD_MIN_FONT_PX = 14;
const WORDCLOUD_MAX_FONT_PX = 48;
const WORDCLOUD_GAP_PX = 6;

function renderWordCloud(container, words) {
  container.innerHTML = '';

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  if (!containerWidth || !containerHeight) return;

  const weights = words.map(w => w.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  const sorted = [...words].sort((a, b) => b.weight - a.weight);
  const placedBoxes = [];

  sorted.forEach((word, i) => {
    const ratio = maxWeight === minWeight ? 1 : (word.weight - minWeight) / (maxWeight - minWeight);
    const fontSize = WORDCLOUD_MIN_FONT_PX + ratio * (WORDCLOUD_MAX_FONT_PX - WORDCLOUD_MIN_FONT_PX);
    const rotated = i % 5 === 0; // ~20% of words placed vertically

    const span = document.createElement('span');
    span.className = 'wordcloud-word';
    span.textContent = word.text;
    span.style.fontSize = `${fontSize}px`;
    span.style.setProperty('--wc-rotate', rotated ? '90deg' : '0deg');
    span.style.setProperty('--wc-ratio', ratio);
    span.style.visibility = 'hidden';
    container.appendChild(span);

    // The CSS rotation is already applied via the --wc-rotate custom property,
    // so getBoundingClientRect() returns the post-rotation bounding box —
    // width/height are already swapped for rotated words, no manual swap needed.
    const rect = span.getBoundingClientRect();
    const boxWidth = rect.width + WORDCLOUD_GAP_PX;
    const boxHeight = rect.height + WORDCLOUD_GAP_PX;

    const position = findSpiralPosition(
      containerWidth, containerHeight, boxWidth, boxHeight, placedBoxes
    );

    if (!position) {
      span.remove();
      return;
    }

    placedBoxes.push({ left: position.x, top: position.y, width: boxWidth, height: boxHeight });

    const offset = WORDCLOUD_GAP_PX / 2;
    if (rotated) {
      // left/top position the element's pre-rotation top-left (the
      // transform-origin); the rotated bbox extends leftward by rect.width.
      span.style.left = `${position.x + offset + rect.width}px`;
      span.style.top = `${position.y + offset}px`;
    } else {
      span.style.left = `${position.x + offset}px`;
      span.style.top = `${position.y + offset}px`;
    }
    span.style.visibility = 'visible';
  });
}

function boxesOverlap(a, b) {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

// Archimedean spiral search outward from the container center for the first
// position where a box of the given size doesn't overlap any placed box.
function findSpiralPosition(containerWidth, containerHeight, boxWidth, boxHeight, placedBoxes) {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const step = 4;
  const maxRadius = Math.sqrt(containerWidth ** 2 + containerHeight ** 2) / 2;

  for (let radius = 0; radius < maxRadius; radius += step) {
    const angleStep = radius === 0 ? Math.PI * 2 : step / radius;
    for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
      const x = centerX + radius * Math.cos(angle) - boxWidth / 2;
      const y = centerY + radius * Math.sin(angle) * 0.7 - boxHeight / 2;

      if (x < 0 || y < 0 || x + boxWidth > containerWidth || y + boxHeight > containerHeight) continue;

      const candidate = { left: x, top: y, width: boxWidth, height: boxHeight };
      if (!placedBoxes.some(box => boxesOverlap(candidate, box))) {
        return { x, y };
      }
    }
  }

  return null;
}
