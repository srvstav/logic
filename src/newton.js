const rootHeight = Math.sqrt(3) / 2;
export const roots = [[1, 0], [-0.5, rootHeight], [-0.5, -rootHeight]];
export const rootColors = [[232, 147, 103], [105, 209, 204], [191, 163, 221]];

export function newtonBasin(x, y, limit = 48) {
  for (let step = 0; step <= limit; step++) {
    const root = x > 0.25 ? 0 : y > 0 ? 1 : 2;
    const realError = x - roots[root][0];
    const imagError = y - roots[root][1];
    if (realError * realError + imagError * imagError < 1e-12) return root * 64 + step;
    if (step === limit) break;

    const re = x * x - y * y;
    const im = 2 * x * y;
    const modulus = re * re + im * im;
    if (!Number.isFinite(modulus) || modulus < 1e-28) break;
    x = (2 * x + re / modulus) / 3;
    y = (2 * y - im / modulus) / 3;
  }
  return -1;
}

export function renderRows(pixels, { width, height, x, y, span }, from, to) {
  const scale = span / height;
  for (let row = from; row < to; row++) {
    const imaginary = y + (height / 2 - row - 0.5) * scale;
    for (let column = 0; column < width; column++) {
      const real = x + (column + 0.5 - width / 2) * scale;
      const basin = newtonBasin(real, imaginary);
      const offset = (width * row + column) * 4;
      if (basin < 0) {
        pixels[offset] = 13;
        pixels[offset + 1] = 20;
        pixels[offset + 2] = 24;
      } else {
        const color = rootColors[basin >> 6];
        const steps = basin & 63;
        const brightness = 0.18 + 0.82 / (1 + steps * steps * 0.014);
        pixels[offset] = color[0] * brightness;
        pixels[offset + 1] = color[1] * brightness;
        pixels[offset + 2] = color[2] * brightness;
      }
      pixels[offset + 3] = 255;
    }
  }
}
