# Portable interaction and recovery contracts

These requirements capture behavior learned from the Nightjar examples. They apply to both design languages, while allowing each family its own composition and each framework its own API. They are requirements for new or changed examples, not a claim that every existing state has been independently validated. Preserve the authoritative source treatments and avoid a shared controller merely to make implementations look alike.

## Applied state and address updates

1. Identify draft controls and the last applied scope. Label results using the applied scope; do not silently apply a draft when an unrelated action runs.
2. An export, chart, summary and table for an applied view must derive from the same scope and data snapshot. If validation fails, explain which inputs need correction and whether the previous result or an export is available.
3. Define how address, comparison links and local state behave when history access fails. An atomic apply may keep the previous scope, preserve the draft and offer retry; a local action may instead complete and visibly disclose that its address is stale. In either case do not imply a failed change succeeded or expose a comparison link that purports to represent a different scope. Preserve the host's current `history.state` on each address update, including after the host changes it; preserve unrelated query parameters and fragments as required by the host, and only carry explicitly permitted scope into a comparison link.
4. An initialization failure must not leave an interactive-looking form active without its handler. Preserve meaningful static content, disable unavailable controls and provide a recovery explanation. For local demonstration state, explain that changes are not durable.

The analytics and operations dashboards use atomic scope changes on a failed address update. Jekyll/Astro administration retains the local edit and reports a stale address; React administration retains the record in a disabled fallback. Search may continue updating local results with a visible address warning. These are deliberately different failure policies: choose the policy that preserves the action's meaning. See `DASHBOARDS.md` and the dated ledger for scope and limitations.

## Focus, errors and asynchronous events

- A validation message must be associated with each affected input when that input is invalid. Retain independent help text. Remove the error association after correction, reset or a data-source failure that does not invalidate the input. A focusable summary can direct the user to each actionable field; do not prevent native fragment navigation if direct focus is impossible.
- Dismissal and replacement controls must leave focus at a meaningful, available destination. A delayed close or completion callback must not steal focus from another active target or clear a reopened surface. A cancelled or superseded operation must not apply a stale result. These are state-transition requirements, not a requirement to invent new keyboard conventions.
- An action's announcement must reflect the action actually completed. A failure or pending response must not emit success. Preserve changed drafts and provide a usable retry where the operation supports it.

## Visibility and motion

Every meaningful state must remain understandable without color or motion alone. When foreground and background change together, check intermediate states as well as settled colors; do not assume a passing settled contrast measurement covers animation. Reduced-motion behavior must preserve state and layout. Keep readable controls, focus indicators and semantic table alternatives during responsive reflow; constrain horizontal scrolling to the content that needs it.

## Evidence required for a new implementation

Exercise paired families and relevant frameworks at root and subpath hosting, with success, invalid input, unavailable enhancement, a failed update and retry. Inspect the real downloaded bytes and visible rows where export exists. Include keyboard focus, rapid close/reopen, meaningful late callbacks and color transition checks when applicable. Include an automated accessibility scan as a diagnostic, report incomplete results separately, and retain manual screen-reader, real zoom, print and visual review as distinct evidence. Never accept a new visual baseline without review.

Current regression entry points include `tests/dashboard-initialization.mjs`, `tests/analytics-precision.mjs`, `tests/gallery-composition.mjs`, `tests/search-composition.mjs`, `tests/form-composition.mjs`, and the workspace consumer tests `scripts/test-dialog-consumer.mjs`, `scripts/test-pagination-consumer.mjs`, `scripts/test-tabs-consumer.mjs`, `scripts/test-error-summary-consumer.mjs` and `scripts/test-fields-consumer.mjs`. Check their documented setup and exact bounded coverage; their presence is not a universal certification.
