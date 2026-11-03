import {execFileSync} from 'node:child_process';

// An absent public version is accepted only when the package itself is visible.
// Network errors, private packages, malformed registry data and auth failures
// are unknown, never evidence that a version is available.
export async function registryVersionState(fetcher, registry, name, version) {
  try {
    const base = new URL(registry);
    if (base.protocol !== 'https:') return 'unknown';
    const packageUrl = new URL(encodeURIComponent(name), base).href;
    const pkg = await fetcher(packageUrl);
    if (pkg.status !== 200) return 'unknown';
    const metadata = await pkg.json();
    if (metadata?.name !== name) return 'unknown';
    const response = await fetcher(`${packageUrl}/${encodeURIComponent(version)}`);
    if (response.status === 404) return 'absent';
    if (response.status !== 200) return 'unknown';
    const versionMetadata = await response.json();
    return versionMetadata?.name === name && versionMetadata?.version === version ? 'present' : 'unknown';
  } catch { return 'unknown'; }
}

// Local ancestry is not a substitute for a protected remote tag or ruleset.
export function isMainFirstParent(repo, commit, mainRef='refs/remotes/origin/main') {
  try {
    const options={cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']};
    const target=execFileSync('git',['rev-parse','--verify',`${commit}^{commit}`],options).trim();
    const history=execFileSync('git',['rev-list','--first-parent',mainRef],options).trim().split('\n');
    return history.includes(target);
  } catch { return false; }
}
