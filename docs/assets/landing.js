// Toolbar AEM landing: sticky header state, scroll reveals and active menu link.
// The colour mode, the language switch and the copy buttons are LUZ's own
// scripts (loaded from its CDN) and need nothing here.
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const io = "IntersectionObserver" in window;

  // Header: a line and a blur once the page leaves the top
  const header = $("[data-header]");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Active menu link for the section in view
  const links = $$(".nav a[href^='#']");
  if (io && links.length) {
    const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        byId.get(e.target.id)?.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // Scroll reveal: quiet fade and rise, lists staggered
  const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (io && !quiet) {
    const groups = [".steps li", ".features li", ".install-steps li", ".perms li", "details"];
    const single = [".sec .label", ".sec h2", ".sec .intro", ".note", ".wide-img", ".table-wrap", ".small", ".close .wrap > *", ".install-update"];
    const items = new Set();
    single.forEach((s) => $$(s).forEach((el) => items.add(el)));
    groups.forEach((s) => $$(s).forEach((el, k) => { el.style.setProperty("--i", String(k % 6)); items.add(el); }));
    const show = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        show.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach((el) => { el.classList.add("reveal"); show.observe(el); });
  }
})();
