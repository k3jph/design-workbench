import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  mkdtemp,
  mkdir,
  rm,
  readdir,
} from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { transformSync } from "rolldown/utils";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const contracts = JSON.parse(
  await readFile("docs-app/src/contracts.json", "utf8"),
);
await mkdir(resolve("test-results"), { recursive: true });
function compile(source, name) {
  const r = transformSync(name + ".tsx", source, {
    lang: "tsx",
    jsx: { runtime: "automatic" },
    target: "es2022",
  });
  assert.deepEqual(r.errors, [], name);
  return r.code;
}
for (const family of ["martlet", "krigsvold"]) {
  test(`${family} documentation covers the actual exports and every copied example compiles and renders`, async () => {
    const dir = await mkdtemp(resolve("test-results/docs-"));
    try {
      const exports = await import(`@${family}/react`);
      assert.deepEqual(
        contracts.map((c) => c.name).sort(),
        Object.keys(exports).sort(),
      );
      const source = (
        await readFile("docs-app/src/examples.tsx", "utf8")
      ).replace(/(['"])docs-family\1/g, JSON.stringify(`@${family}/react`));
      await writeFile(join(dir, "examples.mjs"), compile(source, "examples"));
      const { Example, exampleCode, defaults } = await import(
        pathToFileURL(join(dir, "examples.mjs"))
      );
      let i = 0;
      for (const contract of contracts) {
        assert.ok(contract.api.length > 30 && contract.behavior.length > 40);
        for (const options of [
          defaults,
          {
            ...defaults,
            text: 'A "quoted" <title> & {braces}\nSecond line',
            disabled: true,
            invalid: true,
            vertical: true,
            kind: "error",
            variant: "quiet",
          },
        ]) {
          assert.ok(
            renderToStaticMarkup(
              React.createElement(Example, { name: contract.name, options }),
            ).length > 0,
          );
          const copied = exampleCode(contract.name, options, family).replace(
            /^import '@[^']+\.css';\n/gm,
            "",
          );
          const path = join(dir, `copy-${i++}.mjs`);
          await writeFile(path, compile(copied, contract.name));
          const module = await import(pathToFileURL(path));
          const html = renderToStaticMarkup(
            React.createElement(module.default),
          );
          assert.ok(html.includes(`data-${family}="light"`));
        }
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  test(`${family} deployment contains only its selected component styles, fonts and no workbench service`, async () => {
    const other = family === "martlet" ? "krigsvold" : "martlet";
    const index=await readFile(`docs-dist/${family}/index.html`,'utf8');
    assert.ok(index.includes(`<noscript><main><h1>${family==='martlet'?'Martlet':'Krigsvold'} React component reference</h1>`),'JavaScript-off readers retain the correct family identity');
    assert.ok(index.includes('href="../examples/"'),'Static recipes remain discoverable without JavaScript');
    const dir = `docs-dist/${family}/assets`;
    const files = await readdir(dir);
    const css = (
      await Promise.all(
        files
          .filter((f) => f.endsWith(".css"))
          .map((f) => readFile(join(dir, f), "utf8")),
      )
    ).join("");
    const js = (
      await Promise.all(
        files
          .filter((f) => f.endsWith(".js"))
          .map((f) => readFile(join(dir, f), "utf8")),
      )
    ).join("");
    assert.ok(css.includes(`.${family}-button`));
    assert.ok(!css.includes(`.${other}-button`));
    assert.ok(!css.includes(`--${other}-`));
    assert.ok(
      !files.some((f) =>
        family === "martlet"
          ? f.startsWith("roboto")
          : /^(cambo|cinzel|lato|ibm-plex)/.test(f),
      ),
    );
    assert.ok(!js.includes("/api/components"));
    assert.ok(!js.includes("node:sqlite"));
    assert.ok(!js.includes(`@${other}/react`));
  });
}

for (const family of ["martlet", "krigsvold"]) {
  test(`${family} reference uses its native shell, page composition, original mark and token colors`, async () => {
    const dir = await mkdtemp(resolve("test-results/docs-layout-"));
    try {
      // Reproduce Vite's selected-family/distribution virtual modules for SSR.
      await writeFile(join(dir,'family.mjs'),`export * from '@${family}/react';export const family=${JSON.stringify(family)};`);
      await writeFile(join(dir,'distribution.mjs'),`export default ${await readFile(`mcp/catalogs/${family}-distribution.json`,'utf8')};`);
      const dataSource=(await readFile('docs-app/src/data.ts','utf8'))
        .replace(/from ['"]docs-family['"]/g,"from './family.mjs'")
        .replace(/from ['"]docs-distribution['"]/g,"from './distribution.mjs'");
      await writeFile(join(dir,'data.mjs'),compile(dataSource,'data'));
      const adapter=(await readFile('docs-app/src/shell/AstroShell.tsx','utf8'))
        .replace(/^import .* from ['"][^'"]+\.svg['"];?$/gm,line=>`const ${line.split(' ')[1]} = '/'+${JSON.stringify(family)}+'-mark.svg';`)
        .replace(/from ['"]\.\.\/data['"]/g,"from './data.mjs'")
        .replace(/^import ['"][^'"]+\.css['"];?$/gm,'');
      await writeFile(join(dir,'adapter.mjs'),compile(adapter,'adapter'));
      const source = (
        await readFile(`docs-app/src/layouts/${family}.tsx`, "utf8")
      )
        .replace(/from ['"]\.\.\/shell\/AstroShell['"]/g,"from './adapter.mjs'")
        .replace(/^import chrome from [^;]+;/m,`const chrome=${await readFile(`docs-app/src/shell/${family}/chrome.json`,'utf8')};`)

        .replace(/(["'])docs-family\1/g, JSON.stringify(`@${family}/react`))
        .replace(
          /^import mark from [^;]+;/m,
          `const mark = '/${family}-mark.svg';`,
        )
        .replace(/from ["']\.\/(?:martlet|krigsvold)-footer["']/g, "from './footer.mjs'")
        .replace(/from ["']\.\.\/data["']/g, `from './data.mjs'`)
        .replace(/^import ['"][^'"]+\.css['"];?$/gm, "");
      await writeFile(join(dir, "layout.mjs"), compile(source, "layout"));
      const layout = await import(pathToFileURL(join(dir, "layout.mjs")));
      const h = React.createElement;
      const html = renderToStaticMarkup(
        h(
          layout.FamilyLayout,
          {
            mode: "light",
            onModeChange: () => {},
            directory: h("p", null, "Index"),
            page: "component",
          },
          h(layout.ComponentPage, {
            name: "Button",
            description: "A clear next step",
            category: "Actions",
            playground: h("button", null, "Try"),
            api: h("p", null, "API"),
            accessibility: h("p", null, "Keyboard"),
          }),
        ),
      );
      assert.ok(html.includes(`class="reference-shell"`));
      assert.ok(html.includes('aria-label="React reference"'));
      assert.ok(html.includes(`src="/${family}-mark.svg"`));
      assert.equal((html.match(/<main /g) ?? []).length, 1);
      assert.ok(
        html.includes(
          family === "martlet"
            ? "martlet-article-layout"
            : "krigsvold-reference-workspace",
        ),
      );
      const css = await readFile(`docs-app/src/layouts/${family}.css`, "utf8");
      assert.ok(css.includes(`var(--${family}-`));
      assert.ok(
        !/#[0-9a-f]{3,8}\b/i.test(css),
        "Documentation cannot introduce a new literal palette",
      );
      const asset = await readFile(`docs-app/brand/${family}-mark.svg`, "utf8");
      assert.ok(asset.includes("<svg"));
      const provenance = JSON.parse(
        await readFile("docs-app/brand/provenance.json", "utf8"),
      )[family];
      assert.equal(
        createHash("sha1")
          .update(`blob ${Buffer.byteLength(asset)}\0`)
          .update(asset)
          .digest("hex"),
        provenance.gitBlobSha,
      );
      const UI = await import(`@${family}/react`);
      for (const placement of ["default", "top", "side", "none"]) {
        const shell = renderToStaticMarkup(
          h(
            UI.AppShell,
            {
              brand: "A working app",
              navigationLabel: "Primary",
              navigationPlacement: placement,
              headerMode: "dark",
              navigation: h("a", { href: "/" }, "Workspace"),
              utilities: h("span", null, "Account"),
            },
            h("p", null, "Work"),
          ),
        );
        assert.ok(shell.includes(`data-navigation="${placement}"`));
        assert.ok(shell.includes(`data-${family}="dark"`));
        assert.equal(
          shell.includes('aria-label="Primary"'),
          placement !== "none",
        );
        assert.equal((shell.match(/<main /g) ?? []).length, 1);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
