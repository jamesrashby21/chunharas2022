/*
 * brady-color-wheel-zhangluck.js  --  alternative color wheel (drop-in replacement)
 *
 * The Zhang & Luck color wheel: hues evenly spaced on a circle in CIE L*a*b* at
 * constant lightness L* = 70, centred at a* = 20, b* = 38, radius 60, converted to
 * sRGB under the D65 white point. From
 *   Zhang, W., & Luck, S. J. (2008), "Discrete fixed-resolution representations
 *   in visual working memory", Nature 453, 233-235,
 * whose methods read: "It consisted of 180 colour values that were evenly
 * distributed along a circle in the CIE L*a*b* colour space. This circle was
 * centred in the colour space at (L = 70, a = 20, b = 38) with a radius of 60.
 * Its centre was chosen to maximize its radius and therefore the
 * discriminability of the colours."
 *
 * It is a widely reused delayed-estimation wheel. Bays, Catalao & Husain
 * (2009, J. Vision) cite it ("for full details, see Zhang & Luck, 2008"), and
 * Bae, Olkkonen, Allred, Wilson & Flombaum (2014, J. Vision) used it, citing
 * Anderson & Awh (2012) and Gold et al. (2010) as also using it. For Bays' wheel,
 * use this file.
 *
 * The paper does not state a white point; this file converts under sRGB D65.
 * (Bae et al., 2014, used the D50 ICC white point for the same coordinates, so
 * RGB tables published as "the Zhang & Luck wheel" can differ.) It generates 360 colors
 * (1-degree steps) on the same circle, where the original sampled 180 (2-degree
 * steps). Wheel degree d is CIELAB hue angle d + 1 around the circle's centre
 * (the loop runs h = 1..360), so degree 0 sits at hue angle 1 deg. Under D65, 201
 * of the 360 colors fall outside the sRGB gamut and are clipped per channel, so the
 * rendered ring is not exactly the nominal circle.
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

  // L*=70, centre (a*,b*)=(20,38), radius 60; entry i is hue angle h = i + 1 deg.
  var L = 70, ac = 20, bc = 38, radius = 60;
  var colors = [];
  for (var h = 1; h <= 360; h++) {
    var a = ac + radius * Math.cos((h / 180) * Math.PI);
    var b = bc + radius * Math.sin((h / 180) * Math.PI);
    colors.push(lab2rgb(L, a, b));
  }

  global.BradyColorWheel = make(colors, "zhang-luck");
  global.BradyColorWheel.make = make;
})(typeof window !== "undefined" ? window : this);
