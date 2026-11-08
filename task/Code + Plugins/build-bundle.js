/*
 * build-bundle.js -- concatenate the Brady-lab jsPsych v8 plugin suite into one file.
 *
 * Writes `brady-plugins.bundle.js`: the default color wheel, the shared BradyUtils
 * helpers, the BradySimilarity adaptive engine and all 17 plugins, in load order, so
 * an experiment can include one <script> instead of 20. The bundle is generated, so
 * don't edit it by hand: edit the sources and re-run this script.
 *
 * Run:  node build-bundle.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const DIR = __dirname;
const OUT = "brady-plugins.bundle.js";

// Load order: the wheel sets window.BradyColorWheel; every plugin reads BradyUtils at
// load, so utils comes before them; similarity-adaptive-utils (BradySimilarity) comes
// before the three similarity plugins. The 17 plugins don't depend on each other (each
// registers its own global jsPsych* class). The alternative wheels
// (brady-color-wheel-zhangluck/bae/hemmer.js) are left out on purpose: load one after
// the bundle to replace the default wheel, or pass `color_wheel:` per trial.
const FILES = [
  "brady-color-wheel.js",
  "brady-plugin-utils.js",
  "similarity-adaptive-utils.js",
  "jspsych-change-detection.js",
  "jspsych-2afc-keyboard.js",
  "jspsych-continuous-report.js",
  "jspsych-continuous-image-report.js",
  "jspsych-continuous-object-report.js",
  "jspsych-color-rotated-object.js",
  "jspsych-object-orientation-report.js",
  "jspsych-wm-forced-choice.js",
  "jspsych-wm-pairs.js",
  "jspsych-noise-dots.js",
  "jspsych-recognition.js",
  "jspsych-recall.js",
  "jspsych-spatial-report.js",
  "jspsych-rsvp.js",
  "jspsych-similarity-triad.js",
  "jspsych-similarity-quad.js",
  "jspsych-similarity-likert.js",
];

const date = new Date().toISOString().slice(0, 10);
const header =
  "/*\n" +
  " * brady-plugins.bundle.js  -- GENERATED FILE, do not edit by hand.\n" +
  " * Built " + date + " by build-bundle.js from " + FILES.length + " source files.\n" +
  " *\n" +
  " * The Brady-lab jsPsych v8 plugin suite in one file: the default Schurgin/Brady\n" +
  " * color wheel, the shared BradyUtils helpers, the BradySimilarity adaptive-similarity\n" +
  " * engine, and all 17 plugins. Include it with one script tag instead of listing every\n" +
  " * file:\n" +
  " *\n" +
  " *   <script src=\"https://unpkg.com/jspsych@8/dist/index.browser.min.js\"></script>\n" +
  " *   <script src=\"https://unpkg.com/canvas-confetti@1.9.3/dist/confetti.browser.js\"></script>  (optional: feedback confetti)\n" +
  " *   <script src=\"brady-plugins.bundle.js\"></script>\n" +
  " *\n" +
  " * To use a different color wheel, load a variant after this bundle (it reassigns\n" +
  " * window.BradyColorWheel, which the plugins read at trial time):\n" +
  " *   <script src=\"brady-plugins.bundle.js\"></script>\n" +
  " *   <script src=\"brady-color-wheel-zhangluck.js\"></script>\n" +
  " * ...or pass `color_wheel:` on an individual trial.\n" +
  " *\n" +
  " * Regenerate after editing any source file:  node build-bundle.js\n" +
  " */\n";

const parts = [header];
for (const f of FILES) {
  const src = fs.readFileSync(path.join(DIR, f), "utf8");
  parts.push(
    "\n/* ===================================================================== */\n" +
    "/* " + f + " */\n" +
    "/* ===================================================================== */\n" +
    src.replace(/\s*$/, "") + "\n"
  );
}

fs.writeFileSync(path.join(DIR, OUT), parts.join("\n"));
const bytes = fs.statSync(path.join(DIR, OUT)).size;
console.log("wrote " + OUT + " (" + FILES.length + " files, " + (bytes / 1024).toFixed(0) + " KB)");
