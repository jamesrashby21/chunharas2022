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
