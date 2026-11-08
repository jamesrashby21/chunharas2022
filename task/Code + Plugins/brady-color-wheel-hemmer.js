/*
 * brady-color-wheel-hemmer.js  --  alternative color wheel (drop-in replacement)
 *
 * An HSL hue wheel: 360 hues at full saturation and 50% lightness
 * (HSL = [h/360, 1, 0.5], standard HSL -> sRGB conversion). This is the kind of hue
 * space used in color-memory work from Pernille Hemmer's group, instead of a CIELAB
 * circle. For example, in Persaud & Hemmer (2014, CogSci) "Saturation and
 * luminance were held constant at 100% and 50%, respectively" while hue varied. Their
 * stimuli were 48 hues at 5-unit steps on a 0-239 hue scale, so this 360-step wheel
 * spans the same hue circle without reproducing their exact sample.
 *
 * An HSL wheel is not perceptually uniform (equal hue steps are not equal perceptual
 * steps), so error magnitudes from it aren't directly comparable to those from the
 * CIELAB wheels. Use it when you want an HSL space specifically.
 *
 * Wheel degree d is HSL hue d + 1 (the loop runs h = 1..360), so degree 0 is hue 1
 * deg, just off pure red.
 *
 * To use it, load this file instead of brady-color-wheel.js (before
 * brady-plugin-utils.js and the plugin files). It assigns window.BradyColorWheel,
 * and exposes the same make() for building other wheels: make(colors[, name]) takes
 * exactly 360 [r, g, b] entries (sRGB 0-255, fractions allowed), entry d = wheel
 * degree d, and warns once for any other length. Its `name` is recorded by the plugins
 * as color_wheel_name.
 */
(function (global) {
  "use strict";

  // Wheels already warned about for a length other than 360, by name (fallback make only).
  var lengthWarned = {};
  function warnLength(n, name) {
    if (lengthWarned[name] || typeof console === "undefined") return;
    lengthWarned[name] = true;
    console.warn("[color-wheel] " + name + ": make() got " + n + " colors; a wheel needs 360 [r,g,b] " +
      "entries (0-255 each, entry d = wheel degree d). Degrees are spread over the " + n + " entries.");
  }

  // Build a wheel object (with degree lookups) from an array of [r,g,b] colors. The one
  // factory is BradyColorWheel.make in brady-color-wheel.js; it is reused when a wheel file
  // is already loaded. The copy below only keeps this file loadable on its own and must
  // stay identical to it (tests/invariants.js checks that both build the same wheel).
  var make = (global.BradyColorWheel && typeof global.BradyColorWheel.make === "function")
    ? global.BradyColorWheel.make
    : function make(colors, name) {
      var n = colors.length, warned = false;
      if (n !== 360) warnLength(n, name || "custom");
      function wrap(deg) { deg = Math.round(deg) % n; return deg < 0 ? deg + n : deg; }
      var wheel = {
        name: name || "custom",
        colors: colors,
        length: n,
        rgb: function (deg) {
          var d = Number(deg);
          if (!isFinite(d)) {
            if (!warned && typeof console !== "undefined") {
              warned = true;
              console.warn("[color-wheel] " + wheel.name + ": degree " + String(deg) + " is not a number; drawing neutral gray instead.");
            }
            return [128, 128, 128];
          }
          return colors[wrap(n === 360 ? d : (d / 360) * n)].slice();
        },
        css: function (deg) {
          var c = wheel.rgb(deg);
          return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
        },
      };
      return wheel;
    };

  // HSL (h, s, l in 0..1) -> [r,g,b] in 0..255 (unrounded), the standard conversion.
  function hsl2rgb(h, s, l) {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function hue(t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
  }

  // Full-saturation HSL hue sweep; entry i is hue h = i + 1 deg.
  var colors = [];
  for (var h = 1; h <= 360; h++) colors.push(hsl2rgb(h / 360, 1, 0.5));

  global.BradyColorWheel = make(colors, "hemmer-hsl");
  global.BradyColorWheel.make = make;
})(typeof window !== "undefined" ? window : this);
