import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

describe("CI workflow", () => {
  it("pins both actions to full commit SHAs", () => {
    const uses = [...workflow.matchAll(/^\s*(?:-\s*)?uses: (actions\/[^@\s]+)@([^\s]+)/gm)];
    expect(uses.map(([, action]) => action)).toEqual([
      "actions/checkout",
      "actions/setup-node",
    ]);
    for (const [, , revision] of uses) {
      expect(revision).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("does not persist checkout credentials", () => {
    expect(workflow).toMatch(
      /- uses: actions\/checkout@[0-9a-f]{40}[^\n]*\n\s+with:\n\s+persist-credentials: false(?:\n|$)/,
    );
  });

  it("fails CI when build or test scripts are missing", () => {
    expect(workflow).toMatch(/^\s+- run: npm run build$/m);
    expect(workflow).toMatch(/^\s+- run: npm test$/m);
    expect(workflow).not.toMatch(/--if-present/);
  });
});

describe("package engines", () => {
  it("declares Node >=20", () => {
    expect(pkg.engines?.node).toBe(">=20");
  });
});
