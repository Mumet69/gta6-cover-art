// Neon Cover Studio — cover renderer.
// Draws a multi-panel neon-sunset poster from photos + a caption, at any size.
// All art here is original: no Rockstar artwork, no trademarks, no logos.
// Pure canvas 2D, no network, no dependencies.

export const LAYOUTS = {
  poster: 'Poster',
  triptych: 'Triptych',
  stack: 'Stack',
};

export const GRADES = {
  sunset: 'Neon Sunset',
  dusk: 'Palm Dusk',
  pink: 'Hot Pink',
  gold: 'Golden Hour',
  none: 'No grade',
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  story: { w: 1080, h: 1920, label: 'Story · 1080 × 1920' },
  wide: { w: 1200, h: 630, label: 'Wide · 1200 × 630' },
};

/** Panel rectangles for a layout at W x H. Three panels, GTA poster style. */
export function panelRects(layout, W, H) {
  const landscape = W >= H;
  if (layout === 'triptych') {
    if (landscape) {
      return [
        { x: 0, y: 0, w: W / 3, h: H },
        { x: W / 3, y: 0, w: W / 3, h: H },
        { x: (2 * W) / 3, y: 0, w: W / 3, h: H },
      ];
    }
    return [
      { x: 0, y: 0, w: W, h: H / 3 },
      { x: 0, y: H / 3, w: W, h: H / 3 },
      { x: 0, y: (2 * H) / 3, w: W, h: H / 3 },
    ];
  }
  if (layout === 'stack') {
    // Hero across the top, two panels side by side below.
    return [
      { x: 0, y: 0, w: W, h: H * 0.6 },
      { x: 0, y: H * 0.6, w: W / 2, h: H * 0.4 },
      { x: W / 2, y: H * 0.6, w: W / 2, h: H * 0.4 },
    ];
  }
  // poster: hero along the long side (62%), the other two split the rest.
  if (landscape) {
    return [
      { x: 0, y: 0, w: W * 0.62, h: H },
      { x: W * 0.62, y: 0, w: W * 0.38, h: H / 2 },
      { x: W * 0.62, y: H / 2, w: W * 0.38, h: H / 2 },
    ];
  }
  return [
    { x: 0, y: 0, w: W, h: H * 0.62 },
    { x: 0, y: H * 0.62, w: W / 2, h: H * 0.38 },
    { x: W / 2, y: H * 0.62, w: W / 2, h: H * 0.38 },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with per-panel zoom + pan. */
function drawPhoto(ctx, photo, rect) {
  const img = photo.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = photo.zoom || 1;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Empty-panel placeholder: deep gradient + a plus mark + a hint. */
function drawEmptyPanel(ctx, rect, index) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#2b1740');
  g.addColorStop(1, '#12081f');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const s = Math.min(rect.w, rect.h) * 0.09;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.beginPath();
  ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy);
  ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `600 ${Math.max(11, s * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${index + 1} · ADD A PHOTO`, cx, cy + s * 2.1);
}

/** Neon-sunset grade: a warm gradient wash + vignette over the whole cover. */
function applyGrade(ctx, W, H, grade, amount) {
  if (grade === 'none' || amount <= 0) {
    // Even ungraded covers get a whisper of vignette so panels sit together.
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,4,20,0.35)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const stops = {
    sunset: [[0, 'rgba(255,120,80,0)'], [0.55, 'rgba(255,60,140,0.42)'], [1, 'rgba(255,170,60,0.5)']],
    dusk: [[0, 'rgba(80,40,160,0.3)'], [0.6, 'rgba(120,40,180,0.3)'], [1, 'rgba(0,200,180,0.34)']],
    pink: [[0, 'rgba(255,0,128,0.12)'], [0.5, 'rgba(255,0,128,0.38)'], [1, 'rgba(255,80,180,0.5)']],
    gold: [[0, 'rgba(255,200,90,0.05)'], [0.55, 'rgba(255,170,60,0.32)'], [1, 'rgba(255,120,40,0.48)']],
  }[grade] || [];
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of stops) wash.addColorStop(at, color);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = amount;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = amount * 0.55;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(12,4,24,${0.42 * amount})`);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/** Letter-spaced capitals, drawn one glyph at a time so tracking is exact. */
function drawTracked(ctx, text, cx, y, tracking) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let x = cx - total / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
  ctx.textAlign = prev;
}

/** The genre lettering: huge condensed caps, gradient fill, dark outline, hard shadow.
 * Placement is metric-based (actualBoundingBoxAscent/Descent), so the caption
 * can never be clipped at the bottom and never overlaps the small line. */
function drawCaption(ctx, W, H, caption, sub) {
  const text = (caption || '').trim().toUpperCase();
  const bandH = H * 0.22;
  const band = ctx.createLinearGradient(0, H - bandH, 0, H);
  band.addColorStop(0, 'rgba(10,4,20,0)');
  band.addColorStop(1, 'rgba(10,4,20,0.72)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H - bandH, W, bandH);

  const padBottom = H * 0.025;
  const zoneTop = H - bandH;

  // Small letter-spaced line, pinned to the top of the caption zone.
  const subText = (sub || '').trim().toUpperCase();
  let mainTop = zoneTop;
  if (subText) {
    const subSize = Math.max(12, H * 0.02);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#ff8fd1';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = subSize * 0.3;
    ctx.textAlign = 'center';
    const subBaseline = zoneTop + subSize * 1.35;
    drawTracked(ctx, subText, W / 2, subBaseline, subSize * 0.42);
    ctx.shadowBlur = 0;
    mainTop = subBaseline + subSize * 0.35;
  }

  if (!text) return;
  const family = `"Arial Black", "Arial Bold", Arial, sans-serif`;
  // Fit the caption into the remaining zone: width first, then height.
  let size = H * 0.1;
  const fit = () => {
    ctx.font = `900 ${size}px ${family}`;
    const m = ctx.measureText(text);
    const w = m.width * 0.88;
    const h = (m.actualBoundingBoxAscent || size * 0.72) + (m.actualBoundingBoxDescent || size * 0.2);
    return { w, h, descent: m.actualBoundingBoxDescent || size * 0.2 };
  };
  let f = fit();
  while ((f.w > W * 0.94 || f.h > H - padBottom - mainTop) && size > 14) {
    size -= 2;
    f = fit();
  }
  const baseline = H - padBottom - f.descent;
  const grad = ctx.createLinearGradient(0, baseline - (f.h - f.descent), 0, baseline);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd166');
  grad.addColorStop(1, '#ff4d8d');
  ctx.save();
  ctx.translate(W / 2, baseline);
  ctx.transform(0.88, 0, -0.06, 1, 0, 0); // condensed + a slight forward lean
  ctx.translate(-W / 2, -baseline);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = Math.max(2, size * 0.13);
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = size * 0.14;
  ctx.shadowOffsetY = size * 0.05;
  ctx.strokeText(text, W / 2, baseline);
  ctx.fillStyle = grad;
  ctx.fillText(text, W / 2, baseline);
  ctx.restore();
}

/**
 * Draws the whole cover onto a canvas at its own size.
 * state: { layout, grade, gradeAmount, caption, sub, panels: [{img, zoom, ox, oy}] }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // Deep dusk backdrop behind the panels.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1c0f33');
  bg.addColorStop(1, '#0d0518');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const rects = panelRects(state.layout || 'poster', W, H);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const photo = panels[i];
    if (photo && photo.img) drawPhoto(ctx, photo, rect);
    else drawEmptyPanel(ctx, rect, i);
  });

  applyGrade(ctx, W, H, state.grade || 'sunset', state.gradeAmount ?? 0.8);

  // White poster gutters between panels, then a thin frame around the cover.
  const gut = Math.max(2, Math.round(Math.min(W, H) * 0.006));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gut;
  rects.forEach((r) => ctx.strokeRect(r.x, r.y, r.w, r.h));
  ctx.lineWidth = gut * 1.5;
  ctx.strokeRect(0, 0, W, H);

  drawCaption(ctx, W, H, state.caption, state.sub);
}
