import { renderRows } from './newton.js';

let generation = 0;
self.onmessage = ({ data: request }) => {
  const current = ++generation;
  const pixels = new Uint8ClampedArray(request.width * request.height * 4);
  let row = 0;

  function renderChunk() {
    if (current !== generation) return;
    const start = performance.now();
    do {
      renderRows(pixels, request, row, row + 1);
      row++;
    } while (row < request.height && performance.now() - start < 10);

    if (row < request.height) {
      setTimeout(renderChunk, 0);
    } else {
      self.postMessage({ id: request.id, width: request.width, height: request.height, pixels }, [pixels.buffer]);
    }
  }

  renderChunk();
};
