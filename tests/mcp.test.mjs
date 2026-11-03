import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { resolve } from "node:path";
import distribution from "../docs/distribution.json" with {type:"json"};
for (const family of ["martlet", "krigsvold"])
  test(
    `${family} MCP negotiates, retrieves sources, isolates family and handles unsupported requests`,
    { timeout: 20000 },
    async () => {
      const client = new Client({
        name: "language-verification",
        version: "1.0.0",
      });
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [resolve(`mcp/${family}.mjs`)],
        stderr: "pipe",
      });
      let stderr = "";
      transport.stderr?.on("data", (chunk) => {
        stderr += chunk;
      });
      try {
        await client.connect(transport);
        const tools = await client.listTools();
        assert.deepEqual(tools.tools.map((t) => t.name).sort(), [
          "get_manifest",
          "get_reference",
          "search_guidance",
        ]);
        assert.ok(tools.tools.every((t) => t.annotations.readOnlyHint));
        const call = async (name, args = {}) => {
          const raw = await client.callTool({ name, arguments: args });
          return {
            raw,
            value: JSON.parse(raw.content.find((c) => c.type === "text").text),
          };
        };
        const manifest = (await call("get_manifest")).value;
        assert.equal(manifest.family, family);
        assert.equal(manifest.version, distribution.preview.version);
        assert.equal(manifest.platforms.Astro.version, distribution.families[family].packages.Astro.version);
        assert.equal(manifest.references.length, 62);
        assert.equal(manifest.platforms.React.published, distribution.families[family].packages.React.published);
        assert.equal(manifest.platforms.Astro.published, distribution.families[family].packages.Astro.published);
        assert.equal(manifest.platforms.Astro.examples, true);
        assert.equal(manifest.canonicalGuidance.repository, `${family}theme/npm`);
        assert.match(manifest.canonicalGuidance.commit, /^[a-f0-9]{40}$/);
        assert.ok(manifest.sourceDigest.length === 64);
        assert.equal(manifest.grammarVersion, '0.3');
        for (const id of ['coverage','pattern:validated-form','pattern:query-results']) { const reference=(await call('get_reference',{id})).value; assert.equal(reference.family,family); assert.match(reference.source,new RegExp(family+'theme/npm/blob/'+manifest.canonicalGuidance.commit)); }
        const jekyll=(await call('get_reference',{id:'platform:Jekyll'})).value;
        assert.equal(manifest.platforms.Jekyll.kind,'git');assert.equal(manifest.platforms.Jekyll.core,null);
        assert.equal(manifest.platforms.Jekyll.published,distribution.families[family].packages.Jekyll.published);
        assert.equal(manifest.platforms.Jekyll.legacyTheme.name,`@${family}/theme`);
        assert.ok(jekyll.content.includes(distribution.families[family].packages.Jekyll.sourceCommit));
        assert.ok(jekyll.content.includes('not an invented npm'));
        assert.ok(jekyll.content.includes('Manual assistive technology'));
        const jekyllSearch=(await call('search_guidance',{query:'Jekyll source Git release',kind:'platform'})).value;
        assert.equal(jekyllSearch.results[0].id,'platform:Jekyll');
        const reactSetup=(await call('get_reference',{id:'platform:React'})).value;
        assert.ok(reactSetup.content.includes(manifest.distribution.packages.React.tarball.url));
        assert.ok(reactSetup.content.includes(manifest.distribution.packages.React.tarball.sha256));
        assert.equal(manifest.distribution.packages.React.tarball.available,true);
        assert.equal(manifest.platforms.React.published,true);
        assert.ok(reactSetup.content.includes(manifest.distribution.packages.React.install));
        assert.ok(!reactSetup.content.includes('publication is pending'));
        assert.ok(reactSetup.content.includes('experimental'));
        const nativeForms=(await call('get_reference',{id:'styling:forms'})).value;
        assert.ok(nativeForms.content.includes(`${family}-error-summary`));
        assert.ok(nativeForms.content.includes('host'));
        const installSearch=(await call('search_guidance',{query:'React install tarball',kind:'platform'})).value;
        assert.equal(installSearch.results[0].id,'platform:React');
        const found = (
          await call("search_guidance", {
            query: "Cardfile collection editor recovery",
          })
        ).value;
        assert.equal(found.results[0].id, "pattern:collection-editor");
        const grammar = (await call("get_reference", { id: "grammar" })).value;
        assert.equal(grammar.family, family);
        assert.equal(grammar.source, `https://github.com/${family}theme/npm/blob/${manifest.canonicalGuidance.commit}/docs/grammar.md`);
        assert.equal(grammar.contentSha256, manifest.canonicalGuidance.files['grammar.md'].sha256);
        assert.equal(
          createHash("sha256").update(grammar.content).digest("hex"),
          grammar.contentSha256,
        );
        assert.ok(grammar.content.includes(`--${family}-field-gap`));
        const example = (await call("get_reference", { id: "example:Field" }))
          .value;
        assert.ok(example.content.includes(`@${family}/react`));
        assert.ok(
          !example.content.includes(
            `@${family === "martlet" ? "krigsvold" : "martlet"}/react`,
          ),
        );
        const unsupported = await call("get_reference", {
          id: "grammar",
          version: "99.0.0",
        });
        assert.equal(unsupported.raw.isError, true);
        assert.equal(unsupported.value.error, "unsupported_version");
        const absent = await call("get_reference", {
          id: "../../server/database",
        });
        assert.equal(absent.raw.isError, true);
        assert.equal(absent.value.error, "reference_not_available");
        const invalid = await client.callTool({
          name: "search_guidance",
          arguments: { query: "x", limit: 999 },
        });
        assert.equal(invalid.isError, true);
        const noMatch = (
          await call("search_guidance", { query: "zzzznonexistentterm" })
        ).value;
        assert.equal(noMatch.results.length, 0);
        const resources = await client.listResources();
        assert.equal(resources.resources.length, 62);
        const resource = resources.resources.find((r) => r.name === "grammar");
        const exact = await client.readResource({ uri: resource.uri });
        assert.equal(
          JSON.parse(exact.contents[0].text).content,
          grammar.content,
        );
      } finally {
        await client.close();
      }
      assert.equal(stderr, "");
    },
  );
