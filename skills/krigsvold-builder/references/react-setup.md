# Krigsvold React setup

React 0.2.0 is published on npm `latest` from the independent https://github.com/krigsvolddesign/react repository. Its component APIs remain experimental. Historical `next` still resolves to 0.1.0; publication and contract maturity are separate facts.

```sh
npm install @krigsvold/react@0.2.0 react@19 react-dom@19
```

The package depends on `@krigsvold/core` 2.2.4; React 19 is its peer. Pin versions and commit the consumer lockfile, then verify a clean `npm ci` and production build. Use the installed package's API rather than translating another framework's props.

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

## Exact current registry artifact

URL: https://registry.npmjs.org/@krigsvold/react/-/react-0.2.0.tgz

SHA-256: `26db29737f69e5bb20ecc7b138acb35656c68c3f4eea80defdfb6a3d1bfb9961`. The downloaded bytes also match registry SHA-512 integrity `sha512-35kPqHPuFEyLP03Kps5JujlHN3PmhU59W0+39/CUjWbkUa90nFNiV3V2UnmkngVzjN3YBk/h4rRV4vWgNwBqIw==`. Registry provenance identifies source `5128c6bf26cdba8ddb3c2d88de65b2307d3661b4`. Check the established signature/provenance verification independently; a decoded statement or digest alone is not signature verification.

If necessary, download that exact tarball, verify its digest, and install the local file with React 19. A registry tarball, a source commit and a GitHub Release are distinct artifacts. At this inventory, the standalone repository has no GitHub Release; the npm package is available.

## Original snapshot and framework boundaries

The immutable original React 0.1.0 workbench archive remains https://github.com/howardjp/design-workbench/releases/download/react-v0.1.0/krigsvold-react-0.1.0.tgz with SHA-256 `d7ffd5de0df1f08370d05d5d7a950b932f912b99cd0a2fcf871795e5e0140246`. It uses theme 2.1.0 and belongs to the historical source snapshot; its checksum and dependency instructions do not describe 0.2.0. The original grammar/decision provenance remains intact.

Use actual exported APIs, the family data attribute and host identity. Top, side and focused navigation follow the task. The shared 50 canonical examples, dashboard applications and scientific workspace are semantic/behavioral references, not new public React dashboard exports. Their local synthetic data is not durable service behavior. Manual assistive technology, complete localization/RTL and sustained adoption remain explicit open evidence. If a package cannot be obtained, report the real failure; theme-only HTML does not validate React component contracts.
