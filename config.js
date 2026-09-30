/* Shared configuration for the content script and the options page.
   Defaults live in default-config.json (editable by hand, never hardcoded here). */

const STORAGE_KEYS = {
  environments: "aemEnvironments",
  settings: "aemSettings",
  favorites: "aemFavorites"
};

/* Plugin registry: files under plugins/ call registerAemToolbarPlugin() to contribute
   project-specific bookmarks, console rules, etc. without touching this core file. */
window.AEM_TOOLBAR_PLUGINS = window.AEM_TOOLBAR_PLUGINS || [];

function registerAemToolbarPlugin(plugin) {
  window.AEM_TOOLBAR_PLUGINS.push(plugin || {});
}

let defaultConfigPromise;

/** Fetches default-config.json once per page and caches the result. */
function loadDefaultConfig() {
  if (!defaultConfigPromise) {
    defaultConfigPromise = fetch(chrome.runtime.getURL("default-config.json")).then((res) => res.json());
  }
  return defaultConfigPromise;
}

/** Reads storage and fills in any missing value with the JSON defaults. */
async function loadConfig() {
  const [defaults, stored] = await Promise.all([
    loadDefaultConfig(),
    chrome.storage.sync.get([
      STORAGE_KEYS.environments,
      STORAGE_KEYS.settings,
      STORAGE_KEYS.favorites
    ])
  ]);

  const environments = Array.isArray(stored[STORAGE_KEYS.environments]) && stored[STORAGE_KEYS.environments].length
    ? stored[STORAGE_KEYS.environments]
    : defaults.environments;

  const saved = stored[STORAGE_KEYS.settings] || {};

  const pluginFavorites = window.AEM_TOOLBAR_PLUGINS.flatMap((plugin) => plugin.favorites || []);
  const pluginConsoleRules = window.AEM_TOOLBAR_PLUGINS.flatMap((plugin) => plugin.consoleRules || []);

  return {
    environments: environments.map(normalizeEnvironment).filter(Boolean),
    settings: {
      ...defaults.settings,
      ...saved,
      buttons: { ...defaults.settings.buttons, ...(saved.buttons || {}) }
    },
    /* User-managed bookmarks (added/edited/removed from Options). Plugins never get
       overwritten by this — see pluginFavorites below. */
    favorites: Array.isArray(stored[STORAGE_KEYS.favorites])
      ? stored[STORAGE_KEYS.favorites]
          .filter((favorite) => favorite && favorite.label && favorite.path)
          .map((favorite) => ({ ...favorite, path: toFavoritePath(favorite.path) }))
      : defaults.favorites,
    /* Plugin-contributed bookmarks (see plugins/*.js) — always shown, not editable from Options. */
    pluginFavorites,
    consoleRules: [...pluginConsoleRules, ...(defaults.consoleRules || [])],
    bundledFavicons: defaults.bundledFavicons
  };
}

const DEFAULT_ENV_COLOR = "#7a8090";

function normalizeEnvironment(env) {
  if (!env || !env.url) return null;
  const origin = toHttpOrigin(env.url);
  if (!origin) return null; // malformed or non-http(s) URL, typed in the options page or imported
  // Imported files can carry anything here; only plain text is kept.
  const label = typeof env.label === "string" && env.label ? env.label : origin;
  return {
    id: typeof env.id === "string" && env.id ? env.id : slugify(label),
    label,
    origin,
    // Applied as a CSS value on AEM pages, so only plain hex colors get through.
    color: /^#[0-9a-f]{3,8}$/i.test(env.color) ? env.color : DEFAULT_ENV_COLOR
  };
}

/** Origin of an http(s) URL, or null for anything else (javascript:, file:, malformed...). */
function toHttpOrigin(value) {
  try {
    const { protocol, origin } = new URL(String(value).trim());
    return protocol === "http:" || protocol === "https:" ? origin : null;
  } catch {
    return null;
  }
}

/** Bookmarks are stored exactly as typed — a full URL or a bare path, the user's choice. */
function toFavoritePath(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
