/*
 * build-reference.js -- regenerate the parameter and data tables in reference.html
 * from the plugin sources.
 *
 * For each plugin, the field names, types, array-ness and defaults come from the
 * plugin's own `info` block (loaded in node), and each parameter/data description is
 * the JSDoc comment directly above that field. A field with no JSDoc of its own
 * inherits the description of the field above it. The plugin's description is the
 * first one or two sentences of its banner's first paragraph (after the title line). The script rewrites only the one-line
 * `const PLUGINS = [...]` data array in reference.html; the layout, the Run-demo
 * configs and the site chrome are left alone. It warns about any plugin that has no
 * Run-demo config.
 *
 * The plugins it documents, and their order, come from reference.html's own
 * `<script src="jspsych-*.js">` tags, so adding a plugin's script tag to the page is
 * enough for it to be picked up here.
 *
 * Run:  node build-reference.js
 * Re-run after editing any plugin's parameters, data schema, banner, or their JSDoc.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const DIR = __dirname;
const REF = path.join(DIR, "reference.html");

// jsPsych ParameterType -> the label shown in the reference tables.
const TYPE_LABEL = {
  STRING: "string", INT: "integer", FLOAT: "float", BOOL: "boolean",
  HTML_STRING: "HTML string", IMAGE: "image", AUDIO: "audio", VIDEO: "video",
  KEY: "key", KEYS: "keys", OBJECT: "object", FUNCTION: "function",
  COMPLEX: "complex", SELECT: "select", TIMELINE: "timeline", KEYCODE: "keycode",
};

// Minimal shims so a plugin file defines its class + info at load without a
// trial ever running. ParameterType returns each accessed name verbatim
// (jspsych.ParameterType.STRING -> "STRING"), so info.parameters[k].type is the
// enum name and we map it to a label below.
global.window = global.window || global;
global.jsPsychModule = { ParameterType: new Proxy({}, { get: (_, k) => String(k) }) };

const html = fs.readFileSync(REF, "utf8");

// The plugins to document, in the order reference.html loads them.
const files = [...html.matchAll(/<script src="(jspsych-[a-z0-9-]+\.js)">/g)].map((m) => m[1]);
if (!files.length) {
  console.error("build-reference: no jspsych-*.js <script> includes found in reference.html");
  process.exit(1);
}

function typeLabel(field) {
  const base = TYPE_LABEL[field.type] || String(field.type).toLowerCase();
  return base + (field.array ? " []" : "");
}
function cleanDoc(block) {
  return block.split("\n").map((l) => l.replace(/^\s*\*?\s?/, "").trimEnd()).join(" ").replace(/\s+/g, " ").trim();
}
// The JSDoc /** ... */ written immediately before the `key: {` declaration in
// `region`. Taking only the last comment block that directly abuts the key (no
// non-space text between its `*/` and the key) avoids ever splicing two
// adjacent JSDoc blocks together.
function docFor(region, key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = region.match(new RegExp("(?:^|\\n)\\s*" + esc + "\\s*:\\s*\\{"));
  if (!m) return "";
  const pre = region.slice(0, m.index); // up to (not including) the key line
  const cEnd = pre.lastIndexOf("*/");
  if (cEnd < 0 || /\S/.test(pre.slice(cEnd + 2))) return "";
  const cStart = pre.lastIndexOf("/**", cEnd);
  if (cStart < 0) return "";
  return cleanDoc(pre.slice(cStart + 3, cEnd));
}

// The plugin's description: the first paragraph of its banner comment after the title
// line(s) ("jspsych-X.js -- jsPsych v8 plugin"), cut to its first two sentences. A
// sentence that ends in ":" (it introduces a list) is dropped.
function paradigmSummary(src) {
  const m = src.match(/^\/\*([\s\S]*?)\*\//);
  if (!m) return "";
  const lines = m[1].split(/\r?\n/).map((l) => l.replace(/^\s*\*?\s?/, "").trim());
  let i = 0;
  while (i < lines.length && lines[i] === "") i++;   // to the title
  while (i < lines.length && lines[i] !== "") i++;   // past the title line(s)
  while (i < lines.length && lines[i] === "") i++;
  const para = [];
  while (i < lines.length && lines[i] !== "") para.push(lines[i++]);
  const text = para.join(" ").replace(/\s+/g, " ").trim();
  const sentences = text.split(/(?<=[.!])(?<!\b(?:i\.e|e\.g|vs)\.)\s+/).filter((t) => !/:$/.test(t));
  return sentences.slice(0, 2).join(" ");
}

const plugins = files.map((file) => {
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const globalName = (src.match(/var\s+(jsPsych\w+)\s*=/) || [])[1] || null;
  vm.runInThisContext(src, { filename: file });
  const cls = globalName ? global[globalName] : null;
  if (!cls || !cls.info) throw new Error("build-reference: " + file + " did not define an info block (global " + globalName + ")");
  const info = cls.info;
  // desc = a one- or two-sentence paradigm summary from the banner (paradigmSummary)
  const banner = paradigmSummary(src) || file;

  // Split the parameters vs data regions at the info block's `data: {` so a
  // name used in BOTH (e.g. rating_points) picks up the right description.
  // Tolerant of spacing variants (`parameters :`, `data:{`); `data` is matched
  // AFTER `parameters` so a stray earlier "data:" can't fold the regions.
  const pm = src.match(/\bparameters\s*:\s*\{/);
  const pStart = pm ? pm.index : -1;
  const dm = pStart >= 0 ? src.slice(pStart).match(/\bdata\s*:\s*\{/) : null;
  const dStart = dm ? pStart + dm.index : -1;
  const paramsRegion = pStart >= 0 ? src.slice(pStart, dStart >= 0 ? dStart : undefined) : src;
  const dataRegion = dStart >= 0 ? src.slice(dStart) : "";

  // A field with no JSDoc directly above it shares the comment of the sibling(s)
  // above it (a common style, e.g. one `/** ... same / different keys */` over
  // both `same_key` and `different_key`), so inherit the previous field's desc.
  let lastP = "";
  const params = Object.keys(info.parameters || {}).map((k) => {
    const d = info.parameters[k].default;
    const doc = docFor(paramsRegion, k);
    lastP = doc || lastP;
    return { name: k, type: typeLabel(info.parameters[k]), desc: doc || lastP, default: d === undefined ? "" : JSON.stringify(d) };
  });
  let lastD = "";
  const data = Object.keys(info.data || {}).map((k) => {
    const doc = docFor(dataRegion, k);
    lastD = doc || lastD;
    return { name: k, type: typeLabel(info.data[k]), desc: doc || lastD };
  });
  return { file, global: globalName, name: info.name, desc: banner, params, data };
});

// Warn about any documented plugin that has no Run-demo config on the page.
const demoBlock = (html.match(/const DEMO = \{([\s\S]*?)\n\s*\};/) || [])[1] || "";
const demoKeys = new Set([...demoBlock.matchAll(/"([a-z0-9-]+)":\s*\(\)/g)].map((m) => m[1]));
plugins.forEach((p) => { if (!demoKeys.has(p.name)) console.warn("  (note) no Run-demo config for '" + p.name + "' in reference.html"); });

// Replace the single `const PLUGINS = [...]` line in place.
const lines = html.split("\n");
const idx = lines.findIndex((l) => /^\s*const PLUGINS\s*=/.test(l));
if (idx < 0) { console.error("build-reference: could not find the `const PLUGINS = ...` line in reference.html"); process.exit(1); }
if (!/\];\s*$/.test(lines[idx])) {
  console.error("build-reference: the `const PLUGINS = ...` line does not end with `];` on one line; aborting to avoid corruption.");
  process.exit(1);
}
lines[idx] = "  const PLUGINS = " + JSON.stringify(plugins) + ";";
fs.writeFileSync(REF, lines.join("\n"));

const nParams = plugins.reduce((s, p) => s + p.params.length, 0);
const nData = plugins.reduce((s, p) => s + p.data.length, 0);
console.log("wrote reference.html PLUGINS: " + plugins.length + " plugins, " + nParams + " params, " + nData + " data fields");
