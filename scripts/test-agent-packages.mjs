import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
// The archives are referenced by checksum. Rebuild twice under the same
// environment to catch accidental timestamp, ordering or metadata drift.
async function archiveHashes() {
  const hashes = {};
  for (const family of ["martlet", "krigsvold"]) {
    for (const suffix of ["agent-tools.tar.gz", "builder.zip"]) {
      const path = resolve(`agent-dist/${family}-${suffix}`);
      hashes[path] = createHash("sha256").update(await readFile(path)).digest("hex");
    }
  }
  return hashes;
}
for (let run = 0, first; run < 2; run++) {
  // Cross a timestamp boundary: rapid rebuilds can otherwise accidentally
  // hide a regression to non-normalized tar entry times.
  if (run) await new Promise(resolve => setTimeout(resolve, 1100));
  const build = spawnSync(process.execPath, ["scripts/build-knowledge.mjs"], { encoding: "utf8" });
  if (build.status !== 0) throw Error(`Agent build failed: ${build.stderr || build.error?.message}`);
  const hashes = await archiveHashes();
  if (run === 0) first = hashes;
  else assert.deepEqual(hashes, first, "Agent archives must be reproducible under identical inputs");
}
for (const family of ["martlet", "krigsvold"]) {
  const tmp = await mkdtemp(join(tmpdir(), "language-consumer-"));
  try {
    const unpack = spawnSync("tar", [
      "-xzf",
      resolve(`agent-dist/${family}-agent-tools.tar.gz`),
      "-C",
      tmp,
    ]);
    if (unpack.status) throw Error("Unpack failed");
    const cwd = join(tmp, family);
    const install = spawnSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund", "--fetch-retries=0", "--fetch-timeout=20000"], {
      cwd,
      encoding: "utf8",
    });
    if (install.status) throw Error(install.stderr);
    const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    assert.ok(
      !Object.keys(pkg.dependencies).some(
        (n) => n.includes("react") || n.includes(family),
      ),
    );
    const client = new Client({
      name: "independent-artifact-consumer",
      version: "1.0.0",
    });
    try {
      await client.connect(
        new StdioClientTransport({
          command: process.execPath,
          args: [join(cwd, "index.mjs")],
        }),
      );
      const raw = await client.callTool({
        name: "get_manifest",
        arguments: {},
      });
      const manifest = JSON.parse(raw.content[0].text);
      assert.equal(manifest.family, family);
      assert.equal(manifest.references.length, 61);
    } finally {
      await client.close();
    }
    console.log(
      `${family}: extracted archive installs and serves outside the workbench`,
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
