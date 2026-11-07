# Martlet Astro APIs

Use the installed `@martlet/astro` source as the API authority. This reference covers the published Astro 2.0.1 package with its matching Core dependency; component and application-extension maturity remain separately documented. Install with `npm install @martlet/core@2.2.4 @martlet/astro@2.0.1 astro` in an Astro project. Verify engine requirements for the chosen Astro version.

## Framework boundaries

- `Layout` emits the document, a skip link and one main landmark. Do not wrap it in another document or main. It takes `title`, `description`, `lang`, `mode`, `mainId`, `mainTabindex`, `class`, `bodyClass`, `skipLabel`; slots: default, `head`, `header`, `footer`, `body-end`.
- `ArticleLayout` adds page heading and prose. It takes `title`, `documentTitle`, `description`, `summary`, `eyebrow`, `mode`, `lang`, `mainId`, `class`, `bodyClass`, `sidebarLabel`; slots: default prose, `metadata`, `contents`, `sidebar` and the four document slots. Supporting sidebar follows prose in source order. Do not add another h1.
- `DocumentationLayout` uses `navigation` for its leading sidebar. Do not substitute ArticleLayout’s `contents` slot.
- `TableOfContents` takes `items: {href:string,label:string,depth?:2|3}[]`, `label`, `variant: 'index'|'inline'`, `class`. Use `href:'#section'`, not React’s `id` prop. A depth-3 item needs a preceding parent. It emits native links and nested lists; target IDs and heading order belong to the host.
- `SiteHeader` takes `name`, `home`, `links:{href,label,current?}[]`, `navigationLabel`, `class`; slots `brand`, `navigation`, `actions`. It is the existing generic wrapping-link header. The audited source masthead and dropdown controller are not exported Astro components. Adapt host navigation deliberately.
- `SiteFooter` takes `links`, `groups:{label,links:{href,label}[]}[]`, `variant:'plain'|'grouped'`, `navigationLabel`, `class`; slots default, `identity`, `base`. Supply the host’s identity, destinations and ownership wording. Do not copy source-site personal details.
- Import `@martlet/core/source-profile.css` after regular styles and opt in with `bodyClass="martlet-source-profile"`. Existing defaults remain available. Full dark appearance remains experimental.
- Contents remain visible in print by default. React print behavior is not the Astro contract.
- Forms, query state, selection, dialog behavior, persistence and cancellation use native HTML plus host logic. No Astro Form or QueryResults controller is exported. Follow grammar obligations without inventing imports.

## Complete reading-page composition

This example adapts the shipped Astro starter. Replace content and destinations with the host’s. Default light appearance is inherited.

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

## Adoption with Astro 2.0.1 and Core 2.2.4

Obtain the neutral starter with `npm pack @martlet/astro@2.0.1`, extract the downloaded archive, and copy `package/starter/` to your new directory. Or copy `node_modules/@martlet/astro/starter/` from an installed package. Install dependencies and run `npm run dev`; `npm run build` verifies the production output. The `/form/` route is a complete, explicitly simulated host controller using supported core classes; no data is sent or stored durably.

Core `forms.css` is included in `full.css`. Retrieve `styling:forms` for exact field/hint/error/summary/notice/dialog anatomy, and `platform:HTML` for layout classes. `Button type="submit"` and `type="reset"` render the native type once. Use `class="martlet-button--secondary"` on `Button` for a secondary action, not a fictional `variant` prop. Validation, announcements, busy/draft state and focus remain host code. Fragment targets should have `tabindex="-1"` when their activation needs to move focus. Runtime appearance changes set the nearest `data-martlet` attribute; persistence and preference policy are host choices.

## Verified source and package distribution

The current npm archive is https://registry.npmjs.org/@martlet/astro/-/astro-2.0.1.tgz with SHA-256 `25ed4adb21ec022835806dfc724cd29e4db424a9d537dd99d8a5ff8cf0b370dd` and integrity `sha512-qmLoKHfDq6z0SM6uQP2rVc5EpNZ8J8sC1DNtIdrhHtdy9RpjTyqIt3jHyDVycrpdQsmgvVGhYD6M78kwat810w==`. Cryptographic staging provenance identifies accepted source `f3e88c84f0c447b83058a7957fd16c12195d2bdb`. The matching GitHub source release is https://github.com/martletdesign/astro/releases/tag/v2.0.1; archive and SHA256SUMS downloads were verified against the npm bytes. Retain the consumer lockfile and the matching Core peer dependency.
