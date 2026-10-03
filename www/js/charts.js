// NrXFitz — tiny SVG charts
const W = 320, H = 170, PAD = { l: 34, r: 10, t: 12, b: 24 };

function niceTicks(min, max, n = 4, int = false) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, step0 = Math.max(span / n, int ? 1 : 0);
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = []; for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}
const fmt = v => Math.abs(v) >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : (+v.toFixed(1)).toString();

// points: [{label, y}]
export function lineChart(points, { color = 'var(--accent)', area = true } = {}) {
  if (!points.length) return '';
  const ys = points.map(p => p.y);
  const { lo, hi, ticks } = niceTicks(Math.min(...ys), Math.max(...ys));
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const x = i => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = v => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const grid = ticks.map(t => `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-width="1"/><text x="${PAD.l - 6}" y="${y(t) + 3}" text-anchor="end">${fmt(t)}</text>`).join('');
  const every = Math.ceil(points.length / 5);
  const labels = points.map((p, i) => (i % every === 0 || i === points.length - 1) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${points.length > 1 && i === points.length - 1 ? 'end' : i === 0 && points.length > 1 ? 'start' : 'middle'}">${p.label}</text>` : '').join('');
  const areaPath = area && points.length > 1 ? `<path d="${d}L${x(points.length - 1)},${PAD.t + ih}L${x(0)},${PAD.t + ih}Z" fill="url(#g1)"/>` : '';
  const dots = points.length <= 24 ? points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="3" fill="var(--bg)" stroke="${color}" stroke-width="2"/>`).join('') : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C8F135" stop-opacity=".28"/><stop offset="1" stop-color="#C8F135" stop-opacity="0"/></linearGradient></defs>${grid}${areaPath}<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
}

export function barChart(points, { color = 'var(--accent)', highlightLast = true } = {}) {
  if (!points.length) return '';
  const max = Math.max(1, ...points.map(p => p.y));
  const { hi, ticks } = niceTicks(0, max, 4, points.every(p => Number.isInteger(p.y)));
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const bw = iw / points.length;
  const y = v => PAD.t + ih - (v / (hi || 1)) * ih;
  const grid = ticks.map(t => `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${PAD.l - 6}" y="${y(t) + 3}" text-anchor="end">${fmt(t)}</text>`).join('');
  const bars = points.map((p, i) => {
    const h = Math.max(p.y ? 2 : 0, PAD.t + ih - y(p.y));
    const fill = highlightLast && i === points.length - 1 ? color : 'var(--surface-3)';
    return `<rect x="${PAD.l + i * bw + bw * 0.18}" y="${PAD.t + ih - h}" width="${bw * 0.64}" height="${h}" rx="3" fill="${fill}"/><text x="${PAD.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${p.label}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${grid}${bars}</svg>`;
}
