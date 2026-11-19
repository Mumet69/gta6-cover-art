// Neon Cover Studio — wires the page: pick photos, arrange panels, letter the
// caption, grade it neon, export the common post sizes. Photos stay on the
// machine: everything is drawn on local canvases, nothing is uploaded.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, LAYOUTS, GRADES, SIZES, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');

const state = {
  layout: 'poster',
  grade: 'sunset',
  gradeAmount: 0.8,
  caption: 'Sunset Heist',
  sub: 'Neon Nights · 2026',
  size: 'square',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
  active: 0,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function say(msg) {
  status.textContent = msg;
}

/** Sizes the preview canvas to the chosen export aspect, capped for the screen. */
function fitPreview() {
  const size = SIZES[state.size];
  const maxSide = 880;
  const scale = Math.min(1, maxSide / Math.max(size.w, size.h));
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

function redraw() {
  fitPreview();
  drawCover(canvas, state);
  syncPanelCards();
}

/** Which panel is under a point on the canvas (canvas coordinates). */
function panelAt(cx, cy) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return 0;
}

// --- panel cards ------------------------------------------------------------
const cardsEl = document.getElementById('panels');

function syncPanelCards() {
  [...cardsEl.querySelectorAll('.panel-card')].forEach((card, i) => {
    card.classList.toggle('active', i === state.active);
    const p = state.panels[i];
    card.querySelector('.zoom').value = p.zoom;
    card.querySelector('.ox').value = p.ox;
    card.querySelector('.oy').value = p.oy;
    card.querySelector('.zoom-val').textContent = `${p.zoom.toFixed(2)}×`;
    card.querySelector('.thumb').textContent = p.img ? '✓ photo loaded' : 'no photo yet';
  });
}

function buildPanelCards() {
  cardsEl.innerHTML = '';
  state.panels.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="panel-head"><strong>Panel ${i + 1}</strong><span class="thumb">no photo yet</span></div>
      <label class="file-label">Choose photo
        <input type="file" accept="image/*" data-panel="${i}">
      </label>
      <div class="sample-row">
        <button type="button" data-sample="boulevard" data-panel="${i}">Boulevard</button>
        <button type="button" data-sample="pier" data-panel="${i}">Pier</button>
        <button type="button" data-hero="${i}">Use hero photo</button>
      </div>
      <label>Zoom <span class="zoom-val">1.00×</span>
        <input class="zoom" type="range" min="1" max="2.5" step="0.01" value="1" data-panel="${i}">
      </label>
      <label>Move left / right
        <input class="ox" type="range" min="-0.4" max="0.4" step="0.01" value="0" data-panel="${i}">
      </label>
      <label>Move up / down
        <input class="oy" type="range" min="-0.4" max="0.4" step="0.01" value="0" data-panel="${i}">
      </label>`;
    card.addEventListener('click', () => { state.active = i; syncPanelCards(); });
    cardsEl.appendChild(card);
  });

  cardsEl.addEventListener('change', async (e) => {
    const input = e.target;
    const i = Number(input.dataset.panel);
    if (input.type === 'file' && input.files[0]) {
      state.panels[i].img = await loadImage(URL.createObjectURL(input.files[0]));
      state.active = i;
      say(`Panel ${i + 1}: photo loaded — ${input.files[0].name}`);
      redraw();
    }
    if (input.classList.contains('zoom')) { state.panels[i].zoom = Number(input.value); redraw(); }
    if (input.classList.contains('ox')) { state.panels[i].ox = Number(input.value); redraw(); }
    if (input.classList.contains('oy')) { state.panels[i].oy = Number(input.value); redraw(); }
  });

  cardsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const i = Number(btn.dataset.panel ?? btn.dataset.hero);
    if (btn.dataset.sample) {
      state.panels[i].img = await loadImage(`samples/${btn.dataset.sample}.jpg`);
      state.active = i;
      say(`Panel ${i + 1}: sample “${btn.dataset.sample}” loaded`);
      redraw();
    } else if (btn.dataset.hero !== undefined) {
      const hero = state.panels[0].img;
      if (!hero) { say('Load a photo into Panel 1 first, then reuse it here.'); return; }
      state.panels[i].img = hero;
      state.active = i;
      say(`Panel ${i + 1}: using the hero photo`);
      redraw();
    }
  });
}

// --- drag to pan / wheel to zoom on the canvas ------------------------------
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  state.active = panelAt(p.x, p.y);
  drag = { x: p.x, y: p.y, ox: state.panels[state.active].ox, oy: state.panels[state.active].oy };
  canvas.setPointerCapture(e.pointerId);
  syncPanelCards();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const r = rects[state.active];
  const panel = state.panels[state.active];
  panel.ox = Math.max(-0.4, Math.min(0.4, drag.ox + (p.x - drag.x) / r.w));
  panel.oy = Math.max(-0.4, Math.min(0.4, drag.oy + (p.y - drag.y) / r.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  state.active = panelAt(p.x, p.y);
  const panel = state.panels[state.active];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom - Math.sign(e.deltaY) * 0.08));
  redraw();
}, { passive: false });

// --- option pickers ---------------------------------------------------------
function buildPicker(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [key, label] of Object.entries(options)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.classList.toggle('picked', key === current);
    b.addEventListener('click', () => {
      onPick(key);
      [...el.children].forEach((c) => c.classList.remove('picked'));
      b.classList.add('picked');
    });
    el.appendChild(b);
  }
}

buildPicker(document.getElementById('layouts'), LAYOUTS, state.layout, (k) => { state.layout = k; redraw(); });
buildPicker(document.getElementById('grades'), GRADES, state.grade, (k) => { state.grade = k; redraw(); });
buildPicker(
  document.getElementById('sizes'),
  Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, v.label])),
  state.size,
  (k) => { state.size = k; redraw(); },
);

document.getElementById('grade-amount').addEventListener('input', (e) => {
  state.gradeAmount = Number(e.target.value);
  document.getElementById('grade-amount-val').textContent = `${Math.round(state.gradeAmount * 100)}%`;
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });

// --- export -----------------------------------------------------------------
function renderOffscreen(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  return off;
}

function downloadCanvas(off, filename) {
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob.size);
    }, 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  const size = SIZES[state.size];
  const bytes = await downloadCanvas(renderOffscreen(state.size), `neon-cover-${state.size}-${size.w}x${size.h}.png`);
  say(`Saved neon-cover-${state.size}-${size.w}x${size.h}.png (${Math.round(bytes / 1024)} KB)`);
});

document.getElementById('export-all').addEventListener('click', async () => {
  say('Exporting all sizes…');
  for (const key of Object.keys(SIZES)) {
    const size = SIZES[key];
    await downloadCanvas(renderOffscreen(key), `neon-cover-${key}-${size.w}x${size.h}.png`);
    await new Promise((r) => setTimeout(r, 350));
  }
  say('Saved all 4 sizes — square, portrait, story, wide. (Your browser may ask to allow multiple downloads.)');
});

document.getElementById('load-samples').addEventListener('click', async () => {
  const [b, p] = await Promise.all([loadImage('samples/boulevard.jpg'), loadImage('samples/pier.jpg')]);
  state.panels[0].img = p;
  state.panels[1].img = b;
  state.panels[2].img = b;
  say('Samples loaded — Panel 1: pier, Panels 2–3: boulevard. Swap in your own photos anytime.');
  redraw();
});

// --- boot -------------------------------------------------------------------
buildPanelCards();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, loadImage, () => redraw());
} else {
  redraw();
}
