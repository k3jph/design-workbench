import { readFile, writeFile, mkdir, cp, rm, mkdtemp } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { transformSync } from "rolldown/utils";
const guidanceCheck = spawnSync(process.execPath, ['scripts/sync-language.mjs', '--check'], {stdio:'inherit'});
if (guidanceCheck.status) throw new Error('Canonical guidance check failed');
const hash = (s) => createHash("sha256").update(s).digest("hex");
const commit = process.env.DESIGN_SOURCE_COMMIT ?? null;
if (commit !== null && !/^[a-f0-9]{40}$/.test(commit))
  throw new Error("DESIGN_SOURCE_COMMIT must be a full commit");
const repo = "https://github.com/k3jph/design-workbench";
const ref = commit ?? "work/registry-foundations";
const distribution=JSON.parse(await readFile("docs/distribution.json","utf8"));
const componentSource = await readFile("docs/components.md", "utf8");
const contracts = componentSource
  .split("## Administration compositions")[0]
  .split("\n")
  .filter((l) => /^\| [A-Z]/.test(l) && !l.startsWith("| Export"))
  .map((l) => {
    const [name, api, behavior] = l.slice(2, -2).split(" | ");
    return { name, api, behavior };
  });
await mkdir("mcp/catalogs", { recursive: true });
await mkdir("agent-dist", { recursive: true });
await mkdir("test-results", { recursive: true });
for (const family of ["martlet", "krigsvold"]) {
  const canonical = JSON.parse(await readFile(`docs/languages/${family}/canonical.json`, 'utf8'));
  const implementations = JSON.parse(await readFile(`docs/languages/${family}/implementation.json`, 'utf8'));
  const canonicalUrl = path => `https://github.com/${canonical.repository}/blob/${canonical.commit}/${path}`;
  const delivery=distribution.families[family];
  await writeFile(`mcp/catalogs/${family}-distribution.json`, JSON.stringify(delivery,null,2)+"\n");
  const entries = [];
  function add(
    id,
    kind,
    title,
    content,
    path,
    tags = [],
    maturity = "experimental",
  ) {
    entries.push({
      id,
      kind,
      title,
      tags,
      maturity,
      source: /^(npm:|https:\/\/)/.test(path) ? path : `${repo}/blob/${ref}/${path}`,
      sourcePath: path,
      contentSha256: hash(content),
      content,
    });
  }
  add("builder-skill","skill",`${family} builder method`,await readFile(`skills/${family}-builder/SKILL.md`,"utf8"),`skills/${family}-builder/SKILL.md`,["method","workflow","builder","skill"]);
  add("platform:Astro","platform",`${family} Astro API and composition`,await readFile(`skills/${family}-builder/references/astro.md`,"utf8"),`skills/${family}-builder/references/astro.md`,["Astro","API","slots","imports","contents","footer","print"]);
  add("platform:React","platform",`${family} React installation and actual component route`,await readFile(`skills/${family}-builder/references/react-setup.md`,"utf8"),`skills/${family}-builder/references/react-setup.md`,["React","install","npm","tarball","setup","available","package","checksum"]);
  for (const [id,name,title] of [["platform:HTML","native-html.md","Direct HTML class anatomy"],["styling:forms","form-styling.md","Native HTML form styling and states"]]) add(id,"platform",`${family} ${title}`,await readFile(`docs/languages/${family}/${name}`,"utf8"),canonicalUrl(canonical.files[name].sourcePath),["HTML","Astro","forms","CSS","classes","field","error","dialog","styling"]);
  const grammar = await readFile(`docs/languages/${family}/grammar.md`, "utf8");
  add(
    "grammar",
    "grammar",
    `${family} application grammar`,
    grammar,
    canonicalUrl('docs/grammar.md'),
    [
      "spacing",
      "density",
      "interaction",
      "hierarchy",
      "composition",
      "forms",
      "feedback",
    ],
  );
  add(
    "charter",
    "charter",
    `${family} adopted charter`,
    await readFile(`docs/languages/${family}/charter.md`, "utf8"),
    `docs/languages/${family}/charter.md`,
    ["principles", "language"],
    "adopted",
  );
  add(
    "decisions", "grammar", `${family} source decisions and application extensions`,
    await readFile(`docs/languages/${family}/decisions.md`, "utf8"),
    canonicalUrl('docs/source-decisions.md'),
    ["origin", "source", "typography", "navigation", "contents", "provenance"],
  );
  add(
    "pattern:collection-editor",
    "pattern",
    `${family} collection, reading and editing pattern`,
    grammar.slice(grammar.indexOf("## Working pattern:")),
    canonicalUrl('docs/grammar.md'),
    [
      "Cardfile",
      "notebook",
      "notes",
      "collection",
      "editor",
      "search",
      "filter",
      "save",
      "validation",
      "recovery",
      "undo",
      "draft",
    ],
  );
  for (const [id,kind,title,path] of [
    ['pattern:validated-form','pattern','Validated form, error recovery and changed reset','forms.md'],
    ['pattern:query-results','pattern','Applied query, results, selection and modal recovery','query-results.md'],
    ['coverage','grammar','Grammar coverage, corrections and open evidence','coverage.md'],
  ]) add(id,kind,`${family} ${title}`,await readFile(`docs/languages/${family}/${path}`,'utf8'),canonicalUrl(canonical.files[path].sourcePath),['forms','validation','query','selection','scope','pending','recovery','coverage']);
  const tmp = await mkdtemp(resolve("test-results/knowledge-"));
  try {
    const source = (
      await readFile("docs-app/src/examples.tsx", "utf8")
    ).replace(/(['"])docs-family\1/g, JSON.stringify(`@${family}/react`));
    const transformed = transformSync("examples.tsx", source, {
      lang: "tsx",
      jsx: { runtime: "automatic" },
      target: "es2022",
    });
    if (transformed.errors.length)
      throw new Error("Example compilation failed");
    const path = join(tmp, "examples.mjs");
    await writeFile(path, transformed.code);
    const { exampleCode, defaults } = await import(pathToFileURL(path));
    for (const c of contracts) {
      add(
        `component:${c.name}`,
        "component",
        `${c.name} API and behavior`,
        `${c.name}\n\n${c.api}\n\n${c.behavior}`,
        "docs/components.md",
        [c.name, "React", "API", "keyboard", "accessibility"],
      );
      add(
        `example:${c.name}`,
        "example",
        `${c.name} standalone React example`,
        exampleCode(c.name, defaults, family),
        "docs-app/src/examples.tsx",
        [c.name, "React", "code", "imports"],
      );
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  for (const name of ["foundation", "layout", "tokens"])
    add(
      `tokens:${name}`,
      "tokens",
      `${family} theme 2.1.0 ${name}`,
      await readFile(`node_modules/@${family}/theme/dist/${name}.json`, "utf8"),
      `npm:@${family}/theme@2.1.0/${name}.json`,
      ["tokens", "colors", "typography", "spacing", "layout"],
      "published",
    );
  const provenance = JSON.parse(
    await readFile("docs-app/brand/provenance.json", "utf8"),
  )[family];
  add(
    "asset:mark",
    "asset",
    `${family} original system mark`,
    JSON.stringify(provenance, null, 2),
    "docs-app/brand/provenance.json",
    ["identity", "icon", "logo", "mark"],
    "source-original",
  );
  add(
    "compatibility",
    "compatibility",
    `${family} support and compatibility`,
    `React 0.1.0 is experimental; React 19 and @${family}/theme 2.1.0. Retrieve platform:React for the pinned npm install command and alternative immutable archive checksum; publication does not imply API stability. Retrieve platform:HTML and styling:forms for core native markup. Publication status is recorded separately from the immutable canonical guidance snapshot: ${JSON.stringify(delivery.packages)}. Component examples are React-specific; platform:Astro supplies a complete reading composition and the neutral starter route. Do not treat shared styling as an Astro controller. Do not translate React event or focus props into Astro APIs. Canonical migration guide: ${canonicalUrl('docs/consolidation.md')}. Vue, Svelte and native APIs are not implemented. Manual assistive technology, localization, RTL and sustained use remain open.\n\n${JSON.stringify(implementations,null,2)}`,
    "docs/maturity.md",
    ["platform", "version", "support", "migration"],
  );
  const sourceDigest = hash(
    entries.map((e) => `${e.id}:${e.contentSha256}`).join("\n"),
  );
  const catalog = {
    schemaVersion: 1,
    family,
    version: distribution.preview.version,
    themeVersion: "2.1.0",
    themeVersionRole: "React reference dependency; current core release is distribution.packages.core",
    grammarVersion: implementations.grammarVersion,
    sourceCommit: commit,
    sourceDigest,
    platforms: {
      React: { version: "0.1.0", maturity: "experimental", published: delivery.packages.React.published },
      Astro: { version: delivery.packages.Astro.version, maturity: "experimental", published: delivery.packages.Astro.published, examples: true, formController: "host-owned starter specimen", core: "^"+delivery.packages.core.version },
    },
    distribution: {...delivery, reviewedAt:distribution.reviewedAt},
    canonicalGuidance: canonical,
    limitations: [
      "Read-only stateless HTTP and local stdio; check distribution metadata for live endpoint status.",
      "Search and exact retrieval; no code audit or migration automation.",
      "Reference patterns cover collection/editor, validated forms and query/results; they are session-only specimens.",
      "No registry database, user drafts, or write operations.",
    ],
    entries,
  };
  await writeFile(
    `mcp/catalogs/${family}.json`,
    JSON.stringify(catalog, null, 2) + "\n",
  );
  const dir = `agent-dist/${family}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await cp("mcp/server.mjs", `${dir}/server.mjs`);
  await cp("mcp/language.mjs", `${dir}/language.mjs`);
  await cp(`mcp/catalogs/${family}.json`, `${dir}/catalog.json`);
  await writeFile(
    `${dir}/index.mjs`,
    `import { run } from './server.mjs';\nawait run('${family}',new URL('./catalog.json',import.meta.url));\n`,
  );
  await cp(`skills/${family}-builder`, `${dir}/${family}-builder`, {
    recursive: true,
  });
  await cp("LICENSE", `${dir}/LICENSE`);
  // Use the locked dependency set for the generated manifest as well, so the
  // install contract cannot silently drift from the audited archive lockfile.
  const lock = JSON.parse(await readFile("mcp/agent-lock.json", "utf8"));
  const dependencies = lock.packages?.[""]?.dependencies;
  if (!dependencies || typeof dependencies !== "object")
    throw new Error("Agent lockfile is missing root dependencies");
  await writeFile(
    `${dir}/package.json`,
    JSON.stringify(
      {
        name: `${family}-design-language-mcp`,
        version: distribution.preview.version,
        private: true,
        type: "module",
        license: "MIT",
        engines: { node: ">=24.19.0 <25" },
        dependencies,
      },
      null,
      2,
    ) + "\n",
  );
  lock.name = `${family}-design-language-mcp`;
  lock.packages[""].name = lock.name;
  await writeFile(
    `${dir}/package-lock.json`,
    JSON.stringify(lock, null, 2) + "\n",
  );
  await writeFile(
    `${dir}/README.md`,
    `# ${family} agent tools\n\nExperimental MIT local stdio MCP and companion builder skill. Source ${repo}/tree/${ref}; content digest ${sourceDigest}.\n\nRun npm install --ignore-scripts in this directory, then configure a stdio MCP client with command node and args [\"/absolute/path/to/index.mjs\"]. The client starts the process. The server exposes get_manifest, search_guidance, get_reference, and exact resources. Confirm the family using get_manifest.\n\nCopy ${family}-builder into your client's supported skills directory. Hosted setup and actual package availability are recorded by get_manifest; no static-audit or production-accessibility certification is claimed. This archive includes no workbench server or database.\n`,
  );
  const zipped=spawnSync("python3",[resolve("scripts/zip-reproducible.py"),resolve(dir,`${family}-builder`),resolve(`agent-dist/${family}-builder.zip`)]);
  if(zipped.status)throw Error("Skill zip failed");
  const packed = spawnSync("tar", [
    "--sort=name", "--mtime=@0", "--owner=0", "--group=0", "--numeric-owner",
    "--mode=u+rwX,go+rX,go-w", "-czf",
    resolve(`agent-dist/${family}-agent-tools.tar.gz`),
    "-C",
    resolve("agent-dist"),
    family,
  ]);
  if (packed.status) throw new Error("Agent archive failed");
  console.log(
    `${family}: ${entries.length} references, ${sourceDigest.slice(0, 12)}`,
  );
}
