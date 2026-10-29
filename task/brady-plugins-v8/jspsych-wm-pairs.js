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
