# React station and scene specimens — integration pending

`src/simulation/Simulations.tsx` exports `Sensors` and `Scene` as independent, controlled React components. Their labels, outputs, statuses, initial values, and three image alternatives match the shared Jekyll examples. The station controls only an illustrative temperature and ventilation state; the scene selects a captioned static image. Neither contacts a device or service, and each component instance keeps its own state and IDs. State resets on reload.

Server-rendered output retains the 18 °C/72% station snapshot and the captioned coastline image. Controls stay disabled until hydration; no-JavaScript users receive an explanation. `exampleImage` uses the existing React catalog base-aware asset helper, and the catalog build must continue copying the three canonical SVGs. Integrate the components into the `sensors` and `scene` section renderers; this isolated harness is not a published catalog route. Full visual parity, manual assistive-technology review and other browser engines remain unverified.

From the workbench root, run `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-simulation.mjs` (or omit the override if Playwright Chromium is installed). Four builds exercise both families at root and subpath URLs: independent simultaneous instances, keyboard changes, announcement text, image paths/alt/captions and decoding, reset on reload, no external requests, unique IDs, 320/1440 reflow, light/dark axe and disabled no-JavaScript controls. A strict TypeScript check is:

```sh
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --strict --skipLibCheck --allowJs --resolveJsonModule --types node,vite/client examples/react-catalog/src/catalog-family.d.ts examples/react-catalog/src/simulation/Simulations.tsx
```
