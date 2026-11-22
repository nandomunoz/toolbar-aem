// Toolbar AEM landing: sticky header state, scroll reveals, active menu link and
// the interactive mock-up of the toolbar (environment and console switching).
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
    const single = [".sec .label", ".sec h2", ".sec .intro", ".note", ".wide-img", ".demo", ".table-wrap", ".small", ".close .wrap > *", ".install-update"];
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

  // Mock-up of the toolbar
  const demo = $(".demo");
  const page = $("[data-page]");
  if (!demo || !page) return;

  const lang = demo.dataset.lang === "es" ? "es" : "en";
  const path = "/content/wknd/us/en/adventures";
  const envs = {
    local: { label: "Local", color: "#15803d", host: "localhost:4502", cloud: false },
    dev: { label: "Dev", color: "#1d4ed8", host: "author-p00000-e00001.adobeaemcloud.com", cloud: true },
    qa: { label: "QA", color: "#b45309", host: "author-p00000-e00002.adobeaemcloud.com", cloud: true },
    stage: { label: "Stage", color: "#6d28d9", host: "author-p00000-e00003.adobeaemcloud.com", cloud: true },
  };
  const names = {
    en: { edit: ["Page Editor", "Editor"], view: ["Published view", "View"], sites: ["Sites", "Sites"], crx: ["CRXDE Lite", "CRXDE"] },
    es: { edit: ["Editor de páginas", "Editor"], view: ["Vista publicada", "Vista"], sites: ["Sites", "Sites"], crx: ["CRXDE Lite", "CRXDE"] },
  }[lang];
  const consoles = {
    edit: { url: (e) => `${e.cloud ? "/ui#/aem" : ""}/editor.html${path}.html` },
    view: { url: () => `${path}.html?wcmmode=disabled` },
    sites: { url: (e) => `${e.cloud ? "/ui#/aem" : ""}/sites.html${path}` },
    crx: { url: () => `/crx/de/index.jsp#${path}` },
  };
  let env = "local";
  let con = "edit";

  const envBtn = $("[data-env-btn]");
  const envMenu = $("[data-env-menu]");
  const bmBtn = $("[data-bm-btn]");
  const bmMenu = $("[data-bm-menu]");
  const status = $("[data-status]");

  // `say`: announce the result to screen readers (only after a user action)
  const render = (say) => {
    const e = envs[env];
    const [name, title] = names[con];
    const url = $("[data-url]");
    const next = e.host + consoles[con].url(e);
    if (url.textContent !== next) {
      url.textContent = next;
      url.classList.remove("is-new");
      void url.offsetWidth;
      url.classList.add("is-new");
    }
    $("[data-tabtitle]").textContent = `Adventures · ${title}`;
    $("[data-console-name]").textContent = name;
    $("[data-env-name]").textContent = e.label;
    $("[data-env-label]").textContent = e.label;
    const fav = $("[data-fav]");
    fav.textContent = e.label.slice(0, 2);
    [fav, $("[data-env-dot]"), page].forEach((el) => el.style.setProperty("--env", e.color));
    page.dataset.mode = con;
    $$("[data-console]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.console === con)));
    $$("[data-env]", envMenu).forEach((b) => b.setAttribute("aria-current", String(b.dataset.env === env)));
    if (say && status) status.textContent = `${name}, ${e.label}: ${next}`;
  };

  const toggle = (btn, menu, open) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  const closeAll = () => { toggle(envBtn, envMenu, false); toggle(bmBtn, bmMenu, false); };

  envBtn.addEventListener("click", (ev) => { ev.stopPropagation(); const o = envMenu.hidden; closeAll(); toggle(envBtn, envMenu, o); });
  bmBtn.addEventListener("click", (ev) => { ev.stopPropagation(); const o = bmMenu.hidden; closeAll(); toggle(bmBtn, bmMenu, o); });
  envMenu.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-env]");
    if (!b) return;
    env = b.dataset.env;
    closeAll();
    render(true);
    envBtn.focus();
  });
  $$("[data-console]").forEach((b) => b.addEventListener("click", () => { con = b.dataset.console; render(true); }));
  $$(".tb-menu-wrap").forEach((w) => w.addEventListener("focusout", (ev) => { if (!w.contains(ev.relatedTarget)) closeAll(); }));
  document.addEventListener("click", closeAll);
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    const wasOpen = !envMenu.hidden ? envBtn : !bmMenu.hidden ? bmBtn : null;
    closeAll();
    wasOpen?.focus();
  });
  render();
})();
