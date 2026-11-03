"""Offline design checks; do not invoke or change GitHub workflows or environments."""
from copy import deepcopy
from pathlib import Path
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[3]
EFFECTS = ("package", "test-archives", "publish", "adopt")
GATE = "reference-approval"
ENVIRONMENT = "reference-release-approval"


def assess(jobs, policy):
    """Check a proposed dependency graph under supplied, *not observed* policy facts.

    GitHub runs a job only after all default-success `needs` succeed. This model
    rejects custom conditions rather than attempting to evaluate GitHub syntax.
    It cannot inspect repository settings, hidden effects, callers or old runs.
    """
    errors = []
    required_policy = (
        "environment_precreated", "required_reviewer", "no_admin_bypass",
        "no_self_review", "ref_allowed", "environment_sentinel_present",
        "no_repository_or_org_sentinel_fallback", "settings_verified",
    )
    errors.extend(f"unverified policy: {key}" for key in required_policy if policy.get(key) is not True)
    gate = jobs.get(GATE)
    if not gate:
        errors.append("approval job missing")
    else:
        environment = gate.get("environment", {})
        name = environment.get("name") if isinstance(environment, dict) else environment
        if name != ENVIRONMENT:
            errors.append("approval environment missing or wrong")
    if gate and (gate.get("needs") or gate.get("if")):
        errors.append("extra prerequisite or custom condition on approval requires review")

    def visit(name, active):
        if name in active:
            raise ValueError(f"cycle at {name}")
        if name not in jobs:
            raise ValueError(f"unknown dependency {name}")
        job = jobs[name]
        if "if" in job and str(job["if"]).strip() not in ("success()", "${{ success() }}"):
            raise ValueError(f"custom condition at {name} requires separate review")
        if name == GATE:
            return True
        needs = job.get("needs", [])
        if isinstance(needs, str):
            needs = [needs]
        # Visit every dependency to detect invalid or unsafe parallel paths too.
        results = [visit(dep, active | {name}) for dep in needs]
        return any(results)

    for effect in EFFECTS:
        try:
            if not visit(effect, set()):
                errors.append(f"{effect} has no successful approval prerequisite")
        except (ValueError, TypeError) as exc:
            errors.append(f"{effect}: {exc}")
    return errors


def documented_policy():
    return {key: True for key in (
        "environment_precreated", "required_reviewer", "no_admin_bypass",
        "no_self_review", "ref_allowed", "environment_sentinel_present",
        "no_repository_or_org_sentinel_fallback", "settings_verified",
    )}


class PublicationGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        path = ROOT / ".github/workflows/reference-release.yml"
        cls.actual = yaml.safe_load(path.read_text())["jobs"]

    def proposed(self):
        jobs = deepcopy(self.actual)
        jobs[GATE] = {"environment": {"name": ENVIRONMENT, "deployment": False}}
        jobs["package"]["needs"] = GATE
        return jobs

    def test_current_workflow_reaches_archive_without_approval(self):
        errors = assess(self.actual, documented_policy())
        self.assertIn("approval job missing", errors)
        self.assertIn("package has no successful approval prerequisite", errors)

    def test_proposal_is_connected_under_explicit_assumptions(self):
        self.assertEqual(assess(self.proposed(), documented_policy()), [])

    def test_missing_setup_review_bypass_or_secret_is_not_assumed_safe(self):
        for key in documented_policy():
            with self.subTest(key=key):
                policy = documented_policy()
                policy[key] = False
                self.assertIn(f"unverified policy: {key}", assess(self.proposed(), policy))

    def test_wrong_environment_and_missing_dependency_fail(self):
        jobs = self.proposed()
        jobs[GATE]["environment"]["name"] = "wrong"
        self.assertIn("approval environment missing or wrong", assess(jobs, documented_policy()))
        jobs = self.proposed()
        del jobs["package"]["needs"]
        self.assertIn("package has no successful approval prerequisite", assess(jobs, documented_policy()))
        jobs = self.proposed()
        del jobs["publish"]["needs"]
        self.assertIn("publish has no successful approval prerequisite", assess(jobs, documented_policy()))

    def test_unconditional_or_failed_dependency_paths_are_not_accepted(self):
        for condition in ("always()", "failure()", "${{ !cancelled() }}"):
            with self.subTest(condition=condition):
                jobs = self.proposed()
                jobs["publish"]["if"] = condition
                self.assertTrue(any("custom condition at publish" in e for e in assess(jobs, documented_policy())))

    def test_unknown_dependencies_and_cycles_fail(self):
        jobs = self.proposed()
        jobs["package"]["needs"] = "missing"
        self.assertTrue(any("unknown dependency missing" in e for e in assess(jobs, documented_policy())))
        jobs = self.proposed()
        jobs[GATE]["needs"] = "package"
        self.assertIn("extra prerequisite or custom condition on approval requires review", assess(jobs, documented_policy()))
        jobs = self.proposed()
        jobs["package"]["needs"] = "publish"
        self.assertTrue(any("cycle at" in e for e in assess(jobs, documented_policy())))


if __name__ == "__main__":
    unittest.main()
