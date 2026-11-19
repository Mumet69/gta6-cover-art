// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the
// viewport's aspect; ?shot=editor shows the full page with photos loaded.
// `photo`, `photo2`, `photo3` pick samples (samples/<name>.jpg); `caption`,
// `layout`, `grade`, `size` set the rest. window.__shotReady is set once painted.
export async function runShot(shot, query, state, loadImage, redraw) {
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2') ?? 'boulevard';
  const photo3 = query.get('photo3') ?? 'boulevard';
  state.layout = query.get('layout') ?? 'poster';
  state.grade = query.get('grade') ?? 'sunset';
  state.caption = query.get('caption') ?? 'Sunset Heist';
  state.sub = query.get('sub') ?? 'Neon Nights · 2026';
  const [a, b, c] = await Promise.all([
    loadImage(`samples/${photo}.jpg`),
    loadImage(`samples/${photo2}.jpg`),
    loadImage(`samples/${photo3}.jpg`),
  ]);
  state.panels[0].img = a;
  state.panels[1].img = b;
  state.panels[2].img = c;
  // Optional per-panel framing: ox/oy/zoom (and ox2/ox3, oy2/oy3, zoom2/zoom3).
  const num = (key, fallback) => {
    const v = query.get(key);
    return v === null ? fallback : Number(v);
  };
  state.panels[0].ox = num('ox', 0);
  state.panels[0].oy = num('oy', 0);
  state.panels[0].zoom = num('zoom', 1);
  state.panels[1].ox = num('ox2', 0);
  state.panels[1].oy = num('oy2', 0);
  state.panels[1].zoom = num('zoom2', 1);
  state.panels[2].ox = num('ox3', 0);
  state.panels[2].oy = num('oy3', 0);
  state.panels[2].zoom = num('zoom3', 1);

  const captionInput = document.getElementById('caption');
  const subInput = document.getElementById('sub');
  if (captionInput) captionInput.value = state.caption;
  if (subInput) subInput.value = state.sub;

  if (shot === 'cover') {
    // Cover alone: the canvas fills the viewport at the viewport's own size,
    // so the shot shows the exported art exactly as it would be shared.
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const { drawCover } = await import('./cover.js');
    drawCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
