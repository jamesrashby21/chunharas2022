/*
 * brady-plugins.bundle.js  -- GENERATED FILE, do not edit by hand.
 * Built 2026-10-10 by build-bundle.js from 20 source files.
 *
 * The Brady-lab jsPsych v8 plugin suite in one file: the default Schurgin/Brady
 * color wheel, the shared BradyUtils helpers, the BradySimilarity adaptive-similarity
 * engine, and all 17 plugins. Include it with one script tag instead of listing every
 * file:
 *
 *   <script src="https://unpkg.com/jspsych@8/dist/index.browser.min.js"></script>
 *   <script src="https://unpkg.com/canvas-confetti@1.9.3/dist/confetti.browser.js"></script>  (optional: feedback confetti)
 *   <script src="brady-plugins.bundle.js"></script>
 *
 * To use a different color wheel, load a variant after this bundle (it reassigns
 * window.BradyColorWheel, which the plugins read at trial time):
 *   <script src="brady-plugins.bundle.js"></script>
 *   <script src="brady-color-wheel-zhangluck.js"></script>
 * ...or pass `color_wheel:` on an individual trial.
 *
 * Regenerate after editing any source file:  node build-bundle.js
 */


/* ===================================================================== */
/* brady-color-wheel.js */
/* ===================================================================== */
/*
 * brady-color-wheel.js
 * The default color wheel for the Brady-lab jsPsych v8 plugins.
 *
 * The 360-step CIELAB color wheel from Schurgin, Wixted & Brady (2020),
 * "Psychophysical scaling reveals a unified theory of visual memory strength",
 * Nature Human Behaviour: a ring of hues at constant lightness (L* = 54) in
 * CIELAB, stored as sRGB triples (some channels in half units). Index d is wheel
 * degree d.
 *
 * It lives in its own file so it can be swapped: either (a) load a different
 * file that assigns `window.BradyColorWheel` (brady-color-wheel-zhangluck.js,
 * -bae.js and -hemmer.js are drop-in alternatives), or (b) pass a wheel object
 * as a plugin's `color_wheel` parameter. A wheel object needs:
 *     { name, colors:[[r,g,b],...], length, rgb(deg), css(deg) }
 * BradyColorWheel.make(colors[, name]) builds one from an array of [r,g,b].
 * Expected format: exactly 360 entries, entry d is the color at wheel degree d, each
 * an [r, g, b] triple of sRGB values 0-255 (fractions allowed; css() rounds). A list
 * of any other length still builds a wheel (degree d uses entry round(d/360*n)) but
 * warns once, since it is usually a mistake (e.g. 3 colors meant as a palette). Give
 * the wheel a `name`: plugins record it as color_wheel_name ("custom" if none).
 *
 * Load this <script> before brady-plugin-utils.js and the plugin files.
 */
(function (global) {
  "use strict";

  // Wheels already warned about for a length other than 360, by name.
  var lengthWarned = {};
  function warnLength(n, name) {
    if (lengthWarned[name] || typeof console === "undefined") return;
    lengthWarned[name] = true;
    console.warn("[color-wheel] " + name + ": make() got " + n + " colors; a wheel needs 360 [r,g,b] " +
      "entries (0-255 each, entry d = wheel degree d). Degrees are spread over the " + n + " entries.");
  }

  // Build a wheel object (with degree lookups) from an array of [r,g,b] colors: 360
  // entries, each [r,g,b] in 0..255 (fractional values are fine), entry d = wheel degree d.
  // Another length warns once and is indexed at deg/360*n.
  function make(colors, name) {
    var n = colors.length, warned = false;
    // A wheel should have 360 entries, one per degree. Any other length still works (degrees
    // map onto the entries at deg/360*n) but is usually a mistake, so warn once per name.
    if (n !== 360) warnLength(n, name || "custom");
    function wrap(deg) { deg = Math.round(deg) % n; return deg < 0 ? deg + n : deg; }
    var wheel = {
      name: name || "custom",
      colors: colors,
      length: n,
      // A copy of the [r,g,b] at a degree: rounded to the nearest entry and wrapped, so
      // any finite degree works (-10 = 350; a numeric string like "120" counts). A wheel
      // with n != 360 entries is indexed at deg/360*n. A degree that is not a finite
      // number (NaN, "abc", undefined) gives neutral gray [128,128,128] and warns once.
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
      // Same, as a CSS "rgb(...)" string with rounded channels.
      css: function (deg) {
        var c = wheel.rgb(deg);
        return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")";
      },
    };
    return wheel;
  }

  var SCHURGIN_BRADY_2020 = [
  [246,37,111], [246,37,110], [246,37,109], [246,37,107.5], [246,37,106], [246,37,104.5],
  [246,37,103], [246,37.5,102], [246,38,101], [246,38.5,99.5], [246,39,98], [246,39.5,96.5],
  [246,40,95], [246,41,94], [246,42,93], [245.5,42.5,91.5], [245,43,90], [245,44,89],
  [245,45,88], [245,46,86.5], [245,47,85], [244.5,47.5,84], [244,48,83], [243.5,49,81.5],
  [243,50,80], [242.5,51,79], [242,52,78], [242,53,76.5], [242,54,75], [241.5,55.5,74],
  [241,57,73], [240.5,58,71.5], [240,59,70], [239,60,69], [238,61,68], [237.5,62,66.5],
  [237,63,65], [236.5,64,64], [236,65,63], [235.5,66,62], [235,67,61], [234,68.5,60],
  [233,70,59], [232.5,71,57.5], [232,72,56], [231,73,55], [230,74,54], [229,75,53],
  [228,76,52], [227.5,77,51], [227,78,50], [226,79,49], [225,80,48], [224,81,46.5],
  [223,82,45], [222,83,44], [221,84,43], [220,85,42], [219,86,41], [218,87,40],
  [217,88,39], [216,89,38], [215,90,37], [214,91,36.5], [213,92,36], [212,93,35],
  [211,94,34], [210,95,33], [209,96,32], [208,97,31], [207,98,30], [205.5,98.5,29.5],
  [204,99,29], [203,100,28], [202,101,27], [201,102,26.5], [200,103,26], [198.5,103.5,25],
  [197,104,24], [196,105,23.5], [195,106,23], [194,107,22.5], [193,108,22], [191.5,108.5,21.5],
  [190,109,21], [189,110,20.5], [188,111,20], [186.5,111.5,19.5], [185,112,19], [183.5,113,19],
  [182,114,19], [181,114.5,19], [180,115,19], [178.5,115.5,19], [177,116,19], [176,117,19],
  [175,118,19], [173.5,118.5,19], [172,119,19], [170.5,119.5,19.5], [169,120,20], [168,120.5,20.5],
  [167,121,21], [165.5,121.5,21.5], [164,122,22], [162.5,123,22.5], [161,124,23], [160,124.5,24],
  [159,125,25], [157.5,125.5,25.5], [156,126,26], [154.5,126.5,27], [153,127,28], [152,127.5,28.5],
  [151,128,29], [149.5,128.5,30], [148,129,31], [146.5,129,32], [145,129,33], [144,129.5,34],
  [143,130,35], [141.5,130.5,36], [140,131,37], [138.5,131.5,38], [137,132,39], [135.5,132.5,40],
  [134,133,41], [133,133.5,42.5], [132,134,44], [130.5,134,45], [129,134,46], [127.5,134.5,47],
  [126,135,48], [125,135.5,49], [124,136,50], [122.5,136,51.5], [121,136,53], [119.5,136.5,54],
  [118,137,55], [117,137,56.5], [116,137,58], [114.5,137.5,59], [113,138,60], [111.5,138,61.5],
  [110,138,63], [109,138.5,64], [108,139,65], [106.5,139,66.5], [105,139,68], [103.5,139.5,69.5],
  [102,140,71], [101,140,72], [100,140,73], [98.5,140.5,74.5], [97,141,76], [95.5,141,77.5],
  [94,141,79], [93,141,80], [92,141,81], [90.5,141.5,82.5], [89,142,84], [88,142,85.5],
  [87,142,87], [85.5,142,88.5], [84,142,90], [82.5,142,91], [81,142,92], [80,142,93.5],
  [79,142,95], [77.5,142.5,96.5], [76,143,98], [75,143,99.5], [74,143,101], [72.5,143,102.5],
  [71,143,104], [70,143,105], [69,143,106], [67.5,143,107.5], [66,143,109], [65,143,110.5],
  [64,143,112], [63,143,113.5], [62,143,115], [61,143,116], [60,143,117], [58.5,143,118.5],
  [57,143,120], [56,143,121.5], [55,143,123], [54,143,124.5], [53,143,126], [52.5,143,127],
  [52,143,128], [51,143,129.5], [50,143,131], [49.5,143,132.5], [49,143,134], [48,143,135],
  [47,143,136], [46.5,143,137.5], [46,143,139], [46,142.5,140], [46,142,141], [45.5,142,142.5],
  [45,142,144], [45,142,145], [45,142,146], [45,142,147.5], [45,142,149], [45.5,141.5,150],
  [46,141,151], [46.5,141,152.5], [47,141,154], [47.5,141,155], [48,141,156], [49,140.5,157],
  [50,140,158], [50.5,140,159], [51,140,160], [52,139.5,161], [53,139,162], [54.5,139,163.5],
  [56,139,165], [57,138.5,165.5], [58,138,166], [59.5,138,167], [61,138,168], [62.5,137.5,169],
  [64,137,170], [65.5,137,171], [67,137,172], [68.5,136.5,173], [70,136,174], [71.5,135.5,174.5],
  [73,135,175], [75,135,176], [77,135,177], [78.5,134.5,177.5], [80,134,178], [82,133.5,179],
  [84,133,180], [85.5,132.5,180.5], [87,132,181], [89,132,181.5], [91,132,182], [92.5,131.5,182.5],
  [94,131,183], [96,130.5,183.5], [98,130,184], [100,129.5,184.5], [102,129,185], [104,128.5,185.5],
  [106,128,186], [107.5,127.5,186.5], [109,127,187], [111,126.5,187.5], [113,126,188], [115,125.5,188],
  [117,125,188], [119,124,188.5], [121,123,189], [123,122.5,189], [125,122,189], [127,121.5,189],
  [129,121,189], [130.5,120.5,189.5], [132,120,190], [134,119,190], [136,118,190], [138,117.5,190],
  [140,117,190], [142,116.5,190], [144,116,190], [145.5,115,189.5], [147,114,189], [149,113.5,189],
  [151,113,189], [153,112,189], [155,111,189], [156.5,110,188.5], [158,109,188], [160,108.5,188],
  [162,108,188], [163.5,107,187.5], [165,106,187], [167,105.5,186.5], [169,105,186], [170.5,104,185.5],
  [172,103,185], [174,102,184.5], [176,101,184], [177.5,100,183.5], [179,99,183], [180.5,98,182.5],
  [182,97,182], [184,96,181.5], [186,95,181], [187.5,94,180.5], [189,93,180], [190.5,92,179],
  [192,91,178], [193.5,90,177.5], [195,89,177], [196.5,88,176], [198,87,175], [199.5,86,174.5],
  [201,85,174], [202.5,84,173], [204,83,172], [205,82,171], [206,81,170], [207.5,80,169],
  [209,79,168], [210,78,167.5], [211,77,167], [212.5,76,166], [214,75,165], [215,73.5,164],
  [216,72,163], [217.5,71,162], [219,70,161], [220,69,159.5], [221,68,158], [222,67,157],
  [223,66,156], [224,64.5,155], [225,63,154], [226,62,153], [227,61,152], [228,60,150.5],
  [229,59,149], [230,58,148], [231,57,147], [232,56,146], [233,55,145], [233.5,54,143.5],
  [234,53,142], [235,51.5,141], [236,50,140], [236.5,49,138.5], [237,48,137], [237.5,47.5,136],
  [238,47,135], [239,46,133.5], [240,45,132], [240.5,44,131], [241,43,130], [241.5,42.5,128.5],
  [242,42,127], [242.5,41,125.5], [243,40,124], [243,39.5,123], [243,39,122], [243.5,38.5,120.5],
  [244,38,119], [244.5,37.5,118], [245,37,117], [245,37,115.5], [245,37,114], [245.5,37,112.5],
];

  global.BradyColorWheel = make(SCHURGIN_BRADY_2020, "schurgin-brady-2020");
  global.BradyColorWheel.make = make;
})(typeof window !== "undefined" ? window : this);


/* ===================================================================== */
/* brady-plugin-utils.js */
/* ===================================================================== */
/*
 * brady-plugin-utils.js
 * Shared color/geometry helpers for the Brady-lab jsPsych v8 plugins.
 *
 * Defines one global, `BradyUtils`. Load this <script> after brady-color-wheel.js
 * and before the plugin files.
 *
 * The color wheel itself lives in brady-color-wheel.js (window.BradyColorWheel) so
 * it can be swapped on its own. The wheel-lookup helpers here take an optional
 * `wheel` argument and fall back to window.BradyColorWheel.
 *
 * Selected contents (the export block at the bottom of the file has the full list):
 *   Color / CIELAB:
 *   - colorWheelRGB(deg[,wheel]) / colorWheelCSS(deg[,wheel]) : wheel lookups.
 *   - rgb2lab(rgb) / lab2rgb(lab)        : sRGB <-> CIELAB (arrays).
 *   - cssToRgb(str) / labStringToCss(str): parse "rgb(...)" / "lab(...)".
 *   - rotateHueLab(rgb, deg)             : rotate a pixel's hue in LAB space.
 *   - rotateCanvasHue(ctx,w,h,deg[,opts]) / makeRecolorCache(img,w,h) : recolor a drawn
 *                                          object (memory item) / a probe; both skip
 *                                          neutral pixels (isNeutralLab), so they match.
 *   Item shapes (item_shape):
 *   - shapePeriod(shape)                 : 180 for "line"/"gabor"/"grating", else 360.
 *   - paintItem / drawShape              : draw an item (color, image, text, line, triangle).
 *   - resolveGrating(spec[,opts]) / gratingPhase(g[,rng]) / gratingPixels(...) /
 *     drawGrating(ctx,shape,deg,size,g)  : achromatic Gabor patches and gratings.
 *   Item / stimulus resolution:
 *   - isColorString(s) / isImagePath(s)  : guess what a stimulus string is.
 *   - isNumericString(s)                 : "120", "-10", "45.5" (a degree where a color is expected).
 *   - toCssColor(spec[,wheel])           : any color spec -> a CSS color string (a numeric
 *                                          string is a wheel degree).
 *   - sameColor(a,b[,wheel])             : do two color specs resolve to the same RGB?
 *   - resolveItem(spec,wheel[,forceType]): -> {kind:"color"|"image"|"text", ...}.
 *   - needsCors(src)                     : is an image URL cross-origin?
 *   Geometry / wheel pointer math:
 *   - wrap360(v) / angleDiff(a,b)        : circular-degree arithmetic.
 *   - ensembleTarget(degs)               : circular mean of the item degrees, the target of an
 *                                          ensemble report (NaN if undefined).
 *   - wheelDegreeFromPointer(centerEl,x,y,spin,offset) : pointer angle -> value.
 *   - wheelPoint(cx,cy,r,value,spin,offset) : the exact inverse (value -> point).
 *   - snapDegree(deg, n, anchor?)        : snap to one of n equally-spaced options (grid through `anchor`, default 0).
 *   - autoZoom(boxEl[,opts])             : scale the task to fill the window.
 *   - stageBox(opts, stageHTML, panelHTML) : one box holding a square stage and a bottom panel.
 *   Randomness / encoding (every rng argument is optional; rng() -> [0,1)):
 *   - randomColorDegrees(n, minDiff[,rng]) : n wheel angles >= minDiff apart.
 *   - randInt(min,max[,rng])             : inclusive random integer.
 *   - seededRng(seed)                    : seeded rng (mulberry32) for replayable draws.
 *   - resolvePositions(trial,setSize[,opts]) : the item_positions rule -> {pos, nph}.
 *   - generateFoils(target,k,minDeg[,opts])  : k foil colors >= minDeg from the target
 *                                          and each other (CIELAB hue rotations when the
 *                                          target is off the wheel).
 *   - encodeArray(opts)                  : run the shared array-encoding phase.
 *   Pluggable stimulus noise, post-stimulus masks, spatial cues:
 *   - noiseKinds / maskKinds             : registries of named kind functions.
 *   - registerNoise(name,fn) / registerMask(name,fn) : add your own kinds.
 *   - paintNoise(ctx,size,level,spec,opts) : draw a noise kind into a 2D context.
 *   - paintMask(ctx,size,spec,opts)      : draw a mask kind into a 2D context.
 *   - locationOverlay(el,opts)           : transparent canvas positioned exactly over an element.
 *   - noiseOverlay(el,level,spec,opts)   : overlay + paintNoise -> remove fn.
 *   - maskOverlay(el,spec,opts)          : overlay + paintMask -> remove fn.
 *   - spatialCue(el,opts)                : pre-/retro-cue highlight ring -> clear fn.
 *   - wantPrecue(trial)                  : the pre-cue rule (precue_time > 0 and do_test).
 *   Sound / feedback:
 *   - playSound(url) / confettiBurst()  : audio + confetti cues.
 *   - feedbackCues(correct, opts)        : the standard right/wrong feedback.
 *   Response hold durations ("response duration", RD; Zhou et al., PNAS, in press):
 *   - mouseHoldDuration()               : ms the mouse button was held for the click
 *                                         just handled (synchronous; consumes).
 *   - awaitKeyUp(key[,opts])            : Promise<ms> resolving when `key` is released.
 *   - beginPressLog(t0) / endPressLog() : log every key press made during a trial
 *                                         (for the "pressed >1 response key" exclusion).
 *   - keyHoldData(dur, key, log)        : the standard keyboard hold data fields.
 *   - initHoldTracking()                : install the recorder up front (optional).
 *   Mouse tracking:
 *   - makeMouseTracker(rootEl, t0, opts) : whole-trial cursor-path recorder.
 *   - discreteChoiceGeometry(boxEl, choices) : option boxes + correct answer, in the
 *                                          mouse-trajectory frame (for click responses).
 *   - nearestChoiceFn(choiceEls)        : makeMouseTracker valueFn -> nearest option index.
 *   - colorWheelName(wheel)             : the wheel's name for the color_wheel_name field.
 *   - confidencePopup(anchorEl, boxEl, opts, onPick) : inline 4-point word confidence picker
 *                                          (its teardown() closes it when the trial ends).
 *   Ending a trial:
 *   - makeFinisher(jsPsych)              : once-guarded finish(data), plus live()/guard()/onEnd().
 *   Parameter diagnostics (warn-only; see BradyUtils.PLACEMENT_WARNINGS toggle):
 *   - validatePlacement(trial, opts)     : stimuli / which_test / item_positions.
 *   - whichTestIndex(raw, n, opts)       : which_test -> a usable item index (NaN -> random).
 *   - fixNaNParams(trial, info, plugin)  : NaN numeric parameters -> their defaults.
 *   - checkParams(trial, opts)           : enum typos, numeric ranges, choices.
 *   - warnOnce(plugin, msg)              : emit one deduped "[plugin] ..." warning.
 *   - noteOnce(plugin, key, msg)         : one console.log note for an intended-but-notable option.
 */
(function (global) {
  "use strict";

  function defaultWheel() { return global.BradyColorWheel; }

  /* ----- color-wheel lookups (delegate to the swappable wheel object) ----- */
  function colorWheelRGB(deg, wheel) { return (wheel || defaultWheel()).rgb(deg); }
  function colorWheelCSS(deg, wheel) { return (wheel || defaultWheel()).css(deg); }

  /* ----- sRGB <-> CIELAB ----- */
  function rgb2lab(rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    var x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    var y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    var z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  function lab2rgb(lab) {
    var c = _lab2rgbRaw(lab);
    return [clamp01(c[0] / 255) * 255, clamp01(c[1] / 255) * 255, clamp01(c[2] / 255) * 255];
  }
  // lab2rgb without the final clamp: channels outside 0..255 mean the color is outside the
  // sRGB gamut (used by generateFoils to keep foils unclipped).
  function _lab2rgbRaw(lab) {
    var y = (lab[0] + 16) / 116, x = lab[1] / 500 + y, z = y - lab[2] / 200, r, g, b;
    x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.00000 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);
    r = x *  3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y *  1.8758 + z *  0.0415;
    b = x *  0.0557 + y * -0.2040 + z *  1.0570;
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
    return [r * 255, g * 255, b * 255];
  }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /* Resolve any CSS color string to [r,g,b]; arrays pass through unchanged. rgb()/rgba()
     are parsed numerically (exact, no rounding); #hex, hsl(), named and lab() colors are
     painted into a 1-px canvas and read back. An unparseable string gives [0,0,0]. */
  var _rgbCtx = null;
  function cssToRgb(str) {
    if (Array.isArray(str)) return str;
    var s = String(str).trim();
    // Numeric rgb()/rgba() fast path. Percent forms (rgb(100%,0%,0%)) skip it, because the
    // digit scrape would read them as [100,0,0]; the canvas resolver handles those.
    if (/^rgba?\(/i.test(s) && s.indexOf("%") === -1) {
      var m = s.match(/-?\d+(\.\d+)?/g);
      return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
    }
    try {
      if (!_rgbCtx) {
        var cv = document.createElement("canvas");
        cv.width = cv.height = 1;
        _rgbCtx = cv.getContext("2d", { willReadFrequently: true }); // read back a pixel on every color parse
      }
      _rgbCtx.clearRect(0, 0, 1, 1); // reset the pixel so a translucent colour can't composite over the last call
      _rgbCtx.fillStyle = "#000";
      _rgbCtx.fillStyle = s; // an invalid color leaves fillStyle at the previous (#000)
      _rgbCtx.fillRect(0, 0, 1, 1);
      var d = _rgbCtx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    } catch (e) {
      var m2 = s.match(/-?\d+(\.\d+)?/g);
      return m2 ? m2.slice(0, 3).map(Number) : [0, 0, 0];
    }
  }
  /* Parse "lab(L,a,b)" (or "lab(L a b)") and return an "rgb(...)" string. The channels are
     not rounded (CSS accepts fractional rgb values); out-of-gamut colors are clamped. */
  function labStringToCss(str) {
    var sep = str.indexOf(",") > -1 ? "," : " ";
    var parts = str.substr(str.indexOf("(") + 1).split(")")[0].split(sep).map(parseFloat);
    var c = lab2rgb(parts);
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }

  /* Does this string look like a CSS/LAB color rather than a path or word?
     Requires a hex (#...) or a functional form with "(", so image names and words
     that merely start with rgb/hsl/lab ("labrador.jpg", "labrador") are not read as
     colors. Bare CSS color names ("black", "gray") count as text under auto-detect;
     pass item_type:"color" (or a #hex/rgb()/degree) to show a named color. */
  function isColorString(s) {
    if (typeof s !== "string") return false;
    s = s.trim();
    return /^#[0-9a-f]{3,8}$/i.test(s) || /^(rgb|rgba|hsl|hsla|hwb|lab|lch)\(/i.test(s);
  }
  /* Does this string look like an image path (has an image extension or a slash)? */
  function isImagePath(s) {
    return typeof s === "string" && (/\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(s.trim()) || s.indexOf("/") > -1);
  }
  /* Turn a color spec (wheel-degree number | "lab(...)" | CSS string) into CSS.
     A numeric string ("120", "-10", "45.5") is a wheel degree too: a spec that is known to
     be a color can't be a CSS color written as a bare number, so "120" and 120 give the
     same color. (Under item_type "auto", resolveItem still reads "120" as text; this rule
     applies only where the value is a color: item_type "color", wm-pairs, noise-dots, ...)
     CSS color strings are lower-cased so equality comparisons (e.g. same/different
     scoring) don't treat "RGB(...)" and "rgb(...)" as different colors. */
  function isNumericString(s) { return typeof s === "string" && /^\s*[-+]?(\d+\.?\d*|\.\d+)\s*$/.test(s); }
  function toCssColor(spec, wheel) {
    if (typeof spec === "number") return colorWheelCSS(spec, wheel);
    if (isNumericString(spec)) return colorWheelCSS(Number(spec), wheel);
    var s = String(spec).trim();
    return /^lab/i.test(s) ? labStringToCss(s) : s.toLowerCase();
  }
  /* A color spec (degree, numeric-string degree, CSS, lab(), or [r,g,b]) -> [r,g,b]. */
  function _specRgb(spec, wheel) {
    if (Array.isArray(spec)) return spec;
    if (typeof spec === "number" || isNumericString(spec)) return colorWheelRGB(Number(spec), wheel);
    return cssToRgb(toCssColor(spec, wheel));
  }
  /**
   * Do two color specs show the same color? Compares the resolved RGB (each channel
   * rounded), not the strings, so a wheel degree, its "rgb(...)" string, "#hex", "lab(...)"
   * and the same rgb() written with spaces all count as one color. Use it for same/different
   * scoring (change-detection, noise-dots).
   * @param {number|string|number[]} a color spec.
   * @param {number|string|number[]} b color spec.
   * @param {object} [wheel] wheel for degree specs (default the global wheel).
   * @returns {boolean}
   */
  function sameColor(a, b, wheel) {
    var ra = _specRgb(a, wheel), rb = _specRgb(b, wheel);
    for (var i = 0; i < 3; i++) if (Math.round(ra[i]) !== Math.round(rb[i])) return false;
    return true;
  }
  /*
   * Resolve one stimulus spec into a uniform item descriptor, so a plugin can take
   * colors, images, words, or color-wheel degrees in the same `stimuli` array:
   *   number                       -> { kind:"color", css }   (degree on wheel)
   *   "rgb(...)"/"lab(...)"/"#..."  -> { kind:"color", css }
   *   "foo.png", "img/bar.jpg"     -> { kind:"image", src }   (image extension or any "/")
   *   anything else ("cat", "7")   -> { kind:"text",  text }
   * Every descriptor also carries the original `spec`. `forceType` ("color" | "image" |
   * "text") overrides the auto-detection.
   */
  function resolveItem(spec, wheel, forceType) {
    if (forceType === "text") return { kind: "text", text: String(spec), spec: spec };
    if (forceType === "image") return { kind: "image", src: String(spec), spec: spec };
    if (forceType === "color" || typeof spec === "number" || isColorString(spec)) {
      return { kind: "color", css: toCssColor(spec, wheel), spec: spec };
    }
    if (isImagePath(spec)) return { kind: "image", src: String(spec), spec: spec };
    return { kind: "text", text: String(spec), spec: spec };
  }

  /* Rotate a pixel's hue (its a,b chroma coords) by `deg` degrees in LAB space. */
  function rotateHueLab(rgb, deg) {
    var lab = rgb2lab(rgb);
    var rad = deg * Math.PI / 180;
    var a = lab[1], b = lab[2];
    lab[1] = a * Math.cos(rad) - b * Math.sin(rad);
    lab[2] = a * Math.sin(rad) + b * Math.cos(rad);
    return lab2rgb(lab);
  }

  /* ----- circular-degree helpers ----- */
  // wrap360: any finite degree -> [0,360). A tiny negative input (e.g. -1e-14 from atan2)
  // plus 360 rounds to exactly 360 in floating point, so that case maps to 0 to keep the
  // result inside the range. NaN/Infinity give NaN.
  function wrap360(v) { v = v % 360; if (v < 0) v += 360; return v >= 360 ? 0 : v + 0; } // + 0 turns -0 into 0
  // angleDiff: signed a - b in (-180, 180]; the antipode is +180.
  function angleDiff(a, b) { var d = wrap360(a - b); return d > 180 ? d - 360 : d; }
  /**
   * Inclusive random integer in [min, max].
   * @param {number} min
   * @param {number} max
   * @param {function(): number} [rng] returns floats in [0,1); default Math.random.
   * @returns {number}
   */
  function randInt(min, max, rng) {
    min = Math.ceil(min); max = Math.floor(max);
    return Math.floor((rng || Math.random)() * (max - min + 1)) + min;
  }

  /**
   * Seeded random number generator (mulberry32). The same seed always gives the same
   * stream, so passing the result as `rng` to randInt, randomColorDegrees, resolvePositions
   * or generateFoils replays those draws exactly.
   * @param {number} seed any finite number (reduced to a 32-bit integer).
   * @returns {function(): number} rng() -> float in [0,1).
   */
  function seededRng(seed) {
    var a = (Math.floor(Number(seed)) || 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fisher-Yates shuffle of a copy of arr, driven by rng() -> [0,1).
  function _shuffleWith(arr, rng) {
    var a = arr.slice();
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(rng() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  /*
   * Auto-zoom: scale the whole task with a CSS transform so it fills the browser window,
   * leaving room for the progress bar and any page chrome above it so it never adds a
   * scrollbar. Re-applies on window resize and when the box changes size, until the box
   * leaves the document or the next autoZoom call replaces it.
   *   opts.marginX / marginY : px to leave around the content (default 40 / 40)
   *   opts.only_grow         : if true, never scale below 1x
   * Returns the scale applied.
   *
   * Two wrapper layers are inserted into box's parent, and every child of that parent
   * (the box plus anything rendered beside it: an options strip, response buttons, a
   * prompt) is moved into the inner one:
   *   - `content`  gets the scale transform, so everything zooms as one unit and the
   *                below-box options shrink with the box.
   *   - `outer`    is sized to the scaled footprint and centred (margin auto). A CSS
   *                transform is visual only (the element still reserves its unscaled size
   *                in layout), so without this wrapper a scaled-down task would still
   *                scroll. transform-origin is top-left, and `content` is pinned to its
   *                natural width so a width-less layer can't stretch before scaling.
   */
  var _activeAzTeardown = null; // teardown for the most recent autoZoom call (removes its listeners)
  function autoZoom(box, opts) {
    opts = opts || {};
    var mx = opts.marginX != null ? opts.marginX : 40;
    var my = opts.marginY != null ? opts.marginY : 40;
    var content = box.__azContent;
    if (!content) {
      var parent = box.parentNode;
      var outer = document.createElement("div");
      outer.style.margin = "0 auto";
      outer.setAttribute("data-az-wrap", ""); // marker for tests / debugging
      content = document.createElement("div");
      content.style.transformOrigin = "top left";
      parent.insertBefore(outer, parent.firstChild);
      outer.appendChild(content);
      // Move every task element (in document order) into the scaled content layer, so the
      // box and the options/prompt that follow it all scale together.
      var node = outer.nextSibling;
      while (node) { var next = node.nextSibling; content.appendChild(node); node = next; }
      box.__azContent = content;
      box.__azOuter = outer;
    }
    var outerEl = box.__azOuter;
    function apply() {
      content.style.transform = "none";
      content.style.width = "";
      outerEl.style.width = "";
      outerEl.style.height = "";
      var r = content.getBoundingClientRect();
      if (!r.width || !r.height) return 1;
      // Pin to natural width: a width-less content layer would otherwise stretch to fill
      // the fixed-width footprint set below, then scale from that larger width and land
      // off-centre.
      content.style.width = r.width + "px";
      // Space above the task = the wrapper's measured distance from the viewport top. That
      // covers the progress bar, the jsPsych content-wrapper padding, and any page header,
      // so a box that nearly fills the viewport doesn't run past the bottom when the
      // display sits lower on the page. max(0, ..) guards a scrolled page reading negative.
      var topOffset = Math.max(0, outerEl.getBoundingClientRect().top);
      var availW = Math.max(40, window.innerWidth - mx);
      var availH = Math.max(40, window.innerHeight - topOffset - my);
      var s = Math.min(availW / r.width, availH / r.height);
      if (opts.only_grow && s < 1) s = 1;
      if (!(s > 0)) s = 1;
      content.style.transform = "scale(" + s + ")";
      // Reserve only the scaled footprint so the page doesn't scroll.
      outerEl.style.width = r.width * s + "px";
      outerEl.style.height = r.height * s + "px";
      return s;
    }
    // Only one task box is live at a time. Remove the previous call's resize listener and
    // observer before adding new ones; otherwise they pile up over a long run, since each
    // one only removes itself when it next fires and finds its box gone.
    if (_activeAzTeardown) { try { _activeAzTeardown(); } catch (e) {} }

    var ro = null, roQueued = false;
    function teardown() {
      window.removeEventListener("resize", onResize);
      if (ro) { ro.disconnect(); ro = null; }
      if (_activeAzTeardown === teardown) _activeAzTeardown = null;
    }

    var s = apply();
    // Re-fit on the next two animation frames. During the trial's first render the progress
    // bar, fonts and images may not be laid out yet, so the top offset can read short and the
    // box scales slightly too large, running a few px past the bottom until a resize. The
    // re-fit corrects it before the first paint the participant sees.
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () {
        if (!document.body.contains(outerEl)) return;
        apply();
        requestAnimationFrame(function () { if (document.body.contains(outerEl)) apply(); });
      });
    }
    var onResize = function () {
      if (document.body.contains(outerEl)) apply();
      else teardown();
    };
    window.addEventListener("resize", onResize);
    // Re-fit whenever the box itself changes size. The response UI or typed-recall input is
    // added to the panel after the initial zoom; if it outgrows the panel's reserved height
    // the box grows and would otherwise run past the viewport. This can't loop: the scale
    // transform is on `content` (an ancestor), so it never changes the box's own border box.
    if (typeof ResizeObserver === "function") {
      ro = new ResizeObserver(function () {
        if (!document.body.contains(outerEl)) { teardown(); return; }
        if (roQueued) return;
        roQueued = true;
        var refit = function () { roQueued = false; if (document.body.contains(outerEl)) apply(); };
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(refit); else refit();
      });
      ro.observe(box);
    }
    _activeAzTeardown = teardown;
    return s;
  }

  /*
   * Build a self-contained task box: one element with the background and border, holding a
   * width x square STAGE on top (placeholders, probe, fixation; centre at width/2, children
   * absolutely positioned) and a PANEL below it for the message, response buttons, option
   * strip or prompt. The box is height:auto, so it is taller than wide only when the panel
   * has content or a reserved min-height; reserving panelMinHeight up front keeps the box
   * from jumping when the test fills the panel. With everything in one box, auto_zoom
   * scales it as a unit and nothing sits below it to scroll.
   *   opts: { idPrefix (default "stage"), width, square (default width), background
   *           (default "#dddddd"), border (default "1px solid #000"), panelMinHeight
   *           (default 0), panelPad (default 8; forced to 0 when the panel is empty and
   *           has no reserve, so the box stays square) }
   *   stageHTML : initial innerHTML of #<idPrefix>-stage
   *   panelHTML : initial innerHTML of #<idPrefix>-panel (often "", filled at test time)
   * Returns the box HTML string; query #<idPrefix>-box / -stage / -panel to fill it later.
   */
  function stageBox(opts, stageHTML, panelHTML) {
    opts = opts || {};
    var p = opts.idPrefix || "stage";
    var w = opts.width;
    var sq = opts.square != null ? opts.square : w;
    var bg = opts.background != null ? opts.background : "#dddddd";
    var border = opts.border != null ? opts.border : "1px solid #000";
    var minH = opts.panelMinHeight || 0;
    // An empty panel with no reserve gets zero padding and collapses, so a box whose response
    // happens inside the stage (e.g. wm-forced-choice / recall "center") stays square.
    var hasPanel = minH > 0 || (panelHTML && panelHTML.length > 0);
    var pad = hasPanel ? (opts.panelPad != null ? opts.panelPad : 8) : 0;
    return (
      '<div id="' + p + '-box" style="position:relative;margin:0 auto;width:' + w + 'px;' +
        'background:' + bg + ';border:' + border + ';box-sizing:content-box">' +
        '<div id="' + p + '-stage" style="position:relative;width:' + w + 'px;height:' + sq + 'px">' +
          (stageHTML || "") +
        '</div>' +
        '<div id="' + p + '-panel" style="width:' + w + 'px;box-sizing:border-box;padding:' + pad + 'px;' +
          'text-align:center;min-height:' + minH + 'px">' + (panelHTML || "") + '</div>' +
      '</div>'
    );
  }

  /* ----- feedback cues: win/lose sounds + confetti ----- */
  // Directory this file was loaded from (its <script src> minus the filename). win.mp3 and
  // lose.mp3 sit next to it, so the default sounds resolve wherever the experiment HTML
  // lives. Captured from document.currentScript at load, which also works when this code is
  // loaded inside brady-plugins.bundle.js (same folder); a src lookup by filename is the
  // fallback. "" (page-relative) if neither is available.
  var _loadedFrom = (typeof document !== "undefined" && document.currentScript && document.currentScript.src) || "";
  function assetDir() {
    var src = _loadedFrom;
    if (!src) {
      var s = document.querySelector('script[src*="brady-plugin-utils.js"], script[src*="brady-plugins.bundle.js"]');
      src = s ? s.src : "";
    }
    return src ? src.replace(/[?#].*$/, "").replace(/[^/]*$/, "") : "";
  }
  // Play a sound (one cached Audio element per URL, rewound each time; volume default 0.5).
  // Autoplay blocks and load errors are swallowed, so feedback never throws.
  var _sounds = {};
  function playSound(url, volume) {
    if (!url) return;
    try {
      var a = _sounds[url] || (_sounds[url] = new Audio(url));
      a.currentTime = 0;
      a.volume = volume == null ? 0.5 : volume;
      a.play().catch(function () {});
    } catch (e) { /* ignore */ }
  }
  // Confetti burst via the canvas-confetti library (window.confetti) if it is loaded;
  // a no-op otherwise. To enable it, include
  // <script src="https://unpkg.com/canvas-confetti"></script>
  // opts: { particleCount 100, startVelocity 18, spread 55, ticks 90, x 0.5, y 0.5 }.
  function confettiBurst(opts) {
    opts = opts || {};
    if (typeof global.confetti !== "function") return;
    global.confetti({
      particleCount: opts.particleCount || 100,
      startVelocity: opts.startVelocity || 18,
      spread: opts.spread || 55,
      ticks: opts.ticks || 90,
      origin: { x: opts.x == null ? 0.5 : opts.x, y: opts.y == null ? 0.5 : opts.y },
    });
  }
  /*
   * Standard correct/incorrect feedback cues used across the plugins:
   *   feedbackCues(correct, { sound, confetti, x, y, sounds:{correct,incorrect} })
   * Plays the win sound (volume 0.6) or lose sound (0.4) unless sound === false, and on a
   * correct response fires confetti at (x,y) in 0..1 viewport coords unless
   * confetti === false. Sounds default to win.mp3 / lose.mp3 next to this file; a falsy
   * sounds.correct / sounds.incorrect also falls back to those defaults.
   */
  function feedbackCues(correct, opts) {
    opts = opts || {};
    if (opts.sound !== false) {
      var sc = (opts.sounds && opts.sounds.correct) || assetDir() + "win.mp3";
      var si = (opts.sounds && opts.sounds.incorrect) || assetDir() + "lose.mp3";
      playSound(correct ? sc : si, correct ? 0.6 : 0.4);
    }
    if (correct && opts.confetti !== false) confettiBurst(opts);
  }

  /*
   * Response-wheel readback. The report plugins place value `deg` at screen angle
   * a = deg + spin + offset, with x = cx + R*cos(a), y = cy + R*sin(a) and y pointing
   * down (CSS coords), so increasing values run clockwise on screen. This is the exact
   * inverse: given a pointer at (clientX, clientY), it returns the value under it. Using
   * the same geometry for placement and readback means what the participant points at is
   * what gets recorded, with no mirror flip, so the signed error (reported - target)
   * agrees with a distance-based similarity matrix.
   *   centerEl : a zero-size element at the wheel centre. Its client rect gives the centre,
   *              so auto_zoom scaling is handled (an angle is unchanged by uniform scale).
   * Returns a degree in [0,360).
   */
  function wheelDegreeFromPointer(centerEl, clientX, clientY, spin, offset) {
    var r = centerEl.getBoundingClientRect();
    var ang = (Math.atan2(clientY - r.top, clientX - r.left) * 180) / Math.PI;
    return wrap360(ang - (spin || 0) - (offset || 0));
  }
  /* The point where a feature value sits on a response wheel: the inverse of
     wheelDegreeFromPointer, so a click here reads back as `value`. (cx,cy) is the wheel
     centre and the returned {x,y} are in the same frame; for mouse_geometry use logical px
     from the stage centre so it lines up with the mouse trajectory. spin and offset must
     match the ones used at readback. */
  function wheelPoint(cx, cy, radius, value, spin, offset) {
    var a = (wrap360(value + (spin || 0) + (offset || 0)) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }
  /* Snap a degree to the nearest of `n` equally spaced options on the grid
     {anchor + k*360/n}, returned in [0,360). anchor defaults to 0 (the absolute grid
     0, step, 2*step, ...). Passing the target as anchor makes the target one of the n
     options, so a quantized wheel has no quantization error floor. n falsy or >= 360
     means no snapping: the degree is just wrapped. A value exactly halfway between two
     options goes to the larger one. */
  function snapDegree(deg, n, anchor) {
    if (!n || n >= 360) return wrap360(deg);
    var step = 360 / n;
    var a = anchor || 0;
    return wrap360(a + Math.round(wrap360(deg - a) / step) * step);
  }

  /* Pick `n` integer wheel angles (0-359) that are each at least `minDiff` deg apart, by
     rejection sampling. Always returns exactly n angles (the plugins use the length as the
     set size). If sampling can't place all n (n*minDiff near or above 360), it falls back
     to n evenly spaced angles at a random rotation, in shuffled order, which are as far
     apart as n angles can be (360/n); when even that is closer than minDiff it warns once.
     rng() -> [0,1) is optional (default Math.random). */
  function randomColorDegrees(n, minDiff, rng) {
    if (n <= 0) return []; // so set_size:0 yields no items (and the "set_size < 1" warning can fire)
    rng = rng || Math.random;
    var chosen = [randInt(0, 359, rng)];
    var guard = 0;
    while (chosen.length < n && guard++ < 10000) {
      var cand = randInt(0, 359, rng);
      if (chosen.every(function (c) { return Math.abs(angleDiff(cand, c)) >= minDiff; })) {
        chosen.push(cand);
      }
    }
    if (chosen.length < n) {
      if (360 / n < minDiff) {
        warnOnce("brady-utils", n + " colors cannot all be " + minDiff + " deg apart on a 360 deg wheel; " +
          "using evenly spaced colors (" + Math.round((360 / n) * 10) / 10 + " deg apart) instead. " +
          "Lower min_color_distance or set_size.");
      }
      var start = rng() * 360;
      chosen = [];
      for (var i = 0; i < n; i++) chosen.push(Math.round(wrap360(start + (i * 360) / n)) % 360);
      chosen = _shuffleWith(chosen, rng);
    }
    return chosen;
  }

  // A shuffle function: rng-driven Fisher-Yates when opts.rng is given, else
  // opts.jsPsych.randomization.shuffle when available, else Math.random.
  function _shuffler(opts) {
    if (opts && typeof opts.rng === "function") return function (a) { return _shuffleWith(a, opts.rng); };
    var js = opts && opts.jsPsych;
    if (js && js.randomization && typeof js.randomization.shuffle === "function") {
      return function (a) { return js.randomization.shuffle(a.slice()); };
    }
    return function (a) { return _shuffleWith(a, Math.random); };
  }

  /**
   * The one rule for `item_positions` in the placeholder plugins. It turns the
   * experimenter's list into exactly `setSize` distinct placeholder slots:
   *   1. invalid entries (non-integers, negatives) are dropped;
   *   2. repeated slots are dropped, keeping the first;
   *   3. the list is cut to setSize;
   *   4. nph = max(num_placeholders, setSize, largest kept slot + 1);
   *   5. items still without a slot get random unused slots in 0..nph-1.
   * So an empty list means fully random placement, and a short or partly invalid list
   * keeps its valid slots and pads the rest. It never warns; validatePlacement does that.
   * @param {object} trial reads trial.item_positions and trial.num_placeholders.
   * @param {number} setSize number of items to place.
   * @param {object} [opts]
   *   rng     : rng() -> [0,1) for the random fill (e.g. seededRng(seed)).
   *   jsPsych : without rng, fill with jsPsych.randomization.shuffle (default Math.random).
   *   fill    : "random" (default) or "lowest" (missing items take the lowest unused slots,
   *             so an empty list gives 0, 1, 2, ...).
   * @returns {{pos: number[], nph: number}} pos[i] is item i's slot; nph the placeholder count.
   */
  function resolvePositions(trial, setSize, opts) {
    opts = opts || {};
    setSize = Math.max(0, Math.floor(setSize) || 0);
    var given = trial && Array.isArray(trial.item_positions) ? trial.item_positions : [];
    var pos = [];
    for (var i = 0; i < given.length && pos.length < setSize; i++) {
      var p = given[i];
      if (typeof p === "number" && Number.isInteger(p) && p >= 0 && pos.indexOf(p) < 0) pos.push(p);
    }
    var maxKept = pos.length ? Math.max.apply(null, pos) + 1 : 0;
    var nph0 = trial && typeof trial.num_placeholders === "number" && isFinite(trial.num_placeholders) ? trial.num_placeholders : 0;
    var nph = Math.max(nph0, setSize, maxKept);
    if (pos.length < setSize) {
      var free = [];
      for (var s = 0; s < nph; s++) if (pos.indexOf(s) < 0) free.push(s);
      if (opts.fill !== "lowest") free = _shuffler(opts)(free);
      pos = pos.concat(free.slice(0, setSize - pos.length));
    }
    return { pos: pos, nph: nph };
  }

  /**
   * Foil colors for an n-AFC color test: k distinct colors, each at least minDeg of hue
   * from the target and from each other. Offsets are drawn uniformly from whole degrees
   * by rejection sampling.
   *   - A wheel-degree target (a number) gets wheel foils: target + offset, wrapped.
   *   - Any other target (CSS, lab(), [r,g,b]; usually off the wheel) gets its own color
   *     hue-rotated in CIELAB by each offset, so every foil keeps the target's lightness
   *     and chroma. The target itself is never changed. Only rotations that stay inside the
   *     sRGB gamut (within 1.5 of 0..255 per channel) are drawn, because a clipped rotation
   *     would have less chroma than the target. If fewer than k in-gamut rotations fit at
   *     minDeg (a very saturated target), the remaining foils are the least-clipped
   *     rotations that still keep minDeg, and it warns once.
   * When fewer than k fit at all, it returns the ones that do and warns once.
   * @param {number|string|number[]} target the correct color.
   * @param {number} k number of foils wanted.
   * @param {number} minDeg minimum hue separation in degrees (raised to at least 1, so a
   *   foil never equals the target or another foil).
   * @param {object} [opts]
   *   rng      : rng() -> [0,1) (default Math.random).
   *   wheel    : wheel used to resolve a non-numeric target spec (default the global wheel).
   *   plugin   : tag for the warning (default "brady-utils").
   *   countParam : parameter named in the warning's advice (default "the number of options").
   * @returns {Array} foil specs: degrees for a wheel target, "rgb(...)" strings otherwise.
   */
  var FOIL_GAMUT_TOL = 1.5; // per-channel overshoot (0..255 units) still counted as in gamut
  function generateFoils(target, k, minDeg, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    k = Math.max(0, Math.floor(k) || 0);
    var minD = Math.max(1, Number(minDeg) || 0);
    var onWheel = typeof target === "number";
    var rgb = onWheel ? null : cssToRgb(Array.isArray(target) ? target : toCssColor(target, opts.wheel));
    // Off-wheel target: how far (0..255 units) each whole-degree rotation falls outside sRGB.
    var clipOf = null;
    if (!onWheel) {
      var lab0 = rgb2lab(rgb), ca = lab0[1], cb = lab0[2];
      clipOf = [];
      for (var d = 0; d < 360; d++) {
        var rad = d * Math.PI / 180;
        var raw = _lab2rgbRaw([lab0[0], ca * Math.cos(rad) - cb * Math.sin(rad), ca * Math.sin(rad) + cb * Math.cos(rad)]);
        clipOf.push(Math.max(0, -raw[0], -raw[1], -raw[2], raw[0] - 255, raw[1] - 255, raw[2] - 255));
      }
    }
    var spaced = function (o, list) {
      return Math.abs(angleDiff(o, 0)) >= minD && list.every(function (c) { return Math.abs(angleDiff(o, c)) >= minD; });
    };
    var offsets = [], guard = 0;
    while (offsets.length < k && guard++ < 10000) {
      var o = randInt(0, 359, rng);
      if ((onWheel || clipOf[o] <= FOIL_GAMUT_TOL) && spaced(o, offsets)) offsets.push(o);
    }
    if (!onWheel && offsets.length < k) {
      // Too saturated for k in-gamut foils: add the least-clipped rotations that keep minDeg.
      var nIn = offsets.length;
      var order = [];
      for (var c2 = 0; c2 < 360; c2++) if (clipOf[c2] > FOIL_GAMUT_TOL) order.push(c2);
      order = _shuffleWith(order, rng).sort(function (x, y) { return clipOf[x] - clipOf[y]; });
      for (var j = 0; j < order.length && offsets.length < k; j++) if (spaced(order[j], offsets)) offsets.push(order[j]);
      if (offsets.length > nIn) {
        warnOnce(opts.plugin || "brady-utils", "the target color " + rgbToCss(rgb) + " is too saturated for " + k +
          " in-gamut foils at min_color_distance " + minD + " (" + nIn + " fit); " + (offsets.length - nIn) +
          " foil(s) are the least-clipped hue rotations, so they have slightly less chroma than the target.");
      }
    }
    if (offsets.length < k) {
      warnOnce(opts.plugin || "brady-utils", "only " + (offsets.length + 1) + " of " + (k + 1) +
        " options fit with min_color_distance " + minD + "; lower min_color_distance or " +
        (opts.countParam || "the number of options") + ".");
    }
    if (onWheel) return offsets.map(function (off) { return wrap360(target + off); });
    return offsets.map(function (off) { return rgbToCss(rotateHueLab(rgb, off)); });
  }

  // Shared warning sink for every parameter diagnostic: prints each message once per page
  // load, prefixed "[plugin] ", unless BradyUtils.PLACEMENT_WARNINGS is false. The check
  // functions build their problem lists and hand them here.
  var _placementWarned = {};
  function _emitWarnings(plugin, P) {
    var enabled = !(global.BradyUtils && global.BradyUtils.PLACEMENT_WARNINGS === false);
    if (!P.length || !enabled || typeof console === "undefined" || !console.warn) return;
    var tag = "[" + (plugin || "plugin") + "] ";
    P.forEach(function (m) {
      var key = tag + m;
      if (!_placementWarned[key]) { _placementWarned[key] = 1; console.warn(key); }
    });
  }
  // Emit one deduped warning for a plugin-specific check; returns [msg].
  function warnOnce(plugin, msg) { _emitWarnings(plugin, [msg]); return [msg]; }

  // The fix to suggest when a numeric parameter arrives as NaN.
  var NAN_HINT = "A common cause is jsPsych.timelineVariable('x') inside a function (e.g. " +
    "which_test: () => jsPsych.timelineVariable('set_size') - 1): inside a function it returns a " +
    "placeholder, not the value. Use jsPsych.evaluateTimelineVariable('x') inside functions.";

  /*
   * The probed item's index from a which_test value, for a trial of n items. Never returns
   * an index that can't be used, so a bad value can't crash the trial:
   *   -1 with opts.allowEnsemble  -> -1 (ensemble / whole report);
   *   not a finite number (NaN, a string, an object) -> a random item 0..n-1, drawn with
   *       opts.rng (default Math.random), with a warning that says so (validatePlacement
   *       words it the same way);
   *   otherwise -> rounded and clamped into 0..n-1 (validatePlacement warns about that).
   * opts: { plugin, allowEnsemble, rng }.
   */
  function whichTestIndex(raw, n, opts) {
    opts = opts || {};
    var hi = Math.max(0, (n | 0) - 1);
    if (opts.allowEnsemble && raw === -1) return -1;
    if (typeof raw !== "number" || !isFinite(raw)) {
      warnOnce(opts.plugin, "which_test is " + String(raw) + " (not a number), so this trial probes a randomly " +
        "chosen item instead (recorded in which_test). " + NAN_HINT);
      return randInt(0, hi, opts.rng);
    }
    return Math.min(Math.max(Math.round(raw), 0), hi);
  }

  /*
   * Replace NaN in a plugin's numeric (INT / FLOAT, non-array) parameters with the
   * parameter's default, so a NaN set_size, num_placeholders, display_time, radius, ... can
   * neither throw (new Array(NaN)) nor hang a timer. Warns once per parameter with the
   * likely cause. which_test is left alone: whichTestIndex handles it once the set size
   * is known. `trial` itself is never modified (it is jsPsych's stored copy of the
   * parameters): when something is fixed it returns a shallow copy, else `trial`. Call it
   * first thing in trial(): trial = U.fixNaNParams(trial, info, info.name).
   */
  function fixNaNParams(trial, info, plugin) {
    var PT = global.jsPsychModule && global.jsPsychModule.ParameterType;
    if (!PT || !info || !info.parameters) return trial;
    var out = trial;
    Object.keys(info.parameters).forEach(function (k) {
      var spec = info.parameters[k];
      if (!spec || spec.array || (spec.type !== PT.INT && spec.type !== PT.FLOAT) || k === "which_test") return;
      var v = trial[k];
      if (typeof v !== "number" || !isNaN(v)) return;
      if (out === trial) out = Object.assign({}, trial);
      out[k] = spec.default === undefined ? null : spec.default;
      warnOnce(plugin, k + " is NaN (not a number); using its default (" + JSON.stringify(out[k]) + ") instead. " + NAN_HINT);
    });
    return out;
  }

  /**
   * One-time informational note about an option that is working as intended but is easy
   * to leave on by accident. Printed with console.log (not warn) as "[plugin] msg", once
   * per page load per (plugin, key), and silenced by BradyUtils.PLACEMENT_WARNINGS = false.
   * @param {string} plugin plugin name for the prefix.
   * @param {string} key dedupe key (one note per plugin + key).
   * @param {string} msg the note.
   * @returns {boolean} true if the note was printed now.
   */
  var _notesShown = {};
  function noteOnce(plugin, key, msg) {
    var enabled = !(global.BradyUtils && global.BradyUtils.PLACEMENT_WARNINGS === false);
    var id = (plugin || "plugin") + "\u0000" + key;
    if (!enabled || _notesShown[id] || typeof console === "undefined" || !console.log) return false;
    _notesShown[id] = 1;
    console.log("[" + (plugin || "plugin") + "] " + msg);
    return true;
  }

  /**
   * Once-guard for ending a trial. finish(data) calls jsPsych.finishTrial(data) the first
   * time it runs while this trial is still the current one, and does nothing after that.
   * So two finish paths racing (a trial_duration timeout and a key release, a click that
   * lands during the keyup wait), or a promise that settles after the trial was ended from
   * outside, can't end the trial twice or end the next trial. "Current" is checked with
   * jsPsych.getProgress().current_trial_global, which advances with every trial.
   * @param {object} jsPsych the plugin's jsPsych instance.
   * @returns {function(object): boolean} finish(data): true if it ended the trial. It also has:
   *   finish.live()    -> true while the trial has not ended;
   *   finish.guard(fn) -> fn wrapped to run only while live (for awaitKeyUp(...).then(...)
   *                       callbacks and click handlers);
   *   finish.onEnd(fn) -> run fn (cleanup, e.g. a confidence popup's teardown) when the
   *                       trial ends through finish; at once if it already has.
   */
  function makeFinisher(jsPsych) {
    function idx() {
      try { var p = jsPsych.getProgress(); return p ? p.current_trial_global : null; } catch (e) { return null; }
    }
    var start = idx(), done = false, cleanups = [];
    function runCleanups() {
      var c = cleanups; cleanups = [];
      c.forEach(function (fn) { try { fn(); } catch (e) { if (typeof console !== "undefined") console.error(e); } });
    }
    function live() {
      if (!done && idx() !== start) { done = true; runCleanups(); } // ended from outside
      return !done;
    }
    function finish(data) {
      if (!live()) return false;
      done = true;
      runCleanups();
      jsPsych.finishTrial(data);
      return true;
    }
    finish.live = live;
    finish.guard = function (fn) {
      return function () { if (live()) return fn.apply(this, arguments); };
    };
    finish.onEnd = function (fn) { if (done) fn(); else cleanups.push(fn); };
    return finish;
  }

  // Levenshtein distance, used to suggest the intended value for a mistyped option.
  function _editDistance(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    return d[m][n];
  }
  function _closest(v, allowed) {
    var best = null, bestD = Infinity;
    allowed.forEach(function (a) { var dst = _editDistance(v, a); if (dst < bestD) { bestD = dst; best = a; } });
    // suggest only a near miss (distance <= max(2, half the option's length))
    return bestD <= Math.max(2, Math.ceil(best ? best.length / 2 : 0)) ? best : null;
  }

  // Times (ms) that are never legitimately negative. Checked on every plugin; a param
  // absent from a given trial is skipped.
  var _NONNEG_PARAMS = ["display_time", "delay_time", "retrocue_time", "precue_time", "mask_time",
    "isi", "item_duration", "sequential_item_time", "sequential_gap_time", "preview_duration",
    "prompt_lead_time", "trial_duration", "stimulus_duration", "delay_start", "feedback_duration"];
  // Sizes that must be strictly positive wherever they appear.
  var _POSITIVE_PARAMS = ["radius", "item_size"];
  // Fractions that must sit in 0..1 wherever they appear (checked on every plugin).
  var _UNIT_PARAMS = ["noise_level"];

  /*
   * Warn-only diagnostic for individual parameter values: typos in pick-one string options,
   * out-of-range numbers, impossible choice counts. Same contract as validatePlacement: it
   * never changes behavior, returns the problem list, and prints each problem once. The
   * built-in checks (negative times, non-positive radius/item_size, noise_level outside
   * 0..1, unregistered noise_type/mask_type strings) apply to every plugin; the per-plugin
   * checks come through opts. Only finite numbers are range-checked.
   *
   * opts: {
   *   plugin:string,
   *   setSize:int,                       // warn if < 1 (nothing to show)
   *   enums:{ param:[allowed strings] },  // typo detection, with "did you mean"
   *   positive:[param names > 0],         // extra strictly-positive numbers
   *   nonneg:[param names >= 0],          // extra non-negative numbers
   *   unit:[param names in 0..1],         // e.g. noise_level
   *   min:{ param:minValue },             // e.g. choices_per_test >= 2
   * }
   */
  function checkParams(trial, opts) {
    opts = opts || {};
    var P = [];
    if (opts.setSize != null && opts.setSize < 1) {
      P.push("set_size resolves to " + opts.setSize + " -- there are no items to show " +
        "(stimuli is empty and set_size < 1).");
    }
    var enums = opts.enums || {};
    Object.keys(enums).forEach(function (k) {
      var v = trial[k];
      if (v == null) return;
      var allowed = enums[k];
      if (allowed.indexOf(v) < 0) {
        var sug = typeof v === "string" ? _closest(v, allowed) : null;
        P.push(k + "=" + JSON.stringify(v) + " is not a recognized option (use " +
          allowed.map(function (a) { return '"' + a + '"'; }).join(", ") + ")" +
          (sug ? '; did you mean "' + sug + '"?' : "") + ". The plugin will fall back to its default behavior.");
      }
    });
    _POSITIVE_PARAMS.concat(opts.positive || []).forEach(function (k) {
      var v = trial[k];
      if (typeof v === "number" && isFinite(v) && v <= 0) P.push(k + "=" + v + " must be greater than 0.");
    });
    _NONNEG_PARAMS.forEach(function (k) {
      var v = trial[k];
      if (typeof v === "number" && isFinite(v) && v < 0) P.push(k + "=" + v + " cannot be negative (it is a time in ms).");
    });
    (opts.nonneg || []).forEach(function (k) { // plugin extras: may be px (option_gap) as well as ms
      var v = trial[k];
      if (_NONNEG_PARAMS.indexOf(k) < 0 && typeof v === "number" && isFinite(v) && v < 0) P.push(k + "=" + v + " cannot be negative.");
    });
    _UNIT_PARAMS.concat(opts.unit || []).forEach(function (k) {
      var v = trial[k];
      if (typeof v === "number" && isFinite(v) && (v < 0 || v > 1)) P.push(k + "=" + v + " should be between 0 and 1.");
    });
    // Pluggable-kind params: a STRING noise_type/mask_type must name a registered kind
    // (function and {type:...} specs are always accepted; the dispatcher resolves those).
    [["noise_type", noiseKinds, "registerNoise"], ["mask_type", maskKinds, "registerMask"]].forEach(function (row) {
      var v = trial[row[0]];
      if (typeof v === "string" && !row[1][v]) {
        P.push(row[0] + '="' + v + '" is not a registered kind (registered: ' +
          Object.keys(row[1]).map(function (n) { return '"' + n + '"'; }).join(", ") +
          "; add your own with BradyUtils." + row[2] + "). Nothing will be drawn for it.");
      }
    });
    var mins = opts.min || {};
    Object.keys(mins).forEach(function (k) {
      var v = trial[k];
      if (typeof v === "number" && isFinite(v) && v < mins[k]) P.push(k + "=" + v + " should be at least " + mins[k] + ".");
    });
    _emitWarnings(opts.plugin, P);
    return P;
  }

  /*
   * Diagnostic for the stimuli / which_test / item_positions combination, the most common
   * source of silent mistakes in the multi-item plugins. Warn-only: it never changes
   * behavior. It returns an array of readable problem strings and console.warn()s each one,
   * deduped per page load so a 200-trial run prints each distinct issue once. Plugins call
   * it near the top of trial(), before their crash-guard clamps, so the warnings describe
   * the values the experimenter actually passed. Set BradyUtils.PLACEMENT_WARNINGS = false
   * to silence the console output (the returned array is unaffected).
   *
   * opts: { plugin:string, setSize:int, supportsEnsemble:bool (which_test -1 allowed),
   *         values:array (the item values, for the duplicate-value lint),
   *         designLint:bool (default true; false skips the "DESIGN:" checks),
   *         userItems:int (how many items the experimenter passed; default
   *                        trial.stimuli.length) }
   *
   * It also prints one console.log note (noteOnce, not a warning) when the experimenter
   * passed their own items (more than 1) and which_test has been 0 on the first three such
   * trials of a plugin and never anything else: item 0 is then the tested item every time.
   */
  var _wtZeroSeen = {}; // plugin -> {zero: count of which_test 0 trials, other: saw another value}
  function validatePlacement(trial, opts) {
    opts = opts || {};
    var P = [];
    var ss = opts.setSize;
    var ip = Array.isArray(trial.item_positions) ? trial.item_positions : [];
    var nph = trial.num_placeholders;
    var wt = trial.which_test;
    var ens = !!opts.supportsEnsemble;

    // ---- item_positions correctness ----
    if (ip.length) {
      if (ip.length !== ss) {
        P.push("item_positions has " + ip.length + " entr" + (ip.length === 1 ? "y" : "ies") +
          " but set_size is " + ss + "; " + (ip.length > ss ? "the extra entries are ignored. "
            : "items without a slot go to random unused placeholders. ") +
          "Pass exactly " + ss + " positions, or leave item_positions empty for random placement.");
      }
      var seen = {}, dups = {};
      ip.forEach(function (p) { if (seen[p]) dups[p] = 1; seen[p] = 1; });
      if (Object.keys(dups).length) {
        P.push("item_positions repeats slot(s) " + Object.keys(dups).join(", ") +
          "; only the first use of each slot is kept, and the other items go to random unused " +
          "placeholders. Use distinct slots.");
      }
      ip.forEach(function (p) {
        if (typeof p !== "number" || !isFinite(p) || Math.floor(p) !== p || p < 0) {
          P.push("item_positions contains an invalid slot (" + p + "); slots must be whole numbers >= 0. " +
            "It is dropped, and its item goes to a random unused placeholder.");
        } else if (nph != null && p >= nph) {
          P.push("item_positions slot " + p + " is >= num_placeholders (" + nph + "). The plugin raises num_placeholders to fit it, " +
            "which changes the spacing of every location. Set num_placeholders yourself or use slots 0.." + (nph - 1) + ".");
        }
      });
    }

    // ---- which_test correctness ----
    if (wt != null && !(ens && wt === -1) && (typeof wt !== "number" || !isFinite(wt))) {
      // whichTestIndex: a value that is not a finite number probes a random item.
      P.push("which_test is " + String(wt) + " (not a number), so this trial probes a randomly chosen item " +
        "instead (recorded in which_test). " + NAN_HINT);
    } else if (wt != null && !(ens && wt === -1)) {
      if (Math.floor(wt) !== wt || wt < 0 || wt >= ss) {
        P.push("which_test=" + wt + " is out of range for set_size " + ss + " (valid 0.." + (ss - 1) +
          (ens ? ", or -1 for whole-report/ensemble" : "") + "); it will be clamped, so a different item " +
          "than you intended is tested.");
      }
    }

    // ---- design lint (runs fine, but often a mistake) ----
    if (opts.designLint !== false && ss > 1) {
      if (opts.values && opts.values.length >= ss) {
        var norm = opts.values.slice(0, ss).map(function (v) { return typeof v === "number" ? Math.round(v) : v; });
        var distinct = norm.filter(function (v, i) { return norm.indexOf(v) === i; }).length;
        if (distinct < ss) {
          P.push("DESIGN: only " + distinct + " distinct value(s) among " + ss + " items, so some items are " +
            "identical -- that can confound which item a response refers to. Intended?");
        }
      }
      if (ip.length === ss && wt != null && wt >= 0 && wt < ip.length) {
        P.push("DESIGN: item_positions and which_test=" + wt + " are both set, so this trial probes slot " +
          ip[wt] + ". If every trial passes the same pair, the same screen location is probed every time and " +
          "participants can learn it. Randomize which_test, or leave item_positions empty, unless a fixed " +
          "probe location is intentional.");
      }
    }

    // ---- one-time note: the experimenter's item 0 is the tested item on every trial ----
    var nGiven = opts.userItems != null ? opts.userItems : (Array.isArray(trial.stimuli) ? trial.stimuli.length : 0);
    if (nGiven > 1 && wt != null) {
      var wz = _wtZeroSeen[opts.plugin] || (_wtZeroSeen[opts.plugin] = { zero: 0, other: false });
      if (wt === 0) wz.zero++; else wz.other = true;
      if (wz.zero >= 3 && !wz.other) {
        noteOnce(opts.plugin, "which_test-0", "item 0 is tested on every trial; set which_test to probe a different item.");
      }
    }

    _emitWarnings(opts.plugin, P);
    return P;
  }

  /*
   * Run the memory-array encoding phase, all at once or one item at a time.
   *
   * Every placeholder working-memory plugin shows its array the same way: paint each
   * item, wait, then hand off to a blank -> retention delay -> test continuation. Doing
   * it here keeps sequential presentation (each item in its own placeholder in turn)
   * identical across plugins.
   *
   * opts:
   *   api          jsPsych.pluginAPI (its setTimeout is cleared when the trial ends).
   *   n            number of items to present.
   *   paint(i)     draw item i in its placeholder.
   *   clear(i)     blank item i's placeholder (sequential mode, between items).
   *   displayTime  simultaneous mode: how long the whole array stays up (ms). With 0
   *                nothing is painted and onDone runs on the next tick.
   *   sequential   true => present items one at a time.
   *   itemTime     sequential: how long each item is shown (ms).
   *   gapTime      sequential: blank gap after each item, including the last one,
   *                before the next item (or onDone) (ms).
   *   cumulative   sequential: leave each item up so the array builds up, instead of
   *                clearing it after itemTime (default false).
   *   onDone       called once encoding finishes; should blank the array and start the
   *                retention delay -> test (the plugin's hideArray()).
   */
  function encodeArray(opts) {
    var api = opts.api, n = opts.n;
    if (!opts.sequential) {
      if (opts.displayTime > 0) for (var i = 0; i < n; i++) opts.paint(i);
      api.setTimeout(opts.onDone, Math.max(0, opts.displayTime));
      return;
    }
    (function step(i) {
      if (i >= n) { opts.onDone(); return; }
      opts.paint(i);
      api.setTimeout(function () {
        if (!opts.cumulative && opts.clear) opts.clear(i);
        api.setTimeout(function () { step(i + 1); }, opts.gapTime);
      }, opts.itemTime);
    })(0);
  }

  /* Should this image src get crossOrigin="anonymous"? Only for cross-origin http(s)
     URLs. On file:// the attribute can block the load outright, and data: / same-origin
     images are readable without it (file:// canvases are tainted either way, and callers
     then fall back to the unrotated image). */
  function needsCors(src) {
    if (typeof src !== "string" || !/^https?:\/\//i.test(src)) return false;
    try { return new URL(src).origin !== location.origin; } catch (e) { return false; }
  }

  /*
   * Whole-trial mouse-trajectory recorder, used by the report plugins when
   * trial.record_mouse is true. On every document "mousemove" it stores a
   * [t, x, y, value] row (all rounded to integers):
   *   t      ms since cursor onset (t0),
   *   x,y    pointer position in logical px from the centre of rootEl: client px divided
   *          by the current auto_zoom scale, recomputed each sample. That is the frame the
   *          plugins lay out in, so it lines up with the `mouse_geometry` item boxes and
   *          wheel points whatever the zoom.
   *   value  the hovered feature value from setValueFn (null until one is set).
   *
   * Throttling: a sample less than the active interval after the previous one is dropped.
   * The interval is `minInterval` until mark("report") switches it to
   * `responseMinInterval` (both default 0 = keep every event). mark("report") also records
   * responseStartIndex, so callers can slice out the response window.
   *
   *   rootEl : the persistent stage box (its rect centre is the sample origin).
   *   t0     : performance.now() at cursor onset (e.g. the fixation click).
   *   opts   : { minInterval, responseMinInterval } ms rate caps.
   *
   * Returns an object the plugin drives through the trial:
   *   attach() / detach()  : add / remove the document mousemove listener.
   *   sample(e)            : force-record one sample now (used for the committing click).
   *   seedCenter()         : push the [0,0,0,null] origin sample (cursor on fixation).
   *   setValueFn(fn)       : fn(e)->value to attach the live hovered value to samples.
   *   mark(phase)          : timestamp a phase onset; mark("report") starts the response
   *                          window and switches to the responseMinInterval rate.
   *                          The plugins use these phase names (each a time in ms from
   *                          t0, the same clock as the trajectory's t column):
   *                            encoding   - tracking start (t0 itself, so 0): the fixation
   *                                         click, or trial start without click_to_start.
   *                                         It comes before delay_start and any pre-cue.
   *                            array      - the memory array's onset (first item painted).
   *                            mask       - the post-stimulus mask's onset, which is the
   *                                         array's offset (only on trials with a mask).
   *                            delay      - the blank retention interval begins: the
   *                                         array's offset, or the mask's offset after a
   *                                         mask. Any retro-cue follows it.
   *                            report     - the response phase opens (probe / wheel /
   *                                         options shown).
   *                            confidence - a separate confidence rating opens.
   *                          A phase that did not happen on a trial has no key.
   *   responseStartIndex() : index of the first response-window sample.
   *   zoom()               : the current auto_zoom scale (rendered/logical px).
   *   samples, phaseOnsets : the collected [t,x,y,value] rows and {phase: ms} map.
   */
  var _activeMouseDetach = null; // detach fn of the most recently attached tracker
  function makeMouseTracker(rootEl, t0, opts) {
    opts = opts || {};
    var minInterval = +opts.minInterval || 0;
    var responseMinInterval = +opts.responseMinInterval || 0;
    var samples = [];
    var phaseOnsets = {};
    var valueFn = null;
    var active = minInterval; // current throttle interval (ms)
    var lastT = -Infinity;
    var respStart = -1;
    var attached = false;

    function record(clientX, clientY, force) {
      var t = Math.round(performance.now() - t0);
      if (!force && active > 0 && t - lastT < active) return; // throttle (never the forced committing sample)
      lastT = t;
      var r = rootEl.getBoundingClientRect();
      var w = rootEl.offsetWidth || r.width;
      var z = w ? r.width / w : 1; // current auto_zoom scale (rendered/logical)
      var v = valueFn ? valueFn({ clientX: clientX, clientY: clientY }) : null;
      samples.push([
        t,
        Math.round((clientX - (r.left + r.width / 2)) / z),
        Math.round((clientY - (r.top + r.height / 2)) / z),
        v == null ? null : Math.round(v),
      ]);
    }
    function onMove(e) { record(e.clientX, e.clientY); }
    // If a prior trial's tracker was never detached (trial force-ended, or threw before
    // finishing), remove its listener when the next tracker attaches, so it stops pushing
    // samples into a finished trial's array.
    function doAttach() {
      if (attached) return;
      if (_activeMouseDetach && _activeMouseDetach !== doDetach) { try { _activeMouseDetach(); } catch (e) {} }
      document.addEventListener("mousemove", onMove);
      attached = true;
      _activeMouseDetach = doDetach;
    }
    function doDetach() {
      if (attached) { document.removeEventListener("mousemove", onMove); attached = false; }
      if (_activeMouseDetach === doDetach) _activeMouseDetach = null;
    }

    return {
      samples: samples,
      phaseOnsets: phaseOnsets,
      attach: doAttach,
      detach: doDetach,
      // Force a sample now (the committing click): bypasses the throttle so the
      // terminal point is always kept even with mouse_response_min_interval > 0.
      sample: function (e) { record(e.clientX, e.clientY, true); },
      // Seed the starting point at stage centre (cursor is on the centred fixation).
      seedCenter: function () { samples.push([0, 0, 0, null]); lastT = 0; },
      setValueFn: function (fn) { valueFn = fn; },
      mark: function (phase) {
        phaseOnsets[phase] = Math.round(performance.now() - t0);
        if (phase === "report") { respStart = samples.length; active = responseMinInterval; }
      },
      responseStartIndex: function () { return respStart; },
      zoom: function () {
        var w = rootEl.offsetWidth;
        return w ? rootEl.getBoundingClientRect().width / w : 1;
      },
    };
  }

  /* ==========================================================================
   * Response hold durations (how long a response was physically held down)
   * ==========================================================================
   * One document-level recorder, installed when this file loads (initHoldTracking
   * below), timestamps every pointer and key press. It lets a plugin report how long
   * a response was held, alongside `rt`, which keeps its meaning of press onset.
   *
   * Mouse (`mouseHoldDuration()`): a `click` event fires only after `pointerup`, so the
   * press is complete by the time a plugin's click handler runs and the value is
   * available synchronously. The read consumes the value (a second call returns null)
   * and ignores a press released more than HOLD_STALE_MS ago, so a programmatic
   * `.click()` or a button activated by Enter/Space reports null rather than a stale
   * duration from some earlier click.
   *
   * Keyboard (`awaitKeyUp()`): jsPsych's getKeyboardResponse fires on keydown, so the
   * hold isn't known yet when the response is recorded. awaitKeyUp returns a Promise
   * that resolves with the duration once the key is released, and plugins wait for it
   * before finishing. That delays the end of the trial while a key stays down, a
   * deliberate tradeoff (CONVENTIONS §11); `rt` and the other measures are stamped at
   * keydown and unaffected. A timeout (default 5 s), window blur and pagehide all
   * resolve the promise with null, so a stuck key can't hang an experiment.
   *
   * Durations are whole ms from performance.now(). null always means "not measurable",
   * never 0.
   */
  var HOLD_STALE_MS = 1000;  // a click must follow its own pointerup within this window
  var HOLD_RECENT_MS = 1000; // how long a completed key press stays claimable by awaitKeyUp
  var HOLD_TIMEOUT_MS = 5000; // default cap on waiting for a keyup
  var HOLD_COMPAT_MS = 1000; // after a touch/pen release, ignore the browser's emulated mouse events this long

  var _holdRec = null;
  function holdRecorder() {
    if (_holdRec) return _holdRec;

    var downAt = Object.create(null);   // normalized key -> keydown time
    var downCode = Object.create(null); // e.code -> normalized key it went down as
    var recent = Object.create(null);   // normalized key -> {duration, at} of last completed press
    var waiters = [];                   // pending awaitKeyUp records
    var pointerDownAt = null;
    var ignoreMouseUntil = -Infinity;   // see HOLD_COMPAT_MS
    var lastPointer = null;             // {duration, at} of the last completed press
    var pressLog = null;                // per-trial press log, or null when not logging
    var pressT0 = 0;                    // performance.now() at the start of the logged window

    function norm(k) { return String(k).toLowerCase(); }
    function now() { return performance.now(); }

    /* Record one completed key press into the open per-trial log (if any). A press that
       began before the window opened (e.g. the key that ended the previous screen,
       released after this trial started) is skipped, as in endPressLog, so it can't set
       multiple_keys_pressed. */
    function logPress(key, downTime, duration) {
      if (!pressLog || downTime < pressT0) return;
      pressLog.push({ key: key, t: Math.round(downTime - pressT0), duration: duration });
    }

    /* Resolve every waiter matching `key` (a null waiter key matches any key). */
    function settleKey(key, duration) {
      for (var i = waiters.length - 1; i >= 0; i--) {
        if (waiters[i].key === null || waiters[i].key === key) waiters.splice(i, 1)[0].settle(duration);
      }
    }

    if (typeof document !== "undefined") {
      // Listen for both pointer and mouse events. Pointer events cover mouse, touch and
      // pen, but synthetic input (the test harness, some assistive tech) often sends only
      // MouseEvents. Taking both is safe because the handlers are idempotent: `down` only
      // sets a time when none is pending and `up` only fires when one is, so a real
      // pointerdown -> mousedown -> pointerup -> mouseup sequence records one press, and
      // so does a bare mousedown/mouseup pair.
      // Touch and pen differ: the browser fires its emulated mousedown/mouseup only after
      // pointerup, just before the click, which would record a ~0 ms second press over
      // the real one. So mouse events are ignored for HOLD_COMPAT_MS after a touch/pen
      // release.
      // Capture phase, so a plugin's own handler (or a stopPropagation) can't hide a press.
      var isMouseEvt = function (e) { return e.type === "mousedown" || e.type === "mouseup"; };
      var onDown = function (e) {
        if (isMouseEvt(e) && now() < ignoreMouseUntil) return;
        if (pointerDownAt == null) pointerDownAt = now();
      };
      var onUp = function (e) {
        if (isMouseEvt(e) && now() < ignoreMouseUntil) return;
        if (pointerDownAt == null) return; // an up with no matching down (press began off-page)
        lastPointer = { duration: Math.round(now() - pointerDownAt), at: now() };
        pointerDownAt = null;
        if (e.pointerType && e.pointerType !== "mouse") ignoreMouseUntil = now() + HOLD_COMPAT_MS;
      };
      // A cancelled press (a touch that turned into a scroll, etc.) never sends pointerup;
      // clear it so the next press isn't timed from this one's start.
      var onCancel = function () { pointerDownAt = null; };
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("mousedown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("mouseup", onUp, true);
      document.addEventListener("pointercancel", onCancel, true);

      document.addEventListener("keydown", function (e) {
        if (e.repeat) return;                    // auto-repeat is still one press
        var k = norm(e.key);
        if (downAt[k] == null) downAt[k] = now();
        if (e.code) downCode[e.code] = k;
      }, true);
      document.addEventListener("keyup", function (e) {
        var k = norm(e.key);
        // e.key can change between down and up when a modifier changes mid-press ("1" goes
        // down, Shift is pressed, "!" comes up). Match the release by physical key (e.code)
        // then; otherwise the press would stay "down" forever and the next press of that
        // key would be timed from this one.
        if (downAt[k] == null && e.code && downCode[e.code] != null) k = downCode[e.code];
        if (e.code) delete downCode[e.code];
        var t = downAt[k];
        delete downAt[k];
        if (t == null) return;                   // key went down before we were listening
        var d = Math.round(now() - t);
        recent[k] = { duration: d, at: now() };
        logPress(k, t, d);
        settleKey(k, d);
      }, true);

      // A key or button released while the tab is unfocused or hidden never delivers its
      // up event. Forget every pending press and release every waiter (as null) rather
      // than stall the trial.
      var releaseAll = function () {
        downAt = Object.create(null);
        downCode = Object.create(null);
        pointerDownAt = null;
        while (waiters.length) waiters.pop().settle(null);
      };
      if (typeof window !== "undefined") {
        window.addEventListener("blur", releaseAll);
        window.addEventListener("pagehide", releaseAll);
      }
    }

    _holdRec = {
      /*
       * Open a per-trial key-press log. Every key pressed at or after t0 (default: now)
       * and released before `endPressLog()` is recorded as {key, t, duration}, with t in
       * ms from t0 and key lower-cased. Zhou et al. (and Pfister et al. before them)
       * exclude trials on which the subject pressed more than one response key; that
       * can't be reconstructed afterwards unless the extra presses are logged.
       */
      beginPressLog: function (t0) {
        pressLog = [];
        pressT0 = t0 == null ? now() : t0;
      },
      /*
       * Close the log and return its rows (or null if none was open). Rows are
       * {key, t, duration}. A key still held when the log closes has no release yet, but
       * "also pressed the other response key" is what the log exists to catch, and
       * whether that key comes up before or after the recorded response is arbitrary. So
       * held keys are included with duration null (pressed, never seen up). As with
       * released keys, only presses that began inside the window count.
       * Rows are sorted by `t` (press onset). A press is logged when it is released, so
       * without the sort a long press that began first would come after a short one that
       * began later; ties keep their logged order.
       */
      endPressLog: function () {
        var rows = pressLog;
        if (rows) {
          for (var k in downAt) {
            if (downAt[k] >= pressT0) rows.push({ key: k, t: Math.round(downAt[k] - pressT0), duration: null });
          }
          rows = rows.map(function (r, i) { return [r, i]; })
            .sort(function (a, b) { return a[0].t - b[0].t || a[1] - b[1]; })
            .map(function (x) { return x[0]; });
        }
        pressLog = null;
        return rows;
      },
      /* Duration of the just-completed click's press, in ms, or null. Consumes. */
      mouseHoldDuration: function () {
        if (!lastPointer) return null;
        var d = now() - lastPointer.at > HOLD_STALE_MS ? null : lastPointer.duration;
        lastPointer = null; // consume either way, so it can't be reported twice
        return d;
      },
      /*
       * Promise<number|null> for how long `key` is held (matched case-insensitively).
       * If the key is not down it resolves at once: with the duration of a press released
       * within the last HOLD_RECENT_MS (a tap that beat this call; claimed once), else
       * null. Otherwise it resolves on that key's keyup, with null on blur/pagehide, or
       * with null after opts.timeout ms (default 5000; 0 disables the cap). key null waits
       * for the next release of any key.
       */
      awaitKeyUp: function (key, opts) {
        opts = opts || {};
        var timeout = opts.timeout == null ? HOLD_TIMEOUT_MS : opts.timeout;
        var k = key == null ? null : norm(key);

        // A key that is currently held always wins: wait for its release. Checking the
        // recent-press cache first would let an earlier press of the same key be claimed
        // as this response's hold. A participant who taps the response key during the
        // retention delay and then presses it for real at the probe would get the stray
        // tap's duration, and the trial would resolve at keydown with the key still down.
        // That tap predates the press log, so the trial couldn't even be excluded.
        if (k !== null && downAt[k] == null) {
          // Not held: either released just now (a tap that beat this call; plugins call it
          // inside the keydown dispatch, so this mainly serves direct API use) or never
          // pressed.
          if (recent[k] && now() - recent[k].at < HOLD_RECENT_MS) {
            var d = recent[k].duration;
            delete recent[k]; // claim it once
            return Promise.resolve(d);
          }
          return Promise.resolve(null);
        }
        return new Promise(function (resolve) {
          var settled = false, timer = null;
          var w = {
            key: k,
            settle: function (dur) {
              if (settled) return;
              settled = true;
              if (timer) clearTimeout(timer);
              resolve(dur);
            },
          };
          waiters.push(w);
          // Bare setTimeout on purpose: this safety net must still fire if the plugin's
          // jsPsych timers are cleared around it.
          if (timeout > 0) timer = setTimeout(function () {
            var i = waiters.indexOf(w);
            if (i >= 0) waiters.splice(i, 1);
            w.settle(null);
          }, timeout);
        });
      },
    };
    return _holdRec;
  }

  /* Public wrappers (each installs the recorder if it isn't installed yet). */
  function mouseHoldDuration() { return holdRecorder().mouseHoldDuration(); }
  function awaitKeyUp(key, opts) { return holdRecorder().awaitKeyUp(key, opts); }
  function beginPressLog(t0) { return holdRecorder().beginPressLog(t0); }
  function endPressLog() { return holdRecorder().endPressLog(); }
  /*
   * Install the recorder now, at load, rather than on first use: the listeners only see
   * presses that start after they are attached, so a lazily installed recorder would miss
   * the press it was installed to measure and report null for the experiment's first
   * response. Safe in node (no listeners are added without a document) and cheap (a few
   * capture-phase listeners for the life of the page).
   */
  function initHoldTracking() { holdRecorder(); return true; }
  initHoldTracking();

  /*
   * The standard hold fields for a keyboard response, ready to Object.assign into a
   * plugin's data object. `key` is the responded key, `log` the closed press log.
   *   key_hold_duration     : `duration`, or null.
   *   key_presses           : the log, or null when no log was kept.
   *   multiple_keys_pressed : the log has 2+ presses and at least one is a key other than
   *                           `key` (any key when `key` is null). Pressing the response
   *                           key twice doesn't count.
   * Keeps the extra-key exclusion criterion identical across plugins.
   */
  function keyHoldData(duration, key, log) {
    var others = (log || []).filter(function (p) {
      return key == null || p.key !== String(key).toLowerCase();
    });
    return {
      key_hold_duration: duration == null ? null : duration,
      key_presses: log || null,
      multiple_keys_pressed: (log || []).length > 1 && others.length > 0,
    };
  }

  /*
   * Discrete-choice mouse geometry, the click-response counterpart of the wheel
   * mouse_geometry. It uses the same frame as makeMouseTracker (logical px from the box
   * centre, client coordinates divided by the box's auto_zoom scale), so it lines up with
   * mouse_trajectory whether the options are drawn inside the box or below it: cursor and
   * option boxes are divided by the same zoom.
   *   boxEl   : the stage box (frame origin and zoom reference; pass the same element to
   *             makeMouseTracker).
   *   choices : [{ el, value, correct }] the clickable elements, in canonical order.
   * Returns { units, box, zoom, options:[{index,value,correct,x,y,w,h}], target_option },
   * where target_option is the first option marked correct (or null).
   */
  function discreteChoiceGeometry(boxEl, choices) {
    var br = boxEl.getBoundingClientRect();
    var z = boxEl.offsetWidth ? br.width / boxEl.offsetWidth : 1;
    var cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    var options = [], target = null;
    (choices || []).forEach(function (c, i) {
      var r = c.el.getBoundingClientRect();
      var o = {
        index: i, value: c.value, correct: !!c.correct,
        x: Math.round((r.left + r.width / 2 - cx) / z),
        y: Math.round((r.top + r.height / 2 - cy) / z),
        w: Math.round(r.width / z), h: Math.round(r.height / z),
      };
      options.push(o);
      if (o.correct && !target) target = { index: i, value: o.value, x: o.x, y: o.y };
    });
    return { units: "logical px from box centre", box: Math.round(boxEl.offsetWidth || br.width), zoom: z, options: options, target_option: target };
  }

  /* A valueFn for makeMouseTracker over discrete options: returns the index of the option
   * whose centre is nearest the pointer, so each response sample records which option the
   * cursor is closest to. Pass the clickable elements in the same order as the choices
   * given to discreteChoiceGeometry. */
  function nearestChoiceFn(choiceEls) {
    return function (e) {
      var best = null, bd = Infinity;
      (choiceEls || []).forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    };
  }

  /*
   * Inline confidence picker (4-point word rating): a small popup anchored to the chosen
   * item, so the task box stays visible, with colour-coded word buttons (Guess / Maybe /
   * Probably / Certain) worth 1..4 and an "x" to clear and choose again. It rings the
   * anchored item while open. It is appended inside boxEl, so it scales with auto_zoom,
   * and sits just below the anchor, or above it when there isn't room below in the box.
   *   anchorEl : the chosen item element to anchor beside and ring.
   *   boxEl    : the task box (positioning frame, zoom reference and parent). It must be
   *              positioned (e.g. position:relative) for the popup's absolute position.
   *   opts     : { labels:[strings], colors:[css] } (defaults: the four words above,
   *              red / orange / yellow-green / green). The value is the label's 1-based index.
   *   onPick   : onPick(value) when a word is chosen; onPick(null) when cleared (x).
   * Returns { detach, teardown, buttons:[{el,value}], el }. detach() runs automatically on
   * pick or clear and is safe to call again. teardown() removes the popup without a pick
   * and stops onPick from ever firing; plugins call it when the trial ends (e.g. register
   * it with makeFinisher's finish.onEnd) so a popup left open by a timeout can't report a
   * rating after the trial is over. `buttons` lets the caller record the rating-button
   * geometry while the popup is still up.
   */
  function confidencePopup(anchorEl, boxEl, opts, onPick) {
    opts = opts || {};
    var labels = opts.labels && opts.labels.length ? opts.labels : ["Guess", "Maybe", "Probably", "Certain"];
    var colors = opts.colors && opts.colors.length ? opts.colors : ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"];
    var pop = document.createElement("div");
    pop.setAttribute("data-confidence-popup", "");
    pop.style.cssText = "position:absolute;z-index:60;background:#fff;border:1px solid #444;border-radius:7px;" +
      "padding:5px 6px;box-shadow:0 3px 10px rgba(0,0,0,.35);white-space:nowrap;font-size:13px;line-height:1.2";
    var done = false, closed = false;
    function detach() {
      if (done) return; done = true;
      if (pop.parentNode) pop.parentNode.removeChild(pop);
      anchorEl.style.boxShadow = prevShadow;
    }
    function teardown() { closed = true; detach(); }
    function pick(v) { if (closed) return; closed = true; detach(); onPick(v); }
    var buttons = [];
    labels.forEach(function (lab, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "wmfc-conf-btn";
      b.setAttribute("data-conf", String(i + 1));
      b.textContent = lab;
      b.style.cssText = "cursor:pointer;margin:0 3px;padding:5px 9px;border:1px solid rgba(0,0,0,.35);" +
        "border-radius:5px;color:#1a1a1a;font-weight:600;background:" + (colors[i] || "#ccc");
      b.addEventListener("click", function (e) { e.stopPropagation(); pick(i + 1); });
      pop.appendChild(b);
      buttons.push({ el: b, value: i + 1 });
    });
    var clr = document.createElement("span");
    clr.textContent = "✕"; // x
    clr.title = "clear / choose again";
    clr.style.cssText = "cursor:pointer;margin-left:7px;color:#888;font-weight:700";
    clr.addEventListener("click", function (e) { e.stopPropagation(); pick(null); });
    pop.appendChild(clr);

    var prevShadow = anchorEl.style.boxShadow;
    anchorEl.style.boxShadow = "0 0 0 3px #333"; // ring the item being rated

    boxEl.appendChild(pop);
    // Position in the box's unscaled frame, so it rides the auto_zoom transform: centred
    // on the anchor, just below it, or above it when the anchor sits low in the box.
    var br = boxEl.getBoundingClientRect();
    var ar = anchorEl.getBoundingClientRect();
    var zoom = (boxEl.offsetWidth && br.width) ? br.width / boxEl.offsetWidth : 1;
    var cx = (ar.left + ar.width / 2 - br.left) / zoom;
    var aTop = (ar.top - br.top) / zoom, aBot = (ar.bottom - br.top) / zoom;
    var ph = pop.getBoundingClientRect().height / zoom;
    var below = aBot + ph + 10 <= boxEl.offsetHeight;
    pop.style.left = cx + "px";
    pop.style.top = (below ? aBot + 6 : Math.max(2, aTop - ph - 6)) + "px";
    pop.style.transform = "translateX(-50%)";
    return { detach: detach, teardown: teardown, buttons: buttons, el: pop };
  }

  /* Preload image URLs -> Promise of a { src: HTMLImageElement } map. De-duplicates, and
     always resolves (never rejects) so one broken URL can't hang a trial; a failed load is
     simply missing from the map. Pass { needsPixel:true } when the caller reads pixels back
     (getImageData, hue rotation) so cross-origin sources get crossOrigin="anonymous".
     Callers that only want the images cached can ignore the map. */
  function loadImages(srcs, opts) {
    opts = opts || {};
    var needsPixel = opts.needsPixel;
    var unique = Array.from(new Set(srcs));
    return Promise.all(unique.map(function (src) {
      return new Promise(function (resolve) {
        var img = new Image();
        if (needsPixel && needsCors(src)) img.crossOrigin = "anonymous";
        img.onload = function () { resolve([src, img]); };
        img.onerror = function () { resolve([src, null]); };
        img.src = src;
      });
    })).then(function (pairs) {
      var m = {};
      pairs.forEach(function (p) { if (p[1]) m[p[0]] = p[1]; });
      return m;
    });
  }

  /* Paint one item into a canvas 2D context at size x size: an image (drawn, or a neutral
     gray square if its preload failed or is missing), a text item (black word on white,
     font ~size/4, min 10px), or a color (solid fill via cssToRgb, so hex/named/hsl work).
     imgCache is a { src: HTMLImageElement } map. opts (all optional):
       rotation  -- CIELAB hue-rotate an image by this many degrees.
       grayscale -- masked/preview render that hides identity: images are desaturated
                    (after any rotation); color and text items become a plain gray shape,
                    so a pre-response preview can't reveal the answer.
       circle    -- draw the color/gray fill as a stroked disk instead of a square (an
                    unmasked text item stays a white square). Used by forced-choice disks.
       shape     -- "line" or "triangle" draws a non-image, non-text item as an oriented
                    shape (see drawShape) with angle opts.orientation (deg) and fill
                    opts.color (default: the item's own color; gray when grayscale).
                    "gabor" or "grating" draws an achromatic Gabor patch or grating at
                    opts.orientation (see drawGrating); the item's color is ignored. Any
                    other value (e.g. "disk", the default) uses the square/disk path.
       lineWidth -- bar thickness for shape "line".
       grating   -- for "gabor"/"grating": resolved options from resolveGrating plus this
                    item's numeric `phase` (default: resolveGrating(null), phase 0).
     This is the shared square/disk renderer; plugins that need dot noise (change-detection)
     or DOM rendering (recall) keep their own painter. */
  function paintItem(ctx, item, size, imgCache, opts) {
    imgCache = imgCache || {};
    opts = opts || {};
    ctx.clearRect(0, 0, size, size);
    // Oriented line/triangle for non-image, non-text items. Image and text items ignore
    // `shape` and render below as usual.
    if ((opts.shape === "line" || opts.shape === "triangle") &&
        item.kind !== "image" && item.kind !== "text") {
      var scol = opts.grayscale ? "#cccccc" : (opts.color || rgbToCss(cssToRgb(item.css)));
      drawShape(ctx, opts.shape, scol, opts.orientation || 0, size, opts.lineWidth);
      return;
    }
    // Gabor / grating for non-image, non-text items (achromatic: the item color is unused).
    if (isGratingShape(opts.shape) && item.kind !== "image" && item.kind !== "text") {
      drawGrating(ctx, opts.shape, opts.orientation || 0, size, opts.grating || resolveGrating(null));
      return;
    }
    if (item.kind === "image" && imgCache[item.src] && imgCache[item.src].naturalWidth > 0) {
      ctx.drawImage(imgCache[item.src], 0, 0, size, size);
      if (opts.rotation || opts.grayscale) {
        rotateCanvasHue(ctx, size, size, opts.rotation || 0, { grayscale: !!opts.grayscale });
      }
      return;
    }
    // Text (unless masked): black word on white.
    if (item.kind === "text" && !opts.grayscale) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000";
      ctx.font = Math.max(10, Math.round(size / 4)) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.text, size / 2, size / 2);
      return;
    }
    // Solid fill: gray for a masked render, a failed image or a masked word; otherwise the
    // item's color. A disk when opts.circle, else a square.
    var fill = (opts.grayscale || item.kind === "image") ? "#cccccc" : rgbToCss(cssToRgb(item.css));
    if (opts.circle) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#222";
      ctx.stroke();
    } else {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, size, size);
    }
  }

  /* Draw an oriented shape centred on an (already cleared) canvas 2D context.
       shape     -- "triangle" (tip along the orientation); anything else draws "line",
                    a bar 92% of size long.
       css       -- fill color.
       orientDeg -- orientation in degrees (0 = pointing right, + = clockwise on screen).
       size      -- the canvas side (px).
       lineWidth -- bar thickness for "line" (default ~14% of size, min 6 px).
     Used for orientation and shape stimuli; paintItem handles everything else. */
  function drawShape(ctx, shape, css, orientDeg, size, lineWidth) {
    var s = size;
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.rotate(((orientDeg || 0) * Math.PI) / 180);
    ctx.fillStyle = css;
    if (shape === "triangle") {
      var r = s * 0.46;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(-r * 0.75, r * 0.62);
      ctx.lineTo(-r * 0.75, -r * 0.62);
      ctx.closePath();
      ctx.fill();
    } else { // "line": an oriented bar
      var len = s * 0.92, w = lineWidth || Math.max(6, Math.round(s * 0.14));
      ctx.fillRect(-len / 2, -w / 2, len, w);
    }
    ctx.restore();
  }

  /* ----- Item-shape period and Gabor / grating stimuli -----
     The period rule for every plugin with `item_shape`: an unpointed shape looks the same
     after a half turn, so "line", "gabor" and "grating" live in a 180-degree space; "disk"
     (a hue) and "triangle" (pointed) repeat every 360. Use shapePeriod everywhere instead of
     listing the shapes. */
  function isGratingShape(shape) { return shape === "gabor" || shape === "grating"; }
  function shapePeriod(shape) { return shape === "line" || isGratingShape(shape) ? 180 : 360; }

  /* Gabor and grating stimuli (item_shape "gabor" / "grating"). Both are achromatic and
     drawn per pixel into the item's size x size square:
       "grating" -- a sinusoidal luminance grating in a circular aperture of the item's
                    diameter;
       "gabor"   -- the same grating times a circular Gaussian envelope with SD
                    sigma * diameter (also cut at the item's circle).
     Orientation: degree d gives stripes running the same way as the "line" bar at d
     (0 = horizontal, increasing clockwise on screen). The pattern is computed at
     theta = d mod 180, so d and d + 180 render identically at any phase.
     Phase: the gray level at a pixel is
         mean + A * env * cos(2*pi * cycles * u / size + phase),
     where u is the pixel centre's signed distance (px) from the item centre along the
     stripe normal n = (-sin theta, cos theta) (screen coordinates, y down). Phase 0 is
     cosine phase: a bright stripe centred on the item, and the pattern is point-symmetric
     about the centre. 180 centres a dark stripe; other phases shift the stripes along n.
     Contrast: Michelson, so A = contrast * mean, in sRGB gray levels (not linearized).
     A is capped at min(mean, 255 - mean) so the sinusoid is never clipped; around a light
     mean such as #dddddd (221) the most that fits is (255 - 221) / 221 = 0.15, and
     resolveGrating prints a one-time note. A mid-gray background (#808080) allows ~1. */
  var GRATING_DEFAULTS = { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" };

  /* Gray level (0..255) of a color: Rec. 601 luma, rounded (exact for a gray). */
  function grayLevel(css) {
    var c = cssToRgb(css);
    return Math.round(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]);
  }

  /**
   * Merge a `grating_options` value with the defaults, warn (once, with the plugin prefix)
   * about out-of-range values, and resolve the mean gray. An invalid value falls back to
   * its default (contrast is clamped into 0..1), so a bad option can't produce NaN pixels.
   * @param {object|null} spec partial options {cycles, contrast, sigma, phase, mean}.
   * @param {object} [opts] {plugin, background (CSS color that mean "background" matches;
   *   default "#808080")}.
   * @returns {object} {cycles, contrast, sigma, phase, mean, meanGray, randomPhase}; phase is
   *   0 when randomPhase is true (draw each item's phase with gratingPhase).
   */
  function resolveGrating(spec, opts) {
    opts = opts || {};
    var plugin = opts.plugin || "brady-utils";
    var P = [];
    var g = {};
    Object.keys(GRATING_DEFAULTS).forEach(function (k) { g[k] = GRATING_DEFAULTS[k]; });
    if (spec != null && typeof spec !== "object") {
      P.push("grating_options must be an object such as {cycles: 4, contrast: 1}; got " + JSON.stringify(spec) + ". The defaults are used.");
    } else if (spec) {
      Object.keys(spec).forEach(function (k) {
        if (!(k in GRATING_DEFAULTS)) P.push("grating_options." + k + " is not a known option (use cycles, contrast, sigma, phase, mean); it is ignored.");
        else if (spec[k] != null) g[k] = spec[k];
      });
    }
    var fin = function (v) { return typeof v === "number" && isFinite(v); };
    if (!fin(g.cycles) || g.cycles <= 0) {
      P.push("grating_options.cycles=" + JSON.stringify(g.cycles) + " must be a number greater than 0 (cycles across the item diameter); using " + GRATING_DEFAULTS.cycles + ".");
      g.cycles = GRATING_DEFAULTS.cycles;
    }
    if (!fin(g.contrast) || g.contrast < 0 || g.contrast > 1) {
      P.push("grating_options.contrast=" + JSON.stringify(g.contrast) + " should be between 0 and 1 (Michelson contrast).");
      g.contrast = fin(g.contrast) ? Math.max(0, Math.min(1, g.contrast)) : GRATING_DEFAULTS.contrast;
    }
    if (!fin(g.sigma) || g.sigma <= 0) {
      P.push("grating_options.sigma=" + JSON.stringify(g.sigma) + " must be a number greater than 0 (Gaussian SD as a fraction of the item diameter); using " + GRATING_DEFAULTS.sigma + ".");
      g.sigma = GRATING_DEFAULTS.sigma;
    }
    g.randomPhase = g.phase === "random";
    if (!g.randomPhase && !fin(g.phase)) {
      P.push("grating_options.phase=" + JSON.stringify(g.phase) + " must be a number (degrees) or \"random\"; using 0.");
      g.phase = 0;
    }
    if (g.randomPhase) g.phase = 0;
    if (g.mean !== "background" && typeof g.mean !== "string") {
      P.push("grating_options.mean=" + JSON.stringify(g.mean) + " must be \"background\" or a CSS color; using \"background\".");
      g.mean = "background";
    }
    g.meanGray = grayLevel(g.mean === "background" ? (opts.background || "#808080") : g.mean);
    _emitWarnings(plugin, P);
    var reach = g.meanGray > 0 ? Math.min(g.meanGray, 255 - g.meanGray) / g.meanGray : 0;
    if (g.contrast > reach + 0.02) {
      noteOnce(plugin, "grating-contrast-" + g.contrast + "-" + g.meanGray,
        "grating_options.contrast " + g.contrast + " does not fit around mean gray " + g.meanGray +
        " without clipping, so Gabors/gratings are drawn at contrast " + reach.toFixed(2) +
        ". A mid-gray background_color (e.g. \"#808080\") allows full contrast.");
    }
    return g;
  }

  /* One item's phase (deg): a fresh whole-degree draw in 0..359 from rng (default
     Math.random, which jsPsych.randomization.setSeed seeds) when the options say
     "random", else the fixed phase. Record the returned value with the item. */
  function gratingPhase(g, rng) { return g && g.randomPhase ? randInt(0, 359, rng) : (g ? g.phase : 0); }

  /**
   * The RGBA pixels of a Gabor or grating (no DOM needed; drawGrating paints them).
   * Pixels outside the item's circle are transparent; the circle's edge is antialiased.
   * @param {string} shape "gabor" or "grating".
   * @param {number} size side of the square in px (item diameter).
   * @param {number} orientDeg orientation (deg); taken mod 180.
   * @param {object} g {cycles, contrast, sigma, phase (deg), meanGray} as from
   *   resolveGrating, with phase set to this item's phase.
   * @returns {Uint8ClampedArray} size*size*4 RGBA values, row-major from the top left.
   */
  function gratingPixels(shape, size, orientDeg, g) {
    size = Math.max(1, Math.round(size));
    var out = new Uint8ClampedArray(size * size * 4);
    var th = ((((Number(orientDeg) || 0) % 180) + 180) % 180) * Math.PI / 180;
    var nx = -Math.sin(th), ny = Math.cos(th);
    var m = g.meanGray, A = Math.min(g.contrast * m, m, 255 - m);
    var k = (2 * Math.PI * g.cycles) / size, ph = ((g.phase || 0) * Math.PI) / 180;
    var R = size / 2, gab = shape === "gabor", s2 = 2 * Math.pow(g.sigma * size, 2);
    for (var y = 0; y < size; y++) {
      var py = y + 0.5 - R;
      for (var x = 0; x < size; x++) {
        var px = x + 0.5 - R, r2 = px * px + py * py;
        var alpha = Math.max(0, Math.min(1, R - Math.sqrt(r2) + 0.5));
        if (alpha <= 0) continue;
        var env = gab ? Math.exp(-r2 / s2) : 1;
        var L = m + A * env * Math.cos(k * (px * nx + py * ny) + ph);
        var i = (y * size + x) * 4;
        out[i] = out[i + 1] = out[i + 2] = L;
        out[i + 3] = Math.round(alpha * 255);
      }
    }
    return out;
  }

  /* Paint a Gabor/grating into a 2D context at (0,0), size x size (the context's current
     transform applies). Rendered patterns are cached per (shape, size, orientation mod 180,
     options, phase), so redrawing a set of items, or a probe that follows the pointer, does
     not recompute pixels. */
  var _gratingCache = new Map();
  function drawGrating(ctx, shape, orientDeg, size, g) {
    g = g || resolveGrating(null);
    size = Math.max(1, Math.round(size));
    var ori = ((((Number(orientDeg) || 0) % 180) + 180) % 180);
    var key = [shape, size, ori.toFixed(4), g.cycles, g.contrast, g.sigma, g.phase || 0, g.meanGray].join("|");
    var cv = _gratingCache.get(key);
    if (cv) {
      _gratingCache.delete(key); // most recently used goes last
    } else {
      cv = document.createElement("canvas");
      cv.width = cv.height = size;
      var c2 = cv.getContext("2d");
      var img = c2.createImageData(size, size);
      img.data.set(gratingPixels(shape, size, ori, g));
      c2.putImageData(img, 0, 0);
      if (_gratingCache.size >= 400) _gratingCache.delete(_gratingCache.keys().next().value);
    }
    _gratingCache.set(key, cv);
    ctx.drawImage(cv, 0, 0);
  }

  /* The neutral-pixel rule shared by rotateCanvasHue (memory items) and makeRecolorCache
     (probes): a pixel with L* < 5, L* > 95, or |a*| and |b*| both < 5 has no usable hue and
     is never rotated. Both paths also use the same LAB arithmetic and leave every pixel
     as drawn at rotation 0, so an object and a probe drawn at the same size and rotation
     match pixel for pixel. */
  function isNeutralLab(L, a, b) { return L < 5 || L > 95 || (Math.abs(a) < 5 && Math.abs(b) < 5); }

  /* Hue-rotate (in CIELAB) the pixels already drawn in a canvas 2D context (w x h), in place.
     Neutral pixels (isNeutralLab) keep their color. opts.grayscale converts every pixel to
     luminance after any rotation, so deg 0 with grayscale just desaturates. On a tainted
     (cross-origin) canvas it does nothing. (opts.skipBW is accepted for older callers; the
     neutral rule now always applies.) */
  function rotateCanvasHue(ctx, w, h, deg, opts) {
    opts = opts || {};
    if (!deg && !opts.grayscale) return; // nothing to change
    var img;
    try { img = ctx.getImageData(0, 0, w, h); } // tainted (cross-origin) -> leave as-is
    catch (e) { return; }
    var d = img.data;
    var rad = deg ? (deg * Math.PI) / 180 : 0, cos = Math.cos(rad), sin = Math.sin(rad);
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      if (deg) {
        var lab = rgb2lab([r, g, b]);
        if (!isNeutralLab(lab[0], lab[1], lab[2])) {
          var out = lab2rgb([lab[0], lab[1] * cos - lab[2] * sin, lab[1] * sin + lab[2] * cos]);
          r = out[0]; g = out[1]; b = out[2];
        }
      }
      if (opts.grayscale) {
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = lum;
      }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* =====================================================================
   * Pluggable stimulus noise, post-stimulus masks, and spatial cues.
   *
   * Noise and masks are registries of "kind" functions, so a study can substitute its
   * own degradation or mask without touching any plugin:
   *
   *   noise kind:  fn(ctx, size, level, opts)  -- degrade about a `level` (0..1) fraction
   *                of a size x size tile; leave the rest transparent so the stimulus
   *                underneath shows through.
   *   mask kind:   fn(ctx, size, opts)         -- fill the whole tile.
   *   opts = { wheel, rng, source, ...extra } -- wheel defaults to window.BradyColorWheel,
   *                rng() -> [0,1) defaults to Math.random, source is an optional
   *                HTMLCanvas of the shown item (only some mask kinds use it).
   *
   * A noise_type / mask_type spec may be:
   *   - a string      : a registry key ("speckle", "color-squares", ...); an unknown key
   *                     warns once and draws nothing;
   *   - a function    : used directly as the kind function;
   *   - an object     : { type: <string|function>, ...extra }; the extra keys are merged
   *                     into opts and win over the plugin's own (e.g. { type:"speckle", patch:6 }).
   *
   * Built-in kinds (registered at load). Each patch/cell is decided independently, so
   * `level` is the expected fraction covered:
   *   noiseKinds.speckle         -- 3 px patches (opts.patch) recolored, each with
   *                                 probability `level`, to a random wheel hue. The default.
   *   noiseKinds["salt-pepper"]  -- 3 px patches set to black or white with probability `level`.
   *   noiseKinds.gaussian        -- a full-tile layer of uniformly random grays in 2 px
   *                                 patches, drawn at opacity `level`. Despite the name
   *                                 this is an occluding veil, not additive Gaussian pixel
   *                                 noise; at level 1 it hides the tile completely.
   *   maskKinds["color-squares"] -- random RGB squares, cells ~size/8 (opts.cell). The default.
   *   maskKinds.noise            -- full-tile speckle (speckle at level 1).
   *   maskKinds.scramble         -- opts.source cut into an n x n grid (opts.tiles, default 4)
   *                                 and redrawn in shuffled order; color-squares when no
   *                                 source is given.
   * ===================================================================== */

  // speckle: each small square patch becomes a random wheel hue with probability
  // `level`; everywhere else stays transparent.
  function noiseSpeckle(ctx, size, level, opts) {
    var rng = opts.rng;
    var patch = opts.patch || 3; // px
    for (var y = 0; y < size; y += patch) {
      for (var x = 0; x < size; x += patch) {
        if (rng() < level) {
          ctx.fillStyle = rgbToCss(colorWheelRGB(Math.floor(rng() * 360), opts.wheel));
          ctx.fillRect(x, y, patch, patch);
        }
      }
    }
  }
  // salt-pepper: a `level` fraction of patches set to black or white (no wheel needed).
  function noiseSaltPepper(ctx, size, level, opts) {
    var rng = opts.rng;
    var patch = opts.patch || 3;
    for (var y = 0; y < size; y += patch) {
      for (var x = 0; x < size; x += patch) {
        if (rng() < level) {
          ctx.fillStyle = rng() < 0.5 ? "#000" : "#fff";
          ctx.fillRect(x, y, patch, patch);
        }
      }
    }
  }
  // gaussian: a full-tile field of uniformly random grays drawn at opacity = level. It is
  // an occluding veil, not additive Gaussian noise; at level 1 it covers the tile.
  function noiseGaussian(ctx, size, level, opts) {
    var rng = opts.rng;
    var patch = opts.patch || 2;
    var prev = ctx.globalAlpha;
    ctx.globalAlpha = Math.max(0, Math.min(1, level));
    for (var y = 0; y < size; y += patch) {
      for (var x = 0; x < size; x += patch) {
        var g = Math.floor(rng() * 256);
        ctx.fillStyle = "rgb(" + g + "," + g + "," + g + ")";
        ctx.fillRect(x, y, patch, patch);
      }
    }
    ctx.globalAlpha = prev;
  }
  // color-squares: fill the tile with random-colored squares (the classic mask).
  function maskColorSquares(ctx, size, opts) {
    var rng = opts.rng;
    var cell = opts.cell || Math.max(4, Math.round(size / 8));
    for (var y = 0; y < size; y += cell) {
      for (var x = 0; x < size; x += cell) {
        ctx.fillStyle = "rgb(" + Math.floor(rng() * 256) + "," + Math.floor(rng() * 256) + "," + Math.floor(rng() * 256) + ")";
        ctx.fillRect(x, y, cell, cell);
      }
    }
  }
  // noise (as a mask): the full-tile speckle field (speckle at level 1).
  function maskNoise(ctx, size, opts) { noiseSpeckle(ctx, size, 1, opts); }
  // scramble: cut opts.source (an HTMLCanvas of the shown item) into an n x n grid
  // and redraw the tiles in shuffled order; color-squares when no source is given.
  function maskScramble(ctx, size, opts) {
    var src = opts.source;
    if (!src || !src.width || !src.height) { maskColorSquares(ctx, size, opts); return; }
    var n = opts.tiles || 4;
    var rng = opts.rng;
    var order = [];
    for (var i = 0; i < n * n; i++) order.push(i);
    for (var j = order.length - 1; j > 0; j--) { // Fisher-Yates with opts.rng
      var k = Math.floor(rng() * (j + 1));
      var t = order[j]; order[j] = order[k]; order[k] = t;
    }
    var sw = src.width / n, sh = src.height / n, dw = size / n;
    for (var d = 0; d < n * n; d++) {
      var s = order[d];
      ctx.drawImage(src, (s % n) * sw, Math.floor(s / n) * sh, sw, sh,
        (d % n) * dw, Math.floor(d / n) * dw, dw, dw);
    }
  }

  // The registries. noise_type/mask_type strings are looked up here, and
  // registerNoise/registerMask add (or replace) kinds without touching the plugins.
  var noiseKinds = { speckle: noiseSpeckle, "salt-pepper": noiseSaltPepper, gaussian: noiseGaussian };
  var maskKinds = { "color-squares": maskColorSquares, noise: maskNoise, scramble: maskScramble };
  function registerNoise(name, fn) { noiseKinds[name] = fn; return fn; }
  function registerMask(name, fn) { maskKinds[name] = fn; return fn; }

  // Resolve a spec (string | function | {type,...extra}) against a registry.
  // Unknown string -> warnOnce + null (the dispatchers then draw nothing).
  function _resolveKind(spec, registry, what) {
    var extra = null;
    if (spec && typeof spec === "object") { extra = spec; spec = spec.type; }
    var fn = null;
    if (typeof spec === "function") fn = spec;
    else if (typeof spec === "string") {
      fn = registry[spec] || null;
      if (!fn) {
        warnOnce("brady-utils", "unknown " + what + ' kind "' + spec + '" -- nothing drawn. Registered kinds: ' +
          Object.keys(registry).map(function (n) { return '"' + n + '"'; }).join(", ") + ".");
      }
    }
    return { fn: fn, extra: extra };
  }
  // Build the opts every kind function receives: extras from an object spec
  // ({type, ...extra}, set by the experimenter) win over the plugin's opts; rng
  // defaults to Math.random and wheel to the global wheel.
  function _kindOpts(opts, extra) {
    var o = {}, k;
    if (opts) for (k in opts) { if (opts[k] !== undefined) o[k] = opts[k]; }
    if (extra) for (k in extra) { if (k !== "type" && extra[k] !== undefined) o[k] = extra[k]; }
    if (!o.rng) o.rng = Math.random;
    if (!o.wheel) o.wheel = defaultWheel();
    return o;
  }
  /* Draw `level` (0..1) worth of noise of the given kind into a 2D context.
     No-op when level is falsy/<=0 or the kind is unknown. */
  function paintNoise(ctx, size, level, spec, opts) {
    if (!ctx || !level || level <= 0) return;
    var r = _resolveKind(spec == null ? "speckle" : spec, noiseKinds, "noise");
    if (r.fn) r.fn(ctx, size, level, _kindOpts(opts, r.extra));
  }
  /* Fill a 2D context with a mask of the given kind. No-op on an unknown kind. */
  function paintMask(ctx, size, spec, opts) {
    if (!ctx) return;
    var r = _resolveKind(spec == null ? "color-squares" : spec, maskKinds, "mask");
    if (r.fn) r.fn(ctx, size, _kindOpts(opts, r.extra));
  }

  /*
   * Per-location overlay: an absolutely positioned transparent canvas placed exactly over
   * `el` (a placeholder canvas/div/img), sized to its border box and copying its
   * border-radius, so noise on a color disk stays inside the disk. It works the same for
   * canvas- and DOM-rendered items: the canvas is appended to el's offsetParent (the
   * position:relative stage or box every plugin uses), so it sits in the same
   * auto_zoom-scaled subtree. pointer-events:none, so it never intercepts responses.
   *   opts.zIndex : overlay z-index (default 40).
   * Returns { canvas, ctx, size, remove }; remove() detaches it. For a missing, hidden or
   * detached element it returns an inert object (ctx null, remove a no-op).
   */
  function locationOverlay(el, opts) {
    opts = opts || {};
    var noop = { canvas: null, ctx: null, size: 0, remove: function () {} };
    if (!el) return noop;
    var host = el.offsetParent || el.parentNode;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!host || !w || !h) return noop;
    var cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    cv.setAttribute("data-brady-overlay", ""); // marker for tests / debugging
    cv.style.cssText =
      "position:absolute;pointer-events:none;" +
      "z-index:" + (opts.zIndex != null ? opts.zIndex : 40) + ";" +
      "top:" + el.offsetTop + "px;left:" + el.offsetLeft + "px;" +
      "width:" + w + "px;height:" + h + "px";
    try { // carry the placeholder's rounding (e.g. border-radius:50% color disks)
      var br = getComputedStyle(el).borderRadius;
      if (br && br !== "0px") cv.style.borderRadius = br;
    } catch (e) { /* non-rendered element: leave square */ }
    host.appendChild(cv);
    return {
      canvas: cv,
      ctx: cv.getContext("2d"),
      size: Math.max(w, h), // kinds draw size x size; max covers a non-square tile (overflow clips)
      remove: function () { if (cv.parentNode) cv.parentNode.removeChild(cv); },
    };
  }
  /* Noise overlay over one placeholder; returns its remove fn. With level falsy or <= 0
     nothing is created and the returned fn does nothing. */
  function noiseOverlay(el, level, spec, opts) {
    if (!level || level <= 0) return function () {};
    var o = locationOverlay(el, opts);
    if (o.ctx) paintNoise(o.ctx, o.size, level, spec, opts);
    return o.remove;
  }
  /* Mask overlay fully covering one placeholder; returns its remove fn. */
  function maskOverlay(el, spec, opts) {
    var o = locationOverlay(el, opts);
    if (o.ctx) paintMask(o.ctx, o.size, spec, opts);
    return o.remove;
  }

  /*
   * Spatial cue highlight, used for both the pre-cue (before the array) and the
   * retro-cue (after the delay): a box-shadow ring around `el` that follows its
   * border-radius, so a disk gets a circular ring. Returns a clear fn that restores the
   * element's previous box-shadow (safe to call twice).
   *   opts = { color (default "#000"), thickness (px, default 5) }
   */
  function spatialCue(el, opts) {
    if (!el) return function () {};
    opts = opts || {};
    var color = opts.color != null ? opts.color : "#000";
    var thickness = opts.thickness != null ? opts.thickness : 5;
    var prev = el.style.boxShadow;
    el.style.boxShadow = "0 0 0 " + thickness + "px " + color;
    var cleared = false;
    return function () { if (!cleared) { cleared = true; el.style.boxShadow = prev; } };
  }

  /* Convert an image (drawn at w x h) to per-pixel CIELAB once, offscreen, so it can be
     recolored quickly on every pointer move (color-rotated-object and
     continuous-object-report). Neutral pixels (isNeutralLab) are never recolored, the same
     rule rotateCanvasHue uses, so redraw(ctx, d) matches a memory item drawn at the same
     size with rotateCanvasHue(..., d) pixel for pixel. Returns:
       canRecolor       -- false if the image is missing or the canvas is tainted (cross-origin).
       meanColorAt(deg) -- the mean of the recolorable pixels, hue-rotated by deg, as an
                           rgb() string (null if there are none); for a wheel that matches
                           the object.
       redraw(ctx, deg) -- draw the object into ctx with its hue rotated by deg (deg NaN or
                           undefined = recolorable pixels set to gray, a*=b*=0). Draws the raw
                           image on a tainted canvas, or a gray fill if the image is missing. */
  function makeRecolorCache(img, w, h) {
    var n = w * h;
    var ok = !!(img && img.naturalWidth > 0);
    var baseData = null, canRecolor = false;
    // Float64 (not Float32) so the cached LAB equals what rotateCanvasHue computes per pixel.
    var labL = new Float64Array(n), labA = new Float64Array(n), labB = new Float64Array(n), skip = new Uint8Array(n);
    if (ok) {
      var off = document.createElement("canvas");
      off.width = w; off.height = h;
      var octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0, w, h);
      try {
        baseData = octx.getImageData(0, 0, w, h);
        for (var p = 0, i = 0; p < n; p++, i += 4) {
          var lab = rgb2lab([baseData.data[i], baseData.data[i + 1], baseData.data[i + 2]]);
          labL[p] = lab[0]; labA[p] = lab[1]; labB[p] = lab[2];
          skip[p] = isNeutralLab(lab[0], lab[1], lab[2]) ? 1 : 0;
        }
        canRecolor = true;
      } catch (e) { /* tainted canvas: live recolor disabled, show image as-is */ }
    }
    var meanLab = null;
    if (canRecolor) {
      var sl = 0, sa = 0, sb = 0, cnt = 0;
      for (var q = 0; q < n; q++) { if (skip[q]) continue; sl += labL[q]; sa += labA[q]; sb += labB[q]; cnt++; }
      if (cnt > 0) meanLab = [sl / cnt, sa / cnt, sb / cnt];
    }
    return {
      canRecolor: canRecolor,
      meanColorAt: function (deg) {
        if (!meanLab) return null;
        var rad = (deg * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
        var a = meanLab[1] * c - meanLab[2] * s, b = meanLab[1] * s + meanLab[2] * c;
        return rgbToCss(lab2rgb([meanLab[0], a, b]));
      },
      redraw: function (ctx, deg) {
        if (!ok) { ctx.fillStyle = "#bbbbbb"; ctx.fillRect(0, 0, w, h); return; }
        if (!canRecolor) { ctx.drawImage(img, 0, 0, w, h); return; }
        var out = ctx.createImageData(w, h);
        out.data.set(baseData.data);
        if (deg === 0) { ctx.putImageData(out, 0, 0); return; } // as drawn, like rotateCanvasHue at 0
        var rad = isNaN(deg) ? 0 : (deg * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
        for (var p2 = 0, j = 0; p2 < n; p2++, j += 4) {
          if (skip[p2]) continue;
          var a2, b2;
          if (isNaN(deg)) { a2 = 0; b2 = 0; }
          else { a2 = labA[p2] * cos - labB[p2] * sin; b2 = labA[p2] * sin + labB[p2] * cos; }
          var rgb = lab2rgb([labL[p2], a2, b2]);
          out.data[j] = rgb[0]; out.data[j + 1] = rgb[1]; out.data[j + 2] = rgb[2];
        }
        ctx.putImageData(out, 0, 0);
      },
    };
  }

  /* [r,g,b] -> "rgb(r,g,b)" (rounded). Inverse of cssToRgb's numeric path. */
  function rgbToCss(rgb) {
    return "rgb(" + Math.round(rgb[0]) + "," + Math.round(rgb[1]) + "," + Math.round(rgb[2]) + ")";
  }

  /* The name of the color wheel a trial used, for the color_wheel_name data field: the
     wheel's `.name` (trial.color_wheel, else window.BradyColorWheel), or "custom" when it
     has none. Records which wheel the recorded degrees refer to. */
  function colorWheelName(wheel) {
    var w = wheel || global.BradyColorWheel;
    return w && typeof w.name === "string" && w.name ? w.name : "custom";
  }

  /* The five standard record_mouse data fields from a tracker (the caller adds its own
     mouse_geometry). Detach the tracker first. */
  function mouseTrackerData(mt) {
    return {
      mouse_trajectory: mt.samples,
      mouse_trajectory_columns: ["t", "x", "y", "value"],
      mouse_response_start_index: mt.responseStartIndex(),
      mouse_phase_onsets: mt.phaseOnsets,
      mouse_zoom: mt.zoom(),
    };
  }

  /* Circular mean of an array of degrees, in [0,360). Non-finite entries are skipped;
     NaN if none are left. */
  function circularMean(degs) {
    var xs = 0, ys = 0, k = 0;
    for (var i = 0; i < degs.length; i++) {
      var d = degs[i];
      if (!isFinite(d)) continue;
      var r = (d * Math.PI) / 180;
      xs += Math.cos(r); ys += Math.sin(r); k++;
    }
    return k ? wrap360((Math.atan2(ys, xs) * 180) / Math.PI) : NaN;
  }

  /* Signed circular difference (a - b) on a circle of `period` (default 360), in
     (-period/2, +period/2]: the antipode maps to +period/2 (one consistent sign). */
  function circularDiff(a, b, period) {
    period = period || 360;
    var d = (a - b) % period;
    if (d > period / 2) d -= period;
    if (d <= -period / 2) d += period;
    return d;
  }

  /**
   * The target of an ensemble (which_test -1) report: the circular mean of the items'
   * degrees. continuous-report, continuous-image-report and continuous-object-report all
   * score an ensemble response against it, so their ensemble error is always
   * reported - circular mean, wrapped to (-180, 180]. Non-finite entries (items with no
   * degree) are skipped. NaN when no degrees are left or when the mean is undefined (the
   * degrees cancel out, e.g. 0/120/240); the plugins then record a null target and error.
   * @param {number[]} degs item degrees.
   * @returns {number} mean in [0,360) (not rounded), or NaN.
   */
  function ensembleTarget(degs) {
    var xs = 0, ys = 0, k = 0;
    for (var i = 0; i < degs.length; i++) {
      var d = degs[i];
      if (typeof d !== "number" || !isFinite(d)) continue;
      xs += Math.cos(d * Math.PI / 180); ys += Math.sin(d * Math.PI / 180); k++;
    }
    if (!k || Math.sqrt(xs * xs + ys * ys) / k < 1e-9) return NaN;
    return wrap360(Math.atan2(ys, xs) * 180 / Math.PI);
  }

  /* The one pre-cue rule for the spatial plugins: a pre-cue runs only when precue_time > 0
     and there is a test (do_test not false), since with no probe there is nothing to cue.
     Plugins add their own exclusions (ensemble, perception) on top. */
  function wantPrecue(trial) { return trial.precue_time > 0 && trial.do_test !== false; }

  global.BradyUtils = {
    needsCors: needsCors,
    loadImages: loadImages,
    paintItem: paintItem,
    drawShape: drawShape,
    shapePeriod: shapePeriod,
    isGratingShape: isGratingShape,
    GRATING_DEFAULTS: GRATING_DEFAULTS,
    resolveGrating: resolveGrating,
    gratingPhase: gratingPhase,
    gratingPixels: gratingPixels,
    drawGrating: drawGrating,
    noiseKinds: noiseKinds,
    maskKinds: maskKinds,
    registerNoise: registerNoise,
    registerMask: registerMask,
    paintNoise: paintNoise,
    paintMask: paintMask,
    locationOverlay: locationOverlay,
    noiseOverlay: noiseOverlay,
    maskOverlay: maskOverlay,
    spatialCue: spatialCue,
    rotateCanvasHue: rotateCanvasHue,
    isNeutralLab: isNeutralLab,
    makeRecolorCache: makeRecolorCache,
    mouseTrackerData: mouseTrackerData,
    colorWheelName: colorWheelName,
    rgbToCss: rgbToCss,
    circularMean: circularMean,
    circularDiff: circularDiff,
    ensembleTarget: ensembleTarget,
    sameColor: sameColor,
    isNumericString: isNumericString,
    wantPrecue: wantPrecue,
    stageBox: stageBox,
    makeMouseTracker: makeMouseTracker,
    mouseHoldDuration: mouseHoldDuration,
    awaitKeyUp: awaitKeyUp,
    beginPressLog: beginPressLog,
    endPressLog: endPressLog,
    keyHoldData: keyHoldData,
    initHoldTracking: initHoldTracking,
    discreteChoiceGeometry: discreteChoiceGeometry,
    nearestChoiceFn: nearestChoiceFn,
    confidencePopup: confidencePopup,
    colorWheelRGB: colorWheelRGB,
    colorWheelCSS: colorWheelCSS,
    rgb2lab: rgb2lab,
    lab2rgb: lab2rgb,
    cssToRgb: cssToRgb,
    labStringToCss: labStringToCss,
    isColorString: isColorString,
    isImagePath: isImagePath,
    toCssColor: toCssColor,
    resolveItem: resolveItem,
    rotateHueLab: rotateHueLab,
    autoZoom: autoZoom,
    playSound: playSound,
    confettiBurst: confettiBurst,
    feedbackCues: feedbackCues,
    wrap360: wrap360,
    angleDiff: angleDiff,
    wheelDegreeFromPointer: wheelDegreeFromPointer,
    wheelPoint: wheelPoint,
    snapDegree: snapDegree,
    randomColorDegrees: randomColorDegrees,
    randInt: randInt,
    seededRng: seededRng,
    resolvePositions: resolvePositions,
    generateFoils: generateFoils,
    makeFinisher: makeFinisher,
    encodeArray: encodeArray,
    validatePlacement: validatePlacement,
    whichTestIndex: whichTestIndex,
    fixNaNParams: fixNaNParams,
    checkParams: checkParams,
    warnOnce: warnOnce,
    noteOnce: noteOnce,
    PLACEMENT_WARNINGS: true, // set false to silence all parameter/placement console warnings
  };
})(typeof window !== "undefined" ? window : this);


/* ===================================================================== */
/* similarity-adaptive-utils.js */
/* ===================================================================== */
/*
 * similarity-adaptive-utils.js
 * Shared similarity model and adaptive engine for the Brady-lab jsPsych v8
 * similarity plugins (jspsych-similarity-triad / -quad / -likert).
 *
 * Exposes one global namespace, `BradySimilarity`. Load order:
 *   brady-color-wheel.js -> brady-plugin-utils.js -> similarity-adaptive-utils.js
 *   -> jspsych-similarity-*.js
 *
 * The file also runs in plain node, so tests/invariants.js can unit-test the
 * math. The only browser call (fetch, in loadGroupPrior) is guarded. Under a
 * bare require() the namespace lands on module.exports
 * (require(...).BradySimilarity); with a global `window` defined (as the tests
 * do) it lands on that.
 *
 * What it estimates
 * -----------------
 * The target is the full similarity matrix s(x, y) = f(delta) + g_x(delta),
 * delta = wrap(y - x): a homogeneous falloff f plus per-target deviations g_x.
 *   (a) Every trial records exact degrees and signed offsets, so any matrix
 *       estimator (parametric f + g_x, or empirical binning) can be fit offline.
 *       engine.history / exportState() carry everything an offline g_x fit needs.
 *   (b) The engine adapts on f only. Anchor-stratified sampling (least-sampled
 *       of 12 equal bins first: 30 degrees on a 360 space, 15 on a 180 space)
 *       keeps every matrix row estimable, so anchors cover the space evenly by
 *       design.
 *   (c) `empiricalMatrix(history)` bins the recorded responses into an
 *       (anchor-bin x offset-bin) similarity table, a model-light reference
 *       implementation of the confusion-matrix aggregation.
 *   (d) Adaptive targeting of g_x is not implemented. createEngine reserves a
 *       `heterogeneous` option for it; setting it only warns.
 *
 * Stimulus space (`period`)
 * ------------------------
 * Degrees live on a circle of `period` degrees: 360 (default) for color-wheel
 * hues and pointed shapes, or 180 for unpointed orientations (an oriented bar,
 * Gabor or grating, item_shape "line", "gabor" or "grating", looks the same
 * rotated by 180 degrees). Distances wrap in
 * the period, so the largest distance is period/2, and the engine hands out
 * integer degrees in [0, period). Period 360 gives exactly the results this
 * module gave before the option existed.
 *
 * f is a peak-normalized (TCC-style) von Mises basis, periodic in the period P:
 *
 *     f(delta; w) = sum_k w_k * exp(kappa_k * (cos(2*pi*delta/P) - 1))
 *
 * with default kappas [0.5, 2, 8, 32] and w on the simplex (w_k >= 0,
 * sum w_k = 1), so f(0) = 1, f(-delta) = f(delta) and f(delta + P) = f(delta).
 * With P = 180 a kappa acts on the doubled angle, so the same kappas give the
 * same falloff shape over [0, 90] that they give over [0, 180] with P = 360.
 *
 * Four choice likelihoods share one precision beta > 0 (larger beta = more
 * deterministic choices):
 *   triad    -- odd-one-out over degrees [a,b,c]. Outcome = the most-similar
 *               pair, index 0 = AB, 1 = AC, 2 = BC (the odd item is the one not
 *               in that pair); P = softmax(beta*[s(a,b), s(a,c), s(b,c)]).
 *   reftriad -- reference `ref` with comparisons b, c. Outcome 0 = b judged MORE
 *               DIFFERENT from ref, 1 = c; P(b) = logistic(beta*[s(ref,c) - s(ref,b)]).
 *               This is the quad likelihood with a shared reference.
 *   quad     -- pairs (A,B) vs (C,D). Outcome 0 = pair1 judged MORE SIMILAR;
 *               P(pair1) = logistic(beta*[s(A,B) - s(C,D)]).
 *   likert   -- rating r in 1..R, higher = more similar. Ordered logistic with
 *               increasing thresholds c_k = c0 + (k-1)*exp(logDc):
 *               P(r <= k) = logistic(c_k - beta*s).
 *
 * The engine (`createEngine`) keeps a particle-filter posterior over
 * theta = { w (simplex), logBeta, c0, logDc }. Each response multiplies the
 * particle weights by its likelihood (weights are renormalized every update,
 * so no log-space accumulation is needed); when the effective sample size
 * falls below nParticles/2 it does systematic resampling plus a Liu-West
 * move (shrink toward the posterior mean, then jitter), which refreshes the
 * particles without widening the posterior.
 * Trial selection is epsilon-greedy. Each trial is a coverage trial with
 * probability epsilon, an independent Bernoulli draw per trial (so the number
 * of coverage trials varies around epsilon x trials; it is not a fixed
 * fraction). A coverage trial has offsets uniform on [minSeparation, period/2]
 * and stratified anchors; these are the independent replicates the reliable-variance
 * diagnostic uses. Otherwise it scores ~48 candidates by BALD mutual
 * information and takes the best. Candidate offsets come mostly from the
 * offsets where the posterior SD of f is highest, contrasted against
 * low-SD offsets where the geometry allows.
 *
 * All randomness goes through opts.rng (() -> [0,1)), so an engine built with
 * `BradySimilarity.seededRng(seed)` is fully deterministic.
 *
 * Group-prior JSON (loadGroupPrior), a small static file:
 *   { version: 1,
 *     period: 360,   (optional; 360 or 180, missing = 360)
 *     alpha:  [..one Dirichlet concentration per kappa..],
 *     beta:   { logMean, logSD },
 *     likert: { c0Mean, c0SD, dcLogMean, dcLogSD } }
 * Missing fields fall back to the defaults. A prior fit in one period does
 * not describe the other, so createEngine ignores a prior whose period differs
 * from the engine's (with a warning). In node (no fetch) pass the object, not
 * a URL.
 *
 * Limitation: the adaptive engine covers circular stimulus spaces only, with
 * a 360- or 180-degree period. For an oriented bar, Gabor or grating
 * (item_shape "line", "gabor" or "grating") create the engine with
 * { period: 180 }; the plugins warn if the shape and the
 * engine's period disagree. The plugins still accept image/text items for
 * fixed designs; ordinal embedding for face/object sets is not implemented.
 *
 * API
 * ---
 * The full API (every function, createEngine option, engine method, the history
 * record format and the exportState() layout) is documented in API.md, which
 * replaces the list that used to be here. Keep API.md in step when the API changes.
 *
 * Timothy Brady, Brady Lab -- 2026.
 */
(function (global) {
  "use strict";

  var DEFAULT_KAPPAS = [0.5, 2, 8, 32];
  var TWO_PI = 2 * Math.PI;

  /* ----- deduped warnings: BradyUtils.warnOnce in the browser, a plain
     console.warn fallback so node never needs BradyUtils. ----- */
  var _warned = {};
  function warn(msg) {
    if (global.BradyUtils && global.BradyUtils.warnOnce) { global.BradyUtils.warnOnce("brady-similarity", msg); return; }
    if (!_warned[msg] && typeof console !== "undefined" && console.warn) { _warned[msg] = 1; console.warn("[brady-similarity] " + msg); }
  }

  /* ----- seeded rng (mulberry32, 32-bit state) for deterministic engines ----- */
  // The returned function also has getState(): its current 32-bit state, such that
  // seededRng(rng.getState()) continues the same stream. exportState({particles: true})
  // saves it, so a restored engine can continue a seeded session exactly.
  function seededRng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.getState = function () { return a >>> 0; };
    return next;
  }

  /* ----- stimulus-space period (degrees per full turn of the stimulus) -----
     360 for hues and pointed shapes; 180 for unpointed orientations (bars),
     which look the same after a 180-degree turn. */
  var DEFAULT_PERIOD = 360;
  var PERIODS = [360, 180];
  // A model-function `period` argument: missing -> 360; anything else that is
  // not 360 or 180 throws, since a silent fallback would compute wrong values.
  function periodArg(p) {
    if (p == null) return DEFAULT_PERIOD;
    if (PERIODS.indexOf(p) < 0) throw new RangeError("BradySimilarity: period must be 360 or 180 (got " + p + ").");
    return p;
  }

  /* ----- circular helpers (degrees) ----- */
  // v -> [0, period)
  function wrapP(v, period) { v = v % period; return v < 0 ? v + period : v; }
  // |shortest arc| between two degrees, in [0, period/2]
  function absDiff(a, b, period) { var d = wrapP(a - b, period); return d > period / 2 ? period - d : d; }

  /* ----- von Mises basis, periodic in `period` -----
     The angle on the unit circle is 2*pi*delta/period = pi*delta/(period/2);
     for period 360 that is the original pi*delta/180, term for term. */
  function basisValue(kappa, deltaDeg, period) {
    return Math.exp(kappa * (Math.cos((deltaDeg * Math.PI) / (period / 2)) - 1));
  }
  // basis[k][d] for integer offsets d = 0..period-1. The engine works in integer
  // degrees, so each f evaluation is a K-term dot product against this table.
  function makeBasisTable(kappas, period) {
    var table = [];
    for (var k = 0; k < kappas.length; k++) {
      var row = new Float64Array(period);
      for (var d = 0; d < period; d++) row[d] = basisValue(kappas[k], d, period);
      table.push(row);
    }
    return table;
  }

  /* f(delta; w), evaluated exactly (non-integer deltas are fine). f(0) = 1
     only if w is on the simplex; this function does not check. */
  function fOf(deltaDeg, w, kappas, period) {
    kappas = kappas || DEFAULT_KAPPAS;
    period = periodArg(period);
    var s = 0;
    for (var k = 0; k < kappas.length; k++) s += w[k] * basisValue(kappas[k], deltaDeg, period);
    return s;
  }
  /* The full falloff curve at integer offsets 0..period-1. */
  function fCurve(w, kappas, period) {
    period = periodArg(period);
    var out = new Float64Array(period);
    for (var d = 0; d < period; d++) out[d] = fOf(d, w, kappas, period);
    return out;
  }

  /* ----- likelihoods (theta = { w, logBeta, c0, logDc }) ----- */
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function softmax3(a, b, c) {
    var m = Math.max(a, b, c);
    var ea = Math.exp(a - m), eb = Math.exp(b - m), ec = Math.exp(c - m);
    var s = ea + eb + ec;
    return [ea / s, eb / s, ec / s];
  }

  /* Triad: degrees [a,b,c] -> [P(AB most similar), P(AC), P(BC)]. */
  function triadProbs(degrees, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var sAB = fOf(absDiff(degrees[1], degrees[0], period), theta.w, kappas, period);
    var sAC = fOf(absDiff(degrees[2], degrees[0], period), theta.w, kappas, period);
    var sBC = fOf(absDiff(degrees[2], degrees[1], period), theta.w, kappas, period);
    return softmax3(beta * sAB, beta * sAC, beta * sBC);
  }
  /* Quad: P(pair1 = [A,B] judged more similar than pair2 = [C,D]). */
  function quadProb(pair1, pair2, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var s1 = fOf(absDiff(pair1[1], pair1[0], period), theta.w, kappas, period);
    var s2 = fOf(absDiff(pair2[1], pair2[0], period), theta.w, kappas, period);
    return sigmoid(beta * (s1 - s2));
  }
  /* Reference triad (reference-on-top task): P(b judged more different from
     `ref` than c is). More different means less similar, so this is quadProb
     with a shared reference and the sign flipped: P(b) rises as s(ref,b) falls
     relative to s(ref,c). */
  function refTriadProb(ref, b, c, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var sB = fOf(absDiff(b, ref, period), theta.w, kappas, period);
    var sC = fOf(absDiff(c, ref, period), theta.w, kappas, period);
    return sigmoid(beta * (sC - sB));
  }
  /* Likert: degrees [a,b], R rating points -> [P(r=1), ..., P(r=R)], where
     higher ratings mean more similar. Ordered logistic with thresholds
     c_k = c0 + (k-1)*dc; dc = exp(logDc) > 0 keeps them increasing, so every
     probability is non-negative. Each cell is floored at 1e-12, so the row can
     sum to slightly more than 1 when a category is effectively impossible. */
  function likertProbs(degrees, theta, R, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var dc = Math.exp(theta.logDc);
    var s = fOf(absDiff(degrees[1], degrees[0], period), theta.w, kappas, period);
    var out = new Array(R);
    var prev = 0;
    for (var k = 1; k < R; k++) {
      var cum = sigmoid(theta.c0 + (k - 1) * dc - beta * s);
      out[k - 1] = Math.max(cum - prev, 1e-12);
      prev = cum;
    }
    out[R - 1] = Math.max(1 - prev, 1e-12);
    return out;
  }

  /* ----- random-variate helpers (all through the injected rng) ----- */
  function randNorm(rng) {
    var u1 = 0;
    while (u1 <= 1e-12) u1 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * rng());
  }
  // Gamma(shape, 1) by Marsaglia-Tsang; shape < 1 uses Gamma(shape+1) * U^(1/shape).
  function randGamma(shape, rng) {
    if (shape < 1) {
      var u = 0;
      while (u <= 1e-12) u = rng();
      return randGamma(shape + 1, rng) * Math.pow(u, 1 / shape);
    }
    var d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x = randNorm(rng);
      var v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      var u2 = rng();
      if (u2 < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(Math.max(u2, 1e-300)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  // Dirichlet(alpha) sample -> simplex weights (normalized Gammas).
  function randDirichlet(alpha, rng) {
    var g = new Array(alpha.length), s = 0, k;
    for (k = 0; k < alpha.length; k++) { g[k] = Math.max(randGamma(alpha[k], rng), 1e-12); s += g[k]; }
    for (k = 0; k < alpha.length; k++) g[k] /= s;
    return g;
  }

  /* ----- group prior ----- */
  var DEFAULT_PRIOR = {
    version: 1,
    alpha: null, // null -> all-ones of length K (filled in per engine)
    beta: { logMean: Math.log(8), logSD: 0.75 },
    likert: { c0Mean: 0, c0SD: 1, dcLogMean: Math.log(1), dcLogSD: 0.5 },
  };
  // `period` is the engine's. A supplied prior records the period it was fit
  // in (missing field = 360); a prior from the other period is ignored as a whole.
  function normalizePrior(prior, K, period) {
    var priorPeriod = prior && prior.period != null ? Number(prior.period) : DEFAULT_PERIOD;
    if (prior && priorPeriod !== period) {
      warn("group prior was fit with period " + priorPeriod + " but the engine has period " + period +
        "; ignoring the prior (using the defaults). Give the prior a matching `period` field.");
      prior = null;
    }
    prior = prior || {};
    var alpha = Array.isArray(prior.alpha) ? prior.alpha.slice() : null;
    if (alpha && alpha.length !== K) {
      warn("group prior alpha has " + alpha.length + " entries but the engine has " + K +
        " kappas; ignoring the prior alpha (using all-ones).");
      alpha = null;
    }
    if (!alpha) { alpha = []; for (var k = 0; k < K; k++) alpha.push(1); }
    var b = prior.beta || {};
    var l = prior.likert || {};
    return {
      alpha: alpha,
      beta: {
        logMean: typeof b.logMean === "number" ? b.logMean : DEFAULT_PRIOR.beta.logMean,
        logSD: typeof b.logSD === "number" ? b.logSD : DEFAULT_PRIOR.beta.logSD,
      },
      likert: {
        c0Mean: typeof l.c0Mean === "number" ? l.c0Mean : DEFAULT_PRIOR.likert.c0Mean,
        c0SD: typeof l.c0SD === "number" ? l.c0SD : DEFAULT_PRIOR.likert.c0SD,
        dcLogMean: typeof l.dcLogMean === "number" ? l.dcLogMean : DEFAULT_PRIOR.likert.dcLogMean,
        dcLogSD: typeof l.dcLogSD === "number" ? l.dcLogSD : DEFAULT_PRIOR.likert.dcLogSD,
      },
    };
  }
  /* Resolve a group prior: an object resolves as-is; a URL string is fetched
     as JSON (browser only; node callers pass the object). */
  function loadGroupPrior(src) {
    if (src && typeof src === "object") return Promise.resolve(src);
    if (typeof src === "string") {
      if (typeof fetch !== "function") {
        return Promise.reject(new Error("loadGroupPrior: no fetch in this environment -- pass the prior object itself (node callers must load the JSON themselves)."));
      }
      return fetch(src).then(function (r) {
        if (!r.ok) throw new Error("loadGroupPrior: HTTP " + r.status + " fetching " + src);
        return r.json();
      });
    }
    return Promise.reject(new TypeError("loadGroupPrior: expected a prior object or a URL string."));
  }

  /* Is `response` a legal outcome for a trial of this type? R = the likert
     scale's rating points. Unknown types are not legal. */
  function legalResponse(type, response, R) {
    if (typeof response !== "number" || response !== Math.floor(response)) return false;
    if (type === "triad") return response >= 0 && response <= 2;
    if (type === "quad" || type === "reftriad") return response === 0 || response === 1;
    if (type === "likert") return response >= 1 && response <= R;
    return false;
  }
  /* Should a history record count in a summary (empiricalMatrix,
     reliableVariance)? Not if the engine marked it invalid, and not if its
     response is out of range (covers histories saved without the flag). */
  function usableRecord(rec, R) {
    return !!rec && !rec.invalid && legalResponse(rec.type, rec.response, R || 7);
  }

  /* ----- empirical (model-light) similarity observations ------------------
   * One history record -> its judged pairs as [degX, degY, value], value in
   * 0..1 with 1 = more similar (triad/quad: chosen-as-more-similar indicator;
   * likert: the rating rescaled to 0..1). R = the likert scale's rating points. */
  function pairObservations(rec, R) {
    if (rec.type === "triad") {
      var g = rec.degrees;
      return [
        [g[0], g[1], rec.response === 0 ? 1 : 0],
        [g[0], g[2], rec.response === 1 ? 1 : 0],
        [g[1], g[2], rec.response === 2 ? 1 : 0],
      ];
    }
    if (rec.type === "reftriad") {
      // Only the two reference pairs are judged. The chosen (more-different)
      // comparison is the less-similar one, so it gets 0.
      var a = rec.ref, cmp = rec.comparisons;
      return [
        [a, cmp[0], rec.response === 0 ? 0 : 1],
        [a, cmp[1], rec.response === 1 ? 0 : 1],
      ];
    }
    if (rec.type === "quad") {
      return [
        [rec.pair1[0], rec.pair1[1], rec.response === 0 ? 1 : 0],
        [rec.pair2[0], rec.pair2[1], rec.response === 1 ? 1 : 0],
      ];
    }
    // likert
    return [[rec.degrees[0], rec.degrees[1], (rec.response - 1) / Math.max((R || 7) - 1, 1)]];
  }
  /*
   * Model-light full-matrix path: bin an engine's recorded responses into an
   * (anchor-bin x offset-bin) empirical similarity table. Each judged pair
   * (x, y) is credited to both rows, anchorBin(x) and anchorBin(y), at offset
   * bin |wrap(y - x)|, since s(x,y) = f + g_x has a row for each item.
   *   history : engine.history (or any array of {type, degrees|pair1/pair2|
   *             ref+comparisons, response} records)
   *   opts    : { period=360, anchorBin=period/12, offsetBin=period/24,
   *               ratingPoints=7 }. History records do not carry the period,
   *             so pass the engine's period for a 180 engine.
   * Records marked invalid (or with an out-of-range response) are skipped.
   * Returns { period, anchorBins, offsetBins, anchorBinSize, offsetBinSize,
   * mean, n } where mean[a][o] is the binned similarity (0..1) or null when
   * unsampled, and n[a][o] the observation count. Offsets run 0..period/2.
   */
  function empiricalMatrix(history, opts) {
    opts = opts || {};
    var P = periodArg(opts.period);
    var aSize = opts.anchorBin || P / 12, oSize = opts.offsetBin || P / 24;
    var nA = Math.ceil(P / aSize), nO = Math.ceil((P / 2 + 1) / oSize);
    var R = opts.ratingPoints || 7;
    var sum = [], n = [], a, o;
    for (a = 0; a < nA; a++) {
      sum.push(new Float64Array(nO));
      n.push(new Float64Array(nO));
    }
    (history || []).forEach(function (rec) {
      if (!usableRecord(rec, R)) return; // invalid (out-of-range) responses carry no similarity
      pairObservations(rec, R).forEach(function (obs) {
        var ob = Math.min(Math.floor(absDiff(obs[1], obs[0], P) / oSize), nO - 1);
        [obs[0], obs[1]].forEach(function (deg) {
          var abin = Math.floor(wrapP(deg, P) / aSize) % nA;
          sum[abin][ob] += obs[2];
          n[abin][ob] += 1;
        });
      });
    });
    var mean = [], nOut = [];
    for (a = 0; a < nA; a++) {
      var mrow = new Array(nO), nrow = new Array(nO);
      for (o = 0; o < nO; o++) {
        nrow[o] = n[a][o];
        mrow[o] = n[a][o] > 0 ? sum[a][o] / n[a][o] : null;
      }
      mean.push(mrow); nOut.push(nrow);
    }
    return { period: P, anchorBins: nA, offsetBins: nO, anchorBinSize: aSize, offsetBinSize: oSize, mean: mean, n: nOut };
  }

  /* =====================================================================
   * The adaptive engine: particle posterior + BALD trial selection.
   * ===================================================================== */
  function createEngine(opts) {
    opts = opts || {};
    // opts.state: a full snapshot from exportState({particles: true}). Its settings
    // (period, kappas, nParticles, epsilon, ratingPoints, minSeparation) replace any in
    // opts, and the particles, weights, history and anchor counts are loaded instead of
    // being drawn from the prior (see restoreEngine).
    var state = opts.state || null;
    if (state) {
      if (!state.particles || !Array.isArray(state.particles.w)) {
        throw new Error("BradySimilarity: restoring needs a snapshot from exportState({particles: true}); this one has no particles.");
      }
      opts = Object.assign({}, opts, {
        period: state.period, kappas: state.kappas, nParticles: state.nParticles, epsilon: state.epsilon,
        ratingPoints: state.ratingPoints, minSeparation: state.minSeparation, prior: null,
      });
      // The rng to continue with: opts.rng, else a seeded rng rebuilt from the saved state.
      if (!opts.rng && state.rngState != null) opts.rng = seededRng(state.rngState);
    }
    var kappas = (opts.kappas || DEFAULT_KAPPAS).slice();
    var K = kappas.length;
    var N = opts.nParticles || 400;
    var epsilon = opts.epsilon != null ? opts.epsilon : 0.2;
    var rng = opts.rng || Math.random;
    var ratingPoints = Math.max(2, Math.round(opts.ratingPoints || 7)); // a 1-point scale carries no information
    // Stimulus-space period: 360 (default) or 180. Anything else warns and uses 360.
    var P = opts.period == null ? DEFAULT_PERIOD : Number(opts.period);
    if (PERIODS.indexOf(P) < 0) {
      warn("period=" + opts.period + " is not supported (use 360, or 180 for oriented bars); using 360.");
      P = DEFAULT_PERIOD;
    }
    var HALF = P / 2; // the largest possible distance
    var minSep = opts.minSeparation != null ? Math.round(Number(opts.minSeparation)) : 8;
    // Offsets are drawn from [minSep, period/2], so minSep must sit in 0..period/2.
    if (!(minSep >= 0 && minSep <= HALF)) {
      var clampedSep = isFinite(minSep) ? Math.min(Math.max(minSep, 0), HALF) : 8;
      warn("minSeparation=" + opts.minSeparation + " is outside 0.." + HALF + "; using " + clampedSep + ".");
      minSep = clampedSep;
    }
    var prior = normalizePrior(opts.prior, K, P);
    var basis = makeBasisTable(kappas, P);
    // Reserved: per-target g_x adaptation is not implemented, so `true` only warns.
    if (opts.heterogeneous) {
      warn("heterogeneous:true (per-target g_x adaptation) is not implemented -- the engine adapts the " +
        "homogeneous falloff f only; the option is ignored. The recorded history still supports " +
        "an offline g_x fit (exact degrees are stored per trial).");
    }

    // ---- particles: theta_i = { w (simplex, K), logBeta, c0, logDc } ----
    var W = new Float64Array(N * K);     // simplex weights, row-major
    var logBeta = new Float64Array(N);
    var c0 = new Float64Array(N);
    var logDc = new Float64Array(N);
    var wgt = new Float64Array(N);       // posterior particle weights (sum 1)
    if (state) loadParticles(state.particles);
    else (function samplePrior() {
      for (var i = 0; i < N; i++) {
        var wv = randDirichlet(prior.alpha, rng);
        for (var k = 0; k < K; k++) W[i * K + k] = wv[k];
        logBeta[i] = prior.beta.logMean + prior.beta.logSD * randNorm(rng);
        c0[i] = prior.likert.c0Mean + prior.likert.c0SD * randNorm(rng);
        logDc[i] = prior.likert.dcLogMean + prior.likert.dcLogSD * randNorm(rng);
        wgt[i] = 1 / N;
      }
    })();

    // Copy a saved particle set (exportState({particles: true}).particles) into place.
    function loadParticles(pt) {
      if (pt.w.length !== N || pt.logBeta.length !== N || pt.c0.length !== N || pt.logDc.length !== N || pt.weights.length !== N) {
        throw new Error("BradySimilarity: the snapshot's particle arrays do not have nParticles (" + N + ") entries.");
      }
      for (var i = 0; i < N; i++) {
        if (pt.w[i].length !== K) throw new Error("BradySimilarity: snapshot particle " + i + " has " + pt.w[i].length + " weights for " + K + " kappas.");
        for (var k = 0; k < K; k++) W[i * K + k] = pt.w[i][k];
        logBeta[i] = pt.logBeta[i]; c0[i] = pt.c0[i]; logDc[i] = pt.logDc[i]; wgt[i] = pt.weights[i];
      }
    }

    // A restored engine starts from the snapshot's history (a deep copy, so the snapshot
    // is left untouched).
    var history = state ? JSON.parse(JSON.stringify(state.history || [])) : [];
    var cacheMean = null, cacheSD = null; // fHat / fSD caches, cleared on update

    // f for particle i at integer offset d (0..period-1).
    function fP(i, d) {
      var s = 0, base = i * K;
      for (var k = 0; k < K; k++) s += W[base + k] * basis[k][d];
      return s;
    }
    function offIdx(a, b) { return Math.round(absDiff(a, b, P)); }

    // ---- per-particle likelihood of one observed response ----
    function likelihood(i, type, spec, response) {
      var beta = Math.exp(logBeta[i]);
      if (type === "triad") {
        var g = spec.degrees;
        var p = softmax3(
          beta * fP(i, offIdx(g[1], g[0])),
          beta * fP(i, offIdx(g[2], g[0])),
          beta * fP(i, offIdx(g[2], g[1]))
        );
        return p[response];
      }
      if (type === "quad") {
        var s1 = fP(i, offIdx(spec.pair1[1], spec.pair1[0]));
        var s2 = fP(i, offIdx(spec.pair2[1], spec.pair2[0]));
        var p1 = sigmoid(beta * (s1 - s2));
        return response === 0 ? p1 : 1 - p1;
      }
      if (type === "reftriad") {
        var sB = fP(i, offIdx(spec.comparisons[0], spec.ref));
        var sC = fP(i, offIdx(spec.comparisons[1], spec.ref));
        var pB = sigmoid(beta * (sC - sB)); // P(b more different from ref)
        return response === 0 ? pB : 1 - pB;
      }
      if (type === "likert") {
        var probs = likertRow(i, offIdx(spec.degrees[1], spec.degrees[0]));
        return probs[response - 1];
      }
      throw new Error("BradySimilarity engine: unknown update type '" + type + "'");
    }
    // Ordered-logistic outcome row for particle i at offset d.
    function likertRow(i, d) {
      var beta = Math.exp(logBeta[i]);
      var dc = Math.exp(logDc[i]);
      var s = fP(i, d);
      var out = new Array(ratingPoints);
      var prev = 0;
      for (var k = 1; k < ratingPoints; k++) {
        var cum = sigmoid(c0[i] + (k - 1) * dc - beta * s);
        out[k - 1] = Math.max(cum - prev, 1e-12);
        prev = cum;
      }
      out[ratingPoints - 1] = Math.max(1 - prev, 1e-12);
      return out;
    }

    // ---- systematic resampling, then Liu-West rejuvenation ----
    // Plain jitter adds variance on every resample, so the posterior would
    // widen with each one even when the data say nothing new. Liu-West (2001)
    // first shrinks each particle toward the weighted mean by a = sqrt(1 - h^2),
    // then adds noise with SD h * (the posterior SD of that parameter). The
    // mean is unchanged and the variance comes out a^2*V + h^2*V = V. Each
    // parameter is treated separately; w is handled in log space (then put
    // back on the simplex). LW_H is the bandwidth h, default 0.1 (a = 0.995):
    // larger moves particles further per resample (more rejuvenation), smaller
    // keeps them closer to their source. 0.1 passes the seeded recovery tests
    // at period 360 and 180.
    var LW_H = 0.1;
    var LW_A = Math.sqrt(1 - LW_H * LW_H);
    // Weighted mean and SD of each parameter under the current weights:
    // index k < K is log w_k, then logBeta, c0, logDc.
    function paramMoments() {
      var D = K + 3, mean = new Float64Array(D), m2 = new Float64Array(D), i, k;
      for (i = 0; i < N; i++) {
        var g = wgt[i];
        for (k = 0; k < D; k++) {
          var v = k < K ? Math.log(W[i * K + k] + 1e-12) : k === K ? logBeta[i] : k === K + 1 ? c0[i] : logDc[i];
          mean[k] += g * v; m2[k] += g * v * v;
        }
      }
      var sd = new Float64Array(D);
      for (k = 0; k < D; k++) sd[k] = Math.sqrt(Math.max(m2[k] - mean[k] * mean[k], 0));
      return { mean: mean, sd: sd };
    }
    // Liu-West move of one value x: shrink toward the mean, add scaled noise.
    function lwMove(x, mean, sd) { return LW_A * x + (1 - LW_A) * mean + LW_H * sd * randNorm(rng); }
    function resample() {
      var pm = paramMoments(); // before resampling, from the weighted particles
      var idx = new Array(N);
      var u = rng() / N, cum = 0, j = 0, i;
      for (i = 0; i < N; i++) {
        var target = u + i / N;
        while (cum + wgt[j] < target && j < N - 1) { cum += wgt[j]; j++; }
        idx[i] = j;
      }
      var W2 = new Float64Array(N * K);
      var lb2 = new Float64Array(N), c02 = new Float64Array(N), ld2 = new Float64Array(N);
      for (i = 0; i < N; i++) {
        var src = idx[i];
        // move w in log space, then renormalize back onto the simplex
        var s = 0, k, v;
        for (k = 0; k < K; k++) {
          v = Math.exp(lwMove(Math.log(W[src * K + k] + 1e-12), pm.mean[k], pm.sd[k]));
          W2[i * K + k] = v; s += v;
        }
        for (k = 0; k < K; k++) W2[i * K + k] /= s;
        lb2[i] = lwMove(logBeta[src], pm.mean[K], pm.sd[K]);
        c02[i] = lwMove(c0[src], pm.mean[K + 1], pm.sd[K + 1]);
        ld2[i] = lwMove(logDc[src], pm.mean[K + 2], pm.sd[K + 2]);
      }
      W = W2; logBeta = lb2; c0 = c02; logDc = ld2;
      for (i = 0; i < N; i++) wgt[i] = 1 / N;
    }

    // Is `response` a legal outcome index for this trial type?
    function validResponse(type, response) {
      if (["triad", "quad", "reftriad", "likert"].indexOf(type) < 0) {
        throw new Error("BradySimilarity engine: unknown update type '" + type + "'");
      }
      return legalResponse(type, response, ratingPoints);
    }

    // ---- posterior update on one observed response ----
    function update(type, spec, response) {
      var sum = 0, i;
      // An illegal response (e.g. a rating above ratingPoints) would turn every
      // weight into NaN and wipe the posterior. Record it, skip the update.
      var usable = validResponse(type, response);
      if (!usable) {
        warn("update(\"" + type + "\") got response " + response + ", outside the legal range" +
          (type === "likert" ? " 1.." + ratingPoints : "") + "; recorded in history but not used by the posterior.");
      }
      for (i = 0; usable && i < N; i++) {
        wgt[i] *= Math.max(likelihood(i, type, spec, response), 1e-300);
        sum += wgt[i];
      }
      if (!usable) {
        // weights untouched
      } else if (!(sum > 0) || !isFinite(sum)) { // every weight underflowed: reset to uniform
        for (i = 0; i < N; i++) wgt[i] = 1 / N;
        warn("particle weights degenerated on an update; weights reset to uniform.");
      } else {
        var ess = 0;
        for (i = 0; i < N; i++) { wgt[i] /= sum; ess += wgt[i] * wgt[i]; }
        if (1 / ess < N / 2) resample();
      }
      var rec = { type: type, response: response, isCoverage: !!spec.isCoverage };
      // kept for the record, but every summary (empiricalMatrix,
      // reliableVariance, exportState counts) skips it
      if (!usable) rec.invalid = true;
      if (spec.degrees) rec.degrees = spec.degrees.slice();
      if (spec.pair1) { rec.pair1 = spec.pair1.slice(); rec.pair2 = spec.pair2.slice(); }
      if (spec.ref != null) { rec.ref = spec.ref; rec.comparisons = spec.comparisons.slice(); }
      history.push(rec);
      cacheMean = null; cacheSD = null;
    }

    // ---- posterior mean/SD of f per offset --------------------------------
    // f is linear in w, so fHat needs only the weighted mean of w (K numbers)
    // and fSD only the KxK second moment C_kl = sum_i wgt_i w_ik w_il. Both
    // are cheap to push through the basis table at all `period` offsets.
    // meanCurve/sdCurve return the cached arrays for internal use; the public
    // fHat/fSD hand out copies, so a caller can't corrupt the cache.
    function moments() {
      var wbar = new Float64Array(K);
      var C = new Float64Array(K * K);
      for (var i = 0; i < N; i++) {
        var g = wgt[i], base = i * K;
        for (var k = 0; k < K; k++) {
          wbar[k] += g * W[base + k];
          for (var l = 0; l < K; l++) C[k * K + l] += g * W[base + k] * W[base + l];
        }
      }
      return { wbar: wbar, C: C };
    }
    function meanCurve() {
      if (cacheMean) return cacheMean;
      var m = moments();
      var out = new Float64Array(P);
      for (var d = 0; d < P; d++) {
        var s = 0;
        for (var k = 0; k < K; k++) s += m.wbar[k] * basis[k][d];
        out[d] = s;
      }
      cacheMean = out;
      return out;
    }
    function sdCurve() {
      if (cacheSD) return cacheSD;
      var m = moments();
      var mean = meanCurve();
      var out = new Float64Array(P);
      for (var d = 0; d < P; d++) {
        var e2 = 0;
        for (var k = 0; k < K; k++) {
          for (var l = 0; l < K; l++) e2 += m.C[k * K + l] * basis[k][d] * basis[l][d];
        }
        out[d] = Math.sqrt(Math.max(e2 - mean[d] * mean[d], 0));
      }
      cacheSD = out;
      return out;
    }
    function fHat() { return meanCurve().slice(); }
    function fSD() { return sdCurve().slice(); }
    function posteriorMean() {
      var m = moments();
      var lb = 0, c = 0, ld = 0;
      for (var i = 0; i < N; i++) { lb += wgt[i] * logBeta[i]; c += wgt[i] * c0[i]; ld += wgt[i] * logDc[i]; }
      return { w: Array.from(m.wbar), beta: Math.exp(lb), c0: c, dc: Math.exp(ld) };
    }
    // Posterior SD of each parameter on the scale the filter moves it in.
    function posteriorSD() {
      var sd = paramMoments().sd;
      return { logW: Array.from(sd.slice(0, K)), logBeta: sd[K], c0: sd[K + 1], logDc: sd[K + 2] };
    }

    /* ---- trial selection ---------------------------------------------------
     * Epsilon-greedy. Coverage draws take offsets uniform on [minSep, period/2]
     * and stratified anchors. Adaptive draws build 48 candidates whose offsets come
     * mostly from the 12 highest-posterior-SD offsets of f, paired with one of
     * the 12 lowest-SD offsets about a third of the time and a uniform offset
     * about 15% of the time, and keep the candidate with the largest BALD score.
     * ---------------------------------------------------------------------- */
    var POOL = 48, TOPK = 12;
    function randInt(lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); } // inclusive
    function randOffset() { return randInt(minSep, HALF); }
    // ---- anchor stratification --------------------------------------------
    // The estimand is the full matrix s(x,y), so anchors must cover the space
    // as evenly as offsets do. Each anchor comes from the least-sampled of 12
    // equal bins over [0, period) (30 degrees at period 360, 15 at 180; ties
    // broken by rng), at a uniform integer position inside it. Every item
    // degree of each issued trial is tallied, not just the anchor. BALD
    // ignores anchors (f depends on offset only), so this is the only thing
    // spreading them.
    var ANCHOR_BIN = P / 12, N_ABIN = Math.ceil(P / ANCHOR_BIN);
    var anchorCounts = new Array(N_ABIN);
    for (var ab = 0; ab < N_ABIN; ab++) anchorCounts[ab] = 0;
    if (state && state.anchorCoverage && Array.isArray(state.anchorCoverage.counts) && state.anchorCoverage.counts.length === N_ABIN) {
      anchorCounts = state.anchorCoverage.counts.slice();
    }
    function stratAnchor() {
      var min = Infinity, i;
      for (i = 0; i < N_ABIN; i++) if (anchorCounts[i] < min) min = anchorCounts[i];
      var ties = [];
      for (i = 0; i < N_ABIN; i++) if (anchorCounts[i] === min) ties.push(i);
      var bin = ties[Math.floor(rng() * ties.length)];
      return wrapP(bin * ANCHOR_BIN + Math.floor(rng() * ANCHOR_BIN), P);
    }
    function countAnchors(degs) {
      for (var i = 0; i < degs.length; i++) anchorCounts[Math.floor(wrapP(degs[i], P) / ANCHOR_BIN) % N_ABIN]++;
    }
    function anchorCoverage() { return { binSize: ANCHOR_BIN, counts: anchorCounts.slice() }; }
    // Offsets in [minSep, period/2] ranked by current posterior SD of f.
    function sdPools() {
      var sd = sdCurve();
      var offs = [];
      for (var d = minSep; d <= HALF; d++) offs.push(d);
      offs.sort(function (a, b) { return sd[b] - sd[a]; });
      return { high: offs.slice(0, TOPK), low: offs.slice(-TOPK) };
    }
    function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
    // Draw an offset: 15% uniform, then `altPool` (if given) up to 50%, else `pool`.
    function drawOffset(pool, altPool) {
      var u = rng();
      if (u < 0.15) return randOffset();          // a couple of random ones
      if (altPool && u < 0.5) return pick(altPool);
      return pick(pool);
    }
    // All pairwise |offsets| among `degs` >= minSep? (Always true while
    // `relaxSep` is set; see select().)
    var relaxSep = false;
    function separated(degs) {
      if (relaxSep) return true;
      for (var i = 0; i < degs.length; i++) {
        for (var j = i + 1; j < degs.length; j++) {
          if (absDiff(degs[i], degs[j], P) < minSep) return false;
        }
      }
      return true;
    }

    // ---- candidate constructors (shared by coverage and adaptive draws) ----
    // Triad: anchor a; b = a + d1, c = a - d2, so the third pair spans d1+d2.
    // A random mirror balances handedness (f is symmetric; the data may not be).
    // Each returns null if 60 tries never satisfy minSep.
    function makeTriad(d1, d2) {
      for (var t = 0; t < 60; t++) {
        var a = stratAnchor();
        var sgn = rng() < 0.5 ? 1 : -1;
        var degs = [a, wrapP(a + sgn * d1, P), wrapP(a - sgn * d2, P)];
        if (separated(degs)) return degs;
        // The d1+d2 wrap can collide. Redraw BOTH offsets: redrawing only d2
        // would keep d1 fixed and skew d2 toward small values. Rejecting the
        // pair keeps a coverage draw uniform over the feasible (d1, d2) region.
        d1 = randOffset(); d2 = randOffset();
      }
      return null;
    }
    function makeQuad(d1, d2) {
      for (var t = 0; t < 60; t++) {
        var a = stratAnchor(), c = stratAnchor();
        var s1 = rng() < 0.5 ? 1 : -1, s2 = rng() < 0.5 ? 1 : -1;
        var degs = [a, wrapP(a + s1 * d1, P), c, wrapP(c + s2 * d2, P)];
        if (separated(degs)) return degs;
      }
      return null;
    }
    function makePair(d1) {
      var a = stratAnchor();
      var sgn = rng() < 0.5 ? 1 : -1;
      return [a, wrapP(a + sgn * d1, P)];
    }

    // ---- BALD mutual information of one candidate over the particles ----
    // score = H[ sum_i wgt_i p(y|theta_i) ] - sum_i wgt_i H[ p(y|theta_i) ]
    function entropy(p) {
      var h = 0;
      for (var y = 0; y < p.length; y++) { if (p[y] > 0) h -= p[y] * Math.log(p[y]); }
      return h;
    }
    function bald(kind, degs) {
      var m = kind === "triad" ? 3 : (kind === "quad" || kind === "reftriad") ? 2 : ratingPoints;
      var pbar = new Float64Array(m);
      var hCond = 0;
      for (var i = 0; i < N; i++) {
        var p;
        if (kind === "triad") {
          var beta = Math.exp(logBeta[i]);
          p = softmax3(
            beta * fP(i, offIdx(degs[1], degs[0])),
            beta * fP(i, offIdx(degs[2], degs[0])),
            beta * fP(i, offIdx(degs[2], degs[1]))
          );
        } else if (kind === "reftriad") {
          // degs = [ref, b, c]; 2-outcome "which comparison is more different from ref"
          var br = Math.exp(logBeta[i]);
          var pB = sigmoid(br * (fP(i, offIdx(degs[2], degs[0])) - fP(i, offIdx(degs[1], degs[0]))));
          p = [pB, 1 - pB];
        } else if (kind === "quad") {
          var b2 = Math.exp(logBeta[i]);
          var p1 = sigmoid(b2 * (fP(i, offIdx(degs[1], degs[0])) - fP(i, offIdx(degs[3], degs[2]))));
          p = [p1, 1 - p1];
        } else {
          p = likertRow(i, offIdx(degs[1], degs[0]));
        }
        var g = wgt[i];
        for (var y = 0; y < m; y++) pbar[y] += g * p[y];
        hCond += g * entropy(p);
      }
      return entropy(pbar) - hCond;
    }

    // ---- the shared next-trial driver ----
    function select(kind, opts2) {
      var force = !!(opts2 && opts2.forceCoverage);
      var isCoverage = force || rng() < epsilon;
      var degs = null, d1, d2;
      if (isCoverage) {
        // Coverage draw (no BALD score, so score = null). On a circle of P
        // degrees three points can't all be more than P/3 apart and four can't
        // be more than P/4 apart (120 and 90 at P = 360; 60 and 45 at P = 180),
        // so a large minSep is unsatisfiable for triads/quads. After 200 failed
        // rounds the separation check is dropped for this one draw instead of
        // looping forever.
        var rounds = 0;
        do {
          if (rounds++ === 200) {
            relaxSep = true;
            warn("minSeparation=" + minSep + " could not be met for a " + kind +
              " trial; drew one without the separation constraint. Use a smaller minSeparation.");
          }
          d1 = randOffset(); d2 = randOffset();
          degs = (kind === "triad" || kind === "reftriad") ? makeTriad(d1, d2)
               : kind === "quad" ? makeQuad(d1, d2)
               : makePair(d1);
        } while (!degs);
        relaxSep = false;
        countAnchors(degs);
        return { degs: degs, isCoverage: true, score: null };
      }
      var pools = sdPools();
      var best = null, bestScore = -Infinity;
      for (var c = 0; c < POOL; c++) {
        d1 = drawOffset(pools.high, null);              // the uncertain offset
        d2 = drawOffset(pools.high, pools.low);         // contrast: well-known (or another uncertain/random)
        var cand = (kind === "triad" || kind === "reftriad") ? makeTriad(d1, d2)
                 : kind === "quad" ? makeQuad(d1, d2)
                 : makePair(d1);
        if (!cand) continue;
        var score = bald(kind, cand);
        if (score > bestScore) { bestScore = score; best = cand; }
      }
      if (!best) { // no candidate met minSep: fall back to a coverage draw
        return select(kind, { forceCoverage: true });
      }
      countAnchors(best);
      return { degs: best, isCoverage: false, score: bestScore };
    }
    function nextTriad(o) { var s = select("triad", o); return { degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }
    function nextRefTriad(o) { var s = select("reftriad", o); return { ref: s.degs[0], comparisons: [s.degs[1], s.degs[2]], degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }
    function nextQuad(o) { var s = select("quad", o); return { pair1: [s.degs[0], s.degs[1]], pair2: [s.degs[2], s.degs[3]], isCoverage: s.isCoverage, score: s.score }; }
    function nextPair(o) { var s = select("pair", o); return { degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }

    /* ---- reliable-variance diagnostic (approximate) ------------------------
     * Split the stored coverage responses into odd/even halves and bin each
     * half's similarity signal (pairObservations) by |offset|, in 13 bins of
     * period/24 degrees (15 at period 360, 7.5 at 180). r = correlation of the
     * two halves across bins; amp^2 = variance of the combined binned means; amp2r = amp^2 * max(r, 0). A rough split-half
     * stand-in for a smoother's reliable-variance objective, good only as a
     * stopping heuristic.
     * ---------------------------------------------------------------------- */
    var RV_BIN = P / 24; // deg per offset bin
    function binMeans(recs) {
      var nBins = Math.ceil((HALF + 1) / RV_BIN);
      var sum = new Float64Array(nBins), n = new Float64Array(nBins);
      recs.forEach(function (rec) {
        pairObservations(rec, ratingPoints).forEach(function (o) {
          var b = Math.min(Math.floor(absDiff(o[1], o[0], P) / RV_BIN), nBins - 1);
          sum[b] += o[2]; n[b] += 1;
        });
      });
      var out = new Array(nBins);
      for (var b = 0; b < nBins; b++) out[b] = n[b] > 0 ? sum[b] / n[b] : null;
      return out;
    }
    function pearson(xs, ys) {
      var n = xs.length;
      if (n < 3) return 0;
      var mx = 0, my = 0, i;
      for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
      mx /= n; my /= n;
      var sxy = 0, sxx = 0, syy = 0;
      for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my); }
      return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
    }
    function reliableVariance() {
      var cov = history.filter(function (h) { return h.isCoverage && usableRecord(h, ratingPoints); });
      if (cov.length === 0) return { amp2r: 0, r: 0, nCoverage: 0 };
      var hA = cov.filter(function (h, i) { return i % 2 === 0; });
      var hB = cov.filter(function (h, i) { return i % 2 === 1; });
      var mA = binMeans(hA), mB = binMeans(hB), mAll = binMeans(cov);
      var xs = [], ys = [], all = [];
      for (var b = 0; b < mAll.length; b++) {
        if (mA[b] != null && mB[b] != null) { xs.push(mA[b]); ys.push(mB[b]); }
        if (mAll[b] != null) all.push(mAll[b]);
      }
      var r = pearson(xs, ys);
      // amp^2: variance of the binned combined means (the structure's spread)
      var amp2 = 0;
      if (all.length > 1) {
        var m = all.reduce(function (a, v) { return a + v; }, 0) / all.length;
        amp2 = all.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (all.length - 1);
      }
      return { amp2r: amp2 * Math.max(r, 0), r: r, nCoverage: cov.length };
    }

    /* ---- JSON-able snapshot for saving with the data ----
       * Default: posterior summaries (means and f curves, not the particles) + history.
       * exportState({particles: true}) adds `particles` ({w: [N][K], logBeta, c0, logDc,
       * weights}, each of length N) and `rngState` (the state of a BradySimilarity.seededRng,
       * else null). That full snapshot is what restoreEngine(state) continues from. */
    function exportState(o) {
      var pm = posteriorMean();
      var nInvalid = history.filter(function (h) { return h.invalid; }).length;
      var out = {
        version: 1,
        period: P, // the stimulus space; degrees in history are in [0, period)
        kappas: kappas.slice(),
        nParticles: N,
        epsilon: epsilon,
        ratingPoints: ratingPoints,
        minSeparation: minSep,
        nResponses: history.length - nInvalid, // responses the posterior used
        nInvalid: nInvalid,                     // out-of-range records kept in history
        posterior: pm,
        fHat: Array.from(meanCurve()),
        fSD: Array.from(sdCurve()),
        reliableVariance: reliableVariance(),
        anchorCoverage: anchorCoverage(),
        // full trial-by-trial record with exact degrees, enough for an offline
        // refit including a per-target g_x fit
        history: history.slice(),
      };
      if (o && o.particles) {
        var pw = [], i, k;
        for (i = 0; i < N; i++) { var row = []; for (k = 0; k < K; k++) row.push(W[i * K + k]); pw.push(row); }
        out.particles = { w: pw, logBeta: Array.from(logBeta), c0: Array.from(c0), logDc: Array.from(logDc), weights: Array.from(wgt) };
        // A seeded rng can be resumed from its state; Math.random (or a custom rng) cannot,
        // so rngState is null then and a restored engine draws different trials.
        out.rngState = typeof rng.getState === "function" ? rng.getState() : null;
        out.history = JSON.parse(JSON.stringify(history));
      }
      return out;
    }

    /* A shuffled copy of `arr` (Fisher-Yates), drawn from the engine's rng. */
    function shuffle(arr) {
      var out = arr.slice();
      for (var i = out.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    }

    return {
      period: P,
      rng: rng,
      shuffle: shuffle,
      kappas: kappas,
      nParticles: N,
      epsilon: epsilon,
      ratingPoints: ratingPoints,
      minSeparation: minSep,
      history: history,
      update: update,
      fHat: fHat,
      fSD: fSD,
      posteriorMean: posteriorMean,
      posteriorSD: posteriorSD,
      anchorCoverage: anchorCoverage,
      nextTriad: nextTriad,
      nextRefTriad: nextRefTriad,
      nextQuad: nextQuad,
      nextPair: nextPair,
      reliableVariance: reliableVariance,
      exportState: exportState,
    };
  }

  /* Rebuild an engine from exportState({particles: true}) so a session can continue (after
     a page reload, or in a second session). opts may add an `rng`; without one, a snapshot
     of a seededRng engine resumes that rng from its saved state, so the restored engine
     hands out exactly the trials the original would have. A snapshot of a Math.random (or
     custom-rng) engine has rngState null: pass an rng; the restored engine continues the
     posterior, but not the same random draws. */
  function restoreEngine(state, opts) {
    return createEngine(Object.assign({}, opts || {}, { state: state }));
  }

  global.BradySimilarity = {
    version: "1.1.0",
    DEFAULT_KAPPAS: DEFAULT_KAPPAS.slice(),
    DEFAULT_PERIOD: DEFAULT_PERIOD,
    seededRng: seededRng,
    fOf: fOf,
    fCurve: fCurve,
    triadProbs: triadProbs,
    refTriadProb: refTriadProb,
    quadProb: quadProb,
    likertProbs: likertProbs,
    loadGroupPrior: loadGroupPrior,
    empiricalMatrix: empiricalMatrix,
    createEngine: createEngine,
    restoreEngine: restoreEngine,
  };
})(typeof window !== "undefined" ? window : this);


/* ===================================================================== */
/* jspsych-change-detection.js */
/* ===================================================================== */
/*
 * jspsych-change-detection.js  --  jsPsych v8 plugin
 *
 * Working-memory change detection. Shows a memory array, a blank delay, then
 * re-shows one item (the probe) at its studied location. The participant
 * reports whether the probe is the same as before or different.
 *
 * Items can be colors, color-wheel degrees, images, or words, mixed freely
 * (see `stimuli` and `item_type`).
 *
 * Trial sequence: fixation -> [precue] -> delay_start -> array (display_time,
 * or one item at a time if `sequential`) -> [mask] -> blank delay_time ->
 * [retrocue] -> probe + response -> [feedback].
 *
 * Key options:
 *   response_mode  -- "binary" | "confidence6" | "two_stage"
 *   response_ui    -- "both" (default) | "keyboard" | "buttons" | "radio"
 *   precue_time    -- > 0 rings the to-be-probed location before the array
 *   noise_level / noise_type -- > 0 degrades every item at encoding (default
 *                     kind "speckle", chromatic patches); the probe is never noisy
 *   mask_time / mask_type    -- > 0 masks the occupied locations at array offset, before the delay
 *                     (default kind "color-squares")
 *   retrocue_time  -- > 0 rings the to-be-probed location after the delay
 *
 * Noise and mask kinds live in BradyUtils.noiseKinds / BradyUtils.maskKinds.
 * Add kinds with BradyUtils.registerNoise/registerMask, or pass a function as
 * noise_type/mask_type.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychChangeDetection = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "change-detection",
    version: version,
    parameters: {
      /**
       * The memory-array items. Each entry may be a number (degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)"
       * string, an image path ("dog.png", "img/x.jpg"), or a word ("cat").
       * If empty, `set_size` random wheel colors (>= `min_color_distance`
       * deg apart) are generated.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Item shape: "disk" (default) or "square", a filled square the size of the disk (the
       *  Luck & Vogel style display). The placeholders, cue rings and noise/mask overlays take
       *  the same shape. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Number of items to auto-generate when `stimuli` is empty. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated wheel colors. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 25 },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally-spaced locations items can occupy (around a circle). */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the item probed at test. Out-of-range values are clamped. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /**
       * Whether the probe is a changed item. Ignored if `test_stimulus` is given.
       * Color items are changed by `change_amount`; images and words cannot be
       * changed automatically (the probe stays identical and was_same is true), so
       * supply `test_stimulus` for those.
       */
      is_change: { type: jspsych.ParameterType.BOOL, default: false },
      /** Size of an automatic color change (deg). Wheel-degree items move this far
          around the wheel; CSS/lab color items are hue-rotated this far in CIELAB a*b*. */
      change_amount: { type: jspsych.ParameterType.INT, default: 60 },
      /** Explicit probe (degree / color / image / word). Overrides is_change; was_same is
          then computed by comparing the resolved probe to the studied item. */
      test_stimulus: { type: jspsych.ParameterType.OBJECT, default: null },
      /** How long (ms) the memory array is shown. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms). It starts when the array is cleared, or when the mask
          comes off if there is one, and always runs in full; any retro-cue comes after it.
          Probe onset = array offset + mask_time + delay_time + retrocue_time. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, ring the to-be-probed location (`cue_color`/`cue_thickness`) for this
          long before the array; delay_start then runs as usual. 0 = off. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, ring the to-be-probed location for this long after the delay,
          before the probe appears. The ring stays on through the response. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}).
          The default "color-squares" is a field of random-colored squares. */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
          the `noise_type` degradation, drawn on a transparent overlay over the item
          (the default speckle gives integrated chromatic patches). Applies to every
          item kind (it occludes images and words); the probe is always noise-free. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start (click or trial onset) to array onset; with a precue, from
          the end of the precue. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** "binary" (same/different), "confidence6" (one 1-6 scale, 1 = sure same,
          6 = sure different), or "two_stage" (same/different, then 1-6 confidence,
          1 = guessing, 6 = sure). */
      response_mode: { type: jspsych.ParameterType.STRING, default: "binary" },
      /**
       * How responses are collected: "both" (clickable buttons AND keyboard, the
       * default), "buttons" (mouse only), "keyboard" (keys only), or "radio"
       * (radio buttons + a Submit button). The 1-6 scales use keys 1-6. An
       * unrecognized value falls back to "both".
       */
      response_ui: { type: jspsych.ParameterType.STRING, default: "both" },
      /** Keyboard keys for the same / different responses (binary and two_stage stage 1). */
      same_key: { type: jspsych.ParameterType.STRING, default: "s" },
      different_key: { type: jspsych.ParameterType.STRING, default: "d" },
      /** Button/label text for the binary same / different responses. */
      same_button_text: { type: jspsych.ParameterType.STRING, default: "Same" },
      different_button_text: { type: jspsych.ParameterType.STRING, default: "Different" },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Briefly highlight whether the response was correct after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the whole-trial mouse trajectory (cursor path to the response). Only meaningful with a clickable UI ("both", "buttons", "radio"). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between mouse samples during encoding/delay (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between mouse samples once the probe/response appears (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from probe onset to the final response (the confidence rating in two_stage). The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from probe onset to the same/different decision (== rt in binary and confidence6). The literature's "response initiation time". */
      rt_same_diff: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the confidence prompt appearing to the confidence response (two_stage only; else null). Timed from the prompt rather than the decision so that a keyboard decision's hold, which delays the prompt until the key is released, is not counted as confidence deliberation. */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the click that made the same/different decision (the response rt_same_diff times; in confidence6 that is the rating click). "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable or the decision was a keypress. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the same/different decision key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred) or the decision was a click. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** two_stage only: how long (ms) the mouse button was held for the confidence-rating click, a separate response from the decision. null if the rating was a keypress, or outside two_stage. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** two_stage only: how long (ms) the confidence-rating key was held down. null if the rating was a click, or outside two_stage. Named like confidence_mouse_hold_duration. */
      confidence_key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Deprecated alias of confidence_key_hold_duration (always the same value), kept so existing analysis code keeps working. Use confidence_key_hold_duration. */
      key_hold_duration_confidence: { type: jspsych.ParameterType.INT },
      /** Every key pressed from probe onset until the same/different decision is complete: {key, t (ms from probe onset), duration}. The two_stage confidence key is not included. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). null when the keyboard is not in use (response_ui "buttons"/"radio"). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded decision key was also pressed in that window (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** 1 if the participant judged "same", 0 if "different". In confidence6, ratings 1-3 count as "same" and 4-6 as "different". */
      said_same: { type: jspsych.ParameterType.INT },
      /** Confidence rating 1-6. In confidence6 it is the direction scale (1 = sure same ...
          6 = sure different). In two_stage it is the magnitude scale (1 = guessing ... 6 = sure)
          and the direction is in said_same. null in binary. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Whether the probe matched the studied item. Colors are compared by resolved RGB (BradyUtils.sameColor), so a wheel degree and the same color written as an rgb()/#hex/lab() string count as the same; images by src, text by string. */
      was_same: { type: jspsych.ParameterType.BOOL },
      /** Whether the same/different judgment was correct. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The studied item specs (degrees/colors/images/words), as given or generated. */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Item shape used ("disk" or "square"). */
      item_shape: { type: jspsych.ParameterType.STRING },
      /** The probe spec. */
      test_stimulus: { type: jspsych.ParameterType.STRING },
      /** Index of the probed item (after clamping into range). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Measured time (ms) from array onset until the array was cleared. In sequential mode it spans the whole sequence, including the gap after the last item. */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Response collection mode used ("binary", "confidence6", or "two_stage"). */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** Response UI used ("both", "buttons", "keyboard", or "radio"). */
      response_ui: { type: jspsych.ParameterType.STRING },
      /** Number of items in the memory array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Full study display: per item {position, value, and color/src/text}. */
      study_stimuli: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Same content as study_stimuli, under the field name every plugin uses (see CONVENTIONS.md). */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Test display: a one-element array holding the probe {position, value, and color/src/text}. */
      test_stimuli: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index of the probed item (== which_test), whether or not it changed. */
      changed_index: { type: jspsych.ParameterType.INT },
      /** Placeholder index of the probed item. */
      changed_position: { type: jspsych.ParameterType.INT },
      /** Studied value (spec) of the probed item. */
      change_old_value: { type: jspsych.ParameterType.STRING },
      /** Value (spec) shown at the probed location at test (== test_stimulus). */
      change_new_value: { type: jspsych.ParameterType.STRING },
      /** Whether the probe differed from the studied item (== !was_same). */
      did_change: { type: jspsych.ParameterType.BOOL },
      /** The correct same/different answer ("same" or "different"). */
      correct_response: { type: jspsych.ParameterType.STRING },
      /** Mouse-trajectory samples (only when record_mouse): rows of [t, x, y, value], value = index of the nearest response button during the response (null before it, and during two_stage stage 2). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory row (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first response-phase mouse sample (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before any pre-cue and delay_start; array: the memory array's onset; mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset; report: the probe and the response options appear (any retro-cue falls between delay and report); confidence: two_stage only, the rating options replace the same/different options. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Auto-zoom scale of the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout in the mouse-trajectory frame (only when record_mouse): the same/different (or 1-6) buttons' or radio labels' boxes and target_option (the correct same/different option; none for the 1-6 scale). null when no clickable options were shown (response_ui "keyboard"). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** two_stage only: the stage-2 rating buttons' (or radio labels') boxes, in the same frame as mouse_geometry, captured when they appear (the stage-1 options are gone by then). null otherwise. */
      confidence_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class ChangeDetectionPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      // ---- Resolve memory items (degree / color / image / word) ----
      let specs = trial.stimuli.slice();
      if (specs.length === 0) specs = U.randomColorDegrees(trial.set_size, trial.min_color_distance);
      const setSize = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));

      // Warn (only) about stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "change-detection", setSize: setSize, supportsEnsemble: false, values: specs });
      // noise_level's 0..1 range and unknown noise_type/mask_type names are checked by checkParams itself.
      U.checkParams(trial, { plugin: "change-detection", setSize: setSize,
        enums: { response_mode: ["binary", "confidence6", "two_stage"], response_ui: ["both", "keyboard", "buttons", "radio"], item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "square"] } });
      // "square" items: square placeholders (no border-radius), so the cue ring (box-shadow)
      // and the noise/mask overlays (which copy the placeholder's border-radius) are square too.
      const phRadius = trial.item_shape === "square" ? "0" : "50%";
      // Apply the fallback checkParams' warning describes: an unrecognized response_ui would
      // render no buttons and arm no keys, so the trial would never end.
      // Kept in a local (as are the clamps below): trial is jsPsych's stored copy of the
      // parameters (save_trial_parameters reads it), so it is never modified.
      const responseUi = ["both", "keyboard", "buttons", "radio"].indexOf(trial.response_ui) === -1 ? "both" : trial.response_ui;
      if (trial.record_mouse && responseUi === "keyboard") {
        U.noteOnce("change-detection", "record_mouse-keyboard", 'record_mouse with response_ui "keyboard": there are no ' +
          "clickable options, so mouse_trajectory has no response phase and mouse_geometry is null.");
      }

      // Clamp degenerate configs. There must be >= setSize placeholders (and one for every
      // explicit slot), or sampleWithoutReplacement throws / an item has no canvas; which_test
      // must index a real item. The clamped which_test is the one recorded.
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots).
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "change-detection" });

      // ---- Resolve the probe ----
      const studied = items[whichTest];
      let probeSpec;
      if (trial.test_stimulus !== null) {
        probeSpec = trial.test_stimulus;
      } else if (!trial.is_change) {
        probeSpec = specs[whichTest];
      } else if (studied.kind === "color") {
        probeSpec =
          typeof specs[whichTest] === "number"
            ? U.wrap360(specs[whichTest] + trial.change_amount)
            : U.rgbToCss(U.rotateHueLab(U.cssToRgb(studied.css), trial.change_amount));
      } else {
        // Images and words can't be changed automatically: the probe stays identical.
        probeSpec = specs[whichTest];
        U.warnOnce("change-detection", "is_change:true has no effect on " + studied.kind + " items; " +
          "pass test_stimulus to show a changed probe. This trial's probe is unchanged (was_same = true).");
      }
      const probe = U.resolveItem(probeSpec, wheel, forceType);
      const wasSame = sameItem(probe, studied);

      // ---- Preload any images, then build and run the trial ----
      // trial() stays synchronous so jsPsych waits for finishTrial(); an async trial()
      // would end as soon as this method returned.
      U.loadImages(
        items.concat([probe]).filter((it) => it.kind === "image").map((it) => it.src)
      ).then((imgCache) => {

      // ---- Item locations (chosen above by resolvePositions) ----
      const pos = placed.pos;

      // ---- Layout ----
      const boxSize = 2 * trial.radius + 2 * trial.item_size + 40;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // One tall box: the placeholder ring fills the square stage at the top, and the
      // message, response controls and prompt sit in the panel below it, inside the same
      // box, so they share its background and never overlap the bottom item. The panel
      // rows reserve their height so the box doesn't grow when the response appears.
      let stageHTML = "";
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        stageHTML +=
          `<canvas id="cd-item-${i}" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;border-radius:${phRadius};border:1px solid #222;` +
          `top:${top}px;left:${left}px"></canvas>`;
      }
      stageHTML += `<span id="cd-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>`;
      const panelHTML =
        `<div id="cd-message" style="min-height:1.4em">${startText}</div>` +
        `<div id="cd-response" style="margin-top:6px;min-height:1.6em"></div>` +
        (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
      display_element.innerHTML = U.stageBox(
        { idPrefix: "cd", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#cd-box"));

      // ---- State ----
      let probeOnset = null;
      let saidSame = null;
      let confidence = null;
      // Time (performance.now) and RT (ms from probe onset) of the same/different
      // decision, stamped when it is made, so two_stage keeps the decision RT apart
      // from the final (confidence) RT.
      let sameDiffTime = null;
      let rtSameDiff = null;
      // Hold durations of the decision response (RD); whichever modality answered sets
      // its field. The two_stage confidence response has its own pair below.
      let holdMouse = null;
      let holdKey = null;
      let holdKeyName = null;
      let holdConfMouse = null;
      let holdConfKey = null;
      // The press log closes when the decision is complete, not at the end of the trial.
      // Otherwise the two_stage confidence keypress would land in it and set
      // multiple_keys_pressed on every keyboard trial, so the standard exclusion
      // criterion would discard all of them.
      let confStageOnset = null; // when the two_stage confidence prompt appeared
      let decisionPressLog = null;
      let decisionLogClosed = false;
      const closeDecisionLog = () => {
        if (decisionLogClosed) return;      // one-shot; safe to call from every path
        decisionLogClosed = true;
        decisionPressLog = wantKeys ? U.endPressLog() : null;
      };
      let arrayOnset = null; // performance.now() at array onset (first item painted)
      let actualStim = null; // measured array on-screen time (ms)
      let mt = null;         // optional mouse-trajectory recorder (record_mouse)
      let optEls = [];       // clickable response buttons + identity/correctness, for mouse geometry
      let mouseGeom = null;  // geometry captured when the response options appear (two_stage replaces them later)
      let confGeom = null;   // two_stage only: the stage-2 rating options, in the same frame

      // ---- Phases -------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#cd-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.record_mouse) {
          mt = U.makeMouseTracker(display_element.querySelector("#cd-stage"), performance.now(),
            { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter(); // click_to_start click is on the centred fixation
          mt.mark("encoding");
        }
        if (trial.precue_time > 0) {
          // Precue: ring only the to-be-probed location for precue_time ms, clear it,
          // then the usual delay_start -> array.
          const clearCue = U.spatialCue(itemEl(pos[whichTest]),
            { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      const showArray = () => {
        arrayOnset = performance.now();
        if (mt) mt.mark("array");
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => paintItem(pos[i], items[i]),
          clear: (i) => clearItem(pos[i]),
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        actualStim = Math.round(performance.now() - arrayOnset);
        for (let i = 0; i < setSize; i++) clearItem(pos[i]);
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          if (mt) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(beforeProbe, trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Each mask is an overlay canvas on its placeholder, clipped to the disk by the
        // placeholder's border-radius. mask_time = 0 skips it.
        if (trial.mask_time > 0) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, { wheel: wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue after the delay: ring only the to-be-probed
      // location for retrocue_time ms before the probe. 0 goes straight to the probe.
      const beforeProbe = () => {
        if (trial.retrocue_time > 0) {
          // Not cleared: the probe appears at this location, and the response message
          // asks about "the highlighted item".
          U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(showProbe, trial.retrocue_time);
        } else {
          showProbe();
        }
      };

      const showProbe = () => {
        paintItem(pos[whichTest], probe, 0); // probe drawn noise-free
        display_element.querySelector(`#cd-item-${pos[whichTest]}`).style.borderColor = "#000";
        probeOnset = performance.now();
        // Log every key pressed from probe onset, so trials with extra keypresses can be
        // excluded (see key_presses in info.data).
        if (wantKeys) U.beginPressLog(probeOnset);
        buildResponseUI();
      };

      // ---- Response UI --------------------------------------------------------
      const buildResponseUI = () => {
        if (trial.response_mode === "confidence6") collectScale6();
        // two_stage: same/different, then a confidence magnitude rating
        // (1 = guessing .. 6 = sure) that leaves said_same unchanged.
        else if (trial.response_mode === "two_stage") collectBinary(collectConfidenceMagnitude);
        else collectBinary(finish);
      };

      // Response UIs: "both" = clickable buttons AND keyboard; "buttons" = mouse
      // only; "keyboard" = keys only; "radio" = radio buttons + Submit.
      const wantKeys = responseUi === "both" || responseUi === "keyboard";
      const wantButtons = responseUi === "both" || responseUi === "buttons" || responseUi === "radio";
      const cancelKb = () => { if (this._kb) { jsPsych.pluginAPI.cancelKeyboardResponse(this._kb); this._kb = null; } };
      // Open the mouse response window: switch to the response sample rate and record, per
      // sample, which response option the cursor is nearest (index into optEls / mouse_geometry).
      const beginMouseResponse = () => {
        if (!mt) return;
        mt.mark("report");
        mt.setValueFn(U.nearestChoiceFn(optEls.map((c) => c.el)));
        // Capture geometry now, while these options exist: two_stage replaces them with
        // the rating options before finish() runs.
        mouseGeom = U.discreteChoiceGeometry(display_element.querySelector("#cd-stage"), optEls);
      };
      // two_stage stage 2: the stage-1 options were just replaced, but the tracker's value
      // function still points at those detached nodes and would record a meaningless index.
      // Record null from here on and capture the rating options' own geometry.
      const beginConfidenceMouse = (choices) => {
        if (!mt) return;
        mt.setValueFn(null);
        mt.mark("confidence");
        confGeom = U.discreteChoiceGeometry(display_element.querySelector("#cd-stage"), choices);
      };

      const collectBinary = (done) => {
        // One-shot: in response_ui "both" a key and an already-queued click can both fire
        // (cancelKb can't unqueue a dispatched click), which would finish the trial twice.
        let answered = false;
        // `at` is the response time. A keypress is delivered after the key comes back up
        // but timed from its keydown. closeDecisionLog() runs here because the decision is
        // complete (for a key, after its release), so a later stage-2 press stays out of
        // the multi-key exclusion window.
        const commit = (same, at) => { cancelKb(); closeDecisionLog(); sameDiffTime = at; rtSameDiff = Math.round(sameDiffTime - probeOnset); saidSame = same; done(at); };
        const respond = (same, hold) => { if (answered) return; answered = true; holdMouse = hold == null ? null : hold; commit(same, performance.now()); };
        // Keydown handler: claim the response and time it now (so a queued click can't
        // also win), but wait for the release before moving on (CONVENTIONS §11).
        const respondKey = (i) => {
          if (answered) return;
          answered = true;
          const at = performance.now();
          const same = jsPsych.pluginAPI.compareKeys(i.key, trial.same_key) ? 1 : 0;
          U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => { holdKey = hold; holdKeyName = i.key; commit(same, at); }));
        };
        let msg = "Was the highlighted item the same or different?";
        if (wantKeys) msg += ` &nbsp; (${trial.same_key.toUpperCase()} = ${trial.same_button_text}, ` +
                             `${trial.different_key.toUpperCase()} = ${trial.different_button_text})`;
        setMsg(msg);
        if (responseUi === "radio") {
          // Radios + Submit, like the 1-6 scale's radio UI; mouse geometry and the
          // response-phase mark work the same as with buttons.
          setResponseHTML(
            `<label style="margin:0 8px"><input type="radio" name="cd-sd" value="1"> ${trial.same_button_text}</label>` +
            `<label style="margin:0 8px"><input type="radio" name="cd-sd" value="0"> ${trial.different_button_text}</label>` +
            `<br><button class="jspsych-btn" id="cd-submit" style="margin-top:6px">Submit</button>`
          );
          const labs = display_element.querySelectorAll("#cd-response label");
          optEls = [{ el: labs[0], value: "same", correct: wasSame }, { el: labs[1], value: "different", correct: !wasSame }];
          beginMouseResponse();
          display_element.querySelector("#cd-submit").addEventListener("click", (e) => {
            // Read the hold first: a Submit click with nothing selected is ignored, but
            // must still consume its press so the next click can't claim a stale one.
            const hold = U.mouseHoldDuration();
            const sel = display_element.querySelector("input[name=cd-sd]:checked");
            if (sel) { if (mt) mt.sample(e); respond(+sel.value, hold); }
          });
          return;
        }
        if (wantButtons) {
          setResponseHTML(
            `<button class="jspsych-btn" id="cd-same">${trial.same_button_text}</button> ` +
            `<button class="jspsych-btn" id="cd-diff">${trial.different_button_text}</button>`
          );
          const sameBtn = display_element.querySelector("#cd-same");
          const diffBtn = display_element.querySelector("#cd-diff");
          // A click fires only after the button is released, so the hold is already
          // known here; read it first so every click consumes exactly one press.
          sameBtn.addEventListener("click", (e) => { const hold = U.mouseHoldDuration(); if (mt) mt.sample(e); respond(1, hold); });
          diffBtn.addEventListener("click", (e) => { const hold = U.mouseHoldDuration(); if (mt) mt.sample(e); respond(0, hold); });
          // Mark the button that matches the truth as the correct option.
          optEls = [{ el: sameBtn, value: "same", correct: wasSame }, { el: diffBtn, value: "different", correct: !wasSame }];
          beginMouseResponse();
        } else {
          clearResponse();
        }
        if (wantKeys) {
          this._kb = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: respondKey,
            valid_responses: [trial.same_key, trial.different_key],
            rt_method: "performance",
            persist: false,
          });
        }
      };

      // 1-6 scale collector -> handler(v, at, holds). Honors response_ui; buttons and
      // keys 1-6 can be live together.
      const collectScale = (labels, msg, handler) => {
        // One-shot guard, as in collectBinary. The handler gets the response time and the
        // hold durations, so a keypress is timed at keydown but delivered at keyup.
        let answered = false;
        const respond = (v, hold) => {
          if (answered) return;
          answered = true;
          cancelKb();
          handler(v, performance.now(), { mouse: hold == null ? null : hold, key: null, keyName: null });
        };
        const respondKey = (i) => {
          if (answered) return;
          answered = true;
          cancelKb();
          const at = performance.now();
          const v = parseInt(i.key, 10);
          U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => handler(v, at, { mouse: null, key: hold, keyName: i.key })));
        };
        if (responseUi === "radio") {
          setMsg(msg);
          const radios = labels
            .map((l, k) => `<label style="display:inline-block;vertical-align:top;margin:0 6px;text-align:center">` +
                           `<input type="radio" name="cd-conf" value="${k + 1}"><br>${l}</label>`)
            .join("");
          setResponseHTML(radios + `<br><button class="jspsych-btn" id="cd-submit" style="margin-top:6px">Submit</button>`);
          // Mouse geometry as in the button path: the scale's own when it is the response
          // (confidence6), otherwise (two_stage stage 2) the separate confidence geometry.
          const rlabs = Array.prototype.map.call(display_element.querySelectorAll("#cd-response label"),
            (el, k) => ({ el: el, value: k + 1, correct: false }));
          if (mt && !optEls.length) {
            optEls = rlabs;
            beginMouseResponse();
          } else {
            beginConfidenceMouse(rlabs);
          }
          display_element.querySelector("#cd-submit").addEventListener("click", (e) => {
            // Read the hold first so an ignored (nothing-selected) Submit click still
            // consumes its own press.
            const hold = U.mouseHoldDuration();
            const sel = display_element.querySelector("input[name=cd-conf]:checked");
            if (sel) { if (mt) mt.sample(e); respond(parseInt(sel.value, 10), hold); }
          });
          return;
        }
        setMsg(msg + (wantKeys ? " &nbsp;(or press 1-6)" : ""));
        if (wantButtons) {
          setResponseHTML(labels.map((l, k) => `<button class="jspsych-btn" data-v="${k + 1}" style="vertical-align:top">${l}</button>`).join(" "));
          const btns = display_element.querySelectorAll("#cd-response button");
          btns.forEach((b) =>
            b.addEventListener("click", (e) => { const hold = U.mouseHoldDuration(); if (mt) mt.sample(e); respond(parseInt(b.dataset.v, 10), hold); })
          );
          // When the scale is the response (confidence6), its buttons are the mouse
          // geometry (no single correct button; the direction toward 1 vs 6 is the
          // measure). In two_stage stage 2 the same/different options were already
          // recorded, so the rating buttons get their own geometry.
          const choices = Array.prototype.map.call(btns, (b) => ({ el: b, value: parseInt(b.dataset.v, 10), correct: false }));
          if (mt && !optEls.length) {
            optEls = choices;
            beginMouseResponse();
          } else {
            beginConfidenceMouse(choices);
          }
        } else {
          clearResponse();
        }
        if (wantKeys) {
          this._kb = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: respondKey,
            valid_responses: ["1", "2", "3", "4", "5", "6"],
            rt_method: "performance",
            persist: false,
          });
        }
      };

      // confidence6: one direction scale (1 = sure same .. 6 = sure different);
      // said_same = 1 for ratings 1-3, 0 for 4-6.
      const collectScale6 = () =>
        collectScale(
          ["1<br>sure same", "2", "3", "4", "5", "6<br>sure diff"],
          "Rate 1 (sure SAME) to 6 (sure DIFFERENT)",
          // The rating is the decision, so its hold is the RD and the press log ends here.
          (v, at, holds) => {
            confidence = v; saidSame = v <= 3 ? 1 : 0;
            holdMouse = holds.mouse; holdKey = holds.key; holdKeyName = holds.keyName;
            closeDecisionLog();
            sameDiffTime = at; rtSameDiff = Math.round(sameDiffTime - probeOnset); finish(at);
          }
        );

      // two_stage stage 2: confidence magnitude (1 = guessing .. 6 = sure); said_same from
      // stage 1 is kept. For a keyboard decision this runs at the decision key's keyup
      // (commit runs from awaitKeyUp.then), and rt_confidence is timed from here. Timing it
      // from the decision's keydown would add the decision's hold to it, coupling
      // rt_confidence to key_hold_duration and making keyboard and button trials
      // incomparable. noise-dots and wm-forced-choice time it from their prompts too.
      const collectConfidenceMagnitude = () => {
        confStageOnset = performance.now();
        collectScale(
          ["1<br>guessing", "2", "3", "4", "5", "6<br>sure"],
          "How sure are you? 1 (totally guessing) to 6 (totally sure)",
          // The decision's holds were recorded in stage 1; the rating records its own.
          (v, at, holds) => {
            confidence = v;
            holdConfMouse = holds.mouse; holdConfKey = holds.key;
            finish(at);
          }
        );
      };

      // ---- Finish -------------------------------------------------------------
      // `at` is the final response's time (a keypress finishes at keyup but is timed
      // from its keydown).
      const finish = (at) => {
        const finishTime = at == null ? performance.now() : at;
        const rt = Math.round(finishTime - probeOnset);
        closeDecisionLog(); // no-op if the decision already closed it
        const pressLog = decisionPressLog;
        // Every response path sets rtSameDiff before calling finish; this is a fallback.
        if (rtSameDiff == null) rtSameDiff = rt;
        // rt_confidence: from the two_stage confidence prompt to the rating (see
        // collectConfidenceMagnitude); null in binary and confidence6.
        const rtConfidence =
          trial.response_mode === "two_stage" && confStageOnset != null
            ? Math.round(finishTime - confStageOnset)
            : null;
        cancelKb();
        const correct = saidSame === (wasSame ? 1 : 0);
        let mouseData = null;
        if (trial.record_mouse && mt) {
          mt.detach();
          mouseData = Object.assign(U.mouseTrackerData(mt), { mouse_geometry: mouseGeom, confidence_geometry: confGeom });
        }
        const done = () => {
          // The full study display, the test display (the one re-shown probe), and the
          // probed item's old -> new value, for swap/interference analyses.
          const study_stimuli = specs.map((s, i) => {
            const it = items[i];
            const entry = { position: pos[i], value: s };
            if (it.kind === "image") entry.src = it.src;
            else if (it.kind === "text") entry.text = it.text;
            else entry.color = it.css;
            return entry;
          });
          const probeEntry = { position: pos[whichTest], value: probeSpec };
          if (probe.kind === "image") probeEntry.src = probe.src;
          else if (probe.kind === "text") probeEntry.text = probe.text;
          else probeEntry.color = probe.css;
          const test_stimuli = [probeEntry]; // only the probed location is re-shown at test
          const data = {
            rt: rt,
            rt_same_diff: rtSameDiff,
            rt_confidence: rtConfidence,
            mouse_hold_duration: holdMouse,
            confidence_mouse_hold_duration: holdConfMouse,
            confidence_key_hold_duration: holdConfKey,
            key_hold_duration_confidence: holdConfKey, // deprecated alias of confidence_key_hold_duration
            ...U.keyHoldData(holdKey, holdKeyName, pressLog),
            said_same: saidSame,
            confidence: confidence,
            was_same: wasSame,
            correct: correct,
            response_mode: trial.response_mode,
            item_shape: trial.item_shape === "square" ? "square" : "disk",
            response_ui: responseUi,
            positions: pos,
            stimuli: specs,
            test_stimulus: probeSpec,
            which_test: whichTest,
            set_size: setSize,
            study_stimuli: study_stimuli,
            stimuli_shown: study_stimuli, // cross-plugin name (CONVENTIONS.md)
            test_stimuli: test_stimuli,
            changed_index: whichTest,
            changed_position: pos[whichTest],
            change_old_value: specs[whichTest],
            change_new_value: probeSpec,
            did_change: !wasSame,
            correct_response: wasSame ? "same" : "different",
            actual_stim_duration: actualStim,
          };
          if (mouseData) Object.assign(data, mouseData);
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
          finishOnce(data);
        };
        if (trial.feedback) {
          const el = display_element.querySelector(`#cd-item-${pos[whichTest]}`);
          el.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
          setMsg(correct ? "Correct!" : "Incorrect");
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          clearResponse();
          jsPsych.pluginAPI.setTimeout(done, 800);
        } else {
          done();
        }
      };

      // ---- DOM/paint helpers --------------------------------------------------
      const itemEl = (p) => display_element.querySelector(`#cd-item-${p}`);
      const itemCtx = (p) => itemEl(p).getContext("2d");
      // Live stimulus-noise overlays, keyed by placeholder index (removed on clear/probe).
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      // `noise` defaults to trial.noise_level; the probe passes 0 so the comparison
      // itself isn't degraded.
      const paintItem = (p, item, noise) => {
        const ctx = itemCtx(p);
        const s = trial.item_size;
        ctx.clearRect(0, 0, s, s);
        if (item.kind === "image" && imgCache[item.src] && imgCache[item.src].naturalWidth > 0) {
          ctx.drawImage(imgCache[item.src], 0, 0, s, s);
        } else if (item.kind === "image") {
          // Image whose preload failed: paint neutral gray. The color branch would read
          // an undefined css and draw a black disk.
          ctx.fillStyle = "#cccccc";
          ctx.fillRect(0, 0, s, s);
        } else if (item.kind === "text") {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, s, s);
          ctx.fillStyle = "#000";
          ctx.font = `${Math.max(10, Math.round(s / 4))}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.text, s / 2, s / 2);
        } else {
          ctx.fillStyle = U.rgbToCss(U.cssToRgb(item.css));
          ctx.fillRect(0, 0, s, s);
        }
        // Stimulus noise: the noise_type kind on a transparent overlay canvas over the
        // placeholder (clipped to the disk by its border-radius), for every item kind.
        // Kinds that sample colors (e.g. "speckle") use this trial's color_wheel.
        clearNoise(p);
        const lvl = noise == null ? trial.noise_level : noise;
        if (lvl > 0) noiseRemovers[p] = U.noiseOverlay(itemEl(p), lvl, trial.noise_type, { wheel: wheel });
      };
      const clearItem = (p) => { clearNoise(p); itemCtx(p).clearRect(0, 0, trial.item_size, trial.item_size); };
      const setMsg = (h) => (display_element.querySelector("#cd-message").innerHTML = h);
      const setResponseHTML = (h) => (display_element.querySelector("#cd-response").innerHTML = h);
      const clearResponse = () => setResponseHTML("");

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#cd-fixation").addEventListener("click", start);
      } else {
        start();
      }

      }); // end loadImages().then
    }
  }
  ChangeDetectionPlugin.info = info;

  // ===== module-private helpers =====
  // Colors are compared by resolved RGB (U.sameColor), so a wheel degree and the same
  // color written as "rgb(...)", "#hex" or "lab(...)" count as the same color.
  function sameItem(a, b) {
    if (a.kind !== b.kind) return false;
    if (a.kind === "image") return a.src === b.src;
    if (a.kind === "text") return a.text === b.text;
    return U.sameColor(a.css, b.css);
  }

  return ChangeDetectionPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-2afc-keyboard.js */
/* ===================================================================== */
/*
 * jspsych-2afc-keyboard.js  --  jsPsych v8 plugin
 *
 * Forced choice between options shown side by side, answered with the keyboard.
 * choice_keys[i] picks the option at spatial position i, counting from the left
 * (so with ["f","j"], f = left, j = right). Two options is classic 2-AFC, but
 * any number works.
 *
 * Options can be colors, color-wheel degrees, images, or words, mixed freely
 * (see `stimuli` and `item_type`).
 *
 * Sequence: [grayscale preview, preview_duration] -> [prompt alone with the
 * options hidden, prompt_lead_time] -> options visible + keyboard live -> keyup
 * -> [feedback]. rt is timed from the last step's onset.
 *
 * Key options:
 *   shuffle_options     -- randomize the left-to-right order (default true)
 *   color_rotation_deg  -- per-option CIELAB hue rotation for image options
 *   preview_duration / prompt_lead_time -- the optional phases above
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsych2afcKeyboard = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "2afc-keyboard",
    version: version,
    parameters: {
      /**
       * The options to choose between, in canonical order. Each entry may be a
       * number (color-wheel degree), a CSS color / "lab(...)" string, an image
       * path, or a word. One per choice key. Required.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: undefined },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Color wheel for degree lookups (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Keys for the spatial positions, left to right (e.g. ["f","j"]): choice_keys[i]
          picks whichever option is drawn at position i. Same name as wm-forced-choice.
          Keys beyond the number of options are ignored. */
      choice_keys: { type: jspsych.ParameterType.KEYS, array: true, default: ["f", "j"] },
      /** Canonical index (into `stimuli`, not the shuffled position) of the correct option,
          for accuracy and feedback, or null. Same name as wm-forced-choice. */
      correct_option: { type: jspsych.ParameterType.INT, default: null },
      /**
       * Optional per-stimulus hue rotation (deg) in CIELAB, indexed like `stimuli`,
       * applied to image options only. Empty (default) or 0 = image shown unmodified.
       */
      color_rotation_deg: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Randomize the left-to-right order of the options (as in wm-forced-choice). */
      shuffle_options: { type: jspsych.ParameterType.BOOL, default: true },
      /** If > 0, show the options in grayscale for this long first; the keyboard is not
          yet live. */
      preview_duration: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, show the prompt alone (options hidden) for this long, then reveal the
          options and enable the keyboard together. */
      prompt_lead_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Optional HTML shown beneath the options (e.g. the question). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Size (px) of color and word options. Images use stimulus_width/height or their
          natural size. */
      item_size: { type: jspsych.ParameterType.INT, default: 120 },
      /** Explicit image width/height (px); null leaves natural size. Giving only one keeps
          the aspect ratio. */
      stimulus_width: { type: jspsych.ParameterType.INT, default: null },
      stimulus_height: { type: jspsych.ParameterType.INT, default: null },
      /** Briefly highlight the chosen (and correct) option after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Optional sound URL overrides played on correct / incorrect responses (else win.mp3 / lose.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the options box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) from when the options are visible and the keyboard is live (after any preview / prompt lead time) to the keydown. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** The key the participant pressed. */
      response: { type: jspsych.ParameterType.STRING },
      /** How long (ms) the response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed from response onset until the response key is released (feedback time excluded): {key, t (ms from response onset), duration}. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** Left-to-right position chosen (0 = leftmost). Named to match wm-forced-choice. */
      chosen_position: { type: jspsych.ParameterType.INT },
      /** Canonical index (into `stimuli`) of the chosen option. Named to match wm-forced-choice. */
      chosen_option: { type: jspsych.ParameterType.INT },
      /** Whether the choice was correct (null if no correct_option given). */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Left-to-right order of stimulus indices as shown (matches wm-forced-choice). */
      option_order: { type: jspsych.ParameterType.INT, array: true },
      /** The option specs, in canonical order (as given). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Every option shown, in left-to-right order: {position, index (canonical), rotation (hue rotation applied, deg; always 0 for color and word options, which are never rotated)} plus {src} for an image, {text} for a word, or {value: the color spec as given}. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class TwoAfcKeyboardPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    async trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      // Warn (only) about bad parameter values and key/option count mismatches.
      U.checkParams(trial, { plugin: "2afc-keyboard", enums: { item_type: ["auto", "color", "image", "text"] } });
      if (trial.choice_keys.length !== trial.stimuli.length) {
        U.warnOnce("2afc-keyboard", "choice_keys has " + trial.choice_keys.length + " key(s) but there are " +
          trial.stimuli.length + " option(s); give one key per option (e.g. choice_keys: [\"f\",\"j\"] for 2 options).");
      }
      if (trial.correct_option != null && (trial.correct_option < 0 || trial.correct_option >= trial.stimuli.length)) {
        U.warnOnce("2afc-keyboard", "correct_option=" + trial.correct_option + " is out of range for " +
          trial.stimuli.length + " option(s) (valid 0.." + (trial.stimuli.length - 1) + ", or null); accuracy will be wrong.");
      }

      // ---- Spatial order (position -> stimulus index) ----
      let order = trial.stimuli.map((_, i) => i);
      if (trial.shuffle_options) order = jsPsych.randomization.shuffle(order);

      // ---- Build the row of options ----
      const wrap = document.createElement("div");
      wrap.id = "afc-stimuli";
      wrap.style.cssText = "display:flex;gap:40px;justify-content:center;align-items:center";

      // Hue rotation actually applied to option idx: images only.
      const rotationFor = (idx, item) =>
        item.kind === "image" && trial.color_rotation_deg.length ? (trial.color_rotation_deg[idx] || 0) : 0;

      const loads = [];
      order.forEach((idx, posIndex) => {
        const item = U.resolveItem(trial.stimuli[idx], wheel, forceType);
        let el;
        if (item.kind === "color") {
          el = document.createElement("div");
          el.style.cssText =
            `width:${trial.item_size}px;height:${trial.item_size}px;border-radius:50%;` +
            `border:1px solid #222;background:${item.css}`;
        } else if (item.kind === "text") {
          el = document.createElement("div");
          el.textContent = item.text;
          el.style.cssText =
            `min-width:${trial.item_size}px;height:${trial.item_size}px;display:flex;` +
            `align-items:center;justify-content:center;font-size:${Math.round(trial.item_size / 4)}px`;
        } else {
          const rot = rotationFor(idx, item);
          if (rot) {
            el = document.createElement("canvas");
            loads.push(drawRotated(el, item.src, rot, trial.stimulus_width, trial.stimulus_height));
          } else {
            el = document.createElement("img");
            el.src = item.src;
            if (trial.stimulus_width) el.width = trial.stimulus_width;
            if (trial.stimulus_height) el.height = trial.stimulus_height;
          }
        }
        el.dataset.idx = idx; // stimulus identity
        el.dataset.pos = posIndex; // spatial position
        wrap.appendChild(el);
      });

      const box = document.createElement("div");
      box.id = "afc-box";
      const promptDiv = document.createElement("div");
      promptDiv.id = "afc-prompt";
      promptDiv.style.cssText = "margin-top:16px;text-align:center;min-height:1.5em";
      box.appendChild(wrap);
      box.appendChild(promptDiv);
      display_element.innerHTML = "";
      display_element.appendChild(box);

      await Promise.all(loads); // wait for any hue-rotated canvases to draw
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Optional grayscale preview ----
      if (trial.preview_duration > 0) {
        wrap.style.filter = "grayscale(1)";
        await wait(jsPsych, trial.preview_duration);
        wrap.style.filter = "none";
      }

      // ---- Optional lead time: the prompt alone with the options hidden, then the
      //      options appear and the keyboard goes live together (rt starts there). ----
      if (trial.prompt) promptDiv.innerHTML = trial.prompt;
      if (trial.prompt_lead_time > 0) {
        wrap.style.visibility = "hidden";
        await wait(jsPsych, trial.prompt_lead_time);
        wrap.style.visibility = "visible";
      }

      // ---- Collect the keyboard response ----
      // Log every key pressed from response onset, so trials with more than one
      // response key can be excluded (see info.data).
      U.beginPressLog();
      // Only keys that have an option: a surplus key would select a position with no
      // option and record chosen_option undefined.
      const liveKeys = trial.choice_keys.slice(0, order.length);
      const response = await new Promise((resolve) => {
        jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: resolve,
          valid_responses: liveKeys,
          rt_method: "performance",
          persist: false,
        });
      });

      // getKeyboardResponse fires on keydown, before the hold is known, so wait for the
      // release (CONVENTIONS §11). RDs run ~100 ms, so this costs the trial little.
      const key_hold_duration = await U.awaitKeyUp(response.key);
      // Close the log at the release, so keys pressed during feedback don't count.
      const pressLog = U.endPressLog();

      // Key -> spatial position (choice_keys order) -> canonical option (order[position]).
      const position = liveKeys.findIndex((k) => jsPsych.pluginAPI.compareKeys(k, response.key));
      const choice = order[position];
      const correct = trial.correct_option === null ? null : choice === trial.correct_option;

      // ---- Optional feedback ----
      if (trial.feedback) {
        const chosenEl = wrap.querySelector(`[data-pos="${position}"]`);
        // Green/red when accuracy is defined; neutral gray when there's no correct answer.
        const chosenColor = correct === null ? "#888" : correct ? "#2ecc40" : "#ff4136";
        if (chosenEl) chosenEl.style.outline = `4px solid ${chosenColor}`;
        if (correct === false && trial.correct_option !== null) {
          const correctEl = wrap.querySelector(`[data-idx="${trial.correct_option}"]`);
          if (correctEl) correctEl.style.outline = "4px solid #2ecc40";
        }
        // Sound/confetti only when accuracy is defined (correct_option set).
        if (correct === true || correct === false) {
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
        }
        await wait(jsPsych, 700);
      }

      // Every option shown, with its spatial position, canonical index, applied hue
      // rotation, and value. resolveItem is pure, so re-resolving gives the same items.
      const stimuli_shown = order.map((idx, posIndex) => {
        const item = U.resolveItem(trial.stimuli[idx], wheel, forceType);
        const rec = { position: posIndex, index: idx, rotation: rotationFor(idx, item) };
        if (item.kind === "image") rec.src = item.src;
        else if (item.kind === "text") rec.text = item.text;
        else rec.value = trial.stimuli[idx]; // color: hue degree or css spec
        return rec;
      });

      // async trial(): returning the data object ends the trial (CONVENTIONS §3).
      const data = {
        rt: Math.round(response.rt),
        response: response.key,
        ...U.keyHoldData(key_hold_duration, response.key, pressLog),
        chosen_position: position,
        chosen_option: choice,
        correct: correct,
        option_order: order,
        stimuli: trial.stimuli,
        stimuli_shown: stimuli_shown,
      };
      data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
      if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
      return data;
    }
  }
  TwoAfcKeyboardPlugin.info = info;

  // ===== helpers =====
  // Promise-wrapped jsPsych timeout (auto-cancelled if the trial ends early).
  function wait(jsPsych, ms) {
    return new Promise((resolve) => jsPsych.pluginAPI.setTimeout(resolve, ms));
  }
  // Load an image, draw it to `canvas`, and rotate every pixel's hue by `deg`.
  // Sizing matches the unrotated <img>: natural size, or w/h, keeping the aspect
  // ratio when only one is given.
  function drawRotated(canvas, src, deg, w, h) {
    return new Promise((resolve) => {
      const img = new Image();
      if (U.needsCors(src)) img.crossOrigin = "anonymous"; // only for cross-origin URLs; crossOrigin can block file:// loads
      img.onload = () => {
        const nw = img.naturalWidth, nh = img.naturalHeight;
        const cw = w || (h && nh ? Math.round((nw * h) / nh) : nw);
        const ch = h || (w && nw ? Math.round((nh * w) / nw) : nh);
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        // CIELAB hue-rotate in place (degrades gracefully on a tainted cross-origin canvas).
        U.rotateCanvasHue(ctx, cw, ch, deg);
        resolve();
      };
      img.onerror = resolve; // don't hang the trial if an image is missing
      img.src = src;
    });
  }
  return TwoAfcKeyboardPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-continuous-report.js */
/* ===================================================================== */
/*
 * jspsych-continuous-report.js  --  jsPsych v8 plugin
 *
 * Continuous report (delayed estimation). A memory array, a blank delay, then one
 * location is probed and the participant reports the remembered feature on a
 * wheel. Error is in degrees.
 *
 * Items are disks, oriented lines, oriented triangles, Gabor patches or gratings
 * (`item_shape`). Each has a color (uniform, per-item, or random) and an orientation
 * (per-item or random). Gabors and gratings are achromatic (`grating_options` sets
 * their spatial frequency, contrast, envelope, phase and mean gray), so they are
 * meant for report:"orientation".
 * `report` picks what is reported:
 *   "color"       -> the color, on the color wheel (default)
 *   "orientation" -> the orientation; the probed shape points at the cursor
 *   "both"        -> both, in `report_order` (two responses)
 *
 * Key options:
 *   num_choices < 360       -- quantized color wheel, grid anchored on the target
 *   orientation_num_choices -- quantized orientation response (0 = continuous)
 *   spin_wheel / wheel_option_offset -- rotate the color wheel (random per trial / fixed)
 *   precue_time > 0         -- spatial pre-cue;  retrocue_time > 0 -- retro-cue
 *   noise_level / noise_type -- degrade the items at encoding (kinds in
 *                              BradyUtils.noiseKinds; add more with registerNoise)
 *   mask_time / mask_type   -- mask the occupied locations at array offset, before the delay (kinds in
 *                              BradyUtils.maskKinds; add more with registerMask)
 *   sequential              -- show the items one at a time
 *   mode:"perception"       -- a visible reference plus a gray match slot, no delay
 *   which_test:-1           -- ensemble: report the mean color at the centre
 *   responses_per_item > 1  -- ranking (several distinct responses per dimension)
 *
 * Orientation period: "line", "gabor" and "grating" look the same at t and t + 180,
 * so their orientation error wraps at 180 (BradyUtils.shapePeriod); triangles use 360.
 * The recorded orientations are in [0, period) (a line drawn at 200 is recorded as 20),
 * and the period is recorded as `orientation_period`. Disks show no orientation, so
 * their orientation fields are null.
 *
 * Sign and geometry (do not change): option value `deg` is drawn at screen angle
 * deg + spin + offset, and the response is read back from the pointer angle with
 * BradyUtils.wheelDegreeFromPointer, its exact inverse. What the participant
 * points at is what gets recorded, and error = reported - target is never
 * mirror-flipped relative to a distance-based similarity matrix. See
 * CONVENTIONS.md section 8.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychContinuousReport = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "continuous-report",
    version: version,
    parameters: {
      /** Item shape: "disk" (default), "line", "triangle", "gabor" (a sinusoidal grating
       *  under a circular Gaussian envelope) or "grating" (a sinusoidal grating in a circular
       *  aperture of item_size). Gabors and gratings are achromatic, set by
       *  `grating_options`; their stripes at orientation d run the same way as a "line" at d.
       *  "line", "gabor" and "grating" have a 180-degree orientation period. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /**
       * Gabor/grating appearance (item_shape "gabor" or "grating"; ignored otherwise). An
       * object; keys you leave out keep their defaults:
       * cycles (4): grating cycles across the item diameter;
       * contrast (1): Michelson contrast 0..1 around the mean, capped so the sinusoid is not
       * clipped (around a light mean such as the default #dddddd background only ~0.15
       * fits; use background_color "#808080" for full contrast);
       * sigma (0.18): Gaussian envelope SD as a fraction of the item diameter (gabor only);
       * phase (0): cosine phase in degrees at the item centre (0 = a bright stripe through
       * the centre), or "random" for an independent whole-degree phase per drawn item
       * (recorded in stimuli_shown and probe_phase);
       * mean ("background"): the mean gray, "background" to match background_color's
       * luminance so the patch blends into the box, or a CSS color (its luminance is used).
       * Degree d and d + 180 draw the same pattern.
       */
      grating_options: { type: jspsych.ParameterType.OBJECT, default: { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" } },
      /**
       * Item colors. Each entry is a wheel degree (number) or a CSS / "lab(...)"
       * string; only numeric degrees get a scored color error. One value colors
       * every item the same (e.g. "black", "gray", a degree); a list gives
       * per-item colors. Empty: random wheel colors when color is reported, else
       * every item is `default_color`. Gabors and gratings ignore item colors.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /**
       * Item orientations in degrees (0 = pointing right / horizontal, increasing
       * clockwise), for line/triangle/gabor/grating. One value = all the same; a list =
       * per item; empty = random. Ignored for disks.
       */
      orientations: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** What to report: "color", "orientation", or "both". */
      report: { type: jspsych.ParameterType.STRING, default: "color" },
      /** For report:"both", which feature is reported first: "color_first" or "orientation_first". */
      report_order: { type: jspsych.ParameterType.STRING, default: "color_first" },
      /** Color used when items have no color and color is not being reported. */
      default_color: { type: jspsych.ParameterType.STRING, default: "#666666" },
      /** Thickness (px) of line items. Triangles are filled and ignore it. */
      line_width: { type: jspsych.ParameterType.INT, default: 10 },
      /**
       * Period (deg) for orientation error: 360 (a triangle has a pointing
       * direction) or 180 (a line, Gabor or grating looks the same at t and t+180).
       * 0 = auto by shape (line/gabor/grating -> 180, else 360; BradyUtils.shapePeriod).
       */
      orientation_period: { type: jspsych.ParameterType.INT, default: 0 },
      /** Number of items to auto-generate when nothing fixes the set size. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated wheel colors. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 15 },
      /** When auto-generating colors, confine them to a random arc this many degrees wide
       *  (360 = whole wheel). Use a narrow span (e.g. 90) for ensemble so the mean is meaningful. */
      color_span: { type: jspsych.ParameterType.INT, default: 360 },
      /** Color wheel for degree lookups (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the probed item; -1 = ensemble (probe at the centre, target =
       *  circular mean of the numeric item colors). Ignored in perception mode. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Number of equally-spaced locations items can occupy. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Number of options on the color wheel (>= 360 = continuous; e.g. 12 = quantized).
       *  A quantized grid sits at target + k*360/num_choices, so the target is always an
       *  option (with no single target it is anchored on the ensemble mean, else on 0). */
      num_choices: { type: jspsych.ParameterType.INT, default: 360 },
      /** Quantize the orientation response into this many steps around the full 360 deg
       *  (0 = continuous), anchored on the target orientation. For lines, Gabors and
       *  gratings, opposite steps look identical, so an even count gives half as many
       *  distinct orientations. */
      orientation_num_choices: { type: jspsych.ParameterType.INT, default: 0 },
      /** Rotate the color wheel by a random whole-degree offset each trial (reduces motor
       *  bias; recorded as wheel_spin). The orientation response is never rotated. */
      spin_wheel: { type: jspsych.ParameterType.BOOL, default: false },
      /** Constant angular offset (deg) applied to the color wheel option positions. */
      wheel_option_offset: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Number of responses to collect per reported dimension (>1 = ranking). Each rank
       *  must be a distinct option; capped at the option count of the dimension(s) reported.
       *  Orientations are compared within their period, so for lines, Gabors and gratings
       *  o and o+180 are the same option (an even orientation_num_choices gives n/2 distinct
       *  orientations). */
      responses_per_item: { type: jspsych.ParameterType.INT, default: 1 },
      /** How long (ms) the memory array is shown. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) before the probe/response. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, highlight the to-be-probed location for this many ms; the array then follows
       *  after `delay_start`. Skipped in ensemble and perception (no single remembered location),
       *  and when do_test is false (no probe to cue). */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, retro-cue: after the retention delay, highlight the
       *  to-be-probed location for this many ms before the response. 0 = off. Skipped in
       *  ensemble and perception. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
       *  starting the moment the array goes off (a backward mask that cuts encoding
       *  off); the blank `delay_time` then runs in full. Not used in perception. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
       *  extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
       *  the `noise_type` degradation (a transparent overlay, removed when the array is
       *  hidden). In perception mode the reference keeps its noise through the response
       *  and the gray match slot gets none. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
       *  extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring (disk items; line/triangle keep the dot cue). */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** If false, skip the test/response entirely (encoding-only trial). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** "memory" (items hidden, then report) or "perception": two slots, a visible
       *  reference (item 0) and a gray match slot (item 1) that the participant adjusts;
       *  no delay. */
      mode: { type: jspsych.ParameterType.STRING, default: "memory" },
      /** Show the correct answer and the error after responding (the first-ranked
       *  response when ranking). Not shown for ensemble. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct (small-error) response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Abs error (deg) at/under which a response counts "correct" for the reward cue. */
      feedback_threshold: { type: jspsych.ParameterType.INT, default: 20 },
      /** Override URLs for the correct / incorrect sounds (else win.mp3 / lose.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Optional HTML shown beneath the stimulus box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the whole-trial mouse trajectory (off by default; no behavior change when off). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded mouse samples during non-response phases (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded mouse samples during the response phase (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time(s) (ms), in the order collected. Each is measured from the onset of
       *  its own report phase (color or orientation), so ranked responses are cumulative.
       *  The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT, array: true },
      /** How long (ms) the mouse button was held for each committing click, in the same order as `rt`. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null for any click whose press could not be measured. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT, array: true },
      /** Color: signed error(s) in degrees (reported - target), wrapped to (-180,180]; null
       *  entries when the target has no numeric degree. For ensemble (which_test -1) the
       *  target is the circular mean of the item degrees (BradyUtils.ensembleTarget), so the
       *  error is reported - circular mean, as in continuous-image-report and
       *  continuous-object-report. */
      error: { type: jspsych.ParameterType.INT, array: true },
      /** Color: reported color degree(s), in rank order. */
      reported_degree: { type: jspsych.ParameterType.INT, array: true },
      /** Color: target degree of the probed item (for ensemble, the circular mean of the item
       *  colors, which need not be a whole degree, so the type is FLOAT); null when there is no
       *  numeric color, or for an ensemble whose mean is undefined (the colors cancel out). */
      target_degree: { type: jspsych.ParameterType.FLOAT },
      /** Orientation: signed error(s) in degrees (reported - target), wrapped to
       *  (-period/2, period/2] with the orientation period (`orientation_period`: by default
       *  180 for line, gabor and grating, else 360). */
      orientation_error: { type: jspsych.ParameterType.INT, array: true },
      /** Orientation: reported orientation degree(s) in [0, orientation_period), in rank
       *  order. For a 180-period shape a pointer at 207 deg is recorded as 27. */
      reported_orientation: { type: jspsych.ParameterType.INT, array: true },
      /** Orientation: target orientation of the probed item, in [0, orientation_period).
       *  null for ensemble, and for disks (which show no orientation). */
      target_orientation: { type: jspsych.ParameterType.INT },
      /** The orientation period (deg) the orientation fields use: the orientation_period
       *  parameter when it is > 0, else 180 for line, gabor and grating and 360 for disk and
       *  triangle (BradyUtils.shapePeriod). Orientations are recorded in [0, period) and
       *  orientation errors wrap at +/- period/2. */
      orientation_period: { type: jspsych.ParameterType.INT },
      /** Item color specs presented (in perception mode, entry 1 is the gray match slot). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Item orientations presented (deg), in [0, orientation_period). null for disks,
       *  which show no orientation. */
      orientations: { type: jspsych.ParameterType.INT, array: true },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the probed item after clamping (-1 = ensemble; 1 = the match slot in
       *  perception mode, whose target is the reference, item 0). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Random color-wheel rotation (deg) applied this trial (0 unless spin_wheel). */
      wheel_spin: { type: jspsych.ParameterType.INT },
      /** Measured ms from the first item painted to the array being hidden (for sequential
       *  presentation this spans the whole sequence, gaps included). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Number of items in the memory array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** What was reported ("color", "orientation", or "both"). */
      report: { type: jspsych.ParameterType.STRING },
      /** Item shape used ("disk", "line", "triangle", "gabor", or "grating"). */
      item_shape: { type: jspsych.ParameterType.STRING },
      /** Number of options on the color wheel. */
      num_choices: { type: jspsych.ParameterType.INT },
      /** Every item presented: per-item {position, color, orientation, degree}; `degree` only
       *  when the color is a numeric wheel degree. `orientation` is in [0, orientation_period),
       *  or null for disks. Gabors and gratings are achromatic, so their `color` is null; they
       *  also carry `phase`, the grating phase (deg) the item was drawn with
       *  (grating_options.phase, or its own draw when that is "random"). */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown / item arrays of the probed item (-1 = ensemble). */
      target_index: { type: jspsych.ParameterType.INT },
      /** Gabor/grating only (absent for other shapes): the phase (deg) of the probe drawn
       *  during the response and feedback. It is drawn on its own when grating_options.phase
       *  is "random", so it generally differs from the probed item's study phase. In
       *  perception mode the match slot is the probe, so it equals stimuli_shown[1].phase. */
      probe_phase: { type: jspsych.ParameterType.FLOAT },
      /** Recorded mouse trajectory samples (only when record_mouse). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory sample (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first mouse sample in the response phase (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at
       *  the fixation click, or at trial start when click_to_start is false). encoding: 0,
       *  tracking start, which comes before delay_start and any pre-cue; array: the memory
       *  array's onset (first item painted); mask: the mask's onset, which is the array's
       *  offset (only on trials that show a mask); delay: the blank retention interval
       *  begins, at the array's offset or, after a mask, at the mask's offset (absent in
       *  perception mode); report: the response phase opens. Any retro-cue falls between
       *  delay and report. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Zoom factor applied to the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout geometry in the mouse-trajectory frame (only when record_mouse): item study boxes (top-left x,y and w,h), wheel centre/radius, each item's wheel point, and the target point. `dimension` says which wheel is described: the color wheel, or the orientation circle for report:"orientation". Points are null for items without a numeric value. */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class ContinuousReportPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional whole-trial mouse tracker (created at cursor onset when record_mouse)
      let stimOnset = null;          // performance.now() when the array first painted
      let actualStimDuration = null; // measured ms the array was actually on screen
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const shape = trial.item_shape;
      const lw = trial.line_width;
      const wantColor = trial.report === "color" || trial.report === "both";
      const wantOrient = trial.report === "orientation" || trial.report === "both";
      const oriPeriod = trial.orientation_period > 0 ? trial.orientation_period : U.shapePeriod(shape);
      // Disks show no orientation, so their orientation fields are recorded as null.
      const showsOrient = shape !== "disk";
      // Recorded orientations live in [0, period): a line at 200 deg is the line at 20.
      const modP = (o) => ((o % oriPeriod) + oriPeriod) % oriPeriod;
      // Gabor / grating appearance (achromatic; null for the other shapes). Out-of-range
      // options warn once and fall back (U.resolveGrating).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "continuous-report", background: trial.background_color })
        : null;

      // ---- Set size & per-item color / orientation specs ----
      // Perception is a no-memory matching task: one colored reference item plus a
      // gray match slot (two placeholders); the participant adjusts the match slot.
      // It always probes the match slot, so which_test:-1 does not make it ensemble.
      const perception = trial.mode === "perception";
      const ensemble = trial.which_test === -1 && !perception;

      let colorSpecs = trial.stimuli.slice();
      let orientSpecs = trial.orientations.slice();
      let setSize = trial.set_size;
      if (colorSpecs.length > 1) setSize = colorSpecs.length;
      else if (orientSpecs.length > 1) setSize = orientSpecs.length;
      if (perception) setSize = 2;

      if (colorSpecs.length === 0) {
        colorSpecs = wantColor ? genColors(setSize, trial.min_color_distance, trial.color_span, wheel)
                               : new Array(setSize).fill(trial.default_color);
      } else if (colorSpecs.length === 1) {
        colorSpecs = new Array(setSize).fill(colorSpecs[0]);
      }
      if (orientSpecs.length === 0) {
        orientSpecs = new Array(setSize).fill(0).map(() => (wantOrient || shape !== "disk" ? U.randInt(0, 359) : 0));
      } else if (orientSpecs.length === 1) {
        orientSpecs = new Array(setSize).fill(orientSpecs[0]);
      }
      // Perception: item 1 is drawn gray, so record it as gray (not the color that
      // would have been drawn there), and drop any extra specs beyond the two slots.
      if (perception) {
        colorSpecs = [colorSpecs[0], "#888888"];
        orientSpecs = orientSpecs.slice(0, 2);
      }
      const cssArr = colorSpecs.map((c) => U.toCssColor(c, wheel));
      const colorDegs = colorSpecs.map((c) => (typeof c === "number" ? U.wrap360(c) : NaN));
      const orientDegs = orientSpecs.map((o) => U.wrap360(o));

      // Warn (only) about silent stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "continuous-report", setSize: setSize, supportsEnsemble: true, values: wantColor ? colorSpecs : orientSpecs,
        userItems: perception ? 0 : Math.max(trial.stimuli.length, trial.orientations.length) });
      U.checkParams(trial, { plugin: "continuous-report", setSize: setSize, positive: ["num_choices"],
        enums: { report: ["color", "orientation", "both"], report_order: ["color_first", "orientation_first"], mode: ["memory", "perception"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] } });
      if (grating && wantColor) {
        U.warnOnce("continuous-report", "report \"" + trial.report + "\" asks for a color, but item_shape \"" + shape +
          "\" is achromatic, so the items show no color to remember; use report:\"orientation\" with Gabors and gratings.");
      }
      // Grating phase per item and for the probe (random draws only when phase is "random").
      // Perception: the match slot (item 1) is the probe, so it keeps the probe's phase.
      const itemPhases = grating ? new Array(setSize).fill(0).map(() => U.gratingPhase(grating)) : null;
      const probePhase = grating ? (perception ? itemPhases[1] : U.gratingPhase(grating)) : null;
      const gratingAt = (ph) => (grating ? Object.assign({}, grating, { phase: ph }) : null);

      // Guard degenerate configs: there must be at least `setSize` placeholders to draw
      // into (sampleWithoutReplacement throws if asked for more than the pool holds),
      // and `which_test` must index a real item (clamped; -1 stays ensemble).
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots). Perception mode always
      // uses the two fixed slots [0, 1].
      const placed = perception ? { pos: [0, 1], nph: 2 } : U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const whichTest = perception ? 1 : (ensemble ? -1 : U.whichTestIndex(trial.which_test, setSize, { plugin: "continuous-report" }));
      // ---- Item locations ----
      const pos = placed.pos;

      // Ensemble target: the circular mean of the item colors (U.ensembleTarget; NaN when
      // there are no numeric colors or they cancel out).
      const meanColorDeg = U.ensembleTarget(colorDegs);
      const targetColorDeg = ensemble ? meanColorDeg : perception ? colorDegs[0] : colorDegs[whichTest];
      // Quantized wheel (num_choices<360): anchor the option grid on the target so the
      // correct color is always one of the options (true n-AFC). Options sit at
      // colorAnchor + k*(360/num_choices); spin_wheel still randomizes where they land
      // on screen. For ensemble the anchor is the circular mean. With no numeric target
      // (non-degree colors, e.g. an orientation-only report) the grid is anchored on 0.
      const colorStep = 360 / trial.num_choices;
      const colorAnchor = (trial.num_choices < 360 && !isNaN(targetColorDeg))
        ? (((targetColorDeg % colorStep) + colorStep) % colorStep)
        : 0;
      // Perception reports the reference item (index 0), not the match slot's own
      // random orientation.
      const targetOrient = ensemble || !showsOrient ? NaN : perception ? orientDegs[0] : orientDegs[whichTest];
      // Orientations that look the same: o and o + period (a line at 10 deg is the line at
      // 190 deg). Ranking compares responses by this key, so each rank is a visibly
      // different orientation.
      const oriKey = (o) => ((Math.round(o) % oriPeriod) + oriPeriod) % oriPeriod;
      // Ranking asks for that many distinct options per phase, so cap it at the option
      // count of each phase that runs, or a phase could never fill and the trial would
      // hang. A continuous wheel has 360 distinct whole degrees. Orientation counts distinct
      // orientations within one period: a quantized grid of n steps has n/2 of them for
      // lines when n is even, and a continuous one has `period` whole degrees.
      const colorDistinct = trial.num_choices < 360 ? trial.num_choices : 360;
      let orientDistinct = Math.min(360, oriPeriod);
      if (trial.orientation_num_choices > 0) {
        const keys = new Set();
        const oAnchor = isNaN(targetOrient) ? 0 : targetOrient;
        for (let k = 0; k < trial.orientation_num_choices; k++) {
          keys.add(oriKey(U.wrap360(Math.round(U.snapDegree(oAnchor + (k * 360) / trial.orientation_num_choices, trial.orientation_num_choices, oAnchor)))));
        }
        orientDistinct = keys.size;
      }
      const effRpi = Math.max(1, Math.min(trial.responses_per_item,
        wantColor ? colorDistinct : Infinity, wantOrient ? orientDistinct : Infinity));
      // With non-degree colors meanColorDeg is NaN; fall back to the first item's CSS
      // color so NaN never reaches the wheel.
      const trueColorCss = ensemble
                          ? (isNaN(meanColorDeg) ? (cssArr[0] || trial.default_color) : U.colorWheelCSS(meanColorDeg, wheel))
                          : perception ? cssArr[0] : cssArr[whichTest];
      const trueOrient = ensemble ? 0 : perception ? orientDegs[0] : orientDegs[whichTest];

      // ---- Layout ----
      const wheelRadius = trial.radius + trial.item_size + 10;
      const boxSize = 2 * wheelRadius + trial.item_size + 30;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";
      const isz = trial.item_size;
      const dotSize = 10; // small gray centre dot used as the placeholder for line/triangle items

      let html =
        `<div id="cr-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      // Disk placeholders: a CSS circle outline always visible; the full-canvas
      // disk fill (clipped by border-radius) covers it exactly when painted.
      const phStyle = shape === "disk" ? "border-radius:50%;border:1px solid #999;" : "";
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - isz / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - isz / 2;
        // line/triangle: a small gray dot marks each location (the item draws over it).
        if (shape !== "disk") {
          html +=
            `<div class="cr-dot" id="cr-dot-${i}" style="position:absolute;border-radius:50%;` +
            `background:#999;width:${dotSize}px;height:${dotSize}px;pointer-events:none;` +
            `top:${top + isz / 2}px;left:${left + isz / 2}px;transform:translate(-50%,-50%)"></div>`;
        }
        html +=
          `<canvas id="cr-item-${i}" width="${isz}" height="${isz}" ` +
          `style="position:absolute;${phStyle}top:${top}px;left:${left}px"></canvas>`;
      }
      html +=
        `<canvas id="cr-item--1" width="${isz}" height="${isz}" style="position:absolute;display:none;${phStyle}` +
        `top:${center - isz / 2}px;left:${center - isz / 2}px"></canvas>` +
        `<span id="cr-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="cr-center" style="position:absolute;width:0;height:0;top:${center}px;left:${center}px"></div>` +
        `<div id="cr-message" style="position:absolute;top:14px;width:100%;text-align:center">${startText}</div>` +
        `<div id="cr-wheel"></div></div>`;
      if (trial.prompt) html += `<div id="cr-prompt" style="text-align:center;margin-top:12px">${trial.prompt}</div>`;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#cr-box"));

      const itemEl = (p) => display_element.querySelector(`#cr-item-${p}`);
      const probeEl = () => itemEl(ensemble ? -1 : pos[whichTest]);
      const setMsg = (h) => (display_element.querySelector("#cr-message").innerHTML = h);
      const centerEl = () => display_element.querySelector("#cr-center");
      const drawProbe = (css, orient) => drawItem(probeEl(), shape, css, orient, lw, gratingAt(probePhase));
      // Mark the item to report with a black ring.
      const highlightProbe = () => {
        if (shape !== "disk") return; // line/triangle: the probe shape is the marker; no ring
        const el = probeEl();
        el.style.borderRadius = "50%";
        el.style.boxShadow = "0 0 0 4px #000";
      };
      const dotEl = (i) => display_element.querySelector(`#cr-dot-${i}`);
      // Pre-/retro-cue of the tested location: a cue_color/cue_thickness ring
      // (U.spatialCue) for disks. Line/triangle items have no placeholder outline, so
      // their placeholder dot turns black and grows instead.
      let cueClear = null;
      const setCue = (on) => {
        if (shape === "disk") {
          if (on && !cueClear) cueClear = U.spatialCue(probeEl(), { color: trial.cue_color, thickness: trial.cue_thickness });
          else if (!on && cueClear) { cueClear(); cueClear = null; }
          return;
        }
        const d = dotEl(pos[whichTest]); if (!d) return;
        const sz = on ? dotSize * 1.8 : dotSize;
        d.style.width = d.style.height = sz + "px";
        d.style.background = on ? "#000" : "#999";
      };
      // Live stimulus-noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const addNoise = (i) => {
        // Perception: item 1 is the match slot the participant adjusts; only the
        // reference gets noise.
        if (!(trial.noise_level > 0) || (perception && i === 1)) return;
        const p = pos[i];
        clearNoise(p);
        noiseRemovers[p] = U.noiseOverlay(itemEl(p), trial.noise_level, trial.noise_type, { wheel });
      };

      // ---- Phases: start -> array -> delay -> report(s) -----------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#cr-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.record_mouse) {
          // Tracking starts here, at the visible start of the trial. seedCenter only
          // after a click on the centred fixation, when the cursor is known to be there.
          const t0 = performance.now();
          const rootBox = display_element.querySelector("#cr-box");
          mt = U.makeMouseTracker(rootBox, t0, { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter();
          mt.mark("encoding");
        }
        // Pre-cue (U.wantPrecue): only with a test to cue, and never in ensemble/perception.
        if (U.wantPrecue(trial) && !ensemble && !perception) {
          setCue(true);
          jsPsych.pluginAPI.setTimeout(() => {
            setCue(false);
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      const showArray = () => {
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => { if (stimOnset === null) { stimOnset = performance.now(); if (mt) mt.mark("array"); } drawItem(itemEl(pos[i]), shape, cssArr[i], orientDegs[i], lw, grating && gratingAt(itemPhases[i])); addNoise(i); }, // onset = first item painted
          clear: (i) => { clearNoise(pos[i]); clearItem(itemEl(pos[i])); },
          displayTime: trial.display_time,
          sequential: trial.sequential && trial.mode !== "perception",
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        const hideTime = performance.now();
        if (stimOnset !== null) actualStimDuration = Math.round(hideTime - stimOnset);
        if (trial.mode !== "perception") for (let i = 0; i < setSize; i++) { clearNoise(pos[i]); clearItem(itemEl(pos[i])); }
        const next = trial.do_test ? beginReport : finish;
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first. Perception has none, because the items stay up as the reference
        // and response surface, so the report opens at once.
        const startDelay = () => {
          if (mt && !perception) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(next, perception ? 0 : trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time = 0, on encoding-only trials (do_test:false), and in
        // perception.
        if (trial.mask_time > 0 && trial.do_test && !perception) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, { wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue between the retention delay and the response: highlight the
      // probed location with the same cue as the pre-cue (setCue) for retrocue_time ms,
      // then start the report. Skipped when retrocue_time = 0, in ensemble, and in perception.
      const beginReport = () => {
        if (trial.retrocue_time > 0 && !ensemble && !perception) {
          setCue(true);
          jsPsych.pluginAPI.setTimeout(() => {
            setCue(false);
            startReport();
          }, trial.retrocue_time);
        } else {
          startReport();
        }
      };

      // ---- Report (one or two phases) ----------------------------------------
      const wheelSpin = trial.spin_wheel ? U.randInt(0, 359) : 0;
      let phases = [];
      if (wantColor && wantOrient) {
        phases = trial.report_order === "orientation_first" ? ["orientation", "color"] : ["color", "orientation"];
      } else if (wantColor) {
        phases = ["color"];
      } else if (wantOrient) {
        phases = ["orientation"];
      }
      let phaseIdx = 0;

      // Collected responses, per dimension.
      const colRep = [], colErr = [], colRt = [], colHold = [];
      const oriRep = [], oriErr = [], oriRt = [], oriHold = [];
      // Last committed value of each dimension. In report:"both" the second phase
      // shows the first phase's answer; before it is reported it stays neutral.
      let committedColorCss = null;
      let committedOrient = null;
      let phaseStart = 0;
      let curMove = null, curClick = null;

      const onBoxMove = (e) => { if (curMove) curMove(e); };
      const onBoxClick = (e) => { if (mt) mt.sample(e); if (curClick) curClick(e); };

      const startReport = () => {
        display_element.querySelectorAll(".cr-dot").forEach((d) => (d.style.display = "none"));
        if (ensemble) probeEl().style.display = "block";
        const box = display_element.querySelector("#cr-box");
        box.style.cursor = "crosshair";
        box.addEventListener("mousemove", onBoxMove);
        box.addEventListener("click", onBoxClick);
        if (mt) mt.mark("report");
        runPhase();
      };

      const runPhase = () => {
        if (phaseIdx >= phases.length) return endReport();
        phases[phaseIdx] === "color" ? runColorPhase() : runOrientPhase();
      };

      // ----- Color phase: report the color on the color wheel -----
      // Quantized wheel: snap to the target-anchored grid (same as
      // U.snapDegree(raw, n, colorAnchor)). Continuous: just wrap.
      const colorDegAt = (e) => {
        const raw = U.wheelDegreeFromPointer(centerEl(), e.clientX, e.clientY, wheelSpin, trial.wheel_option_offset);
        if (trial.num_choices >= 360) return U.snapDegree(raw, trial.num_choices);
        return U.wrap360(colorAnchor + Math.round(U.wrap360(raw - colorAnchor) / colorStep) * colorStep);
      };

      const runColorPhase = () => {
        drawColorWheel(display_element.querySelector("#cr-wheel"), wheelRadius, center, trial.num_choices, wheelSpin, trial.wheel_option_offset, wheel, colorAnchor);
        highlightProbe();
        // Orientation shown during the color phase: the true value if orientation is
        // not tested, the reported value if orientation came first, else 0 so the
        // untested answer isn't revealed.
        const probeOrient = !wantOrient ? trueOrient : committedOrient !== null ? committedOrient : 0;
        // The probe starts gray and recolors as the pointer moves around the wheel.
        drawProbe("#888888", probeOrient);
        if (mt) mt.setValueFn(colorDegAt);
        phaseStart = performance.now();
        // Ranking: options already chosen this phase, so each rank is a distinct option.
        const chosenColorOptions = new Set();
        curMove = (e) => drawProbe(wheel.css(colorDegAt(e)), probeOrient);
        curClick = (e) => {
          // Read the hold first: every click must consume its own press, even an
          // ignored one, or the next click would claim a stale duration.
          const hold = U.mouseHoldDuration();
          const deg = U.wrap360(Math.round(colorDegAt(e))); // whole degree; wrap so 359.6 -> 0, not 360
          // Ignore a click on an already-ranked option (ranking only).
          if (effRpi > 1 && chosenColorOptions.has(deg)) return;
          colHold.push(hold);
          colRt.push(Math.round(performance.now() - phaseStart));
          colRep.push(deg);
          colErr.push(isNaN(targetColorDeg) ? null : signedErr(deg, targetColorDeg));
          committedColorCss = wheel.css(deg);
          chosenColorOptions.add(deg);
          if (colRep.length < effRpi) return;
          phaseIdx++;
          runPhase();
        };
      };

      // ----- Orientation phase: the probed shape points at the cursor -----
      // Orientation = pointer angle around the box centre (0 = right, clockwise), with
      // no spin or offset. Quantized steps are anchored on the target, as for color.
      const orientAt = (e) => {
        let o = U.wheelDegreeFromPointer(centerEl(), e.clientX, e.clientY, 0, 0);
        if (trial.orientation_num_choices > 0) o = U.snapDegree(o, trial.orientation_num_choices, isNaN(targetOrient) ? 0 : targetOrient);
        return o;
      };

      const runOrientPhase = () => {
        display_element.querySelector("#cr-wheel").innerHTML =
          `<div style="position:absolute;pointer-events:none;border:2px dashed #999;border-radius:50%;` +
          `width:${wheelRadius * 2}px;height:${wheelRadius * 2}px;top:${center - wheelRadius}px;left:${center - wheelRadius}px"></div>`;
        // Color shown during the orientation phase: the true color if color is not
        // tested, the reported color if color came first, else gray so the untested
        // color isn't revealed.
        const probeColor = !wantColor ? trueColorCss : committedColorCss !== null ? committedColorCss : "#888888";
        highlightProbe();
        drawProbe(probeColor, 0);
        if (mt) mt.setValueFn(orientAt);
        phaseStart = performance.now();
        // Ranking: orientations already chosen this phase, compared modulo the orientation
        // period (oriKey), so for lines o and o+180 are the same option.
        const chosenOrientOptions = new Set();
        curMove = (e) => drawProbe(probeColor, orientAt(e));
        curClick = (e) => {
          const hold = U.mouseHoldDuration(); // read first: one press consumed per click
          const o = U.wrap360(Math.round(orientAt(e))); // round once and wrap, so reported and error agree
          // Ignore a click on an already-ranked option (ranking only).
          if (effRpi > 1 && chosenOrientOptions.has(oriKey(o))) return;
          oriHold.push(hold);
          oriRt.push(Math.round(performance.now() - phaseStart));
          oriRep.push(o);
          oriErr.push(isNaN(targetOrient) ? null : errMod(o, targetOrient, oriPeriod));
          committedOrient = o;
          chosenOrientOptions.add(oriKey(o));
          if (oriRep.length < effRpi) return;
          phaseIdx++;
          runPhase();
        };
      };

      // ---- End report: optional feedback, then finish ----
      const endReport = () => {
        const box = display_element.querySelector("#cr-box");
        box.removeEventListener("mousemove", onBoxMove);
        box.removeEventListener("click", onBoxClick);
        box.style.cursor = "auto";
        curMove = curClick = null;

        if (trial.feedback && !ensemble) {
          drawProbe(trueColorCss, trueOrient); // reveal the true item
          display_element.querySelector("#cr-wheel").innerHTML = "";
          // Score the first response: with ranking that is the participant's best guess.
          const parts = [];
          let ok = true;
          if (wantColor && !isNaN(targetColorDeg)) {
            const e = Math.abs(colErr[0]); parts.push(`color off by ${e}&deg;`); ok = ok && e <= trial.feedback_threshold;
          }
          if (wantOrient && !isNaN(targetOrient)) {
            const e = Math.abs(oriErr[0]); parts.push(`orientation off by ${e}&deg;`); ok = ok && e <= trial.feedback_threshold;
          }
          setMsg(parts.join("; "));
          U.feedbackCues(ok, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(finish, 1200);
        } else {
          finish();
        }
      };

      const finish = () => {
        // Record every item presented, for swap/interference analyses.
        const stimuli_shown = [];
        for (let i = 0; i < setSize; i++) {
          // Gabors and gratings are achromatic, so they have no color to record.
          const entry = { position: pos[i], color: grating ? null : colorSpecs[i], orientation: showsOrient ? modP(orientDegs[i]) : null };
          if (!isNaN(colorDegs[i])) entry.degree = colorDegs[i]; // numeric wheel hue when available
          if (grating) entry.phase = itemPhases[i]; // the grating phase this item was drawn with
          stimuli_shown.push(entry);
        }
        const data = {
          rt: trial.report_order === "orientation_first" ? oriRt.concat(colRt) : colRt.concat(oriRt),
          mouse_hold_duration: trial.report_order === "orientation_first" ? oriHold.concat(colHold) : colHold.concat(oriHold),
          error: colErr,
          reported_degree: colRep,
          target_degree: isNaN(targetColorDeg) ? null : targetColorDeg,
          orientation_error: oriErr,
          reported_orientation: oriRep.map(modP),
          target_orientation: isNaN(targetOrient) ? null : modP(targetOrient),
          orientation_period: oriPeriod,
          stimuli: colorSpecs,
          orientations: showsOrient ? orientDegs.map(modP) : null,
          positions: pos,
          which_test: whichTest,
          set_size: setSize,
          report: trial.report,
          item_shape: shape,
          wheel_spin: wheelSpin,
          num_choices: trial.num_choices,
          actual_stim_duration: actualStimDuration, // measured array on-screen time (ms)
          stimuli_shown: stimuli_shown,
          target_index: whichTest, // index into stimuli_shown / item arrays of the probed item (-1 = ensemble)
        };
        if (grating) data.probe_phase = probePhase;
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Layout in the same frame as mouse_trajectory: logical px from the box centre,
          // independent of auto_zoom, built from the plugin's own layout numbers rather
          // than getBoundingClientRect (which is zoomed). It describes the reported
          // dimension: the color wheel (value at value+wheelSpin+offset), or for
          // report:"orientation" the orientation circle (spin/offset 0). report:"both"
          // gets the color wheel; `dimension` says which.
          const useOrient = !wantColor; // report === "orientation"
          const wheelVals = useOrient ? orientDegs.map((o) => (showsOrient ? o : NaN)) : colorDegs;
          const wSpin = useOrient ? 0 : wheelSpin;
          const wOff = useOrient ? 0 : trial.wheel_option_offset;
          const tgtVal = useOrient ? targetOrient : targetColorDeg;
          const geomItems = [];
          const wheelPts = [];
          for (let i = 0; i < setSize; i++) {
            const p = pos[i];
            // Same placeholder formula as the HTML above.
            const top = Math.cos((2 * Math.PI * p) / numPh) * trial.radius + center - isz / 2;
            const left = Math.sin((2 * Math.PI * p) / numPh) * trial.radius + center - isz / 2;
            const isTarget = i === whichTest; // false for every item in ensemble (whichTest = -1)
            // Non-degree colors (CSS strings) have no wheel position: null, never NaN.
            const v = isNaN(wheelVals[i]) ? null : wheelVals[i];
            geomItems.push({ index: i, position: p, value: v, target: isTarget, x: left - center, y: top - center, w: isz, h: isz });
            const wp = v === null ? { x: null, y: null } : U.wheelPoint(0, 0, wheelRadius, v, wSpin, wOff);
            wheelPts.push({ index: i, value: v, target: isTarget, x: wp.x, y: wp.y });
          }
          const tp = isNaN(tgtVal) ? null : U.wheelPoint(0, 0, wheelRadius, tgtVal, wSpin, wOff);
          data.mouse_geometry = {
            units: "logical px from stage centre",
            dimension: useOrient ? "orientation" : "color",
            box: boxSize,
            items: geomItems,
            wheel: { cx: 0, cy: 0, radius: wheelRadius },
            wheel_points: wheelPts,
            target_point: tp ? { value: tgtVal, x: tp.x, y: tp.y } : null,
          };
        }
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // experimenter's fields win on key collision
        finishOnce(data);
      };

      const clearItem = (el) => el.getContext("2d").clearRect(0, 0, isz, isz);

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) display_element.querySelector("#cr-fixation").addEventListener("click", start);
      else start();
    }
  }
  ContinuousReportPlugin.info = info;

  // ===== module-private helpers =====
  // n random wheel degrees, at least minDiff apart. With span < 360 they fall in a
  // random arc that wide (minDiff shrinks to span/n if needed to fit), so an
  // ensemble mean is meaningful.
  function genColors(n, minDiff, span, wheel) {
    if (!span || span >= 360) return window.BradyUtils.randomColorDegrees(n, minDiff);
    var U2 = window.BradyUtils, base = U2.randInt(0, 359);
    var md = Math.min(minDiff, Math.floor(span / Math.max(n, 1)));
    var out = [], guard = 0;
    while (out.length < n && guard++ < 10000) {
      var cand = U2.wrap360(base + Math.random() * span);
      if (out.every(function (c) { return Math.abs(U2.angleDiff(cand, c)) >= md; })) out.push(Math.round(cand));
    }
    while (out.length < n) out.push(Math.round(U2.wrap360(base + Math.random() * span)));
    return out;
  }
  // Draw an item on its (square) canvas: a filled disk, an oriented bar (line),
  // an oriented triangle (tip points along `orientDeg`), or an achromatic Gabor/grating
  // (shared painter, BradyUtils.drawGrating; `grating` = resolved options with this
  // drawing's phase; `css` is ignored). 0deg = right, +cw.
  function drawItem(canvas, shape, css, orientDeg, lineWidth, grating) {
    const s = canvas.width;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, s, s);
    if (U.isGratingShape(shape)) {
      U.drawGrating(ctx, shape, orientDeg, s, grating);
      return;
    }
    ctx.save();
    ctx.translate(s / 2, s / 2);
    if (shape === "disk") {
      // Fill the whole canvas; the element's border-radius:50% clips it to a circle
      // that meets the CSS border, so the disk covers the placeholder ring.
      ctx.fillStyle = css;
      ctx.fillRect(-s / 2, -s / 2, s, s); // origin is at the centre
    } else {
      ctx.rotate((orientDeg * Math.PI) / 180);
      ctx.fillStyle = css;
      if (shape === "line") {
        const len = s * 0.92, w = lineWidth;
        ctx.fillRect(-len / 2, -w / 2, len, w);
      } else if (shape === "triangle") {
        const r = s * 0.46;
        ctx.beginPath();
        ctx.moveTo(r, 0);            // tip along the orientation
        ctx.lineTo(-r * 0.75, r * 0.62);
        ctx.lineTo(-r * 0.75, -r * 0.62);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  // Draw the display-only color wheel (pointer-events:none) as a thick ring in `el`.
  // A continuous wheel (num_choices >= 360) is 360 one-degree wedges; a quantized
  // wheel is num_choices wedges centred on anchor + k*360/num_choices. Placement
  // matches the readback: value `deg` sits at screen angle deg+spin+offset
  // (x = cos, y = sin, y down).
  function drawColorWheel(el, wheelRadius, center, numChoices, spin, offset, wheel, anchor) {
    anchor = anchor || 0;
    const band = 28;
    const inner = wheelRadius - band / 2;
    const outer = wheelRadius + band / 2;
    const size = Math.ceil(outer * 2) + 4;
    const cv = document.createElement("canvas");
    cv.width = size; cv.height = size;
    cv.style.cssText =
      `position:absolute;pointer-events:none;top:${center - size / 2}px;left:${center - size / 2}px`;
    const ctx = cv.getContext("2d");
    const cc = size / 2;
    const slices = numChoices >= 360 ? 360 : numChoices;
    const sw = 360 / slices; // wedge width (deg)
    // Overlap adjacent wedges by ~0.7 deg so anti-aliased seams don't show as
    // thin stripes.
    const pad = (0.7 * Math.PI) / 180;
    for (let k = 0; k < slices; k++) {
      const deg = anchor + k * sw;
      const posDeg = deg + spin + offset;
      const a0 = ((posDeg - sw / 2) * Math.PI) / 180 - pad;
      const a1 = ((posDeg + sw / 2) * Math.PI) / 180 + pad;
      ctx.beginPath();
      ctx.arc(cc, cc, outer, a0, a1);
      ctx.arc(cc, cc, inner, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wheel.css(deg);
      ctx.fill();
    }
    // thin gray edges so the ring reads as a wheel
    ctx.lineWidth = 1; ctx.strokeStyle = "#888";
    ctx.beginPath(); ctx.arc(cc, cc, outer, 0, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(cc, cc, inner, 0, 2 * Math.PI); ctx.stroke();
    el.innerHTML = "";
    el.appendChild(cv);
  }

  // Signed color error a - b in (-180, 180], rounded.
  function signedErr(a, b) { return Math.round(U.circularDiff(a, b, 360)); }
  // Signed error a - b on a circle of period P (180 for lines/Gabors/gratings, 360 for triangles), rounded.
  function errMod(a, b, P) { return Math.round(U.circularDiff(a, b, P)); }

  return ContinuousReportPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-continuous-image-report.js */
/* ===================================================================== */
/*
 * jspsych-continuous-image-report.js  --  jsPsych v8 plugin
 *
 * Continuous image report: delayed estimation on a circular morph wheel (faces,
 * objects, any morph circle). The image counterpart of
 * jspsych-continuous-report.js, which does color. A memory array of morph frames
 * is shown, then a blank delay, then one location is probed; the participant
 * moves around a response wheel (each position is a morph degree) and clicks.
 * Error is in degrees around the morph circle.
 *
 * Sprite format:
 *   `image_sprite` is one horizontal strip of `num_frames` equal-width frames
 *   (default 360). Morph degree d maps to frame round(d/360 * num_frames) mod
 *   num_frames, so the last frame wraps back to frame 0 at the seam. It is drawn
 *   with background-size (num_frames*100)% 100% and background-position
 *   frame/(num_frames-1)*100% 0%. Alternatively pass `frames` (one image URL per
 *   morph step); each frame is then drawn from its own URL.
 *
 * Key options:
 *   num_choices < 360       -- quantized wheel, grid anchored on the target
 *   spin_wheel / wheel_option_offset -- rotate the response wheel (random per trial /
 *                              fixed); the item placeholders do not move
 *   num_previews            -- morph thumbnails around the outside of the wheel
 *   precue_time > 0         -- spatial pre-cue before the array;
 *                              retrocue_time > 0 -- retro-cue after the delay
 *   noise_level / noise_type -- degrade the items at encoding (kinds in
 *                              BradyUtils.noiseKinds; add more with registerNoise)
 *   mask_time / mask_type   -- mask the occupied locations at array offset, before the delay (kinds in
 *                              BradyUtils.maskKinds; add more with registerMask)
 *   sequential              -- show the items one at a time
 *   do_test:false           -- encoding-only trial
 *   mode:"perception"       -- array stays up, report on a centre probe, no delay
 *   which_test:-1           -- ensemble (centre probe; scored against the circular mean
 *                              of the item degrees, as in continuous-report)
 *   responses_per_item > 1  -- ranking
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag). The color wheel is only used by color-based
 * noise/mask kinds.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychContinuousImageReport = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "continuous-image-report",
    version: version,
    parameters: {
      /** URL of the morph sprite: one horizontal strip of `num_frames` equal-width frames,
       *  frame 0 at the left. */
      image_sprite: { type: jspsych.ParameterType.IMAGE, default: null },
      /** Number of frames in the sprite strip (the morph-circle resolution). Degree d shows
       *  frame round(d/360 * num_frames) mod num_frames. */
      num_frames: { type: jspsych.ParameterType.INT, default: 360 },
      /**
       * Alternative to `image_sprite`: an array of image URLs, one per morph
       * step. If non-empty it overrides the sprite and `num_frames` (the frame
       * count becomes the array length).
       */
      frames: { type: jspsych.ParameterType.IMAGE, array: true, default: [] },
      /**
       * Item morph values as wheel degrees (0..359). If empty, `set_size` random
       * morph degrees at least `min_color_distance` apart are generated.
       */
      item_values: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Number of items to auto-generate when `item_values` is empty. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated morph degrees. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 15 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the probed item; -1 = probe at center (ensemble: the target
       *  is the circular mean of the item degrees). */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Number of equally-spaced locations items can occupy. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Number of options on the response wheel (360 = one per degree; e.g. 12 = quantized).
       *  Options sit at target - k*360/num_choices, so the target is always an option
       *  (for ensemble the target is the circular mean; anchored on 0 only when that mean is
       *  undefined). Independent of num_frames. */
      num_choices: { type: jspsych.ParameterType.INT, default: 360 },
      /** Number of preview thumbnails shown outside the wheel (0 = none). */
      num_previews: { type: jspsych.ParameterType.INT, default: 24 },
      /** Rotate the response wheel by a random whole-degree offset each trial (reduces motor
       *  bias; recorded as wheel_spin). */
      spin_wheel: { type: jspsych.ParameterType.BOOL, default: false },
      /** Constant angular offset (deg) applied to the wheel option positions. */
      wheel_option_offset: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Number of responses to collect per item (>1 = ranking). Each rank must be a
       *  distinct option, so it is capped at num_choices. */
      responses_per_item: { type: jspsych.ParameterType.INT, default: 1 },
      /** How long (ms) the memory array is shown (0 = never shown). Ignored when sequential. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) before the probe/response wheel. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, highlight the to-be-probed location for this many ms; the array then follows
       *  after `delay_start`. Skipped in ensemble and perception, and when do_test is false
       *  (no probe to cue). */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, retro-cue: after the retention delay, highlight the
       *  to-be-probed location for this many ms before the response wheel. 0 = off.
       *  Skipped in ensemble and perception. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
       *  starting the moment the array goes off (a backward mask that cuts encoding
       *  off); the blank `delay_time` then runs in full. Not used in perception. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
       *  extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
       *  the `noise_type` degradation (a transparent overlay, removed when the array is
       *  hidden; in perception it stays for the whole trial). The centre probe is never noisy. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
       *  extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** If false, skip the test/response entirely (encoding-only trial). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** Show the correct morph and the error after responding (ranking: the correct morph
       *  only; the reward cue scores the first-ranked response). Not shown for ensemble. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct (small-error) response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Abs error (deg) at/under which a response counts "correct" for the reward cue. */
      feedback_threshold: { type: jspsych.ParameterType.INT, default: 20 },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** "memory" (array, delay, then the probed location) or "perception" (array stays up,
       *  no delay, and the response is made on a centre probe). */
      mode: { type: jspsych.ParameterType.STRING, default: "memory" },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#ffffff" },
      /** Text shown on the fixation while waiting to start the trial. */
      start_text: { type: jspsych.ParameterType.STRING, default: "Click the + to start this trial." },
      /** Optional HTML prompt shown beneath the stimulus box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the whole-trial mouse trajectory (off by default; no behavior change when off). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded mouse samples during non-response phases (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded mouse samples during the response phase (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time(s) (ms) from wheel onset to each click. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT, array: true },
      /** How long (ms) the mouse button was held for each committing click, in the same order as `rt`. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null for any click whose press could not be measured. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT, array: true },
      /** Signed error(s) in degrees (reported - target), wrapped to (-180,180] and rounded. For
       *  ensemble the target is the circular mean of the item degrees, so the error is
       *  reported - circular mean (BradyUtils.ensembleTarget, as in continuous-report); null
       *  only when that mean is undefined (the degrees cancel out). */
      error: { type: jspsych.ParameterType.INT, array: true },
      /** Reported morph degree(s): the option chosen on the wheel, in rank order. FLOAT: not a
       *  whole degree when 360/num_choices isn't one (e.g. num_choices 7); not rounded. */
      reported_degree: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Frame index shown for each reported degree (into the sprite strip or `frames`). */
      reported_frame: { type: jspsych.ParameterType.INT, array: true },
      /** Target morph degree of the probed item; for ensemble, the circular mean of the item
       *  degrees (FLOAT: need not be a whole degree), or null if that mean is undefined. */
      target_degree: { type: jspsych.ParameterType.FLOAT },
      /** Frame index of the probed item (for ensemble, the frame nearest the circular mean;
       *  null if that mean is undefined). */
      target_frame: { type: jspsych.ParameterType.INT },
      /** Item morph degrees presented. */
      stimuli: { type: jspsych.ParameterType.INT, array: true },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the probed item (-1 = ensemble/center). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Number of items in the array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Random wheel rotation (deg) applied this trial. */
      wheel_spin: { type: jspsych.ParameterType.INT },
      /** Number of options that appeared on the response wheel. */
      num_choices: { type: jspsych.ParameterType.INT },
      /** "memory" or "perception". */
      mode: { type: jspsych.ParameterType.STRING },
      /** Measured ms from the first item painted to the array being hidden (sequential: the
       *  whole sequence, gaps included). In perception the array is never hidden, so it is the
       *  time from array onset to the (last) response click; about 0 with do_test:false, and
       *  null when nothing was shown (display_time 0). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Every item presented: per-item {position, degree, frame}, plus `src` when `frames` is used. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown / item arrays of the probed item (-1 = ensemble). */
      target_index: { type: jspsych.ParameterType.INT },
      /** Recorded mouse trajectory samples (only when record_mouse). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory sample (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first mouse sample in the response phase (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before any pre-cue and delay_start; array: the memory array's onset (first item painted); mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset (absent in perception mode, where the array stays up); report: the wheel appears. Any retro-cue falls between delay and report. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Zoom factor applied to the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout geometry in the mouse-trajectory frame (only when record_mouse): item study boxes (top-left x,y and w,h), wheel centre/radius, each item's wheel point, and the target point (for ensemble, the circular mean of the item degrees; null if that is undefined). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
    },
  };

  class ContinuousImageReportPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      // Preload the sprite / frames so the first paint doesn't flicker, then run the
      // timer- and mouse-driven body. trial() stays synchronous and the body calls
      // finishTrial() later (CONVENTIONS section 3).
      const useFrames = trial.frames && trial.frames.length > 0;
      const toLoad = useFrames
        ? trial.frames.slice()
        : trial.image_sprite
        ? [trial.image_sprite]
        : [];
      U.loadImages(toLoad).then(() => this._run(display_element, trial, useFrames));
    }

    _run(display_element, trial, useFrames) {
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional whole-trial mouse tracker (created at cursor onset when record_mouse)
      let stimOnset = null;          // performance.now() when the array first painted
      let actualStimDuration = null; // measured ms the array was actually on screen

      // ---- Morph-frame resolution + drawing ----------------------------------
      // Degree -> frame index; a degree that rounds up to numFrames wraps to frame 0.
      const numFrames = useFrames ? trial.frames.length : trial.num_frames;
      const degToFrame = (deg) =>
        ((Math.round((U.wrap360(deg) / 360) * numFrames) % numFrames) + numFrames) % numFrames;

      // Paint a DOM element with the morph at degree `deg`. For the sprite, a
      // background-position of p% lines up the p% point of the strip with the p% point
      // of the element, so frame idx of N sits at idx/(N-1)*100%. (idx*100% would show
      // frame (N - idx) mod N: the strip tiles, so it lands on the mirror-image frame.)
      const setFrame = (el, deg) => {
        if (!el) return;
        const idx = degToFrame(deg);
        if (useFrames) {
          el.style.backgroundImage = `url('${trial.frames[idx]}')`;
          el.style.backgroundSize = "contain";
          el.style.backgroundRepeat = "no-repeat";
          el.style.backgroundPosition = "center";
        } else {
          el.style.backgroundImage = `url('${trial.image_sprite}')`;
          el.style.backgroundSize = `${numFrames * 100}% 100%`;
          el.style.backgroundPosition = `${numFrames > 1 ? (idx / (numFrames - 1)) * 100 : 0}% 0%`;
        }
      };
      const clearFrame = (el) => { if (el) el.style.backgroundImage = ""; };

      // ---- Resolve item morph degrees ----------------------------------------
      let degs =
        trial.item_values.length > 0
          ? trial.item_values.map((v) => U.wrap360(v))
          : U.randomColorDegrees(trial.set_size, trial.min_color_distance); // n angles >= minDiff apart
      const setSize = degs.length;

      // Warn (only) about silent stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "continuous-image-report", setSize: setSize, supportsEnsemble: true, values: degs,
        userItems: trial.item_values.length });
      U.checkParams(trial, { plugin: "continuous-image-report", setSize: setSize, positive: ["num_choices"], enums: { mode: ["memory", "perception"] } });

      // Clamp degenerate configs (the clamped which_test is the one logged): there must
      // be at least setSize placeholders (sampleWithoutReplacement throws otherwise),
      // and which_test must index a real item (-1 stays ensemble).
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots).
      // Clamped values live in locals (numPh, whichTest): trial is jsPsych's stored copy of the
      // parameters (save_trial_parameters reads it), so it is never modified.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "continuous-image-report", allowEnsemble: true });
      // Ranking asks for that many distinct options and there are only num_choices,
      // so cap it there; otherwise the trial could never finish.
      const effRpi = Math.max(1, Math.min(trial.responses_per_item, trial.num_choices));

      // ---- Item locations ----------------------------------------------------
      const pos = placed.pos;

      const ensemble = whichTest === -1;
      const perception = trial.mode === "perception";
      // Ensemble is scored against the circular mean of the item degrees (U.ensembleTarget,
      // shared with continuous-report and continuous-object-report).
      const targetDeg = ensemble ? U.ensembleTarget(degs) : U.wrap360(degs[whichTest]);
      // The response probe: in memory mode, the probed placeholder; in ensemble or
      // perception, the centre square (in perception the array stays up beside it).
      const useCenterProbe = ensemble || perception;

      // ---- Layout ------------------------------------------------------------
      const itemSize = trial.item_size;
      const wheelRadius = trial.radius + itemSize + 10;
      const showPreviews = trial.num_previews > 0;
      const previewSize = Math.round(itemSize * 0.8);
      const previewRadius = wheelRadius + Math.round(previewSize * 0.9) + 6;
      const outerR = showPreviews ? previewRadius + previewSize / 2 : wheelRadius + 12;
      const boxSize = Math.round(2 * outerR + 30);
      const center = boxSize / 2;

      let html =
        `<div id="cir-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - itemSize / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - itemSize / 2;
        html +=
          `<div id="cir-item-${i}" style="position:absolute;border:1px solid #ccc;user-select:none;` +
          `width:${itemSize}px;height:${itemSize}px;top:${top}px;left:${left}px"></div>`;
      }
      // centre square: the ensemble / perception response probe
      html +=
        `<div id="cir-item--1" style="position:absolute;border:1px solid #ccc;display:none;user-select:none;` +
        `width:${itemSize}px;height:${itemSize}px;` +
        `top:${center - itemSize / 2}px;left:${center - itemSize / 2}px"></div>` +
        `<span id="cir-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer;user-select:none">+</span>` +
        `<div id="cir-center" style="position:absolute;width:0;height:0;top:${center}px;left:${center}px"></div>` +
        `<div id="cir-message" style="position:absolute;top:14px;width:100%;text-align:center;user-select:none">${trial.start_text}</div>` +
        `<div id="cir-wheel"></div></div>`;
      if (trial.prompt) html += `<div id="cir-prompt" style="text-align:center;margin-top:10px">${trial.prompt}</div>`;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#cir-box"));

      const itemEl = (p) => display_element.querySelector(`#cir-item-${p}`);
      const probeEl = () => itemEl(useCenterProbe ? -1 : pos[whichTest]);
      const setMsg = (h) => (display_element.querySelector("#cir-message").innerHTML = h);

      // ---- Phases ------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#cir-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        fix.innerHTML = ""; // hide the "+" for the rest of the trial
        if (trial.record_mouse) {
          // Tracking starts here, at the visible start of the trial. seedCenter only
          // after a click on the centred fixation, when the cursor is known to be there.
          const t0 = performance.now();
          const rootBox = display_element.querySelector("#cir-box");
          mt = U.makeMouseTracker(rootBox, t0, { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter();
          mt.mark("encoding");
        }
        // Spatial pre-cue: a cue_color/cue_thickness ring on the to-be-probed placeholder.
        // Pre-cue (U.wantPrecue): only with a test to cue, and never in ensemble/perception.
        if (U.wantPrecue(trial) && !ensemble && !perception) {
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      // Live stimulus-noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const addNoise = (i) => {
        if (!(trial.noise_level > 0)) return;
        const p = pos[i];
        clearNoise(p);
        noiseRemovers[p] = U.noiseOverlay(itemEl(p), trial.noise_level, trial.noise_type, {});
      };

      const showArray = () => {
        if (perception) {
          // The array stays up and the wheel appears at once (no delay); with
          // do_test:false the trial ends here. Noise stays on the items while they are
          // up; the centre probe gets none. The array is never hidden, so finish()
          // records actual_stim_duration as onset -> response.
          if (trial.display_time > 0) {
            stimOnset = performance.now();
            if (mt) mt.mark("array");
            for (let i = 0; i < setSize; i++) { setFrame(itemEl(pos[i]), degs[i]); addNoise(i); }
          }
          trial.do_test ? showWheel() : finish([], [], [], [], []);
          return;
        }
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => { if (stimOnset === null) { stimOnset = performance.now(); if (mt) mt.mark("array"); } setFrame(itemEl(pos[i]), degs[i]); addNoise(i); }, // onset = first item painted
          clear: (i) => { clearNoise(pos[i]); clearFrame(itemEl(pos[i])); },
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        const hideTime = performance.now();
        if (stimOnset !== null) actualStimDuration = Math.round(hideTime - stimOnset);
        for (let i = 0; i < setSize; i++) { clearNoise(pos[i]); clearFrame(itemEl(pos[i])); }
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          if (mt) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(trial.do_test ? beginProbe : () => finish([], [], [], [], []), trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time = 0 or do_test:false.
        if (trial.mask_time > 0 && trial.do_test) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, {}));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue after the delay: the same ring as the pre-cue on
      // the probed placeholder for retrocue_time ms, then the wheel. Skipped when
      // retrocue_time = 0 and in ensemble. (Perception never reaches here.)
      const beginProbe = () => {
        if (trial.retrocue_time > 0 && !ensemble && !perception) {
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            showWheel();
          }, trial.retrocue_time);
        } else {
          showWheel();
        }
      };

      // ---- Response wheel ----------------------------------------------------
      const wheelSpin = trial.spin_wheel ? U.randInt(0, 359) : 0;
      let wheelStart = null;
      let prevNearest = -1;
      let optionDegs = [];
      let dotEls = [];

      // The response is read from the pointer angle (the exact inverse of the dot
      // placement) and snapped to the nearest option. The dots are display-only
      // (pointer-events:none), so clicks are uniform around the ring with no seam bias.
      const showWheel = () => {
        // Selectable morph degrees: target - k*step, so the target is always an option
        // (matters when quantized). For ensemble the target is the circular mean; the grid is
        // anchored on 0 only when that mean is undefined.
        const step = 360 / trial.num_choices;
        const st = isNaN(targetDeg) ? 0 : targetDeg;
        optionDegs = [];
        for (let k = 0; k < trial.num_choices; k++) optionDegs.push(U.wrap360(st - k * step));

        const dot = Math.max(10, Math.min(40, Math.round((2 * Math.PI * wheelRadius) / trial.num_choices) - 2));

        let wh =
          `<div style="position:absolute;pointer-events:none;border:2px solid gray;border-radius:50%;` +
          `width:${wheelRadius * 2}px;height:${wheelRadius * 2}px;` +
          `top:${center - wheelRadius}px;left:${center - wheelRadius}px"></div>`;
        optionDegs.forEach((deg, k) => {
          const posDeg = U.wrap360(deg + wheelSpin + trial.wheel_option_offset);
          const top = center + wheelRadius * Math.sin((posDeg / 180) * Math.PI) - dot / 2;
          const left = center + wheelRadius * Math.cos((posDeg / 180) * Math.PI) - dot / 2;
          wh +=
            `<div class="cir-choice" data-k="${k}" style="position:absolute;pointer-events:none;` +
            `border-radius:50%;background:#888;z-index:5;width:${dot}px;height:${dot}px;` +
            `top:${top}px;left:${left}px"></div>`;
        });

        // Preview thumbnails outside the wheel: evenly spaced morphs, placed with the
        // same angle formula as the options.
        if (showPreviews) {
          const pstep = 360 / trial.num_previews;
          for (let d = 0; d < 360; d += pstep) {
            const posDeg = U.wrap360(d + wheelSpin + trial.wheel_option_offset);
            const top = center + previewRadius * Math.sin((posDeg / 180) * Math.PI) - previewSize / 2;
            const left = center + previewRadius * Math.cos((posDeg / 180) * Math.PI) - previewSize / 2;
            wh +=
              `<div class="cir-preview" data-deg="${d}" style="position:absolute;pointer-events:none;z-index:1;` +
              `width:${previewSize}px;height:${previewSize}px;top:${top}px;left:${left}px"></div>`;
          }
        }
        const wheelDiv = display_element.querySelector("#cir-wheel");
        wheelDiv.innerHTML = wh;
        if (showPreviews) {
          wheelDiv.querySelectorAll(".cir-preview").forEach((p) => setFrame(p, +p.dataset.deg));
        }
        dotEls = Array.from(wheelDiv.querySelectorAll(".cir-choice"));

        // Show / mark the probe.
        const probe = probeEl();
        if (useCenterProbe) probe.style.display = "block";
        probe.style.border = "5px solid #000";

        if (mt) { mt.mark("report"); mt.setValueFn((e) => optionDegs[nearestIdx(e)]); }
        wheelStart = performance.now();
        const box = display_element.querySelector("#cir-box");
        box.style.cursor = "crosshair";
        box.addEventListener("mousemove", onMove);
        box.addEventListener("click", onClick);
      };

      // Index of the option nearest the pointer angle.
      const nearestIdx = (e) => {
        const cont = U.wheelDegreeFromPointer(
          display_element.querySelector("#cir-center"), e.clientX, e.clientY, wheelSpin, trial.wheel_option_offset
        );
        let best = 0, bestD = 999;
        for (let k = 0; k < optionDegs.length; k++) {
          const d = Math.abs(U.angleDiff(cont, optionDegs[k]));
          if (d < bestD) { bestD = d; best = k; }
        }
        return best;
      };

      const onMove = (e) => {
        const k = nearestIdx(e);
        setFrame(probeEl(), optionDegs[k]);
        if (prevNearest >= 0 && prevNearest !== k && dotEls[prevNearest]) {
          dotEls[prevNearest].style.border = "";
          dotEls[prevNearest].style.zIndex = 5;
        }
        if (dotEls[k]) { dotEls[k].style.border = "2px solid #000"; dotEls[k].style.zIndex = 10; }
        prevNearest = k;
      };

      const rts = [], reported = [], reportedFrames = [], errors = [], holds = [];
      // Ranking: option indices already chosen, so each rank is a distinct option.
      const chosenOptions = new Set();
      const onClick = (e) => {
        // Read the hold first: every click must consume its own press, even an
        // ignored one, or the next click would claim a stale duration.
        const hold = U.mouseHoldDuration();
        if (mt) mt.sample(e);
        const k = nearestIdx(e);
        // Ignore a click on an already-ranked option (ranking only).
        if (effRpi > 1 && chosenOptions.has(k)) return;
        const deg = optionDegs[k];
        holds.push(hold);
        rts.push(Math.round(performance.now() - wheelStart));
        reported.push(deg);
        reportedFrames.push(degToFrame(deg));
        errors.push(isNaN(targetDeg) ? null : signedErr(deg, targetDeg));

        if (reported.length < effRpi) {
          // Ranking: number this option's dot and keep collecting.
          chosenOptions.add(k);
          if (dotEls[k]) {
            dotEls[k].style.background = "#000";
            dotEls[k].innerHTML = `<span style="color:#fff;font-size:9pt">${reported.length}</span>`;
          }
          return;
        }

        const box = display_element.querySelector("#cir-box");
        box.removeEventListener("mousemove", onMove);
        box.removeEventListener("click", onClick);
        box.style.cursor = "auto";
        if (perception && stimOnset !== null) actualStimDuration = Math.round(performance.now() - stimOnset); // onset -> response

        if (trial.feedback && !ensemble) {
          setFrame(probeEl(), targetDeg);
          if (effRpi === 1) {
            setMsg(`You were off by ${Math.abs(errors[0])}&deg;`);
          } else {
            setMsg("Correct answer is shown.");
          }
          // The reward cue counts an error within feedback_threshold as a win, scored on
          // the first response (with ranking, the participant's best guess).
          const correct = Math.abs(errors[0]) <= trial.feedback_threshold;
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(() => finish(rts, reported, reportedFrames, errors, holds), 1500);
        } else {
          finish(rts, reported, reportedFrames, errors, holds);
        }
      };

      // ---- Finish ------------------------------------------------------------
      const finish = (rt, rep, frames, err, hold) => {
        // Perception: the array stays up through the response, so its measured on-screen
        // time runs from onset to the last response click (stamped in onClick, before any
        // feedback); with do_test:false the trial ends at onset, so it is ~0.
        if (perception && stimOnset !== null && actualStimDuration === null) actualStimDuration = Math.round(performance.now() - stimOnset);
        // Record every item presented, for swap/interference analyses: placeholder,
        // morph degree, frame index, and with `frames` the URL of that frame.
        const stimuli_shown = [];
        for (let i = 0; i < setSize; i++) {
          const entry = { position: pos[i], degree: degs[i], frame: degToFrame(degs[i]) };
          if (useFrames) entry.src = trial.frames[degToFrame(degs[i])];
          stimuli_shown.push(entry);
        }
        const data = {
          rt: rt,
          mouse_hold_duration: hold,
          error: err,
          reported_degree: rep,
          reported_frame: frames,
          target_degree: isNaN(targetDeg) ? null : targetDeg,
          target_frame: isNaN(targetDeg) ? null : degToFrame(targetDeg),
          stimuli: degs,
          positions: pos,
          which_test: whichTest,
          set_size: setSize,
          wheel_spin: wheelSpin,
          num_choices: trial.num_choices,
          mode: trial.mode,
          actual_stim_duration: actualStimDuration, // measured array on-screen time (ms)
          stimuli_shown: stimuli_shown,
          target_index: whichTest, // index into stimuli_shown / item arrays of the probed item (-1 = ensemble)
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Layout in the same frame as mouse_trajectory: logical px from the #cir-box
          // centre, independent of auto_zoom. Item boxes use the placeholder formula from
          // the HTML; wheel points use the option placement (value v at
          // v + wheelSpin + wheel_option_offset), the inverse of nearestIdx's readback.
          const geomItems = [];
          for (let i = 0; i < setSize; i++) {
            const p = pos[i];
            const top = Math.cos((2 * Math.PI * p) / numPh) * trial.radius + center - itemSize / 2;
            const left = Math.sin((2 * Math.PI * p) / numPh) * trial.radius + center - itemSize / 2;
            geomItems.push({
              index: i,
              position: p,
              value: degs[i],
              target: !ensemble && i === whichTest,
              x: left - center,
              y: top - center,
              w: itemSize,
              h: itemSize,
            });
          }
          const wheelPoints = degs.map((v, i) => {
            const pt = U.wheelPoint(0, 0, wheelRadius, v, wheelSpin, trial.wheel_option_offset);
            return { index: i, value: v, target: !ensemble && i === whichTest, x: pt.x, y: pt.y };
          });
          let targetPoint = null;
          if (!isNaN(targetDeg)) {
            const pt = U.wheelPoint(0, 0, wheelRadius, targetDeg, wheelSpin, trial.wheel_option_offset);
            targetPoint = { value: targetDeg, x: pt.x, y: pt.y };
          }
          data.mouse_geometry = {
            units: "logical px from stage centre",
            box: boxSize,
            items: geomItems,
            wheel: { cx: 0, cy: 0, radius: wheelRadius },
            wheel_points: wheelPoints,
            target_point: targetPoint,
          };
        }
        if (trial.data) Object.assign(data, trial.data); // experimenter's fields win on key collision
        finishOnce(data);
      };

      // ---- Kick off ----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#cir-fixation").addEventListener("click", start);
      } else {
        start();
      }
    }
  }
  ContinuousImageReportPlugin.info = info;

  // Signed angular error a - b in (-180, 180], rounded.
  function signedErr(a, b) { return Math.round(U.circularDiff(a, b, 360)); }

  return ContinuousImageReportPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-continuous-object-report.js */
/* ===================================================================== */
/*
 * jspsych-continuous-object-report.js  --  jsPsych v8 plugin
 *                                          (name: "continuous-object-report")
 *
 * Continuous object-color report: delayed estimation with real-object photos, the
 * multi-item working-memory version of color-rotated-object's report mode. Each
 * photo in the memory array is hue-rotated in CIELAB by a per-item amount (its
 * "color"). After a retention delay one location is probed, and the participant
 * reports the remembered hue by moving around a response wheel, which recolors
 * the probe photo as the pointer moves; a click commits. Error is reported minus
 * true hue rotation of the probed object, in degrees.
 *
 * Key options:
 *   cue_items:true / precue_time > 0  -- highlight the probed location during / before
 *                                        the array; retrocue_time > 0 -- after the delay
 *   noise_level / noise_type          -- degrade the items at encoding (kinds in
 *                                        BradyUtils.noiseKinds; add more with registerNoise)
 *   mask_time / mask_type             -- mask the occupied locations at array offset, before the delay
 *                                        (kinds in BradyUtils.maskKinds; add more with registerMask)
 *   wheel_shows_object:true           -- ring options show the object recolored to each
 *                                        hue (default: plain gray swatches)
 *   wheel_colors:true                 -- ring options in the object's own mean hue
 *   num_choices < 360 / choice_degrees -- quantized (target-anchored) / explicit options
 *   spin_wheel / wheel_option_offset  -- rotate the wheel (random per trial / fixed)
 *   sequential                        -- show the items one at a time
 *   which_test:-1                     -- ensemble (probe shows item 0's photo; scored against
 *                                        the circular mean of the item hues, as in continuous-report)
 *   responses_per_item > 1            -- ranking
 *   do_test:false                     -- encoding-only trial
 *
 * The rotation is the same everywhere: (a,b) -> (a cos d - b sin d, a sin d + b cos d)
 * (BradyUtils.rotateCanvasHue / makeRecolorCache), and both leave near-neutral pixels
 * unrotated (BradyUtils.isNeutralLab), so the probe at degree d matches a memory item
 * whose item_colors entry is d pixel for pixel. The probe's per-pixel LAB is cached
 * once (makeRecolorCache), so live recoloring is fast.
 * Cross-origin photos are loaded with crossOrigin "anonymous" and pixel reads are
 * wrapped in try/catch; on a tainted canvas the photo is shown unrotated instead
 * of throwing.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychContinuousObjectReport = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "continuous-object-report",
    version: version,
    parameters: {
      /** One object photo used for every item that `stimuli` doesn't cover. */
      object_image: { type: jspsych.ParameterType.IMAGE, default: null },
      /** Per-item object photo URLs. Entry i overrides `object_image` for item i. */
      stimuli: { type: jspsych.ParameterType.IMAGE, array: true, default: [] },
      /**
       * Per-item hue rotations (degrees) applied in CIELAB: the items' "colors".
       * If empty, `set_size` rotations at least `min_color_distance` deg apart are
       * generated. Error is scored against these.
       */
      item_colors: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Number of items when neither `item_colors` nor `stimuli` fixes the count. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated item hue rotations. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 20 },
      /** Number of equally-spaced locations items can occupy. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each item (used for both width & height unless overridden). */
      item_size: { type: jspsych.ParameterType.INT, default: 100 },
      /** Item width (px); falls back to `item_size`. */
      stimulus_width: { type: jspsych.ParameterType.INT, default: null },
      /** Item height (px); falls back to `item_size`. */
      stimulus_height: { type: jspsych.ParameterType.INT, default: null },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the probed item; -1 = ensemble/center probe (the target is the
       *  circular mean of the item hues). */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },

      // ---- response wheel ----
      /** Number of options around the wheel (>= 360 = one per 360/num_choices deg from 0;
       *  e.g. 12 = quantized). A quantized grid sits at target + k*360/num_choices, so the
       *  target is always an option (for ensemble the target is the circular mean; the grid
       *  starts at 0 only when that mean is undefined). */
      num_choices: { type: jspsych.ParameterType.INT, default: 360 },
      /** Explicit list of option degrees (0..359) to show; overrides `num_choices` if non-empty.
       *  Not anchored on the target, so the target may not be an option. */
      choice_degrees: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Rotate the whole wheel by a random whole-degree offset each trial (reduces spatial/motor
       *  bias; recorded as wheel_spin). */
      spin_wheel: { type: jspsych.ParameterType.BOOL, default: false },
      /** Constant angular offset (deg) applied to the wheel option positions. */
      wheel_option_offset: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Responses to collect per item (>1 = ranking). Each rank must be a distinct option, so
       *  it is capped at the number of options. */
      responses_per_item: { type: jspsych.ParameterType.INT, default: 1 },
      /**
       * If true, each ring option is a small canvas showing the probed object
       * recolored to that option's hue rotation. If false, options are plain
       * swatches (gray, or see `wheel_colors`).
       */
      wheel_shows_object: { type: jspsych.ParameterType.BOOL, default: false },
      /**
       * If true, color the ring options with the probed object's own hues: its mean
       * chromatic CIELAB color rotated to each option's degree, so degree 0 is the
       * object's unrotated mean color rather than the color wheel's degree 0. Falls
       * back to the color_wheel / BradyColorWheel spectrum if the photo's pixels
       * can't be read (missing or cross-origin). Ignored when wheel_shows_object is true.
       */
      wheel_colors: { type: jspsych.ParameterType.BOOL, default: false },

      // ---- encoding cue ----
      /** If true, outline the probed item's location for as long as the array is shown. */
      cue_items: { type: jspsych.ParameterType.BOOL, default: false },
      /** If > 0, highlight the to-be-probed location for this many ms; the array then follows
       *  after `delay_start`. Skipped in ensemble, and when do_test is false (no probe to cue). */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, retro-cue: after the retention delay, highlight the
       *  to-be-probed location for this many ms before the response wheel. 0 = off.
       *  Skipped in ensemble. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
       *  starting the moment the array goes off (a backward mask that cuts encoding
       *  off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
       *  extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
       *  the `noise_type` degradation (a transparent overlay, removed when the array is
       *  hidden). */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
       *  extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },

      // ---- timing ----
      /** How long (ms) the memory array is shown. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) before the probe/response wheel. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** Delay (ms) from start to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** If false, skip the test/response entirely (encoding-only trial). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },

      // ---- feedback ----
      /** After the final response, show the true color and the error of the first-ranked
       *  response. Not shown for ensemble. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Absolute error (deg) at/under which a response counts as "correct" for feedback cues. */
      feedback_threshold: { type: jspsych.ParameterType.INT, default: 20 },
      /** Play win/lose sound on feedback (via U.feedbackCues). */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct (small-error) response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound. */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound. */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },

      // ---- misc ----
      /** CSS border on every placeholder location ("none" = invisible); defaults to a
          visible box to show the spatial layout. */
      placeholder_border: { type: jspsych.ParameterType.STRING, default: "2px solid #ccc" },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Optional HTML shown beneath the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Color wheel (default window.BradyColorWheel). Not the reported dimension, which is
       *  hue rotation; used only for the wheel_colors fallback and color-based noise/mask kinds. */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },

      // ---- optional whole-trial mouse-trajectory recording ----
      /** If true, record the mouse trajectory for the whole trial (see U.makeMouseTracker). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded samples before the report phase (0 = keep every move). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded samples during the report phase (0 = keep every move). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time(s) (ms) from wheel onset to each click. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT, array: true },
      /** How long (ms) the mouse button was held for each committing click, in the same order as `rt`. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null for any click whose press could not be measured. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT, array: true },
      /** Signed error(s) in degrees (reported - target), wrapped to (-180,180] and rounded. For
       *  ensemble the target is the circular mean of the item hues, so the error is
       *  reported - circular mean (BradyUtils.ensembleTarget, as in continuous-report); null
       *  only when that mean is undefined (the hues cancel out). */
      error: { type: jspsych.ParameterType.INT, array: true },
      /** Reported hue rotation(s) (deg), in rank order: the option nearest the pointer at each
          click, so clicking the target option scores 0 error. Same values as reported_option.
          FLOAT: not a whole degree when 360/num_choices isn't one; not rounded. */
      reported_degree: { type: jspsych.ParameterType.FLOAT, array: true },
      /** The option degree(s) chosen (FLOAT, like reported_degree). */
      reported_option: { type: jspsych.ParameterType.FLOAT, array: true },
      /** True hue rotation (deg) of the probed item; for ensemble, the circular mean of the item
       *  hues (FLOAT: need not be a whole degree), or null if that mean is undefined. */
      target_degree: { type: jspsych.ParameterType.FLOAT },
      /** Per-item hue rotations (deg) presented. */
      item_colors: { type: jspsych.ParameterType.INT, array: true },
      /** Object photo URL used for each item. */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the probed item (-1 = ensemble). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Random wheel rotation (deg) applied this trial. */
      wheel_spin: { type: jspsych.ParameterType.INT },
      /** Number of items in the memory array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Number of options that were on the wheel. */
      num_choices: { type: jspsych.ParameterType.INT },
      /** Measured ms from the first item painted to the array being hidden (sequential: the
       *  whole sequence, gaps included). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Every item presented: per-item {position, src, degree}. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown / item arrays of the probed item (-1 = ensemble). */
      target_index: { type: jspsych.ParameterType.INT },
      /** Recorded mouse trajectory samples (only when record_mouse). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory sample (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first mouse sample in the response phase (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before any pre-cue and delay_start; array: the memory array's onset (first item painted); mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset; report: the probe and wheel appear. Any retro-cue falls between delay and report. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Zoom factor applied to the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout geometry in the mouse-trajectory frame (only when record_mouse): item study boxes (top-left x,y and w,h), wheel centre/radius, each item's wheel point, and the target point (for ensemble, the circular mean of the item hues). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class ContinuousObjectReportPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    // trial() stays synchronous (CONVENTIONS section 3): the body runs inside
    // loadImages(...).then(...) once the photos are loaded, and the trial ends
    // with finishTrial().
    trial(display_element, trial) {
      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const self = this;

      // ---- Resolve set size, item hue rotations, and per-item photo URLs ----
      let hues = (trial.item_colors || []).slice();
      let setSize;
      if (hues.length > 0) setSize = hues.length;
      else if (trial.stimuli.length > 0) setSize = trial.stimuli.length;
      else setSize = trial.set_size;
      if (hues.length === 0) hues = U.randomColorDegrees(setSize, trial.min_color_distance);
      hues = hues.map((d) => U.wrap360(d));

      const srcs = [];
      for (let i = 0; i < setSize; i++) {
        srcs.push(trial.stimuli[i] != null ? trial.stimuli[i] : trial.object_image);
      }

      // Preload every distinct photo (loadImages resolves on error too, so a missing
      // image can't hang the trial), then build and run.
      const unique = srcs.filter((s, i) => s != null && srcs.indexOf(s) === i);
      U.loadImages(unique, { needsPixel: true }).then((imgMap) => {
        self.run(display_element, trial, { setSize, hues, srcs, imgMap });
      });
    }

    run(display_element, trial, ctx) {
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional mouse-trajectory recorder (record_mouse)
      let stimOnset = null;          // performance.now() when the array first painted
      let actualStimDuration = null; // measured ms the array was actually on screen
      const { setSize, hues, srcs, imgMap } = ctx;

      const w = trial.stimulus_width || trial.item_size;
      const h = trial.stimulus_height || trial.item_size;
      const itemMax = Math.max(w, h);

      // Warn (only) about silent stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "continuous-object-report", setSize: setSize, supportsEnsemble: true, values: hues,
        userItems: Math.max((trial.item_colors || []).length, trial.stimuli.length) });
      U.checkParams(trial, { plugin: "continuous-object-report", setSize: setSize, positive: ["num_choices"] });

      // Clamp degenerate configs (the clamped which_test is the one logged): there must
      // be at least setSize placeholders (sampleWithoutReplacement throws otherwise),
      // and which_test must index a real item (-1 stays ensemble). The ranking cap
      // (effRpi) comes later, once the actual option list is known.
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots).
      // Clamped values live in locals (numPh, whichTest): trial is jsPsych's stored copy of the
      // parameters (save_trial_parameters reads it), so it is never modified.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "continuous-object-report", allowEnsemble: true });

      // ---- Item locations ----
      const pos = placed.pos;

      const ensemble = whichTest === -1;
      // Ensemble is scored against the circular mean of the item hues (U.ensembleTarget,
      // shared with continuous-report and continuous-image-report).
      const targetDeg = ensemble ? U.ensembleTarget(hues) : hues[whichTest];

      // ---- Layout (square box big enough for the item ring) ----
      const wheelRadius = trial.radius + itemMax + 10; // the wheel sits outside the placeholder ring
      const boxSize = 2 * wheelRadius + itemMax + 30;
      const center = boxSize / 2;
      const startText = trial.click_to_start
        ? "Click the + to start this trial.<br><span style='font-size:10pt'>Then move the mouse around the wheel to report the object's color; click to commit.</span>"
        : "";

      // ---- Build memory box DOM ----
      let html =
        `<div id="cor-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - h / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - w / 2;
        html +=
          `<canvas id="cor-item-${i}" width="${w}" height="${h}" ` +
          `style="position:absolute;width:${w}px;height:${h}px;top:${top}px;left:${left}px;border:${trial.placeholder_border};box-sizing:border-box"></canvas>`;
      }
      html +=
        `<span id="cor-fixation" style="position:absolute;font-size:16pt;cursor:pointer;` +
        `top:${center - 14}px;left:${center - 6}px">+</span>` +
        `<div id="cor-message" style="position:absolute;top:8px;width:100%;text-align:center">${startText}</div>` +
        // zero-size anchor at the box center; report children are positioned relative to it.
        `<div id="cor-report" style="position:absolute;top:${center}px;left:${center}px;width:0;height:0"></div>` +
        `</div>` +
        (trial.prompt ? `<div style="text-align:center;margin-top:12px">${trial.prompt}</div>` : "");
      display_element.innerHTML = html;

      const box = display_element.querySelector("#cor-box");
      if (trial.auto_zoom) U.autoZoom(box);

      const itemEl = (p) => display_element.querySelector(`#cor-item-${p}`);
      const setMsg = (s) => (display_element.querySelector("#cor-message").innerHTML = s);

      // ---- Phase: kick off -----------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#cor-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        // Tracking starts here, at the visible start of the trial and before any pre-cue.
        // seedCenter only after a click on the centred fixation, when the cursor is
        // known to be there.
        if (trial.record_mouse && !mt) {
          const t0 = performance.now();
          mt = U.makeMouseTracker(box, t0, {
            minInterval: trial.mouse_min_interval,
            responseMinInterval: trial.mouse_response_min_interval,
          });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter();
          mt.mark("encoding");
        }
        // Pre-cue (U.wantPrecue): only with a test to cue, and never in ensemble.
        if (U.wantPrecue(trial) && !ensemble) {
          // Pre-cue: a cue_color/cue_thickness ring on the to-be-probed location, then
          // delay_start, then the array.
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      // Live stimulus-noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };

      // ---- Phase: show the memory array (each item recolored by its hue) -------
      const paintMemItem = (i) => {
        if (stimOnset === null) { stimOnset = performance.now(); if (mt) mt.mark("array"); } // onset = first item painted
        const canvas = itemEl(pos[i]);
        const cctx = canvas.getContext("2d", { willReadFrequently: true });
        const img = imgMap[srcs[i]];
        if (img && img.naturalWidth > 0) {
          cctx.drawImage(img, 0, 0, w, h);
          U.rotateCanvasHue(cctx, w, h, hues[i]); // same rule as the probe: neutrals stay as drawn
        } else {
          cctx.fillStyle = "#bbbbbb";
          cctx.fillRect(0, 0, w, h);
        }
        // cue_items: outline the probed location while the array is up.
        if (trial.cue_items && !ensemble && pos[i] === pos[whichTest]) {
          canvas.style.outline = "6px solid #000";
        }
        // Stimulus noise on a transparent overlay.
        clearNoise(pos[i]);
        if (trial.noise_level > 0) {
          noiseRemovers[pos[i]] = U.noiseOverlay(canvas, trial.noise_level, trial.noise_type, { wheel: trial.color_wheel });
        }
      };
      const clearMemItem = (i) => {
        const c = itemEl(pos[i]);
        clearNoise(pos[i]);
        c.getContext("2d").clearRect(0, 0, w, h);
        c.style.outline = "";
      };
      const showArray = () => {
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: paintMemItem, clear: clearMemItem,
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      // ---- Phase: blank delay, then probe (or finish if encoding-only) --------
      const hideArray = () => {
        const hideTime = performance.now();
        if (stimOnset !== null) actualStimDuration = Math.round(hideTime - stimOnset);
        for (let i = 0; i < numPh; i++) {
          const c = itemEl(i);
          clearNoise(i);
          c.getContext("2d").clearRect(0, 0, w, h);
          c.style.outline = "";
        }
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          if (mt) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(trial.do_test ? beginProbe : () => finish([], [], [], [], []), trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time = 0 or do_test:false.
        if (trial.mask_time > 0 && trial.do_test) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, { wheel: trial.color_wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue after the delay: the same ring as the pre-cue on
      // the probed location for retrocue_time ms, then the wheel. Skipped when
      // retrocue_time = 0 and in ensemble.
      const beginProbe = () => {
        if (trial.retrocue_time > 0 && !ensemble) {
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            showWheel();
          }, trial.retrocue_time);
        } else {
          showWheel();
        }
      };

      // ---- Probe + response wheel ---------------------------------------------
      const wheelSpin = trial.spin_wheel ? U.randInt(0, 359) : 0;
      const offset = trial.wheel_option_offset;
      const reportDiv = display_element.querySelector("#cor-report");

      // Option degrees on the ring. A quantized wheel (num_choices < 360, no
      // choice_degrees) is anchored on the target hue, targetDeg + k*step, so the
      // correct value is always an option (true n-AFC); for ensemble that is the circular
      // mean. An undefined mean, num_choices >= 360, and explicit choice_degrees use the
      // absolute grid / list.
      let wheelOptions = [];
      if (trial.choice_degrees.length > 0) {
        wheelOptions = trial.choice_degrees.map((d) => U.wrap360(d));
      } else {
        const step = 360 / trial.num_choices;
        if (trial.num_choices < 360 && !isNaN(targetDeg)) {
          for (let k = 0; k < trial.num_choices; k++) wheelOptions.push(U.wrap360(targetDeg + k * step));
        } else {
          for (let d = 0; d < 360; d += step) wheelOptions.push(U.wrap360(d));
        }
      }
      // Cap ranking at the number of options (a chosen option can't be chosen again),
      // or a choice_degrees list shorter than responses_per_item would hang the trial.
      const effRpi = Math.max(1, Math.min(trial.responses_per_item, wheelOptions.length));

      // The probe photo (item 0's photo for ensemble).
      const probeSrc = ensemble ? srcs[0] : srcs[whichTest];
      const probeImg = imgMap[probeSrc];

      let redrawProbe = () => {}; // set in showWheel
      let detachMove = null;      // set in showWheel; finish() calls it

      const showWheel = () => {
        // Report phase: switch the tracker to the response-phase rate and record the
        // hovered hue (the unsnapped value the probe is recolored to).
        if (mt) {
          mt.mark("report");
          mt.setValueFn((e) =>
            U.wrap360(U.wheelDegreeFromPointer(reportDiv, e.clientX, e.clientY, 0, 0) - wheelSpin - offset)
          );
        }
        // Probe canvas centered on the report anchor.
        const probeCanvas = document.createElement("canvas");
        probeCanvas.id = "cor-probe";
        probeCanvas.width = w;
        probeCanvas.height = h;
        probeCanvas.style.cssText =
          `position:absolute;top:${-h / 2}px;left:${-w / 2}px;width:${w}px;height:${h}px`;
        reportDiv.appendChild(probeCanvas);
        const pctx = probeCanvas.getContext("2d", { willReadFrequently: true });

        // Recolor cache: recolors the probe on each pointer move; on a tainted
        // (cross-origin) canvas it shows the photo unrotated. objColorAt feeds the
        // wheel_colors swatches.
        const rc = U.makeRecolorCache(probeImg, w, h);
        const objColorAt = (deg) => (trial.wheel_colors ? rc.meanColorAt(deg) : null);
        redrawProbe = (deg) => rc.redraw(pctx, deg);
        redrawProbe(NaN); // start grayscale

        // Background ring.
        const ring = document.createElement("div");
        ring.style.cssText =
          `position:absolute;border:2px solid gray;border-radius:50%;` +
          `top:${-wheelRadius}px;left:${-wheelRadius}px;` +
          `width:${wheelRadius * 2}px;height:${wheelRadius * 2}px`;
        reportDiv.appendChild(ring);

        // Option swatches around the ring: display-only (pointer-events:none). Clicks
        // fall through to the box and are read from the pointer angle.
        const sw = trial.wheel_shows_object ? 55 : 20;
        const optionPositions = []; // on-screen angle of each option
        wheelOptions.forEach((deg) => {
          const posDeg = U.wrap360(deg + wheelSpin + offset);
          optionPositions.push(posDeg);
          const rad = (posDeg / 180) * Math.PI;
          const top = wheelRadius * Math.sin(rad) - sw / 2;
          const left = wheelRadius * Math.cos(rad) - sw / 2;
          let el;
          if (trial.wheel_shows_object) {
            el = document.createElement("canvas");
            el.width = sw; el.height = sw;
            const sctx = el.getContext("2d", { willReadFrequently: true });
            if (probeImg && probeImg.naturalWidth > 0) {
              sctx.drawImage(probeImg, 0, 0, sw, sw);
              U.rotateCanvasHue(sctx, sw, sw, deg); // recolor object to this hue
            } else {
              sctx.fillStyle = "gray"; sctx.fillRect(0, 0, sw, sw);
            }
          } else if (trial.wheel_colors) {
            el = document.createElement("div");
            // the object's own hue at this rotation, else the color wheel's.
            el.style.background = objColorAt(deg) || (trial.color_wheel || window.BradyColorWheel).css(deg);
            el.style.borderRadius = "50%";
          } else {
            el = document.createElement("div");
            el.style.background = "gray";
            el.style.borderRadius = "50%";
          }
          el.className = "cor-choice";
          el.dataset.deg = String(deg);
          el.style.position = "absolute";
          el.style.pointerEvents = "none";
          el.style.zIndex = "5";
          el.style.width = sw + "px";
          el.style.height = sw + "px";
          el.style.top = top + "px";
          el.style.left = left + "px";
          el.style.display = "flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.userSelect = "none";
          reportDiv.appendChild(el);
        });

        // ---- Live recolor + nearest-option highlight on mouse move ----
        // The screen angle is read around the zero-size centre anchor (#cor-report);
        // subtracting spin + offset inverts the option placement exactly, so the
        // recolor and the recorded option are what the pointer is at. A click
        // anywhere in the box commits the option nearest that angle, so clicks are
        // uniform around the ring with no seam bias.
        let responseAngle = 0; // screen angle (deg), before removing spin/offset
        let closestIdx = 0;
        let prevEl = null;
        // Ranking: option indices already chosen, so each rank is a distinct option.
        const chosenOptions = new Set();
        const updateAngle = (e) => {
          responseAngle = U.wheelDegreeFromPointer(reportDiv, e.clientX, e.clientY, 0, 0);
          redrawProbe(Math.round(U.wrap360(responseAngle - wheelSpin - offset)));

          let bestDiff = Infinity;
          for (let k = 0; k < optionPositions.length; k++) {
            const diff = Math.abs(U.angleDiff(optionPositions[k], responseAngle));
            if (diff < bestDiff) { bestDiff = diff; closestIdx = k; }
          }
          const choices = reportDiv.querySelectorAll(".cor-choice");
          const cur = choices[closestIdx];
          if (prevEl && prevEl !== cur && !prevEl.dataset.clicked) {
            prevEl.style.border = "none"; prevEl.style.zIndex = "5";
          }
          if (cur && !cur.dataset.clicked) { cur.style.border = "2px solid #000"; cur.style.zIndex = "10"; }
          prevEl = cur;
        };

        // ---- Collect response(s) ----
        const startTime = performance.now();
        const commit = (e) => {
          // Read the hold first: every click must consume its own press, even an
          // ignored one, or the next click would claim a stale duration.
          const hold = U.mouseHoldDuration();
          if (mt) mt.sample(e); // keep the committing point
          // Read the angle from the click itself, not the last mousemove, which may
          // be stale (no move before the click, touch input, synthetic clicks).
          updateAngle(e);
          const choices = reportDiv.querySelectorAll(".cor-choice");
          const chosenEl = choices[closestIdx];
          // Ignore a click on an already-ranked option (ranking only).
          if (effRpi > 1 && chosenOptions.has(closestIdx)) return;
          const repDeg = U.wrap360(responseAngle - wheelSpin - offset);
          const optDeg = chosenEl ? +chosenEl.dataset.deg : U.wrap360(Math.round(repDeg));
          holds.push(hold);
          rts.push(Math.round(performance.now() - startTime));
          // Score the chosen option, not the raw pointer angle, so clicking the target
          // option gives exactly 0 error (as in continuous-report / -image-report).
          reported.push(optDeg);
          options.push(optDeg);
          errors.push(isNaN(targetDeg) ? null : Math.round(U.angleDiff(optDeg, targetDeg)));

          // Ranking: mark the chosen option and keep collecting.
          if (reported.length < effRpi) {
            chosenOptions.add(closestIdx);
            if (chosenEl) {
              chosenEl.dataset.clicked = "1";
              chosenEl.style.border = "2px solid #000";
              chosenEl.style.zIndex = String(20 + reported.length);
              chosenEl.innerHTML = String(reported.length);
            }
            return;
          }

          // Final response: stop listeners.
          box.removeEventListener("mousemove", updateAngle);
          box.removeEventListener("click", commit);

          if (trial.feedback && !ensemble) {
            redrawProbe(targetDeg); // show the true color
            const firstErr = errors[0]; // with ranking, the participant's best guess
            setMsg(`You were off by ${Math.abs(firstErr)}&deg;`);
            U.feedbackCues(Math.abs(firstErr) <= trial.feedback_threshold, {
              sound: trial.feedback_sound,
              confetti: trial.feedback_confetti,
              sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound },
            });
            jsPsych.pluginAPI.setTimeout(() => finish(rts, reported, options, errors, holds), 1200);
          } else {
            jsPsych.pluginAPI.setTimeout(() => finish(rts, reported, options, errors, holds), 100);
          }
        };

        // Listeners go on the box (not document), so they are discarded with the
        // display element if the trial ends some other way.
        box.addEventListener("mousemove", updateAngle);
        box.style.cursor = "crosshair";
        box.addEventListener("click", commit);

        detachMove = () => {
          box.removeEventListener("mousemove", updateAngle);
          box.removeEventListener("click", commit);
        };
      };

      // ---- Finish -------------------------------------------------------------
      const rts = [], reported = [], options = [], errors = [], holds = [];
      const finish = (rt, rep, opt, err, hold) => {
        if (detachMove) detachMove();
        // Record every item presented, for swap/interference analyses: placeholder,
        // photo URL, and CIELAB hue rotation (deg).
        const stimuli_shown = [];
        for (let i = 0; i < setSize; i++) {
          stimuli_shown.push({ position: pos[i], src: srcs[i], degree: hues[i] });
        }
        const data = {
          rt: rt,
          mouse_hold_duration: hold,
          error: err,
          reported_degree: rep,
          reported_option: opt,
          target_degree: isNaN(targetDeg) ? null : targetDeg,
          item_colors: hues,
          stimuli: srcs,
          positions: pos,
          which_test: whichTest,
          wheel_spin: wheelSpin,
          set_size: setSize,
          num_choices: wheelOptions.length,
          actual_stim_duration: actualStimDuration, // measured array on-screen time (ms)
          stimuli_shown: stimuli_shown,
          target_index: whichTest, // index into stimuli_shown / item arrays of the probed item (-1 = ensemble)
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Layout in the same frame as mouse_trajectory: logical px from the box centre,
          // independent of auto_zoom, built from the plugin's own layout numbers rather
          // than getBoundingClientRect (which is zoomed).
          const geomItems = [];
          const wheelPts = [];
          for (let i = 0; i < setSize; i++) {
            const p = pos[i];
            // Same placeholder formula as the HTML above.
            const top = Math.cos((2 * Math.PI * p) / numPh) * trial.radius + center - h / 2;
            const left = Math.sin((2 * Math.PI * p) / numPh) * trial.radius + center - w / 2;
            const isTarget = i === whichTest; // false for all when ensemble (which_test = -1)
            geomItems.push({ index: i, position: p, value: hues[i], target: isTarget, x: left - center, y: top - center, w: w, h: h });
            // Where this item's hue sits on the wheel (same spin/offset as placement and readback).
            const wp = U.wheelPoint(0, 0, wheelRadius, hues[i], wheelSpin, offset);
            wheelPts.push({ index: i, value: hues[i], target: isTarget, x: wp.x, y: wp.y });
          }
          // Target hue: the probed item's hue, or the circular mean of all hues for ensemble
          // (the same target the error is scored against).
          const targetVal = targetDeg;
          const tp = isNaN(targetVal) ? null : U.wheelPoint(0, 0, wheelRadius, targetVal, wheelSpin, offset);
          data.mouse_geometry = {
            units: "logical px from stage centre",
            box: boxSize,
            items: geomItems,
            wheel: { cx: 0, cy: 0, radius: wheelRadius },
            wheel_points: wheelPts,
            target_point: tp ? { value: targetVal, x: tp.x, y: tp.y } : null,
          };
        }
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // experimenter's fields win on key collision
        finishOnce(data);
      };

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#cor-fixation").addEventListener("click", start);
      } else {
        start();
      }
    }
  }
  ContinuousObjectReportPlugin.info = info;

  return ContinuousObjectReportPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-color-rotated-object.js */
/* ===================================================================== */
/*
 * jspsych-color-rotated-object.js  --  jsPsych v8 plugin   (name: "color-rotated-object")
 *
 * Shows a single object image with its hue rotated in CIELAB space, for
 * "what is the real color of this object?" tasks. `mode` picks the behavior:
 *
 *   mode:"display"  -- show the recolored object until a key, a timeout, or both,
 *                      then end.
 *   mode:"report"   -- show the object in grayscale inside a ring of options. The
 *                      object recolors live to the ring option nearest the pointer,
 *                      and a click commits that option. responses_per_item > 1 makes
 *                      it a ranking task; spin_wheel randomizes where each hue sits.
 *
 * Sign convention: one CIELAB rotation (a' = a cos d - b sin d, b' = a sin d + b cos d)
 * recolors the display-mode image, the report-mode object and the previews, so a
 * report of d means "the object rotated by d", the same quantity as
 * color_rotation_deg. error = reported - target.
 *
 * The image loads asynchronously. If it fails to load the trial still runs, with a
 * gray fill in place of the object (0x0, so invisible, unless stimulus_width and
 * stimulus_height are given).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychColorRotatedObject = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "color-rotated-object",
    version: version,
    parameters: {
      /** Image URL of the object to display. */
      stimulus: { type: jspsych.ParameterType.IMAGE, default: undefined },
      /**
       * Hue rotation (degrees) applied to the object in CIELAB space.
       * - display mode: the rotation applied to the shown image (null/0 = none).
       * - report mode: the true rotation the response is scored against. If given,
       *   signed `error` (reported - target) is recorded and a quantized ring is
       *   anchored on it; if null, `error` entries are null.
       */
      color_rotation_deg: { type: jspsych.ParameterType.INT, default: null },
      /** Image width (px). Falls back to the image's natural width if null. */
      stimulus_width: { type: jspsych.ParameterType.INT, default: null },
      /** Image height (px). Falls back to the image's natural height if null. */
      stimulus_height: { type: jspsych.ParameterType.INT, default: null },
      /** Which behavior to run: "display" (study/present) or "report" (adjust on wheel). */
      mode: { type: jspsych.ParameterType.STRING, default: "display" },
      /** Optional HTML shown beneath the stimulus. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },

      // ---- display mode only ----
      /** Keys allowed to respond ("ALL_KEYS", "NO_KEYS", or an array like ["f","j"]). */
      choices: { type: jspsych.ParameterType.KEYS, default: "ALL_KEYS" },
      /** If true, any valid keypress ends the trial. */
      response_ends_trial: { type: jspsych.ParameterType.BOOL, default: true },
      /** How long (ms) until the stimulus is hidden (null = stays visible). */
      stimulus_duration: { type: jspsych.ParameterType.INT, default: null },
      /** How long (ms) until the trial ends on its own (null = wait for response). With
          choices "NO_KEYS" or response_ends_trial false, set this: otherwise the trial
          never ends (a console warning says so). */
      trial_duration: { type: jspsych.ParameterType.INT, default: null },

      // ---- report mode only ----
      /** Number of options around the ring (360 = one per degree). Below 360 the grid is
          anchored on color_rotation_deg, so the target is always an option; with no
          target it starts at 0. Ignored when choice_degrees is given. */
      num_choices: { type: jspsych.ParameterType.INT, default: 360 },
      /** Explicit list of option degrees (0..359) to show; overrides num_choices if non-empty. */
      choice_degrees: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Number of recolored object previews shown outside the ring (0 = none). Display
          only: not clickable, no effect on scoring. Each preview fits the object into a
          75x75 square at its own aspect ratio. */
      num_previews: { type: jspsych.ParameterType.INT, default: 24 },
      /** Rotate the whole ring by a random 0-359 deg each trial, so a hue has no fixed screen position. */
      spin_wheel: { type: jspsych.ParameterType.BOOL, default: false },
      /** Responses to collect per item (>1 = ranking task). */
      responses_per_item: { type: jspsych.ParameterType.INT, default: 1 },
      /** Background color of the report box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#ffffff" },
      /** After the final response, show the true color and the error for 1200 ms (needs color_rotation_deg). */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct (small-error) response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Abs error (deg) at/under which a report counts "correct" for the reward cue. */
      feedback_threshold: { type: jspsych.ParameterType.INT, default: 20 },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Color wheel object (default window.BradyColorWheel). Only used for the swatch colors
          when wheel_colors is on and the image's own colors can't be read (cross-origin). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * If true, color each ring swatch with the object's own mean chromatic CIELAB color
       * rotated to that option's degree, instead of plain gray. Degree 0 is then the
       * object's unrotated color, not the color wheel's degree 0. Falls back to the
       * color_wheel spectrum if the image can't be read (cross-origin).
       */
      wheel_colors: { type: jspsych.ParameterType.BOOL, default: false },

      // ---- optional mouse-trajectory recording ----
      /** If true, record the mouse trajectory from stimulus onset to the end of the trial (see U.makeMouseTracker). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded samples in display mode (0 = keep every move). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded samples in report mode (0 = keep every move). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Which mode ran ("display" | "report"). */
      mode: { type: jspsych.ParameterType.STRING },
      /** Stimulus image URL. */
      stimulus: { type: jspsych.ParameterType.STRING },
      /** Applied/true hue rotation (deg) for this trial. */
      color_rotation_deg: { type: jspsych.ParameterType.INT },
      /** Response times (ms): in report mode one per response, from report onset; in display mode a length-1 array from stimulus onset ([null] if no key). The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT, array: true },
      /** report: how long (ms) the mouse button was held for each committing click, parallel to `rt`. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. An entry is null if that press could not be measured; the whole field is null in display mode. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT, array: true },
      /** display: the key pressed (null if none). */
      response: { type: jspsych.ParameterType.STRING },
      /** display: how long (ms) the response key was held down (KeyDown to KeyUp), as a length-1 array parallel to `rt`. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (no key, key never released, window blurred) and in report mode. */
      key_hold_duration: { type: jspsych.ParameterType.INT, array: true },
      /** display: every key released during the trial: {key, t (ms from response onset), duration}. */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** display: true if a key other than the recorded response was also pressed (the standard RD exclusion criterion). Always false in report mode. */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** report: reported hue rotation(s) (deg, [0,360)): the ring option nearest the click, which is the hue the object showed at that moment. Can be fractional (a num_choices that doesn't divide 360, or fractional choice_degrees). */
      reported_degree: { type: jspsych.ParameterType.FLOAT, array: true },
      /** report: the ring option degree(s) committed (FLOAT, like reported_degree). Same values as reported_degree. */
      reported_option: { type: jspsych.ParameterType.FLOAT, array: true },
      /** report: raw on-screen pointer angle(s) at the click (deg, 0 = right, clockwise), before removing the wheel spin. */
      physical_angle: { type: jspsych.ParameterType.INT, array: true },
      /** report: signed error(s) (reported - target) in (-180,180], rounded; null entries if color_rotation_deg is null. */
      error: { type: jspsych.ParameterType.INT, array: true },
      /** report: random ring rotation (deg) applied this trial (0 unless spin_wheel). */
      wheel_spin: { type: jspsych.ParameterType.INT },
      /** report: number of options that were on the ring. */
      num_options: { type: jspsych.ParameterType.INT },
      /** display: measured ms the object was on screen (report mode: null). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Array (length 1) describing the shown object: its value (image src) and applied/true hue rotation. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown of the shown object (always 0). */
      target_index: { type: jspsych.ParameterType.INT },
      /** record_mouse: recorded mouse samples, each a [t, x, y, value] row (see mouse_trajectory_columns). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** record_mouse: column names for each mouse_trajectory row. */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** record_mouse: index into mouse_trajectory of the first report-phase sample (report mode). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at stimulus onset; no fixation click). Study mode: encoding and array, both 0 (tracking starts when the object appears). Report mode: report, 0 (tracking starts when the object and wheel appear). */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** record_mouse: CSS zoom/scale factor applied to the box when sampling (for un-zooming coords). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** record_mouse: layout in the mouse-trajectory frame (logical px from the box centre): the object's box and, in report mode, the ring centre/radius and the target's point on it (null when there is no target). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class ColorRotatedObjectPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    // trial() is synchronous (CONVENTIONS §3): the body runs once the image has
    // loaded, and the trial ends via finishTrial().
    trial(display_element, trial) {
      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const self = this;
      U.checkParams(trial, { plugin: "color-rotated-object", positive: ["num_choices"], enums: { mode: ["display", "report"] } });
      // Display mode ends on a key (when response_ends_trial) or on trial_duration. With
      // neither, the trial never ends, so say so.
      if (trial.mode !== "report" && trial.trial_duration == null) {
        const noKeys = trial.choices === "NO_KEYS" || (Array.isArray(trial.choices) && trial.choices.length === 0);
        if (noKeys || trial.response_ends_trial === false) {
          U.warnOnce("color-rotated-object", "display mode with " +
            (noKeys ? 'choices "NO_KEYS"' : "response_ends_trial false") +
            " and trial_duration null never ends. Set trial_duration, or allow a key that ends the trial.");
        }
      }
      loadImage(trial.stimulus).then((img) => {
        if (trial.mode === "report") {
          self.runReport(display_element, trial, img);
        } else {
          self.runDisplay(display_element, trial, img);
        }
      });
    }

    // ---- Display mode ------------------------------------------------------
    runDisplay(display_element, trial, img) {
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional mouse-trajectory recorder (record_mouse)
      const w = trial.stimulus_width || img.naturalWidth || 0;
      const h = trial.stimulus_height || img.naturalHeight || 0;
      const rot = trial.color_rotation_deg || 0;

      // Draw the (optionally) hue-rotated object onto a canvas.
      const canvas = document.createElement("canvas");
      canvas.id = "cro-canvas";
      canvas.width = w;
      canvas.height = h;
      // willReadFrequently, like the probe's recolor cache, so both draw the photo through
      // the same (CPU) canvas path and match pixel for pixel at the same rotation.
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, w, h);
        if (rot) U.rotateCanvasHue(ctx, w, h, rot);
      } else {
        // Image failed to load: gray fill so the trial still runs.
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(0, 0, w, h);
      }

      const box = document.createElement("div");
      box.id = "cro-box";
      box.style.textAlign = "center";
      box.appendChild(canvas);
      if (trial.prompt) {
        const p = document.createElement("div");
        p.innerHTML = trial.prompt;
        box.appendChild(p);
      }
      display_element.innerHTML = "";
      display_element.appendChild(box);
      // onset for actual_stim_duration
      const stimOnset = performance.now();
      let stimHideTime = null;
      if (trial.auto_zoom) U.autoZoom(box);

      // Mouse recording starts at stimulus onset (no fixation click, so no seedCenter).
      if (trial.record_mouse) {
        const t0 = performance.now();
        mt = U.makeMouseTracker(box, t0, {
          minInterval: trial.mouse_min_interval,
          responseMinInterval: trial.mouse_response_min_interval,
        });
        mt.attach();
        mt.mark("encoding");
        mt.mark("array"); // the object is on screen from the start
      }

      // ---- Response handling ----
      const response = { rt: null, key: null };
      let keyboardListener = null;
      let keyHold = null; // ms the response key was held (set once it is released)
      let ended = false;  // trial_duration can fire during the keyup wait; end only once

      const end_trial = () => {
        if (ended) return;
        ended = true;
        jsPsych.pluginAPI.clearAllTimeouts();
        if (keyboardListener) jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
        const data = {
          mode: "display",
          stimulus: trial.stimulus,
          color_rotation_deg: trial.color_rotation_deg,
          rt: [response.rt], // length-1 array, same shape as report mode
          mouse_hold_duration: null, // report mode only
          response: response.key,
          ...U.keyHoldData(keyHold, response.key, trial.choices !== "NO_KEYS" ? U.endPressLog() : null),
          // rt is a length-1 array, so the hold is too (CONVENTIONS §11). Overrides
          // keyHoldData's scalar.
          key_hold_duration: keyHold == null ? null : [keyHold],
          // report-mode fields, null here so both modes have the same columns
          reported_degree: null, reported_option: null, physical_angle: null,
          error: null, wheel_spin: null, num_options: null,
          // the one object shown, with its applied hue rotation
          stimuli_shown: [{ value: trial.stimulus, rotation: trial.color_rotation_deg }],
          target_index: 0,
          // on-screen time: to the hide point, or to trial end if never hidden
          actual_stim_duration: Math.round((stimHideTime !== null ? stimHideTime : performance.now()) - stimOnset),
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Logical px from the box centre. One centred object, no wheel.
          data.mouse_geometry = {
            units: "logical px from stage centre",
            box: null,
            items: [{
              index: 0,
              position: 0,
              value: trial.color_rotation_deg,
              target: true,
              x: -w / 2,
              y: -h / 2,
              w: w,
              h: h,
            }],
            wheel: null,
            wheel_points: null,
            target_point: null,
          };
        }
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      const after_response = (info2) => {
        if (response.key === null) {
          response.rt = Math.round(info2.rt);
          response.key = info2.key;
        }
        // getKeyboardResponse fires on keydown, so wait for the keyup before ending.
        // rt is stamped at keydown; a key that is never released resolves null after
        // the 5 s timeout (CONVENTIONS §11).
        U.awaitKeyUp(info2.key).then(finishOnce.guard((hold) => {
          keyHold = hold;
          if (trial.response_ends_trial) end_trial();
        }));
      };

      if (trial.choices !== "NO_KEYS") {
        // Log every key released from response onset, for multiple_keys_pressed.
        U.beginPressLog();
        keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: trial.choices,
          rt_method: "performance",
          persist: false,
          allow_held_key: false,
        });
      }
      if (trial.stimulus_duration !== null) {
        jsPsych.pluginAPI.setTimeout(() => { canvas.style.visibility = "hidden"; stimHideTime = performance.now(); }, trial.stimulus_duration);
      }
      if (trial.trial_duration !== null) {
        jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
      }
    }

    // ---- Report mode -------------------------------------------------------
    runReport(display_element, trial, img) {
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional mouse-trajectory recorder (record_mouse)
      const w = trial.stimulus_width || img.naturalWidth || 0;
      const h = trial.stimulus_height || img.naturalHeight || 0;

      // Box geometry. The outermost elements are the 75px previews centred at radius
      // wheelRadius + 60; the square box holds that ring plus a margin.
      const wheelRadius = Math.round(Math.max(w, h) * 0.72 + 36); // keeps the object's corners inside the ring
      const previewRadius = wheelRadius + 60;
      const half = Math.ceil(previewRadius + 75 / 2 + 22);
      const width = half * 2;
      const height = half * 2;
      const center = half;
      const target = trial.color_rotation_deg === null ? null : U.wrap360(trial.color_rotation_deg);

      display_element.innerHTML =
        `<div id="cro-box" style="position:relative;display:flex;margin:0 auto;` +
        `align-items:center;justify-content:center;border:1px solid black;` +
        `background:${trial.background_color};width:${width}px;height:${height}px">` +
        `<canvas id="cro-item" style="position:absolute;` +
        `top:${center - h / 2}px;left:${center - w / 2}px;width:${w}px;height:${h}px"></canvas>` +
        `<div id="cro-report"></div>` +
        `<div id="cro-center" style="position:absolute;top:${center}px;left:${center}px;width:0;height:0"></div>` +
        `<div id="cro-message" style="position:absolute;top:10px;width:100%;text-align:center"></div>` +
        `</div>` +
        (trial.prompt ? `<div style="text-align:center;margin-top:12px">${trial.prompt}</div>` : "");

      const box = display_element.querySelector("#cro-box");
      const canvas = display_element.querySelector("#cro-item");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      // Per-pixel LAB cache so the central object can be recolored on every pointer
      // move. On a cross-origin (tainted) image it draws the image unrecolored.
      const rc = U.makeRecolorCache(img, w, h);
      const objColorAt = (deg) => (trial.wheel_colors ? rc.meanColorAt(deg) : null);
      const redrawCentral = (deg) => rc.redraw(ctx, deg);
      redrawCentral(NaN); // start grayscale

      // ---- Build the response wheel + previews ----
      const wheelSpin = trial.spin_wheel ? U.randInt(0, 359) : 0;

      // Which option degrees are on the ring. A num_choices below 1 (checkParams warns)
      // would leave the ring empty and every response undefined, so fall back to 360.
      const nChoices = trial.num_choices >= 1 ? trial.num_choices : 360;
      const choiceDegs = trial.choice_degrees || [];
      let wheelOptions = [];
      if (choiceDegs.length > 0) {
        wheelOptions = choiceDegs.map((d) => U.wrap360(d));
      } else {
        // Quantized ring with a target: anchor the grid on the target so it is itself
        // an option and a click on it scores exactly 0 (CONVENTIONS §5). Otherwise the
        // grid starts at 0. Index-based so a step that doesn't divide 360 can't add a
        // near-duplicate option through float drift.
        const anchor = nChoices < 360 && target !== null ? target : 0;
        const step = 360 / nChoices;
        for (let k = 0; k < nChoices; k++) wheelOptions.push(U.wrap360(anchor + k * step));
      }
      // Cap ranking responses at the number of options: commit() rejects already-chosen
      // options, so responses_per_item > option count would never finish.
      const effRpi = Math.max(1, Math.min(trial.responses_per_item, wheelOptions.length));

      const reportDiv = display_element.querySelector("#cro-report");
      const optionPositions = []; // on-screen angle of each option
      let wheelHtml =
        `<div style="border:2px solid gray;border-radius:50%;position:absolute;` +
        `top:${(height - wheelRadius * 2) / 2}px;left:${(width - wheelRadius * 2) / 2}px;` +
        `width:${wheelRadius * 2 - 5}px;height:${wheelRadius * 2 - 5}px"></div>`;
      wheelOptions.forEach((deg) => {
        const posDeg = U.wrap360(deg + wheelSpin);
        optionPositions.push(posDeg);
        const top = center - 10 + wheelRadius * Math.sin((posDeg / 180) * Math.PI);
        const left = center - 10 + wheelRadius * Math.cos((posDeg / 180) * Math.PI);
        const swBg = trial.wheel_colors ? (objColorAt(deg) || (trial.color_wheel || window.BradyColorWheel).css(deg)) : "gray";
        wheelHtml +=
          `<div class="cro-choice" data-deg="${deg}" id="cro-ring${deg}" ` +
          `style="position:absolute;width:20px;height:20px;border-radius:50%;background:${swBg};` +
          `cursor:pointer;z-index:5;font-size:10pt;display:flex;align-items:center;` +
          `justify-content:center;user-select:none;top:${top}px;left:${left}px"></div>`;
      });

      // Recolored object previews outside the ring. Index-based loop: a non-positive
      // num_previews would make a step-based loop run forever.
      const nPreviews = Math.max(0, Math.floor(trial.num_previews || 0));
      for (let k = 0; k < nPreviews; k++) {
        const d = (k * 360) / nPreviews;
        const posDeg = U.wrap360(d + wheelSpin);
        const top = center - 75 / 2 + previewRadius * Math.sin((posDeg / 180) * Math.PI);
        const left = center - 75 / 2 + previewRadius * Math.cos((posDeg / 180) * Math.PI);
        wheelHtml +=
          `<canvas class="cro-preview" data-deg="${d}" width="75" height="75" ` +
          `style="position:absolute;width:75px;height:75px;z-index:1;top:${top}px;left:${left}px"></canvas>`;
      }
      reportDiv.innerHTML = wheelHtml;
      if (trial.auto_zoom) U.autoZoom(box);

      // Paint the previews (each recolored by its degree). The object keeps the aspect
      // ratio it has in the centre (w x h), scaled to fit the 75x75 square and centred,
      // so a non-square image is not stretched.
      const pScale = 75 / Math.max(w, h, 1);
      const pw = w * pScale, ph = h * pScale;
      display_element.querySelectorAll(".cro-preview").forEach((cv) => {
        const pctx = cv.getContext("2d");
        if (img.complete && img.naturalWidth > 0) {
          pctx.drawImage(img, (75 - pw) / 2, (75 - ph) / 2, pw, ph);
          U.rotateCanvasHue(pctx, 75, 75, +cv.dataset.deg);
        }
      });

      // ---- Live recolor + nearest-option highlight on mouse move ----
      // The pointer angle is read relative to the zero-size anchor #cro-center, the exact
      // inverse of how options are placed (option deg sits at screen angle deg + spin).
      const centerEl = display_element.querySelector("#cro-center");
      let responseAngle = 0;
      let prevIdx = null;
      let closestDeg = wheelOptions[0];
      let closestIdx = 0;
      // Look options up by index, not by an `#cro-ring<deg>` id: a fractional degree is
      // an invalid CSS selector and would throw on every mousemove.
      const choiceEls = display_element.querySelectorAll(".cro-choice");
      // Index of the ring option whose screen position is closest to a screen angle.
      const nearestIdx = (screenAngle) => {
        let bestIdx = 0, bestDiff = Infinity;
        for (let k = 0; k < optionPositions.length; k++) {
          const diff = Math.abs(U.angleDiff(optionPositions[k], screenAngle));
          if (diff < bestDiff) { bestDiff = diff; bestIdx = k; }
        }
        return bestIdx;
      };
      const updateAngle = (e) => {
        responseAngle = U.wheelDegreeFromPointer(centerEl, e.clientX, e.clientY, 0, 0);
        const bestIdx = nearestIdx(responseAngle);
        closestDeg = wheelOptions[bestIdx];
        closestIdx = bestIdx;
        // Show the hue that a click here would record (the nearest option), so on a
        // quantized ring the object never shows a hue other than the one scored.
        redrawCentral(closestDeg);

        // Highlight the nearest option.
        if (prevIdx !== null && prevIdx !== bestIdx) {
          const prev = choiceEls[prevIdx];
          if (prev && !prev.dataset.clicked) { prev.style.border = "none"; prev.style.zIndex = "5"; }
        }
        const cur = choiceEls[bestIdx];
        if (cur && !cur.dataset.clicked) { cur.style.border = "2px solid black"; cur.style.zIndex = "10"; }
        prevIdx = bestIdx;
      };

      // ---- Collect response(s) ----
      const rts = [], reported = [], options = [], physical = [], errors = [], holds = [];
      let responseNum = 0;
      const startTime = performance.now();
      // Ranking: indices of options already ranked this trial, so each rank is a
      // different option. Only consulted when responses_per_item > 1.
      const chosenOptions = new Set();

      const endReport = () => {
        box.removeEventListener("mousemove", updateAngle);
        const data = {
          mode: "report",
          stimulus: trial.stimulus,
          color_rotation_deg: trial.color_rotation_deg,
          rt: rts,
          mouse_hold_duration: holds, // one hold per committing click, parallel to rt
          // display-mode fields, null here so both modes have the same columns
          response: null,
          key_hold_duration: null, key_presses: null, multiple_keys_pressed: false,
          reported_degree: reported,
          reported_option: options,
          physical_angle: physical,
          error: errors,
          wheel_spin: wheelSpin,
          num_options: wheelOptions.length,
          // the object stays up until the response, so there is no study duration
          actual_stim_duration: null,
          // the one object shown, with its true hue rotation
          stimuli_shown: [{ value: trial.stimulus, rotation: trial.color_rotation_deg }],
          target_index: 0,
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Same frame as mouse_trajectory: logical px from the #cro-box centre. Option v
          // is drawn at screen angle v + wheelSpin, the inverse of updateAngle's readback.
          let wheelPoints = null, targetPoint = null;
          if (target !== null) {
            const pt = U.wheelPoint(0, 0, wheelRadius, trial.color_rotation_deg, wheelSpin, 0);
            wheelPoints = [{ index: 0, value: trial.color_rotation_deg, target: true, x: pt.x, y: pt.y }];
            targetPoint = { value: trial.color_rotation_deg, x: pt.x, y: pt.y };
          }
          data.mouse_geometry = {
            units: "logical px from stage centre",
            box: width,
            items: [{
              index: 0,
              position: 0,
              value: trial.color_rotation_deg,
              target: true,
              x: -w / 2,
              y: -h / 2,
              w: w,
              h: h,
            }],
            wheel: { cx: 0, cy: 0, radius: wheelRadius },
            wheel_points: wheelPoints,
            target_point: targetPoint,
          };
        }
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // A click anywhere in the box commits the ring option nearest the pointer angle.
      const commit = (e) => {
        // Read the hold first, so every click consumes exactly one press: an ignored
        // click must not leave its duration to be claimed by the next one.
        const hold = U.mouseHoldDuration();
        if (mt) mt.sample(e); // keep the committing point
        // Recompute from the click itself: a click with no preceding mousemove (touch,
        // or a click without moving) would otherwise commit stale/initial values.
        updateAngle(e);
        // Ranking: ignore a click on an already-ranked option.
        if (effRpi > 1 && chosenOptions.has(closestIdx)) return;
        const repDeg = U.wrap360(responseAngle - wheelSpin);
        holds.push(hold);
        rts.push(Math.round(performance.now() - startTime));
        // Score the chosen option, not the raw pointer, so clicking the target option is
        // exactly 0 error (the raw pointer angle goes to physical_angle).
        reported.push(closestDeg);
        options.push(closestDeg);
        physical.push(U.wrap360(Math.round(responseAngle))); // rounding can give 360; wrap to 0
        errors.push(target === null ? null : Math.round(U.angleDiff(closestDeg, target)));
        responseNum++;

        // Ranking: label the chosen swatch with its rank and keep collecting.
        if (responseNum < effRpi) {
          chosenOptions.add(closestIdx);
          const ring = choiceEls[closestIdx];
          if (ring) {
            ring.dataset.clicked = "1";
            ring.style.border = "2px solid black";
            ring.style.zIndex = String(20 + responseNum);
            ring.innerHTML = String(responseNum);
          }
          return;
        }

        // Final response: stop listeners.
        box.removeEventListener("mousemove", updateAngle);
        box.removeEventListener("click", commit);

        if (trial.feedback && target !== null) {
          redrawCentral(target); // show the true color
          const lastErr = errors[errors.length - 1];
          display_element.querySelector("#cro-message").innerHTML =
            `You were off by ${Math.abs(lastErr)}&deg;`;
          // There is no correct/incorrect; an error within feedback_threshold gets the win cue.
          const correct = Math.abs(lastErr) <= trial.feedback_threshold;
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(endReport, 1200);
        } else {
          jsPsych.pluginAPI.setTimeout(endReport, 100);
        }
      };

      // Mouse recording starts at report onset (report mode has no study phase). The
      // value column is the hue a click there would record (the nearest option), the
      // same hue the central object shows.
      if (trial.record_mouse) {
        const t0 = performance.now();
        mt = U.makeMouseTracker(box, t0, {
          minInterval: trial.mouse_min_interval,
          responseMinInterval: trial.mouse_response_min_interval,
        });
        mt.attach();
        mt.mark("report");
        mt.setValueFn((e) =>
          wheelOptions[nearestIdx(U.wheelDegreeFromPointer(centerEl, e.clientX, e.clientY, 0, 0))]
        );
      }

      // Listeners go on the box (not document) so they are discarded with it however
      // the trial ends.
      box.addEventListener("mousemove", updateAngle);
      box.style.cursor = "crosshair";
      box.addEventListener("click", commit);
    }
  }
  ColorRotatedObjectPlugin.info = info;

  // ===== helpers =====

  // Load an image; resolve on load or error, so a missing image can't hang the trial
  // (the caller draws a gray fill when naturalWidth is 0).
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      if (U.needsCors(src)) img.crossOrigin = "anonymous"; // only for cross-origin URLs (keeps file:// / same-origin loading)
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = src;
    });
  }

  return ColorRotatedObjectPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-object-orientation-report.js */
/* ===================================================================== */
/*
 * jspsych-object-orientation-report.js  --  jsPsych v8 plugin
 *                                           (registered name: "object-orientation-report")
 *
 * Orientation working memory for real objects (the orientation counterpart of
 * jspsych-continuous-object-report.js, which does color). Object photos are shown
 * at placeholder locations, each rotated in its box by its own orientation (a CSS
 * transform). After a retention delay one item is probed and the participant
 * reports its orientation by spinning the object with the mouse, then clicking.
 *
 * Key options:
 *   report_location  -- "center" (probe shown at the centre, default) or "in_place"
 *                       (spin the object in its own placeholder box)
 *   orientations     -- per-item true angles (deg); empty = random
 *   orientation_period -- 360 (default) or 180 for an object that looks the same
 *                         after a half turn; sets the range of the error
 *   orientation_num_choices -- quantize the response on a grid anchored on the
 *                         target (0 = continuous)
 *   sequential / cue_items / precue_time / retrocue_time / do_test -- as in the
 *                         other WM plugins
 *   noise_level / noise_type / mask_time / mask_type -- stimulus noise at encoding and
 *                         a mask at array offset, before the delay (BradyUtils.noiseKinds/maskKinds; add kinds
 *                         with registerNoise/registerMask or pass a function)
 *
 * Sign convention: the pointer angle around the report object is read with
 * BradyUtils.wheelDegreeFromPointer (0 deg = pointing right, increasing clockwise on
 * screen), the object is drawn at CSS rotate(thatAngle) (also clockwise), and the
 * memory items are drawn at rotate(orientation). The unrotated photo is orientation 0
 * whatever its intrinsic "up". orientation_error = reported - target, wrapped to
 * (-period/2, period/2]. The recorded orientations are in [0, period) (with
 * orientation_period 180 an object drawn at 270 is recorded as 90), and the period is
 * recorded as `orientation_period`.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */
var jsPsychObjectOrientationReport = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "object-orientation-report",
    version: version,
    parameters: {
      /** Per-item object image URLs (one per item). One value = same image for all; empty falls back to `object_image`. */
      stimuli: { type: jspsych.ParameterType.IMAGE, array: true, default: [] },
      /** A single object image used for every item (when `stimuli` is empty). */
      object_image: { type: jspsych.ParameterType.IMAGE, default: null },
      /** Number of items in the memory array. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Per-item true orientations (deg, 0 = the photo as drawn, positive = clockwise). Shorter lists repeat (one value = all the same). Empty = random integers in [0, orientation_period). */
      orientations: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Orientation period (deg): 360 (default) or 180 for an object that looks the same after a half turn. Sets the error range (+/- period/2) and the range of random orientations. Values <= 0 fall back to 360. */
      orientation_period: { type: jspsych.ParameterType.INT, default: 360 },
      /** Quantize the orientation response to this many steps around the full 360 deg,
          anchored on the target so it is always selectable (0 = continuous). With
          orientation_period 180, n steps give n/2 distinct orientations. Same name and
          grid as continuous-report's orientation quantizer. */
      orientation_num_choices: { type: jspsych.ParameterType.INT, default: 0 },
      /** Where the report happens: "center" (probe shown centrally) or "in_place" (spin it in its own box). */
      report_location: { type: jspsych.ParameterType.STRING, default: "center" },
      /** Number of equally-spaced placeholder locations. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the probed item. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Radius (px) of the placeholder ring. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Item display size (px, square). */
      item_size: { type: jspsych.ParameterType.INT, default: 100 },
      /** How long (ms) the memory array is shown. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) before the probe. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** Delay (ms) from trial start to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** If > 0, highlight the to-be-probed location (a `cue_color`/`cue_thickness` ring)
          for this long before the array. Skipped when do_test is false. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, retro-cue: after the retention delay, highlight
          the to-be-probed location for this long before the response. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item's placeholder
          covered by the `noise_type` degradation, drawn on a transparent overlay above
          the rotated photo and removed at array offset. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Outline the probed location while the array is up. */
      cue_items: { type: jspsych.ParameterType.BOOL, default: false },
      /** If false, skip the test/response entirely (encoding-only trial). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Background color of the box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** CSS border on every placeholder location ("none" = invisible). Visible by
          default so the spatial layout is shown. */
      placeholder_border: { type: jspsych.ParameterType.STRING, default: "2px solid #ccc" },
      /** Scale the box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the response, rotate the object to its true orientation and show the error for 1200 ms. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct (small-error) response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Abs error (deg) at/under which a response counts "correct" for the reward cue. */
      feedback_threshold: { type: jspsych.ParameterType.INT, default: 20 },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Optional HTML prompt shown at the top of the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Record the mouse trajectory from trial start (the fixation click, or trial onset when click_to_start is false) to the response. */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded mouse samples (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded mouse samples during the report phase (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Reported orientation (deg, integer in [0, orientation_period), clockwise from the photo as drawn); after snapping when orientation_num_choices > 0. With orientation_period 180 a pointer at 250 is recorded as 70. null if do_test is false. */
      reported_orientation: { type: jspsych.ParameterType.INT },
      /** Signed error (reported - target) in (-orientation_period/2, orientation_period/2], rounded. null if do_test is false. */
      orientation_error: { type: jspsych.ParameterType.INT },
      /** True orientation (deg, [0, orientation_period)) of the probed item. */
      target_orientation: { type: jspsych.ParameterType.INT },
      /** True per-item orientations (deg, [0, orientation_period)). */
      orientations: { type: jspsych.ParameterType.INT, array: true },
      /** The orientation period (deg) the orientation fields use: the orientation_period
          parameter, or 360 when it is <= 0. Orientations are recorded in [0, period) and the
          error wraps at +/- period/2. */
      orientation_period: { type: jspsych.ParameterType.INT },
      /** Placeholder index of each item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the probed item. */
      which_test: { type: jspsych.ParameterType.INT },
      /** Number of items in the array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from probe onset to the click; null if do_test is false. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Measured ms the memory array was actually on screen (onset to hide). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per presented item: placeholder index, pixel centre (x,y, from the box's top-left), value (image src) and orientation (in [0, orientation_period)). */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown of the probed item (= which_test). */
      target_index: { type: jspsych.ParameterType.INT },
      /** Image src of the probed object. */
      target_value: { type: jspsych.ParameterType.STRING },
      /** record_mouse: recorded mouse samples, each a [t, x, y, value] row (see mouse_trajectory_columns). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** record_mouse: column names for each mouse_trajectory row. */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** record_mouse: index into mouse_trajectory of the first report-phase sample. */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before any pre-cue and delay_start; array: the memory array's onset; mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset; report: the probe appears. Any retro-cue falls between delay and report. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** record_mouse: CSS zoom/scale factor applied to the box when sampling (for un-zooming coords). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** record_mouse: layout in the mouse-trajectory frame (logical px from the box centre): item boxes, the dashed guide ring the object spins inside (centre + radius), each item's orientation as a point on that ring, and the target's point. */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
    },
  };

  class ObjectOrientationReportPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    // trial() is synchronous (CONVENTIONS §3): the body runs once the images have
    // loaded, and the trial ends via finishTrial().
    trial(display_element, trial) {
      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // mouse-trajectory recorder (record_mouse)
      // A stimuli list of more than one image sets the set size, as in the
      // continuous-report family; with 0 or 1 images set_size does.
      const rawSetSize = trial.stimuli.length > 1 ? trial.stimuli.length : trial.set_size;
      // At least one item: with none there is nothing to probe and indexing below throws
      // (checkParams still warns about the raw value).
      const setSize = Math.max(1, rawSetSize);
      const isz = trial.item_size;
      // Side = box/sqrt2 so a rotated square photo never pokes its corners out of its box.
      const objSize = Math.round(isz / Math.SQRT2) - 2;
      // A period <= 0 would make every error NaN, so fall back to 360.
      const period = trial.orientation_period > 0 ? trial.orientation_period : 360;
      // Recorded orientations live in [0, period).
      const modP = (o) => (o == null ? null : ((o % period) + period) % period);

      // ---- Resolve per-item images + orientations --------------------------
      const srcs = [];
      for (let i = 0; i < setSize; i++) {
        srcs.push(trial.stimuli.length ? trial.stimuli[i % trial.stimuli.length] : trial.object_image);
      }
      const orientDegs = [];
      for (let i = 0; i < setSize; i++) {
        orientDegs.push(trial.orientations.length
          ? U.wrap360(trial.orientations[i % trial.orientations.length])
          : U.randInt(0, period - 1));
      }
      // ---- Placeholder positions -------------------------------------------
      // Warn (only) about orientations / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "object-orientation-report", setSize: setSize, supportsEnsemble: false, values: orientDegs,
        userItems: Math.max(trial.stimuli.length, trial.orientations.length) });
      U.checkParams(trial, { plugin: "object-orientation-report", setSize: rawSetSize, positive: ["orientation_period"], enums: { report_location: ["center", "in_place"] } });
      // Clamp an out-of-range which_test (validatePlacement only warns) so indexing below
      // can't throw on #oor-ph-undefined, as in the other report plugins. It lives in a local:
      // trial is jsPsych's stored copy of the parameters (save_trial_parameters reads it), so
      // it is never modified.
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "object-orientation-report" });
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots).
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const nph = placed.nph;
      const pos = placed.pos;

      const trueDeg = orientDegs[whichTest];

      U.loadImages(srcs).then(build);

      // ---- Build the display ------------------------------------------------
      function build() {
        const boxSize = Math.round(2 * (trial.radius + isz) + 40);
        const center = boxSize / 2;
        // for actual_stim_duration (array onset to hide)
        let arrayOnset = null, actualStimDuration = null;

        let html =
          `<div id="oor-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
          `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
        for (let i = 0; i < nph; i++) {
          const top = Math.cos((2 * Math.PI * i) / nph) * trial.radius + center - isz / 2;
          const left = Math.sin((2 * Math.PI * i) / nph) * trial.radius + center - isz / 2;
          html +=
            `<div id="oor-ph-${i}" style="position:absolute;width:${isz}px;height:${isz}px;` +
            `top:${top}px;left:${left}px;box-sizing:border-box;border:${trial.placeholder_border}">` +
            `<img id="oor-item-${i}" draggable="false" style="position:absolute;width:${objSize}px;height:${objSize}px;` +
            `top:${(isz - objSize) / 2}px;left:${(isz - objSize) / 2}px;transform-origin:center center;display:none;user-select:none;pointer-events:none" /></div>`;
        }
        html +=
          `<span id="oor-fixation" style="position:absolute;font-size:16pt;cursor:pointer;` +
          `top:${center - 14}px;left:${center - 6}px">+</span>` +
          // the centred report object, and a zero-size anchor for the pointer-angle readback
          `<img id="oor-probe" draggable="false" style="position:absolute;width:${objSize}px;height:${objSize}px;` +
          `top:${center - objSize / 2}px;left:${center - objSize / 2}px;transform-origin:center center;` +
          `display:none;user-select:none;pointer-events:none" />` +
          `<div id="oor-center" style="position:absolute;width:0;height:0;top:${center}px;left:${center}px"></div>` +
          `<div id="oor-guide" style="position:absolute;border:2px dashed #999;border-radius:50%;display:none;` +
          `width:${isz * 1.7}px;height:${isz * 1.7}px;pointer-events:none"></div>` +
          `<div id="oor-message" style="position:absolute;top:8px;width:100%;text-align:center;user-select:none"></div>` +
          `</div>` +
          (trial.prompt ? `<div style="text-align:center;margin-top:12px">${trial.prompt}</div>` : "");
        display_element.innerHTML = html;

        const box = display_element.querySelector("#oor-box");
        if (trial.auto_zoom) U.autoZoom(box);

        const itemEl = (p) => display_element.querySelector(`#oor-item-${p}`);
        const phEl = (p) => display_element.querySelector(`#oor-ph-${p}`);
        const setMsg = (t) => (display_element.querySelector("#oor-message").innerHTML = t || "");

        // Stimulus-noise overlays, keyed by placeholder index; removed when an item is cleared.
        const noiseRemovers = {};
        const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };

        const paint = (i) => {
          const el = itemEl(pos[i]);
          el.src = srcs[i] || "";
          el.style.transform = `rotate(${orientDegs[i]}deg)`;
          el.style.display = "block";
          if (trial.cue_items && pos[i] === pos[whichTest]) {
            phEl(pos[i]).style.outline = "4px solid #000";
          }
          // Stimulus noise on a transparent overlay over the placeholder; the <img>
          // underneath is untouched.
          clearNoise(pos[i]);
          if (trial.noise_level > 0) {
            noiseRemovers[pos[i]] = U.noiseOverlay(phEl(pos[i]), trial.noise_level, trial.noise_type, {});
          }
        };
        const clearItem = (i) => { clearNoise(pos[i]); itemEl(pos[i]).style.display = "none"; };

        // ---- Start (optional fixation click, optional precue) ---------------
        const start = () => {
          setMsg("");
          // Unbind the fixation so a second click during delay_start can't re-enter
          // start() and schedule a second showArray (and a second finishTrial).
          const fix = display_element.querySelector("#oor-fixation");
          fix.style.cursor = "auto";
          fix.removeEventListener("click", start);
          // Mouse recording starts here, before any precue. seedCenter only after a
          // fixation click, when the cursor is known to be at the centre.
          if (trial.record_mouse && !mt) {
            const t0 = performance.now();
            mt = U.makeMouseTracker(box, t0, {
              minInterval: trial.mouse_min_interval,
              responseMinInterval: trial.mouse_response_min_interval,
            });
            mt.attach();
            if (trial.click_to_start) mt.seedCenter();
            mt.mark("encoding");
          }
          if (trial.precue_time > 0 && trial.do_test) {
            // Pre-cue the to-be-probed location, then delay_start, then the array.
            const clearCue = U.spatialCue(phEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
            jsPsych.pluginAPI.setTimeout(() => {
              clearCue();
              jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
            }, trial.precue_time);
          } else {
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }
        };

        const showArray = () => {
          display_element.querySelector("#oor-fixation").style.display = "none";
          arrayOnset = performance.now();
          if (mt) mt.mark("array");
          U.encodeArray({
            api: jsPsych.pluginAPI, n: setSize,
            paint: paint, clear: clearItem,
            displayTime: trial.display_time, sequential: trial.sequential,
            itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
            cumulative: trial.sequential_cumulative, onDone: hideArray,
          });
        };

        const hideArray = () => {
          for (let i = 0; i < setSize; i++) clearItem(i);
          phEl(pos[whichTest]).style.outline = "";
          if (arrayOnset !== null) actualStimDuration = Math.round(performance.now() - arrayOnset);
          // Blank retention interval: delay_time runs in full whether or not a mask
          // came first.
          const startDelay = () => {
            if (mt) mt.mark("delay");
            jsPsych.pluginAPI.setTimeout(trial.do_test ? afterDelay : () => finish(null, null, null, null), trial.delay_time);
          };
          // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
          // that it cuts encoding off. It covers the occupied locations for mask_time ms and
          // the retention interval starts when it comes off.
          // Skipped when mask_time is 0 or do_test is false.
          if (trial.mask_time > 0 && trial.do_test) {
            if (mt) mt.mark("mask");
            const removeMasks = [];
            for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(phEl(pos[i]), trial.mask_type, {}));
            jsPsych.pluginAPI.setTimeout(() => {
              removeMasks.forEach((r) => r());
              startDelay();
            }, trial.mask_time);
          } else {
            startDelay();
          }
        };

        // Optional retro-cue after the retention delay, before the response.
        const afterDelay = () => {
          if (trial.retrocue_time > 0) {
            const clearCue = U.spatialCue(phEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
            jsPsych.pluginAPI.setTimeout(() => { clearCue(); showProbe(); }, trial.retrocue_time);
          } else {
            showProbe();
          }
        };

        // ---- Report: spin the probed object --------------------------------
        const showProbe = () => {
          if (mt) mt.mark("report");
          const inPlace = trial.report_location === "in_place";
          const reportEl = inPlace ? itemEl(pos[whichTest]) : display_element.querySelector("#oor-probe");
          // The readback anchor sits at the report object's centre.
          const anchor = display_element.querySelector("#oor-center");
          if (inPlace) {
            const ph = display_element.querySelector(`#oor-ph-${pos[whichTest]}`);
            anchor.style.top = ph.offsetTop + isz / 2 + "px";
            anchor.style.left = ph.offsetLeft + isz / 2 + "px";
          }
          // dashed guide ring around the report object
          const guide = display_element.querySelector("#oor-guide");
          guide.style.top = parseFloat(anchor.style.top) - isz * 0.85 + "px";
          guide.style.left = parseFloat(anchor.style.left) - isz * 0.85 + "px";
          guide.style.display = "block";

          reportEl.src = srcs[whichTest] || "";
          let cur = U.randInt(0, period - 1); // random start angle, so it must be adjusted
          reportEl.style.transform = `rotate(${cur}deg)`;
          reportEl.style.display = "block";
          setMsg("Rotate the object to its remembered orientation, then click.");

          const probeStart = performance.now();
          const angleAt = (e) => {
            let o = U.wheelDegreeFromPointer(anchor, e.clientX, e.clientY, 0, 0);
            // Grid anchored on the true orientation, so the target is always selectable.
            if (trial.orientation_num_choices > 0) o = U.snapDegree(o, trial.orientation_num_choices, trueDeg);
            return o;
          };
          if (mt) mt.setValueFn(angleAt);
          const onMove = (e) => { cur = angleAt(e); reportEl.style.transform = `rotate(${cur}deg)`; };
          const onClick = (e) => {
            // Read the hold first, so this click consumes exactly its own press.
            const hold = U.mouseHoldDuration();
            if (mt) mt.sample(e);
            // Read from the click itself, so a click with no preceding mousemove still counts.
            const reported = U.wrap360(Math.round(angleAt(e))); // integer; the live rotation is not rounded
            const err = signedErr(reported, trueDeg, period);
            box.removeEventListener("mousemove", onMove);
            box.removeEventListener("click", onClick);
            box.style.cursor = "auto";
            guide.style.display = "none";
            const rt = Math.round(performance.now() - probeStart);
            if (trial.feedback) {
              reportEl.style.transform = `rotate(${trueDeg}deg)`; // show the true orientation
              setMsg(`off by ${Math.abs(err)}&deg;`);
              U.feedbackCues(Math.abs(err) <= trial.feedback_threshold, {
                sound: trial.feedback_sound, confetti: trial.feedback_confetti,
                sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound },
              });
              jsPsych.pluginAPI.setTimeout(() => finish(reported, err, rt, hold), 1200);
            } else {
              finish(reported, err, rt, hold);
            }
          };
          box.style.cursor = "crosshair";
          box.addEventListener("mousemove", onMove);
          box.addEventListener("click", onClick);
        };

        const finish = (reported, err, rt, hold) => {
          // Every presented item, for swap/interference analyses.
          const stimuli_shown = [];
          for (let i = 0; i < setSize; i++) {
            const x = Math.sin((2 * Math.PI * pos[i]) / nph) * trial.radius + center;
            const y = Math.cos((2 * Math.PI * pos[i]) / nph) * trial.radius + center;
            stimuli_shown.push({ position: pos[i], x: x, y: y, value: srcs[i], orientation: modP(orientDegs[i]) });
          }
          const data = {
            reported_orientation: modP(reported),
            orientation_error: err,
            target_orientation: modP(trueDeg),
            orientation_period: period,
            orientations: orientDegs.map(modP),
            positions: pos,
            which_test: whichTest,
            set_size: setSize,
            rt: rt,
            mouse_hold_duration: hold,
            stimuli_shown: stimuli_shown,
            target_index: whichTest,
            target_value: srcs[whichTest], // probed object's image src
            actual_stim_duration: actualStimDuration,
          };
          if (trial.record_mouse && mt) {
            mt.detach();
            Object.assign(data, U.mouseTrackerData(mt));
          }
          if (trial.record_mouse) {
            // Logical px from the box centre, built from the plugin's own layout numbers
            // (not getBoundingClientRect, which is zoomed) so it lines up with the trajectory.
            const inPlaceG = trial.report_location === "in_place";
            const probePos = pos[whichTest];
            // Guide-ring centre relative to the box centre: (0,0) for "center", the probed
            // placeholder's centre (sin/cos * radius) for "in_place".
            const gcx = inPlaceG ? Math.sin((2 * Math.PI * probePos) / nph) * trial.radius : 0;
            const gcy = inPlaceG ? Math.cos((2 * Math.PI * probePos) / nph) * trial.radius : 0;
            // #oor-guide is isz*1.7 wide and centred on the anchor, so its radius is isz*0.85.
            const gradius = isz * 0.85;
            const gitems = [], wpts = [];
            for (let i = 0; i < setSize; i++) {
              // Item box top-left: the placeholder's top/left minus center.
              const ix = Math.sin((2 * Math.PI * pos[i]) / nph) * trial.radius - isz / 2;
              const iy = Math.cos((2 * Math.PI * pos[i]) / nph) * trial.radius - isz / 2;
              gitems.push({ index: i, position: pos[i], value: orientDegs[i], target: i === whichTest, x: ix, y: iy, w: isz, h: isz });
              // angleAt reads with spin 0 and offset 0, so wheelPoint uses the same.
              const wp = U.wheelPoint(gcx, gcy, gradius, orientDegs[i], 0, 0);
              wpts.push({ index: i, value: orientDegs[i], target: i === whichTest, x: wp.x, y: wp.y });
            }
            const tp = U.wheelPoint(gcx, gcy, gradius, trueDeg, 0, 0);
            data.mouse_geometry = {
              units: "logical px from stage centre",
              box: boxSize,
              items: gitems,
              wheel: { cx: gcx, cy: gcy, radius: gradius },
              wheel_points: wpts,
              target_point: { value: trueDeg, x: tp.x, y: tp.y },
            };
          }
          if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
          finishOnce(data);
        };

        if (trial.click_to_start) display_element.querySelector("#oor-fixation").addEventListener("click", start);
        else start();
      }
    }
  }
  ObjectOrientationReportPlugin.info = info;

  // ===== module-private helpers =====
  // Signed orientation error in (-period/2, period/2] (the antipode maps to +period/2).
  function signedErr(reported, target, period) {
    return Math.round(U.circularDiff(reported, target, period));
  }

  return ObjectOrientationReportPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-wm-forced-choice.js */
/* ===================================================================== */
/*
 * jspsych-wm-forced-choice.js  --  jsPsych v8 plugin
 *
 * Working-memory n-alternative forced choice (the forced-choice analog of change
 * detection). Shows a memory array, a blank retention delay, then probes one
 * location and presents K options; the participant picks the option that matches
 * the probed item.
 *
 * Memory items and options can be colors, color-wheel degrees, images, or
 * text/words, mixed freely (see `stimuli`, `item_type`, `test_options`).
 *
 * Key options:
 *   choices_per_test / option_layout ("center" | "row" | "grid" | "circle")  -- number and arrangement of generated options
 *   option_gap / option_margin (px)                     -- "center" layout: gap between options, clearance from the placeholder ring
 *   cue_test_location                                   -- ring the probed location at test
 *   position_angle_offset (deg)                         -- rotate the placeholder ring
 *   cue_items / cue_color / cue_thickness               -- ring around cued item(s) at encoding
 *                                                          (the pre- and retro-cue rings use the same color/thickness)
 *   noise_level / noise_type                            -- degrade the memory items at encoding (kind from
 *                                                          BradyUtils.noiseKinds/registerNoise; options are never degraded)
 *   mask_time / mask_type                               -- mask the occupied locations at array offset, before the delay
 *                                                          (kind from BradyUtils.maskKinds/registerMask)
 *   sequential / sequential_item_time / sequential_gap_time -- show items one at a time
 *   color_rotation_deg + test_color_rotation_deg        -- hue-rotate images (CIELAB)
 *   preview_duration                                    -- grayscale preview of the probed item
 *   collect_confidence                                  -- after the choice, an inline word-label confidence picker
 *                                                          (1..N, N = confidence_labels.length); the task box stays visible
 *
 * Generated options (no test_options): the target plus K-1 random wheel colors, each at
 * least min_color_distance from the target and from each other. Option order is shuffled
 * unless shuffle_options is false, in which case the target is always option 0 and so
 * always in the same screen slot (the plugin logs a one-time console note).
 *
 * Concentric two-color objects live in jspsych-wm-pairs.js, which needs a
 * two-index (item, sub-feature) probe.
 *
 * Trial-ending rule (CONVENTIONS.md §3): the trial is timer/listener driven, so trial()
 * is synchronous and calls this.jsPsych.finishTrial(data) later, once, through
 * U.makeFinisher. Image preloading runs inside loadImages(...).then(...).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychWmForcedChoice = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "wm-forced-choice",
    version: version,
    parameters: {
      // ---- Memory-array items ------------------------------------------------
      /**
       * The memory-array items. Each entry may be a number (degree on the color
       * wheel), a CSS color / "lab(L,a,b)" string, an image path, or a text/word.
       * If empty, `set_size` random wheel colors (>= `min_color_distance` apart)
       * are generated.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of items: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Shape of color items: "disk" (default) or "square", a filled square the size of the
       *  disk (the Luck & Vogel style display), for the memory items, their placeholders and
       *  the color options. Cue rings and noise/mask overlays follow it. Image and text items
       *  are always square. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Color wheel for degree lookups (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of items to auto-generate when `stimuli` is empty (at least 1 is generated). */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated wheel colors, and between generated
          distractors and the target / each other. For distractors, values below 1 count
          as 1, so a distractor never duplicates the target. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 25 },

      // ---- Layout of the memory array ---------------------------------------
      /** Number of equally-spaced locations items can occupy (around a circle). */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each memory item. */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** CSS border drawn on every location for image/text items ("none" = invisible).
          Drawn by default because the task cues locations. Color items get a thin
          circular outline instead and ignore this. */
      placeholder_border: { type: jspsych.ParameterType.STRING, default: "2px solid #ccc" },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Rotate the whole placeholder ring by this many degrees. */
      position_angle_offset: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /**
       * Per-item hue rotation (deg) in CIELAB, applied to image items only, one
       * entry per memory item. Empty (default) = images shown unmodified.
       */
      color_rotation_deg: { type: jspsych.ParameterType.INT, array: true, default: [] },

      // ---- Presentation timing ----------------------------------------------
      /** How long (ms) the memory array is shown. 0 skips the array (test-only), unless sequential. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Blank retention interval (ms) between array offset and test onset. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, after the delay ring the to-be-probed location
          (`cue_color`/`cue_thickness`) for this long before the test appears. The ring
          stays up through the test unless cue_test_location replaces it. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each memory item covered
          by the `noise_type` degradation (a transparent overlay). The options and the
          grayscale preview are never degraded. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Delay (ms) from start (click or onset) to the pre-cue, or to the array if there is none. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Present the memory array one item at a time (vs. all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** If > 0, ring the to-be-probed location (plus any `cue_items`) for this long
          before the array. The probe-location ring comes off at array onset. Skipped when
          do_test is false (no probe to cue). */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, show the probed item in grayscale at its location for this long before the
          options appear. Color and text items become a plain gray shape, so the preview
          gives away location only. */
      preview_duration: { type: jspsych.ParameterType.INT, default: 0 },
      /** If false, just encode + delay then end (no test); for study-only blocks. */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },

      // ---- Encoding / probe cues --------------------------------------------
      /** Item indices (0..set_size-1) to draw an encoding cue ring around. */
      cue_items: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Color of the encoding cue ring (also used by the retro-cue highlight). */
      cue_color: { type: jspsych.ParameterType.STRING, default: "red" },
      /** Thickness (px) of the encoding cue ring (also used by the retro-cue highlight). */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 4 },
      /** Ring the probed location in black at test. Skipped when preview_duration > 0,
          since the preview already marks the location. */
      cue_test_location: { type: jspsych.ParameterType.BOOL, default: true },

      // ---- The probe & the test options -------------------------------------
      /** Which item (0..set_size-1; serial position when sequential) is probed. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Number of options K when they are generated (min 2). Ignored when test_options or
          test_color_rotation_deg supply the options. */
      choices_per_test: { type: jspsych.ParameterType.INT, default: 2 },
      /**
       * Explicit option specs (colors/degrees/images/text), in canonical order,
       * including the correct one. If omitted, options are generated (color items only).
       * With shuffle_options false they are shown in this order. (Declared OBJECT so
       * jsPsych does not warn about an array in a STRING parameter on every trial.)
       */
      test_options: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Index (into the canonical option list) of the correct option, or null to infer it:
          the option whose resolved value equals the probed item's (test_options), or the
          rotation equal to the probed item's study rotation (test_color_rotation_deg). */
      correct_option: { type: jspsych.ParameterType.INT, default: null },
      /**
       * Build the options by hue-rotating the probed image by these degrees, one
       * option per entry. The correct option is the rotation matching the probed
       * item's study rotation. Overrides test_options when set.
       */
      test_color_rotation_deg: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Layout of the options. "center" (default) puts them on a small ring around
          fixation, inside the box. "row", "grid", and "circle" put them in a strip below
          the stage, reserved from the start so the box does not move when they appear. */
      option_layout: { type: jspsych.ParameterType.STRING, default: "center" },
      /** Diameter (px) of each option (null = use item_size). The "center" layout shrinks
          options (to no less than 28 px) when they would not otherwise fit inside the ring. */
      option_size: { type: jspsych.ParameterType.INT, default: null },
      /** "center" layout: min gap (px) between adjacent options (they otherwise just touch). */
      option_gap: { type: jspsych.ParameterType.INT, default: 0 },
      /** "center" layout: min clearance (px) between an option's outer edge and the placeholder ring. */
      option_margin: { type: jspsych.ParameterType.INT, default: 12 },
      /** Randomize the display order of the options. If false, options keep their listed
          order; generated options list the target first, so it is always in display slot 0
          (a one-time console note says so). */
      shuffle_options: { type: jspsych.ParameterType.BOOL, default: true },

      // ---- Response ----------------------------------------------------------
      /** How responses are collected: "mouse" (click an option) or "keyboard". */
      response_ui: { type: jspsych.ParameterType.STRING, default: "mouse" },
      /** response_ui "keyboard": keys mapped to options by screen position in reading order
          (top row first, left to right within a row), whatever the option_layout. With two
          options side by side, choice_keys[0] is the left one. */
      choice_keys: { type: jspsych.ParameterType.KEYS, array: true, default: ["ArrowLeft", "ArrowRight"] },
      /** After the choice, pop up an inline confidence picker anchored to the chosen
          option (task box stays visible). Stores `confidence` 1..N, N = confidence_labels.length.
          Its x button un-commits the choice so the participant can choose again. */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: false },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },

      // ---- Misc --------------------------------------------------------------
      /** Optional HTML shown beneath the display (e.g. the question). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Briefly outline the chosen (and correct) option after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the whole-trial mouse trajectory (cursor path to the chosen option). */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between mouse samples during encoding/delay (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between mouse samples once the options appear (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from options onset to the choice (KeyDown for keyboard). The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click (response_ui "mouse"). "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable, and for keyboard responses. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the response key was held down: KeyDown -> KeyUp (response_ui "keyboard"). "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred), and for mouse responses. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed during the response window: {key, t (ms from response onset), duration}. `duration` is null for a key that was still held when the window closed (it never produced a release, but still counts for the multi-key exclusion). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** Canonical index (into test_options) of the chosen option. */
      chosen_option: { type: jspsych.ParameterType.INT },
      /** Screen position of the chosen option in reading order (0 = top-left; with two side-by-side options, 0 = left). */
      chosen_position: { type: jspsych.ParameterType.INT },
      /** The spec of the chosen option. */
      chosen_spec: { type: jspsych.ParameterType.STRING },
      /** Whether the choice was correct (null if correctness is unknown). */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Canonical index of the correct option (null if unknown). */
      correct_option: { type: jspsych.ParameterType.INT },
      /** The pressed key, when response_ui is "keyboard". */
      response: { type: jspsych.ParameterType.STRING },
      /** Confidence rating 1..N where N = confidence_labels.length (default 4: 1 = Guess ... 4 = Certain), or null when not collected. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the choice to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click, a second response separate from the choice (collect_confidence only; else null). The rating picker is click-only, so there is no keyboard counterpart. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The studied item specs, as given/generated (as strings). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Item shape used ("disk" or "square"). */
      item_shape: { type: jspsych.ParameterType.STRING },
      /** The option specs, in canonical order (as strings). */
      test_options: { type: jspsych.ParameterType.STRING, array: true },
      /** Display order (canonical option index at each display position). */
      option_order: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the probed item (after clamping to 0..set_size-1). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Number of items in the memory array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Measured time (ms) from array onset to hide, via performance.now() at the paint and clear calls (null on the invalid-config path). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per study item: placeholder index (`position`), centre (`x`,`y`, px in the stage frame), `rotation`, and its value (`src`, `text`, or `value` for colors). */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Mouse-trajectory samples (only when record_mouse): rows of [t, x, y, value], value = nearest option index during the response. */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory row (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first response-phase mouse sample (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before delay_start and any pre-cue; array: the memory array's onset (absent when display_time is 0 and not sequential, since no array is shown); mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset; report: the response options appear (any retro-cue falls between delay and report); confidence: the confidence popup opens (collect_confidence only). */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Auto-zoom scale of the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout in the mouse-trajectory frame (only when record_mouse): each option's box (index/value/correct/x/y/w/h) and target_option (the correct one's centre). `confidence_options` holds the rating-button boxes (value 1..N) when collect_confidence is on, else null. */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class WmForcedChoicePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;
      const optSize = trial.option_size || trial.item_size;

      // ---- Resolve the memory items (color / image / wheel-degree / text) ----
      let specs = trial.stimuli.slice();
      // set_size 0 would leave nothing to probe (studied undefined -> crash), so generate >= 1.
      if (specs.length === 0) specs = U.randomColorDegrees(Math.max(1, trial.set_size), trial.min_color_distance);
      const setSize = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const itemsAreColor = items.length > 0 && items.every((it) => it.kind === "color");
      // Warn (only) about stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "wm-forced-choice", setSize: setSize, supportsEnsemble: false, values: specs });
      U.checkParams(trial, { plugin: "wm-forced-choice", setSize: setSize, min: { choices_per_test: 2 },
        nonneg: ["option_gap", "option_margin"],
        enums: { option_layout: ["center", "row", "grid", "circle"], response_ui: ["mouse", "keyboard"], item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "square"] } });
      // Color items drawn as squares (item_shape "square") instead of disks.
      const square = trial.item_shape === "square";
      // An unrecognized response_ui would attach neither a click handler nor a keyboard
      // listener and the trial would never end, so fall back to "mouse". Kept in a local (as are
      // the clamps below): trial is jsPsych's stored copy of the parameters
      // (save_trial_parameters reads it), so it is never modified.
      const responseUi = trial.response_ui !== "keyboard" && trial.response_ui !== "mouse" ? "mouse" : trial.response_ui;

      // Clamp degenerate configs. The clamped which_test is the one logged, so the recorded
      // probe index matches what was tested. item_positions -> one distinct slot per item
      // (U.resolvePositions: invalid and repeated slots dropped, missing ones padded with
      // random unused slots), with enough placeholders for every item and slot used.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "wm-forced-choice" });
      const studied = items[whichTest];
      const studiedSpec = specs[whichTest];
      const studyRot = trial.color_rotation_deg.length ? (trial.color_rotation_deg[whichTest] || 0) : 0;

      // ---- Build the test options (canonical order) + the correct index ----
      // Each option: { item, spec, rotation }. buildOptions returns null when there is
      // nothing to build options from (image/text items with no test_options); the trial
      // then ends at once with an all-null response.
      const plan = buildOptions();
      if (!plan) {
        display_element.innerHTML =
          "<p style='color:#a00'>wm-forced-choice: cannot build test options. " +
          "Provide <code>test_options</code> for image/text items.</p>";
        // Nothing is presented and positions are not chosen yet, so record only each
        // study item's value and the hue rotation it would have had.
        const stimuli_shown = items.map((it, i) => {
          const rotation = trial.color_rotation_deg.length ? (trial.color_rotation_deg[i] || 0) : 0;
          const rec = { rotation: rotation };
          if (it.kind === "image") rec.src = it.src;
          else if (it.kind === "text") rec.text = it.text;
          else rec.value = specs[i]; // color: hue degree or css spec
          return rec;
        });
        const data = {
          rt: null, chosen_option: null, chosen_position: null, chosen_spec: null,
          correct: null, correct_option: null, response: null,
          confidence: null, rt_confidence: null, confidence_mouse_hold_duration: null,
          // Response-duration columns stay present here so the data frame is not ragged.
          mouse_hold_duration: null, key_hold_duration: null,
          key_presses: null, multiple_keys_pressed: false,
          positions: [], stimuli: specs.map(toStr), test_options: [], option_order: [],
          which_test: whichTest, set_size: setSize, item_shape: square ? "square" : "disk",
          stimuli_shown: stimuli_shown,
          actual_stim_duration: null, // no array was shown
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
        return;
      }
      const options = plan.options;
      const correctIndex = plan.correctIndex;

      // ---- Display order (display position -> canonical option index) --------
      let order = options.map((_, i) => i);
      if (trial.shuffle_options) order = jsPsych.randomization.shuffle(order);
      else if (plan.generated) {
        U.noteOnce("wm-forced-choice", "unshuffled-generated", "shuffle_options is false with generated " +
          "options: the target is always option 0 (same screen slot every trial).");
      }

      // ---- Gather image srcs to preload (memory items + options) ------------
      const needsPixel =
        trial.color_rotation_deg.length ||
        trial.test_color_rotation_deg.length ||
        trial.preview_duration > 0;
      const imgSrcs = items.concat(options.map((o) => o.item))
        .filter((it) => it.kind === "image")
        .map((it) => it.src);

      // ---- Preload, then build and run (trial() stays synchronous) ----------
      U.loadImages(imgSrcs, { needsPixel: needsPixel }).then((imgCache) => {

      // ---- Item locations (chosen above by resolvePositions) ----------------
      const pos = placed.pos;

      // ---- Layout ------------------------------------------------------------
      const boxSize = 2 * trial.radius + 2 * trial.item_size + 40;
      const center = boxSize / 2;
      const offsetRad = (trial.position_angle_offset * Math.PI) / 180;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // Height of the below-stage options strip, reserved up front so auto_zoom leaves room
      // for it and the box does not move when the options appear. Mirrors the geometry in
      // renderOptions (grid: ceil(k/cols) rows; circle: a ring). Sized from the options
      // actually built, which differs from choices_per_test when test_options or
      // test_color_rotation_deg supply them.
      // Each option canvas has a 1px border, so it is optSize + 2 tall.
      const kOpt = Math.max(1, options.length), optBox = optSize + 2;
      let optStripH = 0;
      if (trial.option_layout === "grid") {
        const oCols = Math.ceil(Math.sqrt(kOpt)), oRows = Math.ceil(kOpt / oCols);
        optStripH = 18 + oRows * optBox + (oRows - 1) * 14;
      } else if (trial.option_layout === "circle") {
        const oR = Math.max(optSize, (kOpt * (optSize + 14)) / (2 * Math.PI));
        optStripH = 18 + 2 * oR + optBox;
      } else if (trial.option_layout !== "center") { // row (flex, one line)
        optStripH = optBox + 36;
      }

      const centerLayout = trial.option_layout === "center";
      // The placeholders, fixation, and message fill the square stage. Image/text
      // placeholders get a CSS border; color items get a drawn circular outline
      // (placeholderMem) and a rounded canvas, so box-shadow cues follow the circle.
      const phBorder = itemsAreColor ? (square ? "" : "border-radius:50%;") : `border:${trial.placeholder_border};box-sizing:border-box;`;
      let stageHTML = "";
      for (let i = 0; i < numPh; i++) {
        const ang = (2 * Math.PI * i) / numPh + offsetRad;
        const top = Math.cos(ang) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin(ang) * trial.radius + center - trial.item_size / 2;
        stageHTML +=
          `<canvas id="wmfc-item-${i}" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;${phBorder}top:${top}px;left:${left}px"></canvas>`;
      }
      // The start message sits in the band above the topmost placeholder (whose top edge is
      // item_size/2 + 20 below the stage top), so it clears it at any radius/item_size.
      const startBand = Math.max(24, Math.round(trial.item_size / 2 + 20));
      stageHTML +=
        `<span id="wmfc-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="wmfc-message" style="position:absolute;top:0;left:0;width:100%;height:${startBand - 6}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 10px;` +
        `box-sizing:border-box;overflow:hidden;pointer-events:none">${startText}</div>`;
      // "center" options are drawn inside the stage, so the box stays square and the prompt
      // goes below it. row/grid/circle options go in a panel below the stage, inside the
      // same box, with optStripH reserved for them.
      const panelHTML = centerLayout ? "" :
        `<div id="wmfc-options" style="margin:0 auto;min-height:${optStripH}px"></div>` +
        (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
      let html = U.stageBox({ idPrefix: "wmfc", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);
      if (centerLayout && trial.prompt) html += `<div style="text-align:center;margin-top:8px">${trial.prompt}</div>`;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#wmfc-box"));

      // ---- State -------------------------------------------------------------
      let optionsOnset = null;
      let responded = false;
      let mouseHold = null; // hold of the committing click (mouse UI), or null
      let keyHold = null;   // hold of the committing key (keyboard UI), or null
      let confidence = null; // 1..N when collect_confidence; null otherwise
      let confRt = null;     // ms from the choice to the confidence rating
      let confHold = null;   // ms the button was held for the confidence-rating click
      let confGeom = null;   // rating-button boxes (stage frame), for mouse_geometry.confidence_options
      let kbListener = null;
      let rearmKeyboard = null; // re-arms the keyboard listener (set in renderOptions; used when a rating is cleared)
      let visualOrder = []; // displayPos values in screen reading order (top row first, then left to right)
      let arrayOnset = null; // performance.now() at array onset (first item painted)
      let actualStim = null; // measured array on-screen time (ms)
      let mt = null;         // optional mouse-trajectory recorder (record_mouse)
      let optEls = [];       // clickable option elements (display order) + identity/correctness, for mouse geometry

      // ---- Paint helpers -----------------------------------------------------
      const itemCanvas = (p) => display_element.querySelector(`#wmfc-item-${p}`);
      const paintMem = (p, item, opts) =>
        paint(itemCanvas(p).getContext("2d"), item, trial.item_size, imgCache, Object.assign({ circle: !square }, opts));
      // Empty placeholder outline (color stimuli only): a circle at the radius the painted
      // disk uses, or the square's edge, so the painted item covers it exactly.
      const placeholderMem = (p) => {
        const ctx = itemCanvas(p).getContext("2d");
        const s = trial.item_size;
        ctx.clearRect(0, 0, s, s);
        ctx.lineWidth = 1; ctx.strokeStyle = "#999";
        if (square) { ctx.strokeRect(0.5, 0.5, s - 1, s - 1); return; }
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, s / 2 - 1, 0, 2 * Math.PI);
        ctx.stroke();
      };
      const clearMem = (p) => {
        if (itemsAreColor) placeholderMem(p);
        else itemCanvas(p).getContext("2d").clearRect(0, 0, trial.item_size, trial.item_size);
      };
      // Show placeholder circles at all locations up front (color stimuli).
      if (itemsAreColor) for (let i = 0; i < numPh; i++) placeholderMem(i);
      const setMsg = (h) => (display_element.querySelector("#wmfc-message").innerHTML = h);

      // Encoding cue rings (cue_items), drawn with U.spatialCue.
      let cueClears = [];
      const drawCues = (on) => {
        cueClears.forEach((clear) => clear());
        cueClears = [];
        if (!on) return;
        trial.cue_items.forEach((idx) => {
          const el = itemCanvas(pos[idx]);
          if (el) cueClears.push(U.spatialCue(el, { color: trial.cue_color, thickness: trial.cue_thickness }));
        });
      };
      // Noise overlays on the memory items (never the options), keyed by placeholder
      // index; removed when an item is cleared.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const addNoise = (p) => {
        clearNoise(p);
        if (trial.noise_level > 0) {
          noiseRemovers[p] = U.noiseOverlay(itemCanvas(p), trial.noise_level, trial.noise_type, { wheel });
        }
      };

      // ---- Phase: start ------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#wmfc-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.record_mouse) {
          // With click_to_start the cursor is on the central fixation, so seed the
          // trajectory at stage centre; otherwise it starts at the first mousemove.
          mt = U.makeMouseTracker(display_element.querySelector("#wmfc-stage"), performance.now(),
            { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter();
          mt.mark("encoding");
        }
        jsPsych.pluginAPI.setTimeout(beginEncoding, trial.delay_start);
      };

      const beginEncoding = () => {
        if (U.wantPrecue(trial)) { // only with a test to cue (do_test)
          // Pre-cue the to-be-probed location (whether or not it is in cue_items), plus any
          // cue_items rings. The probe ring comes off before the array; showArray redraws the
          // cue_items rings. Clear in reverse order of drawing: each spatialCue restores the
          // shadow it found, so clearing the probe ring first would let a cue_items ring on
          // the same element restore the probe ring and leave it up for the whole trial.
          const probeEl = itemCanvas(pos[whichTest]);
          const preClear = probeEl ? U.spatialCue(probeEl, { color: trial.cue_color, thickness: trial.cue_thickness }) : null;
          drawCues(true);
          jsPsych.pluginAPI.setTimeout(() => { drawCues(false); if (preClear) preClear(); showArray(); }, trial.precue_time);
        } else {
          showArray();
        }
      };

      // ---- Phase: show the memory array -------------------------------------
      const showArray = () => {
        arrayOnset = performance.now();
        if (trial.display_time <= 0 && !trial.sequential) { hideArray(); return; }
        if (mt) mt.mark("array");
        drawCues(true);
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          // Noise goes on the memory items only; options and preview are painted elsewhere.
          paint: (i) => { paintMem(pos[i], items[i], { rotation: trial.color_rotation_deg.length ? (trial.color_rotation_deg[i] || 0) : 0 }); addNoise(pos[i]); },
          clear: (i) => { clearNoise(pos[i]); clearMem(pos[i]); },
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      // ---- Phase: hide the array, optional mask, then the retention interval --
      const hideArray = () => {
        actualStim = Math.round(performance.now() - arrayOnset);
        for (let i = 0; i < setSize; i++) { clearNoise(pos[i]); clearMem(pos[i]); }
        drawCues(false);
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          if (mt) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(afterDelay, trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time is 0 or do_test is false.
        if (trial.mask_time > 0 && trial.do_test) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemCanvas(pos[i]), trial.mask_type, { wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // ---- Phase: optional post-delay retro-cue, then test -------------------
      // When retrocue_time > 0, ring only the to-be-probed location (cue_color/
      // cue_thickness) for retrocue_time ms before the test. The ring is not cleared:
      // cue_test_location overwrites it with the black test ring, and with
      // cue_test_location off it stays up as the only marker of the probed location.
      const afterDelay = () => {
        if (trial.retrocue_time > 0 && trial.do_test) {
          U.spatialCue(itemCanvas(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(showTest, trial.retrocue_time);
        } else {
          showTest();
        }
      };

      // ---- Phase: test -------------------------------------------------------
      const showTest = () => {
        if (!trial.do_test) {
          finish(null, null, null, null); // study-only: end with no response
          return;
        }
        // No location ring with a preview: the grayscale item already marks the location,
        // and it is not added back once the options appear.
        if (trial.cue_test_location && trial.preview_duration <= 0) {
          itemCanvas(pos[whichTest]).style.boxShadow = "0 0 0 5px #000";
        }
        if (trial.preview_duration > 0) {
          // Grayscale preview of the probed item at its location, then options.
          paintMem(pos[whichTest], studied, { rotation: studyRot, grayscale: true });
          display_element.querySelector("#wmfc-fixation").style.display = "none";
          jsPsych.pluginAPI.setTimeout(() => {
            clearMem(pos[whichTest]);
            renderOptions();
          }, trial.preview_duration);
        } else {
          renderOptions();
        }
      };

      // ---- Render the options & collect a response --------------------------
      const renderOptions = () => {
        const k = options.length;
        // "center" draws the options inside the stage around fixation; the other layouts
        // fill the strip reserved below the stage.
        const centerLayout = trial.option_layout === "center";
        const container = display_element.querySelector(centerLayout ? "#wmfc-stage" : "#wmfc-options");
        const cols = trial.option_layout === "grid" ? Math.ceil(Math.sqrt(k)) : k;

        // Below-box container layout (center draws inside the box, no container styling).
        if (trial.option_layout === "grid") {
          container.style.cssText =
            `margin:18px auto 0;display:grid;justify-content:center;gap:14px;` +
            `grid-template-columns:repeat(${cols},${optSize}px)`;
        } else if (trial.option_layout === "circle") {
          const r = Math.max(optSize, (k * (optSize + 14)) / (2 * Math.PI));
          container.style.cssText =
            `position:relative;margin:18px auto 0;width:${2 * r + optSize}px;height:${2 * r + optSize}px`;
        } else if (!centerLayout) {
          container.style.cssText =
            `margin:18px auto 0;display:flex;gap:18px;justify-content:center;align-items:center;flex-wrap:wrap`;
        }

        // "center" layout: the options sit on a small ring around fixation, inside the
        // placeholder ring (at trial.radius). The clear central zone is small, so with
        // more than 2-3 options the option diameter shrinks rather than crowding or
        // overlapping the placeholders.
        let ring = 0, centerOptD = optSize;
        if (centerLayout && k > 1) {
          const margin = trial.option_margin; // clearance between an option's outer extent and the placeholders
          const gap = trial.option_gap;       // min gap between adjacent options
          // A color option is a circle (outer extent d/2); an image/text option is a square,
          // whose corner is sqrt(2) farther out (d/2 * sqrt(2)). Using that as the clearance
          // extent keeps square corners out of the placeholder ring.
          const fOpt = square || options.some((o) => o.item && o.item.kind !== "color") ? Math.SQRT2 : 1;
          // The same holds for the placeholders: a color placeholder is a disk reaching
          // item_size/2 toward the centre, but a square image/text placeholder at a diagonal
          // angle reaches in by its corner, item_size/2 * sqrt(2).
          const fPh = itemsAreColor && !square ? 1 : Math.SQRT2;
          // Rclear = the largest radius an option's outer extent may reach while staying
          // `margin` clear of the placeholders' inner extent.
          const Rclear = Math.max(20, trial.radius - fPh * trial.item_size / 2 - margin);
          // Treat each option as its bounding circle, diameter eff = fOpt*d. With k on a ring
          // of radius R, adjacent centres are 2*R*sin(pi/k) apart, so a `gap` between them
          // needs 2*R*s = eff + gap, and the outer extent stays inside when R + eff/2 = Rclear.
          // The largest eff meeting both is (2*s*Rclear - gap)/(1+s); the drawn size is
          // d = eff/fOpt, so for a square it is the diagonal that fits.
          const s = Math.sin(Math.PI / k);
          const effFit = (2 * s * Rclear - gap) / (1 + s);
          centerOptD = Math.max(28, Math.min(optSize, effFit / fOpt)); // shrink below optSize only when needed; 28 px floor
          const eff = fOpt * centerOptD;
          // Ring radius: the tighter of (eff+gap)/(2s), which keeps the gap between
          // neighbours, and Rclear - eff/2, which keeps the extents inside.
          ring = Math.min((eff + gap) / (2 * s), Rclear - eff / 2);
        }

        order.forEach((canon, displayPos) => {
          const opt = options[canon];
          const dsz = centerLayout ? centerOptD : optSize;
          const cv = document.createElement("canvas");
          cv.width = dsz;
          cv.height = dsz;
          cv.style.cursor = "pointer";
          if (opt.item.kind === "color" && !square) cv.style.borderRadius = "50%";
          cv.style.border = "1px solid #222";
          if (centerLayout) {
            const a = (2 * Math.PI * displayPos) / k; // 0deg = right; k=2 -> right & left of fixation
            cv.style.position = "absolute";
            cv.style.left = `${center + Math.cos(a) * ring - dsz / 2}px`;
            cv.style.top = `${center + Math.sin(a) * ring - dsz / 2}px`;
            cv.style.zIndex = "5"; // above the (now-blank) memory placeholders
          } else if (trial.option_layout === "circle") {
            const r = (parseInt(container.style.width) - optSize) / 2;
            const a = (2 * Math.PI * displayPos) / k - Math.PI / 2;
            cv.style.position = "absolute";
            cv.style.top = `${Math.sin(a) * r + r}px`;
            cv.style.left = `${Math.cos(a) * r + r}px`;
          }
          cv.dataset.pos = displayPos;
          paint(cv.getContext("2d"), opt.item, dsz, imgCache, { rotation: opt.rotation || 0, circle: !square });
          if (responseUi === "mouse") {
            cv.addEventListener("click", (e) => { if (mt) mt.sample(e); choose(displayPos, null); });
          }
          // For mouse_geometry: the option element (display order), its canonical index,
          // and whether it is the correct one.
          optEls.push({ el: cv, value: canon, correct: correctIndex != null && canon === correctIndex });
          container.appendChild(cv);
        });

        optionsOnset = performance.now();
        // Log every key released from response onset, so trials with more than one
        // response key pressed can be excluded (see info.data).
        U.beginPressLog(optionsOnset);
        if (mt) {
          // Response window: switch to the response sample rate and record, per sample,
          // the nearest option (index into optEls / mouse_geometry).
          mt.mark("report");
          mt.setValueFn(U.nearestChoiceFn(optEls.map((c) => c.el)));
        }

        // Screen reading order of the options: rows top to bottom, left to right within a
        // row. It maps choice_keys to options and gives chosen_position. The "center" and
        // "circle" rings place options by angle (displayPos 0 is on the right), so the raw
        // displayPos is not the screen order.
        const optRects = Array.prototype.slice
          .call(container.querySelectorAll("canvas[data-pos]"))
          .map((c) => { const r = c.getBoundingClientRect(); return { pos: +c.dataset.pos, x: r.left, y: r.top, h: r.height }; });
        // Same-row test in the scaled (screen) frame: half an option's on-screen height, so
        // rows group correctly under auto_zoom.
        const rowThresh = (optRects[0] ? optRects[0].h : optSize) * 0.5;
        visualOrder = optRects
          .sort((a, b) => (Math.abs(a.y - b.y) > rowThresh ? a.y - b.y : a.x - b.x))
          .map((o) => o.pos);

        // Single-shot keyboard listener. It is exposed as rearmKeyboard because the
        // persist:false listener is used up by the first press, and a participant who
        // clears the confidence rating needs it back to choose again.
        const armKeyboard = () => {
          if (kbListener) jsPsych.pluginAPI.cancelKeyboardResponse(kbListener);
          kbListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: (i) => {
              const j = trial.choice_keys.findIndex((key) => jsPsych.pluginAPI.compareKeys(key, i.key));
              if (j > -1 && j < k) choose(visualOrder[j], i.key);
            },
            valid_responses: trial.choice_keys.slice(0, k),
            rt_method: "performance",
            persist: false,
          });
        };
        rearmKeyboard = armKeyboard;
        if (responseUi === "keyboard") {
          if (trial.choice_keys.length < k) {
            U.warnOnce("wm-forced-choice", "choice_keys has " + trial.choice_keys.length + " key(s) but there are " +
              k + " options; options beyond the last key are unreachable by keyboard (give one key per option).");
          }
          armKeyboard();
        }
      };

      // ---- Record the choice, then optional confidence and feedback ------------
      const choose = (displayPos, key) => {
        // Mouse: read the hold first, so every click consumes its own press; an ignored
        // click must not leave its duration for the next one.
        const hold = key == null ? U.mouseHoldDuration() : null;
        if (responded) return;
        responded = true;
        mouseHold = hold;
        keyHold = null;
        const rt = Math.round(performance.now() - optionsOnset);
        const canon = order[displayPos];
        // Keyboard: getKeyboardResponse fires on KeyDown, so the hold is not known yet.
        // Wait for the release before the confidence popup / feedback / finish
        // (CONVENTIONS §11); rt is already stamped at KeyDown.
        if (key != null) {
          U.awaitKeyUp(key).then(finishOnce.guard((h) => { keyHold = h; afterChoice(displayPos, key, rt, canon); }));
          return;
        }
        afterChoice(displayPos, key, rt, canon);
      };

      const afterChoice = (displayPos, key, rt, canon) => {
        // collect_confidence: ask for the rating (popup anchored to the chosen option)
        // before committing and feedback. The x button un-commits so the participant can
        // choose again (keyboard mode re-arms the listener).
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`canvas[data-pos="${displayPos}"]`);
          const box = display_element.querySelector("#wmfc-box");
          const t0 = performance.now();
          // The tracker keeps recording through the popup, so mark the confidence onset;
          // analysis can then split the path to the answer from the path to the rating.
          // Re-marked each time the popup opens.
          if (mt) mt.mark("confidence");
          const cp = U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              // Read the rating click's hold before the clear branch, so an x click consumes
              // its own press. The rating is a separate response with its own RD.
              const cHold = U.mouseHoldDuration();
              if (conf == null) { // x -> choose again (re-arm the consumed keyboard listener)
                responded = false;
                if (responseUi === "keyboard" && rearmKeyboard) rearmKeyboard();
                return;
              }
              confidence = conf;
              confHold = cHold;
              confRt = Math.round(performance.now() - t0);
              commitChoice(canon, displayPos, key, rt);
            });
          // Close the popup if the trial ends while it is still open.
          finishOnce.onEnd(cp.teardown);
          // Record the rating-button boxes (trajectory frame) while the popup is in the DOM;
          // it is removed on pick. After a re-choice the latest popup's boxes are kept,
          // matching the rating actually given.
          if (trial.record_mouse && cp && cp.buttons) {
            confGeom = U.discreteChoiceGeometry(
              display_element.querySelector("#wmfc-stage"),
              cp.buttons.map((b) => ({ el: b.el, value: b.value })),
            );
          }
          return;
        }
        commitChoice(canon, displayPos, key, rt);
      };

      // ---- Commit the choice, then optional feedback ----------------------------
      const commitChoice = (canon, displayPos, key, rt) => {
        if (kbListener) jsPsych.pluginAPI.cancelKeyboardResponse(kbListener);
        const correct = correctIndex == null ? null : canon === correctIndex;

        if (trial.feedback) {
          // Option canvases carry data-pos and live in #wmfc-stage (center) or #wmfc-options.
          const optEl = (p) => display_element.querySelector(`canvas[data-pos="${p}"]`);
          // box-shadow follows the option's shape: a ring for color disks, a square otherwise.
          const chosenEl = optEl(displayPos);
          if (chosenEl) chosenEl.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
          if (correct === false && correctIndex != null) {
            const correctEl = optEl(order.indexOf(correctIndex));
            if (correctEl) correctEl.style.boxShadow = "0 0 0 4px #2ecc40";
          }
          // Sound/confetti only when accuracy is defined (correctIndex not null).
          if (correct === true || correct === false) {
            U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          }
          jsPsych.pluginAPI.setTimeout(() => finish(canon, displayPos, key, rt), 700);
        } else {
          finish(canon, displayPos, key, rt);
        }
      };

      // ---- Finish ------------------------------------------------------------
      const finish = (canon, displayPos, key, rt) => {
        const correct = canon == null || correctIndex == null ? null : canon === correctIndex;
        // chosen_position = the chosen option's index in screen reading order, comparable
        // across layouts (in center/circle the raw displayPos is an angle index).
        const chosenVisual = displayPos == null ? null
          : (visualOrder.indexOf(displayPos) >= 0 ? visualOrder.indexOf(displayPos) : displayPos);
        // Every study item, not just the probed one, so non-probed values and rotations
        // are available for swap/interference modeling.
        const stimuli_shown = items.map((it, i) => {
          const rotation = trial.color_rotation_deg.length ? (trial.color_rotation_deg[i] || 0) : 0;
          const ang = (2 * Math.PI * pos[i]) / numPh + offsetRad;
          const rec = {
            position: pos[i],
            x: Math.sin(ang) * trial.radius + center,
            y: Math.cos(ang) * trial.radius + center,
            rotation: rotation,
          };
          if (it.kind === "image") rec.src = it.src;
          else if (it.kind === "text") rec.text = it.text;
          else rec.value = specs[i]; // color: hue degree or css spec
          return rec;
        });
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: mouseHold,
          ...U.keyHoldData(keyHold, key, U.endPressLog()),
          chosen_option: canon,
          chosen_position: chosenVisual,
          chosen_spec: canon != null ? toStr(options[canon].spec) : null,
          correct: correct,
          correct_option: correctIndex,
          response: key || null,
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          positions: pos,
          stimuli: specs.map(toStr),
          test_options: options.map((o) => toStr(o.spec)),
          option_order: order,
          which_test: whichTest,
          set_size: setSize,
          item_shape: square ? "square" : "disk",
          stimuli_shown: stimuli_shown,
          actual_stim_duration: actualStim,
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
          // Option boxes and the correct answer in the trajectory frame (centred on
          // #wmfc-stage); discreteChoiceGeometry handles options in the stage or the panel.
          data.mouse_geometry = U.discreteChoiceGeometry(display_element.querySelector("#wmfc-stage"), optEls);
          // Rating-button boxes (value 1..N) in the same frame, or null without collect_confidence.
          data.mouse_geometry.confidence_options = confGeom ? confGeom.options : null;
        }
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // ---- Kick off ----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#wmfc-fixation").addEventListener("click", start);
      } else {
        start();
      }

      }); // end loadImages().then

      // ===================================================================
      // Build the canonical option list + the correct index (synchronous).
      // ===================================================================
      function buildOptions() {
        // Path B: hue-rotated copies of the probed image.
        if (trial.test_color_rotation_deg.length) {
          if (studied.kind !== "image") return null;
          const rots = trial.test_color_rotation_deg;
          const opts = rots.map((deg) => ({
            item: { kind: "image", src: studied.src },
            spec: deg,
            rotation: deg,
          }));
          let ci = trial.correct_option;
          if (ci == null) ci = rots.findIndex((d) => d === studyRot);
          return { options: opts, correctIndex: ci < 0 ? null : ci };
        }

        // Path A: explicit option specs. An empty list counts as omitted: zero options
        // would leave nothing to click and the trial would never end.
        const given = trial.test_options == null ? [] : [].concat(trial.test_options);
        if (given.length) {
          const opts = given.map((s) => ({
            item: U.resolveItem(s, wheel, forceType),
            spec: s,
            rotation: 0,
          }));
          let ci = trial.correct_option;
          if (ci == null) ci = opts.findIndex((o) => sameItem(o.item, studied));
          return { options: opts, correctIndex: ci < 0 ? null : ci };
        }

        // Path C: generate distractors (color items only).
        if (studied.kind === "color") {
          const k = Math.max(2, trial.choices_per_test);
          // k-1 distractors, each at least min_color_distance (and at least 1 deg) of hue from
          // the target and from each other (U.generateFoils; it warns once if fewer fit). A
          // wheel-degree target gets wheel-color distractors. An off-wheel target (e.g. "#0a0")
          // gets its own color hue-rotated in CIELAB, so every option shares its lightness and
          // chroma and only hue tells them apart.
          const distractors = U.generateFoils(
            typeof studiedSpec === "number" ? studiedSpec : studied.css, k - 1, trial.min_color_distance,
            { wheel: wheel, plugin: "wm-forced-choice", countParam: "choices_per_test" });
          const specsOpt = [studiedSpec].concat(distractors); // index 0 = correct
          const opts = specsOpt.map((s) => ({
            item: U.resolveItem(s, wheel, forceType),
            spec: s,
            rotation: 0,
          }));
          return { options: opts, correctIndex: 0, generated: true };
        }

        // Image/text items with no options to build from.
        return null;
      }
    }
  }
  WmForcedChoicePlugin.info = info;

  // ===== module-private helpers =====
  function sameItem(a, b) {
    if (a.kind !== b.kind) return false;
    if (a.kind === "image") return a.src === b.src;
    if (a.kind === "text") return a.text === b.text;
    return a.css === b.css;
  }
  function toStr(s) { return s == null ? null : String(s); }

  // Paint one item onto a square canvas: color (as a disk, or a filled square with
  // opts.circle false), text, or image, with optional CIELAB hue rotation (images) and
  // grayscale.
  function paint(ctx, item, size, imgCache, opts) {
    opts = opts || {};
    U.paintItem(ctx, item, size, imgCache, { rotation: opts.rotation, grayscale: opts.grayscale, circle: opts.circle !== false });
  }

  return WmForcedChoicePlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-wm-pairs.js */
/* ===================================================================== */
/*
 * jspsych-wm-pairs.js  --  jsPsych v8 plugin   (registered name: "wm-pairs")
 *
 * Working memory for concentric two-color objects. Each memory item is one
 * object with an outer disc color and a smaller inner disc color drawn on top of
 * it. `set_size` objects are shown around a circle, then blanked for a retention
 * delay. At test one object is probed and the participant reports one of its two
 * colors (outer or inner): the probe is an [item, sub-feature] pair.
 *
 * Response: n-alternative forced choice. A row of clickable color swatches
 * (`test_color_options`) appears below the array, the probed sub-feature is ringed
 * in black, and the participant clicks the swatch matching its remembered color.
 *
 * Notes:
 *   - The probe is [which_test (item index), probe_feature ("outer"/"inner")]; a
 *     2-element [item, 0 = outer / 1 = inner] array passed as which_test also works.
 *   - Colors accept wheel degrees, "lab(...)", or CSS. Pair colors and test options
 *     are generated when omitted. Generated distractors are random hues at least
 *     min_color_distance from the target and from each other; they are not swap
 *     (other-object) or conjunction (other-sub-feature) foils. Give
 *     test_color_options to control the foils.
 *   - Feedback is a green/red ring on the probed sub-feature plus a +10/-10 flash.
 *     Points are tallied on every trial (show_points displays the running total).
 *   - precue_time / retrocue_time / noise_level + noise_type / mask_time + mask_type
 *     are the standard location manipulations (noise/mask kinds from
 *     BradyUtils.noiseKinds/maskKinds, registerNoise/registerMask, or a function).
 *
 * Trial-ending rule (CONVENTIONS.md §3): the trial is timer/listener driven, so
 * trial() is synchronous and calls this.jsPsych.finishTrial(data) later, once, through
 * U.makeFinisher. No images are used, so there is no preload step.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychWmPairs = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  // Running points total. Module-level, so it carries across trials (and across jsPsych
  // instances on the same page) until the page reloads.
  let pointsTotal = 0;

  const info = {
    name: "wm-pairs",
    version: version,
    parameters: {
      // ---- The two-color memory objects -------------------------------------
      /**
       * The objects, as an array of [outer, inner] color pairs. Each color may be
       * a number (degree on the color wheel), a numeric string ("120" is the same
       * degree, as everywhere a color is expected), a CSS color string ("rgb(...)",
       * "#0f0"), or a "lab(L,a,b)" string, e.g. [[0,180],[90,270],[45,315]] for 3
       * objects. If empty, `set_size` random wheel-color pairs are generated.
       */
      pair_colors: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Number of objects to generate when `pair_colors` is empty (at least 1). */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between the two colors of a generated pair, and between
          generated distractor swatches and the target / each other (values below 1 count
          as 1 for distractors, so none duplicates the target). */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 20 },
      /** Color wheel for degree lookups (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },

      // ---- Layout ------------------------------------------------------------
      /** Number of equally-spaced locations objects can occupy (0 = use set_size). */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 0 },
      /** Radius (px) of the circle the objects are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each object's outer disc. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Inner disc diameter as a fraction of `item_size` (default 60/110). */
      inner_size_ratio: { type: jspsych.ParameterType.FLOAT, default: 60 / 110 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },

      // ---- The probe ---------------------------------------------------------
      /**
       * Which object is probed: an item index (0..set_size-1), or the 2-element
       * array [item_index, inner_or_outer] with 0 = outer, 1 = inner. Out-of-range
       * indices are clamped. Declared OBJECT, not INT, because jsPsych 8 coerces a
       * non-array INT parameter to a number and would turn the array form into NaN.
       */
      which_test: { type: jspsych.ParameterType.OBJECT, default: 0 },
      /** Which sub-feature is probed: "outer" or "inner" (ignored if which_test is an array). */
      probe_feature: { type: jspsych.ParameterType.STRING, default: "outer" },

      // ---- The forced-choice test options -----------------------------------
      /**
       * The clickable color swatches shown at test, as wheel degrees / CSS /
       * "lab(...)". Should include the probed sub-feature's true color; a swatch counts
       * as correct when its resolved CSS string equals the target's. Shown in the
       * order given (not shuffled). If empty, `num_test_options` swatches are generated
       * (the true color + distractors) and shuffled.
       */
      test_color_options: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** How many swatches to generate when `test_color_options` is empty (min 2). */
      num_test_options: { type: jspsych.ParameterType.INT, default: 4 },
      /** Diameter (px) of each test-option swatch. */
      option_size: { type: jspsych.ParameterType.INT, default: 60 },

      // ---- Timing ------------------------------------------------------------
      /** How long (ms) the objects are shown (0 = not shown, unless sequential). */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) between object offset and the probe. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, ring the probed sub-feature (`cue_color`/`cue_thickness`) for this long
          right after the start, then wait delay_start before the array. 0 = off. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /**
       * Retro-cue duration (ms). When > 0, after the retention delay
       * the probed sub-feature is ringed (`cue_color`/`cue_thickness`) for this long
       * before the swatches appear. With the default cue color and thickness this is the
       * same ring used at the probe. 0 = no retro-cue.
       */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each object (outer +
          inner disc) covered by the `noise_type` degradation (a transparent overlay;
          removed at array offset). The swatches are never degraded. */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Delay (ms) from start (click or onset), or from the end of the pre-cue, to object onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },

      // ---- Feedback / misc ---------------------------------------------------
      /** Ring the probed sub-feature green/red after responding and flash +10/-10. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Show the running points total at the top of the box (it is updated on screen only by feedback). */
      show_points: { type: jspsych.ParameterType.BOOL, default: true },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "rgb(145,145,145)" },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) from the options becoming clickable to the click. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Index of the probed object (0..set_size-1). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Which sub-feature was probed: "outer" or "inner". */
      probe_feature: { type: jspsych.ParameterType.STRING },
      /** Sub-feature index probed: 0 = outer, 1 = inner. */
      feature_index: { type: jspsych.ParameterType.INT },
      /** Index of the clicked swatch in the recorded test_color_options (display order, left to right). */
      reported_index: { type: jspsych.ParameterType.INT },
      /** The reported (clicked) color, as CSS. */
      reported_color: { type: jspsych.ParameterType.STRING },
      /** The reported (clicked) color, as originally specified. */
      reported_spec: { type: jspsych.ParameterType.STRING },
      /** The true color of the probed sub-feature, as CSS. */
      target_color: { type: jspsych.ParameterType.STRING },
      /** The true color of the probed sub-feature, as originally specified. */
      target_spec: { type: jspsych.ParameterType.STRING },
      /** Whether the clicked swatch's resolved CSS equals the target's. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Placeholder index of each presented object. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The [outer, inner] color specs of all objects, as given/generated. */
      pair_colors: { type: jspsych.ParameterType.STRING, array: true },
      /** The test-option color specs, in display order. */
      test_color_options: { type: jspsych.ParameterType.STRING, array: true },
      /** Number of objects in the array. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Measured time (ms) from array onset to hide, via performance.now() at the paint and clear calls. */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** Running points total after this trial (+10 correct, -10 incorrect; tallied on every trial). */
      points_total: { type: jspsych.ParameterType.INT },
      /** One entry per object: `position` (placeholder index), `outer_value`/`inner_value` (specs), `outer_color`/`inner_color` (resolved CSS), and `probed`. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class WmPairsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;

      // ---- Resolve the object colors ----------------------------------------
      // pairs: array of [outerSpec, innerSpec]; pairCss: same resolved to CSS.
      let pairs = trial.pair_colors.slice();
      if (pairs.length === 0) {
        pairs = [];
        // At least one object: set_size 0 would leave nothing to probe (pairs[-1] -> crash).
        for (let i = 0; i < Math.max(1, trial.set_size); i++) {
          const two = U.randomColorDegrees(2, trial.min_color_distance);
          pairs.push([two[0], two[1]]);
        }
      }
      const setSize = pairs.length;
      // Every spec is a color, so it is resolved with resolveItem's color rule
      // (item_type "color"): a number or numeric string is a wheel degree.
      const colorCss = (spec) => U.resolveItem(spec, wheel, "color").css;
      const pairCss = pairs.map((p) => [colorCss(p[0]), colorCss(p[1])]);

      // ---- Resolve the probe (item + sub-feature) ---------------------------
      // which_test may be an INT item index, or a [item, innerOrOuter] array.
      let probeItem, featureIndex;
      if (Array.isArray(trial.which_test)) {
        probeItem = trial.which_test[0];
        featureIndex = trial.which_test[1]; // 0 = outer, 1 = inner
      } else {
        probeItem = trial.which_test;
        featureIndex = trial.probe_feature === "inner" ? 1 : 0;
      }
      // Clamp out-of-range indices (validatePlacement only warns) so the probe lookup
      // cannot throw on pairs[undefined].
      probeItem = U.whichTestIndex(probeItem, setSize, { plugin: "wm-pairs" }); // NaN -> a random item
      featureIndex = featureIndex === 1 ? 1 : 0;
      const featureName = featureIndex === 1 ? "inner" : "outer";
      const targetSpec = pairs[probeItem][featureIndex];
      const targetCss = pairCss[probeItem][featureIndex];

      // ---- Build the forced-choice test options -----------------------------
      let optSpecs = trial.test_color_options.slice();
      if (optSpecs.length === 0) {
        // Generate: the true color + distractors at least min_color_distance (and at least
        // 1 deg) of hue from the target and from each other (U.generateFoils), then shuffle.
        // A wheel-degree target gets wheel-degree distractors. A CSS/lab target is usually
        // off the wheel, so its distractors are the target itself hue-rotated in CIELAB,
        // sharing its lightness and chroma.
        const k = Math.max(2, trial.num_test_options);
        optSpecs = [targetSpec].concat(U.generateFoils(
          typeof targetSpec === "number" || U.isNumericString(targetSpec) ? Number(targetSpec) : targetCss, k - 1, trial.min_color_distance,
          { wheel: wheel, plugin: "wm-pairs", countParam: "num_test_options" }));
        optSpecs = jsPsych.randomization.shuffle(optSpecs);
      }
      const optCss = optSpecs.map(colorCss);

      // ---- Choose object locations ------------------------------------------
      // Warn (only) about which_test / item_positions mistakes.
      // The checker expects a numeric which_test, so hand it the item index of the array form.
      const trialForCheck = Array.isArray(trial.which_test) ? Object.assign({}, trial, { which_test: trial.which_test[0] }) : trial;
      U.validatePlacement(trialForCheck, { plugin: "wm-pairs", setSize: setSize, supportsEnsemble: false, userItems: trial.pair_colors.length });
      U.checkParams(trial, { plugin: "wm-pairs", setSize: setSize, enums: { probe_feature: ["inner", "outer"] } });
      // item_positions -> one distinct slot per object (U.resolvePositions: invalid and
      // repeated slots dropped, missing ones padded with random unused slots), with enough
      // placeholders for every object and slot used (num_placeholders 0 = one per object).
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPlaceholders = placed.nph;
      const pos = placed.pos;

      // ---- Layout ------------------------------------------------------------
      const itemSize = trial.item_size;
      const innerSize = Math.round(itemSize * trial.inner_size_ratio);
      const optSize = trial.option_size;
      const boxW = 2 * trial.radius + 2 * itemSize + 40;
      const arrayH = boxW;                 // square region for the circle of objects
      const bottomH = optSize + 70;        // room for the divider + option swatches
      const boxH = arrayH + bottomH;
      const cx = boxW / 2;
      const cy = arrayH / 2;               // circle centre (vertically centred in array region)
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // Shared disc CSS (a black/white double border).
      const discStyle =
        "position:absolute;border-radius:50%;border:2px solid #000;box-shadow:0 0 0 2px #fff;";

      let html =
        `<div id="wmp-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxW}px;height:${boxH}px;background:${trial.background_color}">`;

      // Points readout at the top.
      html +=
        `<div id="wmp-points" style="position:absolute;top:6px;width:100%;text-align:center;` +
        `font-weight:bold;font-family:'Courier New',monospace;` +
        `${trial.show_points ? "" : "display:none;"}">Total points: ${pointsTotal}</div>`;

      // Concentric two-color objects (outer disc + inner disc) at each location.
      for (let i = 0; i < numPlaceholders; i++) {
        const ang = (2 * Math.PI * i) / numPlaceholders;
        const oTop = Math.cos(ang) * trial.radius + cy - itemSize / 2;
        const oLeft = Math.sin(ang) * trial.radius + cx - itemSize / 2;
        const iTop = Math.cos(ang) * trial.radius + cy - innerSize / 2;
        const iLeft = Math.sin(ang) * trial.radius + cx - innerSize / 2;
        html +=
          `<div id="wmp-item-${i}-outer" style="${discStyle}` +
          `top:${oTop}px;left:${oLeft}px;width:${itemSize}px;height:${itemSize}px"></div>` +
          `<div id="wmp-item-${i}-inner" style="${discStyle}` +
          `top:${iTop}px;left:${iLeft}px;width:${innerSize}px;height:${innerSize}px"></div>`;
      }

      // Fixation, start message, divider, and response (swatch) area.
      html +=
        `<span id="wmp-fixation" style="position:absolute;top:${cy - 10}px;left:${cx - 6}px;cursor:pointer">+</span>` +
        `<div id="wmp-message" style="position:absolute;top:24px;width:100%;text-align:center">${startText}</div>` +
        `<div style="position:absolute;top:${arrayH}px;left:10%;width:80%;border-top:1px solid #000"></div>` +
        `<div id="wmp-response" style="position:absolute;top:${arrayH + 14}px;width:100%;text-align:center"></div>` +
        `</div>`;
      if (trial.prompt) html += trial.prompt;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#wmp-box"));

      // ---- DOM helpers -------------------------------------------------------
      const outerEl = (p) => display_element.querySelector(`#wmp-item-${p}-outer`);
      const innerEl = (p) => display_element.querySelector(`#wmp-item-${p}-inner`);
      const featureEl = (p, f) => (f === 1 ? innerEl(p) : outerEl(p));
      const setMsg = (h) => (display_element.querySelector("#wmp-message").innerHTML = h);

      // ---- State -------------------------------------------------------------
      let optionsOnset = null;
      let stimOnset = null;
      let actualStimDuration = null;
      let responded = false;
      // Noise overlays, one per object over its outer disc (which bounds the whole
      // object), keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const addNoise = (p) => {
        if (!(trial.noise_level > 0)) return;
        clearNoise(p);
        noiseRemovers[p] = U.noiseOverlay(outerEl(p), trial.noise_level, trial.noise_type, { wheel });
      };

      // ---- Phases ------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#wmp-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.precue_time > 0) {
          // Pre-cue ring on the probed sub-feature, then delay_start, then the array.
          const clearCue = U.spatialCue(featureEl(pos[probeItem], featureIndex),
            { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      const showArray = () => {
        stimOnset = performance.now();
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => { outerEl(pos[i]).style.backgroundColor = pairCss[i][0]; innerEl(pos[i]).style.backgroundColor = pairCss[i][1]; addNoise(pos[i]); },
          clear: (i) => { clearNoise(pos[i]); outerEl(pos[i]).style.backgroundColor = ""; innerEl(pos[i]).style.backgroundColor = ""; },
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        actualStimDuration = Math.round(performance.now() - stimOnset);
        for (let i = 0; i < setSize; i++) {
          clearNoise(pos[i]);
          outerEl(pos[i]).style.backgroundColor = "";
          innerEl(pos[i]).style.backgroundColor = "";
        }
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          jsPsych.pluginAPI.setTimeout(afterDelay, trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Each mask covers the outer disc's box, clipped to a disk by its border-radius.
        // mask_time = 0 skips it.
        if (trial.mask_time > 0) {
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(outerEl(pos[i]), trial.mask_type, { wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // After the delay: optional retro-cue ring on the probed sub-feature for
      // retrocue_time ms, then the probe. The ring is not cleared, because showProbe
      // overwrites it with the black probe ring.
      const afterDelay = () => {
        if (trial.retrocue_time > 0) {
          U.spatialCue(featureEl(pos[probeItem], featureIndex), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(showProbe, trial.retrocue_time);
        } else {
          showProbe();
        }
      };

      const showProbe = () => {
        // Ring the probed sub-feature in black.
        featureEl(pos[probeItem], featureIndex).style.boxShadow = "0 0 0 5px #000";
        // Build the row of clickable color swatches.
        let row = "";
        for (let i = 0; i < optCss.length; i++) {
          row +=
            `<div class="wmp-choice" data-idx="${i}" style="display:inline-block;` +
            `width:${optSize}px;height:${optSize}px;margin:0 8px;vertical-align:middle;` +
            `border-radius:50%;border:2px solid #000;box-shadow:0 0 0 2px #fff;cursor:pointer;` +
            `background-color:${optCss[i]}"></div>`;
        }
        display_element.querySelector("#wmp-response").innerHTML = row;
        optionsOnset = performance.now();
        display_element.querySelectorAll(".wmp-choice").forEach((el) => {
          el.addEventListener("click", onChoose);
        });
      };

      // ---- Response ----------------------------------------------------------
      const onChoose = (e) => {
        // Read the hold first, so every click consumes its own press; an ignored click
        // must not leave its duration for the next one.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - optionsOnset);
        const idx = parseInt(e.currentTarget.getAttribute("data-idx"), 10);
        display_element.querySelectorAll(".wmp-choice").forEach((el) =>
          el.removeEventListener("click", onChoose)
        );
        const correct = optCss[idx] === targetCss;
        pointsTotal += correct ? 10 : -10;

        if (trial.feedback) {
          // Ring the probed sub-feature green/red and flash the points change.
          featureEl(pos[probeItem], featureIndex).style.boxShadow =
            `0 0 0 5px ${correct ? "#2ecc40" : "#ff4136"}`;
          const pts = display_element.querySelector("#wmp-points");
          pts.innerHTML = correct
            ? "<span style='color:green'>+10</span>"
            : "<span style='color:red'>-10</span>";
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(() => finish(rt, idx, correct, hold), 600);
        } else {
          finish(rt, idx, correct, hold);
        }
      };

      // ---- Finish ------------------------------------------------------------
      const finish = (rt, idx, correct, hold) => {
        display_element.innerHTML = "";
        // Every object (both colors + position), for swap/interference analyses.
        const stimuli_shown = [];
        for (let i = 0; i < setSize; i++) {
          stimuli_shown.push({
            position: pos[i],            // placeholder index of this object
            outer_value: pairs[i][0],    // outer disc spec (degree / CSS / "lab(...)")
            inner_value: pairs[i][1],    // inner disc spec
            outer_color: pairCss[i][0],  // outer disc resolved CSS
            inner_color: pairCss[i][1],  // inner disc resolved CSS
            probed: i === probeItem,     // whether this object was the probe target
          });
        }
        const data = {
          rt: rt,
          mouse_hold_duration: hold != null ? hold : null,
          which_test: probeItem,
          probe_feature: featureName,
          feature_index: featureIndex,
          reported_index: idx,
          reported_color: optCss[idx],
          reported_spec: String(optSpecs[idx]),
          target_color: targetCss,
          target_spec: String(targetSpec),
          correct: correct,
          positions: pos,
          pair_colors: pairs.map((p) => `${p[0]},${p[1]}`),
          test_color_options: optSpecs.map(String),
          set_size: setSize,
          actual_stim_duration: actualStimDuration,
          points_total: pointsTotal,
          stimuli_shown: stimuli_shown,
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // ---- Kick off ----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#wmp-fixation").addEventListener("click", start);
      } else {
        start();
      }
    }
  }
  WmPairsPlugin.info = info;

  return WmPairsPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-noise-dots.js */
/* ===================================================================== */
/*
 * jspsych-noise-dots.js  --  jsPsych v8 plugin   (registered name: "noise-dots")
 *
 * Color-noise-dots perceptual discrimination. Shows two colored disks on a ring
 * of placeholder locations at the same time: a target disk and a test disk.
 * Each disk is a flat color overlaid with a grid of small square dots. A
 * `noise_level` fraction of the dots take random colors from the color wheel;
 * the rest keep the disk's color (0 = clean disk, 1 = pure noise). The
 * participant judges, by keyboard, whether the test disk is the same color as
 * the target disk.
 *
 * Response modes (response_mode):
 *   "binary"      -- same/different only
 *   "confidence6" -- one 6-point scale (1 = sure same .. 6 = sure different)
 *   "two_stage"   -- same/different, then a 1-6 confidence magnitude
 *                    (1 = totally guessing .. 6 = totally sure); the default
 * The noise palette comes from the trial's color wheel (color_wheel, default
 * window.BradyColorWheel).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychNoiseDots = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "noise-dots",
    version: version,
    parameters: {
      /**
       * Candidate target colors. Each entry may be a number (degree on the color
       * wheel), a CSS color ("rgb(255,0,0)", "#0f0"), or a "lab(L,a,b)" string.
       * Only `colors[which_test]` is drawn (as the target disk); the other
       * entries are not shown.
       */
      colors: { type: jspsych.ParameterType.STRING, array: true, default: ["rgb(255,0,0)"] },
      /** The TEST disk color (same spec formats as `colors`). */
      test_color: { type: jspsych.ParameterType.OBJECT, default: "rgb(255,0,0)" },
      /** Index into `colors` of the target color. Out-of-range values are clamped. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Color wheel for degree lookups & the noise palette (default window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally-spaced locations a disk can occupy (around a circle). */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the ring the disks sit on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each disk (the "field" the dots fill). */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Optional explicit placeholder indices [targetPos, testPos]. Invalid and repeated
          slots are dropped and entries past the second are ignored; a disk left without a
          slot takes the lowest unused one, so the default is [0, 1]
          (BradyUtils.resolvePositions with fill "lowest"). */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /**
       * Fraction (0-1) of dots that are noise (random colors) rather than the
       * disk's color. 0 = clean disk, 1 = pure noise (e.g. 0.4 = 40%).
       * A scalar applies to both disks, or pass [targetNoise, testNoise]
       * (a one-element array applies to both). Declared OBJECT so jsPsych accepts
       * either form without a type warning.
       */
      noise_level: { type: jspsych.ParameterType.OBJECT, default: [0, 0] },
      /** Edge length (px) of each square noise dot (values below 1 are treated as 1). */
      dot_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Max number of dots drawn per disk (capped to those that fit inside it). */
      num_dots: { type: jspsych.ParameterType.INT, default: 1080 },
      /**
       * Number of distinct hues used for the noise dots, evenly spaced around
       * the wheel (e.g. 6 = a coarse palette). Default 360 = one per degree.
       */
      num_colors: { type: jspsych.ParameterType.INT, default: 360 },
      /**
       * How long (ms) the disks stay visible. null/0 = they stay up through the
       * response (the default). If > 0, the disks are cleared after this long
       * and only then is the response collected, against a blank field (keys
       * pressed while the disks are up are ignored).
       */
      display_time: { type: jspsych.ParameterType.INT, default: null },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start (click or trial onset) to disk onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** "two_stage" (default), "confidence6", or "binary" (see file banner). The 1-6 scales use keys 1-6. */
      response_mode: { type: jspsych.ParameterType.STRING, default: "two_stage" },
      /** Keys for the binary same / different responses (two_stage & binary). */
      same_key: { type: jspsych.ParameterType.STRING, default: "s" },
      different_key: { type: jspsych.ParameterType.STRING, default: "d" },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Briefly highlight whether the same/different judgment was correct. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) of the first response, from response onset: the same/different RT in two_stage and binary, the scale RT in confidence6 (== rt_same_diff). Not the two_stage total. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the first response's key (the one `rt` times) was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the two_stage confidence key was held down (null in the other modes). Named like the other plugins' confidence_mouse_hold_duration. */
      confidence_key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Deprecated alias of confidence_key_hold_duration (always the same value), kept so existing analysis code keeps working. Use confidence_key_hold_duration. */
      key_hold_duration_confidence: { type: jspsych.ParameterType.INT },
      /** Every key pressed from response onset until the first response's key is released: {key, t (ms from response onset), duration}. The two_stage confidence key is not included. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the first response's key was also pressed in that window (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** Same value as rt: the same/different RT in two_stage/binary, or the 1-6 scale RT in
       *  confidence6, from response onset. */
      rt_same_diff: { type: jspsych.ParameterType.INT },
      /** two_stage only: RT (ms) from the confidence prompt appearing (after the same/different key is released) to the rating; else null. */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** 1 if the participant judged "same", 0 if "different". In confidence6, ratings 1-3 count as "same" and 4-6 as "different". */
      said_same: { type: jspsych.ParameterType.INT },
      /**
       * The 1-6 rating, or null in binary. In two_stage it is confidence magnitude
       * (1 = guessing .. 6 = sure); in confidence6 it is the direction scale
       * (1 = sure same .. 6 = sure different).
       */
      confidence: { type: jspsych.ParameterType.INT },
      /** Whether the test color matched the target color, compared by resolved RGB (BradyUtils.sameColor), so a wheel degree and the same color written as an rgb()/#hex/lab() string count as the same. */
      was_same: { type: jspsych.ParameterType.BOOL },
      /** Whether the same/different judgment was correct. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Which response_mode was used. */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** Placeholder indices used: [targetPos, testPos]. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the target disk within `colors`. */
      which_test: { type: jspsych.ParameterType.INT },
      /** Resolved target color (CSS). */
      target_color: { type: jspsych.ParameterType.STRING },
      /** Resolved test color (CSS). */
      test_color: { type: jspsych.ParameterType.STRING },
      /** The target color spec as given (degree / CSS / lab). */
      specified_target_color: { type: jspsych.ParameterType.STRING },
      /** The test color spec as given. */
      specified_test_color: { type: jspsych.ParameterType.STRING },
      /** Noise levels used: [targetNoise, testNoise]. */
      noise_level: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured time (ms) the disks were on screen before the response. With display_time > 0: from disk onset until the disks were cleared. With display_time null/0 the disks stay up through the response, so it is the time from disk onset to the first response key press (about rt, since the response opens at disk onset). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per disk (target, test): {role, position, value (resolved CSS color), spec,
          noise_level} plus the dot-field parameters (num_dots, dot_size, num_colors,
          num_placeholders, radius, item_size). Individual dot positions and colors are
          random and not recorded. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** The correct same/different answer: "same" or "different". */
      correct_response: { type: jspsych.ParameterType.STRING },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class NoiseDotsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;

      U.checkParams(trial, { plugin: "noise-dots", positive: ["num_dots"], unit: ["noise_level"],
        enums: { response_mode: ["binary", "confidence6", "two_stage"] } });

      // Clamp which_test into the colors range so the target spec is always defined
      // (out of range, the fill would be "undefined"). Clamped values live in locals: trial is
      // jsPsych's stored copy of the parameters (save_trial_parameters reads it), so it is
      // never modified.
      const whichTest = U.whichTestIndex(trial.which_test, trial.colors.length, { plugin: "noise-dots" });
      // ---- Resolve the two disk colors --------------------------------------
      const targetIdx = whichTest;
      const targetSpec = trial.colors[targetIdx];
      const testSpec = trial.test_color;
      const targetCss = U.resolveItem(targetSpec, wheel, "color").css;
      const testCss = U.resolveItem(testSpec, wheel, "color").css;
      // Compared by resolved RGB (U.sameColor), so a degree and its "rgb(...)" string match.
      const wasSame = U.sameColor(targetCss, testCss, wheel);

      // ---- Per-disk noise levels ([target, test]) ---------------------------
      // noise_level is a fraction 0-1, as in the other plugins; drawDisk takes a percent.
      const noiseArr = Array.isArray(trial.noise_level)
        ? trial.noise_level
        : [trial.noise_level, trial.noise_level];
      const targetNoise = (noiseArr.length > 0 ? +noiseArr[0] : 0) * 100;
      const testNoise = (noiseArr.length > 1 ? +noiseArr[1] : +noiseArr[0] || 0) * 100;

      // ---- Build the noise palette from the (swappable) color wheel ----------
      const nColors = Math.max(1, trial.num_colors);
      const palette = [];
      for (let k = 0; k < nColors; k++) {
        palette.push(U.colorWheelCSS(Math.round((k * 360) / nColors) % 360, wheel));
      }

      // ---- Disk locations ---------------------------------------------------
      // Two disks [target, test]; `positions` records exactly those. A disk without a valid
      // slot takes the lowest unused one, and the placeholder count grows to cover the
      // slots used, so drawDisk never looks up a canvas that was never created.
      const placed = U.resolvePositions(trial, 2, { fill: "lowest" });
      const pos = placed.pos;
      const numPh = placed.nph;

      // ---- Layout -----------------------------------------------------------
      const boxSize = 2 * trial.radius + 2 * trial.item_size + 50;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      let html =
        `<div id="nd-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        html +=
          `<canvas id="nd-item-${i}" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;top:${top}px;left:${left}px"></canvas>`;
      }
      html +=
        `<span id="nd-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="nd-message" style="position:absolute;top:18px;width:100%;text-align:center;font-size:11pt">${startText}</div>` +
        `</div>`;
      if (trial.prompt) html += trial.prompt;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#nd-box"));

      // ---- State ------------------------------------------------------------
      let promptOnset = null; // onset of the first response prompt
      let confOnset = null;   // onset of the confidence prompt (two_stage)
      let diskOnset = null;          // onset of the two disks
      let actualStimDuration = null; // measured disk duration (ms); see info.data
      let saidSame = null;
      let confidence = null;
      let rtSameDiff = null;
      let rtConfidence = null;
      // Response-duration state: the first response's key, its hold, its press log, and
      // the two_stage confidence key's hold.
      let respKey = null;
      let holdPrimary = null;
      let holdConfidence = null;
      let pressLog = null;

      // ---- Phases -----------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#nd-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        jsPsych.pluginAPI.setTimeout(showStimuli, trial.delay_start);
      };

      const showStimuli = () => {
        drawDisk(pos[0], targetCss, targetNoise);
        drawDisk(pos[1], testCss, testNoise);
        diskOnset = performance.now();
        if (trial.display_time && trial.display_time > 0) {
          jsPsych.pluginAPI.setTimeout(() => {
            actualStimDuration = Math.round(performance.now() - diskOnset);
            clearItem(pos[0]);
            clearItem(pos[1]);
            getResponse();
          }, trial.display_time);
        } else {
          // Disks stay up through the response, which opens now; actual_stim_duration is
          // stamped at the first response key press (stampViewing).
          getResponse();
        }
      };

      // ---- Response collection ---------------------------------------------
      // display_time null/0: the disks are still up at the first response, so their viewing
      // time is disk onset -> that key press.
      const stampViewing = () => {
        if (!(trial.display_time > 0) && actualStimDuration === null && diskOnset !== null) {
          actualStimDuration = Math.round(performance.now() - diskOnset);
        }
      };
      const getResponse = () => {
        promptOnset = performance.now();
        // Log every key pressed from response onset, so trials with more than one
        // response key can be excluded (see info.data). Closed when the first
        // response's key comes back up, before any two_stage confidence key.
        U.beginPressLog(promptOnset);
        if (trial.response_mode === "confidence6") {
          collectScale6Direction();
        } else {
          collectBinary();
        }
      };

      // Same/different keys (binary, and stage 1 of two_stage).
      const collectBinary = () => {
        setMsg(`${trial.same_key} = same &nbsp;&nbsp; ${trial.different_key} = different`);
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            stampViewing();
            saidSame = jsPsych.pluginAPI.compareKeys(resp.key, trial.same_key) ? 1 : 0;
            rtSameDiff = Math.round(performance.now() - promptOnset);
            respKey = resp.key;
            // getKeyboardResponse fires on KEYDOWN, so the hold is not yet knowable
            // here: wait for the release before going on (to stage 2 or the end of the
            // trial). trial() stays synchronous, so this is a .then(), not an await.
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => {
              holdPrimary = hold;
              pressLog = U.endPressLog();
              if (trial.response_mode === "two_stage") collectScale6Magnitude();
              else finish();
            }));
          },
          valid_responses: [trial.same_key, trial.different_key],
          rt_method: "performance",
          persist: false,
        });
      };

      // Stage 2 of two_stage: confidence magnitude (1 = guessing .. 6 = sure). Runs after
      // the same/different key is released, and rt_confidence is timed from here.
      const collectScale6Magnitude = () => {
        confOnset = performance.now();
        setMsg("how sure are you? (1-6)<br>1 = totally guessing &nbsp; ... &nbsp; 6 = totally sure");
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            confidence = parseInt(resp.key, 10);
            rtConfidence = Math.round(performance.now() - confOnset);
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => { holdConfidence = hold; finish(); }));
          },
          valid_responses: ["1", "2", "3", "4", "5", "6"],
          rt_method: "performance",
          persist: false,
        });
      };

      // confidence6: one direction scale (1 = sure same .. 6 = sure different).
      const collectScale6Direction = () => {
        setMsg(
          "<table border=0 cellpadding=3 style='margin:0 auto;table-layout:fixed'>" +
          "<tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr>" +
          "<tr><td>sure<br>same</td><td>probably<br>same</td><td>maybe<br>same</td>" +
          "<td>maybe<br>diff</td><td>probably<br>diff</td><td>sure<br>diff</td></tr></table>"
        );
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            stampViewing();
            confidence = parseInt(resp.key, 10);
            saidSame = confidence <= 3 ? 1 : 0; // 1-3 -> "same", 4-6 -> "different"
            rtSameDiff = Math.round(performance.now() - promptOnset);
            respKey = resp.key;
            // The scale key is the first (only) response; wait for its release.
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => {
              holdPrimary = hold;
              pressLog = U.endPressLog();
              finish();
            }));
          },
          valid_responses: ["1", "2", "3", "4", "5", "6"],
          rt_method: "performance",
          persist: false,
        });
      };

      // ---- Finish -----------------------------------------------------------
      const finish = () => {
        if (this._kb) { jsPsych.pluginAPI.cancelKeyboardResponse(this._kb); this._kb = null; }
        const correct = saidSame === (wasSame ? 1 : 0);
        // One self-contained entry per disk, with the dot-field parameters repeated on
        // each. Per-dot positions/colors come from Math.random() and are not stored.
        const fieldParams = {
          num_dots: trial.num_dots, dot_size: trial.dot_size, num_colors: trial.num_colors,
          num_placeholders: numPh, radius: trial.radius, item_size: trial.item_size,
        };
        const stimuli_shown = [
          Object.assign({ role: "target", position: pos[0], value: targetCss, spec: String(targetSpec), noise_level: targetNoise / 100 }, fieldParams),
          Object.assign({ role: "test", position: pos[1], value: testCss, spec: String(testSpec), noise_level: testNoise / 100 }, fieldParams),
        ];
        const correct_response = wasSame ? "same" : "different";
        const done = () => {
          const data = {
            rt: rtSameDiff,
            ...U.keyHoldData(holdPrimary, respKey, pressLog),
            confidence_key_hold_duration: holdConfidence,
            key_hold_duration_confidence: holdConfidence, // deprecated alias of confidence_key_hold_duration
            rt_same_diff: rtSameDiff,
            rt_confidence: rtConfidence,
            said_same: saidSame,
            confidence: confidence,
            was_same: wasSame,
            correct: correct,
            response_mode: trial.response_mode,
            positions: pos,
            which_test: whichTest,
            target_color: targetCss,
            test_color: testCss,
            specified_target_color: String(targetSpec),
            specified_test_color: String(testSpec),
            noise_level: [targetNoise / 100, testNoise / 100], // back to the 0-1 fraction
            actual_stim_duration: actualStimDuration,
            stimuli_shown: stimuli_shown,
            correct_response: correct_response,
          };
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
          finishOnce(data);
        };
        if (trial.feedback) {
          const el = display_element.querySelector(`#nd-item-${pos[1]}`);
          el.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
          setMsg(correct ? "Correct!" : "Incorrect");
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(done, 800);
        } else {
          done();
        }
      };

      // ---- Drawing helpers --------------------------------------------------
      const itemCtx = (p) => display_element.querySelector(`#nd-item-${p}`).getContext("2d");
      const clearItem = (p) => itemCtx(p).clearRect(0, 0, trial.item_size, trial.item_size);

      // Draw a colored disk filled with a field of noise dots.
      const drawDisk = (p, color, noisePercent) => {
        const ctx = itemCtx(p);
        const s = trial.item_size;
        const r = s / 2 - 1;
        const cx = s / 2;
        const cy = s / 2;
        ctx.clearRect(0, 0, s, s);

        // Base disk.
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!(noisePercent > 0)) return;

        // Find every grid cell that fits entirely inside the disk. A dot_size below 1
        // would never advance the loops below (an infinite loop that freezes the page).
        const g = Math.max(1, trial.dot_size || 0);
        const valid = [];
        for (let x = 0; x <= s - g; x += g) {
          for (let y = 0; y <= s - g; y += g) {
            // Worst-case corner of the cell relative to center.
            const dx = Math.max(Math.abs(x - cx), Math.abs(x + g - cx));
            const dy = Math.max(Math.abs(y - cy), Math.abs(y + g - cy));
            if (Math.sqrt(dx * dx + dy * dy) <= r) valid.push([x, y]);
          }
        }
        // Shuffle and keep up to num_dots of them.
        for (let i = valid.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = valid[i];
          valid[i] = valid[j];
          valid[j] = t;
        }
        const n = Math.min(trial.num_dots, valid.length);
        for (let i = 0; i < n; i++) {
          const cell = valid[i];
          // Each dot is noise with probability noisePercent/100, else the disk's color.
          ctx.fillStyle = Math.random() * 100 > noisePercent ? color : palette[Math.floor(Math.random() * palette.length)];
          ctx.fillRect(cell[0], cell[1], g, g);
        }
      };

      const setMsg = (h) => (display_element.querySelector("#nd-message").innerHTML = h);

      // ---- Kick off ---------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#nd-fixation").addEventListener("click", start);
      } else {
        start();
      }
    }
  }
  NoiseDotsPlugin.info = info;

  return NoiseDotsPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-recognition.js */
/* ===================================================================== */
/*
 * jspsych-recognition.js  --  jsPsych v8 plugin
 *
 * Old/new recognition memory. Presents one test item (the probe) and asks
 * whether it is old (seen before) or new, as a binary choice or a 1-6 rating.
 * The probe appears with the response options at once; there is no study
 * phase here, so present the studied items in earlier trials.
 *
 * The probe can be a color, a color-wheel degree, an image, or a word (see
 * `stimulus` and `item_type`).
 *
 * Confidence scale: 1 = sure new ... 6 = sure old (higher = more "old");
 * said_old = 1 for ratings 4-6.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRecognition = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "recognition",
    version: version,
    parameters: {
      /**
       * The test item (the probe). May be a number (degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)"
       * string, an image path ("face.png", "img/x.jpg"), or a word ("cat").
       * Required.
       */
      stimulus: { type: jspsych.ParameterType.OBJECT, default: undefined },
      /** Force interpretation of `stimulus`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * Ground truth: was this item shown before? Used to score `correct` and
       * for feedback. Does not affect the display.
       */
      is_old: { type: jspsych.ParameterType.BOOL, default: true },
      /**
       * "binary" (one old vs. new choice) or "confidence6" (a 1-6 scale,
       * 1 = sure new ... 6 = sure old). Same names as change-detection/noise-dots.
       */
      response_mode: { type: jspsych.ParameterType.STRING, default: "binary" },
      /** How responses are collected: "keyboard" (old_key/new_key, or keys 1-6 for the
          scale), "buttons", or "both" (buttons shown and the keys armed; whichever answers
          first is the response, as in change-detection). Any other value warns once and
          behaves as "buttons". */
      response_ui: { type: jspsych.ParameterType.STRING, default: "keyboard" },
      /** Keyboard key for the "old" response (binary mode). */
      old_key: { type: jspsych.ParameterType.STRING, default: "o" },
      /** Keyboard key for the "new" response (binary mode). */
      new_key: { type: jspsych.ParameterType.STRING, default: "n" },
      /** Button / label text for the "old" response (binary mode). */
      old_button_text: { type: jspsych.ParameterType.STRING, default: "Old (seen before)" },
      /** Button / label text for the "new" response (binary mode). */
      new_button_text: { type: jspsych.ParameterType.STRING, default: "New" },
      /** Diameter (px) of the probe item. */
      item_size: { type: jspsych.ParameterType.INT, default: 120 },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Optional HTML shown beneath the display (e.g. the question prompt). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Briefly highlight whether the response was correct after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the whole-trial mouse trajectory (cursor path to the chosen button). Only meaningful with response_ui "buttons" or "both"; with "keyboard" a one-time console note says so. */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between mouse samples before the response phase is marked (0 = every event).
          The buttons appear with the probe, so this covers only the first few ms. */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between mouse samples once the response buttons are live (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from probe onset to the response. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (or the response was made with the keyboard). */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred, or the response was a click). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed from probe onset until the response key is released (or the response click, with response_ui "both"): {key, t (ms from probe onset), duration}. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). null with response_ui "buttons". */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** 1 if the participant judged the item old, 0 if new. In confidence6, ratings 4-6 count as old. */
      said_old: { type: jspsych.ParameterType.INT },
      /** Confidence rating 1-6 (1 = sure new ... 6 = sure old), or null in binary mode. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Whether the probe was actually old (the `is_old` truth value). */
      was_old: { type: jspsych.ParameterType.BOOL },
      /** Whether the old/new judgment was correct. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** The probe spec, as given. */
      stimulus: { type: jspsych.ParameterType.STRING },
      /** Which response_mode was used: "binary" or "confidence6". */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** Which response UI was used: "keyboard", "buttons" or "both". */
      response_ui: { type: jspsych.ParameterType.STRING },
      /** One-element array describing the probe: {src} for an image, {text} for a word, or {value: the color spec as given} for a color. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Mouse-trajectory samples (only when record_mouse): rows of [t, x, y, value], value = nearest button index during the response. */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory row (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first response-phase mouse sample (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at probe onset; there is no memory array or fixation in this plugin). encoding: 0, the probe and response buttons appear; report: the mouse response window opens (at the same time). */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Auto-zoom scale of the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout in the mouse-trajectory frame (only when record_mouse): each response button's box (index/value/correct/x/y/w/h) and target_option (the correct button, binary mode only). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RecognitionPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;
      U.checkParams(trial, { plugin: "recognition",
        enums: { response_mode: ["binary", "confidence6"], response_ui: ["keyboard", "buttons", "both"], item_type: ["auto", "color", "image", "text"] } });
      // Keys are armed for "keyboard" and "both"; buttons are drawn for everything else
      // ("buttons", "both", and an unrecognized value, which checkParams has warned about).
      const wantKeys = trial.response_ui === "keyboard" || trial.response_ui === "both";
      const wantButtons = trial.response_ui !== "keyboard";
      if (trial.record_mouse && !wantButtons) {
        U.noteOnce("recognition", "record_mouse-keyboard", 'record_mouse with response_ui "keyboard": there are no ' +
          "clickable options, so mouse_trajectory has no response phase and mouse_geometry is null.");
      }

      // ---- Resolve the probe (degree / color / image / word) ----
      const probe = U.resolveItem(trial.stimulus, wheel, forceType);
      const wasOld = !!trial.is_old;

      // ---- Preload the image (if any), then build and run the trial ----
      // trial() stays synchronous so jsPsych waits for finishTrial(); an async trial()
      // would end as soon as this method returned.
      U.loadImages(probe.kind === "image" ? [probe.src] : []).then((imgCache) => {

        // ---- Layout: one tall box, the probe in the square stage at the top and the
        // message, buttons and prompt in the panel below it. The panel rows reserve their
        // height up front so the box never grows when the buttons appear.
        const boxSize = trial.item_size + 80;
        const off = (boxSize - trial.item_size) / 2;
        const stageHTML =
          `<canvas id="rec-item" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;top:${off}px;left:${off}px;border-radius:50%;border:1px solid #222"></canvas>`;
        const panelHTML =
          `<div id="rec-message" style="min-height:1.4em"></div>` +
          `<div id="rec-response" style="margin-top:8px;min-height:2.8em"></div>` +
          (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
        display_element.innerHTML = U.stageBox(
          { idPrefix: "rec", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);

        // ---- Paint the probe ----
        U.paintItem(display_element.querySelector("#rec-item").getContext("2d"), probe, trial.item_size, imgCache);

        // ---- State ----
        let saidOld = null;
        let confidence = null;
        let kb = null; // keyboard-listener handle (trial-local)
        let answered = false; // one-shot: a second click (e.g. a double-click) is ignored
        // Claimed at the first key press or click, so with response_ui "both" a click made
        // while the response key is still held (before finish runs at its release) is ignored.
        let claimed = false;
        // Response-duration fields: whichever modality answered sets its own.
        let mouseHold = null;
        let keyHold = null;
        let respKey = null;
        let mt = null; // optional mouse-trajectory recorder (record_mouse)
        let optEls = []; // clickable response buttons + identity/correctness, for mouse geometry
        const probeOnset = performance.now();
        if (trial.record_mouse) {
          // Probe and buttons appear together, so tracking starts at probe onset.
          mt = U.makeMouseTracker(display_element.querySelector("#rec-stage"), probeOnset,
            { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          mt.mark("encoding");
        }

        // ---- Response UI -----------------------------------------------------
        // Log every key pressed from probe onset, so trials with extra keypresses can be
        // excluded (see info.data).
        if (wantKeys) U.beginPressLog(probeOnset);
        if (trial.response_mode === "confidence6") collectScale6();
        else collectBinary();

        // Auto-zoom after the buttons exist: they can wrap to two rows in a narrow box, so
        // the box's final height is only known now, and scaling earlier could overflow.
        if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#rec-box"));

        function collectBinary() {
          const onOld = (at) => { saidOld = 1; finish(at); };
          const onNew = (at) => { saidOld = 0; finish(at); };
          if (wantKeys) {
            setMsg(`${trial.old_key.toUpperCase()} = ${trial.old_button_text} &nbsp;&nbsp; ` +
                   `${trial.new_key.toUpperCase()} = ${trial.new_button_text}`);
            kb = jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: (i) => {
                if (claimed) return;
                claimed = true;
                // getKeyboardResponse fires on keydown, before the hold is known: stamp
                // the response time here, then finish once the key is released.
                const at = performance.now();
                const isOld = jsPsych.pluginAPI.compareKeys(i.key, trial.old_key);
                U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => {
                  keyHold = hold;
                  respKey = i.key;
                  (isOld ? onOld : onNew)(at);
                }));
              },
              valid_responses: [trial.old_key, trial.new_key],
              rt_method: "performance",
              persist: false,
            });
          }
          if (wantButtons) {
            if (!wantKeys) setMsg("Have you seen this item before?");
            setResponseHTML(
              `<button class="jspsych-btn" id="rec-old">${trial.old_button_text}</button> ` +
              `<button class="jspsych-btn" id="rec-new">${trial.new_button_text}</button>`
            );
            const oldBtn = display_element.querySelector("#rec-old");
            const newBtn = display_element.querySelector("#rec-new");
            // A click fires only after the button is released, so the hold is already
            // known here; read it first so every click consumes exactly one press.
            oldBtn.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onOld(); });
            newBtn.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onNew(); });
            // Mark the button that matches the truth as the correct option.
            optEls = [{ el: oldBtn, value: "old", correct: wasOld }, { el: newBtn, value: "new", correct: !wasOld }];
            beginMouseResponse();
          }
        }

        function collectScale6() {
          // 1 = sure new ... 6 = sure old (higher = more "old").
          const labels = ["1<br>sure new", "2", "3", "4", "5", "6<br>sure old"];
          setMsg("Rate 1 (sure NEW) to 6 (sure OLD/seen)");
          if (wantKeys) {
            kb = jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: (i) => {
                if (claimed) return;
                claimed = true;
                // Stamp at keydown, finish at keyup (see collectBinary).
                const at = performance.now();
                const v = parseInt(i.key, 10);
                U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => { keyHold = hold; respKey = i.key; onScale(v, at); }));
              },
              valid_responses: ["1", "2", "3", "4", "5", "6"],
              rt_method: "performance",
              persist: false,
            });
          }
          if (wantButtons) {
            setResponseHTML(
              labels.map((l, k) => `<button class="jspsych-btn" data-v="${k + 1}" style="vertical-align:top">${l}</button>`).join(" ")
            );
            display_element.querySelectorAll("#rec-response button").forEach((b) => {
              b.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onScale(parseInt(b.dataset.v, 10)); });
              // A 1-6 scale has no single correct button, so record the layout with no
              // correct/target -- the trajectory direction (toward 1 vs 6) is the measure.
              optEls.push({ el: b, value: parseInt(b.dataset.v, 10), correct: false });
            });
            beginMouseResponse();
          }
        }

        // Open the mouse response window: switch to the response sample rate and record,
        // per sample, which button the cursor is nearest (index into optEls / geometry).
        function beginMouseResponse() {
          if (!mt) return;
          mt.mark("report");
          mt.setValueFn(U.nearestChoiceFn(optEls.map((c) => c.el)));
        }

        function onScale(v, at) {
          confidence = v;
          saidOld = v >= 4 ? 1 : 0; // 1-3 -> "new", 4-6 -> "old"
          finish(at);
        }

        // ---- Finish ----------------------------------------------------------
        // `at` is the response time (the keyboard paths finish at keyup but time the
        // response at keydown); clicks pass nothing and are timed now.
        function finish(at) {
          if (answered) return;
          answered = true;
          const rt = Math.round((at == null ? performance.now() : at) - probeOnset);
          const pressLog = wantKeys ? U.endPressLog() : null;
          if (kb) {
            jsPsych.pluginAPI.cancelKeyboardResponse(kb);
            kb = null;
          }
          const correct = saidOld === (wasOld ? 1 : 0);
          // The probe as shown, in the cross-plugin stimuli_shown format.
          const shownRec = {};
          if (probe.kind === "image") shownRec.src = probe.src;
          else if (probe.kind === "text") shownRec.text = probe.text;
          else shownRec.value = trial.stimulus; // color: hue degree or css spec
          const data = {
            rt: rt,
            mouse_hold_duration: mouseHold,
            ...U.keyHoldData(keyHold, respKey, pressLog),
            said_old: saidOld,
            confidence: confidence,
            was_old: wasOld,
            correct: correct,
            response_mode: trial.response_mode,
            response_ui: trial.response_ui,
            stimulus: trial.stimulus,
            stimuli_shown: [shownRec],
          };
          if (trial.record_mouse && mt) {
            // Build geometry before feedback clears the buttons (they must still be in the DOM).
            mt.detach();
            Object.assign(data, U.mouseTrackerData(mt));
            // null when there are no clickable options (response_ui "keyboard"), as in
            // change-detection.
            data.mouse_geometry = optEls.length
              ? U.discreteChoiceGeometry(display_element.querySelector("#rec-stage"), optEls)
              : null;
          }
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
          const done = () => finishOnce(data);
          if (trial.feedback) {
            const el = display_element.querySelector("#rec-item");
            el.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
            setMsg(correct ? "Correct!" : "Incorrect");
            U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
            clearResponse();
            jsPsych.pluginAPI.setTimeout(done, 800);
          } else {
            done();
          }
        }

        // ---- DOM helpers -----------------------------------------------------
        function setMsg(h) { display_element.querySelector("#rec-message").innerHTML = h; }
        function setResponseHTML(h) { display_element.querySelector("#rec-response").innerHTML = h; }
        function clearResponse() { setResponseHTML(""); }

      }); // end loadImages().then
    }
  }
  RecognitionPlugin.info = info;

  return RecognitionPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-recall.js */
/* ===================================================================== */
/*
 * jspsych-recall.js  --  jsPsych v8 plugin   (registered name: "recall")
 *
 * Working-memory cued recall, typed. Shows a memory array of items around a
 * circle, a blank retention delay, then rings one location (the probe) and asks
 * the participant to type what was there into a text or number field. Records
 * the typed response, rt, and accuracy when a correct answer is defined. One
 * typed response per trial.
 *
 * Items can be colors, color-wheel degrees, images, or text/words/numbers (mixed
 * freely) via BradyUtils.resolveItem; see `stimuli` and `item_type`. Text items
 * are inserted as HTML (markup renders; escape a literal "<" or "&"). Numeric
 * recall uses input_type:"number".
 *
 * Location manipulations (all optional, default off): precue_time / retrocue_time
 * ring the to-be-probed location before the array / after the delay;
 * noise_level + noise_type degrade the items at encoding; mask_time + mask_type
 * mask the occupied locations at array offset, before the delay. Noise/mask kinds come from
 * BradyUtils.noiseKinds/maskKinds, registerNoise/registerMask, or a function.
 *
 * Feedback is a green/red ring plus "Correct!"/"Incorrect".
 *
 * Trial-ending rule (CONVENTIONS.md §3): timer/listener driven, so trial() is
 * synchronous and calls this.jsPsych.finishTrial(data) later, once, through
 * U.makeFinisher.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRecall = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "recall",
    version: version,
    parameters: {
      /**
       * The memory-array items. Each entry may be a JS number (a degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)" string,
       * an image path ("dog.png", "img/x.jpg"), or text, including digits as a string
       * ("cat", "7"). Force the interpretation with `item_type`.
       * Text items are inserted as HTML, not as plain text: "<b>cat</b>" shows a bold
       * word, and a literal "<", ">" or "&" must be written as "&lt;", "&gt;", "&amp;".
       * Scoring compares the typed answer with the spec as given (markup included), so
       * set correct_answer when a text item contains markup or entities.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Color wheel used to turn degrees into colors (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally-spaced locations items can occupy (around a circle). Raised to
          the number of items, and to cover any explicit item_positions, if smaller. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Side length (px) of each item box. */
      item_size: { type: jspsych.ParameterType.INT, default: 100 },
      /** Font size (CSS string) for text items in the memory array (the input field has its own fixed 32pt size). */
      font_size: { type: jspsych.ParameterType.STRING, default: "16pt" },
      /** Index (0..stimuli.length-1) of the item whose location is probed. Out-of-range values are clamped. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** If false, just present the array + delay and end (encoding-only, no test). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** How long (ms) the memory array is shown (0 = not shown, unless sequential). */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) between array offset and the recall probe. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, ring the to-be-probed location (`cue_color`/`cue_thickness`) for this long
          right after the start, then wait delay_start before the array. Skipped when
          do_test is false (there is no probe to cue). 0 = off. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, after the delay ring the to-be-probed location
          (`cue_color`/`cue_thickness`; the defaults match the probe ring) for this long
          before the response field appears. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. Skipped when do_test is false. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
          the `noise_type` degradation (a transparent overlay over the item's box --
          occlusion for images/words; removed at array offset). */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start (click or trial onset), or from the end of the pre-cue, to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** Where the typed-response field appears: "center" (at fixation) or "bottom" (below the stage). */
      response_location: { type: jspsych.ParameterType.STRING, default: "center" },
      /** Input field type: "text" or "number". */
      input_type: { type: jspsych.ParameterType.STRING, default: "text" },
      /** Min value (number inputs only); null to omit. */
      input_min: { type: jspsych.ParameterType.INT, default: null },
      /** Max value (number inputs only); null to omit. */
      input_max: { type: jspsych.ParameterType.INT, default: null },
      /** Step (number inputs only); null to omit. */
      input_step: { type: jspsych.ParameterType.FLOAT, default: null },
      /** Placeholder text shown in the empty input field. */
      input_placeholder: { type: jspsych.ParameterType.STRING, default: "" },
      /** Label on the submit button. */
      button_label: { type: jspsych.ParameterType.STRING, default: "Submit" },
      /**
       * The expected answer used to score accuracy. If null (default), the spec of
       * the probed item (stimuli[which_test]) is used. Scoring trims leading/trailing
       * whitespace, treats any run of internal whitespace as one space ("ice  cream"
       * matches "ice cream"), and ignores case. When both
       * sides parse fully as numbers they are compared numerically ("07" and "7.0"
       * match "7"). Set this when the typed answer differs from the displayed spec
       * (e.g. a label for an image, or a word for a color).
       */
      correct_answer: { type: jspsych.ParameterType.STRING, default: null },
      /** Show "Correct!"/"Incorrect" + a green/red highlight after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) from probe onset to submitting the typed answer (the click, or the Enter KeyDown). The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click on the Submit button. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null when the answer was submitted with the Enter key (see key_hold_duration) or not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the Enter key was held when submitting by keyboard: KeyDown -> KeyUp. The keyboard counterpart of mouse_hold_duration; at most one of the two is non-null per response. There is no key_presses log: every typed character would land in it, which makes the multi-key exclusion meaningless for a typing field. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** The raw value typed by the participant (untrimmed). */
      response: { type: jspsych.ParameterType.STRING },
      /** Whether the typed answer matched the expected answer (see correct_answer); null if there is no answer to score against or no test. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** The expected answer used for scoring (null if none). */
      target: { type: jspsych.ParameterType.STRING },
      /** Index of the probed item (after clamping). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The studied item specs (colors/degrees/images/text), as given. */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Measured time (ms) from array onset to hide, via performance.now() at the paint and clear calls. */
      actual_display_time: { type: jspsych.ParameterType.INT },
      /** Same value as actual_display_time (kept under the name the other plugins use). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per item: `position` (placeholder index), `order` (index in the list, which is also the sequential presentation order), `value` (spec), `probed`, and `src`/`color`/`text`. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RecallPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      // ---- Resolve memory items (color / image / wheel-degree / text) ----
      const specs = trial.stimuli.slice();
      const setSize = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));

      // ---- Preload any images, then build and run the trial ----
      // trial() stays synchronous: an async trial() would end as soon as it returned.
      U.loadImages(items.filter((it) => it.kind === "image").map((it) => it.src)).then((imgCache) => {

      // ---- Choose item locations ----
      // Warn (only) about stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "recall", setSize: setSize, supportsEnsemble: false, values: specs });
      U.checkParams(trial, { plugin: "recall", setSize: setSize,
        enums: { response_location: ["center", "bottom"], input_type: ["text", "number"], item_type: ["auto", "color", "image", "text"] } });
      // Clamp an out-of-range which_test (validatePlacement only warns) so the probe is a
      // real item. With no stimuli this gives -1, and the probe/scoring paths treat it as none.
      // Clamped values live in locals: trial is jsPsych's stored copy of the parameters
      // (save_trial_parameters reads it), so it is never modified.
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "recall" });
      // Expected answer for scoring, taken after the clamp so it is the item actually probed.
      const target =
        trial.correct_answer != null
          ? trial.correct_answer
          : (whichTest >= 0 ? specs[whichTest] : null);
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots), with enough
      // placeholders for every item and every slot used.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const pos = placed.pos;

      // ---- Layout ----
      const boxSize = 2 * trial.radius + trial.item_size + 60;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // The response field goes at the stage centre (over the hidden fixation) or in a
      // panel below the stage. Its slot exists from the start, so the box does not move
      // when the field appears.
      const respCenter = trial.response_location === "center";
      let stageHTML = "";
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        stageHTML +=
          `<div id="recall-item-${i}" style="position:absolute;box-sizing:border-box;` +
          `border:1px solid #222;display:flex;align-items:center;justify-content:center;` +
          `width:${trial.item_size}px;height:${trial.item_size}px;top:${top}px;left:${left}px"></div>`;
      }
      stageHTML +=
        `<span id="recall-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="recall-message" style="position:absolute;top:8px;width:100%;text-align:center">${startText}</div>` +
        // center: the response holder sits inside the stage, centred on fixation.
        (respCenter
          ? `<div id="recall-response" style="position:absolute;top:${center}px;left:0;width:100%;transform:translateY(-50%);text-align:center"></div>`
          : "");
      // bottom: the field and prompt go in a reserved panel below the stage, inside the box.
      // center: the box stays square and the prompt goes below it.
      const panelHTML = respCenter ? "" :
        // 140px covers the 32pt input + 18pt button (~105-115px rendered), so the box does
        // not grow after auto_zoom has sized it.
        `<div id="recall-response" style="min-height:140px"></div>` +
        (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
      let html = U.stageBox({ idPrefix: "recall", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);
      if (respCenter && trial.prompt) html += `<div style="text-align:center;margin-top:8px">${trial.prompt}</div>`;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#recall-box"));

      const itemEl = (p) => display_element.querySelector(`#recall-item-${p}`);
      const setMsg = (h) => (display_element.querySelector("#recall-message").innerHTML = h);

      // ---- State ----
      let probeOnset = null;
      // One-shot guard shared by Enter and the Submit button. Without it a held Enter
      // (auto-repeat), or a click while Enter is still down, would call submit() twice and
      // finish the trial twice.
      let submitted = false;
      let arrayOnset = null;
      let actualDisplay = null;

      // ---- Render helpers -----------------------------------------------------
      // Noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const paintItem = (p, item) => {
        const el = itemEl(p);
        if (item.kind === "image") {
          const ok = imgCache[item.src];
          el.innerHTML = ok
            ? `<img src="${item.src}" style="width:100%;height:100%;object-fit:contain">`
            : "";
        } else if (item.kind === "color") {
          el.style.background = item.css;
        } else {
          el.innerHTML = `<span style="font-size:${trial.font_size}">${item.text}</span>`;
        }
        // Noise goes on a transparent overlay over the item's box; the item is untouched.
        clearNoise(p);
        if (trial.noise_level > 0) {
          noiseRemovers[p] = U.noiseOverlay(el, trial.noise_level, trial.noise_type, { wheel });
        }
      };
      const clearItem = (p) => {
        const el = itemEl(p);
        clearNoise(p);
        el.innerHTML = "";
        el.style.background = "";
      };

      // ---- Phases -------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#recall-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.precue_time > 0 && trial.do_test) {
          // Pre-cue ring on the to-be-probed location, then delay_start, then the array.
          // No pre-cue on an encoding-only trial (do_test false): there is no probe to cue.
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      const showArray = () => {
        arrayOnset = performance.now();
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => paintItem(pos[i], items[i]),
          clear: (i) => clearItem(pos[i]),
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        actualDisplay = Math.round(performance.now() - arrayOnset);
        for (let i = 0; i < setSize; i++) clearItem(pos[i]);
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          jsPsych.pluginAPI.setTimeout(trial.do_test ? afterDelay : () => finish(null), trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time is 0 or do_test is false.
        if (trial.mask_time > 0 && trial.do_test) {
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, { wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue: ring only the to-be-probed location for retrocue_time ms. It is
      // not cleared, because showProbe overwrites it with the probe ring.
      const afterDelay = () => {
        if (trial.retrocue_time > 0) {
          const probePos = pos[whichTest];
          if (probePos != null) U.spatialCue(itemEl(probePos), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(showProbe, trial.retrocue_time);
        } else {
          showProbe();
        }
      };

      const showProbe = () => {
        // Ring the probed location and show the response field.
        const probePos = pos[whichTest];
        if (probePos != null) itemEl(probePos).style.boxShadow = "0 0 0 5px #000";
        if (trial.response_location === "center") {
          display_element.querySelector("#recall-fixation").style.display = "none";
        }

        const minAttr = trial.input_min != null ? ` min="${trial.input_min}"` : "";
        const maxAttr = trial.input_max != null ? ` max="${trial.input_max}"` : "";
        const stepAttr = trial.input_step != null ? ` step="${trial.input_step}"` : "";
        const phAttr = trial.input_placeholder ? ` placeholder="${trial.input_placeholder}"` : "";
        setResponseHTML(
          `<input type="${trial.input_type}" id="recall-input"${minAttr}${maxAttr}${stepAttr}${phAttr} ` +
          `style="font-size:32pt;text-align:center;width:6em">` +
          `<br><button class="jspsych-btn" id="recall-submit" style="font-size:18pt;margin-top:8px">${trial.button_label}</button>`
        );

        const input = display_element.querySelector("#recall-input");
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.repeat) return;   // a held Enter auto-repeats; it is still one response
            if (submitted) return;
            submitted = true;
            // Enter-to-submit is a keyboard response, so it records a hold (CONVENTIONS §11).
            // Consume any pending click first, so a click that only focused the field is
            // never credited here. No press log (see key_hold_duration in info.data).
            U.mouseHoldDuration();
            // Stamp rt here, at KeyDown. submit() runs after the release, and timing it
            // there would fold the hold into rt, coupling rt to key_hold_duration.
            const at = performance.now();
            U.awaitKeyUp(e.key).then(finishOnce.guard((keyHold) => submit(null, keyHold, at)));
          }
        });
        display_element.querySelector("#recall-submit").addEventListener("click", onSubmitClick);
        input.focus();
        probeOnset = performance.now();
      };

      // ---- Response / scoring -------------------------------------------------
      // The hold is read before any guard, so an ignored click (empty field, or Enter
      // already pending) still consumes its own press.
      const onSubmitClick = () => {
        const hold = U.mouseHoldDuration();
        if (submitted) return;
        submitted = true;
        submit(hold, null, performance.now());
      };

      // `at` is the response timestamp: the click time, or the Enter KeyDown time (an Enter
      // press reaches submit() only after its release).
      const submit = (hold, keyHold, at) => {
        const input = display_element.querySelector("#recall-input");
        if (!input) return;                                    // already torn down
        const value = input.value;
        if (value == null || String(value).length < 1) {       // require an entry
          submitted = false;                                   // let them try again
          return;
        }
        const rt = Math.round((at == null ? performance.now() : at) - probeOnset);
        const correct = target == null ? null : looseEqual(value, target);

        // Lock the UI.
        display_element.querySelector("#recall-submit").removeEventListener("click", onSubmitClick);
        display_element.querySelector("#recall-submit").disabled = true;
        input.disabled = true;

        if (trial.feedback && correct !== null) {
          const probePos = pos[whichTest];
          if (probePos != null) itemEl(probePos).style.boxShadow = `0 0 0 5px ${correct ? "#2ecc40" : "#ff4136"}`;
          setMsg(correct ? "Correct!" : "Incorrect");
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(() => finish({ rt: rt, hold: hold, keyHold: keyHold, value: value, correct: correct }), 800);
        } else {
          finish({ rt: rt, hold: hold, keyHold: keyHold, value: value, correct: correct });
        }
      };

      // ---- Finish -------------------------------------------------------------
      // resp is null for encoding-only (do_test:false) trials.
      const finish = (resp) => {
        // The full studied list (position, order, value), for swap/interference analyses.
        const stimuli_shown = specs.map((s, i) => {
          const it = items[i];
          const entry = {
            position: pos[i],             // placeholder index of this item
            order: i,                     // index into the studied list
            value: s,                     // item spec as given (degree / color / image / text)
            probed: i === whichTest, // whether this item's location was probed
          };
          if (it.kind === "image") entry.src = it.src;
          else if (it.kind === "color") entry.color = it.css;
          else entry.text = it.text;
          return entry;
        });
        const data = {
          rt: resp ? resp.rt : null,
          mouse_hold_duration: resp && resp.hold != null ? resp.hold : null,
          key_hold_duration: resp && resp.keyHold != null ? resp.keyHold : null,
          response: resp ? resp.value : null,
          correct: resp ? resp.correct : null,
          target: target != null ? String(target) : null,
          which_test: whichTest,
          positions: pos,
          stimuli: specs,
          actual_display_time: actualDisplay,
          actual_stim_duration: actualDisplay, // alias of actual_display_time
          stimuli_shown: stimuli_shown,
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // ---- small DOM helper ----
      const setResponseHTML = (h) => (display_element.querySelector("#recall-response").innerHTML = h);

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#recall-fixation").addEventListener("click", start);
      } else {
        start();
      }

      }); // end loadImages().then
    }
  }
  RecallPlugin.info = info;

  // ===== module-private helpers =====
  // Scoring match for typed recall: numeric compare when both sides parse fully as
  // numbers (so "07"/"7.0" match 7), otherwise a trimmed, case-insensitive compare in
  // which any run of whitespace counts as one space ("ice  cream" matches "ice cream").
  function looseEqual(a, b) {
    var sa = String(a).trim().replace(/\s+/g, " "), sb = String(b).trim().replace(/\s+/g, " ");
    // Number(), not parseFloat, so "7abc" does not count as 7.
    var na = Number(sa), nb = Number(sb);
    if (sa !== "" && sb !== "" && !isNaN(na) && !isNaN(nb) && na === nb) return true;
    return sa.toLowerCase() === sb.toLowerCase();
  }
  return RecallPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-spatial-report.js */
/* ===================================================================== */
/*
 * jspsych-spatial-report.js  --  jsPsych v8 plugin
 *
 * Spatial location memory. Shows a memory array of items at locations around a
 * circle, a blank delay, then shows one of the items at the centre and asks where
 * it was. spatial_error is the Euclidean distance (px) between the reported and the
 * true location.
 *
 * response_mode sets how the location is reported:
 *   "box"   -> click the placeholder box the item was in (a discrete choice).
 *   "click" -> click anywhere in the field (continuous x,y).
 *   "drag"  -> drag the probe from the centre to the remembered spot (continuous
 *              x,y). The response commits on the mouseup that drops it. The press
 *              is timed as drag_duration, never as mouse_hold_duration (CONVENTIONS §11).
 *
 * Coordinates: all x,y values are px in the field's own frame, origin at the
 * top-left inside the field's border, y down, unscaled by auto_zoom. A location is
 * the centre of its placeholder; placeholder and probe outlines are CSS outlines,
 * which take no layout space, so the visible centre is exactly that point.
 *
 * Items can be colors, color-wheel degrees, images, or words, mixed freely, via
 * BradyUtils.resolveItem (see `stimuli` / `item_type`).
 *
 * Key options:
 *   response_mode  -- "box" | "click" | "drag"
 *   precue_time / retrocue_time -- highlight the to-be-probed location before the
 *                     array / after the delay. In a location task these cues give
 *                     away the answer, so use them deliberately.
 *   noise_level / noise_type -- degrade the items at encoding (BradyUtils.noiseKinds /
 *                     registerNoise)
 *   mask_time / mask_type    -- mask the occupied locations at array offset, before the delay
 *                     (BradyUtils.maskKinds / registerMask)
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSpatialReport = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "spatial-report",
    version: version,
    parameters: {
      /**
       * The memory-array items. Each entry may be a number (degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)"
       * string, an image path ("dog.png", "img/x.jpg"), or a word ("cat").
       * If empty, `set_size` random wheel colors (>= `min_color_distance`
       * deg apart) are generated.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Number of items to auto-generate when `stimuli` is empty. */
      set_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Min separation (deg) between auto-generated wheel colors. */
      min_color_distance: { type: jspsych.ParameterType.INT, default: 25 },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally spaced locations around the circle. Raised to set_size (or past the
          largest item_positions index) if smaller. Location 0 is straight below the centre and
          the indices run counterclockwise on screen. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each item / placeholder box. */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Index (0..set_size-1) of the item that is probed at test. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** How the location is reported: "box" (click a placeholder), "click" (click anywhere), or "drag" (drag the probe). */
      response_mode: { type: jspsych.ParameterType.STRING, default: "box" },
      /**
       * Whether the empty placeholder outlines stay visible during the response.
       * Ignored (always shown) in "box" mode, which needs the boxes to click. In
       * "click" / "drag" they are optional spatial guides. They are always shown
       * during the memory array.
       */
      show_placeholders: { type: jspsych.ParameterType.BOOL, default: true },
      /** How long (ms) the memory array is shown. */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) between array offset and the probe. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start (click or trial onset) to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** If > 0, pre-cue: highlight the to-be-probed location (a `cue_color`/`cue_thickness`
          ring) for this long before the array. In a location task the cue gives away the
          answer, so use it deliberately. Skipped when do_test is false (there is no probe
          to cue). 0 = off. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, retro-cue: after the retention delay, highlight the
          to-be-probed location for this long before the response. Gives away the answer in a
          location task. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
          the `noise_type` degradation (a transparent overlay; removed at array offset). */
      noise_level: { type: jspsych.ParameterType.FLOAT, default: 0 },
      /** Noise kind: a key in BradyUtils.noiseKinds ("speckle", "salt-pepper", "gaussian";
          extend with BradyUtils.registerNoise) or a function(ctx, size, level, {wheel, rng}). */
      noise_type: { type: jspsych.ParameterType.STRING, default: "speckle" },
      /** Color of the pre-/retro-cue highlight ring. */
      cue_color: { type: jspsych.ParameterType.STRING, default: "#000" },
      /** Thickness (px) of the pre-/retro-cue highlight ring. */
      cue_thickness: { type: jspsych.ParameterType.INT, default: 5 },
      /** If false, skip the test/response entirely (encoding-only trial). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** Background color of the stimulus field. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** After the response, show the true location (green ring), the wrong box if any (red ring),
          the click/drop point in "click"/"drag" mode, and the error in px, for 900 ms. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response (nearest placeholder is the true one). */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Optional HTML shown beneath the display (instructions, etc.). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Scale the stimulus field with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** Record the mouse trajectory from trial start (the fixation click, or trial onset when click_to_start is false) to the response. */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between recorded mouse samples (0 = every event). */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between recorded mouse samples during the report phase (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from probe onset to the committing click, or in "drag" mode to the drop (so it includes the drag itself; the drag started at drag_start_rt). null if do_test is false. The literature's "response initiation time" in "box"/"click" mode. */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click, in "box" and "click" modes. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. Always null in "drag" mode, where the press is a movement and is reported as `drag_duration` instead; never pool the two. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** "drag" mode only: how long (ms) the button was held across the drag, from the mousedown that grabs the probe to the mouseup that drops it. This is a movement time, not a response duration in the sense of Zhou et al.: it depends mostly on how far the probe had to travel, so it is not comparable to `mouse_hold_duration`. null outside "drag" mode. */
      drag_duration: { type: jspsych.ParameterType.INT },
      /** "drag" mode only: time (ms) from probe onset to the mousedown that grabs the probe, i.e. when the drag started. With drag_duration, rt is about drag_start_rt + drag_duration. null outside "drag" mode (and if do_test is false). */
      drag_start_rt: { type: jspsych.ParameterType.INT },
      /** Reported x location (px, field frame: from the field's inner left edge, unscaled by auto_zoom). "box": the clicked placeholder's centre; "click": the click point; "drag": the dropped probe's centre. */
      reported_x: { type: jspsych.ParameterType.FLOAT },
      /** Reported y location (px, field frame, y down). */
      reported_y: { type: jspsych.ParameterType.FLOAT },
      /** True x location (px, field frame) of the probed item's placeholder centre; null if do_test is false. */
      true_x: { type: jspsych.ParameterType.FLOAT },
      /** True y location (px, field frame) of the probed item's placeholder centre; null if do_test is false. */
      true_y: { type: jspsych.ParameterType.FLOAT },
      /** Spatial error: Euclidean distance (px, unsigned) between reported and true location. Signed components are reported_x - true_x and reported_y - true_y. */
      spatial_error: { type: jspsych.ParameterType.FLOAT },
      /** "box", "click", or "drag". */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** "box": the placeholder clicked. "click"/"drag": the placeholder whose centre is nearest the reported point. null if do_test is false. */
      clicked_position: { type: jspsych.ParameterType.INT },
      /** Placeholder index the probed item actually occupied. */
      correct_position: { type: jspsych.ParameterType.INT },
      /** clicked_position === correct_position, i.e. in "click"/"drag" mode the nearest placeholder is the true one. null if do_test is false. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The studied item specs (colors/degrees/images/words), as given/generated. */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the probed item. */
      which_test: { type: jspsych.ParameterType.INT },
      /** Number of items shown. */
      set_size: { type: jspsych.ParameterType.INT },
      /** Measured ms the memory array was actually on screen (onset to hide). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per presented item: placeholder index, centre (x,y, px, field frame), and value (color/degree/image src/word). */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Index into stimuli_shown of the probed item (= which_test). */
      target_index: { type: jspsych.ParameterType.INT },
      /** record_mouse: recorded mouse samples, each a [t, x, y, value] row (see mouse_trajectory_columns). */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** record_mouse: column names for each mouse_trajectory row. */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** record_mouse: index into mouse_trajectory of the first report-phase sample. */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at the fixation click, or at trial start when click_to_start is false). encoding: 0, tracking start, which comes before any pre-cue and delay_start; array: the memory array's onset; mask: the mask's onset, which is the array's offset (only on trials that show a mask); delay: the blank retention interval begins, at the array's offset or, after a mask, at the mask's offset; report: the probe appears. Any retro-cue falls between delay and report. */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** record_mouse: CSS zoom/scale factor applied to the box when sampling (for un-zooming coords). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** record_mouse: layout in the mouse-trajectory frame (logical px from the field centre): the item boxes (value = placeholder index, target flagged). wheel, wheel_points and target_point are null (no response wheel). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SpatialReportPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      let mt = null; // optional whole-trial mouse-trajectory recorder (record_mouse)
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;
      const mode = trial.response_mode;

      // ---- Resolve memory items (color / image / text / wheel degree) ----
      let specs = trial.stimuli.slice();
      const rawSetSize = specs.length || trial.set_size;
      // At least one item: with none there is nothing to probe and indexing throws
      // (checkParams still warns about the raw value).
      if (specs.length === 0) specs = U.randomColorDegrees(Math.max(1, trial.set_size), trial.min_color_distance);
      const setSize = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      // Warn (only) about which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "spatial-report", setSize: setSize, supportsEnsemble: false });
      U.checkParams(trial, { plugin: "spatial-report", setSize: rawSetSize,
        enums: { response_mode: ["box", "click", "drag"], item_type: ["auto", "color", "image", "text"] } });
      // Clamp an out-of-range which_test (validatePlacement only warns) so indexing can't
      // throw, as in the other report plugins. It lives in a local: trial is jsPsych's stored
      // copy of the parameters (save_trial_parameters reads it), so it is never modified.
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "spatial-report" });
      const probeItem = items[whichTest];

      // ---- Preload any images, then build and run the trial ----
      // trial() stays synchronous (CONVENTIONS §3); the trial ends via finishTrial().
      U.loadImages(items.filter((it) => it.kind === "image").map((it) => it.src)).then((imgCache) => {

      // ---- Choose item locations ----
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots), with enough
      // placeholders for every item and every slot used.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const nph = placed.nph;
      const pos = placed.pos;

      // The probed item's placeholder; its centre is the true location.
      const correctPos = pos[whichTest];

      // ---- Layout: square field with placeholders around a circle ----
      const boxSize = 2 * trial.radius + 2 * trial.item_size + 40;
      const center = boxSize / 2;
      const half = trial.item_size / 2;

      // Top-left and centre of every placeholder (field frame). Placeholder i sits at
      // angle 2*pi*i/nph: x = center + sin * radius, y = center + cos * radius.
      const phTop = [], phLeft = [], phCenter = [];
      for (let i = 0; i < nph; i++) {
        const top = Math.cos((2 * Math.PI * i) / nph) * trial.radius + center - half;
        const left = Math.sin((2 * Math.PI * i) / nph) * trial.radius + center - half;
        phTop.push(top);
        phLeft.push(left);
        phCenter.push({ x: left + half, y: top + half });
      }
      const trueX = phCenter[correctPos].x;
      const trueY = phCenter[correctPos].y;

      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // ---- Build DOM ----
      let html =
        `<div id="sr-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      // Outlines, not borders: an outline takes no layout space, so each canvas's
      // visible centre is exactly phCenter (a 1px border would shift it by 1px, and the
      // shift would change when show_placeholders:false removes it at the response).
      for (let i = 0; i < nph; i++) {
        html +=
          `<canvas id="sr-item-${i}" class="sr-item" data-pos="${i}" ` +
          `width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;outline:1px solid #888;top:${phTop[i]}px;left:${phLeft[i]}px"></canvas>`;
      }
      // Centre probe, shown at test: a static reminder in box/click mode, the dragged
      // element in drag mode.
      html +=
        `<canvas id="sr-probe" width="${trial.item_size}" height="${trial.item_size}" ` +
        `style="position:absolute;display:none;outline:1px solid #222;` +
        `top:${center - half}px;left:${center - half}px"></canvas>` +
        `<span id="sr-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="sr-message" style="position:absolute;top:14px;width:100%;text-align:center;pointer-events:none">${startText}</div>` +
        `</div>`;
      if (trial.prompt) html += trial.prompt;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#sr-box"));

      const box = display_element.querySelector("#sr-box");
      const probeCanvas = display_element.querySelector("#sr-probe");
      const itemEl = (p) => display_element.querySelector(`#sr-item-${p}`);
      const setMsg = (h) => (display_element.querySelector("#sr-message").innerHTML = h);

      // ---- State ----
      let responseOnset = null;
      let reportedX = null, reportedY = null;
      let clickedPos = null;
      // How long the committing click was held ("response duration", RD), box/click mode
      // only. A drag's press is a movement whose length depends on how far the probe
      // travels, so it goes to dragDuration and the two are never pooled.
      let mouseHold = null;
      let dragDuration = null;
      let dragDownT = null;
      let dragStartRt = null; // drag mode: probe onset -> the mousedown that grabs the probe
      // for actual_stim_duration (array onset to hide)
      let arrayOnset = null, actualStimDuration = null;
      // Stimulus-noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const addNoise = (p) => {
        if (!(trial.noise_level > 0)) return;
        clearNoise(p);
        noiseRemovers[p] = U.noiseOverlay(itemEl(p), trial.noise_level, trial.noise_type, { wheel });
      };

      // ---- Phases -------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#sr-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        // Mouse recording starts here on both paths, so a precue is recorded too.
        // seedCenter only after a fixation click, when the cursor is known to be at the centre.
        if (trial.record_mouse && !mt) {
          const t0 = performance.now();
          mt = U.makeMouseTracker(box, t0, {
            minInterval: trial.mouse_min_interval,
            responseMinInterval: trial.mouse_response_min_interval,
          });
          mt.attach();
          if (trial.click_to_start) mt.seedCenter();
          mt.mark("encoding");
        }
        if (trial.precue_time > 0 && trial.do_test) {
          // Pre-cue the to-be-probed location, then delay_start, then the array. No
          // pre-cue on an encoding-only trial (do_test false): there is no probe to cue.
          const clearCue = U.spatialCue(itemEl(correctPos), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => {
            clearCue();
            jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
          }, trial.precue_time);
        } else {
          jsPsych.pluginAPI.setTimeout(showArray, trial.delay_start);
        }
      };

      const showArray = () => {
        arrayOnset = performance.now();
        if (mt) mt.mark("array");
        U.encodeArray({
          api: jsPsych.pluginAPI, n: setSize,
          paint: (i) => { paintItem(itemEl(pos[i]), items[i]); addNoise(pos[i]); },
          clear: (i) => { clearNoise(pos[i]); clearCanvas(itemEl(pos[i])); },
          displayTime: trial.display_time, sequential: trial.sequential,
          itemTime: trial.sequential_item_time, gapTime: trial.sequential_gap_time,
          cumulative: trial.sequential_cumulative, onDone: hideArray,
        });
      };

      const hideArray = () => {
        for (let i = 0; i < setSize; i++) { clearNoise(pos[i]); clearCanvas(itemEl(pos[i])); }
        if (arrayOnset !== null) actualStimDuration = Math.round(performance.now() - arrayOnset);
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          if (mt) mt.mark("delay");
          jsPsych.pluginAPI.setTimeout(trial.do_test ? afterDelay : () => finish(), trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time is 0 or do_test is false.
        if (trial.mask_time > 0 && trial.do_test) {
          if (mt) mt.mark("mask");
          const removeMasks = [];
          for (let i = 0; i < setSize; i++) removeMasks.push(U.maskOverlay(itemEl(pos[i]), trial.mask_type, { wheel }));
          jsPsych.pluginAPI.setTimeout(() => {
            removeMasks.forEach((r) => r());
            startDelay();
          }, trial.mask_time);
        } else {
          startDelay();
        }
      };

      // Optional retro-cue after the retention delay, before the response.
      const afterDelay = () => {
        if (trial.retrocue_time > 0) {
          const clearCue = U.spatialCue(itemEl(correctPos), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(() => { clearCue(); showProbe(); }, trial.retrocue_time);
        } else {
          showProbe();
        }
      };

      const showProbe = () => {
        if (mt) mt.mark("report");
        display_element.querySelector("#sr-fixation").style.display = "none";

        // Empty placeholders: visible and clickable in "box" mode, visible guides if
        // show_placeholders, otherwise hidden during the response.
        for (let i = 0; i < nph; i++) {
          const el = itemEl(i);
          if (mode === "box" || trial.show_placeholders) {
            el.style.outlineColor = "#888";
          } else {
            el.style.outline = "none";
          }
        }

        // Show the probe item at the centre.
        paintItem(probeCanvas, probeItem);
        probeCanvas.style.display = "block";

        if (mode === "box") setMsg("Click the box where the item appeared.");
        else if (mode === "drag") setMsg("Drag the item to where it appeared.");
        else setMsg("Click where the item appeared.");

        responseOnset = performance.now();
        // Report-phase value column: the placeholder nearest the cursor (x,y already
        // hold the continuous position).
        if (mt) mt.setValueFn((e) => { const p = fieldXY(e); return nearestPlaceholder(p.x, p.y); });
        if (mode === "box") enableBoxResponse();
        else if (mode === "drag") enableDragResponse();
        else enableClickResponse();
      };

      // ---- Response: "box" (discrete location choice) -------------------------
      const enableBoxResponse = () => {
        display_element.querySelectorAll(".sr-item").forEach((el) => {
          el.style.cursor = "pointer";
          el.addEventListener("click", onBoxClick);
        });
      };
      const onBoxClick = function (e) {
        // Read the hold first, so every click consumes exactly one press.
        mouseHold = U.mouseHoldDuration();
        if (mt) mt.sample(e);
        const p = parseInt(this.getAttribute("data-pos"), 10);
        clickedPos = p;
        reportedX = phCenter[p].x;
        reportedY = phCenter[p].y;
        display_element.querySelectorAll(".sr-item").forEach((el) => {
          el.style.cursor = "default";
          el.removeEventListener("click", onBoxClick);
        });
        respond();
      };

      // ---- Response: "click" (continuous) -------------------------------------
      const enableClickResponse = () => {
        box.style.cursor = "crosshair";
        box.addEventListener("click", onFieldClick);
      };
      const onFieldClick = (e) => {
        mouseHold = U.mouseHoldDuration(); // read first: one press consumed per click
        if (mt) mt.sample(e);
        const p = fieldXY(e);
        reportedX = p.x;
        reportedY = p.y;
        clickedPos = nearestPlaceholder(reportedX, reportedY);
        box.style.cursor = "default";
        box.removeEventListener("click", onFieldClick);
        respond();
      };

      // ---- Response: "drag" (continuous) --------------------------------------
      let dragging = false, grabDX = 0, grabDY = 0;
      const enableDragResponse = () => {
        probeCanvas.style.cursor = "grab";
        probeCanvas.addEventListener("mousedown", onDragStart);
      };
      const onDragStart = (e) => {
        e.preventDefault();
        // The response commits on the mouseup that ends the drag, not on a click, so the
        // press is timed here rather than with U.mouseHoldDuration(), whose staleness
        // window would discard the long presses a drag produces.
        dragDownT = performance.now();
        dragStartRt = Math.round(dragDownT - responseOnset);
        dragging = true;
        probeCanvas.style.cursor = "grabbing";
        const p = fieldXY(e);
        // Offset of the grab point from the probe's top-left, held constant during the
        // drag so the probe doesn't jump under the cursor.
        grabDX = p.x - parseFloat(probeCanvas.style.left);
        grabDY = p.y - parseFloat(probeCanvas.style.top);
        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("mouseup", onDragEnd);
      };
      const onDragMove = (e) => {
        if (!dragging) return;
        const p = fieldXY(e);
        probeCanvas.style.left = p.x - grabDX + "px";
        probeCanvas.style.top = p.y - grabDY + "px";
      };
      const onDragEnd = (e) => {
        // Consume the shared recorder's press either way, so this drag can never be
        // claimed as the hold of a later click.
        U.mouseHoldDuration();
        if (!dragging) return;
        // A movement time, kept out of mouse_hold_duration (see info.data).
        if (dragDownT !== null) dragDuration = Math.round(performance.now() - dragDownT);
        if (mt) mt.sample(e);
        dragging = false;
        probeCanvas.style.cursor = "grab";
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", onDragEnd);
        reportedX = parseFloat(probeCanvas.style.left) + half;
        reportedY = parseFloat(probeCanvas.style.top) + half;
        clickedPos = nearestPlaceholder(reportedX, reportedY);
        probeCanvas.removeEventListener("mousedown", onDragStart);
        respond();
      };

      // ---- After a response: spatial error, optional feedback, finish ---------
      const respond = () => {
        const rt = Math.round(performance.now() - responseOnset);
        const err = Math.sqrt((reportedX - trueX) ** 2 + (reportedY - trueY) ** 2);
        const isCorrect = clickedPos != null ? clickedPos === correctPos : null;

        const done = () =>
          finish({ rt: rt, spatialError: err, correct: isCorrect });

        if (trial.feedback) {
          // Show the true location (green) and the wrong box, if any (red).
          paintItem(itemEl(correctPos), probeItem);
          itemEl(correctPos).style.boxShadow = "0 0 0 4px #2e8b3a";
          if (!isCorrect && clickedPos != null) itemEl(clickedPos).style.boxShadow = "0 0 0 4px #c0392b";
          if (mode !== "box") addMarker(reportedX, reportedY, "#c0392b"); // exact click/drop point
          setMsg(`${isCorrect ? "Correct location" : "Wrong location"} — off by ${Math.round(err)} px.`);
          U.feedbackCues(!!isCorrect, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(done, 900);
        } else {
          done();
        }
      };

      // ---- Finish -------------------------------------------------------------
      const finish = (r) => {
        r = r || {};
        // Drag listeners live on document; remove them here too in case the trial ends
        // mid-drag (e.g. an external finish). No-op otherwise.
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("mouseup", onDragEnd);
        // Every presented item with its placeholder and centre, for swap/interference analyses.
        const stimuli_shown = [];
        for (let i = 0; i < setSize; i++) {
          const it = items[i];
          const value = it.kind === "image" ? it.src : it.kind === "text" ? it.text : specs[i];
          stimuli_shown.push({ position: pos[i], x: phCenter[pos[i]].x, y: phCenter[pos[i]].y, value: value });
        }
        // Don't clear the DOM yet: the mouse tracker reads the box's scale from the page.
        // It is cleared just before finishTrial.
        const data = {
          rt: r.rt != null ? r.rt : null,
          mouse_hold_duration: mouseHold,
          drag_duration: dragDuration,
          drag_start_rt: dragStartRt,
          reported_x: reportedX,
          reported_y: reportedY,
          true_x: trial.do_test ? trueX : null,
          true_y: trial.do_test ? trueY : null,
          spatial_error: r.spatialError != null ? r.spatialError : null,
          response_mode: mode,
          clicked_position: clickedPos,
          correct_position: correctPos,
          correct: r.correct != null ? r.correct : null,
          positions: pos,
          stimuli: specs,
          which_test: whichTest,
          set_size: setSize,
          stimuli_shown: stimuli_shown,
          target_index: whichTest,
          actual_stim_duration: actualStimDuration,
        };
        if (trial.record_mouse && mt) {
          mt.detach();
          Object.assign(data, U.mouseTrackerData(mt));
        }
        if (trial.record_mouse) {
          // Logical px from the field centre: phCenter minus `center`; top-left = centre - half.
          const gitems = [];
          for (let i = 0; i < setSize; i++) {
            const c = phCenter[pos[i]];
            gitems.push({
              index: i, position: pos[i], value: pos[i],
              target: i === whichTest,
              x: c.x - center - half, y: c.y - center - half,
              w: trial.item_size, h: trial.item_size,
            });
          }
          // No response wheel; the answer is the target item's box.
          data.mouse_geometry = {
            units: "logical px from stage centre",
            box: boxSize,
            items: gitems,
            wheel: null,
            wheel_points: null,
            target_point: null,
          };
        }
        display_element.innerHTML = ""; // the tracker data has been read
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // Index of the placeholder whose centre is closest to (x,y).
      function nearestPlaceholder(x, y) {
        let best = 0, bd = Infinity;
        for (let i = 0; i < nph; i++) {
          const d = (phCenter[i].x - x) ** 2 + (phCenter[i].y - y) ** 2;
          if (d < bd) { bd = d; best = i; }
        }
        return best;
      }

      // ---- Geometry / paint helpers ------------------------------------------
      // Mouse event -> field coordinates, undoing any auto_zoom scale. The rect is the
      // border box, but absolutely positioned children are placed from the padding box,
      // so subtract the field's own border (clientLeft/Top) to share their frame.
      function fieldXY(e) {
        const rect = box.getBoundingClientRect();
        const sx = rect.width / box.offsetWidth || 1;
        const sy = rect.height / box.offsetHeight || 1;
        return { x: (e.clientX - rect.left) / sx - box.clientLeft, y: (e.clientY - rect.top) / sy - box.clientTop };
      }
      // A ring centred on (x,y). border-box keeps the 3px border inside the 14px.
      function addMarker(x, y, color) {
        const m = document.createElement("div");
        m.style.cssText =
          `position:absolute;box-sizing:border-box;width:14px;height:14px;border-radius:50%;` +
          `border:3px solid ${color};pointer-events:none;left:${x - 7}px;top:${y - 7}px`;
        box.appendChild(m);
      }
      function paintItem(canvas, item) {
        U.paintItem(canvas.getContext("2d"), item, trial.item_size, imgCache);
      }
      function clearCanvas(canvas) {
        canvas.getContext("2d").clearRect(0, 0, trial.item_size, trial.item_size);
      }

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#sr-fixation").addEventListener("click", start);
      } else {
        start();
      }

      }); // end loadImages().then
    }
  }
  SpatialReportPlugin.info = info;

  return SpatialReportPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-rsvp.js */
/* ===================================================================== */
/*
 * jspsych-rsvp.js  --  jsPsych v8 plugin
 *
 * Rapid serial visual presentation. Shows a stream of stimuli one at a time at
 * the same screen location, each for item_duration ms with an optional blank ISI
 * after it. Records the stream order and the measured on/off time of every item.
 *
 * Each stream item may be a color, a color-wheel degree, an image, or text, mixed
 * freely (see `stimuli` / `item_type`, resolved via BradyUtils.resolveItem). All
 * items are painted into one shared canvas, so every kind renders in the same spot
 * at the same size.
 *
 * Timing: items are scheduled with jsPsych.pluginAPI.setTimeout, chained item to
 * item, not locked to display frames. Each on/off time is stamped with
 * performance.now() when the canvas is painted or cleared, which is when the draw
 * call runs, not when the frame reaches the screen. Durations therefore come out
 * in whole-frame steps on screen (about 16.7 ms at 60 Hz) and can run a frame long;
 * check actual_stim_timing / actual_isi_timing rather than assuming the requested
 * values. With isi 0 the next item replaces the current one directly, with no
 * blank in between.
 *
 * By default no response is collected. `response_keys` adds a key-detection
 * response for target-detection designs; it never ends the trial early, since the
 * stream's own timing ends the trial. Responses are timed from stream onset, and
 * each one records `item`, the most recently painted item, and `during_isi`, whether
 * the blank after that item was showing at the keypress.
 *
 * Trial-ending rule (CONVENTIONS.md §3): timer driven, so trial() is synchronous
 * and calls this.jsPsych.finishTrial(data) once (through U.makeFinisher) when the
 * stream ends.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRsvp = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "rsvp",
    version: version,
    parameters: {
      /**
       * The stream, in presentation order. Each entry may be a number (degree
       * on the color wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a
       * "lab(L,a,b)" string, an image path ("dog.png", "img/x.jpg"), or text ("cat").
       * Required.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: undefined },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * Time in ms each stimulus is shown. A single value (or length-1 array)
       * applies to every item; otherwise give one value per item. A shorter array
       * is padded with its last value (with a console warning). Declared OBJECT, not
       * INT, because jsPsych 8 coerces a non-array INT parameter to a number and
       * would turn a per-item array into NaN.
       */
      item_duration: { type: jspsych.ParameterType.OBJECT, default: 100 },
      /**
       * Blank inter-stimulus interval (ms) after each item, including the last.
       * A single value (or length-1 array) applies to every item; otherwise one per
       * item (a shorter array is padded with its last value). Default 0: items are
       * back to back with no blank frame between them. OBJECT for the same reason
       * as item_duration.
       */
      isi: { type: jspsych.ParameterType.OBJECT, default: 0 },
      /** Size (px) of the square presentation area / each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 200 },
      /** Background color of the presentation box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#ffffff" },
      /** Optional HTML shown beneath the stream (e.g. task instructions). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /**
       * Optional keys to listen for during the stream (e.g. ["f"] to flag a
       * detected target). null (default) collects no response. Every press of a
       * listed key is logged (a held key counts once); none ends the trial early.
       */
      response_keys: { type: jspsych.ParameterType.KEYS, default: null },
      /** Scale the presentation box with CSS transform to fill the window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** The stream item specs, in presentation order (as given / resolved). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Requested per-item display durations (ms), expanded to one per item. */
      item_duration: { type: jspsych.ParameterType.INT, array: true },
      /** Requested per-item ISIs (ms), expanded to one per item. */
      isi: { type: jspsych.ParameterType.INT, array: true },
      /** Measured time (ms) from each item's paint call to its clear call (or to the next item's paint, when isi is 0). */
      actual_stim_timing: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured blank time (ms) after each item; 0 when isi is 0. */
      actual_isi_timing: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured duration (ms) of the whole stream: first item onset to last item offset. */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** All key responses during the stream: [{ key, rt, item, during_isi }]. rt is ms from stream onset (first item painted). item is the index of the most recently painted item (null before the first one), so a press during a blank ISI is credited to the item just before it. during_isi is true if that item had already been cleared (the press fell in its blank ISI, including the blank after the last item), false while it was on screen. Both are stamped when the key event is handled, not at the screen refresh. */
      responses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** RT (ms, from stream onset) of the first response, or null. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** Key of the first response, or null. */
      response: { type: jspsych.ParameterType.STRING },
      /** How long (ms) the first response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (still held at stream end, window blurred). Later responses' holds are in key_presses. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed during the stream (any key, not only response_keys): {key, t (ms from stream onset), duration}. `duration` is null for a key still held when the stream ended (it still counts for the multi-key exclusion). Only when response_keys is set; else null. */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** One entry per stream item: `position` (serial position), `kind`, `spec`, the resolved `src`/`text`/`css` (+ `degree` for numeric specs), and its requested `item_duration`/`isi`. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RsvpPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;
      U.checkParams(trial, { plugin: "rsvp", enums: { item_type: ["auto", "color", "image", "text"] } });

      // ---- Resolve the stream items (color / image / text / wheel-degree) ----
      const specs = trial.stimuli.slice();
      const n = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));

      // ---- Expand timing arrays (length 1 -> applies to all items) ----
      const durations = expand(trial.item_duration, n);
      const isis = expand(trial.isi, n);

      // ---- Preload images, then build and run (trial() stays synchronous) ----
      U.loadImages(items.filter((it) => it.kind === "image").map((it) => it.src)).then((imgCache) => {

        // ---- Build the DOM: one square box with a single shared canvas ----
        const s = trial.item_size;
        let html =
          `<div id="rsvp-box" style="position:relative;margin:0 auto;border:1px solid #000;box-sizing:content-box;` +
          `width:${s}px;height:${s}px;background:${trial.background_color}">` +
          `<canvas id="rsvp-canvas" width="${s}" height="${s}" ` +
          `style="display:block"></canvas></div>`;
        if (trial.prompt) html += trial.prompt;
        display_element.innerHTML = html;
        if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#rsvp-box"));

        const ctx = display_element.querySelector("#rsvp-canvas").getContext("2d");

        // ---- State / recording ----
        const actualStimTiming = [];
        const actualISITiming = [];
        const responses = [];
        let streamStart = null;
        let lastStimOffset = null; // offset (clear) time of the most recent item
        let curItem = null;        // index of the most recently painted item (null before the first)
        let inIsi = false;         // true while that item has been cleared (blank ISI)
        let kbListener = null;

        // ---- Optional (non-interrupting) key-detection response ----
        if (trial.response_keys) {
          // Log every key released from here on, so each response's hold (and any extra
          // keys) can be read back at stream end; the timer-driven stream never waits on a
          // release. The log opens in the same task as the first paint, so its t is
          // effectively ms from stream onset.
          U.beginPressLog();
          kbListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: (resp) => {
              responses.push({ key: resp.key, rt: Math.round(performance.now() - streamStart), item: curItem, during_isi: inIsi });
            },
            valid_responses: trial.response_keys,
            rt_method: "performance",
            persist: true, // listen for the whole stream
            allow_held_key: false,
          });
        }

        // ---- Stream scheduler (timer-driven; the trial ends when the stream does) ----
        const showItem = (i) => {
          if (i >= n) return finish();
          U.paintItem(ctx, items[i], s, imgCache);
          curItem = i;
          inIsi = false;
          const onset = performance.now();
          if (i === 0) streamStart = onset;
          jsPsych.pluginAPI.setTimeout(() => {
            // With no ISI the next item is painted in this same task (paintItem clears the
            // canvas first). Clearing here and painting from a 0 ms timer would let the
            // browser render a blank frame between back-to-back items.
            if (!(isis[i] > 0) && i + 1 < n) {
              lastStimOffset = performance.now();
              actualStimTiming.push(lastStimOffset - onset);
              actualISITiming.push(0);
              showItem(i + 1);
              return;
            }
            // Blank the canvas and record the item's on-time, then wait out the ISI.
            ctx.clearRect(0, 0, s, s);
            inIsi = true;
            lastStimOffset = performance.now();
            actualStimTiming.push(lastStimOffset - onset);
            const isiStart = performance.now();
            jsPsych.pluginAPI.setTimeout(() => {
              actualISITiming.push(performance.now() - isiStart);
              showItem(i + 1);
            }, isis[i]);
          }, durations[i]);
        };

        // ---- Finish ----
        const finish = () => {
          if (kbListener) jsPsych.pluginAPI.cancelKeyboardResponse(kbListener);
          display_element.innerHTML = "";
          // The presented stream in order, with resolved values and requested timing.
          const stimuli_shown = items.map((it, i) => {
            const entry = { position: i, kind: it.kind, spec: specs[i], item_duration: durations[i], isi: isis[i] };
            if (it.kind === "image") entry.src = it.src;
            else if (it.kind === "text") entry.text = it.text;
            else {
              entry.css = it.css;
              // resolveItem doesn't carry .degree; recover it from a numeric (wheel-degree) spec.
              if (typeof specs[i] === "number") entry.degree = U.wrap360(specs[i]);
            }
            return entry;
          });
          // The first response's hold is read from the press log, so nothing delays the
          // stream-timed end of the trial. A key still held at stream end has no release,
          // so its hold is null.
          const pressLog = trial.response_keys ? U.endPressLog() : null;
          const firstKey = responses.length ? responses[0].key : null;
          const firstRow = firstKey && pressLog
            ? pressLog.filter((p) => p.key === String(firstKey).toLowerCase())[0]
            : null;
          const data = {
            stimuli: specs,
            item_duration: durations,
            isi: isis,
            actual_stim_timing: actualStimTiming,
            actual_isi_timing: actualISITiming,
            actual_stim_duration:
              streamStart != null && lastStimOffset != null
                ? Math.round(lastStimOffset - streamStart)
                : null,
            responses: responses,
            rt: responses.length ? responses[0].rt : null,
            response: firstKey,
            ...U.keyHoldData(firstRow ? firstRow.duration : null, firstKey, pressLog),
            stimuli_shown: stimuli_shown,
          };
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
          finishOnce(data);
        };

        // ---- Kick off the stream ----
        showItem(0);
      });
    }
  }
  RsvpPlugin.info = info;

  // ===== module-private helpers =====

  // Expand a timing spec (number or array) to exactly `n` per-item values. A scalar or
  // length-1 array applies to all items; a shorter array is padded with its last value
  // (with a warning) so trailing items do not get undefined, i.e. 0 ms.
  function expand(spec, n) {
    const arr = Array.isArray(spec) ? spec : [spec];
    if (arr.length === 1) return Array(n).fill(arr[0]);
    if (arr.length >= n) return arr.slice(0, n);
    U.warnOnce("rsvp", "a timing array has " + arr.length + " value(s) for " + n +
      " items; padding by repeating the last value (give 1 or " + n + " values to be explicit).");
    const out = arr.slice();
    while (out.length < n) out.push(arr[arr.length - 1]);
    return out;
  }

  return RsvpPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-similarity-triad.js */
/* ===================================================================== */
/*
 * jspsych-similarity-triad.js  --  jsPsych v8 plugin
 *
 * Similarity triad: three items, and the participant clicks the one that is MOST
 * DIFFERENT. The responses feed BradySimilarity, which estimates the similarity
 * structure of a stimulus wheel.
 *
 * Two layouts (`layout`):
 *   "reference" (default) -- a reference item on top, a thin divider, and two
 *       comparison items below. The participant clicks the bottom item that is
 *       MOST DIFFERENT from the reference: a 2-alternative comparison, i.e. the
 *       quad task with a shared reference.
 *   "triangle" -- odd-one-out. Three items sit at the corners of a triangle and
 *       the participant clicks the one MOST DIFFERENT from the other two, which
 *       makes the remaining pair the most-similar pair.
 *
 * Items can be color-wheel degrees (disks), orientations (bars, triangles, Gabor
 * patches or gratings, via `item_shape`), CSS colors, images, or text. Two trial sources:
 *   Fixed    -- pass `stimuli` (3 item specs), shown as given;
 *               is_coverage_trial and model_score are null. Order is
 *               [top/reference, bottom-left, bottom-right] in both layouts.
 *   Adaptive -- pass an `engine` (BradySimilarity.createEngine, one instance
 *               shared across the timeline) and leave `stimuli` empty. The
 *               trial gets its degrees from engine.nextRefTriad ("reference")
 *               or engine.nextTriad ("triangle"), shuffles their screen
 *               positions with the engine's rng, and calls engine.update()
 *               with the displayed degrees before finishing. `adaptive:false`
 *               forces a coverage draw.
 *
 * Stimulus period: an oriented bar (item_shape "line"), a Gabor patch ("gabor")
 * or a grating ("grating") looks the same after a 180-degree turn, so its
 * degrees live in [0,180) and its offsets wrap at 180; disks (hues) and
 * triangles (pointed) use 360 (BradyUtils.shapePeriod). The trial records this
 * as `period`. For an adaptive line/gabor/grating study create the engine with
 * BradySimilarity.createEngine({ period: 180 }); the plugin warns once if the
 * engine's period does not match the shape. Gabors and gratings are achromatic
 * (`grating_options`); with phase "random" each item gets its own phase,
 * recorded in stimuli_shown.
 *
 * Confidence is collected on every trial by default (`collect_confidence`):
 * an inline 4-point word popup anchored to the chosen item, whose x clears
 * the choice so the participant can choose again.
 *
 * The data store exact degrees and signed offsets (in the stimulus period), so
 * a similarity matrix fit to them has the same orientation as memory-error data. What `response` and
 * the offsets mean depends on `layout` (see the data docs below).
 *
 * Click/timer driven, so trial() is synchronous and calls
 * this.jsPsych.finishTrial(data) later (CONVENTIONS.md section 3).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js,
 * similarity-adaptive-utils.js, then this file.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSimilarityTriad = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "similarity-triad",
    version: version,
    parameters: {
      /**
       * The 3 items, [top/reference, bottom-left, bottom-right] in both layouts.
       * Each may be a number (color-wheel degree, or orientation degree when
       * `item_shape` is "line"/"triangle"/"gabor"/"grating"), a CSS color / "lab(...)" string, an
       * image path, or text. Numbers are recorded wrapped into [0, period), so
       * a "line" at 200 is recorded (and drawn) as 20. Leave empty to draw from
       * `engine` instead (adaptive mode).
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Task layout: "reference" (default, reference-on-top 2AFC) or "triangle" (odd-one-out). */
      layout: { type: jspsych.ParameterType.STRING, default: "reference" },
      /** Force interpretation of items: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Item shape: "disk" (default; a numeric item is a color-wheel hue), or "line" /
          "triangle" / "gabor" / "grating" (a numeric item is an orientation in degrees;
          0 = horizontal / pointing right, increasing clockwise). Lines and triangles are
          drawn in `item_color`; Gabors and gratings are achromatic, set by
          `grating_options`, with stripes at d running the same way as a "line" at d.
          "line", "gabor" and "grating" repeat every 180 degrees (period 180); "disk" and
          "triangle" repeat every 360. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Fill color for "line"/"triangle" (orientation/shape) items. Gabors and gratings
          are achromatic and ignore it. */
      item_color: { type: jspsych.ParameterType.STRING, default: "#555555" },
      /**
       * Gabor/grating appearance (item_shape "gabor" or "grating"; ignored otherwise). An
       * object; keys you leave out keep their defaults:
       * cycles (4): grating cycles across the item diameter;
       * contrast (1): Michelson contrast 0..1 around the mean, capped so the sinusoid is not
       * clipped (around a light mean such as the default #dddddd background only ~0.15
       * fits; use background_color "#808080" for full contrast);
       * sigma (0.18): Gaussian envelope SD as a fraction of the item diameter (gabor only);
       * phase (0): cosine phase in degrees at the item centre (0 = a bright stripe through
       * the centre), or "random" for an independent whole-degree phase per item (recorded
       * in stimuli_shown);
       * mean ("background"): the mean gray, "background" to match background_color's
       * luminance so the patch blends into the box, or a CSS color (its luminance is used).
       * Degree d and d + 180 draw the same pattern.
       */
      grating_options: { type: jspsych.ParameterType.OBJECT, default: { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" } },
      /** Color wheel for degree lookups (null = window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * A BradySimilarity engine (BradySimilarity.createEngine(...)), one
       * instance shared across the timeline. Required when `stimuli` is empty:
       * it supplies the next trial and receives the response (engine.update)
       * before the trial finishes. Ignored when `stimuli` is given. With
       * item_shape "line", "gabor" or "grating" create it with { period: 180 }.
       */
      engine: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Engine mode only: true = ask the engine for its next trial, epsilon-greedy: each
          trial is independently a uniform COVERAGE draw with probability epsilon (the
          engine's `epsilon`, default 0.2; a per-trial Bernoulli draw, so the coverage count
          varies), else the most-informative (BALD-selected) trial. false = always force a
          coverage draw. */
      adaptive: { type: jspsych.ParameterType.BOOL, default: true },
      /** Question shown at the top of the box (defaults per layout if left null). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Diameter/side (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Background color of the task box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the task box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the choice, show the inline 4-point word-confidence picker
          anchored to the chosen item (confidence is collected on every trial). */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: true },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },
      /** If > 0, end the trial with a null response after this many ms without a choice. A choice already
          waiting on its confidence rating is allowed to finish. 0 = wait forever. */
      response_timeout: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from when the items appear to the (final) choice click. Null on timeout. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** The task layout used ("reference" or "triangle"). */
      layout: { type: jspsych.ParameterType.STRING },
      /** The item specs as displayed [top, bottom-left, bottom-right] (both layouts). */
      items: { type: jspsych.ParameterType.STRING, array: true },
      /** The wheel/orientation degrees as displayed (integers in [0, period)), or nulls for non-degree items. */
      degrees: { type: jspsych.ParameterType.INT, array: true },
      /** Period (degrees) of the stimulus space that `degrees` and the offsets live in: 180 for
          item_shape "line", "gabor" or "grating" (they look the same rotated 180 degrees),
          360 otherwise (BradyUtils.shapePeriod). */
      period: { type: jspsych.ParameterType.INT },
      /** "reference" layout: the top reference item spec (and its degree in `degrees[0]`). */
      reference: { type: jspsych.ParameterType.STRING },
      /** "reference" layout: the two bottom comparison item specs [left, right]. */
      comparisons: { type: jspsych.ParameterType.STRING, array: true },
      /** Signed wrapped offsets (each wrap(y-x) in (-period/2, period/2]); null unless all three degrees are known.
          "reference": { ab: leftComparison-reference, ac: rightComparison-reference }.
          "triangle":  { ab, ac, bc } between the three displayed items. */
      item_offsets: { type: jspsych.ParameterType.OBJECT },
      /** The chosen index. "reference": 0 = bottom-left, 1 = bottom-right (the item judged MOST
          DIFFERENT from the reference); the engine gets it as is (engine.update("reftriad",
          spec, response), 0 = comparisons[0] more different). "triangle": 0..2 (display order)
          of the odd item. The engine's triad outcome is the most-similar pair, indexed
          0 = AB, 1 = AC, 2 = BC over the displayed [A, B, C], so the engine gets 2 - odd
          (engine.update("triad", spec, 2 - response)): odd 0 -> BC (2), 1 -> AC (1),
          2 -> AB (0). Null on timeout (the engine is not updated). */
      response: { type: jspsych.ParameterType.INT },
      /** "triangle" layout only: the remaining, most-similar pair ([i, j] display indices). Null otherwise/on timeout. */
      chosen_pair: { type: jspsych.ParameterType.INT, array: true },
      /** Confidence rating 1..N, N = number of confidence_labels (default 4: 1 = Guess ... 4 = Certain). Null when not collected or on timeout. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the choice to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click. Null when not collected or not measurable. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Engine mode: true if this trial was a coverage draw (the per-trial probability-epsilon draw, or adaptive:false), false if BALD-selected. Null in fixed designs. */
      is_coverage_trial: { type: jspsych.ParameterType.BOOL },
      /** Engine mode: the BALD information score of the selected trial (null on coverage draws and in fixed designs). */
      model_score: { type: jspsych.ParameterType.FLOAT },
      /** One entry per displayed item, display order: kind plus value/src/text, and `degree` (in [0, period)) when the spec is a number. Gabor/grating items also carry `phase`, the grating phase (deg) the item was drawn with. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SimilarityTriadPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      U.checkParams(trial, {
        plugin: "similarity-triad",
        enums: { item_type: ["auto", "color", "image", "text"], layout: ["reference", "triangle"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] },
        nonneg: ["response_timeout"],
      });

      const sz = trial.item_size;
      const shape = trial.item_shape;
      const period = stimulusPeriod(shape);
      const isShape = (it) => (shape === "line" || shape === "triangle" || U.isGratingShape(shape)) && it.kind !== "image" && it.kind !== "text";
      // Gabor / grating appearance (achromatic; null for the other shapes).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "similarity-triad", background: trial.background_color })
        : null;
      // Per-item paint options: an oriented shape drawn at the recorded degree (so the
      // screen shows exactly what `degrees` says), or the disk/square path.
      // Gabors/gratings also get the resolved options with this item's phase.
      const paintOpts = (it, deg, phase) => isShape(it)
        ? { shape: shape, orientation: deg != null ? deg : 0, color: trial.item_color,
          grating: grating ? Object.assign({}, grating, { phase: phase || 0 }) : null }
        : { circle: it.kind === "color" };
      // Item outline: round for color disks and Gabors/gratings; no visible outline around a
      // Gabor/grating, so it blends into the background.
      const roundCss = (it) => ((it.kind === "color" && (shape === "disk" || (grating && isShape(it)))) ? "border-radius:50%;" : "") +
        "border:1px solid " + (grating && isShape(it) ? "transparent" : "#222");
      const phasesFor = (items, src) => itemPhases(items, grating, isShape, src, trial);

      if (trial.layout === "triangle") {
        this.trialTriangle(display_element, trial, jsPsych, wheel, forceType, sz, paintOpts, roundCss, period, phasesFor);
      } else {
        this.trialReference(display_element, trial, jsPsych, wheel, forceType, sz, paintOpts, roundCss, period, phasesFor);
      }
    }

    // ---- "reference" layout: reference on top, two comparisons below --------
    trialReference(display_element, trial, jsPsych, wheel, forceType, sz, paintOpts, roundCss, period, phasesFor) {
      const src = resolveRefSource(jsPsych, trial, "similarity-triad", period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, "similarity-triad", period); return; }
      const specs = src.specs;       // [reference, bottom-left, bottom-right]
      const degrees = src.degrees;   // display-order degrees (or nulls)
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const phases = phasesFor(items, src); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt, reference on top, divider, two below -------
      const promptH = 48;
      const gap = Math.max(40, Math.round(sz * 0.5));   // gap between the two bottom items
      const sideMargin = 24;                             // margin from the box edge
      const W = Math.max(2 * sz + gap + 2 * sideMargin, 320);
      const topY = promptH + 12;
      const dividerY = topY + sz + 16;
      const bottomY = dividerY + 16;
      const H = bottomY + sz + 16;
      const refX = W / 2 - sz / 2;
      const bottomX = [W / 2 - gap / 2 - sz, W / 2 + gap / 2]; // [left, right]
      const prompt = trial.prompt != null ? trial.prompt : "Click the item below that is MOST DIFFERENT from the item on top.";

      let html =
        `<div id="simt-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="simt-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${prompt || ""}</div>` +
        // reference (top) -- NOT clickable
        `<canvas id="simt-ref" width="${sz}" height="${sz}" ` +
        `style="position:absolute;left:${refX}px;top:${topY}px;${roundCss(items[0])}"></canvas>` +
        // thin horizontal divider separating the reference from the two comparisons
        `<div style="position:absolute;left:${sideMargin}px;top:${dividerY}px;width:${W - 2 * sideMargin}px;` +
        `height:1px;background:#999"></div>`;
      // the two bottom comparison items (clickable)
      for (let i = 0; i < 2; i++) {
        html +=
          `<canvas id="simt-opt-${i}" data-pos="${i}" width="${sz}" height="${sz}" ` +
          `style="position:absolute;left:${bottomX[i]}px;top:${bottomY}px;${roundCss(items[i + 1])};cursor:pointer"></canvas>`;
      }
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#simt-box");
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Paint (preload any image items first; trial() stays synchronous) --
      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        U.paintItem(display_element.querySelector("#simt-ref").getContext("2d"), items[0], sz, imgCache, paintOpts(items[0], degrees[0], phases[0]));
        for (let i = 0; i < 2; i++) {
          const cv = display_element.querySelector(`#simt-opt-${i}`);
          U.paintItem(cv.getContext("2d"), items[i + 1], sz, imgCache, paintOpts(items[i + 1], degrees[i + 1], phases[i + 1]));
        }
        onset = performance.now();
      });

      // ---- Response (choose bottom-left = 0 or bottom-right = 1) -------------
      let responded = false, committed = false;
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (which) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#simt-opt-${which}`);
          const t0 = performance.now();
          U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              const cHold = U.mouseHoldDuration(); // the confidence click is its own press
              if (conf == null) { // x: clear the choice (and end the trial if the timeout already passed)
                responded = false;
                if (timedOut && !committed) { committed = true; finish(null, null); }
                return;
              }
              confidence = conf;
              confRt = Math.round(performance.now() - t0);
              confHold = cHold;
              commit(which, rt, hold);
            });
          return;
        }
        commit(which, rt, hold);
      };
      for (let i = 0; i < 2; i++) {
        display_element.querySelector(`#simt-opt-${i}`).addEventListener("click", () => choose(i));
      }

      const commit = (which, rt, hold) => {
        if (committed) return;
        committed = true;
        // which (0 = left, 1 = right) is the comparison judged more different from
        // the reference, which is the reftriad response coding (comparisons[which]).
        if (src.engineSpec) trial.engine.update("reftriad", src.engineSpec, which);
        finish(which, rt, hold);
      };

      const finish = (which, rt, hold) => {
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          layout: "reference",
          items: specs.map(toStr),
          degrees: degrees.slice(),
          period: period,
          reference: toStr(specs[0]),
          comparisons: [toStr(specs[1]), toStr(specs[2])],
          item_offsets: degreesKnown
            ? { ab: offsetDeg(degrees[1], degrees[0], period), ac: offsetDeg(degrees[2], degrees[0], period) }
            : null,
          response: which,
          chosen_pair: null,
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          is_coverage_trial: src.engineSpec ? src.engineSpec.isCoverage : null,
          model_score: src.score != null ? src.score : null,
          stimuli_shown: items.map((it, i) => shownRecord(it, specs[i], period, phases[i])),
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data);
        jsPsych.finishTrial(data);
      };

      if (trial.response_timeout > 0) {
        jsPsych.pluginAPI.setTimeout(() => {
          if (committed) return;
          // A choice is waiting on its confidence rating: let it finish. If the
          // participant clears it with x instead, the trial ends there.
          if (responded) { timedOut = true; return; }
          responded = true; committed = true;
          finish(null, null);
        },
          trial.response_timeout);
      }
    }

    // ---- "triangle" layout: odd-one-out --------------------------------------
    trialTriangle(display_element, trial, jsPsych, wheel, forceType, sz, paintOpts, roundCss, period, phasesFor) {
      const src = resolveTrialSource(jsPsych, trial, "similarity-triad", 3, (engine, force) =>
        engine.nextTriad({ forceCoverage: force }), period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, "similarity-triad", period); return; }
      const specs = src.specs;
      const degrees = src.degrees;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const phases = phasesFor(items, src); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt band on top, 3 items on an upright triangle -
      const ringR = Math.round(1.15 * sz);
      const promptH = 48;
      const W = Math.max(2 * ringR + sz + 40, 320);
      const cy = promptH + ringR + sz / 2 + 10;
      const H = cy + ringR + sz / 2 + 16;
      const angles = [-90, 150, 30]; // display order [top, bottom-left, bottom-right]
      const prompt = trial.prompt != null ? trial.prompt : "Click the item that is MOST DIFFERENT from the other two.";
      let html =
        `<div id="simt-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="simt-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${prompt || ""}</div>`;
      for (let i = 0; i < 3; i++) {
        const a = (angles[i] * Math.PI) / 180;
        const x = W / 2 + ringR * Math.cos(a) - sz / 2;
        const y = cy + ringR * Math.sin(a) - sz / 2;
        html +=
          `<canvas id="simt-opt-${i}" data-pos="${i}" width="${sz}" height="${sz}" ` +
          `style="position:absolute;left:${x}px;top:${y}px;${roundCss(items[i])};cursor:pointer"></canvas>`;
      }
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#simt-box");
      if (trial.auto_zoom) U.autoZoom(box);

      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        for (let i = 0; i < 3; i++) {
          const cv = display_element.querySelector(`#simt-opt-${i}`);
          U.paintItem(cv.getContext("2d"), items[i], sz, imgCache, paintOpts(items[i], degrees[i], phases[i]));
        }
        onset = performance.now();
      });

      let responded = false, committed = false;
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (odd) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#simt-opt-${odd}`);
          const t0 = performance.now();
          U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              const cHold = U.mouseHoldDuration(); // the confidence click is its own press
              if (conf == null) { // x: clear the choice (and end the trial if the timeout already passed)
                responded = false;
                if (timedOut && !committed) { committed = true; finish(null, null); }
                return;
              }
              confidence = conf;
              confRt = Math.round(performance.now() - t0);
              confHold = cHold;
              commit(odd, rt, hold);
            });
          return;
        }
        commit(odd, rt, hold);
      };
      for (let i = 0; i < 3; i++) {
        display_element.querySelector(`#simt-opt-${i}`).addEventListener("click", () => choose(i));
      }

      const commit = (odd, rt, hold) => {
        if (committed) return;
        committed = true;
        if (src.engineSpec) {
          // odd item -> index of the remaining (most-similar) pair in
          // [AB, AC, BC], display order: odd 0 -> BC (2), 1 -> AC (1), 2 -> AB (0).
          trial.engine.update("triad", src.engineSpec, 2 - odd);
        }
        finish(odd, rt, hold);
      };

      const finish = (odd, rt, hold) => {
        const pair = odd == null ? null : [0, 1, 2].filter((i) => i !== odd);
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          layout: "triangle",
          items: specs.map(toStr),
          degrees: degrees.slice(),
          period: period,
          reference: null,
          comparisons: null,
          item_offsets: degreesKnown
            ? {
              ab: offsetDeg(degrees[1], degrees[0], period),
              ac: offsetDeg(degrees[2], degrees[0], period),
              bc: offsetDeg(degrees[2], degrees[1], period),
            }
            : null,
          response: odd,
          chosen_pair: pair,
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          is_coverage_trial: src.engineSpec ? src.engineSpec.isCoverage : null,
          model_score: src.score != null ? src.score : null,
          stimuli_shown: items.map((it, i) => shownRecord(it, specs[i], period, phases[i])),
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data);
        jsPsych.finishTrial(data);
      };

      if (trial.response_timeout > 0) {
        jsPsych.pluginAPI.setTimeout(() => {
          if (committed) return;
          // A choice is waiting on its confidence rating: let it finish. If the
          // participant clears it with x instead, the trial ends there.
          if (responded) { timedOut = true; return; }
          responded = true; committed = true;
          finish(null, null);
        },
          trial.response_timeout);
      }
    }
  }
  SimilarityTriadPlugin.info = info;

  // ===== module-private helpers. toStr/shownRecord and the period helpers are
  // copied in each similarity plugin so each file stands alone. =====
  function toStr(s) { return s == null ? null : String(s); }
  /* Period (degrees) of the stimulus space for an item_shape: the shared rule
     BradyUtils.shapePeriod. An unpointed bar ("line"), a Gabor or a grating looks the
     same after a 180-degree turn; hues ("disk") and pointed shapes ("triangle")
     repeat every 360. */
  function stimulusPeriod(shape) { return U.shapePeriod(shape); }
  /* Degree -> [0, period). Period 360 is U.wrap360. */
  function wrapDeg(v, period) { return period === 180 ? ((v % 180) + 180) % 180 : U.wrap360(v); }
  /* Signed a - b in (-period/2, period/2]. Period 360 matches U.angleDiff. */
  function offsetDeg(a, b, period) { const d = wrapDeg(a - b, period); return d > period / 2 ? d - period : d; }
  /* A numeric spec's recorded degree: rounded, wrapped into [0, period). */
  function specDegree(s, period) { return typeof s === "number" ? wrapDeg(Math.round(s), period) : null; }
  /* Warn once when the engine's period does not match the stimulus period. The
     engine is used as given; the data still record degrees in the stimulus period. */
  function checkEnginePeriod(plugin, eng, shape, period) {
    const ep = eng.period != null ? eng.period : 360;
    if (ep === period) return;
    if (period === 180) {
      U.warnOnce(plugin, "item_shape \"" + shape + "\" repeats every 180 degrees; create the engine with {period: 180} " +
        "(this engine has period " + ep + ", so it treats 0 and 180 as maximally different).");
    } else {
      U.warnOnce(plugin, "the engine has period " + ep + " but item_shape \"" + shape + "\" repeats every 360 degrees; " +
        "use {period: 180} with item_shape line/gabor/grating.");
    }
  }
  /* Shuffled copy of `arr`, drawn from the engine's rng (engine.shuffle) so a
     seeded engine also reproduces the layout; jsPsych's shuffle otherwise. */
  function engineShuffle(jsPsych, eng, arr) {
    return typeof eng.shuffle === "function" ? eng.shuffle(arr) : jsPsych.randomization.shuffle(arr.slice());
  }
  function shownRecord(item, spec, period, phase) {
    const rec = { kind: item.kind, degree: specDegree(spec, period) };
    if (item.kind === "image") rec.src = item.src;
    else if (item.kind === "text") rec.text = item.text;
    else rec.value = spec;
    if (phase != null) rec.phase = phase; // Gabor/grating: the phase it was drawn with
    return rec;
  }
  /* Grating phase per displayed item (null for an item not drawn as a Gabor/grating).
     Random phases come from the engine's rng when the engine supplied the trial, so a
     seeded engine reproduces them, and otherwise from Math.random (which
     jsPsych.randomization.setSeed seeds). */
  function itemPhases(items, grating, isShape, src, trial) {
    const eng = src && src.engineSpec ? trial.engine : null;
    const rng = eng && typeof eng.rng === "function" ? eng.rng : undefined;
    return items.map((it) => (grating && isShape(it) ? U.gratingPhase(grating, rng) : null));
  }
  /*
   * "reference" layout source. Fixed: trial.stimuli has >= 3 specs, order
   * [reference, bottom-left, bottom-right], shown as given (engineSpec null).
   * Engine: no stimuli + trial.engine -> engine.nextRefTriad (forceCoverage
   * when adaptive is false). The two comparisons are shuffled left/right (engine
   * rng) and engineSpec.comparisons follows the displayed order, so the clicked
   * index goes straight into engine.update("reftriad", ...). engineSpec keeps
   * the engine's own degrees; specs/degrees are wrapped into the stimulus
   * period (a no-op when the periods match). Null on a bad config.
   */
  function resolveRefSource(jsPsych, trial, plugin, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= 3) {
      if (stim.length > 3) U.warnOnce(plugin, "stimuli has " + stim.length + " entries but this task uses exactly 3; the extras are ignored.");
      if (trial.engine) U.warnOnce(plugin, "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, 3);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce(plugin, "stimuli has only " + stim.length + " entr" + (stim.length === 1 ? "y" : "ies") + " but this task needs 3 (or none plus an `engine`). The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function" || typeof eng.nextRefTriad !== "function") {
      U.warnOnce(plugin, "no stimuli and no usable engine -- pass `stimuli` (3 item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod(plugin, eng, trial.item_shape, period);
    const sel = eng.nextRefTriad({ forceCoverage: !trial.adaptive });
    const cmp = engineShuffle(jsPsych, eng, sel.comparisons); // [left, right] display order
    const engDegs = [sel.ref, cmp[0], cmp[1]];
    const shown = engDegs.map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { ref: sel.ref, comparisons: [cmp[0], cmp[1]], degrees: engDegs, isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  /*
   * "triangle" layout source. Fixed: trial.stimuli has >= 3 specs, shown as
   * given. Engine: engine.nextTriad, then shuffle the display order (engine
   * rng) so the engine's item roles (anchor, +d1, -d2) never sit at a fixed
   * screen position. The shuffled engine degrees are the engineSpec; specs/
   * degrees are the same values wrapped into the stimulus period.
   * Null on a bad config.
   */
  function resolveTrialSource(jsPsych, trial, plugin, n, nextFn, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= n) {
      if (stim.length > n) U.warnOnce(plugin, "stimuli has " + stim.length + " entries but this task uses exactly " + n + "; the extras are ignored.");
      if (trial.engine) U.warnOnce(plugin, "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, n);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce(plugin, "stimuli has only " + stim.length + " entr" + (stim.length === 1 ? "y" : "ies") + " but this task needs " + n + " (or none plus an `engine`). The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function") {
      U.warnOnce(plugin, "no stimuli and no engine -- pass `stimuli` (" + n + " item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod(plugin, eng, trial.item_shape, period);
    const sel = nextFn(eng, !trial.adaptive);
    const engDegs = engineShuffle(jsPsych, eng, sel.degrees);
    const shown = engDegs.map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { degrees: engDegs, isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  /* End an invalid-config trial at once with a message and an all-null data
     record (every documented field present), so a bad timeline entry can't
     hang the study. */
  function finishInvalid(jsPsych, display_element, trial, plugin, period) {
    display_element.innerHTML =
      "<p style='color:#a00'>" + plugin + ": no items to show (see the console warning).</p>";
    const data = {
      rt: null, mouse_hold_duration: null, layout: trial.layout || "reference", items: [], degrees: [], period: period,
      reference: null, comparisons: null,
      item_offsets: null, response: null, chosen_pair: null, confidence: null, rt_confidence: null,
      confidence_mouse_hold_duration: null,
      is_coverage_trial: null, model_score: null, stimuli_shown: [],
    };
    data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
    if (trial.data) Object.assign(data, trial.data);
    jsPsych.finishTrial(data);
  }

  return SimilarityTriadPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-similarity-quad.js */
/* ===================================================================== */
/*
 * jspsych-similarity-quad.js  --  jsPsych v8 plugin
 *
 * Similarity quad (pair comparison): two pairs of items side by side. The
 * participant clicks the pair that is MOST DIFFERENT, i.e. whose two items are
 * least similar to each other. The responses feed BradySimilarity, which
 * estimates the similarity structure of a stimulus wheel.
 *
 * Items can be color-wheel degrees (disks), orientations (bars, triangles, Gabor
 * patches or gratings, via `item_shape`), CSS colors, images, or text. Two trial sources:
 *   Fixed    -- pass `stimuli` (4 item specs: [pair1a, pair1b, pair2a, pair2b]);
 *               is_coverage_trial and model_score are null.
 *   Adaptive -- pass an `engine` (BradySimilarity.createEngine, one instance
 *               shared across the timeline) and leave `stimuli` empty. The
 *               trial gets its degrees from engine.nextQuad, randomizes which
 *               pair is left/right and each pair's top/bottom order (engine
 *               rng), and calls engine.update() with the displayed degrees
 *               before finishing. `adaptive:false` forces a coverage draw.
 *
 * Stimulus period: an oriented bar (item_shape "line"), a Gabor patch ("gabor")
 * or a grating ("grating") looks the same after a 180-degree turn, so its
 * degrees live in [0,180) and its offsets wrap at 180; disks (hues) and
 * triangles (pointed) use 360 (BradyUtils.shapePeriod). The trial records this
 * as `period`. For an adaptive line/gabor/grating study create the engine with
 * BradySimilarity.createEngine({ period: 180 }); the plugin warns once if the
 * engine's period does not match the shape. Gabors and gratings are achromatic
 * (`grating_options`); with phase "random" each item gets its own phase,
 * recorded in stimuli_shown.
 *
 * Confidence is collected on every trial by default (`collect_confidence`):
 * an inline 4-point word popup anchored to the chosen pair, whose x clears
 * the choice so the participant can choose again.
 *
 * The data store exact degrees and signed pair offsets (`pair_offsets`, in the
 * stimulus period), so a similarity matrix fit to them has the same orientation
 * as memory-error data.
 *
 * Click/timer driven, so trial() is synchronous and calls
 * this.jsPsych.finishTrial(data) later (CONVENTIONS.md section 3).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js,
 * similarity-adaptive-utils.js, then this file.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSimilarityQuad = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "similarity-quad",
    version: version,
    parameters: {
      /**
       * The 4 items as [pair1-top, pair1-bottom, pair2-top, pair2-bottom]; pair1
       * is shown on the left. Each may be a number (color-wheel degree, or
       * orientation degree when `item_shape` is "line"/"triangle"/"gabor"/"grating"), a CSS color /
       * "lab(...)" string, an image path, or text. Numbers are recorded wrapped
       * into [0, period), so a "line" at 200 is recorded (and drawn) as 20. Leave
       * empty to draw the quad from `engine` instead (adaptive mode).
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of items: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Item shape: "disk" (default; a numeric item is a color-wheel hue), or "line" /
          "triangle" / "gabor" / "grating" (a numeric item is an orientation in degrees;
          0 = horizontal / pointing right, increasing clockwise). Lines and triangles are
          drawn in `item_color`; Gabors and gratings are achromatic, set by
          `grating_options`, with stripes at d running the same way as a "line" at d.
          "line", "gabor" and "grating" repeat every 180 degrees (period 180); "disk" and
          "triangle" repeat every 360. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Fill color for "line"/"triangle" (orientation/shape) items. Gabors and gratings
          are achromatic and ignore it. */
      item_color: { type: jspsych.ParameterType.STRING, default: "#555555" },
      /**
       * Gabor/grating appearance (item_shape "gabor" or "grating"; ignored otherwise). An
       * object; keys you leave out keep their defaults:
       * cycles (4): grating cycles across the item diameter;
       * contrast (1): Michelson contrast 0..1 around the mean, capped so the sinusoid is not
       * clipped (around a light mean such as the default #dddddd background only ~0.15
       * fits; use background_color "#808080" for full contrast);
       * sigma (0.18): Gaussian envelope SD as a fraction of the item diameter (gabor only);
       * phase (0): cosine phase in degrees at the item centre (0 = a bright stripe through
       * the centre), or "random" for an independent whole-degree phase per item (recorded
       * in stimuli_shown);
       * mean ("background"): the mean gray, "background" to match background_color's
       * luminance so the patch blends into the box, or a CSS color (its luminance is used).
       * Degree d and d + 180 draw the same pattern.
       */
      grating_options: { type: jspsych.ParameterType.OBJECT, default: { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" } },
      /** Color wheel for degree lookups (null = window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * A BradySimilarity engine (BradySimilarity.createEngine(...)), one
       * instance shared across the timeline. Required when `stimuli` is empty:
       * it supplies the next quad (nextQuad) and receives the response
       * (engine.update) before the trial finishes. Ignored when `stimuli` is given.
       * With item_shape "line", "gabor" or "grating" create it with { period: 180 }.
       */
      engine: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Engine mode only: true = ask the engine for its next quad, epsilon-greedy: each
          trial is independently a uniform COVERAGE draw with probability epsilon (the
          engine's `epsilon`, default 0.2; a per-trial Bernoulli draw, so the coverage count
          varies), else the most-informative (BALD-selected) quad. false = always force a
          coverage draw. */
      adaptive: { type: jspsych.ParameterType.BOOL, default: true },
      /** Question shown at the top of the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: "Which PAIR is most DIFFERENT? Click it." },
      /** Diameter/side (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Background color of the task box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the task box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the choice, show the inline 4-point word-confidence picker
          anchored to the chosen pair (confidence is collected on every trial). */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: true },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },
      /** If > 0, end the trial with a null response after this many ms without a choice. A choice already
          waiting on its confidence rating is allowed to finish. 0 = wait forever. */
      response_timeout: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from when the pairs appear to the (final) choice click. Null on timeout. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** The left pair's 2 item specs as displayed [top, bottom]. */
      pair1: { type: jspsych.ParameterType.STRING, array: true },
      /** The right pair's 2 item specs as displayed [top, bottom]. */
      pair2: { type: jspsych.ParameterType.STRING, array: true },
      /** The 4 wheel/orientation degrees as displayed [pair1-top, pair1-bottom, pair2-top, pair2-bottom] (integers in [0, period)), or nulls for non-degree items. */
      degrees: { type: jspsych.ParameterType.INT, array: true },
      /** Period (degrees) of the stimulus space that `degrees` and the offsets live in: 180 for
          item_shape "line", "gabor" or "grating" (they look the same rotated 180 degrees),
          360 otherwise (BradyUtils.shapePeriod). */
      period: { type: jspsych.ParameterType.INT },
      /** Signed wrapped within-pair offsets [wrap(p1b-p1a), wrap(p2b-p2a)] in (-period/2, period/2]; null unless all four degrees are known. */
      pair_offsets: { type: jspsych.ParameterType.INT, array: true },
      /** Which pair was clicked as MOST DIFFERENT: 0 = left (pair1), 1 = right (pair2). Null on timeout.
          The engine's quad outcome is the more-similar pair, so engine.update gets 1 - response. */
      response: { type: jspsych.ParameterType.INT },
      /** The chosen (most-different) pair's 2 item specs. Null on timeout. */
      chosen_pair_items: { type: jspsych.ParameterType.STRING, array: true },
      /** Confidence rating 1..N, N = number of confidence_labels (default 4: 1 = Guess ... 4 = Certain). Null when not collected or on timeout. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the choice to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click. Null when not collected or not measurable. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Engine mode: true if this trial was a coverage draw (the per-trial probability-epsilon draw, or adaptive:false), false if BALD-selected. Null in fixed designs. */
      is_coverage_trial: { type: jspsych.ParameterType.BOOL },
      /** Engine mode: the BALD information score of the selected quad (null on coverage draws and in fixed designs). */
      model_score: { type: jspsych.ParameterType.FLOAT },
      /** One entry per displayed item, in `degrees` order: kind plus value/src/text, and `degree` (in [0, period)) when the spec is a number. Gabor/grating items also carry `phase`, the grating phase (deg) the item was drawn with. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SimilarityQuadPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      U.checkParams(trial, {
        plugin: "similarity-quad",
        enums: { item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] },
        nonneg: ["response_timeout"],
      });

      // ---- Trial source: fixed `stimuli` (4 specs) OR the adaptive engine ----
      const period = stimulusPeriod(trial.item_shape);
      const src = resolveQuadSource(jsPsych, trial, period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, period); return; }
      const specs = src.specs;     // [p1a, p1b, p2a, p2b] in display order
      const degrees = src.degrees;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const shape = trial.item_shape;
      const isShape = (it) => (shape === "line" || shape === "triangle" || U.isGratingShape(shape)) && it.kind !== "image" && it.kind !== "text";
      // Gabor / grating appearance (achromatic; null for the other shapes).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "similarity-quad", background: trial.background_color })
        : null;
      // Per-item paint options: an oriented shape drawn at the recorded degree (so the
      // screen shows exactly what `degrees` says), or the disk/square path.
      // Gabors/gratings also get the resolved options with this item's phase.
      const paintOpts = (it, deg, phase) => isShape(it)
        ? { shape: shape, orientation: deg != null ? deg : 0, color: trial.item_color,
          grating: grating ? Object.assign({}, grating, { phase: phase || 0 }) : null }
        : { circle: it.kind === "color" };
      const phases = itemPhases(items, grating, isShape, src, trial); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt band on top, two bordered pair sub-boxes ----
      const sz = trial.item_size;
      const promptH = 48;
      const labelH = 20, gapIn = 18, padIn = 16;           // label height, gap between the two items, sub-box padding
      const pw = sz + 2 * padIn;                           // pair sub-box width
      const ph = labelH + 2 * sz + gapIn + 2 * padIn;      // pair sub-box height
      const gapBetween = Math.max(40, Math.round(sz * 0.5));
      const W = Math.max(2 * pw + gapBetween + 48, 320);
      const H = promptH + ph + 26;
      const leftX = [W / 2 - gapBetween / 2 - pw, W / 2 + gapBetween / 2];
      let html =
        `<div id="simq-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="simq-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${trial.prompt || ""}</div>`;
      for (let p = 0; p < 2; p++) {
        html +=
          `<div id="simq-pair-${p}" data-idx="${p}" style="position:absolute;left:${leftX[p]}px;top:${promptH}px;` +
          `width:${pw}px;height:${ph}px;box-sizing:border-box;border:2px solid #666;border-radius:8px;` +
          `padding:${padIn}px;cursor:pointer;background:rgba(255,255,255,.25)">` +
          `<div style="height:${labelH}px;line-height:${labelH}px;text-align:center;font-size:12px;color:#555;pointer-events:none">Pair ${p + 1}</div>`;
        for (let j = 0; j < 2; j++) {
          const i = p * 2 + j;
          const round = (items[i].kind === "color" && (shape === "disk" || (grating && isShape(items[i])))) ? "border-radius:50%;" : "";
          const edge = grating && isShape(items[i]) ? "transparent" : "#222"; // no outline around a Gabor
          html +=
            `<canvas id="simq-cv-${i}" width="${sz}" height="${sz}" style="display:block;margin:${j === 0 ? 0 : gapIn}px auto 0;` +
            `${round}border:1px solid ${edge};pointer-events:none"></canvas>`;
        }
        html += "</div>";
      }
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#simq-box");
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Paint (preload any image items first; trial() stays synchronous) ----
      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        for (let i = 0; i < 4; i++) {
          const cv = display_element.querySelector(`#simq-cv-${i}`);
          U.paintItem(cv.getContext("2d"), items[i], sz, imgCache, paintOpts(items[i], degrees[i], phases[i]));
        }
        onset = performance.now();
      });

      // ---- Response ----------------------------------------------------------
      let responded = false;
      let committed = false; // guards finishTrial/engine.update against any double fire
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (which) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#simq-pair-${which}`);
          const t0 = performance.now();
          U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              const cHold = U.mouseHoldDuration(); // the confidence click is its own press
              if (conf == null) { // x: clear the choice (and end the trial if the timeout already passed)
                responded = false;
                if (timedOut && !committed) { committed = true; finish(null, null); }
                return;
              }
              confidence = conf;
              confRt = Math.round(performance.now() - t0);
              confHold = cHold;
              commit(which, rt, hold);
            });
          return;
        }
        commit(which, rt, hold);
      };
      for (let p = 0; p < 2; p++) {
        display_element.querySelector(`#simq-pair-${p}`).addEventListener("click", () => choose(p));
      }

      // ---- Commit: update the engine, then finish ---------------------------
      const commit = (which, rt, hold) => {
        if (committed) return;
        committed = true;
        // `which` is the pair clicked as most different. The engine's quad
        // outcome is the more-similar pair, so it gets 1 - which; the data
        // `response` keeps `which`.
        if (src.engineSpec) trial.engine.update("quad", src.engineSpec, 1 - which);
        finish(which, rt, hold);
      };

      const finish = (which, rt, hold) => {
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          pair1: [toStr(specs[0]), toStr(specs[1])],
          pair2: [toStr(specs[2]), toStr(specs[3])],
          degrees: degrees.slice(),
          period: period,
          pair_offsets: degreesKnown
            ? [offsetDeg(degrees[1], degrees[0], period), offsetDeg(degrees[3], degrees[2], period)]
            : null,
          response: which,
          chosen_pair_items: which == null ? null : [toStr(specs[which * 2]), toStr(specs[which * 2 + 1])],
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          is_coverage_trial: src.engineSpec ? src.engineSpec.isCoverage : null,
          model_score: src.score != null ? src.score : null,
          stimuli_shown: items.map((it, i) => shownRecord(it, specs[i], period, phases[i])),
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // experimenter fields win on collision
        jsPsych.finishTrial(data);
      };

      // ---- Optional response timeout -----------------------------------------
      if (trial.response_timeout > 0) {
        jsPsych.pluginAPI.setTimeout(() => {
          if (committed) return;
          // A choice is waiting on its confidence rating: let it finish. If the
          // participant clears it with x instead, the trial ends there.
          if (responded) { timedOut = true; return; }
          responded = true; committed = true;
          finish(null, null);
        },
          trial.response_timeout);
      }
    }
  }
  SimilarityQuadPlugin.info = info;

  // ===== module-private helpers =====
  function toStr(s) { return s == null ? null : String(s); }
  /* Period (degrees) of the stimulus space for an item_shape: the shared rule
     BradyUtils.shapePeriod. An unpointed bar ("line"), a Gabor or a grating looks the
     same after a 180-degree turn; hues ("disk") and pointed shapes ("triangle")
     repeat every 360. */
  function stimulusPeriod(shape) { return U.shapePeriod(shape); }
  /* Degree -> [0, period). Period 360 is U.wrap360. */
  function wrapDeg(v, period) { return period === 180 ? ((v % 180) + 180) % 180 : U.wrap360(v); }
  /* Signed a - b in (-period/2, period/2]. Period 360 matches U.angleDiff. */
  function offsetDeg(a, b, period) { const d = wrapDeg(a - b, period); return d > period / 2 ? d - period : d; }
  /* A numeric spec's recorded degree: rounded, wrapped into [0, period). */
  function specDegree(s, period) { return typeof s === "number" ? wrapDeg(Math.round(s), period) : null; }
  /* Warn once when the engine's period does not match the stimulus period. The
     engine is used as given; the data still record degrees in the stimulus period. */
  function checkEnginePeriod(plugin, eng, shape, period) {
    const ep = eng.period != null ? eng.period : 360;
    if (ep === period) return;
    if (period === 180) {
      U.warnOnce(plugin, "item_shape \"" + shape + "\" repeats every 180 degrees; create the engine with {period: 180} " +
        "(this engine has period " + ep + ", so it treats 0 and 180 as maximally different).");
    } else {
      U.warnOnce(plugin, "the engine has period " + ep + " but item_shape \"" + shape + "\" repeats every 360 degrees; " +
        "use {period: 180} with item_shape line/gabor/grating.");
    }
  }
  /* Shuffled copy of `arr`, drawn from the engine's rng (engine.shuffle) so a
     seeded engine also reproduces the layout; jsPsych's shuffle otherwise. */
  function engineShuffle(jsPsych, eng, arr) {
    return typeof eng.shuffle === "function" ? eng.shuffle(arr) : jsPsych.randomization.shuffle(arr.slice());
  }
  function shownRecord(item, spec, period, phase) {
    const rec = { kind: item.kind, degree: specDegree(spec, period) };
    if (item.kind === "image") rec.src = item.src;
    else if (item.kind === "text") rec.text = item.text;
    else rec.value = spec;
    if (phase != null) rec.phase = phase; // Gabor/grating: the phase it was drawn with
    return rec;
  }
  /* Grating phase per displayed item (null for an item not drawn as a Gabor/grating).
     Random phases come from the engine's rng when the engine supplied the trial, so a
     seeded engine reproduces them, and otherwise from Math.random (which
     jsPsych.randomization.setSeed seeds). */
  function itemPhases(items, grating, isShape, src, trial) {
    const eng = src && src.engineSpec ? trial.engine : null;
    const rng = eng && typeof eng.rng === "function" ? eng.rng : undefined;
    return items.map((it) => (grating && isShape(it) ? U.gratingPhase(grating, rng) : null));
  }
  /*
   * Fixed: stimuli >= 4 -> [p1a, p1b, p2a, p2b] as given.
   * Engine: nextQuad() (forceCoverage when adaptive:false). The pairs are
   * randomly assigned left/right and each pair's items randomly ordered top/
   * bottom (engine rng); engineSpec holds the displayed arrangement in the
   * engine's degrees, so pair index 0 is the left pair as shown. specs/degrees
   * are the same values wrapped into the stimulus period.
   */
  function resolveQuadSource(jsPsych, trial, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= 4) {
      if (stim.length > 4) U.warnOnce("similarity-quad", "stimuli has " + stim.length + " entries but this task uses exactly 4; the extras are ignored.");
      if (trial.engine) U.warnOnce("similarity-quad", "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, 4);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce("similarity-quad", "stimuli has only " + stim.length + " entr" + (stim.length === 1 ? "y" : "ies") + " but this task needs 4 ([pair1a, pair1b, pair2a, pair2b]), or none plus an `engine`. The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function") {
      U.warnOnce("similarity-quad", "no stimuli and no engine -- pass `stimuli` (4 item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod("similarity-quad", eng, trial.item_shape, period);
    const sel = eng.nextQuad({ forceCoverage: !trial.adaptive });
    let pairs = [sel.pair1.slice(), sel.pair2.slice()];
    pairs = engineShuffle(jsPsych, eng, pairs);                       // random left/right
    pairs = pairs.map((p) => engineShuffle(jsPsych, eng, p));         // random top/bottom
    const shown = [pairs[0][0], pairs[0][1], pairs[1][0], pairs[1][1]].map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { pair1: pairs[0].slice(), pair2: pairs[1].slice(), isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  function finishInvalid(jsPsych, display_element, trial, period) {
    display_element.innerHTML =
      "<p style='color:#a00'>similarity-quad: no items to show (see the console warning).</p>";
    const data = {
      rt: null, mouse_hold_duration: null, pair1: [], pair2: [], degrees: [], period: period, pair_offsets: null, response: null,
      chosen_pair_items: null, confidence: null, rt_confidence: null, confidence_mouse_hold_duration: null,
      is_coverage_trial: null, model_score: null, stimuli_shown: [],
    };
    data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
    if (trial.data) Object.assign(data, trial.data);
    jsPsych.finishTrial(data);
  }

  return SimilarityQuadPlugin;
})(jsPsychModule);


/* ===================================================================== */
/* jspsych-similarity-likert.js */
/* ===================================================================== */
/*
 * jspsych-similarity-likert.js  --  jsPsych v8 plugin
 *
 * Similarity rating: one pair of items side by side, rated on an R-point
 * scale (default 7) by clicking one of a row of grayscale buttons. Only the
 * end buttons carry word anchors (`rating_labels`, default "Very different" /
 * "Very similar"). The responses feed BradySimilarity, which estimates the
 * similarity structure of a stimulus wheel.
 *
 * Items can be color-wheel degrees (disks), orientations (bars, triangles, Gabor
 * patches or gratings, via `item_shape`), CSS colors, images, or text. Two trial sources:
 *   Fixed    -- pass `stimuli` (2 item specs); is_coverage_trial and
 *               model_score are null.
 *   Adaptive -- pass an `engine` (BradySimilarity.createEngine, one instance
 *               shared across the timeline) and leave `stimuli` empty. The
 *               trial gets a pair from engine.nextPair, randomizes left/right
 *               (engine rng), and calls engine.update() with the displayed
 *               degrees before finishing. `adaptive:false` forces a coverage
 *               draw. If `rating_points` disagrees with the engine's
 *               ratingPoints, the engine's value is used (with a warning),
 *               since the ordered-logistic likelihood must match the scale
 *               shown.
 *
 * Stimulus period: an oriented bar (item_shape "line"), a Gabor patch ("gabor")
 * or a grating ("grating") looks the same after a 180-degree turn, so its
 * degrees live in [0,180) and its offsets wrap at 180; disks (hues) and
 * triangles (pointed) use 360 (BradyUtils.shapePeriod). The trial records this
 * as `period`. For an adaptive line/gabor/grating study create the engine with
 * BradySimilarity.createEngine({ period: 180 }); the plugin warns once if the
 * engine's period does not match the shape. Gabors and gratings are achromatic
 * (`grating_options`); with phase "random" each item gets its own phase,
 * recorded in stimuli_shown.
 *
 * Confidence is collected on every trial by default (`collect_confidence`):
 * an inline 4-point word popup anchored to the chosen rating button, whose x
 * clears the rating so the participant can rate again.
 *
 * The data store exact degrees and the signed offset (in the stimulus period),
 * so a similarity matrix fit to them has the same orientation as memory-error
 * data.
 *
 * Click/timer driven, so trial() is synchronous and calls
 * this.jsPsych.finishTrial(data) later (CONVENTIONS.md section 3).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js,
 * similarity-adaptive-utils.js, then this file.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSimilarityLikert = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "similarity-likert",
    version: version,
    parameters: {
      /**
       * The 2 items [left, right]. Each may be a number (color-wheel degree, or
       * orientation degree when `item_shape` is "line"/"triangle"/"gabor"/"grating"), a CSS color
       * / "lab(...)" string, an image path, or text. Numbers are recorded
       * wrapped into [0, period), so a "line" at 200 is recorded (and drawn) as
       * 20. Leave empty to draw the pair from `engine` instead (adaptive mode).
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of items: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Item shape: "disk" (default; a numeric item is a color-wheel hue), or "line" /
          "triangle" / "gabor" / "grating" (a numeric item is an orientation in degrees;
          0 = horizontal / pointing right, increasing clockwise). Lines and triangles are
          drawn in `item_color`; Gabors and gratings are achromatic, set by
          `grating_options`, with stripes at d running the same way as a "line" at d.
          "line", "gabor" and "grating" repeat every 180 degrees (period 180); "disk" and
          "triangle" repeat every 360. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Fill color for "line"/"triangle" (orientation/shape) items. Gabors and gratings
          are achromatic and ignore it. */
      item_color: { type: jspsych.ParameterType.STRING, default: "#555555" },
      /**
       * Gabor/grating appearance (item_shape "gabor" or "grating"; ignored otherwise). An
       * object; keys you leave out keep their defaults:
       * cycles (4): grating cycles across the item diameter;
       * contrast (1): Michelson contrast 0..1 around the mean, capped so the sinusoid is not
       * clipped (around a light mean such as the default #dddddd background only ~0.15
       * fits; use background_color "#808080" for full contrast);
       * sigma (0.18): Gaussian envelope SD as a fraction of the item diameter (gabor only);
       * phase (0): cosine phase in degrees at the item centre (0 = a bright stripe through
       * the centre), or "random" for an independent whole-degree phase per item (recorded
       * in stimuli_shown);
       * mean ("background"): the mean gray, "background" to match background_color's
       * luminance so the patch blends into the box, or a CSS color (its luminance is used).
       * Degree d and d + 180 draw the same pattern.
       */
      grating_options: { type: jspsych.ParameterType.OBJECT, default: { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" } },
      /** Color wheel for degree lookups (null = window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * A BradySimilarity engine (BradySimilarity.createEngine(...)), one
       * instance shared across the timeline. Required when `stimuli` is empty:
       * it supplies the next pair (nextPair) and receives the rating
       * (engine.update) before the trial finishes. Ignored when `stimuli` is given.
       * With item_shape "line", "gabor" or "grating" create it with { period: 180 }.
       */
      engine: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Engine mode only: true = ask the engine for its next pair, epsilon-greedy: each
          trial is independently a uniform COVERAGE draw with probability epsilon (the
          engine's `epsilon`, default 0.2; a per-trial Bernoulli draw, so the coverage count
          varies), else the most-informative (BALD-selected) pair. false = always force a
          coverage draw. */
      adaptive: { type: jspsych.ParameterType.BOOL, default: true },
      /** Question shown at the top of the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: "How similar are these two items?" },
      /** Number of rating buttons R (rating 1..R; values below 2 become 2). In engine
          mode the engine's ratingPoints wins (with a warning) when they disagree. */
      rating_points: { type: jspsych.ParameterType.INT, default: 7 },
      /** Word anchors: the first entry goes under the first button, the last entry under
          the last button; any middle entries are not shown. */
      rating_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Very different", "Very similar"] },
      /** Diameter/side (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Background color of the task box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the task box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the rating, show the inline 4-point word-confidence picker
          anchored to the chosen button (confidence is collected on every trial). */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: true },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },
      /** If > 0, end the trial with a null response after this many ms without a rating. A rating already
          waiting on its confidence rating is allowed to finish. 0 = wait forever. */
      response_timeout: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from when the pair appears to the (final) rating click. Null on timeout. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** The 2 item specs as displayed [left, right]. */
      pair: { type: jspsych.ParameterType.STRING, array: true },
      /** The 2 wheel/orientation degrees as displayed [left, right] (integers in [0, period)), or nulls for non-degree items. */
      degrees: { type: jspsych.ParameterType.INT, array: true },
      /** Period (degrees) of the stimulus space that `degrees` and the offsets live in: 180 for
          item_shape "line", "gabor" or "grating" (they look the same rotated 180 degrees),
          360 otherwise (BradyUtils.shapePeriod). */
      period: { type: jspsych.ParameterType.INT },
      /** Signed wrapped offset wrap(right - left) in (-period/2, period/2]; null unless both degrees are known. */
      offset: { type: jspsych.ParameterType.INT },
      /** The similarity rating 1..rating_points (1 = most different, R = most similar). Null on timeout. */
      rating: { type: jspsych.ParameterType.INT },
      /** The number of rating buttons R actually shown (engine's ratingPoints in engine mode). */
      rating_points: { type: jspsych.ParameterType.INT },
      /** Confidence rating 1..N, N = number of confidence_labels (default 4: 1 = Guess ... 4 = Certain). Null when not collected or on timeout. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the rating to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click. Null when not collected or not measurable. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Engine mode: true if this trial was a coverage draw (the per-trial probability-epsilon draw, or adaptive:false), false if BALD-selected. Null in fixed designs. */
      is_coverage_trial: { type: jspsych.ParameterType.BOOL },
      /** Engine mode: the BALD information score of the selected pair (null on coverage draws and in fixed designs). */
      model_score: { type: jspsych.ParameterType.FLOAT },
      /** One entry per displayed item [left, right]: kind plus value/src/text, and `degree` (in [0, period)) when the spec is a number. Gabor/grating items also carry `phase`, the grating phase (deg) the item was drawn with. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SimilarityLikertPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      U.checkParams(trial, {
        plugin: "similarity-likert",
        enums: { item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] },
        positive: ["rating_points"],
        nonneg: ["response_timeout"],
        min: { rating_points: 2 },
      });

      // The likelihood's rating scale must match the buttons shown, so in engine
      // mode the engine's ratingPoints wins over a mismatched rating_points.
      let R = Math.max(2, Math.round(trial.rating_points || 7));
      const eng = trial.engine;
      const engineUsable = (trial.stimuli || []).length === 0 && eng && typeof eng.update === "function";
      if (engineUsable && eng.ratingPoints && eng.ratingPoints !== R) {
        U.warnOnce("similarity-likert", "rating_points=" + R + " does not match the engine's ratingPoints=" +
          eng.ratingPoints + "; using the engine's (the ordered-logistic likelihood must match the scale shown).");
        R = eng.ratingPoints;
      }

      // ---- Trial source: fixed `stimuli` (2 specs) OR the adaptive engine ----
      const period = stimulusPeriod(trial.item_shape);
      const src = resolvePairSource(jsPsych, trial, period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, R, period); return; }
      const specs = src.specs;     // [left, right] display order
      const degrees = src.degrees;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const shape = trial.item_shape;
      const isShape = (it) => (shape === "line" || shape === "triangle" || U.isGratingShape(shape)) && it.kind !== "image" && it.kind !== "text";
      // Gabor / grating appearance (achromatic; null for the other shapes).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "similarity-likert", background: trial.background_color })
        : null;
      // Per-item paint options: an oriented shape drawn at the recorded degree (so the
      // screen shows exactly what `degrees` says), or the disk/square path.
      // Gabors/gratings also get the resolved options with this item's phase.
      const paintOpts = (it, deg, phase) => isShape(it)
        ? { shape: shape, orientation: deg != null ? deg : 0, color: trial.item_color,
          grating: grating ? Object.assign({}, grating, { phase: phase || 0 }) : null }
        : { circle: it.kind === "color" };
      const phases = itemPhases(items, grating, isShape, src, trial); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt band, the pair, the rating-button row -------
      const sz = trial.item_size;
      const promptH = 48;
      const gap = Math.max(30, Math.round(sz * 0.4));
      const btnW = 34, btnH = 30, btnGap = 6, labelH = 34;
      const rowW = R * btnW + (R - 1) * btnGap;
      const W = Math.max(2 * sz + gap + 60, rowW + 40, 320);
      const itemsTop = promptH + 8;
      const scaleTop = itemsTop + sz + 24;
      const H = scaleTop + btnH + labelH + 10;
      let html =
        `<div id="siml-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="siml-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${trial.prompt || ""}</div>`;
      for (let i = 0; i < 2; i++) {
        const x = W / 2 + (i === 0 ? -1 : 1) * (gap / 2) + (i === 0 ? -sz : 0);
        const round = (items[i].kind === "color" && (shape === "disk" || (grating && isShape(items[i])))) ? "border-radius:50%;" : "";
        const edge = grating && isShape(items[i]) ? "transparent" : "#222"; // no outline around a Gabor
        html +=
          `<canvas id="siml-cv-${i}" width="${sz}" height="${sz}" ` +
          `style="position:absolute;left:${x}px;top:${itemsTop}px;${round}border:1px solid ${edge}"></canvas>`;
      }
      // Rating buttons: unlabeled grayscale swatches, lighter = more similar
      // (40% lightness for "very different" up to 95% for "very similar").
      const rowLeft = (W - rowW) / 2;
      for (let k = 0; k < R; k++) {
        const light = R > 1 ? Math.round(40 + (k / (R - 1)) * 55) : 68;
        html +=
          `<button type="button" id="siml-rate-${k}" data-rating="${k + 1}" ` +
          `title="${k + 1} / ${R}" style="position:absolute;left:${rowLeft + k * (btnW + btnGap)}px;top:${scaleTop}px;` +
          `width:${btnW}px;height:${btnH}px;padding:0;border:1px solid rgba(0,0,0,.4);border-radius:5px;` +
          `cursor:pointer;background:hsl(0,0%,${light}%)"></button>`;
      }
      const lab = trial.rating_labels || [];
      const labStyle = `position:absolute;top:${scaleTop + btnH + 4}px;width:${Math.round(rowW / 2)}px;` +
        `font-size:12px;color:#333;line-height:1.15;overflow:hidden;height:${labelH - 6}px`;
      html +=
        `<div style="${labStyle};left:${rowLeft}px;text-align:left">${lab[0] || ""}</div>` +
        `<div style="${labStyle};left:${rowLeft + rowW - Math.round(rowW / 2)}px;text-align:right">${lab[lab.length - 1] || ""}</div>`;
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#siml-box");
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Paint (preload any image items first; trial() stays synchronous) ----
      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        for (let i = 0; i < 2; i++) {
          const cv = display_element.querySelector(`#siml-cv-${i}`);
          U.paintItem(cv.getContext("2d"), items[i], sz, imgCache, paintOpts(items[i], degrees[i], phases[i]));
        }
        onset = performance.now();
      });

      // ---- Response ----------------------------------------------------------
      let responded = false;
      let committed = false; // guards finishTrial/engine.update against any double fire
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (rating) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#siml-rate-${rating - 1}`);
          const t0 = performance.now();
          U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              const cHold = U.mouseHoldDuration(); // the confidence click is its own press
              if (conf == null) { // x: clear the choice (and end the trial if the timeout already passed)
                responded = false;
                if (timedOut && !committed) { committed = true; finish(null, null); }
                return;
              }
              confidence = conf;
              confRt = Math.round(performance.now() - t0);
              confHold = cHold;
              commit(rating, rt, hold);
            });
          return;
        }
        commit(rating, rt, hold);
      };
      for (let k = 0; k < R; k++) {
        display_element.querySelector(`#siml-rate-${k}`).addEventListener("click", () => choose(k + 1));
      }

      // ---- Commit: update the engine, then finish ---------------------------
      const commit = (rating, rt, hold) => {
        if (committed) return;
        committed = true;
        if (src.engineSpec) trial.engine.update("likert", src.engineSpec, rating);
        finish(rating, rt, hold);
      };

      const finish = (rating, rt, hold) => {
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          pair: specs.map(toStr),
          degrees: degrees.slice(),
          period: period,
          offset: degreesKnown ? offsetDeg(degrees[1], degrees[0], period) : null,
          rating: rating,
          rating_points: R,
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          is_coverage_trial: src.engineSpec ? src.engineSpec.isCoverage : null,
          model_score: src.score != null ? src.score : null,
          stimuli_shown: items.map((it, i) => shownRecord(it, specs[i], period, phases[i])),
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // experimenter fields win on collision
        jsPsych.finishTrial(data);
      };

      // ---- Optional response timeout -----------------------------------------
      if (trial.response_timeout > 0) {
        jsPsych.pluginAPI.setTimeout(() => {
          if (committed) return;
          // A choice is waiting on its confidence rating: let it finish. If the
          // participant clears it with x instead, the trial ends there.
          if (responded) { timedOut = true; return; }
          responded = true; committed = true;
          finish(null, null);
        },
          trial.response_timeout);
      }
    }
  }
  SimilarityLikertPlugin.info = info;

  // ===== module-private helpers =====
  function toStr(s) { return s == null ? null : String(s); }
  /* Period (degrees) of the stimulus space for an item_shape: the shared rule
     BradyUtils.shapePeriod. An unpointed bar ("line"), a Gabor or a grating looks the
     same after a 180-degree turn; hues ("disk") and pointed shapes ("triangle")
     repeat every 360. */
  function stimulusPeriod(shape) { return U.shapePeriod(shape); }
  /* Degree -> [0, period). Period 360 is U.wrap360. */
  function wrapDeg(v, period) { return period === 180 ? ((v % 180) + 180) % 180 : U.wrap360(v); }
  /* Signed a - b in (-period/2, period/2]. Period 360 matches U.angleDiff. */
  function offsetDeg(a, b, period) { const d = wrapDeg(a - b, period); return d > period / 2 ? d - period : d; }
  /* A numeric spec's recorded degree: rounded, wrapped into [0, period). */
  function specDegree(s, period) { return typeof s === "number" ? wrapDeg(Math.round(s), period) : null; }
  /* Warn once when the engine's period does not match the stimulus period. The
     engine is used as given; the data still record degrees in the stimulus period. */
  function checkEnginePeriod(plugin, eng, shape, period) {
    const ep = eng.period != null ? eng.period : 360;
    if (ep === period) return;
    if (period === 180) {
      U.warnOnce(plugin, "item_shape \"" + shape + "\" repeats every 180 degrees; create the engine with {period: 180} " +
        "(this engine has period " + ep + ", so it treats 0 and 180 as maximally different).");
    } else {
      U.warnOnce(plugin, "the engine has period " + ep + " but item_shape \"" + shape + "\" repeats every 360 degrees; " +
        "use {period: 180} with item_shape line/gabor/grating.");
    }
  }
  /* Shuffled copy of `arr`, drawn from the engine's rng (engine.shuffle) so a
     seeded engine also reproduces the layout; jsPsych's shuffle otherwise. */
  function engineShuffle(jsPsych, eng, arr) {
    return typeof eng.shuffle === "function" ? eng.shuffle(arr) : jsPsych.randomization.shuffle(arr.slice());
  }
  function shownRecord(item, spec, period, phase) {
    const rec = { kind: item.kind, degree: specDegree(spec, period) };
    if (item.kind === "image") rec.src = item.src;
    else if (item.kind === "text") rec.text = item.text;
    else rec.value = spec;
    if (phase != null) rec.phase = phase; // Gabor/grating: the phase it was drawn with
    return rec;
  }
  /* Grating phase per displayed item (null for an item not drawn as a Gabor/grating).
     Random phases come from the engine's rng when the engine supplied the trial, so a
     seeded engine reproduces them, and otherwise from Math.random (which
     jsPsych.randomization.setSeed seeds). */
  function itemPhases(items, grating, isShape, src, trial) {
    const eng = src && src.engineSpec ? trial.engine : null;
    const rng = eng && typeof eng.rng === "function" ? eng.rng : undefined;
    return items.map((it) => (grating && isShape(it) ? U.gratingPhase(grating, rng) : null));
  }
  /*
   * Fixed: stimuli >= 2 -> [left, right] as given.
   * Engine: nextPair() (forceCoverage when adaptive:false). The two degrees
   * are randomly ordered left/right (engine rng) and engineSpec holds the
   * displayed order in the engine's degrees; specs/degrees are the same values
   * wrapped into the stimulus period. f is symmetric, so the shuffle only
   * balances the sign of the recorded offsets.
   */
  function resolvePairSource(jsPsych, trial, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= 2) {
      if (stim.length > 2) U.warnOnce("similarity-likert", "stimuli has " + stim.length + " entries but this task uses exactly 2; the extras are ignored.");
      if (trial.engine) U.warnOnce("similarity-likert", "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, 2);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce("similarity-likert", "stimuli has only 1 entry but this task needs 2 (or none plus an `engine`). The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function") {
      U.warnOnce("similarity-likert", "no stimuli and no engine -- pass `stimuli` (2 item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod("similarity-likert", eng, trial.item_shape, period);
    const sel = eng.nextPair({ forceCoverage: !trial.adaptive });
    const engDegs = engineShuffle(jsPsych, eng, sel.degrees);
    const shown = engDegs.map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { degrees: engDegs, isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  function finishInvalid(jsPsych, display_element, trial, R, period) {
    display_element.innerHTML =
      "<p style='color:#a00'>similarity-likert: no items to show (see the console warning).</p>";
    const data = {
      rt: null, mouse_hold_duration: null, pair: [], degrees: [], period: period, offset: null, rating: null, rating_points: R,
      confidence: null, rt_confidence: null, confidence_mouse_hold_duration: null,
      is_coverage_trial: null, model_score: null, stimuli_shown: [],
    };
    data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
    if (trial.data) Object.assign(data, trial.data);
    jsPsych.finishTrial(data);
  }

  return SimilarityLikertPlugin;
})(jsPsychModule);
