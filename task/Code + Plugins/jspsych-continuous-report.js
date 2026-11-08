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
