import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
const directory = mkdtempSync(join(tmpdir(), "design-packages-"));
try {
  const inputs = [
    ["martlet", "2.2.2", "e1fde61cdc818dbdc5b91eb77041111f5651316a63fc9dd3ab5d4dac9536011c"],
    ["krigsvold", "2.2.3", "c74177f9b344b7e517b138b5d0afa9ec0b6b78c1bfdf66f6ffe0570c60b26c66"],
  ].map(([family, version, expected]) => {
    const file = resolve(`fixtures/core-candidates/${family}-core-${version}.tgz`);
    if (createHash("sha256").update(readFileSync(file)).digest("hex") !== expected) throw new Error(`Unexpected ${family} core bytes`);
    return file;
  });
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({
      name: "isolated-consumer",
      private: true,
      type: "module",
    }),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--package-lock=false",
      "react@19.3.1",
      "react-dom@19.3.1",
      ...inputs,
      resolve("martlet-react-0.2.0.tgz"),
      resolve("krigsvold-react-0.2.0.tgz"),
    ],
    { cwd: directory, stdio: "pipe" },
  );
  for (const family of ["martlet", "krigsvold"]) {
    const packagePath = join(directory, "node_modules", `@${family}`, "react");
    if (
      !existsSync(join(packagePath, "dist/styles.css")) ||
      !existsSync(join(packagePath, "dist/index.d.ts")) ||
      existsSync(join(packagePath, "dist/src"))
    )
      throw new Error(`Invalid ${family} package contents`);
  }
  writeFileSync(
    join(directory, "consumer.mjs"),
    `import {createElement as h} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import * as Martlet from '@martlet/react';import * as Krigsvold from '@krigsvold/react';for(const UI of [Martlet,Krigsvold]){if(Object.keys(UI).length!==22)throw new Error('Missing component exports');const html=renderToStaticMarkup(h(UI.Field,{label:'Name'},props=>h(UI.TextInput,{...props,name:'name'})));if(!html.includes('name="name"'))throw new Error('Consumer render failed');const errors=renderToStaticMarkup(h(UI.ErrorSummary,{title:'Check the form',errors:[{message:'Enter a name.',targetId:'name'}]}));if(!errors.includes('href="#name"')||!errors.includes('role="alert"'))throw new Error('Consumer error summary failed');const article=renderToStaticMarkup(h(UI.Article,{title:'Component contract',contents:h(UI.TableOfContents,{items:[{id:'purpose',label:'Purpose'}]})},h('h2',{id:'purpose'},'Purpose')));if(!article.includes('<article')||!article.includes('href="#purpose"')||!article.includes('aria-labelledby='))throw new Error('Consumer article failed');const file=renderToStaticMarkup(h(UI.FileInput,{accept:'.json',name:'registry-file'}));if(!file.includes('type="file"')||!file.includes('accept=".json"'))throw new Error('Consumer file control failed');const radio=renderToStaticMarkup(h(UI.Radio,{label:'Needs work',name:'outcome',value:'needs-work',checked:true,readOnly:true}));if(!radio.includes('type="radio"')||!radio.includes('name="outcome"')||!radio.includes('checked'))throw new Error('Consumer radio failed');const pages=renderToStaticMarkup(h(UI.Pagination,{page:1,pageCount:3,onPageChange:()=>{}}));if(!pages.includes('Page 1 of 3')||!pages.includes('disabled')||!pages.includes('aria-label=\"Pagination\"'))throw new Error('Consumer pagination failed');const definitions=renderToStaticMarkup(h(UI.DefinitionList,{items:[{id:'revision',term:'Revision',description:'4'}]}));if(!definitions.includes('<dt>Revision</dt><dd>4</dd>'))throw new Error('Consumer definition list failed');const toggle=renderToStaticMarkup(h(UI.Switch,{label:'Protect drafts',name:'protect',defaultChecked:true}));if(!toggle.includes('role="switch"')||!toggle.includes('type="checkbox"'))throw new Error('Consumer switch failed');const tabs=renderToStaticMarkup(h(UI.Tabs,{label:'Settings',value:'one',onValueChange:()=>{},items:[{id:'one',label:'One',content:'First'},{id:'two',label:'Two',content:'Second'}]}));if(!tabs.includes('role="tablist"')||!tabs.includes('role="tabpanel"')||!tabs.includes('hidden'))throw new Error('Consumer tabs failed');}console.log('Both packed packages installed and rendered outside the workspace.');`,
  );
  execFileSync(process.execPath, ["consumer.mjs"], {
    cwd: directory,
    stdio: "inherit",
  });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
