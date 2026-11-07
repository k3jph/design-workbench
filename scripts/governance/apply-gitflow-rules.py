#!/usr/bin/env python3
"""Plan or apply minimal GitFlow acceptance rules in the nine public repositories.

Dry-run is the default; --apply requires an authorized GitHub owner with gh CLI.
Never modifies immutable tag rules or repository permissions.
"""
import argparse
import json
import subprocess
import sys

CHECKS = {
    "martletdesign/core": "verify",
    "krigsvolddesign/core": "verify",
    "martletdesign/astro": "accept",
    "krigsvolddesign/astro": "accept",
    "martletdesign/react": "test",
    "krigsvolddesign/react": "test",
    "martletdesign/jekyll": "verify",
    "krigsvolddesign/jekyll": "verify",
    "k3jph/design-workbench": "accept",
}
NAMES = {"GitFlow main and develop protection", "GitFlow accepted branches"}
NAME = "GitFlow accepted branches"
GITHUB_ACTIONS_INTEGRATION = 15368


def desired(check):
    return {
        "name": NAME,
        "target": "branch",
        "enforcement": "active",
        "conditions": {
            "ref_name": {
                "include": ["refs/heads/main", "refs/heads/develop"],
                "exclude": [],
            }
        },
        "rules": [
            {"type": "deletion"},
            {"type": "non_fast_forward"},
            {"type": "pull_request", "parameters": {
                "required_approving_review_count": 0,
                "dismiss_stale_reviews_on_push": False,
                "require_code_owner_review": False,
                "require_last_push_approval": False,
                "required_review_thread_resolution": False,
                "allowed_merge_methods": ["merge", "squash"],
            }},
            {"type": "required_status_checks", "parameters": {
                "strict_required_status_checks_policy": False,
                "do_not_enforce_on_create": False,
                "required_status_checks": [
                    {"context": check, "integration_id": GITHUB_ACTIONS_INTEGRATION}
                ],
            }},
        ],
    }


def gh(endpoint, payload=None, method="GET"):
    cmd = ["gh", "api", endpoint, "-X", method]
    if payload is not None:
        cmd += ["--input", "-"]
    result = subprocess.run(
        cmd, input=json.dumps(payload) if payload is not None else None,
        capture_output=True, text=True, check=False, timeout=45,
    )
    if result.returncode:
        raise RuntimeError(f"{endpoint}: {result.stderr.strip() or 'gh api failed'}")
    return json.loads(result.stdout)


def apply(repo, payload):
    listed = gh(f"/repos/{repo}/rulesets")
    active = [r for r in listed if r.get("target") == "branch"
              and r.get("enforcement") == "active"]
    unknown = [r for r in active if r.get("name") not in NAMES]
    if unknown:
        raise RuntimeError(f"{repo}: unknown active branch ruleset; inspect manually")
    matched = [r for r in listed if r.get("target") == "branch"
               and r.get("name") in NAMES]
    if len(matched) > 1:
        raise RuntimeError(f"{repo}: multiple GitFlow branch rulesets; resolve manually")
    if matched:
        rule_id = matched[0]["id"]
        result = gh(f"/repos/{repo}/rulesets/{rule_id}", payload, "PUT")
        action = "updated"
    else:
        result = gh(f"/repos/{repo}/rulesets", payload, "POST")
        action = "created"
    assert result.get("enforcement") == "active"
    assert result.get("target") == "branch"
    assert result.get("conditions", {}).get("ref_name") == payload["conditions"]["ref_name"]
    rule_types = {r["type"] for r in result.get("rules", [])}
    assert {"deletion", "non_fast_forward", "pull_request", "required_status_checks"} <= rule_types
    return {"repository": repo, "action": action, "rulesetId": result["id"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true",
                        help="write GitHub branch rules using owner-authorized gh CLI")
    parser.add_argument("--repo", action="append", choices=sorted(CHECKS),
                        help="limit to a repository (repeatable); default all nine")
    args = parser.parse_args()
    repositories = list(dict.fromkeys(args.repo or CHECKS.keys()))
    if not args.apply:
        print(json.dumps({
            "mode": "dry-run", "requires": "GitHub ruleset admin via gh auth login",
            "warning": "Tag rules are not modified",
            "proposed": {repo: desired(CHECKS[repo]) for repo in repositories},
        }, indent=2))
        return
    results = []
    for repo in repositories:
        try:
            result = apply(repo, desired(CHECKS[repo]))
            results.append(result)
            print(json.dumps(result), flush=True)
        except Exception as error:
            print(f"STOP {repo}: {error}", file=sys.stderr)
            sys.exit(1)
    print(json.dumps({"status": "applied", "repositories": results}, indent=2))


if __name__ == "__main__":
    main()
