const envList = document.getElementById("envList");
const favoriteList = document.getElementById("favoriteList");
const status = document.getElementById("status");

const TOGGLES = ["showToolbar", "faviconSwap", "startCollapsed", "crxNewTab", "viewWcmModeDisabled", "pathFieldLinks"];

/* ---------- load ---------- */

async function load() {
  const config = await loadConfig();

  envList.innerHTML = "";
  config.environments.forEach(addEnvRow);

  favoriteList.innerHTML = "";
  config.favorites.forEach(addFavoriteRow);

  for (const key of TOGGLES) document.getElementById(key).checked = config.settings[key];
  document.getElementById("position").value = config.settings.position;
  document.getElementById("pluginLinksMode").value = config.settings.pluginLinksMode;
  document.querySelectorAll("[data-button]").forEach((input) => {
    input.checked = config.settings.buttons[input.dataset.button] !== false;
  });
}

/* ---------- environments ---------- */

function addEnvRow(env = {}) {
  const row = document.createElement("div");
  row.className = "env-row";
  row.dataset.id = env.id || "";

  const color = document.createElement("input");
  color.type = "color";
  color.value = env.color || DEFAULT_ENV_COLOR;
  color.title = "Dot color, also used for generated favicons";

  const label = document.createElement("input");
  label.type = "text";
  label.placeholder = "Prod";
  label.value = env.label || "";

  const url = document.createElement("input");
  url.type = "url";
  url.placeholder = "https://author-p1234-e5678.adobeaemcloud.com";
  url.value = env.origin || env.url || "";
  url.oninput = () => url.classList.remove("invalid");

  const remove = document.createElement("button");
  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "✕";
  remove.title = "Remove environment";
  remove.onclick = () => row.remove();

  row.append(color, label, url, remove);
  envList.appendChild(row);
}

/** Reads the rows back, validating every URL. Returns null when one is wrong. */
function collectEnvironments() {
  const environments = [];
  let valid = true;

  for (const row of envList.querySelectorAll(".env-row")) {
    const [color, label, url] = row.querySelectorAll("input");
    if (!label.value.trim() && !url.value.trim()) continue;

    const origin = toHttpOrigin(url.value);
    if (!origin) {
      url.classList.add("invalid");
      valid = false;
      continue;
    }

    environments.push({
      id: row.dataset.id || slugify(label.value || origin),
      label: label.value.trim() || origin,
      url: origin,
      color: color.value
    });
  }

  return valid ? environments : null;
}

/* ---------- bookmarks ---------- */

function addFavoriteRow(favorite = {}) {
  const row = document.createElement("div");
  row.className = "favorite-row";

  const label = document.createElement("input");
  label.type = "text";
  label.placeholder = "Content Fragments";
  label.value = favorite.label || "";

  const path = document.createElement("input");
  path.type = "text";
  path.placeholder = "/assets.html/content/dam/my-site or a full URL";
  path.value = favorite.path || "";

  const remove = document.createElement("button");
  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "✕";
  remove.title = "Remove bookmark";
  remove.onclick = () => row.remove();

  row.append(label, path, remove);
  favoriteList.appendChild(row);
}

/* toFavoritePath() is shared with the content script — see config.js. */

/** Reads the bookmark rows back, skipping any left blank. */
function collectFavorites() {
  const favorites = [];

  for (const row of favoriteList.querySelectorAll(".favorite-row")) {
    const [label, path] = row.querySelectorAll("input");
    if (!label.value.trim() || !path.value.trim()) continue;

    favorites.push({
      label: label.value.trim(),
      path: toFavoritePath(path.value)
    });
  }

  return favorites;
}

/* ---------- save ---------- */

async function save() {
  const environments = collectEnvironments();
  if (!environments) return showStatus("Check the highlighted URLs", true);

  const buttons = {};
  document.querySelectorAll("[data-button]").forEach((input) => {
    buttons[input.dataset.button] = input.checked;
  });

  const settings = {
    position: document.getElementById("position").value,
    pluginLinksMode: document.getElementById("pluginLinksMode").value,
    buttons
  };
  for (const key of TOGGLES) settings[key] = document.getElementById(key).checked;

  await chrome.storage.sync.set({
    [STORAGE_KEYS.environments]: environments,
    [STORAGE_KEYS.settings]: settings,
    [STORAGE_KEYS.favorites]: collectFavorites()
  });

  showStatus("Saved — reload your AEM tabs to apply");
}

async function reset() {
  const defaults = await loadDefaultConfig();
  await chrome.storage.sync.set({
    [STORAGE_KEYS.environments]: defaults.environments,
    [STORAGE_KEYS.settings]: defaults.settings,
    [STORAGE_KEYS.favorites]: defaults.favorites
  });
  await load();
  showStatus("Defaults restored");
}

/* ---------- import / export ---------- */

async function exportSettings() {
  const [defaults, values] = await Promise.all([
    loadDefaultConfig(),
    chrome.storage.sync.get(Object.values(STORAGE_KEYS))
  ]);
  const payload = {
    format: "toolbar-aem-settings",
    version: 1,
    exportedAt: new Date().toISOString(),
    [STORAGE_KEYS.environments]: values[STORAGE_KEYS.environments] || defaults.environments,
    [STORAGE_KEYS.settings]: values[STORAGE_KEYS.settings] || defaults.settings,
    [STORAGE_KEYS.favorites]: values[STORAGE_KEYS.favorites] || defaults.favorites
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `toolbar-aem-settings-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showStatus("Settings exported");
}

async function importSettings(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const environments = Array.isArray(payload[STORAGE_KEYS.environments])
      ? payload[STORAGE_KEYS.environments].map(normalizeEnvironment).filter(Boolean)
      : [];
    if (!environments.length) throw new Error("No valid environments found");

    const saved = payload[STORAGE_KEYS.settings] || {};
    const favorites = Array.isArray(payload[STORAGE_KEYS.favorites])
      ? payload[STORAGE_KEYS.favorites].filter((favorite) => favorite && favorite.label && favorite.path)
      : [];

    const defaults = await loadDefaultConfig();
    await chrome.storage.sync.set({
      [STORAGE_KEYS.environments]: environments,
      [STORAGE_KEYS.settings]: {
        ...defaults.settings,
        ...saved,
        buttons: { ...defaults.settings.buttons, ...(saved.buttons || {}) }
      },
      [STORAGE_KEYS.favorites]: favorites
    });
    await load();
    showStatus("Settings imported — reloading options");
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  } catch (error) {
    showStatus(`Import failed: ${error.message}`, true);
  }
}

let statusTimer;
function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
  status.classList.add("visible");

  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => status.classList.remove("visible"), 3000);
}

/* ---------- wiring ---------- */

document.getElementById("addEnv").onclick = () => addEnvRow();
document.getElementById("addFavorite").onclick = () => addFavoriteRow();
document.getElementById("save").onclick = save;
document.getElementById("reset").onclick = reset;
document.getElementById("exportSettings").onclick = exportSettings;
document.getElementById("importSettings").onclick = () => document.getElementById("importFile").click();
document.getElementById("importFile").onchange = importSettings;

load();
