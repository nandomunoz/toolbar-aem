const svg = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;

const ICON = {
  edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  view: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
  sites: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  crx: svg('<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'),
  bookmark: svg('<path d="M6 3h12a1 1 0 0 1 1 1v16l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>'),
  plug: svg('<path d="M9 2v4"/><path d="M15 2v4"/><path d="M8 8h8a1 1 0 0 1 1 1v3a5 5 0 0 1-5 5h-0a5 5 0 0 1-5-5V9a1 1 0 0 1 1-1Z"/><path d="M12 17v5"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
  goTo:
    '<svg viewBox="0 0 11 8" fill="currentColor" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="2" y="0" width="1" height="1"/><rect x="8" y="0" width="1" height="1"/>' +
    '<rect x="3" y="1" width="1" height="1"/><rect x="7" y="1" width="1" height="1"/>' +
    '<rect x="2" y="2" width="7" height="1"/>' +
    '<rect x="1" y="3" width="2" height="1"/><rect x="4" y="3" width="3" height="1"/><rect x="8" y="3" width="2" height="1"/>' +
    '<rect x="0" y="4" width="11" height="1"/>' +
    '<rect x="0" y="5" width="1" height="1"/><rect x="2" y="5" width="7" height="1"/><rect x="10" y="5" width="1" height="1"/>' +
    '<rect x="0" y="6" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="8" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/>' +
    '<rect x="3" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="6" y="7" width="1" height="1"/><rect x="7" y="7" width="1" height="1"/>' +
    "</svg>",
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'),
  chevronDown: svg('<path d="m6 9 6 6 6-6"/>'),
  chevronUp: svg('<path d="m18 15-6-6-6 6"/>')
};

const BUTTONS = [
  { key: "edit", label: "Edit", icon: ICON.edit, mode: "edit", id: "btn-edit" },
  { key: "view", label: "View", icon: ICON.view, mode: "view", id: "btn-view" },
  { key: "sites", label: "Sites", icon: ICON.sites, mode: "sites", id: "btn-sites" },
  { key: "crx", label: "CRXDE", icon: ICON.crx, mode: "crx", id: "btn-crx" }
];

/* Filled from storage/default-config.json before the toolbar is built (see config.js). */
let CONFIG = { environments: [], settings: { buttons: {} }, favorites: [], pluginFavorites: [], consoleRules: [], bundledFavicons: {} };

function isLighthouseAudit() {
  return Boolean(
    window.__lighthouse ||
    window.__LIGHTHOUSE__ ||
    navigator.webdriver
  );
}

function initToolbar() {
  if (document.querySelector(".aem-toolbar")) return;
  if (isLighthouseAudit()) return;

  const { settings } = CONFIG;

  const toolbar = document.createElement("div");
  toolbar.className = "aem-toolbar";
  if (settings.position === "top") toolbar.classList.add("top");

  const group = document.createElement("div");
  group.className = "aem-toolbar-group";
  group.appendChild(createEnvDropdown());

  for (const { key, label, icon, mode, id } of BUTTONS) {
    if (!settings.buttons[key]) continue;

    const button = document.createElement("button");
    button.className = "aem-toolbar-cell aem-toolbar-btn";
    button.id = id;
    button.dataset.mode = mode;
    button.dataset.label = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = icon;
    button.onclick = () => navigateTo(mode);
    group.appendChild(button);
  }

  if (settings.buttons.favorites) {
    const mergePlugins = settings.pluginLinksMode !== "separate";
    const favorites = createFavoritesDropdown(mergePlugins);
    if (favorites) group.appendChild(favorites);

    if (!mergePlugins) {
      const pluginLinks = createPluginLinksDropdown();
      if (pluginLinks) group.appendChild(pluginLinks);
    }
  }

  const options = document.createElement("button");
  options.className = "aem-toolbar-cell aem-toolbar-options";
  options.dataset.label = "Settings";
  options.setAttribute("aria-label", "Settings");
  options.innerHTML = ICON.settings;
  options.onclick = () => chrome.runtime.sendMessage({ type: "open-options" });
  group.appendChild(options);

  const toggle = document.createElement("button");
  toggle.className = "aem-toolbar-cell aem-toolbar-toggle";
  toggle.innerHTML = ICON.chevronDown;
  toggle.dataset.label = "Hide";
  toggle.setAttribute("aria-label", "Hide toolbar");
  toggle.onclick = () => toggleToolbar(toolbar, toggle);

  toolbar.appendChild(group);
  toolbar.appendChild(toggle);
  document.body.appendChild(toolbar);

  if (settings.startCollapsed) toggleToolbar(toolbar, toggle);

  document.addEventListener("click", () => closeMenus());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenus();
  });

  updateActiveButton();
}

function toggleToolbar(toolbar, toggle) {
  const collapsed = toolbar.classList.toggle("collapsed");
  const opensDown = toolbar.classList.contains("top");

  if (collapsed) closeMenus();
  toolbar.querySelector(".aem-toolbar-group").classList.toggle("hidden", collapsed);
  toggle.innerHTML = collapsed === opensDown ? ICON.chevronDown : ICON.chevronUp;
  toggle.dataset.label = collapsed ? "Show" : "Hide";
  toggle.setAttribute("aria-label", collapsed ? "Show toolbar" : "Hide toolbar");
}

/* ---------- environment switcher ---------- */

function createEnvDropdown() {
  const wrapper = document.createElement("div");
  wrapper.className = "aem-toolbar-env";

  const current = getCurrentEnvironment();

  const toggle = document.createElement("button");
  toggle.className = "aem-toolbar-cell aem-toolbar-env-toggle";
  toggle.id = "btn-env";
  toggle.setAttribute("aria-label", "Switch environment");
  toggle.append(
    createDot(current),
    createName(current ? current.label : "Env")
  );
  toggle.insertAdjacentHTML("beforeend", ICON.chevronDown);
  toggle.onclick = (event) => {
    event.stopPropagation();
    toggleMenu(wrapper);
  };

  const menu = document.createElement("div");
  menu.className = "aem-toolbar-env-menu hidden";

  for (const env of CONFIG.environments) {
    const item = document.createElement("button");
    item.className = "aem-toolbar-env-item";
    item.title = env.origin;
    item.append(createDot(env), createName(env.label));

    if (current && current.id === env.id) {
      item.classList.add("current");
      item.disabled = true;
    } else {
      item.onclick = () => switchEnvironment(env);
    }

    menu.appendChild(item);
  }

  wrapper.appendChild(toggle);
  wrapper.appendChild(menu);
  return wrapper;
}

/* ---------- bookmarks ---------- */

/** A bookmark's stored value: used as-is if it's already a full URL, otherwise appended to the current origin. */
function resolveFavoriteUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  // Always a path of the current origin: without the slash, "@example.com" or ".example.com" would switch host.
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Dropdown of plugin + user-defined shortcuts, always opened on the currently active environment. */
function createFavoritesDropdown(mergePlugins) {
  const items = mergePlugins
    ? [...CONFIG.pluginFavorites.map((favorite) => ({ ...favorite, isPlugin: true })), ...CONFIG.favorites]
    : CONFIG.favorites;

  return createBookmarksDropdown({ id: "btn-favorites", label: "Bookmarks", icon: ICON.bookmark, items });
}

/** Dropdown holding only the plugin-contributed links, used when settings.pluginLinksMode is "separate". */
function createPluginLinksDropdown() {
  const items = CONFIG.pluginFavorites.map((favorite) => ({ ...favorite, isPlugin: true }));
  return createBookmarksDropdown({ id: "btn-plugin-links", label: "Plugin links", icon: ICON.user, items });
}

/** Shared builder for the Bookmarks and Plugin links dropdowns (same markup/behavior, different content). */
function createBookmarksDropdown({ id, label, icon, items }) {
  if (!items.length) return null;

  const wrapper = document.createElement("div");
  wrapper.className = "aem-toolbar-favorites";

  const toggle = document.createElement("button");
  toggle.className = "aem-toolbar-cell aem-toolbar-favorites-toggle";
  toggle.id = id;
  toggle.dataset.label = label;
  toggle.setAttribute("aria-label", `Open ${label.toLowerCase()}`);
  toggle.innerHTML = icon;
  toggle.insertAdjacentHTML("beforeend", ICON.chevronDown);
  toggle.onclick = (event) => {
    event.stopPropagation();
    toggleMenu(wrapper);
  };

  const menu = document.createElement("div");
  menu.className = "aem-toolbar-favorites-menu hidden";

  for (const item of items) {
    const link = document.createElement("a");
    link.className = "aem-toolbar-favorites-item";
    link.href = resolveFavoriteUrl(item.path);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = item.isPlugin ? "From a plugin" : "Bookmark";
    link.insertAdjacentHTML("beforeend", item.isPlugin ? ICON.plug : ICON.bookmark);
    link.append(createName(item.label));
    menu.appendChild(link);
  }

  wrapper.appendChild(toggle);
  wrapper.appendChild(menu);
  return wrapper;
}

function createDot(env) {
  const dot = document.createElement("span");
  dot.className = "aem-toolbar-env-dot";
  if (env) dot.style.background = env.color;
  return dot;
}

function createName(text) {
  const name = document.createElement("span");
  name.className = "aem-toolbar-env-name";
  name.textContent = text;
  return name;
}

/** Opens the dropdown of the given wrapper (env, quick links or bookmarks), closing any other open one. */
function toggleMenu(wrapper) {
  const wasOpen = wrapper.classList.contains("open");
  closeMenus();
  if (wasOpen) return;

  wrapper.classList.add("open");
  wrapper.querySelector(".aem-toolbar-env-menu, .aem-toolbar-favorites-menu").classList.remove("hidden");
}

function closeMenus() {
  document.querySelectorAll(".aem-toolbar-env, .aem-toolbar-favorites").forEach((wrapper) => {
    wrapper.classList.remove("open");
    wrapper.querySelector(".aem-toolbar-env-menu, .aem-toolbar-favorites-menu").classList.add("hidden");
  });
}

function getCurrentEnvironment() {
  return CONFIG.environments.find((env) => new URL(env.origin).host === window.location.host);
}

/** Reopens the current view (same mode, same content path) on another environment. */
function switchEnvironment(env) {
  window.location.href = buildUrl(env.origin, getCurrentMode(), getContentPath());
}

/* ---------- favicon per environment ---------- */

function applyEnvFavicon(env) {
  if (!env || !document.head) return;

  // Own keys only: an environment id like "constructor" must not resolve to an inherited property.
  const bundled = Object.hasOwn(CONFIG.bundledFavicons, env.id) ? CONFIG.bundledFavicons[env.id] : null;
  const href = bundled ? chrome.runtime.getURL(bundled) : generateFavicon(env);
  const type = bundled && bundled.endsWith(".ico") ? "image/x-icon" : "image/png";

  const apply = () => {
    document
      .querySelectorAll('link[rel~="icon"]:not([data-aem-toolbar])')
      .forEach((link) => link.remove());

    let link = document.head.querySelector("link[data-aem-toolbar]");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = type;
      link.href = href;
      link.dataset.aemToolbar = "";
      document.head.appendChild(link);
    }
  };

  apply();
  // AEM consoles rewrite <head> while navigating, so reapply when that happens.
  new MutationObserver(apply).observe(document.head, { childList: true });
}

/** Fallback icon for environments the user added in the options page. */
function generateFavicon(env) {
  const size = 56;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = env.color;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, 13);
  ctx.fill();

  const initials = env.label.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${initials.length > 1 ? 26 : 40}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + 2);

  return canvas.toDataURL("image/png");
}

/* ---------- context detection ---------- */

const isCloudHost = (url) =>
  url.includes("adobeaemcloud.com") || url.includes("aemcloud.net");

const isCloudService = () => isCloudHost(window.location.hostname);

function getCurrentMode() {
  const path = window.location.pathname + window.location.hash;
  if (path.includes("/editor.html")) return "edit";
  if (path.includes("/sites.html")) return "sites";
  if (path.includes("/crx/de/")) return "crx";
  if (path.includes("/content/")) return "view";
  return "unknown";
}

function getContentPath() {
  const match = (window.location.pathname + window.location.hash).match(/\/content\/[^?#\s]+/);
  return match ? match[0] : "/content";
}

function updateActiveButton() {
  const mode = getCurrentMode();
  document.querySelectorAll(".aem-toolbar-btn").forEach((button) => {
    button.disabled = button.dataset.mode === mode;
  });
}

/* ---------- navigation ---------- */

function buildUrl(origin, mode, contentPath) {
  const cloud = isCloudHost(origin);
  const withHtml = contentPath.endsWith(".html") ? contentPath : `${contentPath}.html`;
  const withoutHtml = contentPath.replace(/\.html$/, "");

  switch (mode) {
    case "edit":
      return `${origin}${cloud ? "/ui#/aem/editor.html" : "/editor.html"}${withHtml}`;
    case "view":
      return `${origin}${withHtml}${CONFIG.settings.viewWcmModeDisabled ? "?wcmmode=disabled" : ""}`;
    case "sites":
      return `${origin}${cloud ? "/ui#/aem/sites.html" : "/sites.html"}${withoutHtml}`;
    case "crx":
      return `${origin}/crx/de/index.jsp#${withoutHtml}`;
    default:
      // Unknown console (assets, projects, ...): keep the path when both ends
      // share the same URL layout, otherwise fall back to the home page.
      return cloud === isCloudService()
        ? `${origin}${window.location.pathname}${window.location.search}${window.location.hash}`
        : `${origin}/`;
  }
}

function navigateTo(mode) {
  const url = buildUrl(window.location.origin, mode, getContentPath());

  if (mode === "crx" && CONFIG.settings.crxNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.href = url;
}

/* ---------- path field "go to" button ---------- */

/** Best console for a JCR path typed/picked in a Granite UI path field. Project-specific overrides
    live in default-config.json's "consoleRules" (checked before the generic AEM defaults). */
function resolvePathConsoleUrl(path) {
  const origin = window.location.origin;
  const rule = (CONFIG.consoleRules || []).find((entry) => path.includes(entry.match));
  if (rule) return `${origin}${rule.console}${path}`;
  if (path.startsWith("/content/dam/")) return `${origin}/assets.html${path}`;
  if (path.startsWith("/content/experience-fragments/")) return `${origin}/aem/experience-fragments.html${path}`;
  if (path.startsWith("/content/")) return `${origin}/sites.html${path}`;
  return `${origin}/crx/de/index.jsp#${path}`;
}

/** Adds a "go to this path" button next to every Granite UI path field's browse button. */
function enhancePathFields(root) {
  root.querySelectorAll(".coral-InputGroup:not([data-aem-toolbar-pathgo])").forEach((group) => {
    const input = group.querySelector("input[is='coral-textfield'], input.coral-Textfield, input[type='text']");
    const browseButton = group.querySelector(".coral-InputGroup-button");
    if (!input || !browseButton) return;

    group.dataset.aemToolbarPathgo = "";

    const goButton = document.createElement("button");
    goButton.type = "button";
    goButton.className = `${browseButton.className} aem-toolbar-pathgo-btn`;
    goButton.title = "Go to this path";
    goButton.setAttribute("aria-label", "Go to this path");
    goButton.innerHTML = ICON.goTo;
    goButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const path = input.value.trim();
      if (path) window.open(resolvePathConsoleUrl(path), "_blank", "noopener,noreferrer");
    };

    browseButton.insertAdjacentElement("afterend", goButton);
  });
}

/** Coral dialogs load their content asynchronously, so keep watching for new path fields. */
function observePathFields() {
  enhancePathFields(document);
  new MutationObserver(() => enhancePathFields(document)).observe(document.body, { childList: true, subtree: true });
}

/* ---------- bootstrap ---------- */

(async function () {
  if (window.hasRunAEMToolbar) return;

  CONFIG = await loadConfig();

  // Exact or subdomain matches only: a substring check would also accept "localhost.example.com".
  const hosts = CONFIG.environments.map((env) => new URL(env.origin).hostname);
  const exactHosts = ["localhost", ...hosts];
  const cloudDomains = ["aemcloud.net", "adobeaemcloud.com"];
  const { hostname } = location;
  const allowed =
    exactHosts.includes(hostname) ||
    cloudDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  if (!allowed) return;

  window.hasRunAEMToolbar = true;

  const start = () => {
    if (!document.body) return setTimeout(start, 200);
    if (CONFIG.settings.faviconSwap) applyEnvFavicon(getCurrentEnvironment());
    if (CONFIG.settings.showToolbar) initToolbar();
    if (CONFIG.settings.pathFieldLinks) observePathFields();
  };
  start();
})();
