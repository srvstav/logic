import { button, message, readout } from './ui.js';

let detailImage;

export function mountPhoto({ plate, signal, view, poster, reticle, tools, stopTour, mountFigure, announcement }) {
  const image = plate.id === 'space' ? poster : new Image(plate.width, plate.height);
  const state = readout();
  let zoom = 1;
  let x = 0.58;
  let y = 0.49;
  let dx = 0;
  let dy = 0;
  let gesture;
  let frame = 0;
  let activePoint = false;
  let pointerX = 0;
  let pointerY = 0;
  let compare = false;
  let alternateReady = false;
  let alternateLoading = false;
  let lens;
  let alternate;
  let bandButton;
  let size = { width: view.clientWidth, height: view.clientHeight };
  image.draggable = false;
  if (image === poster) {
    lens = document.createElement('div');
    lens.className = 'spectral-lens';
    lens.hidden = true;
    lens.setAttribute('aria-hidden', 'true');
    alternate = new Image(1440, 1440);
    alternate.alt = '';
    lens.append(alternate);
    mountFigure(lens);
    view.append(lens);
    bandButton = button('Compare bands', 'Show the full 17.1 nanometer image', () => toggleBand());
    bandButton.setAttribute('aria-pressed', 'false');
  } else {
    image.dataset.archive = '';
    image.alt = plate.title;
    const waiting = message(view, 'Loading image…', true);
    image.addEventListener('load', () => waiting.remove(), { signal, once: true });
    image.addEventListener('error', () => {
      waiting.textContent = 'The image could not load. Open the original source in the field book.';
    }, { signal, once: true });
    mountFigure(image);
    image.src = './assets/' + plate.file;
  }

  function draw() {
    const { width, height } = size;
    dx = Math.max(-(1 - x) * (zoom - 1) * width, Math.min(x * (zoom - 1) * width, dx));
    dy = Math.max(-(1 - y) * (zoom - 1) * height, Math.min(y * (zoom - 1) * height, dy));
    view.style.setProperty('--x', (x * 100) + '%');
    view.style.setProperty('--y', (y * 100) + '%');
    view.style.setProperty('--dx', dx + 'px');
    view.style.setProperty('--dy', dy + 'px');
    view.style.setProperty('--zoom', zoom);
    reticle.style.transform = 'translate(' + pointerX + 'px, ' + pointerY + 'px)';
    reticle.hidden = !activePoint || compare;
    view.dataset.zoom = String(zoom > 1);
    toggleButton.setAttribute('aria-pressed', String(zoom > 1));
    state.textContent = zoom + '×' + (bandButton ? (compare ? ' · 17.1 nm' : ' · 30.4 nm') : '');
    if (lens) {
      lens.hidden = !alternateReady || (!compare && !activePoint);
      lens.classList.toggle('full-band', compare);
      lens.style.setProperty('--lens-x', pointerX + 'px');
      lens.style.setProperty('--lens-y', pointerY + 'px');
      bandButton.setAttribute('aria-pressed', String(compare));
      if (alternateReady) bandButton.removeAttribute('aria-busy');
    }
  }

  function queueDraw() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  }

  function prepareAlternate() {
    if (!alternate || alternateLoading || alternateReady) return;
    alternateLoading = true;
    alternate.src = './assets/sun-171.webp';
    alternate.decode().then(() => {
      if (signal.aborted) return;
      alternateReady = true;
      queueDraw();
    }, () => {
      if (signal.aborted) return;
      alternateLoading = false;
      compare = false;
      bandButton.removeAttribute('aria-busy');
      draw();
      announcement.textContent = 'The 17.1 nanometer image could not load.';
    });
  }

  function toggleBand() {
    stopTour();
    compare = !compare;
    if (compare && !alternateReady) {
      bandButton.setAttribute('aria-busy', 'true');
      prepareAlternate();
    }
    draw();
  }

  function setZoom(value) {
    stopTour();
    zoom = value;
    if (zoom === 1) dx = dy = 0;
    draw();
    if (zoom > 1 && image === poster && poster.hasAttribute('srcset')) {
      detailImage ||= new Promise(resolve => {
        const detail = new Image();
        detail.src = './assets/sun-304-detail.webp';
        detail.decode().then(() => resolve(detail.src), () => resolve(null));
      });
      detailImage.then(url => {
        if (!signal.aborted && url) {
          poster.src = url;
          poster.removeAttribute('srcset');
        }
      });
    }
  }

  function aim(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    activePoint = true;
    prepareAlternate();
    queueDraw();
  }

  function aimZoom(event) {
    x = Math.max(.04, Math.min(.96, event.clientX / size.width));
    y = Math.max(.04, Math.min(.96, event.clientY / size.height));
  }

  const toggleButton = button('Magnify', 'Magnify image', () => setZoom(zoom > 1 ? 1 : 2.15));
  tools.append(toggleButton);
  if (bandButton) tools.append(bandButton);
  tools.append(state);
  draw();

  const resize = new ResizeObserver(([entry]) => {
    size = entry.contentRect;
    queueDraw();
  });
  resize.observe(view);
  signal.addEventListener('abort', () => {
    resize.disconnect();
    cancelAnimationFrame(frame);
    if (gesture && view.hasPointerCapture(gesture.id)) view.releasePointerCapture(gesture.id);
  }, { once: true });
  view.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest('.view-message')) return;
    stopTour();
    if (zoom === 1 && event.pointerType === 'touch') aim(event);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dx, dy };
    view.setPointerCapture(event.pointerId);
  }, { signal });
  view.addEventListener('pointermove', event => {
    if (gesture?.id === event.pointerId && zoom > 1) {
      view.dataset.gesture = '';
      dx = gesture.dx + event.clientX - gesture.x;
      dy = gesture.dy + event.clientY - gesture.y;
      activePoint = false;
      queueDraw();
    } else if (event.pointerType === 'mouse' || gesture?.id === event.pointerId) {
      aim(event);
    }
  }, { signal });
  view.addEventListener('pointerleave', () => {
    if (!gesture) {
      activePoint = false;
      queueDraw();
    }
  }, { signal });

  function finish(event) {
    if (gesture?.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
    gesture = null;
    delete view.dataset.gesture;
    if (event.type !== 'pointerup' || distance > 8) return;
    if (zoom === 1) aimZoom(event);
    activePoint = false;
    setZoom(zoom > 1 ? 1 : 2.15);
  }
  view.addEventListener('pointerup', finish, { signal });
  view.addEventListener('pointercancel', finish, { signal });
  view.addEventListener('wheel', event => {
    if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (event.deltaY < -11 && zoom === 1) {
      aimZoom(event);
      activePoint = false;
      setZoom(2.15);
    } else if (event.deltaY > 11 && zoom > 1) setZoom(1);
  }, { signal, passive: true });
  view.tabIndex = 0;
  view.setAttribute('aria-label', bandButton
    ? 'Solar observation. Press W to switch wavelengths, Enter to magnify, or an arrow key to browse.'
    : 'Image exhibit. Press Enter to magnify, or use the arrow keys to browse exhibits.');
  view.addEventListener('keydown', event => {
    if (bandButton && event.key.toLowerCase() === 'w') {
      event.preventDefault();
      toggleBand();
    } else if (['Enter', ' ', '+', '=', '-'].includes(event.key)) {
      event.preventDefault();
      setZoom(event.key === '-' || zoom > 1 ? 1 : 2.15);
    } else if (zoom > 1 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const [horizontal, vertical] = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[event.key];
      event.preventDefault();
      dx += horizontal * size.width * .12;
      dy += vertical * size.height * .12;
      draw();
    }
  }, { signal });
}
