# Martlet React setup

React 0.2.0 is published on npm `latest` from the independent https://github.com/martletdesign/react repository. Its component APIs remain experimental. Historical `next` still resolves to 0.1.0; publication and contract maturity are separate facts.

```sh
npm install @martlet/react@0.2.0 react@19 react-dom@19
```

The package depends on `@martlet/core` 2.2.3; React 19 is its peer. Pin versions and commit the consumer lockfile, then verify a clean `npm ci` and production build. Use the installed package's API rather than translating another framework's props.

```tsx
import { Button, Field, TextInput } from '@martlet/react';
import '@martlet/react/styles.css';
import '@martlet/core/fonts.css';

export default function App() {
  return <div className="martlet" data-martlet="light">
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

## Exact current registry artifact

URL: https://registry.npmjs.org/@martlet/react/-/react-0.2.0.tgz

SHA-256: `185bf53ada0b4bdb792a1ba78223068ec3eda29ba1e74a6f85415c6cdf98f6d1`. The downloaded bytes also match registry SHA-512 integrity `sha512-IIAJRRgbpyEtea4hZpGSsQ3rynC+GAjOk/phrCgx/2bWM34yKvmB38qCAOx65ScSY19//1EmE5Y7APghZdfH9w==`. Registry provenance identifies source `322e549d15812d74257ace37207f62410d6f0911`. Check the established signature/provenance verification independently; a decoded statement or digest alone is not signature verification.

If necessary, download that exact tarball, verify its digest, and install the local file with React 19. A registry tarball, a source commit and a GitHub Release are distinct artifacts. At this inventory, the standalone repository has no GitHub Release; the npm package is available.

## Original snapshot and framework boundaries

The immutable original React 0.1.0 workbench archive remains https://github.com/howardjp/design-workbench/releases/download/react-v0.1.0/martlet-react-0.1.0.tgz with SHA-256 `42a501d06ef7114ed5640b52d9889998ae70ca1846e0bdfba9e1ba487c3c1a41`. It uses theme 2.1.0 and belongs to the historical source snapshot; its checksum and dependency instructions do not describe 0.2.0. The original grammar/decision provenance remains intact.

Use actual exported APIs, the family data attribute and host identity. Top, side and focused navigation follow the task. The shared 50 canonical examples, dashboard applications and scientific workspace are semantic/behavioral references, not new public React dashboard exports. Their local synthetic data is not durable service behavior. Manual assistive technology, complete localization/RTL and sustained adoption remain explicit open evidence. If a package cannot be obtained, report the real failure; theme-only HTML does not validate React component contracts.
