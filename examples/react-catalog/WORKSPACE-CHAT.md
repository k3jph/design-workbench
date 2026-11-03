# React workspace and local conversation components

`src/interactive/Workspace.tsx` renders an observation or fleet register from its shared catalog section. Search, selection and review use controlled in-memory state, with stable record IDs; changing the filter clears an active record that is no longer visible, and reset restores the original fixture. Each workspace has a distinct accessible detail-region name. Multiple workspaces can operate independently on one page.

`src/interactive/Chat.tsx` reproduces the two synthetic messages and a local-only composer. It rejects whitespace-only messages, renders entered text as text, provides reset and never delivers or persists a message. Both components render their complete initial content on the server; controls are disabled until hydration and no-JavaScript instructions explain the limitation.

From the workbench root, `CHROMIUM_PATH=/usr/bin/chromium node examples/react-catalog/test-workspace-chat.mjs` builds and server-renders the specimen for both families at `/` and `/preview/`. It tests keyboard selection, review/filter/reset, two independent workspaces, whitespace and hostile-text handling, chat focus/reset, no POST, SSR/no-JavaScript content and disabled controls, 320px reflow, and light/dark automated axe. A focused TypeScript check with `allowJs` covers the components and harness.

These are isolated components and a test harness, not yet wired into the React catalog routes. Manual assistive-technology review, other browser engines, sustained use and visual parity remain open. The family React packages remain experimental.
