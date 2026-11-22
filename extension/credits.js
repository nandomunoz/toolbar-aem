/* Matrix rain on a canvas + phosphor terminal typing, running only while open. */

/* Matrix Code NFI cannot be redistributed, so it is not bundled: it is used only when it is
   installed on the system, otherwise the monospace fallbacks apply. It maps latin characters
   to the film's glyphs, so feed it latin. */
const FONT = '"Matrix Code NFI", ui-monospace, SFMono-Regular, Menlo, monospace';
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.=*+-<>";
const FONT_SIZE = 18;
const FRAME_MS = 45;

const overlay = document.getElementById("credits");
const canvas = document.getElementById("matrixCanvas");
const context = canvas.getContext("2d");

let drops = [];
let frameId = null;
let lastFrame = 0;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);

  const columns = Math.ceil(width / FONT_SIZE);
  drops = Array.from({ length: columns }, () => Math.random() * -40);
}

function draw(now) {
  frameId = requestAnimationFrame(draw);
  if (now - lastFrame < FRAME_MS) return;
  lastFrame = now;

  const width = window.innerWidth;
  const height = window.innerHeight;

  /* Translucent wash instead of a clear: that is what leaves the trails. */
  context.fillStyle = "rgba(0, 0, 0, 0.075)";
  context.fillRect(0, 0, width, height);
  context.font = `${FONT_SIZE}px ${FONT}`;
  context.textBaseline = "top";

  drops.forEach((row, index) => {
    const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const x = index * FONT_SIZE;
    const y = row * FONT_SIZE;

    context.fillStyle = "#c8ffd9";
    context.fillText(glyph, x, y);
    context.fillStyle = "#2fd66c";
    context.fillText(glyph, x, y - FONT_SIZE);

    drops[index] = y > height && Math.random() > 0.975 ? 0 : row + 1;
  });
}

/* ---------- terminal typing ---------- */

const termText = document.getElementById("termText");
const VERSION = chrome.runtime.getManifest().version;

/* Each scene is typed line by line, held on screen, then wiped like a CRT. */
const SCENES = [
  ["Wake up, Neo...", "The Matrix has you...", "Follow the white rabbit."],
  ["Knock, knock, Neo."],
  [`Toolbar AEM Browser v${VERSION}`, "the One for AEM authors."],
  ["Created by Nando Muñoz.", "Plain JavaScript.", "No frameworks. No build. No trackers."],
  ["Ezekiel 25:17?"],
  ["The path of the righteous man is beset on all sides by the inequities of the selfish and the tyranny of evil men."],
  ["Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness, for he is truly his brother's keeper and the finder of lost children."],
  ["And I will strike down upon thee with great vengeance and furious anger those who attempt to poison and destroy my brothers."],
  ["And you will know my name is the Lord, when I lay my vengeance upon thee."],
  ["Free your mind..."],
  ["..."],
  ["..."],
  /* Kept in Spanish on purpose. */
  [
    "Me enamore de una mujer que era tan publica y plebeya",
    "Que cada noche se pintaba con los rayos de la luna",
    "Y entre lo oscura de sus trenzas amarraba una a una",
    "Las más lejanas estrellas"
  ],
  [
    "Y era tan bella, tan vulgar, tan asesina y tan caliente",
    "Tan distinguida, tan urbana, tan delincuente y tan culpable",
    "Tan prostituta como yo, tan cínica y tan miserable",
    "Que soportaba a la gente"
  ],
  [
    "Tenía historia para regalar, las que no caben en cien libros",
    "Tenía la lluvia y la nevada como única agua de baño",
    "Tenía una edad tan consagrada que sus eternos cumpleaños",
    "Los celebraba por siglos"
  ],
  [
    "Olía a sangre y libertad al levantarse de la siesta",
    "Sus huesos eran de alquitrán y sus pestañas de metales",
    "Y era tan pura que al llegar la noche de los carnavales",
    "Se disfrazaba de fiesta"
  ],
  [
    "Me enamore hasta de las letras de su nombre",
    "Quizás usted ya sepa la mujer que digo",
    "Quien se la cruza no la deja en el olvido",
    "Aunque haya sido de la mano de otro hombre"
  ],
  [
    "Con ella tengo el mundo entero en un detalle",
    "Por ella, amor y todo lo he dejado",
    "Permitan que se la presente y encantado: ¡La calle!"
  ]
];

const LINE_PAUSE = 750;
const SCENE_PAUSE = 2100;

let typeRun = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* Uneven keystrokes read as human; a flat interval reads as a ticker. */
const keyDelay = () => 48 + Math.random() * 90;

async function playScript() {
  const run = ++typeRun;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    termText.textContent = SCENES.map((scene) => scene.join("\n")).join("\n\n");
    return;
  }

  for (const scene of SCENES) {
    let shown = "";
    termText.textContent = "";

    for (const line of scene) {
      for (const char of line) {
        if (run !== typeRun) return;
        shown += char;
        termText.textContent = shown;
        await sleep(keyDelay());
      }
      shown += "\n";
      if (run !== typeRun) return;
      await sleep(LINE_PAUSE);
    }

    if (run !== typeRun) return;
    await sleep(SCENE_PAUSE);
  }
  /* Last scene stays on screen with the cursor blinking. */
}

/* ---------- open / close ---------- */

function openCredits() {
  overlay.hidden = false;
  resizeCanvas();

  window.addEventListener("resize", resizeCanvas);
  lastFrame = 0;
  frameId = requestAnimationFrame(draw);
  playScript();
  document.getElementById("creditsClose").focus();
}

function closeCredits() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  typeRun++;
  termText.textContent = "";
  window.removeEventListener("resize", resizeCanvas);
  overlay.hidden = true;
  document.getElementById("creditsBtn").focus();
}

/* ---------- wiring ---------- */

document.getElementById("creditsBtn").onclick = openCredits;
document.getElementById("creditsClose").onclick = closeCredits;

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !overlay.hidden) closeCredits();
});
