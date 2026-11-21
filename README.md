# Logic

[Open the atlas](https://srvstav.github.io/logic/) · [Image, data and type credits](CREDITS.md)

Logic is a silent, interactive atlas. The opening solar disk is a pair of real NASA observations. Move the pointer across it to reveal a second wavelength. Tap or click to magnify, and drag to pan. The corner book appears after interaction and contains the exhibit index, controls, field notes, and credits.

- **Space science.** Compare 30.4 nm and 17.1 nm observations of the Sun from the same timestamp.
- **Connectomics.** Filter a 13-neuron extract of FlyWire FAFB v783 by connection strength, focus a cell, or read the same results in a table.
- **Neuroscience.** Drag across a leaky integrate-and-fire plot to vary the input current and observe threshold crossings.
- **Mathematics.** Pan and zoom the basins of Newton's method for the cube roots of unity. A worker computes new views off the main thread.

The field book also holds all six original engineering plates and a preview of the embeddable engine. Press **B** to open it, **Escape** to close it, and **Page Up** or **Page Down** to browse. The visual has its own keyboard controls when focused. The optional tour starts explicitly and halts during inspection. The site uses native MathML for formulas and keeps the initial image available even when JavaScript is disabled.

## Build and test

```sh
npm ci
npm test
npm run build
python3 -m http.server 8080 --directory docs
```

Open [localhost:8080](http://localhost:8080). The build creates identical static files in `dist/` and `docs/`. GitHub Pages serves `docs/` from `main`. Commit the generated `docs/` directory alongside changes to source or assets.

The opening view uses HTML, CSS and a responsive WebP. The alternate solar wavelength, high-resolution zoom image, field-book fonts, data visualizations and WebGL engine load on demand. The atlas does not use a persistent render loop while idle. Newton has a cooperative CPU fallback when workers are unavailable.

## Embed the original engine

Copy `dist/logic.js`, `dist/assets/`, and the accompanying license notices to your site.

```html
<script type="module" src="/logic/logic.js"></script>
<logic-canvas assets="/logic/assets/" theme="auto"
  style="display:block;width:100%;height:100dvh"></logic-canvas>
```

Set an explicit height for a shorter section. The element observes container resizing. Set `controls="false"` to hide the theme control.

```js
import { mountLogic } from '/logic/logic.js';

const engine = mountLogic(document.querySelector('#visual'), {
  assetBase: '/logic/assets/',
  theme: 'auto',
  duration: 14,
  transition: 3.2,
  pixelRatio: 1.5,
});
await engine.ready;
engine.setTheme('dark'); // 'light' | 'dark' | 'auto'
engine.pause();
engine.nextScene();
engine.resume();
engine.getDiagnostics();
engine.destroy();
```

React callers can mount from an effect and return `() => engine.destroy()`. The engine uses WebGL2 with a Canvas 2D fallback. In reduced motion it renders a still and supports explicit scene changes. Background tabs stop normal animation. Its depth and detail treatment is artistic image processing.

To extend the engine, add an image you have rights to redistribute to `assets/` and register its ID, filename, title, creator, license and source in `assets/catalog.json`.

## FlyWire extract

The published FlyWire connection and cell-type tables remain under CC BY-NC 4.0. The extract sums connection counts for the same directed pair across neuropils, chooses six incoming and six distinct outgoing partners around an EPG cell, and retains all directed connections among the chosen cells in the source table. Positions are diagrammatic. The underlying FlyWire IDs and weights are preserved as data.

See [the original tables and citation](CREDITS.md#connectomics). To regenerate from the two gzip CSVs:

```sh
python3 scripts/extract-flywire.py connections_princeton.csv.gz consolidated_cell_types.csv.gz assets/flywire.json
```
