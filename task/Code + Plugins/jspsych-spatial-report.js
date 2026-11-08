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
