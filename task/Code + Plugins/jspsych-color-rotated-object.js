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
