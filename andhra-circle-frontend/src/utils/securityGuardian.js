/**
 * Security & Anti-Scraping Guardian
 * Adds passive deterrents against automated DevTools scraping and casual copying
 * of protected academic content while keeping legitimate student interactions intact.
 */

export function initSecurityGuardian() {
  if (typeof window === "undefined") return;

  // 1. Console Academic Ownership & Responsible Disclosure Banner (production only)
  if (import.meta.env.PROD && typeof sessionStorage !== "undefined" && !sessionStorage.getItem("jntu_sec_banner")) {
    const bannerStyleTitle = "color: #ffb95f; font-size: 16px; font-weight: bold; background: #012b23; padding: 4px 10px; border-radius: 4px;";
    const bannerStyleBody = "color: #94a3b8; font-size: 11px; padding: 2px 0;";

    try {
      console.log("%cJNTU Circle Academic Platform", bannerStyleTitle);
      console.log(
        "%c⚠️  NOTICE: All intellectual property, verified student resources, and software architectures are monitored and protected. Automated extraction, reverse-engineering, and scraping are strictly monitored under Terms of Service.",
        bannerStyleBody
      );
      sessionStorage.setItem("jntu_sec_banner", "1");
    } catch {
      // ignore
    }
  }

  // 2. Prevent right-click / context menu on designated protected classes
  document.addEventListener("contextmenu", (e) => {
    const target = e.target;
    if (
      target &&
      target.closest &&
      target.closest(".protected-academic-content, .pdf-canvas-container, .watermark-layer, .notes-reader-container")
    ) {
      e.preventDefault();
    }
  });

  // 3. Prevent casual dragging of sensitive preview images / rendered cards
  document.addEventListener("dragstart", (e) => {
    const target = e.target;
    if (
      target &&
      target.closest &&
      target.closest(".protected-academic-content, .pdf-canvas-container, .watermark-layer")
    ) {
      e.preventDefault();
    }
  });
}
