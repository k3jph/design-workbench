# @martlet/react

Experimental 0.1.0. MIT licensed. Source package in the [design workbench](https://github.com/k3jph/design-workbench). Published on npm at 0.1.0 under both `latest` and `next`; the API remains experimental. Pin the version when adopting it.

```tsx
import { Button, Field, TextInput } from '@martlet/react';
import '@martlet/react/styles.css';
import '@martlet/theme/fonts.css'; // optional local fonts

<div className="martlet" data-martlet="light">
  <Field label="Component name" hint="Use the exported API name.">
    {props => <TextInput {...props} name="name" required />}
  </Field>
  <Button type="submit">Save component</Button>
</div>
```

```sh
npm install @martlet/react@0.1.0 react@19 react-dom@19
```

Exports: AppShell, Button, TextInput, Select, Textarea, Field, Notice, Badge, DataTable, Dialog, Checkbox, Fieldset, Disclosure, ErrorSummary, Article, TableOfContents, FileInput, Radio, Pagination, DefinitionList, Switch, Tabs, and FieldControl/SummaryError/ContentsItem/DefinitionItem/TabItem (types). Native attributes and refs on native controls follow React 19 conventions. Button defaults to `type="button"`. Field supplies a stable id and associated hint/error descriptions through a render function. Dialog uses the native modal top layer; keep it mounted and control `open`. Escape and native dialog-form closure call `onDismiss`; update `open` in that callback and provide visible dismissal buttons. Prop-driven closure does not call `onDismiss`. Pagination returns focus to the available direction when its focused control becomes disabled at a page boundary; external updates do not take focus from elsewhere. DataTable wraps a semantic table in a named, focusable overflow region. Notice announces success/info politely and errors assertively.

Use one AppShell per document; its skip link targets main. Styles are scoped to `.martlet` and require the matching data attribute for light/dark colors. Both families can coexist in a document. Application spacing roles are experimental. No app persistence or registry state is embedded in the components.

Build with `npm run build` at the workspace root. `npm run pack:react` produces installable tarballs for testing without publishing. React 19 and the theme package are required. Build artifacts include JavaScript, declarations, and CSS. The workbench exercises editing, validation, saving, server failures, conflicts, empty results, modal dismissal, light/dark rendering, responsive layout, and automated accessibility checks. Manual assistive-technology review and sustained use remain required before stability.

See the [component contracts](https://github.com/k3jph/design-workbench/blob/react-v0.1.0/docs/components.md) for properties, states, keyboard behavior, and acceptance criteria for every export. Checkbox is binary; mixed state is not yet a public contract. Fieldset keeps the native legend and disabled-group behavior. Disclosure uses native details/summary toggling.

Field creates its own stable hint and error IDs even when the caller supplies the input `id`, so another control can safely use names such as `reference-hint`. The render-prop `aria-describedby` contains the IDs actually used. Consumers that previously referenced the undocumented `<id>-hint` or `<id>-error` names directly should use that association, or explicitly pass unique `hintId` and `errorId` values to preserve their existing references. As with any HTML ID, caller-provided IDs must be unique in the document. Independently mounted React roots must use distinct `identifierPrefix` values.

ErrorSummary accepts a title, message/targetId error entries, native div ref, and optional recovery children. Focus it after a failed operation; its links focus explicit Field IDs or focusable fieldsets, and retain native fragment navigation if a target cannot be focused. Modified clicks retain native link behavior. Field now accepts an optional explicit id, retaining generated IDs by default. ErrorSummary does not manage application drafts or trigger focus itself.


Article composes an accessible title, optional inline summary/metadata/contents/aside, body, and footer. It accepts native article props/ref and titleLevel 1 (default) or 2; use coherent headings inside. TableOfContents accepts readonly id/label items, native nav props/ref, and a label defaulting to On this page. Its native fragment anchors target caller-supplied unique IDs; use tabIndex={-1} on target headings for keyboard focus. The components also render as static HTML. An application loading content asynchronously owns initial fragment restoration. Neither component parses Markdown or raw HTML, fetches records, or manages routing.

Both support light/dark modes, long text, a bounded reading measure, narrow single-column reflow, and print styles. Article keeps supporting material while TableOfContents is omitted from print. The workbench reading room is the current consumer. Print-media checks do not replace manual printer/PDF pagination, screen-reader, forced-colors, RTL, and non-Chromium review. All twenty-two components remain experimental.

FileInput forwards native uncontrolled input props and ref, fixes type=file, and excludes value/defaultValue from its TypeScript surface. Use it inside Field, with accept/multiple/name/disabled as needed. The consumer reads the native FileList, validates content/size, manages upload or import state, and may clear via ref.current.value="". The workbench consumes it for reviewed local JSON specification import; no transport, drag/drop, or file-security claim is embedded. Native chooser wording varies by operating system. Keyboard chooser activation, disabled/invalid/description semantics, long-content reflow, light/dark modes, and isolated-package rendering are checked; manual assistive technology and non-Chromium/mobile chooser review remain open.

Radio uses a native radio input with a required visible label, optional id, and forwarded native attributes/ref. className applies to its label wrapper. Give exclusive options the same name and distinct values, with a separate name per group; compose them inside Fieldset/legend. Native Tab, arrow keys, and Space retain browser behavior. The caller manages checked state, observations, validation, and disabled groups. The readiness-review consumer checks native navigation, group/error links, disabled controls, persistence, failures/conflicts, and responsive light/dark rendering. No custom ARIA radio model or promotion/release logic is embedded.

Pagination accepts controlled one-based page, pageCount, onPageChange, disabled, label (default Pagination), and native nav attributes/ref. Previous/next are native secondary buttons; first/last boundaries and disabled lock movement. Position is announced politely. Finite numbers are truncated and clamped; invalid counts/pages become one. The caller owns fetching, page-size, result count, URL state, loading/error recovery, and focus decisions. Labels currently use English. Buttons retain native Tab/Enter/Space behavior; no custom arrow model or embedded routing is supplied. The real review queue is its first consumer.

DefinitionList accepts readonly items containing stable unique id, term and description React nodes, plus native dl attributes/ref (children are composed from items). Each entry renders a native div/dt/dd group. It adds no landmark, heading, fetching, parsing, selection, or fake table role. Give a standalone list accessible context using a nearby heading or native ARIA attributes. Empty arrays produce an empty dl; consumer empty-state text remains separate. Long/multiline text wraps. Martlet stacks terms and descriptions with generous rhythm; Krigsvold aligns leading term columns and values, collapsing at narrow widths. The real specification-conflict comparison composes it into independent family layouts.



Switch adds a native binary checkbox with role=switch and fixed visible label. It accepts checked/defaultChecked, change, name/value, disabled and native attributes/ref; the visual track is decorative. ClassName passes to the input. Space and label activation remain native. The settings consumer controls future browser draft protection, with ordinary Save committing the preference.

Tabs provides labelled, controlled, manually activated panels. Supply unique item IDs, labels, content and optional disabled flags, plus value/onValueChange and a label. Horizontal arrows (vertical Up/Down when configured) and Home/End move focus among enabled tabs; Enter/Space select. The focused tab is the tab stop while navigating, and the selected tab becomes the entry point again when focus leaves the tablist. Panels remain mounted, linked by generated IDs, and hidden when inactive. The first enabled item is the fallback for invalid/disabled selection; provide at least one enabled item. If a focused tab is disabled or removed by an update, focus moves to the selected enabled tab when the document still has focus. Updates do not reclaim focus after it has moved elsewhere. If no tabs are enabled, the caller must provide an appropriate recovery focus target. Root div props/ref pass through. Routing, persistence, right-to-left arrow adaptation and automatic activation are not supplied.

Both are experimental and consumed by the workbench Settings workflow. The package now exposes 22 components. See [release preparation](https://github.com/k3jph/design-workbench/blob/react-v0.1.0/docs/release-policy.md) and [independent documentation-site direction](https://github.com/k3jph/design-workbench/blob/react-v0.1.0/docs/react-sites.md).


AppShell supports `navigationPlacement="default" | "top" | "side" | "none"`, an explicit `navigationLabel`, and optional `headerMode="light" | "dark"`. Existing defaults remain compatible. Placement is a task composition choice in both languages; none omits primary navigation while retaining the brand, utilities and single main landmark. See [the UI grammar](https://github.com/k3jph/design-workbench/blob/react-v0.1.0/docs/languages/martlet/grammar.md) and [MCP and builder skills](https://github.com/k3jph/design-workbench/blob/react-v0.1.0/docs/mcp.md).

## Source reconciliation

The October 23 origin audit is reconciled in this experimental release. TableOfContents accepts optional depth 2/3 per item and variant index/inline; DefinitionList accepts layout rows/stack/grid. Article contents precede body while supporting aside content follows it. AppShell carries neither a decorative top stripe nor a built-in colophon. Existing AppShell navigation defaults are retained for compatibility, with top/side/none available in both families. See docs/languages/martlet/decisions.md for source roles and explicit application extensions. The complete grammar remains experimental; theme 2.1.0 is unchanged.
