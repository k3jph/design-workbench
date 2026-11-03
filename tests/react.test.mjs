import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Martlet from "@martlet/react";
import * as Krigsvold from "@krigsvold/react";
for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} reusable exports retain native form semantics and attributes`, () => {
    const button = renderToStaticMarkup(
      h(
        UI.Button,
        { "aria-label": "Save record", disabled: true, variant: "secondary" },
        "Save",
      ),
    );
    assert.match(button, /type="button"/);
    assert.match(button, /disabled=""/);
    assert.match(button, /aria-label="Save record"/);
    assert.match(button, new RegExp(`${family}-button--secondary`));
    const input = renderToStaticMarkup(
      h(UI.TextInput, {
        name: "email",
        type: "email",
        required: true,
        autoComplete: "email",
        "data-consumer": "native",
      }),
    );
    assert.match(input, /type="email"/);
    assert.match(input, /required=""/);
    assert.match(input, /autoComplete="email"/);
    assert.match(input, /data-consumer="native"/);
  });
  test(`${family} fields associate labels, hints and errors with their control`, () => {
    const field = renderToStaticMarkup(
      h(
        UI.Field,
        {
          label: "Name",
          hint: "Use the exported name.",
          error: "Name is required.",
        },
        (props) => h(UI.TextInput, { ...props, name: "name" }),
      ),
    );
    const id = field.match(/<label for="([^"]+)"/)[1];
    assert.ok(field.includes(`id="${id}"`));
    assert.ok(field.includes(`aria-describedby="${id}-hint ${id}-error"`));
    assert.match(field, /aria-invalid="true"/);
  });
  test(`${family} notices use appropriate live regions and tables keep captions`, () => {
    assert.match(
      renderToStaticMarkup(h(UI.Notice, { kind: "success" }, "Saved")),
      /role="status"/,
    );
    assert.match(
      renderToStaticMarkup(h(UI.Notice, { kind: "error" }, "Failed")),
      /role="alert"/,
    );
    const table = renderToStaticMarkup(
      h(
        UI.DataTable,
        { caption: "Records" },
        h("tbody", null, h("tr", null, h("td", null, "Button"))),
      ),
    );
    assert.match(table, /<caption>Records<\/caption>/);
    assert.match(table, /role="region"/);
    assert.match(table, /tabindex="0"/);
  });
}
for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} checkbox, fieldset, and disclosure retain native behavior contracts`, () => {
    const checkbox = renderToStaticMarkup(
      h(UI.Checkbox, {
        label: "React",
        name: "targets",
        checked: true,
        readOnly: true,
        disabled: true,
      }),
    );
    assert.match(checkbox, /type="checkbox"/);
    assert.match(checkbox, /checked=""/);
    assert.match(checkbox, /disabled=""/);
    assert.match(checkbox, />React<\/label>/);
    const group = renderToStaticMarkup(
      h(
        UI.Fieldset,
        {
          legend: "Targets",
          hint: "Choose supported intent.",
          error: "Choose at least one.",
          disabled: true,
        },
        h(UI.Checkbox, { label: "React" }),
      ),
    );
    assert.match(group, /<legend>Targets<\/legend>/);
    assert.match(group, /aria-invalid="true"/);
    assert.match(group, /aria-describedby="[^"]+-hint [^"]+-error"/);
    assert.match(group, /disabled=""/);
    const disclosure = renderToStaticMarkup(
      h(UI.Disclosure, { summary: "History", open: true }, "Revision 1"),
    );
    assert.match(disclosure, /<details[^>]*open=""/);
    assert.match(disclosure, /<summary>History<\/summary>Revision 1/);
  });
}
for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} error summaries name failures and link to explicit field IDs`, () => {
    const html = renderToStaticMarkup(
      h(
        UI.ErrorSummary,
        {
          title: "Check this specification",
          errors: [
            { message: "Enter a summary.", targetId: "spec-summary" },
            { message: "The server is unavailable." },
          ],
        },
        h(UI.Button, null, "Retry"),
      ),
    );
    assert.match(html, /role="alert"/);
    assert.match(html, /tabindex="-1"/);
    assert.match(html, /aria-labelledby="[^"]+"/);
    assert.match(html, /href="#spec-summary"/);
    assert.match(html, /The server is unavailable\./);
    assert.match(html, />Retry<\/button>/);
    const field = renderToStaticMarkup(
      h(
        UI.Field,
        { id: "spec-summary", label: "Summary", error: "Enter a summary." },
        (props) => h(UI.TextInput, props),
      ),
    );
    assert.match(field, /for="spec-summary"/);
    assert.match(field, /id="spec-summary"/);
    const description = field.match(/aria-describedby="([^"]+)"/)[1];
    assert.ok(field.includes(`id="${description}" class="${family}-error">Enter a summary.</p>`));
    const legacy = renderToStaticMarkup(
      h(UI.Field, {id:"legacy", label:"Legacy", hint:"Hint.", error:"Error.", hintId:"legacy-hint", errorId:"legacy-error"}, (props) => h(UI.TextInput, props)),
    );
    assert.ok(legacy.includes('aria-describedby="legacy-hint legacy-error"'));
    assert.ok(legacy.includes('id="legacy-hint"'));
    assert.ok(legacy.includes('id="legacy-error"'));
  });
}
for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} article keeps its accessible title, metadata, content, context, footer, and native attributes`, () => {
    const markup = renderToStaticMarkup(
      h(
        UI.Article,
        {
          title: "A working contract",
          titleLevel: 2,
          id: "contract",
          "data-consumer": "article",
          summary: "Read the saved specification.",
          metadata: h("time", { dateTime: "2026-10-21" }, "October 21"),
          contents: h(UI.TableOfContents, {
            items: [{ id: "purpose", label: "Purpose" }],
          }),
          aside: h("p", null, "Context remains available."),
          footer: "Experimental source under MIT.",
        },
        h(
          "section",
          null,
          h("h3", { id: "purpose", tabIndex: -1 }, "Purpose"),
          h("p", null, "The actual contract."),
        ),
      ),
    );
    const titleId = markup.match(/<article[^>]*aria-labelledby="([^"]+)"/)[1];
    assert.ok(markup.includes(`<h2 id="${titleId}">A working contract</h2>`));
    assert.match(markup, /id="contract"/);
    assert.match(markup, /data-consumer="article"/);
    assert.match(markup, /<time dateTime="2026-10-21">October 21<\/time>/);
    assert.match(markup, /<aside[^>]*aria-label="Article context"/);
    assert.match(markup, /The actual contract\./);
    assert.match(markup, /Experimental source under MIT\./);
    const standalone = renderToStaticMarkup(
      h(UI.Article, { title: "Standalone" }, "Body"),
    );
    assert.match(standalone, /<h1[^>]*>Standalone<\/h1>/);
    assert.doesNotMatch(standalone, /<aside/);
  });
  test(`${family} table of contents uses named native navigation and encoded fragment targets`, () => {
    const markup = renderToStaticMarkup(
      h(UI.TableOfContents, {
        label: "Specification sections",
        "data-consumer": "contents",
        items: [
          { id: "purpose", label: "Purpose" },
          { id: "a section", label: "A section", depth: 3 },
        ],
      }),
    );
    assert.match(markup, /<nav[^>]*aria-label="Specification sections"/);
    assert.match(markup, /data-consumer="contents"/);
    assert.match(markup, /data-variant="index"/);
    assert.match(markup, /<ul>/);
    assert.match(markup, /<li data-depth="3">/);
    assert.match(markup, /href="#purpose"/);
    assert.match(markup, /href="#a%20section"/);
    assert.doesNotMatch(markup, /role="(menu|tablist)"/);
    const inline = renderToStaticMarkup(h(UI.TableOfContents, {
      variant: "inline", items: [{ id: "purpose", label: "Purpose" }],
    }));
    assert.match(inline, /data-variant="inline"/);
    assert.match(inline, /href="#purpose"/);
  });
}
for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} file input retains native chooser, hint, invalid, disabled, and multiple contracts`, () => {
    const markup = renderToStaticMarkup(
      h(
        UI.Field,
        {
          id: "registry-file",
          label: "Registry export",
          hint: "JSON only",
          error: "Choose a valid file.",
        },
        (props) =>
          h(UI.FileInput, {
            ...props,
            accept: ".json,application/json",
            name: "registry-file",
            multiple: true,
            disabled: true,
          }),
      ),
    );
    assert.match(markup, /type="file"/);
    assert.match(markup, /accept=".json,application\/json"/);
    assert.match(markup, /name="registry-file"/);
    assert.match(markup, /multiple=""/);
    assert.match(markup, /disabled=""/);
    assert.match(markup, /aria-invalid="true"/);
    const descriptions = markup.match(/aria-describedby="([^"]+)"/)[1].split(" ");
    assert.equal(descriptions.length, 2);
    assert.notEqual(descriptions[0], descriptions[1]);
    assert.ok(markup.includes(`id="${descriptions[0]}" class="${family}-hint">JSON only</p>`));
    assert.ok(markup.includes(`id="${descriptions[1]}" class="${family}-error">Choose a valid file.</p>`));
    assert.doesNotMatch(markup, /value="/);
  });
}

for (const family of ["martlet", "krigsvold"])
  test(`${family} radio options retain labels, group names, native state and fieldset descriptions`, async () => {
    const UI = await import(`../packages/${family}-react/dist/index.js`);
    const html = renderToStaticMarkup(
      h(
        UI.Fieldset,
        { legend: "Outcome", hint: "Choose one result", disabled: true },
        h(UI.Radio, {
          id: "passed",
          label: "Passed",
          name: "outcome",
          value: "passed",
          checked: true,
          readOnly: true,
          "aria-describedby": "observation",
        }),
        h(UI.Radio, {
          id: "needs-work",
          label: "Needs work",
          name: "outcome",
          value: "needs-work",
          checked: false,
          readOnly: true,
        }),
      ),
    );
    assert.match(html, /<legend>Outcome<\/legend>/);
    assert.match(html, /for="passed"/);
    assert.match(html, /type="radio"/);
    assert.match(html, /name="outcome"/);
    assert.match(html, /aria-describedby="observation"/);
    assert.match(html, /disabled=""/);
    assert.match(html, /checked=""/);
  });

for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
])
  test(`${family} pagination names native navigation and safely bounds malformed and edge pages`, () => {
    const render = (page, pageCount, disabled = false) =>
      renderToStaticMarkup(
        h(UI.Pagination, {
          page,
          pageCount,
          disabled,
          onPageChange: () => {},
          label: "Review pages",
          "data-consumer": "queue",
        }),
      );
    const first = render(1, 3);
    assert.match(
      first,
      /<nav[^>]*data-consumer="queue"[^>]*aria-label="Review pages"/,
    );
    assert.match(first, /aria-live="polite"/);
    assert.match(first, />Page 1 of 3<\/p>/);
    assert.equal((first.match(/disabled=""/g) || []).length, 1);
    assert.equal((render(2, 3, true).match(/disabled=""/g) || []).length, 2);
    assert.match(render(900, 3), />Page 3 of 3<\/p>/);
    assert.match(render(NaN, Infinity), />Page 1 of 1<\/p>/);
    assert.equal((render(-1, 0).match(/disabled=""/g) || []).length, 2);
  });

for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
])
  test(`${family} definition lists preserve native term/value structure, descriptions, attributes and escaped text`, () => {
    const html = renderToStaticMarkup(
      h(UI.DefinitionList, {
        "aria-label": "Contract values",
        id: "values",
        items: [
          {
            id: "name",
            term: "Name",
            description: "<script>literal only</script>",
          },
          {
            id: "revision",
            term: h("strong", null, "Revision"),
            description: h("span", null, "4"),
          },
        ],
      }),
    );
    assert.match(html, /<dl[^>]*aria-label="Contract values"/);
    assert.match(html, /id="values"/);
    assert.match(
      html,
      /<div><dt>Name<\/dt><dd>&lt;script&gt;literal only&lt;\/script&gt;<\/dd><\/div>/,
    );
    assert.match(
      html,
      /<dt><strong>Revision<\/strong><\/dt><dd><span>4<\/span><\/dd>/,
    );
    assert.doesNotMatch(html, /<script>/);
    const empty = renderToStaticMarkup(h(UI.DefinitionList, { items: [] }));
    assert.doesNotMatch(empty, /<dt>/);
  });

for (const [family, UI] of [
  ["martlet", Martlet],
  ["krigsvold", Krigsvold],
]) {
  test(`${family} Switch preserves native forms and Tabs provides linked, hidden, disabled panels`, () => {
    const toggle = renderToStaticMarkup(
      h(UI.Switch, {
        label: "Protect drafts",
        name: "protect",
        value: "yes",
        defaultChecked: true,
        disabled: true,
      }),
    );
    assert.match(toggle, /role="switch"/);
    assert.match(toggle, /type="checkbox"/);
    assert.match(toggle, /name="protect"/);
    assert.match(toggle, /checked=""/);
    assert.match(toggle, /disabled=""/);
    const html = renderToStaticMarkup(
      h(UI.Tabs, {
        label: "Settings",
        value: "missing",
        onValueChange() {},
        items: [
          {
            id: "disabled",
            label: "Disabled",
            content: "Disabled content",
            disabled: true,
          },
          { id: "one", label: "Workspace", content: "Workspace content" },
          { id: "two", label: "Recovery", content: "<script>escaped</script>" },
        ],
      }),
    );
    assert.match(
      html,
      /role="tablist" aria-label="Settings" aria-orientation="horizontal"/,
    );
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.equal((html.match(/tabindex="-1" disabled=""/g) ?? []).length, 1);
    assert.match(html, /aria-selected="true" tabindex="0"/);
    assert.equal((html.match(/hidden=""/g) ?? []).length, 2);
    assert.match(html, /&lt;script&gt;escaped&lt;\/script&gt;/);
  });
}
