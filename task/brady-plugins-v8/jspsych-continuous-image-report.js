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
