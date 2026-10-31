import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
const [family, target, commit] = process.argv.slice(2);
if (
  !["martlet", "krigsvold"].includes(family) ||
  !target ||
  !/^\/[\w/.-]+$/.test(target) ||
  !commit ||
  !/^[a-f0-9]{40}$/.test(commit)
)
  throw new Error(
    "Usage: node scripts/stage-docs.mjs family /absolute/target full-source-commit",
  );
const manifest = JSON.parse(
  await readFile(join(target, ".openai/hosting.json"), "utf8"),
);
if (!manifest.project_id || manifest.static?.directory !== "dist")
  throw new Error("Register this static Site before staging");
if (resolve(target) === resolve("."))
  throw new Error("Use a separate static Site checkout");
await rm(join(target, "dist"), { recursive: true, force: true });
await cp(`docs-dist/${family}`, join(target, "dist"), { recursive: true });
await mkdir(join(target, "dist/licenses"), { recursive: true });
const dependencies = [
  "react",
  "react-dom",
  `@${family}/theme`,
  `@${family}/core`,
  ...(family === "martlet"
    ? [
        "@fontsource/cambo",
        "@fontsource/cinzel",
        "@fontsource/lato",
        "@fontsource/ibm-plex-mono",
      ]
    : [
        "@fontsource/roboto",
        "@fontsource/roboto-slab",
        "@fontsource/roboto-mono",
      ]),
];
for (const pkg of dependencies) {
  const name = pkg.replaceAll("/", "-").replace("@", "");
  await cp(
    `node_modules/${pkg}/LICENSE`,
    join(target, `dist/licenses/${name}.txt`),
  );
}
await cp("LICENSE", join(target, "dist/licenses/workbench.txt"));
await cp(
  `packages/${family}-react/NOTICE.md`,
  join(target, "dist/licenses/NOTICE.md"),
);
await writeFile(
  join(target, "dist/source.json"),
  JSON.stringify(
    {
      repository: "https://github.com/k3jph/design-workbench",
      commit,
      family,
      version: "0.1.0",
      license: "MIT",
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  join(target, "README.md"),
  `# ${family} React reference\n\nIndependent static React documentation build from https://github.com/k3jph/design-workbench/tree/${commit}.\n\nReproduce: npm ci --ignore-scripts, npm run build, npm run build:docs. Stage with scripts/stage-docs.mjs.\n\nThe other design family and the local administration API are not bundled. Font and runtime licenses are in dist/licenses.\n`,
);
console.log(
  JSON.stringify({ family, target, project_id: manifest.project_id, commit }),
);
