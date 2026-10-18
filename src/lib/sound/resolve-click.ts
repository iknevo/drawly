import type { SoundName } from "./types";

const ROLE_RULES: { selector: string; sound: SoundName }[] = [
  { selector: "[aria-haspopup]", sound: "open" },
  {
    selector: '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    sound: "menu",
  },
  { selector: '[role="option"]', sound: "option" },
  { selector: '[role="tab"]', sound: "tab" },
  {
    selector: '[role="switch"], [role="checkbox"], [role="radio"], [aria-pressed], summary',
    sound: "toggle",
  },
];

function isExternalLink(link: HTMLAnchorElement): boolean {
  if (link.target === "_blank") return true;
  const href = link.getAttribute("href");
  if (!href) return false;
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

export function resolveClickSound(element: Element): SoundName | null {
  const override = element.closest<HTMLElement>("[data-sound]");
  const overrideValue = override?.dataset.sound;
  if (overrideValue === "none") return null;
  if (overrideValue) return overrideValue as SoundName;

  for (const rule of ROLE_RULES) {
    if (element.closest(rule.selector)) return rule.sound;
  }

  const anchor = element.closest<HTMLAnchorElement>("a[href]");
  if (anchor) return isExternalLink(anchor) ? "nav-external" : "nav";

  if (element.closest('[data-variant="destructive"]')) return "delete";
  if (element.closest('button, [role="button"]')) return "press";

  return "click";
}
