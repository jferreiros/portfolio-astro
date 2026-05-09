import { sfx } from "./sfx";

type SfxKind = "hover" | "click" | "switch";

const BOUND = new WeakSet<Element>();

const bindElement = (el: Element): void => {
  if (BOUND.has(el)) return;
  const kind = el.getAttribute("data-sfx") as SfxKind | null;
  if (!kind) return;

  if (kind === "hover") {
    el.addEventListener("mouseenter", () => sfx.hover());
  } else if (kind === "click") {
    el.addEventListener("click", () => sfx.click());
  } else if (kind === "switch") {
    el.addEventListener("click", () => sfx.switch());
  } else {
    return;
  }

  BOUND.add(el);
};

const scan = (root: ParentNode): void => {
  root.querySelectorAll("[data-sfx]").forEach(bindElement);
};

const observe = (): void => {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches?.("[data-sfx]")) bindElement(node);
        scan(node);
      });
      if (m.type === "attributes" && m.target instanceof Element && m.target.hasAttribute("data-sfx")) {
        bindElement(m.target);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-sfx"],
  });
};

const init = (): void => {
  scan(document);
  observe();
};

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}
