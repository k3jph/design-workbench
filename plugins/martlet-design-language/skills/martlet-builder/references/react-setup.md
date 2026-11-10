# Martlet React setup

React 1.0.0 is published on npm `latest` from https://github.com/martletdesign/react. It provides the released React component contract with canonical Core 3 styling. The original grammar snapshots and explicitly experimental patterns retain their recorded maturity. Historical `next` tags do not supersede `latest`.

```sh
npm install @martlet/react@1.0.0 react@19 react-dom@19
```

The package depends on `@martlet/core` 3.0.0; React 19 is its peer. Pin versions and commit the consumer lockfile, then verify a clean `npm ci` and production build. Use the installed package's API rather than translating another framework's props.

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

This is a component probe, not a service or complete validation controller. Retrieve `pattern:validated-form`, `component:Field`, `component:ErrorSummary`, `component:Dialog` and their examples for complete state and focus obligations. Host code owns validation, retained drafts, transport, routing, cancellation and persistence. The component stylesheet delegates to `@martlet/core/react.css`; Core owns every visual rule. Import it and optional local Core fonts; do not layer Core `full.css` over React component styles.

## Exact current registry artifact

URL: https://registry.npmjs.org/@martlet/react/-/react-1.0.0.tgz

SHA-256: `5e2e0c410f5f77cde839cb35802a38c2ad97c7c2542e2d3fbaedd8209cecec93`. The downloaded bytes match registry SHA-512 integrity `sha512-rkorso0DNGLcsQGanxGJ2yy3DFDJu3pItU4/yuCoLTXQ01rLO0zGPb3mprJM6rUqpFMqMcJ+VXdROrfbTXoD5A==` and the matching GitHub release asset digest. Source release: https://github.com/martletdesign/react/releases/tag/v1.0.0, commit `c54e95a7e6bc469845a9a8ed99bbd2dd6621676c`. Archive: https://github.com/martletdesign/react/releases/download/v1.0.0/martlet-react-1.0.0.tgz; checksums: https://github.com/martletdesign/react/releases/download/v1.0.0/SHA256SUMS. These checks establish artifact identity, not independently verified signatures or current deployment status.

Upgrade React and its exact Core dependency together. Remove copied React visual definitions and keep `@martlet/react/styles.css` as the public import. Applications still own state, services, routing and their identity. Verify the full interaction after updating a pre-1.0 installation.

## Original snapshot and framework boundaries

The immutable original React 0.1.0 workbench archive remains https://github.com/howardjp/design-workbench/releases/download/react-v0.1.0/martlet-react-0.1.0.tgz with SHA-256 `42a501d06ef7114ed5640b52d9889998ae70ca1846e0bdfba9e1ba487c3c1a41`. It uses theme 2.1.0 and belongs to the historical source snapshot; its checksum and dependency instructions do not describe 1.0.0. The original grammar/decision provenance remains intact.

Use actual exported APIs, the family data attribute and host identity. Top, side and focused navigation follow the task. The shared 50 canonical examples, dashboard applications and scientific workspace are semantic/behavioral references, not new public React dashboard exports. Their local synthetic data is not durable service behavior. Manual assistive technology, complete localization/RTL and sustained adoption remain explicit open evidence. If a package cannot be obtained, report the real failure; theme-only HTML does not validate React component contracts.
