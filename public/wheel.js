// Glücksrad auf Canvas. Alle Segmente sind gleich groß, Gewichte sind nicht sichtbar.
const COLORS = ["#c0392b", "#1e8449", "#b9770e", "#1f618d", "#7d3c98", "#117a65"];

export function drawWheel(canvas, names, rotation = 0) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width, r = size / 2, seg = (2 * Math.PI) / names.length;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(r, r);
  ctx.rotate(rotation);
  names.forEach((name, i) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 6, i * seg, (i + 1) * seg);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.rotate(i * seg + seg / 2);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(14, Math.min(28, 260 / names.length + 10))}px sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(name.length > 14 ? name.slice(0, 13) + "…" : name, r - 24, 0);
    ctx.restore();
  });
  ctx.restore();
}

// Dreht das Rad so, dass Segment `index` unter dem Zeiger (oben) landet.
export function spinTo(canvas, names, index, duration = 5000) {
  const seg = (2 * Math.PI) / names.length;
  const jitter = (Math.random() * 0.7 + 0.15) * seg;           // zufällige Position im Segment
  const pointer = -Math.PI / 2;                                  // Zeiger oben
  const target = pointer - (index * seg + jitter);
  const spins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
  const end = target - spins;
  const start = 0;
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 4);
      drawWheel(canvas, names, start + (end - start) * ease);
      p < 1 ? requestAnimationFrame(frame) : resolve();
    };
    requestAnimationFrame(frame);
  });
}

// Gewichteter Zufall mit kryptografischem RNG.
export function pickWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let x = (buf[0] / 2 ** 32) * total;
  for (let i = 0; i < entries.length; i++) {
    if ((x -= entries[i].weight) < 0) return i;
  }
  return entries.length - 1;
}
