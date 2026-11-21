import { button, message, readout } from './ui.js';

export function mountNewton({ signal, mountFigure, tools, view, stopTour }) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Newton basins for three complex roots. Orange: positive real root. Teal: upper root. Lilac: lower root.');
  mountFigure(canvas);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    message(view, 'Canvas is unavailable in this browser. The derivation is linked below.');
    return;
  }

  const start = { x: 0, y: 0, span: 3.1 * Math.max(1, view.clientHeight / Math.max(1, view.clientWidth)) };
  let camera = { ...start };
  let worker;
  let drag;
  let requestId = 0;
  let pending = message(view, 'Calculating basins…', true);
  const state = readout();
  const zoomIn = button('+', 'Zoom in', () => zoom(0.5));
  const zoomOut = button('−', 'Zoom out', () => zoom(2));
  const reset = button('Reset', 'Reset to all three roots', () => {
    stopTour();
    camera = { ...start };
    render();
  });

  function paint({ id, width, height, pixels }) {
    if (signal.aborted || id !== requestId) return;
    canvas.width = width;
    canvas.height = height;
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    if (!drag) canvas.style.transform = '';
    pending?.remove();
    pending = null;
  }

  function useFallback() {
    worker?.terminate();
    worker = null;
    render();
  }

  try {
    worker = new Worker(new URL('../newton-worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = event => paint(event.data);
    worker.onerror = event => {
      event.preventDefault();
      if (!signal.aborted) useFallback();
    };
  } catch { /* render cooperatively on the main thread */ }

  async function fallback(request) {
    try {
      const { renderRows } = await import('./newton.js');
      const pixels = new Uint8ClampedArray(request.width * request.height * 4);
      for (let row = 0; row < request.height; row += 8) {
        if (signal.aborted || request.id !== requestId) return;
        renderRows(pixels, request, row, Math.min(request.height, row + 8));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      paint({ ...request, pixels });
    } catch {
      if (signal.aborted || request.id !== requestId) return;
      if (!pending) pending = message(view, 'The renderer could not load.');
      else pending.textContent = 'The renderer could not load.';
    }
  }

  function render() {
    const scale = Math.min(devicePixelRatio, (worker ? 1400 : 520) / Math.max(view.clientWidth, view.clientHeight));
    const width = Math.max(1, Math.round(view.clientWidth * scale));
    const height = Math.max(1, Math.round(view.clientHeight * scale));
    const request = { ...camera, width, height, id: ++requestId };
    const power = start.span / camera.span;
    state.textContent = `${Number(power.toPrecision(3))}×`;
    zoomIn.disabled = camera.span <= 1e-5;
    zoomOut.disabled = camera.span >= 8;
    if (worker) worker.postMessage(request);
    else fallback(request);
  }

  function zoom(factor, x = 0, y = 0) {
    stopTour();
    camera.x += x * camera.span;
    camera.y += y * camera.span;
    camera.span = Math.max(1e-5, Math.min(8, camera.span * factor));
    render();
  }

  const directions = { ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowRight: [1, 0] };
  function pan(direction) {
    const [x, y] = directions[direction];
    zoom(1, x * .24, y * .24);
  }
  const panPad = document.createElement('div');
  panPad.className = 'pan-pad';
  ['←', '↑', '↓', '→'].forEach((symbol, index) => {
    const key = Object.keys(directions)[index];
    panPad.append(button(symbol, 'Pan ' + key.slice(5).toLowerCase(), () => pan(key)));
  });
  tools.append(zoomOut, zoomIn, reset, panPad, state);

  view.tabIndex = 0;
  view.setAttribute('aria-label', 'Complex plane. Click to recenter and zoom. Use arrow keys to pan, plus or minus to zoom.');
  view.addEventListener('keydown', event => {
    if (!(event.key in directions) && !['+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    if (event.key in directions) pan(event.key);
    else zoom(event.key === '-' ? 2 : 0.5);
  }, { signal });
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    stopTour();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  }, { signal });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId || event.pointerType === 'touch') return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    canvas.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
  }, { signal });
  canvas.addEventListener('pointerup', event => {
    if (drag?.id !== event.pointerId) return;
    const x = event.clientX - drag.x;
    const y = event.clientY - drag.y;
    drag = null;
    if (event.pointerType === 'touch' && Math.abs(y) > 66 && Math.abs(y) > 1.6 * Math.abs(x)) return;
    if (Math.hypot(x, y) > 8) {
      zoom(1, -x / view.clientHeight, y / view.clientHeight);
      return;
    }
    const box = canvas.getBoundingClientRect();
    zoom(event.shiftKey ? 2 : 0.5,
      (event.clientX - box.left - box.width / 2) / box.height,
      (box.top + box.height / 2 - event.clientY) / box.height);
  }, { signal });
  canvas.addEventListener('pointercancel', () => {
    drag = null;
    canvas.style.transform = '';
  }, { signal });
  let lastZoom = 0;
  canvas.addEventListener('wheel', event => {
    if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
        Math.abs(event.deltaY) < 12 || performance.now() - lastZoom < 190) return;
    lastZoom = performance.now();
    const box = canvas.getBoundingClientRect();
    // Keep the point under the cursor stable while changing scale.
    const scale = event.deltaY < 0 ? 0.72 : 1.39;
    zoom(scale,
      (1 - scale) * (event.clientX - box.left - box.width / 2) / box.height,
      (1 - scale) * (box.top + box.height / 2 - event.clientY) / box.height);
  }, { signal, passive: true });
  const observer = new ResizeObserver(render);
  observer.observe(view);
  signal.addEventListener('abort', () => {
    observer.disconnect();
    worker?.terminate();
  }, { once: true });
}
