import { format, states } from './data.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function sparkline(series, color = 'currentColor') {
  if (series.length < 2) return '<span class="single-observation">ONE OBSERVATION</span>';
  const values = series.map(point => point.value);
  const low = Math.min(...values), span = Math.max(...values) - low || 1;
  const coordinates = values.map((value, index) => `${3 + index / (values.length - 1) * 103},${33 - (value - low) / span * 28}`).join(' ');
  return `<svg class="sparkline" viewBox="0 0 110 38" aria-hidden="true"><polyline points="${coordinates}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function lineChart(item, { range = 'all', comparison = true, quarterly = false, compact = false } = {}) {
  const original = quarterly && item.quarterly ? item.quarterly : item.series;
  const series = range === 'recent' ? original.slice(-5) : original;
  const other = comparison && !quarterly && item.comparison ? (range === 'recent' ? item.comparison.slice(-5) : item.comparison) : null;
  const unit = item.chartUnit || item.unit;
  const precision = unit === 'people' ? 0 : 1;
  if (series.length === 1) return `<div class="point-chart"><span class="eyebrow">${escapeHtml(series[0].period)} · VERIFIED OBSERVATION</span><strong>${format(series[0].value, precision)}<small>${unit === '%' ? '%' : unit === 'people' ? ' people' : ' years'}</small></strong><p>One observation in this edition. No historical trend is implied.</p></div>`;
  const width = 720, height = compact ? 220 : 270;
  const left = 46, right = 80, top = 22, bottom = height - 35;
  const values = [...series, ...(other || [])].map(point => point.value);
  const floor = unit === 'years' ? Math.floor(Math.min(...values) - 0.5) : Math.min(0, Math.min(...values));
  const ceiling = Math.max(floor + 1, Math.max(...values) * (unit === 'years' ? 1 : 1.01));
  const roughStep = (ceiling - floor) / 4;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10].find(value => value * power >= roughStep) * power;
  const minimum = Math.floor(floor / step) * step;
  const maximum = Math.ceil(ceiling / step) * step;
  const x = index => left + index / (series.length - 1) * (width - left - right);
  const y = value => bottom - (value - minimum) / (maximum - minimum) * (bottom - top);
  const suffix = unit === '%' ? '%' : '';
  const tickLabel = value => Math.abs(value) >= 1000 ? `${format(value / 1000, 0)}k` : format(value, Number.isInteger(value) ? 0 : step < 0.1 ? 2 : 1);
  const grid = Array.from({ length: Math.round((maximum - minimum) / step) + 1 }, (_, index) => {
    const value = minimum + step * index;
    return `<line x1="${left}" x2="${width - right + 5}" y1="${y(value)}" y2="${y(value)}" class="gridline"/><text x="${left - 12}" y="${y(value) + 4}" text-anchor="end" class="axis-text">${tickLabel(value)}${suffix}</text>`;
  }).join('');
  const labelIndices = [...new Set([0, Math.round((series.length - 1) / 4), Math.round((series.length - 1) / 2), Math.round((series.length - 1) * 3 / 4), series.length - 1])];
  const labels = labelIndices.map(index => `<text x="${x(index)}" y="${height - 9}" text-anchor="middle" class="axis-text">${escapeHtml(series[index].period)}</text>`).join('');
  const coordinates = data => data.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const area = `${left},${bottom} ${coordinates(series)} ${x(series.length - 1)},${bottom}`;
  const last = series.at(-1);
  const labelGap = other && Math.abs(y(other.at(-1).value) - y(last.value)) < 23 ? 14 : 0;
  const overlay = other ? `<polyline points="${coordinates(other)}" class="comparison-line"/><text x="${width - right + 13}" y="${y(other.at(-1).value) - labelGap + 4}" class="chart-end comparison-end">${format(other.at(-1).value, precision)}${suffix}</text>` : '';
  const dots = series.map((point, index) => `<circle tabindex="0" role="img" aria-label="${escapeHtml(point.period)}: ${format(point.value, precision)} ${unit}" cx="${x(index)}" cy="${y(point.value)}" r="${index === series.length - 1 ? 4 : 3}" class="chart-point"><title>${escapeHtml(point.period)}: ${format(point.value, precision)} ${unit}</title></circle>`).join('');
  return `<figure class="line-figure"><svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(item.chartName || item.name)}; ${escapeHtml(series[0].period)} to ${escapeHtml(last.period)}; latest ${format(last.value, precision)} ${unit}"><title>${escapeHtml(item.chartName || item.name)} · ${escapeHtml(quarterly ? 'quarterly change' : item.basis)}</title>${grid}<polygon points="${area}" class="chart-area"/>${overlay}<polyline points="${coordinates(series)}" class="primary-line"/>${dots}<text x="${width - right + 13}" y="${y(last.value) + labelGap + 4}" class="chart-end">${format(last.value, precision)}${suffix}</text>${labels}</svg><figcaption class="chart-caption">${unit === 'years' ? `Axis starts at ${minimum} years. ` : ''}${escapeHtml(quarterly ? 'Change from previous quarter, %' : item.id === 'population' ? 'Annual percentage change' : item.basis)} · ABS archived release</figcaption></figure>`;
}

const geography = {
  wa: { path: 'M58 118 73 105 84 108 96 88 112 86 120 65 143 58 152 70 166 67 166 202 129 211 110 238 88 225 83 193 66 168 61 142Z', x: 121, y: 153 },
  nt: { path: 'M167 68 182 54 199 58 204 71 225 68 237 77 228 92 236 105 235 148 167 148Z', x: 201, y: 111 },
  qld: { path: 'M236 105 251 116 261 109 269 73 278 44 286 62 284 91 300 116 310 151 325 171 324 193 292 193 281 184 236 184Z', x: 278, y: 153 },
  sa: { path: 'M167 149 235 149 235 217 221 210 215 200 208 206 196 194 181 195 167 202Z', x: 202, y: 177 },
  nsw: { path: 'M236 185 280 185 291 194 324 194 316 215 298 229 277 226 256 218 236 216Z', x: 281, y: 207 },
  vic: { path: 'M236 217 254 220 276 228 296 230 283 245 269 247 251 237 241 234Z', x: 263, y: 236 },
  tas: { path: 'M269 260 289 259 292 272 282 286 273 282Z', x: 281, y: 273 }
};
export function australiaMap(selected = '') {
  const colors = ['#e0ded2', '#d7bda6', '#cd9a7d', '#b97655', '#a74a2c'];
  const parts = states.filter(state => geography[state.id]).map(state => {
    const shape = geography[state.id];
    const color = colors[Math.min(4, Math.floor(state.growth / 2.4 * 4))];
    return `<a href="#/region/${state.id}" aria-label="${state.name}: population growth ${state.growth}%"><path d="${shape.path}" fill="${color}" class="map-state ${selected === state.id ? 'selected' : ''}"><title>${state.name}: ${state.growth}% annual growth</title></path><text x="${shape.x}" y="${shape.y}" class="map-label">${state.code}</text></a>`;
  }).join('');
  return `<svg class="australia-map" viewBox="40 34 315 265" role="img" aria-label="Schematic map of Australia. Select a state to open its statistics."><title>Annual population growth by state, December 2024. Schematic boundaries.</title>${parts}<a href="#/region/act" aria-label="Australian Capital Territory: population growth 1.4%"><circle cx="300" cy="218" r="4" class="map-act"/><path d="M304 220 328 237" class="map-callout"/><text x="332" y="244" class="map-label">ACT</text></a></svg>`;
}

export const regionMetrics = {
  growth: { label: 'Population growth', unit: '%', precision: 1, period: 'Year to Dec 2024', source: 'population' },
  population: { label: 'Resident population', unit: 'people', precision: 0, period: '31 Dec 2024 · rounded to 100', source: 'population' },
  female: { label: 'Life expectancy · females', unit: 'years', precision: 1, period: '2021–2023', source: 'health' },
  male: { label: 'Life expectancy · males', unit: 'years', precision: 1, period: '2021–2023', source: 'health' }
};

export function regionBars(metric = 'growth', selection = states.map(state => state.id), order = 'descending') {
  const definition = regionMetrics[metric] || regionMetrics.growth;
  const data = states.filter(state => selection.includes(state.id)).sort((a, b) => order === 'name' ? a.name.localeCompare(b.name) : b[metric] - a[metric]);
  const maximum = Math.max(...data.map(state => state[metric]), 1) * 1.14;
  const height = Math.max(100, data.length * 39 + 29);
  const pretty = value => `${format(value, definition.precision)}${definition.unit === '%' ? '%' : definition.unit === 'years' ? ' y' : ''}`;
  const rows = data.map((state, index) => {
    const y = index * 39 + 12;
    return `<a href="#/region/${state.id}" aria-label="${state.name}: ${pretty(state[metric])}"><text x="0" y="${y + 14}" class="bar-label">${state.code}</text><rect x="44" y="${y}" width="${state[metric] / maximum * 440}" height="23" rx="2" class="region-bar ${state.id === 'wa' ? 'accent-bar' : ''}"/><text x="${52 + state[metric] / maximum * 440}" y="${y + 16}" class="bar-value">${pretty(state[metric])}</text></a>`;
  }).join('');
  return `<svg class="region-bars" viewBox="0 0 610 ${height}" role="img" aria-label="State comparison: ${escapeHtml(definition.label)}. Bars start at zero."><title>${escapeHtml(definition.label)} · ${definition.period} · zero baseline</title>${rows}<line x1="44" x2="44" y1="7" y2="${height - 18}" class="gridline"/><text x="44" y="${height - 3}" class="axis-text">0</text></svg>`;
}
