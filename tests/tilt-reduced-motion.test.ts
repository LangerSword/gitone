import { describe, expect, it } from "vitest";
import { applyTiltStyle, watchReducedMotion } from "@/components/TiltCard";

function fakeCard() {
  const vars = new Map<string, string>();
  const el = {
    style: {
      transform: "perspective(1000px)",
      setProperty: (key: string, value: string) => { vars.set(key, value); },
      getPropertyValue: (key: string) => vars.get(key) ?? "",
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect,
  };
  return { el: el as unknown as Parameters<typeof applyTiltStyle>[0], vars };
}

const pointer = { clientX: 190, clientY: 90 };

describe("TiltCard reduced motion", () => {
  it("does not write a transform or glare position when reduced motion is requested", () => {
    const { el, vars } = fakeCard();
    applyTiltStyle(el, pointer, 8, true);
    expect(el.style.transform).toBe("perspective(1000px)");
    expect(vars.size).toBe(0);
  });

  it("keeps the normal tilt when reduced motion is off", () => {
    const { el, vars } = fakeCard();
    applyTiltStyle(el, pointer, 8, false);
    expect(el.style.transform).toContain("rotateY");
    expect(vars.get("--mx")).toBe("95.0%");
    expect(vars.get("--my")).toBe("90.0%");
  });

  it("reads the preference once and follows later media-query changes", () => {
    const listeners = new Set<() => void>();
    const media = {
      matches: true,
      addEventListener: (_type: string, fn: () => void) => { listeners.add(fn); },
      removeEventListener: (_type: string, fn: () => void) => { listeners.delete(fn); },
    };
    const seen: boolean[] = [];
    const stop = watchReducedMotion(media as unknown as MediaQueryList, (v) => seen.push(v));
    expect(seen).toEqual([true]);

    media.matches = false;
    listeners.forEach((fn) => fn());
    expect(seen).toEqual([true, false]);

    stop();
    expect(listeners.size).toBe(0);
  });
});
