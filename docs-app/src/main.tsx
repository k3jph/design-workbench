import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  family,
  familyName,
  Button,
  Field,
  TextInput,
  Select,
  Checkbox,
  Switch,
  AppShell,
  Badge,
} from "docs-family";
import contracts from "./contracts.json";
import delivery from "docs-distribution";
import { defaults, Example, exampleCode, type Options } from "./examples";
import "./shared.css";
import { CollectionPattern } from "docs-pattern";
import { LanguageGuide } from "./language-guide";
import {ResearchProject} from "./research-project";
import { ReferencePatterns } from './lab/patterns';

import { repo, sharedContractRepo, implementationVersion, implementationSourceCommit, groups, descriptions } from "./data";
import {
  FamilyLayout,
  ComponentPage,
  FamilyHome,
  familyMark,
} from "docs-layout";
function initialMode() {
  const requested = new URLSearchParams(location.search).get("mode");
  if (requested === "light" || requested === "dark") return requested;
  try {
    return localStorage.getItem(`docs-${family}-mode`) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}
function PatternShowcase({ mode }: { mode: string }) {
  const [width, setWidth] = useState("full");
  return (
    <>
      <div className="pattern-inspection">
        <Field label="Available width">
          {(p) => (
            <Select
              {...p}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            >
              <option value="full">Use available space</option>
              <option value="320">320px / narrow workspace</option>
              <option value="768">768px / medium workspace</option>
            </Select>
          )}
        </Field>
        <a href={`?workspace=1&mode=${mode}`}>Open a focused workspace ↗</a>
        <a href="?page=language">Read the pattern’s rules →</a>
      </div>
      <iframe
        data-pattern-preview
        title={`${familyName} collection working pattern`}
        className="pattern-frame"
        style={{ inlineSize: width === "full" ? "100%" : `${width}px` }}
        src="?workspace=1"
      />
    </>
  );
}
function CopyCode({ code, label = "React / JSX" }: { code: string; label?: string }) {
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setMessage(""), [code]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Example copied.");
    } catch {
      ref.current?.focus();
      ref.current?.select();
      setMessage("Select and copy the example with your keyboard.");
    }
  }
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{label}</span>
        <Button variant="quiet" onClick={copy}>
          Copy example
        </Button>
      </div>
      <textarea
        ref={ref}
        aria-label="Copyable example source"
        readOnly
        value={code}
        spellCheck={false}
      />
      <p role="status">{message}</p>
    </div>
  );
}
function Playground({ name, mode }: { name: string; mode: string }) {
  const [o, setO] = useState<Options>(defaults);
  const [reset, setReset] = useState(0);
  const change = <K extends keyof Options>(key: K, value: Options[K]) =>
    setO((previous) => ({ ...previous, [key]: value }));
  const disabled = [
    "Button",
    "TextInput",
    "Textarea",
    "Select",
    "FileInput",
    "Field",
    "Checkbox",
    "Radio",
    "Switch",
    "Fieldset",
    "Dialog",
    "Pagination",
  ].includes(name);
  const invalid = [
    "TextInput",
    "Textarea",
    "Select",
    "FileInput",
    "Field",
    "Fieldset",
    "Radio",
  ].includes(name);
  const text = ![
    "AppShell",
    "Select",
    "FileInput",
    "Radio",
    "Pagination",
    "TableOfContents",
  ].includes(name);
  return (
    <>
      <div className="playground" id="playground">
        <div className="preview-label">
          <span>Live specimen</span>
          <span>{familyName}</span>
        </div>
        <div className="specimen" data-testid="specimen">
          <Example key={reset} name={name} options={o} mode={mode} />
        </div>
        <div className="controls">
          <div className="control-heading">
            <h3>Make it yours</h3>
            <Button
              variant="quiet"
              onClick={() => {
                setO(defaults);
                setReset(reset + 1);
              }}
            >
              Reset example
            </Button>
          </div>
          <div className="control-grid">
            {name === "TableOfContents" && (
              <Field label="Contents layout">
                {(p) => <Select {...p} value={o.tocVariant} onChange={(e) => change("tocVariant", e.target.value as Options["tocVariant"])}>
                  <option value="index">Document index</option>
                  <option value="inline">Inline article contents</option>
                </Select>}
              </Field>
            )}
            {name === "AppShell" && (
              <Field label="Navigation placement">
                {(p) => (
                  <Select
                    {...p}
                    value={o.navigation}
                    onChange={(e) =>
                      change(
                        "navigation",
                        e.target.value as Options["navigation"],
                      )
                    }
                  >
                    {["default", "top", "side", "none"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            {text && (
              <Field
                label={
                  ["TextInput", "Textarea", "Field"].includes(name)
                    ? "Placeholder"
                    : "Text"
                }
              >
                {(p) => (
                  <TextInput
                    {...p}
                    value={o.text}
                    maxLength={160}
                    onChange={(e) => change("text", e.target.value)}
                  />
                )}
              </Field>
            )}
            {name === "Button" && (
              <Field label="Variant">
                {(p) => (
                  <Select
                    {...p}
                    value={o.variant}
                    onChange={(e) =>
                      change("variant", e.target.value as Options["variant"])
                    }
                  >
                    {["primary", "secondary", "quiet"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            {name === "Notice" && (
              <Field label="Kind">
                {(p) => (
                  <Select
                    {...p}
                    value={o.kind}
                    onChange={(e) =>
                      change("kind", e.target.value as Options["kind"])
                    }
                  >
                    {["info", "success", "error"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
            {disabled && (
              <Checkbox
                label="Disabled"
                checked={o.disabled}
                onChange={(e) => change("disabled", e.target.checked)}
              />
            )}{" "}
            {invalid && (
              <Checkbox
                label="Show error"
                checked={o.invalid}
                onChange={(e) => change("invalid", e.target.checked)}
              />
            )}{" "}
            {name === "Tabs" && (
              <Switch
                label="Vertical tabs"
                checked={o.vertical}
                onChange={(e) => change("vertical", e.target.checked)}
              />
            )}
          </div>
        </div>
      </div>
      <h2 id="example">Bring it into your project</h2>
      <p>
        This is a standalone composition using the package API. Local example
        state resets when you leave this page.
      </p>
      <CopyCode code={exampleCode(name, o, family)} />
    </>
  );
}
function Start() {
  return (
    <article className="reference-page">
      <p className="eyebrow">Design language 0.3 preview · React {implementationVersion}</p>
      <h2>
        A small beginning.
        <br />A real foundation.
      </h2>
      <p className="lead">
        {familyName} React is an experimental, MIT-licensed component library.
        Explore the components here, then follow the installation instructions for the verified release.
      </p>
      <div className="callout">
        <strong>{delivery.packages.React.published && delivery.packages.React.version===implementationVersion ? `Experimental ${implementationVersion} · published on npm` : `React ${implementationVersion} release candidate · registry publication pending`}</strong>
        <p>
          Every export remains experimental. Verify the family and version before adopting it; publication does not establish stability.
        </p>
      </div>
      <h2>Install in a React 19 project</h2>
      {delivery.packages.React.published && delivery.packages.React.version===implementationVersion
        ? <CopyCode label="Terminal" code={delivery.packages.React.install} />
        : <p>Registry publication of this reference version is not yet verified. Use the independently pinned source below; current public release status is recorded on the <a href={`${delivery.home}/agents/`}>agent setup page</a>.</p>}
      <p>The API remains experimental. Published installation commands appear only after this exact reference version is verified.</p>
      <h2>Reproduce from source</h2>
      <p>
        Use Node 24.19 or later within Node 24. The packages target React 19 and
        ship ES modules, declarations, and CSS.
      </p>
      <CopyCode label="Terminal"
        code={`git clone ${repo}.git\ncd react\ngit checkout ${implementationSourceCommit}\nnpm ci --ignore-scripts\nnpm run build\nnpm test\nnpm pack --ignore-scripts\n\n# In a separate React 19 project, use the generated tarball:\nnpm install /absolute/path/to/${family}-react-${implementationVersion}.tgz`}
      />
      <h2>Import components and styles</h2>
      <CopyCode
        code={`import { Button } from '@${family}/react';\nimport '@${family}/react/styles.css';\nimport '@${family}/core/fonts.css';\n\n<Button onClick={() => console.log('Ready')}>Continue</Button>`}
      />
      <h2>Choose a color mode</h2>
      <p>
        Place the family class and <code>data-{family}</code> on a shared
        ancestor. Mode selection belongs to your application.
      </p>
      <CopyCode
        code={`<div className="${family}" data-${family}="light">\n  <Button>Continue</Button>\n</div>`}
      />
      <h2>Use the native contract</h2>
      <p>
        Keep visible labels, meaningful button text, unique IDs, and coherent
        headings. Use native browser controls where the API provides them. The
        library supplies component behavior; your application supplies
        validation, routing, data, and focus after operations.
      </p>
      <h2>Know the boundary</h2>
      <p>
        Automated rendering, browser, keyboard, and accessibility checks are
        part of development. Manual screen-reader review, localization, RTL
        behavior, and sustained production use remain open validation work.
        Every export is experimental. The <a href={sharedContractRepo}>shared workbench</a> owns the cross-family recipe/behavior contracts and conformance harness; the standalone repository owns this React implementation.
      </p>
      <p>
        <a
          href={`${repo}/blob/${implementationSourceCommit}/README.md`}
        >
          Read the standalone source and release contract ↗
        </a>
      </p>
    </article>
  );
}
function ShellExample() {
  const mode =
    new URLSearchParams(location.search).get("mode") === "dark"
      ? "dark"
      : "light";
  return (
    <div className={family} {...{ [`data-${family}`]: mode }}>
      <AppShell
        navigationLabel="Project navigation"
        navigationPlacement={
          (["top", "side", "none"].includes(
            new URLSearchParams(location.search).get("navigation") ?? "",
          )
            ? new URLSearchParams(location.search).get("navigation")
            : "default") as Options["navigation"]
        }
        brand="Project journal"
        navigation={
          <a href="?shell=1" aria-current="page">
            Overview
          </a>
        }
        utilities={<Badge>Workspace</Badge>}
      >
        <div style={{ padding: "2rem" }}>
          <h2>Your project, in view.</h2>
          <p>One shell. A clear path to the work.</p>
        </div>
      </AppShell>
    </div>
  );
}
function Agents() {
  const endpoint=delivery.mcp.url;
  return <article className="reference-page">
    <p className="reference-kicker">Authoritative context / Practical method</p>
    <h2>Build with {familyName}.</h2>
    <p className="lead">Connect the read-only MCP to retrieve the same grammar, patterns, actual APIs and builder method used by this reference.</p>
    <div className="callout"><strong>{delivery.mcp.published ? 'Hosted MCP · experimental knowledge' : 'Hosted MCP release in preparation'}</strong><p>Each family is independent. These tools search and retrieve public design guidance; they have no access to the workbench database, user drafts or write operations.</p></div>
    <h2>One endpoint</h2><CopyCode label="MCP endpoint" code={endpoint} />
    <p>No authentication is required for the public knowledge endpoint. Choose the family you intend to use.</p>
    <h2>ChatGPT</h2><p>Open Plugins, use the plus button and choose Add custom MCP server. Enter the endpoint, choose No authentication, review the connection and create the plugin. Install it, then select it with @ in a new conversation. Workspace policy may restrict custom connections.</p>
    <h2>Claude</h2><p>Open Customize → Connectors, add a custom Web connector and enter the endpoint. Choose No sign in, then enable the connector in your conversation. Team and Enterprise owners may need to add it first.</p>
    <h2>Claude Code</h2><CopyCode label="Terminal" code={`claude mcp add --transport http ${family}-design-language ${endpoint}`} />
    <h2>Retrieve the method with the rules</h2><CopyCode label="Agent workflow" code={`Call get_manifest and confirm family=${family}.\nRetrieve get_reference({id:"builder-skill"}) and get_reference({id:"grammar"}).\nSearch for the task, then retrieve complete patterns, component contracts and examples.\nBuild the requested interface and verify its complete state and keyboard transitions.`} />
    <p>The MCP includes the builder method as a complete reference, so an agent can retrieve it without a local download. Installing a reusable skill is an additional client capability, not an MCP protocol feature.</p>
    <h2>Optional installed skill or offline server</h2>
    <p><a href={`agents/${family}-builder.zip`} download>Download {familyName} builder skill</a> · <a href={`agents/${family}-agent-tools.tar.gz`} download>Download offline MCP and skill</a></p>
    <p>Use your client’s supported skill upload or skills directory. The offline archive runs with Node 24: extract, run npm ci --ignore-scripts, and configure a stdio client to launch its index.mjs. Do not use a local file path as a remote endpoint.</p>
    <h2>Verification and limits</h2><p>The SDK client checks modern and legacy HTTP negotiation, exact retrieval, hashes, family isolation, unsupported requests and offline installation. These checks do not establish successful installation in every ChatGPT or Claude account. Grammar 0.3, React {implementationVersion} and new application compositions remain experimental; manual assistive technology, RTL and sustained use remain open.</p>
    <p><a href={`${delivery.home}/agents/`}>Public setup and publication status ↗</a> · <a href="?page=language">Read the grammar →</a></p>
  </article>;
}
function App() {
  const params = new URLSearchParams(location.search);
  const name = params.get("component");
  const start = params.get("page") === "start";
  const pattern =
    params.get("page") === "collection" || params.has("workspace");
  const language = params.get("page") === "language";
  const referencePatterns = params.get('page') === 'patterns';
  const research = params.get("page") === "research";
  const agents = params.get("page") === "agents";
  const contract = contracts.find((item) => item.name === name);
  const [mode, setMode] = useState(initialMode);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const followMode = (event: StorageEvent) => {
      if (
        event.key === `docs-${family}-mode` &&
        (event.newValue === "light" || event.newValue === "dark")
      )
        setMode(event.newValue);
    };
    window.addEventListener("storage", followMode);
    return () => window.removeEventListener("storage", followMode);
  }, []);
  useEffect(() => {
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.append(icon);
    }
    icon.href = familyMark;
    document.title = `${contract?.name ?? (research ? "Research project" : agents ? "Agent tools" : referencePatterns ? "Reference patterns" : pattern ? "Working patterns" : language ? "Design language" : start ? "Getting started" : "The collection")} · ${familyName} React`;
    document.documentElement.style.colorScheme = mode;
    try {
      localStorage.setItem(`docs-${family}-mode`, mode);
    } catch {}
  }, [mode, contract, start, pattern, language, agents, referencePatterns, research]);
  if (params.has("shell")) return <ShellExample />;
  if (params.has("workspace"))
    return (
      <div
        className={`${family} focused-pattern`}
        {...{ [`data-${family}`]: mode }}
      >
        <a href="?page=collection">← Pattern reference</a>
        <main id="main">
          <CollectionPattern />
        </main>
      </div>
    );
  const filtered = Object.entries(groups)
    .map(
      ([group, names]) =>
        [
          group,
          names.filter((item) =>
            `${item} ${descriptions[item]}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
        ] as const,
    )
    .filter(([, names]) => names.length);
  const directory = (
    <div className="component-directory">
      <Field label="Find a component">
        {(p) => (
          <TextInput
            {...p}
            type="search"
            value={query}
            placeholder="Search components"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
          />
        )}
      </Field>
      <div className="directory-links">
        {filtered.map(([group, names]) => (
          <section key={group}>
            <h2>{group}</h2>
            {names.map((item) => (
              <a
                key={item}
                href={`?component=${item}`}
                aria-current={name === item ? "page" : undefined}
              >
                {item}
              </a>
            ))}
          </section>
        ))}
        {!filtered.length && (
          <p role="status">No components found. Try another name.</p>
        )}
      </div>
    </div>
  );
  const api = (
    <>
      <h2 id="api" tabIndex={-1}>
        API & composition
      </h2>
      <p>{contract?.api}</p>
    </>
  );
  const accessibility = (
    <>
      <h2 id="accessibility" tabIndex={-1}>
        States, keyboard & accessibility
      </h2>
      <p>{contract?.behavior}</p>
      <p>
        Check the complete composition with your content, errors and assistive
        technology. Every export remains experimental.
      </p>
    </>
  );
  return (
    <div className={family} {...{ [`data-${family}`]: mode }}>
      <FamilyLayout
        mode={mode}
        onModeChange={() => setMode(mode === "light" ? "dark" : "light")}
        directory={directory}
        page={
          research ? "research" : agents
            ? "agents"
            : pattern
              ? "collection"
              : referencePatterns ? 'patterns' : language
                ? "language"
                : start
                  ? "start"
                  : name
                    ? "component"
                    : "home"
        }
      >
        {contract ? (
          <ComponentPage
            name={contract.name}
            description={descriptions[contract.name]}
            category={
              Object.entries(groups).find(([, names]) =>
                names.includes(contract.name),
              )?.[0] ?? "Components"
            }
            playground={
              <Playground
                key={contract.name}
                name={contract.name}
                mode={mode}
              />
            }
            api={api}
            accessibility={accessibility}
          />
        ) : research ? (
          <ResearchProject />
        ) : agents ? (
          <Agents />
        ) : pattern ? (
          <PatternShowcase mode={mode} />
        ) : referencePatterns ? (
          <ReferencePatterns />
        ) : language ? (
          <LanguageGuide />
        ) : start ? (
          <Start />
        ) : name ? (
          <article>
            <h2>Component not found</h2>
            <p>Choose a component from the index.</p>
            <a href="?">Back to the collection</a>
          </article>
        ) : (
          <FamilyHome />
        )}
      </FamilyLayout>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
