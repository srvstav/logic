# Logic

A portable visual engine grounded in real engineering photographs and scientific renders. Built for full-screen desktops and embeddable sections of other websites.

Live: https://srvstav.github.io/logic/

## Embed

Copy the contents of `dist/` into your website's `/logic/` directory:

```html
<script type="module" src="/logic/logic.js"></script>
<logic-canvas assets="/logic/assets/" theme="auto"
  style="display:block;width:100%;height:100dvh"></logic-canvas>
```

For a shorter section, set any explicit height. Container resizing is observed automatically. `controls="false"` hides the theme control; image credit remains visible.

## JavaScript API

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
engine.resume();
engine.nextScene();
engine.getDiagnostics();
engine.destroy(); // release textures, listeners and DOM when unmounting
```

React: call `mountLogic(ref.current, options)` inside an effect; return `() => engine.destroy()`. No React dependency is required.

## Rendering

- Three.js WebGL2, custom photographic shaders, and a 100,800-sample image-derived detail layer.
- The next image is fetched, decoded and uploaded before its transition begins. If it is late, the current scene continues.
- Shuffled passages, continuously varying camera drift and randomized transition seed.
- Scoped Shadow DOM styles; visible crosshair cursor; quiet hover inspection.
- Automatic light between 07:00 and 19:00 in the viewer's local time, dark otherwise. Manual override available.
- Hidden tabs stop drawing. Pixel ratio is capped. Reduced-motion preferences suppress WebGL drift/detail motion and lengthen scene holds.
- Canvas 2D fallback provides photography, cursor response and crossfades when WebGL2 is unavailable.

The depth/inspection treatment is artistic image processing, **not measured geometry or a physics simulation**. The six-image starter catalog is finite. Random ordering is not a promise of infinite unique content or a mathematically nonrepeating sequence. Hardware-dependent smoothness must be measured on the intended devices.

## Expand the catalog

Add an owned or appropriately licensed image to `assets/` and add an entry to `assets/catalog.json`:

```json
{
  "id": "your-subject",
  "title": "Accurate subject name",
  "file": "your-image.webp",
  "author": "Creator credit",
  "license": "Applicable license",
  "source": "https://original-source-page"
}
```

Prefer 2400–3840 px sources for large screens. The current starter images include five 640–721 px photography previews and one 1170 px molecular render; they are not 4K originals. Replace them with higher-resolution licensed sources to improve large-screen detail. The engine imposes no fixed catalog count.

## Build and deploy

```sh
npm ci
npm test
npm run build
```

`dist/` is the self-contained distributable. `docs/` is the identical GitHub Pages output. GitHub Pages is configured to serve `main` → `/docs`. Commit the generated `docs` files after rebuilding.

Run through an HTTP server; ES modules and image fetches are not designed for `file://`.

## Attribution

See [CREDITS.md](CREDITS.md) and the catalog for original image sources and licenses. Photography was selected with inspiration from [Leafers](https://leafers.in/). The ribosome render comes from RCSB PDB/PDB-101. Three.js is used under its MIT license; its notice ships with the bundle. Image rights are separate from the code license.
