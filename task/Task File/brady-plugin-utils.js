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
