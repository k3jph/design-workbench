# Bounded contrast review

The Chromium portable-browser smoke's WCAG-tagged axe scan reported incomplete color-contrast results for SVG chart labels, some horizontally clipped analytics table cells, and Jekyll light-appearance masthead text over gradients. An incomplete result is not a pass or failure. The following review covers only the bundled example content and specific states below.

Build both Jekyll examples at `/` into `martlet` and `krigsvold` directories, and build both Astro and React catalog families at `/` as described in the page-archetypes README. Then run:

```sh
NIGHTJAR_JEKYLL_ROOT=/path/to/paired/jekyll/builds CHROMIUM_PATH=/usr/bin/chromium node examples/page-archetypes/tests/contrast-bounded.mjs
```

The check uses the same filtered analytics state for both families and all three frameworks, saved light and dark appearances, and a 320px viewport. It calculates WCAG contrast from computed opaque SVG text fills and their first opaque CSS background, and from the ordinary text and background colors of the selected source table. It rejects image or gradient backgrounds, translucent backgrounds before the first opaque layer, non-opaque text and ancestor opacity instead of guessing. It also requires the source table's named, focusable scrolling region to respond to keyboard Right-arrow input. It does not model overlaps with other painted SVG marks or establish contrast for arbitrary author-supplied content.

On Chromium 151 the 17 chart labels per case measured at least 6.97:1 for Martlet light, 13.26:1 for Martlet dark, 6.06:1 for Krigsvold light and 11.10:1 for Krigsvold dark. The 75 selected source-table header and data cells in each case measured at least 13.72:1 across the twelve framework/family/appearance cases. All twelve table regions scrolled by keyboard. The rounded figures describe computed CSS colors, not sampled antialiased glyph pixels. Chart screenshots were also inspected for the bounded 320px cases.

For Jekyll article and sign-in pages in light appearance, the script separately checks the current plain navy base and exact gradient endpoint colors, compositing alpha in sRGB before applying the WCAG contrast formula. It checks the reported masthead/header text against both gradient endpoints; the Martlet fixed transparent header must lie over the audited masthead, while the Krigsvold translucent navbar is conservatively composited over white. In Chromium the minimum endpoint ratios were 10.12:1 for Martlet and 17.06:1 for Krigsvold. The check deliberately rejects a changed base, gradient or custom hero image for separate review. The current bundled mastheads have no background image; these numbers do not establish contrast over host-supplied images.

The probe and screenshots are limited to the stated fixture, filters, viewport and Chromium run. Incomplete axe results remain incomplete, and manual assistive-technology review, other engines, viewport sizes, scrolling/hover states, transparent or image backgrounds, custom data and other pages remain open.
