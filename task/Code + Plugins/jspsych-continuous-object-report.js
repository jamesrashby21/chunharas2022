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
