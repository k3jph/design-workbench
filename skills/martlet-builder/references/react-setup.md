# Martlet React setup

React 0.2.1 is published on npm `latest` from the independent https://github.com/martletdesign/react repository. Its component APIs remain experimental. Historical `next` still resolves to 0.1.0; publication and contract maturity are separate facts.

```sh
npm install @martlet/react@0.2.1 react@19 react-dom@19
```

The package depends on `@martlet/core` 2.2.4; React 19 is its peer. Pin versions and commit the consumer lockfile, then verify a clean `npm ci` and production build. Use the installed package's API rather than translating another framework's props.

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

URL: https://registry.npmjs.org/@martlet/react/-/react-0.2.1.tgz

SHA-256: `1ba283289b4f5aba5ac9daa892ee0e179e469699a7adf41bfdae8fc1239727de`. The downloaded bytes also match registry SHA-512 integrity `sha512-ME2aFqcjaucDykxgrpCAfk2dy8KOR2mIna+f4DutxCNwcUrtNe0a6VTxPKukAux+Z5Hh335hcCQOjXMf4DmUdw==`. Cryptographic npm signature and staging-provenance verification binds the package to accepted source `8eeb43f172bbd89634f6c1cbaee993130d3525b3`. A decoded statement or digest alone is not signature verification.

If necessary, download that exact tarball, verify its digest, and install the local file with React 19. A registry tarball, a source commit and a GitHub Release are distinct artifacts. The verified source release is https://github.com/martletdesign/react/releases/tag/v0.2.1, with the exact archive at https://github.com/martletdesign/react/releases/download/v0.2.1/martlet-react-0.2.1.tgz and checksums at https://github.com/martletdesign/react/releases/download/v0.2.1/SHA256SUMS. Its protected tag identifies the accepted main commit; the GitHub Release asset itself is not asserted immutable against administrators.

## Original snapshot and framework boundaries

The immutable original React 0.1.0 workbench archive remains https://github.com/howardjp/design-workbench/releases/download/react-v0.1.0/martlet-react-0.1.0.tgz with SHA-256 `42a501d06ef7114ed5640b52d9889998ae70ca1846e0bdfba9e1ba487c3c1a41`. It uses theme 2.1.0 and belongs to the historical source snapshot; its checksum and dependency instructions do not describe 0.2.1. The original grammar/decision provenance remains intact.

Use actual exported APIs, the family data attribute and host identity. Top, side and focused navigation follow the task. The shared 50 canonical examples, dashboard applications and scientific workspace are semantic/behavioral references, not new public React dashboard exports. Their local synthetic data is not durable service behavior. Manual assistive technology, complete localization/RTL and sustained adoption remain explicit open evidence. If a package cannot be obtained, report the real failure; theme-only HTML does not validate React component contracts.
