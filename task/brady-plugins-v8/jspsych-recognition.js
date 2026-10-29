/*
 * jspsych-recognition.js  --  jsPsych v8 plugin
 *
 * Old/new recognition memory. Presents one test item (the probe) and asks
 * whether it is old (seen before) or new, as a binary choice or a 1-6 rating.
 * The probe appears with the response options at once; there is no study
 * phase here, so present the studied items in earlier trials.
 *
 * The probe can be a color, a color-wheel degree, an image, or a word (see
 * `stimulus` and `item_type`).
 *
 * Confidence scale: 1 = sure new ... 6 = sure old (higher = more "old");
 * said_old = 1 for ratings 4-6.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRecognition = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "recognition",
    version: version,
    parameters: {
      /**
       * The test item (the probe). May be a number (degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)"
       * string, an image path ("face.png", "img/x.jpg"), or a word ("cat").
       * Required.
       */
      stimulus: { type: jspsych.ParameterType.OBJECT, default: undefined },
      /** Force interpretation of `stimulus`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * Ground truth: was this item shown before? Used to score `correct` and
       * for feedback. Does not affect the display.
       */
      is_old: { type: jspsych.ParameterType.BOOL, default: true },
      /**
       * "binary" (one old vs. new choice) or "confidence6" (a 1-6 scale,
       * 1 = sure new ... 6 = sure old). Same names as change-detection/noise-dots.
       */
      response_mode: { type: jspsych.ParameterType.STRING, default: "binary" },
      /** How responses are collected: "keyboard" (old_key/new_key, or keys 1-6 for the
          scale), "buttons", or "both" (buttons shown and the keys armed; whichever answers
          first is the response, as in change-detection). Any other value warns once and
          behaves as "buttons". */
      response_ui: { type: jspsych.ParameterType.STRING, default: "keyboard" },
      /** Keyboard key for the "old" response (binary mode). */
      old_key: { type: jspsych.ParameterType.STRING, default: "o" },
      /** Keyboard key for the "new" response (binary mode). */
      new_key: { type: jspsych.ParameterType.STRING, default: "n" },
      /** Button / label text for the "old" response (binary mode). */
      old_button_text: { type: jspsych.ParameterType.STRING, default: "Old (seen before)" },
      /** Button / label text for the "new" response (binary mode). */
      new_button_text: { type: jspsych.ParameterType.STRING, default: "New" },
      /** Diameter (px) of the probe item. */
      item_size: { type: jspsych.ParameterType.INT, default: 120 },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Optional HTML shown beneath the display (e.g. the question prompt). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
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
      /** Record the whole-trial mouse trajectory (cursor path to the chosen button). Only meaningful with response_ui "buttons" or "both"; with "keyboard" a one-time console note says so. */
      record_mouse: { type: jspsych.ParameterType.BOOL, default: false },
      /** Min ms between mouse samples before the response phase is marked (0 = every event).
          The buttons appear with the probe, so this covers only the first few ms. */
      mouse_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
      /** Min ms between mouse samples once the response buttons are live (0 = every event). */
      mouse_response_min_interval: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from probe onset to the response. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (or the response was made with the keyboard). */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred, or the response was a click). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed from probe onset until the response key is released (or the response click, with response_ui "both"): {key, t (ms from probe onset), duration}. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). null with response_ui "buttons". */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** 1 if the participant judged the item old, 0 if new. In confidence6, ratings 4-6 count as old. */
      said_old: { type: jspsych.ParameterType.INT },
      /** Confidence rating 1-6 (1 = sure new ... 6 = sure old), or null in binary mode. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Whether the probe was actually old (the `is_old` truth value). */
      was_old: { type: jspsych.ParameterType.BOOL },
      /** Whether the old/new judgment was correct. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** The probe spec, as given. */
      stimulus: { type: jspsych.ParameterType.STRING },
      /** Which response_mode was used: "binary" or "confidence6". */
      response_mode: { type: jspsych.ParameterType.STRING },
      /** Which response UI was used: "keyboard", "buttons" or "both". */
      response_ui: { type: jspsych.ParameterType.STRING },
      /** One-element array describing the probe: {src} for an image, {text} for a word, or {value: the color spec as given} for a color. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Mouse-trajectory samples (only when record_mouse): rows of [t, x, y, value], value = nearest button index during the response. */
      mouse_trajectory: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Column names for each mouse_trajectory row (only when record_mouse). */
      mouse_trajectory_columns: { type: jspsych.ParameterType.STRING, array: true },
      /** Index of the first response-phase mouse sample (only when record_mouse). */
      mouse_response_start_index: { type: jspsych.ParameterType.INT },
      /** Only when record_mouse: phase name -> onset (ms), on the trajectory's clock (t = 0 at probe onset; there is no memory array or fixation in this plugin). encoding: 0, the probe and response buttons appear; report: the mouse response window opens (at the same time). */
      mouse_phase_onsets: { type: jspsych.ParameterType.OBJECT },
      /** Auto-zoom scale of the box, for unscaling mouse coordinates (only when record_mouse). */
      mouse_zoom: { type: jspsych.ParameterType.FLOAT },
      /** Layout in the mouse-trajectory frame (only when record_mouse): each response button's box (index/value/correct/x/y/w/h) and target_option (the correct button, binary mode only). */
      mouse_geometry: { type: jspsych.ParameterType.OBJECT },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RecognitionPlugin {
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
      U.checkParams(trial, { plugin: "recognition",
        enums: { response_mode: ["binary", "confidence6"], response_ui: ["keyboard", "buttons", "both"], item_type: ["auto", "color", "image", "text"] } });
      // Keys are armed for "keyboard" and "both"; buttons are drawn for everything else
      // ("buttons", "both", and an unrecognized value, which checkParams has warned about).
      const wantKeys = trial.response_ui === "keyboard" || trial.response_ui === "both";
      const wantButtons = trial.response_ui !== "keyboard";
      if (trial.record_mouse && !wantButtons) {
        U.noteOnce("recognition", "record_mouse-keyboard", 'record_mouse with response_ui "keyboard": there are no ' +
          "clickable options, so mouse_trajectory has no response phase and mouse_geometry is null.");
      }

      // ---- Resolve the probe (degree / color / image / word) ----
      const probe = U.resolveItem(trial.stimulus, wheel, forceType);
      const wasOld = !!trial.is_old;

      // ---- Preload the image (if any), then build and run the trial ----
      // trial() stays synchronous so jsPsych waits for finishTrial(); an async trial()
      // would end as soon as this method returned.
      U.loadImages(probe.kind === "image" ? [probe.src] : []).then((imgCache) => {

        // ---- Layout: one tall box, the probe in the square stage at the top and the
        // message, buttons and prompt in the panel below it. The panel rows reserve their
        // height up front so the box never grows when the buttons appear.
        const boxSize = trial.item_size + 80;
        const off = (boxSize - trial.item_size) / 2;
        const stageHTML =
          `<canvas id="rec-item" width="${trial.item_size}" height="${trial.item_size}" ` +
          `style="position:absolute;top:${off}px;left:${off}px;border-radius:50%;border:1px solid #222"></canvas>`;
        const panelHTML =
          `<div id="rec-message" style="min-height:1.4em"></div>` +
          `<div id="rec-response" style="margin-top:8px;min-height:2.8em"></div>` +
          (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
        display_element.innerHTML = U.stageBox(
          { idPrefix: "rec", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);

        // ---- Paint the probe ----
        U.paintItem(display_element.querySelector("#rec-item").getContext("2d"), probe, trial.item_size, imgCache);

        // ---- State ----
        let saidOld = null;
        let confidence = null;
        let kb = null; // keyboard-listener handle (trial-local)
        let answered = false; // one-shot: a second click (e.g. a double-click) is ignored
        // Claimed at the first key press or click, so with response_ui "both" a click made
        // while the response key is still held (before finish runs at its release) is ignored.
        let claimed = false;
        // Response-duration fields: whichever modality answered sets its own.
        let mouseHold = null;
        let keyHold = null;
        let respKey = null;
        let mt = null; // optional mouse-trajectory recorder (record_mouse)
        let optEls = []; // clickable response buttons + identity/correctness, for mouse geometry
        const probeOnset = performance.now();
        if (trial.record_mouse) {
          // Probe and buttons appear together, so tracking starts at probe onset.
          mt = U.makeMouseTracker(display_element.querySelector("#rec-stage"), probeOnset,
            { minInterval: trial.mouse_min_interval, responseMinInterval: trial.mouse_response_min_interval });
          mt.attach();
          mt.mark("encoding");
        }

        // ---- Response UI -----------------------------------------------------
        // Log every key pressed from probe onset, so trials with extra keypresses can be
        // excluded (see info.data).
        if (wantKeys) U.beginPressLog(probeOnset);
        if (trial.response_mode === "confidence6") collectScale6();
        else collectBinary();

        // Auto-zoom after the buttons exist: they can wrap to two rows in a narrow box, so
        // the box's final height is only known now, and scaling earlier could overflow.
        if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#rec-box"));

        function collectBinary() {
          const onOld = (at) => { saidOld = 1; finish(at); };
          const onNew = (at) => { saidOld = 0; finish(at); };
          if (wantKeys) {
            setMsg(`${trial.old_key.toUpperCase()} = ${trial.old_button_text} &nbsp;&nbsp; ` +
                   `${trial.new_key.toUpperCase()} = ${trial.new_button_text}`);
            kb = jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: (i) => {
                if (claimed) return;
                claimed = true;
                // getKeyboardResponse fires on keydown, before the hold is known: stamp
                // the response time here, then finish once the key is released.
                const at = performance.now();
                const isOld = jsPsych.pluginAPI.compareKeys(i.key, trial.old_key);
                U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => {
                  keyHold = hold;
                  respKey = i.key;
                  (isOld ? onOld : onNew)(at);
                }));
              },
              valid_responses: [trial.old_key, trial.new_key],
              rt_method: "performance",
              persist: false,
            });
          }
          if (wantButtons) {
            if (!wantKeys) setMsg("Have you seen this item before?");
            setResponseHTML(
              `<button class="jspsych-btn" id="rec-old">${trial.old_button_text}</button> ` +
              `<button class="jspsych-btn" id="rec-new">${trial.new_button_text}</button>`
            );
            const oldBtn = display_element.querySelector("#rec-old");
            const newBtn = display_element.querySelector("#rec-new");
            // A click fires only after the button is released, so the hold is already
            // known here; read it first so every click consumes exactly one press.
            oldBtn.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onOld(); });
            newBtn.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onNew(); });
            // Mark the button that matches the truth as the correct option.
            optEls = [{ el: oldBtn, value: "old", correct: wasOld }, { el: newBtn, value: "new", correct: !wasOld }];
            beginMouseResponse();
          }
        }

        function collectScale6() {
          // 1 = sure new ... 6 = sure old (higher = more "old").
          const labels = ["1<br>sure new", "2", "3", "4", "5", "6<br>sure old"];
          setMsg("Rate 1 (sure NEW) to 6 (sure OLD/seen)");
          if (wantKeys) {
            kb = jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: (i) => {
                if (claimed) return;
                claimed = true;
                // Stamp at keydown, finish at keyup (see collectBinary).
                const at = performance.now();
                const v = parseInt(i.key, 10);
                U.awaitKeyUp(i.key).then(finishOnce.guard((hold) => { keyHold = hold; respKey = i.key; onScale(v, at); }));
              },
              valid_responses: ["1", "2", "3", "4", "5", "6"],
              rt_method: "performance",
              persist: false,
            });
          }
          if (wantButtons) {
            setResponseHTML(
              labels.map((l, k) => `<button class="jspsych-btn" data-v="${k + 1}" style="vertical-align:top">${l}</button>`).join(" ")
            );
            display_element.querySelectorAll("#rec-response button").forEach((b) => {
              b.addEventListener("click", (e) => { const h = U.mouseHoldDuration(); if (claimed) return; claimed = true; mouseHold = h; if (mt) mt.sample(e); onScale(parseInt(b.dataset.v, 10)); });
              // A 1-6 scale has no single correct button, so record the layout with no
              // correct/target -- the trajectory direction (toward 1 vs 6) is the measure.
              optEls.push({ el: b, value: parseInt(b.dataset.v, 10), correct: false });
            });
            beginMouseResponse();
          }
        }

        // Open the mouse response window: switch to the response sample rate and record,
        // per sample, which button the cursor is nearest (index into optEls / geometry).
        function beginMouseResponse() {
          if (!mt) return;
          mt.mark("report");
          mt.setValueFn(U.nearestChoiceFn(optEls.map((c) => c.el)));
        }

        function onScale(v, at) {
          confidence = v;
          saidOld = v >= 4 ? 1 : 0; // 1-3 -> "new", 4-6 -> "old"
          finish(at);
        }

        // ---- Finish ----------------------------------------------------------
        // `at` is the response time (the keyboard paths finish at keyup but time the
        // response at keydown); clicks pass nothing and are timed now.
        function finish(at) {
          if (answered) return;
          answered = true;
          const rt = Math.round((at == null ? performance.now() : at) - probeOnset);
          const pressLog = wantKeys ? U.endPressLog() : null;
          if (kb) {
            jsPsych.pluginAPI.cancelKeyboardResponse(kb);
            kb = null;
          }
          const correct = saidOld === (wasOld ? 1 : 0);
          // The probe as shown, in the cross-plugin stimuli_shown format.
          const shownRec = {};
          if (probe.kind === "image") shownRec.src = probe.src;
          else if (probe.kind === "text") shownRec.text = probe.text;
          else shownRec.value = trial.stimulus; // color: hue degree or css spec
          const data = {
            rt: rt,
            mouse_hold_duration: mouseHold,
            ...U.keyHoldData(keyHold, respKey, pressLog),
            said_old: saidOld,
            confidence: confidence,
            was_old: wasOld,
            correct: correct,
            response_mode: trial.response_mode,
            response_ui: trial.response_ui,
            stimulus: trial.stimulus,
            stimuli_shown: [shownRec],
          };
          if (trial.record_mouse && mt) {
            // Build geometry before feedback clears the buttons (they must still be in the DOM).
            mt.detach();
            Object.assign(data, U.mouseTrackerData(mt));
            // null when there are no clickable options (response_ui "keyboard"), as in
            // change-detection.
            data.mouse_geometry = optEls.length
              ? U.discreteChoiceGeometry(display_element.querySelector("#rec-stage"), optEls)
              : null;
          }
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
          const done = () => finishOnce(data);
          if (trial.feedback) {
            const el = display_element.querySelector("#rec-item");
            el.style.boxShadow = `0 0 0 4px ${correct ? "#2ecc40" : "#ff4136"}`;
            setMsg(correct ? "Correct!" : "Incorrect");
            U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
            clearResponse();
            jsPsych.pluginAPI.setTimeout(done, 800);
          } else {
            done();
          }
        }

        // ---- DOM helpers -----------------------------------------------------
        function setMsg(h) { display_element.querySelector("#rec-message").innerHTML = h; }
        function setResponseHTML(h) { display_element.querySelector("#rec-response").innerHTML = h; }
        function clearResponse() { setResponseHTML(""); }

      }); // end loadImages().then
    }
  }
  RecognitionPlugin.info = info;

  return RecognitionPlugin;
})(jsPsychModule);
