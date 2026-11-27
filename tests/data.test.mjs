import test from 'node:test';
import assert from 'node:assert/strict';
import { indicators, states, topics, sources, findIndicator, csvRows, formatDate } from '../app/data.js';
import { lineChart, australiaMap, regionBars, escapeHtml } from '../app/charts.js';
import { overview, explorer, sourcebook, searchResults, regionProfile, catalog, stories, story, about } from '../app/views.js';

test('population components reconcile to the exact archived national annual growth', () => {
  assert.equal(findIndicator('population').value, 27400013);
  assert.equal(105174 + findIndicator('migration').value, 445924);
  assert.equal((340750 / 445924 * 100).toFixed(1), '76.4');
  assert.equal(states.reduce((sum, state) => sum + state.interstate, 0), 0);
  assert.ok(states.reduce((sum, state) => sum + state.population, 0) < 27400013, 'Other Territories remain outside the eight state totals');
});

test('CPI observations and underlying series preserve published definitions', () => {
  const item = findIndicator('inflation');
  assert.equal(item.series.length, 17);
  assert.equal(item.series[8].value, 7.8);
  assert.equal(item.series.at(-1).value, 2.4);
  assert.equal(item.comparison.at(-1).value, 3.2);
  assert.equal(item.quarterly.at(-1).value, 0.2);
  assert.equal((item.series.at(-2).value - item.series.at(-1).value).toFixed(1), '0.4');
});

test('every indicator has unique identity, source, definitions and valid observations', () => {
  assert.equal(new Set(indicators.map(item => item.id)).size, 8);
  for (const item of indicators) {
    assert.ok(sources[item.source]);
    for (const key of ['definition', 'caveat', 'insight', 'period', 'basis']) assert.ok(item[key].length > 5, `${item.id}: ${key}`);
    assert.ok(item.series.length > 0);
    assert.equal(new Set(item.series.map(point => point.period)).size, item.series.length);
    for (const point of item.series) assert.ok(Number.isFinite(point.value));
    if (item.comparison) assert.deepEqual(item.comparison.map(point => point.period), item.series.map(point => point.period));
  }
  assert.deepEqual(new Set(topics.flatMap(topic => topic.ids)), new Set(indicators.map(item => item.id)));
});

test('the eight state profiles preserve archived growth and health endpoints', () => {
  assert.equal(states.length, 8);
  assert.equal(states.find(state => state.id === 'wa').growth, 2.4);
  assert.equal(states.find(state => state.id === 'tas').growth, 0.3);
  assert.equal(states.find(state => state.id === 'act').male, 81.7);
  assert.equal(states.find(state => state.id === 'nt').female, 80.4);
  assert.equal(findIndicator('life-female').series[0].value, 84.3);
  assert.equal(findIndicator('life-male').series.at(-1).value, 81.1);
});

test('CSV carries observations, units, basis, release and exact source URL', () => {
  const csv = csvRows(findIndicator('population'));
  assert.match(csv, /"Annual population growth"/);
  assert.match(csv, /"Dec 2024","1.65","%","Annual change"/);
  assert.match(csv, /2025-06-19/);
  assert.match(csv, /https:\/\/www\.abs\.gov\.au/);
  assert.equal(csv.split('\r\n').filter(Boolean).length, 18);
  assert.equal(formatDate('2025-06-19'), '19 June 2025');
});

test('charts expose actual values, zero baselines, single points and regional links', () => {
  const cpi = lineChart(findIndicator('inflation'));
  assert.match(cpi, /7\.8 %/);
  assert.match(cpi, /2\.4%/);
  assert.ok(!lineChart(findIndicator('inflation'), { comparison: false }).includes('comparison-line'));
  assert.match(lineChart(findIndicator('unemployment')), /One observation/);
  assert.match(regionBars('growth'), /Bars start at zero/);
  assert.equal((australiaMap().match(/href="#\/region\//g) || []).length, 8);
  assert.ok(!regionBars('growth', ['wa']).includes('>NSW<'));
});

test('search safely treats queries as text and returns useful deep links', () => {
  assert.match(searchResults('Victoria'), /#\/region\/vic/);
  assert.match(searchResults('prices'), /Consumer price inflation/);
  assert.match(searchResults('<img onerror=alert(1)>'), /No matching statistics/);
  assert.equal(escapeHtml('<img "x">'), '&lt;img &quot;x&quot;&gt;');
});

test('all authored page families render substantive content and source context', () => {
  const pages = [overview(), catalog([]), stories(), story('inflation'), story('population'), sourcebook(), about(), ...states.map(regionProfile), ...indicators.map(item => explorer(item, new URLSearchParams(), []))];
  for (const page of pages) {
    assert.match(page, /<h1>/);
    assert.ok(page.length > 1000);
    assert.ok(!page.includes('undefined'));
    assert.ok(!page.includes('NaN'));
  }
  assert.match(explorer(findIndicator('inflation'), new URLSearchParams('view=table&range=recent'), []), /<table>/);
  assert.match(sourcebook(), /not an ABS service/);
});
