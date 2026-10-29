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
