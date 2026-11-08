# Krigsvold React setup

React 0.2.2 is published on npm `latest` from the independent https://github.com/krigsvolddesign/react repository. Its component APIs remain experimental. Historical `next` still resolves to 0.1.0; publication and contract maturity are separate facts.

```sh
npm install @krigsvold/react@0.2.2 react@19 react-dom@19
```

The package depends on `@krigsvold/core` 2.2.5; React 19 is its peer. Pin versions and commit the consumer lockfile, then verify a clean `npm ci` and production build. Use the installed package's API rather than translating another framework's props.

```tsx
import { Button, Field, TextInput } from '@krigsvold/react';
import '@krigsvold/react/styles.css';
import '@krigsvold/core/fonts.css';

export default function App() {
  return <div className="krigsvold" data-krigsvold="light">
    <form onSubmit={event => event.preventDefault()}>
      <Field label="Name" hint="Use the name for this registration.">
        {props => <TextInput {...props} name="name" required />}
      </Field>
      <Button type="submit">Register</Button>
    </form>
  </div>;
}
```

This is a component probe, not a service or complete validation controller. Retrieve `pattern:validated-form`, `component:Field`, `component:ErrorSummary`, `component:Dialog` and their examples for complete state and focus obligations. Host code owns validation, retained drafts, transport, routing, cancellation and persistence. Import the component stylesheet and optional local Core fonts; do not layer Core `full.css` over React component styles.

Contents are omitted by default. Supply a manually authored `TableOfContents` only when useful, inline above prose. In 0.2.2 its default variant is `inline`; the retained legacy `index` variant also stays in normal reading flow. Site navigation and supporting application regions remain separate.

## Exact current registry artifact

URL: https://registry.npmjs.org/@krigsvold/react/-/react-0.2.2.tgz

SHA-256: `21472613ccd38dcfe5a43902c0f74bde80a3d1804a4bdd3686977fcbdb8acd74`. The downloaded bytes also match registry SHA-512 integrity `sha512-3Z4SOdu7Px09UkCwliG+AenF6XzE6XvbW09AbAj+lNWqBQS9+Svmgj663jhbUKxhgMd6kXuXjjliG8kKWII8Tg==`. Cryptographic npm signature and trusted-publisher provenance verification binds the package to accepted source `77773ff9f03c9fe616eaa48b6cef465e4f88783b`. A decoded statement or digest alone is not signature verification.

If necessary, download that exact tarball, verify its digest, and install the local file with React 19. A registry tarball, a source commit and a GitHub Release are distinct artifacts. The verified source release is https://github.com/krigsvolddesign/react/releases/tag/v0.2.2, with the exact archive at https://github.com/krigsvolddesign/react/releases/download/v0.2.2/krigsvold-react-0.2.2.tgz and checksums at https://github.com/krigsvolddesign/react/releases/download/v0.2.2/SHA256SUMS. Its protected tag identifies the accepted main commit; the GitHub Release asset itself is not asserted immutable against administrators.

## Original snapshot and framework boundaries

The immutable original React 0.1.0 workbench archive remains https://github.com/howardjp/design-workbench/releases/download/react-v0.1.0/krigsvold-react-0.1.0.tgz with SHA-256 `d7ffd5de0df1f08370d05d5d7a950b932f912b99cd0a2fcf871795e5e0140246`. It uses theme 2.1.0 and belongs to the historical source snapshot; its checksum and dependency instructions do not describe 0.2.2. The original grammar/decision provenance remains intact.

Use actual exported APIs, the family data attribute and host identity. Top, side and focused navigation follow the task. The shared 50 canonical examples, dashboard applications and scientific workspace are semantic/behavioral references, not new public React dashboard exports. Their local synthetic data is not durable service behavior. Manual assistive technology, complete localization/RTL and sustained adoption remain explicit open evidence. If a package cannot be obtained, report the real failure; theme-only HTML does not validate React component contracts.
