/*
 * build-zip.js -- write brady-plugins-v8.zip, the download of everything a user needs.
 *
 * Contents (all under one top folder, brady-plugins-v8/):
 *   - brady-plugins.bundle.js and every source file it is built from (the plugins, the
 *     color wheel and its variants, brady-plugin-utils.js, similarity-adaptive-utils.js);
 *   - the build scripts (build-bundle.js, build-reference.js, this file), so an edited
 *     source can be rebundled;
 *   - stimuli/, images/, win.mp3, lose.mp3, favicon.ico and the site's .css files;
 *   - example-experiment.html, the html pages (index, showcase, reference, tutorial) and
 *     the docs (README.md, TUTORIAL.md, CONVENTIONS.md), plus LICENSE if there is one.
 * Left out: tests/, internal/, node_modules/, dot-files, scratch files starting with
 * "__", eslint.config.mjs (a maintainer tool) and the zip itself.
 *
 * Pure node, no npm dependencies: a small zip writer (stored local headers + central
 * directory, DEFLATE via node's built-in zlib, CRC-32 via zlib.crc32). PowerShell's
 * Compress-Archive was not used, so the build also runs on macOS/Linux.
 *
 * Run:  node build-zip.js        (after node build-bundle.js / node build-reference.js)
 * tests/run_regression.py (U-13) checks that the zip opens, holds the expected files,
 * matches the folder byte for byte, and that example-experiment.html runs from an
 * extracted copy.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const DIR = __dirname;
const ZIP_NAME = "brady-plugins-v8.zip";
const TOP = "brady-plugins-v8/";

// ---- which files go in ----
const TOP_EXT = new Set([".js", ".html", ".md", ".css", ".mp3", ".ico"]);
const SKIP_TOP = new Set(["eslint.config.mjs", ZIP_NAME]);
const DIRS = ["stimuli", "images"]; // copied whole

function wanted() {
  const out = [];
  for (const f of fs.readdirSync(DIR).sort()) {
    const full = path.join(DIR, f);
    if (!fs.statSync(full).isFile()) continue;
    if (f.startsWith(".") || f.startsWith("__") || SKIP_TOP.has(f)) continue;
    if (TOP_EXT.has(path.extname(f).toLowerCase()) || /^LICENSE(\.|$)/i.test(f)) out.push(f);
  }
  for (const d of DIRS) {
    const walk = (rel) => {
      for (const f of fs.readdirSync(path.join(DIR, rel)).sort()) {
        if (f.startsWith(".")) continue;
        const r = rel + "/" + f;
        if (fs.statSync(path.join(DIR, r)).isDirectory()) walk(r); else out.push(r);
      }
    };
    if (fs.existsSync(path.join(DIR, d))) walk(d);
  }
  return out;
}

// ---- a minimal zip writer ----
// DOS date/time of a Date (local time, 2-second resolution).
function dosTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

function buildZip(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const rel of files) {
    const full = path.join(DIR, rel);
    const data = fs.readFileSync(full);
    const name = Buffer.from(TOP + rel, "utf8");
    const crc = zlib.crc32(data) >>> 0;
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    // keep it stored when deflate doesn't help (images, mp3s)
    const useDeflate = deflated.length < data.length;
    const body = useDeflate ? deflated : data;
    const { time, date } = dosTime(fs.statSync(full).mtime);
    const flags = 0x0800; // names are UTF-8
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);          // extra length
    parts.push(local, name, body);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);            // version made by
    cen.writeUInt16LE(20, 6);            // version needed
    cen.writeUInt16LE(flags, 8);
    cen.writeUInt16LE(method, 10);
    cen.writeUInt16LE(time, 12);
    cen.writeUInt16LE(date, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt16LE(0, 30);            // extra
    cen.writeUInt16LE(0, 32);            // comment
    cen.writeUInt16LE(0, 34);            // disk number
    cen.writeUInt16LE(0, 36);            // internal attributes
    cen.writeUInt32LE(0, 38);            // external attributes
    cen.writeUInt32LE(offset, 42);       // local header offset
    central.push(cen, name);

    offset += local.length + name.length + body.length;
  }
  const cdSize = central.reduce((s, b) => s + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat(parts.concat(central, [end]));
}

if (typeof zlib.crc32 !== "function") {
  console.error("build-zip: this node has no zlib.crc32 (needs node 20.15 / 22.2 or newer).");
  process.exit(1);
}
const files = wanted();
if (files.length > 65535) { console.error("build-zip: too many files for a plain zip"); process.exit(1); }
const buf = buildZip(files);
fs.writeFileSync(path.join(DIR, ZIP_NAME), buf);
console.log("wrote " + ZIP_NAME + " (" + files.length + " files, " + Math.round(buf.length / 1024) + " KB)");
