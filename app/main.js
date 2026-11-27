import { indicators, states, topics, sources, findIndicator, csvRows } from './data.js';
import { shell, overview, catalog, explorer, regions, regionProfile, sourcebook, stories, story, savedPage, about, notFound, searchResults, indicatorCards } from './views.js';
import { regionMetrics } from './charts.js';

const root = document.querySelector('#app');
let saved = [];
try { saved = JSON.parse(localStorage.getItem('fieldnote-saved') || '[]').filter(id => findIndicator(id)); } catch { saved = []; }
let currentSection = '';
let noticeTimeout;

export function readRoute() {
  const [path, search = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [section = 'overview', id = ''] = (path || 'overview').split('/');
  return { section, id, query: new URLSearchParams(search) };
}

function render({ focus = true } = {}) {
  const { section, id, query } = readRoute();
  let content;
  if (section === 'overview') content = overview();
  else if (section === 'indicators') content = catalog(saved);
  else if (section === 'topic') content = topics.some(topic => topic.id === id) ? catalog(saved, topics.find(topic => topic.id === id)) : notFound();
  else if (section === 'explore') content = findIndicator(id) ? explorer(findIndicator(id), query, saved) : notFound();
  else if (section === 'regions') content = regions(query);
  else if (section === 'region') content = states.some(state => state.id === id) ? regionProfile(states.find(state => state.id === id)) : notFound();
  else if (section === 'sources') content = sourcebook(id);
  else if (section === 'stories') content = stories();
  else if (section === 'story') content = story(id);
  else if (section === 'saved') content = savedPage(saved);
  else if (section === 'about') content = about();
  else content = notFound();
  root.innerHTML = shell(content, section === 'topic' ? id : section, saved.length);
  document.body.dataset.section = section;
  document.body.classList.remove('menu-open');
  document.title = `${document.querySelector('h1')?.textContent || 'Australia in perspective'} — Fieldnote`;
  if (focus) document.querySelector('#main').focus({ preventScroll: true });
  if (section !== currentSection || !['explore', 'regions'].includes(section)) window.scrollTo(0, 0);
  currentSection = section;
  if (section === 'sources' && id && document.querySelector(`#source-${CSS.escape(id)}`)) {
    document.querySelector(`#source-${CSS.escape(id)}`).scrollIntoView({ block: 'center' });
  }
}

function updateQuery(changes) {
  const route = readRoute();
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) route.query.delete(key); else route.query.set(key, value);
  }
  const search = route.query.toString();
  location.hash = `/${route.section}${route.id ? `/${route.id}` : ''}${search ? `?${search}` : ''}`;
}

function notify(message) {
  const notice = document.querySelector('#notice');
  notice.textContent = message;
  notice.classList.add('visible');
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => notice.classList.remove('visible'), 2800);
}

function download(name, text) {
  const blob = new Blob(['\ufeff', text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('CSV exported with source and release date.');
}

function openSearch() {
  const dialog = document.querySelector('#search-dialog');
  document.querySelector('#search-results').innerHTML = searchResults('');
  dialog.showModal();
  document.querySelector('#site-search').focus();
}

function filterCatalog() {
  const term = document.querySelector('#catalog-search').value.toLowerCase().trim();
  const topic = topics.find(item => item.id === document.querySelector('#catalog-topic').value);
  const result = indicators.filter(item => (!topic || topic.ids.includes(item.id)) && `${item.name} ${item.topic} ${item.definition}`.toLowerCase().includes(term));
  document.querySelector('#catalog-results').innerHTML = result.length ? indicatorCards(result, saved) : '<div class="panel empty-state"><h2>No indicators found.</h2><p>Try a broader search or select all topics.</p></div>';
  document.querySelector('#catalog-count').textContent = `${result.length} indicators`;
}

document.addEventListener('click', event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'search') openSearch();
  if (action === 'close-search') document.querySelector('#search-dialog').close();
  if (action === 'saved') location.hash = '/saved';
  if (action === 'menu') {
    const open = document.body.classList.toggle('menu-open');
    document.querySelector('.mobile-menu').setAttribute('aria-expanded', String(open));
  }
  if (action === 'reset-regions') updateQuery({ states: null });
  if (target.dataset.query) {
    const [key, value] = target.dataset.query.split(':');
    updateQuery({ [key]: value });
  }
  if (target.dataset.save) {
    const id = target.dataset.save;
    saved = saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id];
    let persisted = true;
    try { localStorage.setItem('fieldnote-saved', JSON.stringify(saved)); } catch { persisted = false; }
    render({ focus: false });
    notify(persisted ? saved.includes(id) ? 'Indicator saved in this browser.' : 'Indicator removed from saved.' : 'Saved for this visit. Browser storage is unavailable.');
  }
  if (target.dataset.download) {
    const item = findIndicator(target.dataset.download);
    const { query } = readRoute();
    const quarterly = query.get('basis') === 'quarterly' && item.quarterly;
    let observations = quarterly || item.series;
    if (query.get('range') === 'recent') observations = observations.slice(-5);
    const exported = quarterly ? { ...item, name: 'Quarterly CPI inflation', basis: 'Quarterly change · original' } : item;
    download(`fieldnote-${item.id}-${quarterly ? 'quarterly' : 'edition'}.csv`, csvRows(exported, observations));
  }
  if (action === 'download-regions') {
    const { query } = readRoute();
    const metric = regionMetrics[query.get('metric')] ? query.get('metric') : 'growth';
    const selection = query.has('states') ? query.get('states').split(',') : states.map(state => state.id);
    const definition = regionMetrics[metric];
    const source = sources[definition.source];
    const rows = [['state', 'measure', 'value', 'unit', 'reference_period', 'source', 'release_date'], ...states.filter(state => selection.includes(state.id)).map(state => [state.name, definition.label, state[metric], definition.unit, definition.period, source.url, source.released])];
    download(`fieldnote-states-${metric}.csv`, rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n');
  }
  if (target.matches('#search-results a')) document.querySelector('#search-dialog').close();
});

document.addEventListener('input', event => {
  if (event.target.id === 'site-search') document.querySelector('#search-results').innerHTML = searchResults(event.target.value);
  if (event.target.id === 'catalog-search') filterCatalog();
});

document.addEventListener('change', event => {
  const target = event.target;
  if (target.id === 'indicator-select') location.hash = `/explore/${target.value}`;
  if (target.id === 'catalog-topic') filterCatalog();
  if (target.id === 'chart-range') updateQuery({ range: target.value });
  if (target.id === 'chart-basis') updateQuery({ basis: target.value });
  if (target.id === 'chart-compare') updateQuery({ compare: target.checked ? 'on' : 'off' });
  if (target.id === 'region-metric') updateQuery({ metric: target.value });
  if (target.id === 'region-sort') updateQuery({ sort: target.value });
  if (target.name === 'state') updateQuery({ states: [...document.querySelectorAll('input[name="state"]:checked')].map(input => input.value).join(',') });
});

document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.matches('input, select, textarea, [contenteditable]')) {
    event.preventDefault();
    if (!document.querySelector('#search-dialog').open) openSearch();
  }
  if (event.key === 'Escape') {
    document.body.classList.remove('menu-open');
    document.querySelector('.mobile-menu')?.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('hashchange', () => render());
window.addEventListener('storage', event => {
  if (event.key === 'fieldnote-saved') {
    try { saved = JSON.parse(event.newValue || '[]').filter(id => findIndicator(id)); } catch { saved = []; }
    render({ focus: false });
  }
});
render({ focus: false });
