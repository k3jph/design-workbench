# Martlet Astro APIs

Use the installed `@martlet/astro` source as the API authority. This reference covers the published Astro 3.0.0 package with its matching Core dependency; component and application-extension maturity remain separately documented. Install with `npm install @martlet/core@3.0.0 @martlet/astro@3.0.0 astro` in an Astro project. Verify engine requirements for the chosen Astro version.

## Framework boundaries

- `Layout` emits the document, a skip link and one main landmark. Do not wrap it in another document or main. It takes `title`, `description`, `lang`, `mode`, `mainId`, `mainTabindex`, `class`, `bodyClass`, `skipLabel`, and optional external `stylesheet`; slots: default, `head`, `header`, `footer`, `body-end`.
- `ArticleLayout` adds page heading and prose. It takes `title`, `documentTitle`, `description`, `summary`, `eyebrow`, `mode`, `lang`, `mainId`, `class`, `bodyClass`, `sidebarLabel`; slots: default prose, `metadata`, `contents`, `sidebar` and the four document slots. Supporting sidebar follows prose in source order. Do not add another h1.
- `DocumentationLayout` uses `navigation` for its leading sidebar. Do not substitute ArticleLayout’s `contents` slot.
- `TableOfContents` takes `items: {href:string,label:string,depth?:2|3}[]`, `label`, `variant: 'index'|'inline'`, `class`. Use `href:'#section'`, not React’s `id` prop. A depth-3 item needs a preceding parent. It emits native links and nested lists; target IDs and heading order belong to the host.
- `SiteHeader` takes `name`, `home`, `links:{href,label,current?}[]`, `navigationLabel`, `class`; slots `brand`, `navigation`, `actions`. It is the existing generic wrapping-link header. The audited source masthead and dropdown controller are not exported Astro components. Adapt host navigation deliberately.
- `SiteFooter` takes `links`, `groups:{label,links:{href,label}[]}[]`, `variant:'plain'|'grouped'`, `navigationLabel`, `class`; slots default, `identity`, `base`. Supply the host’s identity, destinations and ownership wording. Do not copy source-site personal details.
- Import `@martlet/core/source-profile.css` after regular styles and opt in with `bodyClass="martlet-source-profile"`. Existing defaults remain available. Full dark appearance remains experimental.
- Contents remain visible in print by default. React print behavior is not the Astro contract.
- Forms, query state, selection, dialog behavior, persistence and cancellation use native HTML plus host logic. No Astro Form or QueryResults controller is exported. Follow grammar obligations without inventing imports.

## Complete reading-page composition

This example uses the published Astro components. Replace content and destinations with the host’s. Default light appearance is inherited.

```astro
---
import { ArticleLayout, SiteHeader, SiteFooter, Stack, TableOfContents } from '@martlet/astro';
import '@martlet/core/source-profile.css';
---
<ArticleLayout title="A clear account of the work" summary="A short introduction gives the reader enough context to begin." eyebrow="An example article" sidebarLabel="Related reading" bodyClass="martlet-source-profile">
  <meta slot="head" name="example-head" content="forwarded" />
  <SiteHeader slot="header" name="Example Research Desk" links={[{href:'/',label:'Home'},{href:'/documentation/',label:'Guide'}]} />
  <p slot="metadata">Example author · <time datetime="2026-01-01">January 1, 2026</time></p>
  <TableOfContents slot="contents" items={[{href:'#question',label:'Begin with the question'},{href:'#detail',label:'A closer look',depth:3},{href:'#evidence',label:'Present the evidence'}]} />
  <h2 id="question">Begin with the question</h2><p>Long-form content needs a reliable measure and room for supporting evidence. This article shares its design definitions with the landing page, while giving the prose its own space.</p>
  <h3 id="detail">A closer look</h3><p>Children remain related to their parent section in the contents navigation.</p>
  <h2 id="evidence">Present the evidence</h2><p>Figures, references, quotations, and code should remain usable when the browser is narrow or the reader enlarges the text.</p>
  <pre><code>const longExample = 'abcdefghijklmnopqrstuvwxyz'.repeat(20);</code></pre>
  <p><a href="/documentation/">Continue to the documentation example.</a></p>
  <Stack slot="sidebar"><h2>Related reading</h2><p>Supporting context follows the article in both source and narrow layouts.</p><a href="/layouts/">Layout lab</a></Stack>
  <SiteFooter slot="footer" variant="grouped" groups={['Explore','Resources','Legal'].map(label=>({label,links:[{href:'/documentation/',label:'Your destination'}]}))}>
    <p slot="identity"><strong>Example Research Desk</strong><br />A description supplied by the host.</p>
    <p slot="base">Your ownership statement.</p><a slot="base" href="/">Your contact destination</a>
  </SiteFooter>
  <p slot="body-end" id="body-end-example">End-of-body slot example.</p>
</ArticleLayout>
```

Check production build, local font assets, one main/h1, skip-link and fragment focus, source order, narrow and enlarged text, and actual print output. Automated browser evidence does not establish manual screen-reader support, RTL completeness or sustained consumer use.

## Adoption with Astro 3.0.0 and Core 3.0.0

Clone the separate starter at https://github.com/martletdesign/astro-starter, install its dependencies, then run `npm run dev` or `npm run build`. The npm component package does not contain a starter. The full reference at https://astro.martletdesign.dev/ includes a simulated registration form; no data is sent or stored durably.

Core `forms.css` is included in `full.css`. Retrieve `styling:forms` for exact field/hint/error/summary/notice/dialog anatomy, and `platform:HTML` for layout classes. `Button type="submit"` and `type="reset"` render the native type once. Use `class="martlet-button--secondary"` on `Button` for a secondary action, not a fictional `variant` prop. Validation, announcements, busy/draft state and focus remain host code. Fragment targets should have `tabindex="-1"` when their activation needs to move focus. Runtime appearance changes set the nearest `data-martlet` attribute; persistence and preference policy are host choices.

## Current distribution and migration

Astro 3 requires Core 3. Replace canonical `@martlet/core/reference.css` imports with `@martlet/core/martlet.css`. Existing component names, props and slots remain available. The `stylesheet` prop on document layouts accepts the canonical Core stylesheet URL; omit it to retain the bundled defaults. Core owns the visual rules, including shared reference and dashboard styles. Astro owns markup and native component APIs; host code owns application behavior.

Migration: https://github.com/martletdesign/astro/blob/main/docs/migration-3.md

The npm archive is https://registry.npmjs.org/@martlet/astro/-/astro-3.0.0.tgz with SHA-256 `87ec8e3161df7efaf653ed0e543443a918522674c38311208c163de242e00b16` and integrity `sha512-u16/5ASSnJteO8MTKpBdDolUhSLWJShremjahmpkgnbEcu5VrS57DQJsCMil46ty/VKMCTs/ZIH491wXc6xubA==`. Its bytes match the registry integrity and GitHub release asset digest. Source release: https://github.com/martletdesign/astro/releases/tag/v3.0.0, commit `a40af147300597f2acc45845fff3c6d221378a3b`. Retain the consumer lockfile and matching Core peer dependency. These byte checks do not assert independently verified npm signatures or deployment status.
