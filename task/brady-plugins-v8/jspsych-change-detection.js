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
