import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
export default defineConfig(({ mode }) => {
  if (!["martlet", "krigsvold"].includes(mode))
    throw new Error("Choose a documentation family");
  const name = mode === "martlet" ? "Martlet" : "Krigsvold";
  return {
    base: process.env.DESIGN_DOCS_BASE || "/",
    root: fileURLToPath(new URL(".", import.meta.url)),
    plugins: [
      {
        name: "selected-family",
        resolveId: (id) =>
          id === "docs-distribution"
            ? fileURLToPath(new URL(`../mcp/catalogs/${mode}-distribution.json`,import.meta.url))
            : id === "docs-family"
            ? "\0docs-family"
            : id === "docs-layout"
              ? fileURLToPath(
                  new URL(`src/layouts/${mode}.tsx`, import.meta.url),
                )
              : id === "docs-pattern"
                ? fileURLToPath(
                    new URL(`src/patterns/${mode}.tsx`, import.meta.url),
                  )
                : id === "docs-reference-pattern"
                  ? fileURLToPath(new URL(`src/lab/${mode}.tsx`, import.meta.url))
                : id === "docs-grammar" || id === "docs-decisions"
                  ? `\0${id}`
                  : undefined,
        load: (id) =>
          id === "\0docs-family"
            ? `export * from '@${mode}/react'; import '@${mode}/react/styles.css'; import '@${mode}/core/fonts.css'; export const family = '${mode}'; export const familyName = '${name}';`
            : id === "\0docs-grammar" || id === "\0docs-decisions"
              ? `export default ${JSON.stringify(readFileSync(new URL(`../docs/languages/${mode}/${id === "\0docs-grammar" ? "grammar" : "decisions"}.md`, import.meta.url), "utf8"))}`
              : undefined,
      },
      {
        name: "family-title",
        transformIndexHtml: (html) =>
          html.replace(
            "<title>React reference</title>",
            `<title>${name} React · Component reference</title>`,
          ).replace('<noscript><main><h1>React component reference</h1>',`<noscript><main><h1>${name} React component reference</h1>`),
      },
    ],
    build: {
      target: "es2022",
      assetsInlineLimit: 0,
      outDir: fileURLToPath(new URL(`../docs-dist/${mode}`, import.meta.url)),
      emptyOutDir: true,
    },
  };
});
