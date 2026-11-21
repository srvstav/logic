import { plates, archiveNotes } from './plates.js';
import catalog from '../assets/catalog.json';
import { button, message, setText } from './ui.js';
import { mountPhoto } from './photo.js';

const get = id => document.getElementById(id);
const view = get('view');
const poster = get('space-image');
const reticle = get('reticle');
const toolbar = get('toolbar');
const notes = get('notes');
const title = get('plate-title');
const book = get('book');
const bookToggle = get('book-toggle');
const close = get('book-close');
const allPlates = [
  ...plates,
  ...Object.keys(archiveNotes).map(id => {
    const entry = catalog.find(item => item.id === id);
    return {
      ...entry,
      kind: 'Engineering archive · Source image',
      notes: archiveNotes[id],
      credit: `${entry.author} · ${entry.license}`,
      link: 'Original source',
      mode: 'photo',
    };
  }),
];
const atlasLinks = [...get('exhibits').querySelectorAll('a')];
const archiveLinks = allPlates.slice(plates.length).map(plate => {
  const link = document.createElement('a');
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↗';
  link.href = '#' + plate.id;
  link.append(plate.title, arrow);
  get('archive-items').append(link);
  return link;
});
const tools = document.createElement('div');
tools.className = 'tools';
const navigation = document.createElement('div');
navigation.className = 'navigation';
const previous = button('←', 'Previous exhibit', () => navigate(activeIndex - 1));
const next = button('→', 'Next exhibit', () => navigate(activeIndex + 1));
const counter = document.createElement('span');
counter.className = 'readout';
navigation.append(previous, counter, next);
toolbar.append(tools, navigation);

let activeIndex = -1;
let scene;
let sceneVersion = 0;
let playing = false;
let timer;
const play = get('play');
const announcement = get('announcement');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function scheduleTour() {
  clearTimeout(timer);
  if (!playing || document.hidden) return;
  timer = setTimeout(() => {
    if (tools.contains(document.activeElement)) return scheduleTour();
    const index = activeIndex < plates.length - 1 ? activeIndex + 1 : 0;
    history.replaceState(null, '', '#' + plates[index].id);
    select(index, { announce: true });
  }, 11000);
}

function setPlaying(value) {
  playing = value;
  play.firstElementChild.textContent = value ? 'Ⅱ' : '▷';
  play.lastElementChild.textContent = value ? 'Pause tour' : 'Play tour';
  const label = value ? 'Pause guided tour' : 'Play guided tour';
  play.setAttribute('aria-label', label);
  play.title = label;
  scheduleTour();
}

function stopTour() {
  if (playing) setPlaying(false);
}

play.addEventListener('click', () => {
  if (!playing && activeIndex >= plates.length) navigate(0);
  const start = !playing;
  if (start && !book.hidden) showBook(false);
  setPlaying(start);
});
document.addEventListener('visibilitychange', scheduleTour);
reduced.addEventListener('change', event => {
  if (event.matches) stopTour();
});

function syncRoute() {
  const id = location.hash.slice(1);
  const index = allPlates.findIndex(plate => plate.id === id);
  if (index >= 0) select(index, { announce: activeIndex >= 0 });
  else if (!id || activeIndex < 0) select(0);
}

function navigate(index, fromArchive = false) {
  const nextIndex = (index + allPlates.length) % allPlates.length;
  stopTour();
  if (location.hash !== '#' + allPlates[nextIndex].id) {
    history.pushState(null, '', '#' + allPlates[nextIndex].id);
  }
  select(nextIndex, { announce: !fromArchive });
  if (fromArchive) title.focus({ preventScroll: true });
}

[...atlasLinks, ...archiveLinks].forEach((link, index) => {
  link.addEventListener('click', event => {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(index, index >= plates.length);
  });
});
window.addEventListener('hashchange', () => {
  stopTour();
  syncRoute();
});
window.addEventListener('popstate', syncRoute);

function wake() {
  document.body.dataset.awake = '';
}

function showBook(open) {
  wake();
  book.hidden = !open;
  bookToggle.setAttribute('aria-expanded', String(open));
  bookToggle.setAttribute('aria-label', open ? 'Close field book' : 'Open field book');
  if (open) {
    stopTour();
    document.body.dataset.book = '';
    close.focus();
  } else {
    delete document.body.dataset.book;
    if (!engineArea.hidden) engineButton.click();
    bookToggle.focus({ preventScroll: true });
  }
}

bookToggle.addEventListener('click', () => showBook(book.hidden));
close.addEventListener('click', () => showBook(false));
for (const type of ['pointermove', 'pointerdown', 'wheel', 'keydown']) {
  document.addEventListener(type, wake, { once: true, passive: true });
}
let swipe;
view.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.pointerType !== 'touch') return;
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
view.addEventListener('pointerup', event => {
  if (!swipe || swipe.id !== event.pointerId) return;
  const x = event.clientX - swipe.x;
  const y = event.clientY - swipe.y;
  swipe = null;
  if (Math.abs(y) > 66 && Math.abs(y) > 1.6 * Math.abs(x) && view.dataset.zoom !== 'true') {
    navigate(activeIndex - Math.sign(y));
  }
});
view.addEventListener('pointercancel', () => { swipe = null; });

let lastWheelNavigation = 0;
view.addEventListener('wheel', event => {
  if (event.ctrlKey || (!event.shiftKey && Math.abs(event.deltaX) < Math.abs(event.deltaY))) return;
  const direction = event.deltaX || event.deltaY;
  if (Math.abs(direction) < 11 || performance.now() - lastWheelNavigation < 460) return;
  lastWheelNavigation = performance.now();
  navigate(activeIndex + Math.sign(direction));
}, { passive: true });

document.addEventListener('keydown', event => {
  if (event.defaultPrevented) return;
  if (event.key === 'Escape' && !book.hidden) return showBook(false);
  if (event.target.closest?.('a, button, input, select, summary, [contenteditable]') ||
      event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.toLowerCase() === 'b') showBook(book.hidden);
  else if (event.key === 'PageDown' || event.key === 'ArrowRight') navigate(activeIndex + 1);
  else if (event.key === 'PageUp' || event.key === 'ArrowLeft') navigate(activeIndex - 1);
  else if (/^[1-4]$/.test(event.key)) navigate(Number(event.key) - 1);
  else return;
  event.preventDefault();
});

const themeModes = ['system', 'light', 'dark'];
const themeButton = get('theme');
let theme = 'system';
try {
  const stored = localStorage.getItem('logic-atlas-theme');
  if (themeModes.includes(stored)) theme = stored;
} catch {
  // The selector still works with local storage disabled.
}

function applyTheme() {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  themeButton.firstElementChild.textContent = { system: '◐', light: '☀', dark: '☾' }[theme];
  themeButton.setAttribute('aria-label', `Theme: ${theme}. Switch book theme`);
}

themeButton.addEventListener('click', () => {
  theme = themeModes[(themeModes.indexOf(theme) + 1) % themeModes.length];
  applyTheme();
  try { localStorage.setItem('logic-atlas-theme', theme); } catch { /* optional */ }
});
applyTheme();

function select(index, { announce = false } = {}) {
  if (index === activeIndex) return;
  scene?.abort();
  scene = new AbortController();
  const { signal } = scene;
  const version = ++sceneVersion;
  activeIndex = index;
  const plate = allPlates[index];

  for (const child of view.querySelectorAll('[data-figure], .view-message')) child.remove();
  view.removeAttribute('tabindex');
  view.removeAttribute('aria-label');
  delete view.dataset.zoom;
  delete view.dataset.gesture;
  delete view.dataset.inspecting;
  reticle.hidden = true;
  poster.hidden = index !== 0;
  tools.replaceChildren();
  view.dataset.mode = plate.mode;
  get('kind').textContent = plate.kind;
  title.textContent = plate.title;
  get('plate-text').textContent = plate.text || plate.notes;
  const metric = get('metric');
  metric.replaceChildren();
  metric.hidden = !plate.metric;
  if (plate.metric) {
    setText(metric, 'strong', plate.metric[0]);
    setText(metric, 'span', plate.metric[1]);
  }
  notes.replaceChildren();
  setText(notes, 'p', plate.text ? plate.notes : 'Use the magnifier to inspect the original image. Open the source for the full resolution and license.');
  const equation = get('equation');
  equation.hidden = !plate.equation;
  equation.innerHTML = plate.equation || '';
  const caption = get('caption');
  caption.replaceChildren();
  setText(caption, 'span', plate.credit);
  const creditLink = setText(caption, 'a', plate.link);
  creditLink.href = plate.source;
  const arrow = setText(creditLink, 'span', ' ↗');
  arrow.setAttribute('aria-hidden', 'true');

  counter.textContent = `${index + 1} / ${allPlates.length}`;
  [...atlasLinks, ...archiveLinks].forEach((link, linkIndex) => {
    if (linkIndex === index) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
  scheduleTour();
  if (announce) announcement.textContent = plate.title;

  function mountFigure(element) {
    element.dataset.figure = '';
    view.prepend(element);
  }

  if (plate.mode === 'photo') {
    mountPhoto({ plate, signal, view, poster, reticle, tools, stopTour, mountFigure, announcement });
    return;
  }
  const pending = message(view, 'Preparing exhibit…', true);
  async function openFigure() {
    try {
      if (plate.mode === 'newton') {
        const { mountNewton } = await import('./newton-view.js');
        if (version !== sceneVersion) return;
        pending.remove();
        mountNewton({ signal, mountFigure, view, tools, stopTour });
        return;
      }

      const module = await import('./plots.js');
      let data;
      if (plate.mode === 'graph') {
        const response = await fetch(new URL('./assets/flywire.json', import.meta.url), { signal });
        if (!response.ok) throw Error('FlyWire extract unavailable');
        data = await response.json();
      }
      if (version !== sceneVersion) return;
      pending.remove();
      if (plate.mode === 'graph') module.mountGraph({ data, mountFigure, tools, notes, view, stopTour });
      else module.mountNeuron({ signal, mountFigure, tools, view, stopTour });
    } catch {
      if (signal.aborted) return;
      pending.textContent = 'The exhibit could not load. ';
      pending.append(button('Retry', '', () => {
        pending.textContent = 'Preparing exhibit…';
        openFigure();
      }));
    }
  }
  openFigure();
}

const engineButton = get('show-engine');
const engineArea = get('engine-area');
let engineRequest = 0;
engineButton.addEventListener('click', async () => {
  const request = ++engineRequest;
  engineArea.hidden = !engineArea.hidden;
  engineButton.setAttribute('aria-expanded', String(!engineArea.hidden));
  engineButton.textContent = engineArea.hidden ? 'Engine preview' : 'Close preview';
  engineArea.replaceChildren();
  if (engineArea.hidden) return;
  const progress = setText(engineArea, 'p', 'Loading the WebGL engine…');
  progress.className = 'view-message';
  progress.setAttribute('role', 'status');
  try {
    await import('./logic.js');
    if (request !== engineRequest) return;
    engineArea.replaceChildren(document.createElement('logic-canvas'));
  } catch {
    if (request === engineRequest) progress.textContent = 'The engine could not load. Close the preview and try again.';
  }
});

for (const item of document.querySelectorAll('[data-js]')) item.hidden = false;
syncRoute();
