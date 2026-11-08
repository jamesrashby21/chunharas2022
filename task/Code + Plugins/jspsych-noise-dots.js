/*
 * jspsych-noise-dots.js  --  jsPsych v8 plugin   (registered name: "noise-dots")
 *
 * Color-noise-dots perceptual discrimination. Shows two colored disks on a ring
 * of placeholder locations at the same time: a target disk and a test disk.
 * Each disk is a flat color overlaid with a grid of small square dots. A
 * `noise_level` fraction of the dots take random colors from the color wheel;
 * the rest keep the disk's color (0 = clean disk, 1 = pure noise). The
 * participant judges, by keyboard, whether the test disk is the same color as
 * the target disk.
 *
 * Response modes (response_mode):
 *   "binary"      -- same/different only
 *   "confidence6" -- one 6-point scale (1 = sure same .. 6 = sure different)
 *   "two_stage"   -- same/different, then a 1-6 confidence magnitude
 *                    (1 = totally guessing .. 6 = totally sure); the default
 * The noise palette comes from the trial's color wheel (color_wheel, default
 * window.BradyColorWheel).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychNoiseDots = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "noise-dots",
    version: version,
    parameters: {
      /**
       * Candidate target colors. Each entry may be a number (degree on the color
       * wheel), a CSS color ("rgb(255,0,0)", "#0f0"), or a "lab(L,a,b)" string.
       * Only `colors[which_test]` is drawn (as the target disk); the other
       * entries are not shown.
       */
      colors: { type: jspsych.ParameterType.STRING, array: true, default: ["rgb(255,0,0)"] },
      /** The TEST disk color (same spec formats as `colors`). */
      test_color: { type: jspsych.ParameterType.OBJECT, default: "rgb(255,0,0)" },
      /** Index into `colors` of the target color. Out-of-range values are clamped. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** Color wheel for degree lookups & the noise palette (default window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally-spaced locations a disk can occupy (around a circle). */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Radius (px) of the ring the disks sit on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Diameter (px) of each disk (the "field" the dots fill). */
      item_size: { type: jspsych.ParameterType.INT, default: 90 },
      /** Optional explicit placeholder indices [targetPos, testPos]. Invalid and repeated
          slots are dropped and entries past the second are ignored; a disk left without a
          slot takes the lowest unused one, so the default is [0, 1]
          (BradyUtils.resolvePositions with fill "lowest"). */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /**
       * Fraction (0-1) of dots that are noise (random colors) rather than the
       * disk's color. 0 = clean disk, 1 = pure noise (e.g. 0.4 = 40%).
       * A scalar applies to both disks, or pass [targetNoise, testNoise]
       * (a one-element array applies to both). Declared OBJECT so jsPsych accepts
       * either form without a type warning.
       */
      noise_level: { type: jspsych.ParameterType.OBJECT, default: [0, 0] },
      /** Edge length (px) of each square noise dot (values below 1 are treated as 1). */
      dot_size: { type: jspsych.ParameterType.INT, default: 3 },
      /** Max number of dots drawn per disk (capped to those that fit inside it). */
      num_dots: { type: jspsych.ParameterType.INT, default: 1080 },
      /**
       * Number of distinct hues used for the noise dots, evenly spaced around
       * the wheel (e.g. 6 = a coarse palette). Default 360 = one per degree.
       */
      num_colors: { type: jspsych.ParameterType.INT, default: 360 },
      /**
       * How long (ms) the disks stay visible. null/0 = they stay up through the
       * response (the default). If > 0, the disks are cleared after this long
       * and only then is the response collected, against a blank field (keys
       * pressed while the disks are up are ignored).
       */
      display_time: { type: jspsych.ParameterType.INT, default: null },
      /** Wait for a click on the fixation "+" before starting (vs. a timer). */
      click_to_start: { type: jspsych.ParameterType.BOOL, default: true },
      /** Delay (ms) from start (click or trial onset) to disk onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** "two_stage" (default), "confidence6", or "binary" (see file banner). The 1-6 scales use keys 1-6. */
      response_mode: { type: jspsych.ParameterType.STRING, default: "two_stage" },
      /** Keys for the binary same / different responses (two_stage & binary). */
      same_key: { type: jspsych.ParameterType.STRING, default: "s" },
      different_key: { type: jspsych.ParameterType.STRING, default: "d" },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Briefly highlight whether the same/different judgment was correct. */
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
    },
    data: {
      /** Response time (ms) of the first response, from response onset: the same/different RT in two_stage and binary, the scale RT in confidence6 (== rt_same_diff). Not the two_stage total. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the first response's key (the one `rt` times) was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the two_stage confidence key was held down (null in the other modes). Named like the other plugins' confidence_mouse_hold_duration. */
      confidence_key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Deprecated alias of confidence_key_hold_duration (always the same value), kept so existing analysis code keeps working. Use confidence_key_hold_duration. */
      key_hold_duration_confidence: { type: jspsych.ParameterType.INT },
      /** Every key pressed from response onset until the first response's key is released: {key, t (ms from response onset), duration}. The two_stage confidence key is not included. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the first response's key was also pressed in that window (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** Same value as rt: the same/different RT in two_stage/binary, or the 1-6 scale RT in
       *  confidence6, from response onset. */
      rt_same_diff: { type: jspsych.ParameterType.INT },
      /** two_stage only: RT (ms) from the confidence prompt appearing (after the same/different key is released) to the rating; else null. */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** 1 if the participant judged "same", 0 if "different". In confidence6, ratings 1-3 count as "same" and 4-6 as "different". */
      said_same: { type: jspsych.ParameterType.INT },
      /**
       * The 1-6 rating, or null in binary. In two_stage it is confidence magnitude
       * (1 = guessing .. 6 = sure); in confidence6 it is the direction scale
       * (1 = sure same .. 6 = sure different).
       */
      confidence: { type: jspsych.ParameterType.INT },
      /** Whether the test color matched the target color, compared by resolved RGB (BradyUtils.sameColor), so a wheel degree and the same color written as an rgb()/#hex/lab() string count as the same. */
      was_same: { type: jspsych.ParameterType.BOOL },
      /** Whether the same/different judgment was correct. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Which response_mode was used. */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** Placeholder indices used: [targetPos, testPos]. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** Index of the target disk within `colors`. */
      which_test: { type: jspsych.ParameterType.INT },
      /** Resolved target color (CSS). */
      target_color: { type: jspsych.ParameterType.STRING },
      /** Resolved test color (CSS). */
      test_color: { type: jspsych.ParameterType.STRING },
      /** The target color spec as given (degree / CSS / lab). */
      specified_target_color: { type: jspsych.ParameterType.STRING },
      /** The test color spec as given. */
      specified_test_color: { type: jspsych.ParameterType.STRING },
      /** Noise levels used: [targetNoise, testNoise]. */
      noise_level: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured time (ms) the disks were on screen before the response. With display_time > 0: from disk onset until the disks were cleared. With display_time null/0 the disks stay up through the response, so it is the time from disk onset to the first response key press (about rt, since the response opens at disk onset). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per disk (target, test): {role, position, value (resolved CSS color), spec,
          noise_level} plus the dot-field parameters (num_dots, dot_size, num_colors,
          num_placeholders, radius, item_size). Individual dot positions and colors are
          random and not recorded. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** The correct same/different answer: "same" or "different". */
      correct_response: { type: jspsych.ParameterType.STRING },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class NoiseDotsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      // Ends the trial at most once, and never after it has ended (U.makeFinisher).
      const finishOnce = U.makeFinisher(jsPsych);
      const wheel = trial.color_wheel || window.BradyColorWheel;

      U.checkParams(trial, { plugin: "noise-dots", positive: ["num_dots"], unit: ["noise_level"],
        enums: { response_mode: ["binary", "confidence6", "two_stage"] } });

      // Clamp which_test into the colors range so the target spec is always defined
      // (out of range, the fill would be "undefined"). Clamped values live in locals: trial is
      // jsPsych's stored copy of the parameters (save_trial_parameters reads it), so it is
      // never modified.
      const whichTest = U.whichTestIndex(trial.which_test, trial.colors.length, { plugin: "noise-dots" });
      // ---- Resolve the two disk colors --------------------------------------
      const targetIdx = whichTest;
      const targetSpec = trial.colors[targetIdx];
      const testSpec = trial.test_color;
      const targetCss = U.resolveItem(targetSpec, wheel, "color").css;
      const testCss = U.resolveItem(testSpec, wheel, "color").css;
      // Compared by resolved RGB (U.sameColor), so a degree and its "rgb(...)" string match.
      const wasSame = U.sameColor(targetCss, testCss, wheel);

      // ---- Per-disk noise levels ([target, test]) ---------------------------
      // noise_level is a fraction 0-1, as in the other plugins; drawDisk takes a percent.
      const noiseArr = Array.isArray(trial.noise_level)
        ? trial.noise_level
        : [trial.noise_level, trial.noise_level];
      const targetNoise = (noiseArr.length > 0 ? +noiseArr[0] : 0) * 100;
      const testNoise = (noiseArr.length > 1 ? +noiseArr[1] : +noiseArr[0] || 0) * 100;

      // ---- Build the noise palette from the (swappable) color wheel ----------
      const nColors = Math.max(1, trial.num_colors);
      const palette = [];
      for (let k = 0; k < nColors; k++) {
        palette.push(U.colorWheelCSS(Math.round((k * 360) / nColors) % 360, wheel));
      }

      // ---- Disk locations ---------------------------------------------------
      // Two disks [target, test]; `positions` records exactly those. A disk without a valid
      // slot takes the lowest unused one, and the placeholder count grows to cover the
      // slots used, so drawDisk never looks up a canvas that was never created.
      const placed = U.resolvePositions(trial, 2, { fill: "lowest" });
      const pos = placed.pos;
      const numPh = placed.nph;

      // ---- Layout -----------------------------------------------------------
      const boxSize = 2 * trial.radius + 2 * trial.item_size + 50;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      let html =
        `<div id="nd-box" style="position:relative;margin:0 auto;border:1px solid #000;` +
        `width:${boxSize}px;height:${boxSize}px;background:${trial.background_color}">`;
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        html +=
          `<canvas id="nd-item-${i}" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;top:${top}px;left:${left}px"></canvas>`;
      }
      html +=
        `<span id="nd-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="nd-message" style="position:absolute;top:18px;width:100%;text-align:center;font-size:11pt">${startText}</div>` +
        `</div>`;
      if (trial.prompt) html += trial.prompt;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#nd-box"));

      // ---- State ------------------------------------------------------------
      let promptOnset = null; // onset of the first response prompt
      let confOnset = null;   // onset of the confidence prompt (two_stage)
      let diskOnset = null;          // onset of the two disks
      let actualStimDuration = null; // measured disk duration (ms); see info.data
      let saidSame = null;
      let confidence = null;
      let rtSameDiff = null;
      let rtConfidence = null;
      // Response-duration state: the first response's key, its hold, its press log, and
      // the two_stage confidence key's hold.
      let respKey = null;
      let holdPrimary = null;
      let holdConfidence = null;
      let pressLog = null;

      // ---- Phases -----------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#nd-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        jsPsych.pluginAPI.setTimeout(showStimuli, trial.delay_start);
      };

      const showStimuli = () => {
        drawDisk(pos[0], targetCss, targetNoise);
        drawDisk(pos[1], testCss, testNoise);
        diskOnset = performance.now();
        if (trial.display_time && trial.display_time > 0) {
          jsPsych.pluginAPI.setTimeout(() => {
            actualStimDuration = Math.round(performance.now() - diskOnset);
            clearItem(pos[0]);
            clearItem(pos[1]);
            getResponse();
          }, trial.display_time);
        } else {
          // Disks stay up through the response, which opens now; actual_stim_duration is
          // stamped at the first response key press (stampViewing).
          getResponse();
        }
      };

      // ---- Response collection ---------------------------------------------
      // display_time null/0: the disks are still up at the first response, so their viewing
      // time is disk onset -> that key press.
      const stampViewing = () => {
        if (!(trial.display_time > 0) && actualStimDuration === null && diskOnset !== null) {
          actualStimDuration = Math.round(performance.now() - diskOnset);
        }
      };
      const getResponse = () => {
        promptOnset = performance.now();
        // Log every key pressed from response onset, so trials with more than one
        // response key can be excluded (see info.data). Closed when the first
        // response's key comes back up, before any two_stage confidence key.
        U.beginPressLog(promptOnset);
        if (trial.response_mode === "confidence6") {
          collectScale6Direction();
        } else {
          collectBinary();
        }
      };

      // Same/different keys (binary, and stage 1 of two_stage).
      const collectBinary = () => {
        setMsg(`${trial.same_key} = same &nbsp;&nbsp; ${trial.different_key} = different`);
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            stampViewing();
            saidSame = jsPsych.pluginAPI.compareKeys(resp.key, trial.same_key) ? 1 : 0;
            rtSameDiff = Math.round(performance.now() - promptOnset);
            respKey = resp.key;
            // getKeyboardResponse fires on KEYDOWN, so the hold is not yet knowable
            // here: wait for the release before going on (to stage 2 or the end of the
            // trial). trial() stays synchronous, so this is a .then(), not an await.
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => {
              holdPrimary = hold;
              pressLog = U.endPressLog();
              if (trial.response_mode === "two_stage") collectScale6Magnitude();
              else finish();
            }));
          },
          valid_responses: [trial.same_key, trial.different_key],
          rt_method: "performance",
          persist: false,
        });
      };

      // Stage 2 of two_stage: confidence magnitude (1 = guessing .. 6 = sure). Runs after
      // the same/different key is released, and rt_confidence is timed from here.
      const collectScale6Magnitude = () => {
        confOnset = performance.now();
        setMsg("how sure are you? (1-6)<br>1 = totally guessing &nbsp; ... &nbsp; 6 = totally sure");
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            confidence = parseInt(resp.key, 10);
            rtConfidence = Math.round(performance.now() - confOnset);
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => { holdConfidence = hold; finish(); }));
          },
          valid_responses: ["1", "2", "3", "4", "5", "6"],
          rt_method: "performance",
          persist: false,
        });
      };

      // confidence6: one direction scale (1 = sure same .. 6 = sure different).
      const collectScale6Direction = () => {
        setMsg(
          "<table border=0 cellpadding=3 style='margin:0 auto;table-layout:fixed'>" +
          "<tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr>" +
          "<tr><td>sure<br>same</td><td>probably<br>same</td><td>maybe<br>same</td>" +
          "<td>maybe<br>diff</td><td>probably<br>diff</td><td>sure<br>diff</td></tr></table>"
        );
        this._kb = jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: (resp) => {
            stampViewing();
            confidence = parseInt(resp.key, 10);
            saidSame = confidence <= 3 ? 1 : 0; // 1-3 -> "same", 4-6 -> "different"
            rtSameDiff = Math.round(performance.now() - promptOnset);
            respKey = resp.key;
            // The scale key is the first (only) response; wait for its release.
            U.awaitKeyUp(resp.key).then(finishOnce.guard((hold) => {
              holdPrimary = hold;
              pressLog = U.endPressLog();
              finish();
            }));
          },
          valid_responses: ["1", "2", "3", "4", "5", "6"],
          rt_method: "performance",
          persist: false,
        });
      };

      // ---- Finish -----------------------------------------------------------
      const finish = () => {
        if (this._kb) { jsPsych.pluginAPI.cancelKeyboardResponse(this._kb); this._kb = null; }
        const correct = saidSame === (wasSame ? 1 : 0);
        // One self-contained entry per disk, with the dot-field parameters repeated on
        // each. Per-dot positions/colors come from Math.random() and are not stored.
        const fieldParams = {
          num_dots: trial.num_dots, dot_size: trial.dot_size, num_colors: trial.num_colors,
          num_placeholders: numPh, radius: trial.radius, item_size: trial.item_size,
        };
        const stimuli_shown = [
          Object.assign({ role: "target", position: pos[0], value: targetCss, spec: String(targetSpec), noise_level: targetNoise / 100 }, fieldParams),
          Object.assign({ role: "test", position: pos[1], value: testCss, spec: String(testSpec), noise_level: testNoise / 100 }, fieldParams),
        ];
        const correct_response = wasSame ? "same" : "different";
        const done = () => {
          const data = {
            rt: rtSameDiff,
            ...U.keyHoldData(holdPrimary, respKey, pressLog),
            confidence_key_hold_duration: holdConfidence,
            key_hold_duration_confidence: holdConfidence, // deprecated alias of confidence_key_hold_duration
            rt_same_diff: rtSameDiff,
            rt_confidence: rtConfidence,
            said_same: saidSame,
            confidence: confidence,
            was_same: wasSame,
            correct: correct,
            response_mode: trial.response_mode,
            positions: pos,
            which_test: whichTest,
            target_color: targetCss,
            test_color: testCss,
            specified_target_color: String(targetSpec),
            specified_test_color: String(testSpec),
            noise_level: [targetNoise / 100, testNoise / 100], // back to the 0-1 fraction
            actual_stim_duration: actualStimDuration,
            stimuli_shown: stimuli_shown,
            correct_response: correct_response,
          };
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
          finishOnce(data);
        };
        if (trial.feedback) {
          const el = display_element.querySelector(`#nd-item-${pos[1]}`);
          el.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
          setMsg(correct ? "Correct!" : "Incorrect");
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(done, 800);
        } else {
          done();
        }
      };

      // ---- Drawing helpers --------------------------------------------------
      const itemCtx = (p) => display_element.querySelector(`#nd-item-${p}`).getContext("2d");
      const clearItem = (p) => itemCtx(p).clearRect(0, 0, trial.item_size, trial.item_size);

      // Draw a colored disk filled with a field of noise dots.
      const drawDisk = (p, color, noisePercent) => {
        const ctx = itemCtx(p);
        const s = trial.item_size;
        const r = s / 2 - 1;
        const cx = s / 2;
        const cy = s / 2;
        ctx.clearRect(0, 0, s, s);

        // Base disk.
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
        ctx.stroke();

        if (!(noisePercent > 0)) return;

        // Find every grid cell that fits entirely inside the disk. A dot_size below 1
        // would never advance the loops below (an infinite loop that freezes the page).
        const g = Math.max(1, trial.dot_size || 0);
        const valid = [];
        for (let x = 0; x <= s - g; x += g) {
          for (let y = 0; y <= s - g; y += g) {
            // Worst-case corner of the cell relative to center.
            const dx = Math.max(Math.abs(x - cx), Math.abs(x + g - cx));
            const dy = Math.max(Math.abs(y - cy), Math.abs(y + g - cy));
            if (Math.sqrt(dx * dx + dy * dy) <= r) valid.push([x, y]);
          }
        }
        // Shuffle and keep up to num_dots of them.
        for (let i = valid.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = valid[i];
          valid[i] = valid[j];
          valid[j] = t;
        }
        const n = Math.min(trial.num_dots, valid.length);
        for (let i = 0; i < n; i++) {
          const cell = valid[i];
          // Each dot is noise with probability noisePercent/100, else the disk's color.
          ctx.fillStyle = Math.random() * 100 > noisePercent ? color : palette[Math.floor(Math.random() * palette.length)];
          ctx.fillRect(cell[0], cell[1], g, g);
        }
      };

      const setMsg = (h) => (display_element.querySelector("#nd-message").innerHTML = h);

      // ---- Kick off ---------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#nd-fixation").addEventListener("click", start);
      } else {
        start();
      }
    }
  }
  NoiseDotsPlugin.info = info;

  return NoiseDotsPlugin;
})(jsPsychModule);
