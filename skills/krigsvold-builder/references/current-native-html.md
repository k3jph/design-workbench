# Direct HTML anatomy

This current installation guide adapts the preserved grammar snapshot to the published Core 3 package. Original grammar and review records remain available separately. Core owns these visual contracts; controllers and services belong to the host.

Core 3.0.1 · Framework-independent classes. Import `@krigsvold/core/full.css` and optional `fonts.css`, then use `class="krigsvold" data-krigsvold="light"` on your shell. A class beginning `krigsvold-` is namespaced; a primitive name in `layout.json` is not itself an HTML class. These contracts work in server HTML, Astro and React JSX (`className`) without reconstructing another framework's implementation.

| Object | Classes / native structure |
| --- | --- |
| Container | `krigsvold-container`; add `--reading` or `--archive` modifier for that measure. |
| Stack / cluster | `krigsvold-stack`, `krigsvold-cluster`; `--end` / `--between` on cluster. |
| Grid | `krigsvold-grid`; `--1`, `--2`, `--4` bound maximum columns; default maximum is 3. |
| Local spacing | `krigsvold-space-small` or `krigsvold-space-large` on the primitive whose own gap changes. |
| Sidebar | `krigsvold-sidebar` containing `krigsvold-sidebar__main` and `krigsvold-sidebar__aside`. Put an actual `aside` with an accessible name on support. Use DOM order appropriate to task; CSS does not reorder. |
| Split | `krigsvold-split`; `--wide-start` / `--wide-end` / `--start` modifiers. |
| Page header | `header.krigsvold-page-header > .krigsvold-container > .krigsvold-page-header__copy` with one h1; optional `krigsvold-eyebrow`, `krigsvold-page-header__summary`, `krigsvold-page-header__metadata`. |
| Reading | `krigsvold-reading-context > .krigsvold-reading-layout` containing `krigsvold-reading-layout__contents` then `krigsvold-reading-layout__body`; prose in `article.krigsvold-prose`. |
| Contents | `nav.krigsvold-contents.krigsvold-contents--index` (or `--inline`) with an accessible name, `krigsvold-contents__label`, unnumbered parent list and nested child list. Real fragment links target meaningful heading IDs. |
| Header | `header.krigsvold-site-header > .krigsvold-container`, host brand, named native `nav`, host links. Wrapping only; no dropdown controller. |
| Footer | `footer.krigsvold-site-footer`; add `krigsvold-site-footer--grouped`, inner container, `krigsvold-site-footer__top` containing optional `__identity` and `__groups`; each `__group` has heading and named nav. Separate `__base` follows `__top`. The host supplies identity and destinations. |
| Forms and state | See [native form styling](form-styling.md) for exact supported classes, semantics and host obligations. |

Modifiers always retain their base class, for example `class="krigsvold-grid krigsvold-grid--2"`. A source profile uses `class="krigsvold krigsvold-source-profile"` with its separate stylesheet imported last. Reading contents remain in source before the body; support remains separate from navigation. Set `tabindex="-1"` on fragment targets if activation should move keyboard focus.

The generic header is not the origin's scrolling/floating masthead. Appearance inversion and scroll state on a documentation host do not automatically apply to adopting applications. Native HTML and host identity remain authoritative. Semantic markup and a task-appropriate page hierarchy are required, even when no framework wrapper is used.

When both contents and a supporting sidebar are present, add `krigsvold-reading-layout--supported` to the reading layout. This lets the body use available container width while the prose retains its own 760px measure. The sidebar wraps when main minimum + sidebar basis + gap no longer fit.
