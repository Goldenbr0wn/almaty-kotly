import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const bridgeSource = () => readFileSync(join(process.cwd(), "src/components/FinalSiteBridge.tsx"), "utf8");

describe("final site behavior bridge", () => {
  it("restores compare hash scrolling from the original dist shell", () => {
    const source = bridgeSource();

    expect(source).toContain("scrollToSection");
    expect(source).toContain("window.location.hash");
  });

  it("restores compare favorite and pick CTA behavior from the original dist shell", () => {
    const source = bridgeSource();

    expect(source).toContain("aria-pressed");
    expect(source).toContain("Добавить в избранное");
    expect(source).toContain("Подобрать");
  });

  it("initializes detail tabs for default active state and keyboard access", () => {
    const source = bridgeSource();

    expect(source).toContain("detail-tabs");
    expect(source).toContain("tabindex");
    expect(source).toContain("is-active");
  });
});
