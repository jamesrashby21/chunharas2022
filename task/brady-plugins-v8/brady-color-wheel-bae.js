/*
 * brady-color-wheel-bae.js  --  alternative color wheel (drop-in replacement)
 *
 * The Bae et al. (2015) color wheel: hues evenly spaced on a circle in CIE L*a*b*
 * at constant lightness L* = 70, centred on the neutral point a* = 0, b* = 0,
 * radius 38, converted to sRGB under the D65 white point. From
 *   Bae, Olkkonen, Allred & Flombaum (2015), "Why some colors appear more
 *   memorable than others: A model combining categories and particulars in color
 *   working memory", J. Exp. Psychol.: General, 144(4), 744-763,
 * whose methods read: "We chose 180 equally spaced stimuli that only varied in hue
 * in CIELAB space (L* = 70, a* = 0, b* = 0, radius of 38; Figure 3)." The paper
 * notes that the more common settings were outside its monitor's gamut. Under the
 * D65 conversion used here all 360 colors are inside the sRGB gamut (none clipped),
 * whereas 201 of the Zhang & Luck wheel's are clipped.
 *
 * White point: the paper converted under its measured monitor white point (CIE
 * xyY [0.3184, 0.3119, 48.64]) on a calibrated monitor. Web stimuli run on
 * uncalibrated displays, so this file uses the generic sRGB D65 white point; its RGB
 * values approximate the published stimuli rather than reproduce them.
 *
 * The earlier Bae, Olkkonen, Allred, Wilson & Flombaum (2014, J. Vision) paper used
 * a different wheel, the Zhang & Luck one (L* = 70, a* = 20, b* = 38, radius 60);
 * for that, use brady-color-wheel-zhangluck.js.
 *
 * It generates 360 colors (1-degree steps) on the same circle, where the original
 * sampled 180 (2-degree steps). Wheel degree d is CIELAB hue angle d + 1 (the loop
 * runs h = 1..360), so degree 0 sits at hue angle 1 deg.
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

  // CIE L*a*b* -> sRGB (D65), 0..255, each channel clamped to gamut (unrounded). Uses
  // BradyUtils.lab2rgb when brady-plugin-utils.js is already loaded; the copy below (same
  // math, bit for bit) lets this file load first, as the documented load order has it.
  function lab2rgb(L, a, b) {
    if (global.BradyUtils && typeof global.BradyUtils.lab2rgb === "function") return global.BradyUtils.lab2rgb([L, a, b]);
    var y = (L + 16) / 116, x = a / 500 + y, z = y - b / 200;
    function fi(t) { var t3 = t * t * t; return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787; }
    var X = 0.95047 * fi(x), Y = 1.0 * fi(y), Z = 1.08883 * fi(z);
    var r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    var g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    var bl = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
    function gam(c) { return c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c; }
    function cl(c) { return Math.max(0, Math.min(1, c)) * 255; }
    return [cl(gam(r)), cl(gam(g)), cl(gam(bl))];
  }

  // L*=70, centre (a*,b*)=(0,0), radius 38; entry i is hue angle h = i + 1 deg.
  var L = 70, ac = 0, bc = 0, radius = 38;
  var colors = [];
  for (var h = 1; h <= 360; h++) {
    var a = ac + radius * Math.cos((h / 180) * Math.PI);
    var b = bc + radius * Math.sin((h / 180) * Math.PI);
    colors.push(lab2rgb(L, a, b));
  }

  global.BradyColorWheel = make(colors, "bae-flombaum");
  global.BradyColorWheel.make = make;
})(typeof window !== "undefined" ? window : this);
