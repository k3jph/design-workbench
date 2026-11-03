import { useRef, useState } from "react";
import * as UI from "docs-family";
export type Options = {
  text: string;
  disabled: boolean;
  invalid: boolean;
  variant: "primary" | "secondary" | "quiet";
  kind: "info" | "success" | "error";
  vertical: boolean;
  navigation: "default" | "top" | "side" | "none";
  tocVariant: "index" | "inline";
};
export const defaults: Options = {
  text: "A considered interface",
  disabled: false,
  invalid: false,
  variant: "primary",
  kind: "info",
  vertical: false,
  navigation: "default",
  tocVariant: "index",
};
export function Example({
  name,
  options: o,
  mode = "light",
}: {
  name: string;
  options: Options;
  mode?: string;
}) {
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("overview");
  const [open, setOpen] = useState(false);
  const [clicks, setClicks] = useState(0);
  const summary = useRef<HTMLDivElement>(null);
  const error = o.invalid ? "Add a title before continuing." : undefined;
  const control = (kind: string) => (
    <UI.Field
      label="Project title"
      hint="Use a short, descriptive title."
      error={error}
    >
      {(p) =>
        kind === "Select" ? (
          <UI.Select
            {...p}
            disabled={o.disabled}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            <option value="">Choose a project</option>
            <option value="journal">Field journal</option>
            <option value="archive">Design archive</option>
          </UI.Select>
        ) : kind === "Textarea" ? (
          <UI.Textarea
            {...p}
            rows={3}
            disabled={o.disabled}
            value={value}
            placeholder={o.text}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : kind === "FileInput" ? (
          <UI.FileInput
            {...p}
            accept=".txt,.md"
            disabled={o.disabled}
            onChange={(e) => setValue(e.target.files?.[0]?.name ?? "")}
          />
        ) : (
          <UI.TextInput
            {...p}
            disabled={o.disabled}
            value={value}
            placeholder={o.text}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      }
    </UI.Field>
  );
  switch (name) {
    case "AppShell":
      return (
        <iframe
          title="AppShell isolated document"
          src={`?shell=1&mode=${mode}&navigation=${o.navigation}`}
          className="shell-frame"
        />
      );
    case "Button":
      return (
        <>
          <UI.Button
            variant={o.variant}
            disabled={o.disabled}
            onClick={() => setClicks(clicks + 1)}
          >
            {o.text}
          </UI.Button>
          <p className="demo-feedback" role="status">
            {clicks
              ? `Activated ${clicks} ${clicks === 1 ? "time" : "times"}.`
              : "Ready for your next action."}
          </p>
        </>
      );
    case "TextInput":
    case "Select":
    case "Textarea":
    case "FileInput":
    case "Field":
      return (
        <>
          {control(name)}
          {name === "FileInput" && (
            <p className="demo-feedback" role="status">
              {value
                ? `Selected locally: ${value}. Nothing is uploaded.`
                : "Choose a local text file. Nothing is uploaded."}
            </p>
          )}
        </>
      );
    case "Checkbox":
      return (
        <UI.Checkbox
          label={o.text}
          disabled={o.disabled}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      );
    case "Switch":
      return (
        <>
          <UI.Switch
            label={o.text}
            disabled={o.disabled}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <p className="demo-feedback">
            {checked ? "Enabled" : "Disabled"} for this example.
          </p>
        </>
      );
    case "Radio":
      return (
        <UI.Fieldset
          legend="Reading density"
          disabled={o.disabled}
          error={error}
        >
          <UI.Radio
            name="density"
            label="Comfortable"
            value="comfortable"
            checked={value === "comfortable"}
            onChange={(e) => setValue(e.target.value)}
          />
          <UI.Radio
            name="density"
            label="Compact"
            value="compact"
            checked={value === "compact"}
            onChange={(e) => setValue(e.target.value)}
          />
        </UI.Fieldset>
      );
    case "Fieldset":
      return (
        <UI.Fieldset
          legend={o.text}
          hint="Choose the details to include."
          error={error}
          disabled={o.disabled}
        >
          <UI.Checkbox
            label="Include summary"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <UI.Checkbox label="Include references" defaultChecked />
        </UI.Fieldset>
      );
    case "Notice":
      return <UI.Notice kind={o.kind}>{o.text}</UI.Notice>;
    case "Badge":
      return <UI.Badge>{o.text}</UI.Badge>;
    case "DataTable":
      return (
        <UI.DataTable caption={o.text}>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Field journal</th>
              <td>In review</td>
              <td>October 22</td>
            </tr>
            <tr>
              <th scope="row">Design archive</th>
              <td>Draft</td>
              <td>October 20</td>
            </tr>
          </tbody>
        </UI.DataTable>
      );
    case "Disclosure":
      return (
        <UI.Disclosure summary={o.text}>
          <p>
            Optional context belongs here. Required actions and blocking errors
            stay visible outside the disclosure.
          </p>
        </UI.Disclosure>
      );
    case "Dialog":
      return (
        <>
          <UI.Button disabled={o.disabled} onClick={() => setOpen(true)}>
            Open dialog
          </UI.Button>
          <UI.Dialog
            open={open}
            title={o.text}
            onDismiss={() => setOpen(false)}
          >
            <p>
              Your changes are still available. Close this example to return to
              the page.
            </p>
            <UI.Button autoFocus onClick={() => setOpen(false)}>
              Close dialog
            </UI.Button>
          </UI.Dialog>
        </>
      );
    case "ErrorSummary":
      return (
        <>
          <UI.Button
            variant="secondary"
            onClick={() => summary.current?.focus()}
          >
            Focus error summary
          </UI.Button>
          <UI.ErrorSummary
            ref={summary}
            title={o.text}
            errors={[
              { message: "Enter a project title.", targetId: "demo-title" },
            ]}
          />
          <UI.Field
            id="demo-title"
            label="Project title"
            error="Enter a project title."
          >
            {(p) => (
              <UI.TextInput
                {...p}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </UI.Field>
        </>
      );
    case "Article":
      return (
        <UI.Article
          title={o.text}
          titleLevel={2}
          eyebrow="Field notes / 001"
          summary="Good interfaces give careful work room to breathe."
          metadata="Design journal · 4 min read"
          aside={<p>A note on the practice of making things understandable.</p>}
        >
          <h3>A place for the work</h3>
          <p>
            Start with a clear purpose, readable text, and controls that behave
            as people expect. Let the content establish the rhythm.
          </p>
          <p>
            A component is useful when it carries those decisions into the next
            project.
          </p>
        </UI.Article>
      );
    case "TableOfContents":
      return (
        <>
          <UI.TableOfContents
            variant={o.tocVariant}
            items={[
              { id: "example-purpose", label: "Purpose" },
              { id: "example-practice", label: "Practice", depth: 3 },
            ]}
          />
          <h2 id="example-purpose" tabIndex={-1}>
            Purpose
          </h2>
          <p>A small set of explicit choices.</p>
          <h3 id="example-practice" tabIndex={-1}>
            Practice
          </h3>
          <p>Build, observe, and refine with real content.</p>
        </>
      );
    case "Pagination":
      return (
        <>
          <p>
            Showing project {(page - 1) * 5 + 1}–{page * 5} of 20.
          </p>
          <UI.Pagination
            page={page}
            pageCount={4}
            onPageChange={setPage}
            disabled={o.disabled}
          />
        </>
      );
    case "DefinitionList":
      return (
        <UI.DefinitionList
          items={[
            { id: "project", term: "Project", description: o.text },
            {
              id: "license",
              term: "License",
              description: "MIT · freely available",
            },
            {
              id: "status",
              term: "Status",
              description: "Experimental API",
            },
          ]}
        />
      );
    case "Tabs":
      return (
        <UI.Tabs
          label="Project information"
          value={tab}
          onValueChange={setTab}
          orientation={o.vertical ? "vertical" : "horizontal"}
          items={[
            { id: "overview", label: "Overview", content: <p>{o.text}</p> },
            {
              id: "details",
              label: "Details",
              content: (
                <p>
                  Manual activation keeps focus and selection separate. Use
                  Enter or Space to open a focused tab.
                </p>
              ),
            },
            {
              id: "unavailable",
              label: "Unavailable",
              disabled: true,
              content: <p>Unavailable</p>,
            },
          ]}
        />
      );
    default:
      return null;
  }
}
const q = JSON.stringify;
const attr = (value: string) => `{${q(value)}}`;
export function exampleCode(name: string, o: Options, family: string) {
  let imports = [name];
  let state = "";
  let body = "";
  const disabled = o.disabled ? " disabled" : "";
  const error = o.invalid ? ' error="Add a title before continuing."' : "";
  switch (name) {
    case "Button":
      state = "const [count, setCount] = useState(0);";
      body = `<><Button variant=${attr(o.variant)}${disabled} onClick={() => setCount(count + 1)}>{${q(o.text)}}</Button><p role="status">Activated {count} times.</p></>`;
      break;
    case "TextInput":
    case "Textarea":
    case "Select":
    case "FileInput":
    case "Field": {
      const c = name === "Field" ? "TextInput" : name;
      imports = [...new Set(["Field", c])];
      if (c !== "FileInput") state = 'const [value, setValue] = useState("");';
      body = `<Field label="Project title" hint="Use a short, descriptive title."${error}>\n  {props => <${c} {...props}${disabled}${c === "FileInput" ? ' accept=".txt,.md"' : ` value={value} onChange={event => setValue(event.target.value)}`}${c === "Textarea" ? " rows={3}" : ""}${["TextInput", "Textarea"].includes(c) ? ` placeholder=${attr(o.text)}` : ""}${c === "Select" ? '><option value="">Choose a project</option><option value="journal">Field journal</option><option value="archive">Design archive</option></Select>' : " />"}}\n</Field>`;
      break;
    }
    case "Switch":
    case "Checkbox":
      state = "const [checked, setChecked] = useState(false);";
      body = `<${name} label=${attr(o.text)} checked={checked} onChange={event => setChecked(event.target.checked)}${disabled} />`;
      break;
    case "Radio":
      imports = ["Fieldset", "Radio"];
      state = 'const [density, setDensity] = useState("");';
      body = `<Fieldset legend="Reading density"${disabled}${error}>\n  {['Comfortable', 'Compact'].map(label => <Radio key={label} name="density" label={label} value={label} checked={density === label} onChange={event => setDensity(event.target.value)} />)}\n</Fieldset>`;
      break;
    case "Fieldset":
      imports = ["Fieldset", "Checkbox"];
      body = `<Fieldset legend=${attr(o.text)} hint="Choose the details to include."${disabled}${error}><Checkbox label="Include summary" /><Checkbox label="Include references" defaultChecked /></Fieldset>`;
      break;
    case "Notice":
      body = `<Notice kind=${attr(o.kind)}>{${q(o.text)}}</Notice>`;
      break;
    case "Badge":
      body = `<Badge>{${q(o.text)}}</Badge>`;
      break;
    case "DataTable":
      body = `<DataTable caption=${attr(o.text)}><thead><tr><th scope="col">Project</th><th scope="col">Status</th></tr></thead><tbody><tr><th scope="row">Field journal</th><td>In review</td></tr></tbody></DataTable>`;
      break;
    case "Disclosure":
      body = `<Disclosure summary=${attr(o.text)}><p>Optional context belongs here.</p></Disclosure>`;
      break;
    case "Dialog":
      imports = ["Button", "Dialog"];
      state = "const [open, setOpen] = useState(false);";
      body = `<><Button${disabled} onClick={() => setOpen(true)}>Open dialog</Button><Dialog open={open} title=${attr(o.text)} onDismiss={() => setOpen(false)}><p>Your changes are still available.</p><Button autoFocus onClick={() => setOpen(false)}>Close dialog</Button></Dialog></>`;
      break;
    case "ErrorSummary":
      imports = ["Button", "ErrorSummary", "Field", "TextInput"];
      state = "const summary = useRef(null);";
      body = `<><Button onClick={() => summary.current?.focus()}>Focus error summary</Button><ErrorSummary ref={summary} title=${attr(o.text)} errors={[{message: 'Enter a project title.', targetId: 'project-title'}]} /><Field id="project-title" label="Project title" error="Enter a project title.">{props => <TextInput {...props} />}</Field></>`;
      break;
    case "Article":
      body = `<Article title=${attr(o.text)} titleLevel={2} eyebrow="Field notes / 001" summary="Good interfaces give careful work room to breathe." metadata="Design journal · 4 min read" aside={<p>A note on making things understandable.</p>}><h3>A place for the work</h3><p>Start with a clear purpose and readable text.</p></Article>`;
      break;
    case "TableOfContents":
      body = `<><TableOfContents variant=${attr(o.tocVariant)} items={[{id: 'purpose', label: 'Purpose'}, {id: 'practice', label: 'Practice', depth: 3}]} /><h2 id="purpose" tabIndex={-1}>Purpose</h2><p>A small set of explicit choices.</p><h3 id="practice" tabIndex={-1}>Practice</h3><p>Build, observe, and refine.</p></>`;
      break;
    case "Pagination":
      state = "const [page, setPage] = useState(1);";
      body = `<Pagination page={page} pageCount={4} onPageChange={setPage}${disabled} />`;
      break;
    case "DefinitionList":
      body = `<DefinitionList items={[{id: 'project', term: 'Project', description: ${q(o.text)}}, {id: 'license', term: 'License', description: 'MIT · freely available'}]} />`;
      break;
    case "Tabs":
      state = 'const [tab, setTab] = useState("overview");';
      body = `<Tabs label="Project information" value={tab} onValueChange={setTab} orientation="${o.vertical ? "vertical" : "horizontal"}" items={[{id: 'overview', label: 'Overview', content: <p>{${q(o.text)}}</p>}, {id: 'details', label: 'Details', content: <p>Use Enter or Space to activate a focused tab.</p>}, {id: 'unavailable', label: 'Unavailable', disabled: true, content: null}]} />`;
      break;
    case "AppShell":
      body = `<AppShell navigationLabel="Project navigation" navigationPlacement=${attr(o.navigation)} brand="Project journal" navigation={<a href="/" aria-current="page">Overview</a>} utilities={<span>Workspace</span>}><h1>Your project, in view.</h1><p>Use one shell per document.</p></AppShell>`;
      break;
  }
  const hooks = state.startsWith("const summary")
    ? "useRef"
    : state
      ? "useState"
      : "";
  return `${hooks ? `import { ${hooks} } from 'react';\n` : ""}import { ${imports.join(", ")} } from '@${family}/react';\nimport '@${family}/react/styles.css';\nimport '@${family}/core/fonts.css';\n\nexport default function Example() {\n${state ? `  ${state}\n` : ""}  return (\n    <div className="${family}" data-${family}="light">\n      ${body}\n    </div>\n  );\n}\n`;
}
