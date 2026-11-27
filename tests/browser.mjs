import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStaticServer } from '../serve.ts';

// A dependency-free Chromium DevTools client. Screenshots are untouched browser renders.
const repository = fileURLToPath(new URL('../', import.meta.url));
const profile = mkdtempSync(join(tmpdir(), 'fieldnote-chromium-'));
const capture = process.argv.includes('--capture');
const server = createStaticServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = spawn(process.env.CHROMIUM || '/usr/bin/chromium', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
let checks = 0;
const errors = [], external = [], badResponses = [];
const check = (condition, description) => { assert.ok(condition, description); checks++; };
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Chromium did not start within 20 seconds')), 20000);
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', code => { clearTimeout(timer); reject(new Error(`Chromium exited: ${code}`)); });
    browser.stderr.on('data', bytes => {
      output += bytes;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const port = new URL(endpoint).port;
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const call = pending.get(message.id);
      if (call) { clearTimeout(call.timer); pending.delete(message.id); message.error ? call.reject(new Error(JSON.stringify(message.error))) : call.resolve(message.result); }
    } else {
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      if (message.method === 'Network.requestWillBeSent' && /^https?:/.test(message.params.request.url) && !message.params.request.url.startsWith(origin + '/')) external.push(message.params.request.url);
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) badResponses.push(message.params.response.url);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`DevTools timeout: ${method}`)); }, 12000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await evaluate(expression)) return;
      await pause(80);
    }
    throw new Error(`Page condition not met: ${expression}`);
  };
  const route = async (hash, heading) => {
    await evaluate(`location.hash=${JSON.stringify(hash)}`);
    await waitFor(`document.querySelector('h1')?.textContent.includes(${JSON.stringify(heading)})`);
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const change = (selector, value) => evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  const input = (selector, value) => evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  const noOverflow = async description => check(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), description);
  const setViewport = (width, height, mobile = false) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  const screenshot = async filename => {
    await evaluate('window.scrollTo(0,0)');
    await waitFor("!document.querySelector('#notice').classList.contains('visible')");
    await evaluate('document.fonts.ready');
    await waitFor('[...document.images].every(image => image.complete && image.naturalWidth > 0)');
    await pause(120);
    const result = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, fromSurface: true, captureBeyondViewport: false });
    const directory = join(repository, 'screenshots');
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, filename), Buffer.from(result.data, 'base64'));
    check(statSync(join(directory, filename)).size <= 262144, `${filename} fits screenshot size cap`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await setViewport(1280, 800);
  await send('Page.navigate', { url: origin + '/' });
  await waitFor("document.querySelectorAll('.metric-card').length === 4");
  await evaluate('document.fonts.ready');
  await waitFor('[...document.images].every(image => image.complete && image.naturalWidth > 0)');
  check(await evaluate("document.title.includes('Australia, in numbers')"), 'Overview title');
  await noOverflow('Desktop overview fits viewport');
  check(await evaluate("document.querySelectorAll('.australia-map a').length === 8"), 'Every state is reachable through the overview map');
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await click('[data-action="search"]');
  await input('#site-search', 'Victoria');
  check(await evaluate("document.querySelector('#search-results a').hash === '#/region/vic'"), 'Offline search finds Victoria');
  await input('#site-search', '<img src=x onerror=alert(1)>');
  check(await evaluate("document.querySelector('#search-results').textContent.includes('No matching') && !document.querySelector('#search-results img')"), 'Search does not interpret markup');
  await input('#site-search', 'inflation');
  await click('#search-results a');
  await waitFor("document.querySelector('h1')?.textContent === 'Consumer price inflation'");
  check(await evaluate("!document.querySelector('#search-dialog').open"), 'Selecting search result closes dialog');
  await click('[data-query="view:table"]');
  await waitFor("document.querySelector('table') !== null");
  check(await evaluate("document.querySelectorAll('tbody tr').length === 17"), 'Full CPI table has 17 real observations');
  await change('#chart-range', 'recent');
  await waitFor("document.querySelectorAll('tbody tr').length === 5");
  checks++;
  await change('#chart-basis', 'quarterly');
  await waitFor("document.querySelector('tbody td')?.textContent === '0.2'");
  check(await evaluate("document.querySelector('caption').textContent.includes('Quarterly change')"), 'Measure switch changes data and label');
  await evaluate("window.__csv=[]; const create=URL.createObjectURL.bind(URL); URL.createObjectURL=blob=>{window.__csv.push(blob); return create(blob)};");
  await click('[data-download="inflation"]');
  const csv = await evaluate('window.__csv.at(-1).text()');
  check(csv.includes('Quarterly change') && csv.includes('2025-01-29') && csv.split('\r\n').filter(Boolean).length === 6, 'Filtered quarterly CSV carries matching observations and release');
  await route('/explore/inflation', 'Consumer price inflation');
  await click('[data-save="inflation"]');
  check(await evaluate("JSON.parse(localStorage.getItem('fieldnote-saved')).includes('inflation')"), 'Bookmark persists locally');
  await route('/saved', 'Keep the useful things.');
  check(await evaluate("document.querySelectorAll('.indicator-card').length === 1"), 'Saved page displays bookmarked indicator');
  await click('[data-save="inflation"]');
  check(await evaluate("document.querySelector('.empty-state') !== null"), 'Removing bookmark restores empty state');
  await route('/indicators', 'Find your signal.');
  await input('#catalog-search', 'life expectancy');
  check(await evaluate("document.querySelectorAll('.indicator-card').length === 2"), 'Catalog filters by text');
  await input('#catalog-search', '');
  await change('#catalog-topic', 'work');
  check(await evaluate("document.querySelectorAll('.indicator-card').length === 3"), 'Catalog filters by topic');
  for (const [id, name] of [['inflation', 'Consumer price inflation'], ['population', 'Resident population'], ['unemployment', 'Unemployment rate'], ['participation', 'Labour force participation'], ['employment', 'Employed people'], ['life-female', 'Life expectancy'], ['life-male', 'Life expectancy'], ['migration', 'Net overseas migration']]) {
    await route(`/explore/${id}`, name);
    await noOverflow(`Indicator ${id} fits desktop`);
    check(await evaluate("document.querySelector('.source-strip').textContent.includes('Australian Bureau of Statistics')"), `${id} has visible source`);
  }
  await route('/regions', 'One country. Many stories.');
  await change('#region-metric', 'female');
  await waitFor("document.querySelector('.comparison-panel h2').textContent.includes('females')");
  check(await evaluate("document.querySelector('.region-bars').textContent.includes('85.7')"), 'Region metric changes to real life expectancy');
  await click('input[name="state"][value="wa"]');
  await waitFor("!document.querySelector('input[value=wa]').checked");
  check(await evaluate("document.querySelectorAll('.region-bars a').length === 7"), 'State inclusion changes comparison');
  await click('[data-action="reset-regions"]');
  await waitFor("document.querySelectorAll('.region-bars a').length === 8");
  checks++;
  await click('[data-action="download-regions"]');
  const regionalCsv = await evaluate('window.__csv.at(-1).text()');
  check(regionalCsv.includes('85.7') && regionalCsv.includes('https://www.abs.gov.au/') && regionalCsv.includes('2024-11-08'), 'Regional CSV exports selected measure, exact source and release');
  for (const [id, name] of [['nsw', 'New South Wales'], ['vic', 'Victoria'], ['qld', 'Queensland'], ['sa', 'South Australia'], ['wa', 'Western Australia'], ['tas', 'Tasmania'], ['nt', 'Northern Territory'], ['act', 'Australian Capital Territory']]) {
    await route(`/region/${id}`, name);
    check(await evaluate("document.querySelectorAll('.profile-numbers section').length === 4"), `${name} has four real statistics`);
  }
  for (const [path, heading] of [['/topic/people', 'People & places'], ['/topic/prices', 'Prices & economy'], ['/topic/work', 'Work & income'], ['/topic/health', 'Health & life'], ['/stories', 'A little more context.'], ['/story/inflation', 'Slower inflation.'], ['/story/population', 'What’s driving our growth?'], ['/sources', 'Trust starts with a source.'], ['/about', 'See a country more clearly.']]) {
    await route(path, heading);
    await noOverflow(`${path} fits desktop`);
  }
  await route('/does-not-exist', 'Let’s find your bearings.');
  checks++;
  if (capture) {
    await route('/overview', 'Australia, in numbers');
    await screenshot('1-overview.jpg');
    await route('/explore/inflation', 'Consumer price inflation');
    await screenshot('2-explorer.jpg');
    await route('/regions', 'One country. Many stories.');
    await screenshot('3-regions.jpg');
  }
  await setViewport(390, 844, true);
  await route('/overview', 'Australia, in numbers');
  await noOverflow('Phone overview fits viewport');
  check(await evaluate("document.querySelector('.mobile-menu').getBoundingClientRect().width > 0"), 'Phone navigation toggle is visible');
  await click('.mobile-menu');
  check(await evaluate("document.body.classList.contains('menu-open') && document.querySelector('.mobile-menu').getAttribute('aria-expanded')==='true'"), 'Phone navigation opens');
  await click('.sidebar nav a[href="#/regions"]');
  await waitFor("document.querySelector('h1').textContent.includes('One country')");
  check(await evaluate("!document.body.classList.contains('menu-open')"), 'Phone navigation closes after route');
  for (const [path, heading] of [['/regions', 'One country'], ['/explore/inflation', 'Consumer price inflation'], ['/indicators', 'Find your signal'], ['/region/act', 'Australian Capital Territory'], ['/sources', 'Trust starts'], ['/story/population', 'What’s driving'], ['/overview', 'Australia, in numbers']]) {
    await route(path, heading);
    await noOverflow(`${path} fits 390px phone`);
  }
  if (capture) await screenshot('4-phone.jpg');
  check(errors.length === 0, `No browser exceptions: ${errors.join('; ')}`);
  check(external.length === 0, `No external runtime requests: ${external.join(', ')}`);
  check(badResponses.length === 0, `No missing runtime assets: ${badResponses.join(', ')}`);
  check(await evaluate('[...document.images].every(image => image.complete && image.naturalWidth > 0)'), 'All rendered images remain visible offline');
  console.log(JSON.stringify({ passed: checks, offline: true, externalRequests: external.length, browserErrors: errors.length, screenshots: capture ? 4 : 0 }, null, 2));
} finally {
  socket?.close();
  browser.kill('SIGTERM');
  await new Promise(resolve => server.close(resolve));
  await pause(250);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
