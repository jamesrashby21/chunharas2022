/*
 * jspsych-recall.js  --  jsPsych v8 plugin   (registered name: "recall")
 *
 * Working-memory cued recall, typed. Shows a memory array of items around a
 * circle, a blank retention delay, then rings one location (the probe) and asks
 * the participant to type what was there into a text or number field. Records
 * the typed response, rt, and accuracy when a correct answer is defined. One
 * typed response per trial.
 *
 * Items can be colors, color-wheel degrees, images, or text/words/numbers (mixed
 * freely) via BradyUtils.resolveItem; see `stimuli` and `item_type`. Text items
 * are inserted as HTML (markup renders; escape a literal "<" or "&"). Numeric
 * recall uses input_type:"number".
 *
 * Location manipulations (all optional, default off): precue_time / retrocue_time
 * ring the to-be-probed location before the array / after the delay;
 * noise_level + noise_type degrade the items at encoding; mask_time + mask_type
 * mask the occupied locations at array offset, before the delay. Noise/mask kinds come from
 * BradyUtils.noiseKinds/maskKinds, registerNoise/registerMask, or a function.
 *
 * Feedback is a green/red ring plus "Correct!"/"Incorrect".
 *
 * Trial-ending rule (CONVENTIONS.md §3): timer/listener driven, so trial() is
 * synchronous and calls this.jsPsych.finishTrial(data) later, once, through
 * U.makeFinisher.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRecall = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.1.0";

  const info = {
    name: "recall",
    version: version,
    parameters: {
      /**
       * The memory-array items. Each entry may be a JS number (a degree on the color
       * wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a "lab(L,a,b)" string,
       * an image path ("dog.png", "img/x.jpg"), or text, including digits as a string
       * ("cat", "7"). Force the interpretation with `item_type`.
       * Text items are inserted as HTML, not as plain text: "<b>cat</b>" shows a bold
       * word, and a literal "<", ">" or "&" must be written as "&lt;", "&gt;", "&amp;".
       * Scoring compares the typed answer with the spec as given (markup included), so
       * set correct_answer when a text item contains markup or entities.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Color wheel used to turn degrees into colors (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Number of equally-spaced locations items can occupy (around a circle). Raised to
          the number of items, and to cover any explicit item_positions, if smaller. */
      num_placeholders: { type: jspsych.ParameterType.INT, default: 8 },
      /** Optional explicit placeholder index for each item (else random). Invalid slots
          (negative or non-integer) and repeated slots are dropped, entries past set_size are
          ignored, and items left without a slot go to random unused placeholders
          (BradyUtils.resolvePositions). num_placeholders grows to cover the largest slot used. */
      item_positions: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Radius (px) of the circle the items are arranged on. */
      radius: { type: jspsych.ParameterType.INT, default: 160 },
      /** Side length (px) of each item box. */
      item_size: { type: jspsych.ParameterType.INT, default: 100 },
      /** Font size (CSS string) for text items in the memory array (the input field has its own fixed 32pt size). */
      font_size: { type: jspsych.ParameterType.STRING, default: "16pt" },
      /** Index (0..stimuli.length-1) of the item whose location is probed. Out-of-range values are clamped. */
      which_test: { type: jspsych.ParameterType.INT, default: 0 },
      /** If false, just present the array + delay and end (encoding-only, no test). */
      do_test: { type: jspsych.ParameterType.BOOL, default: true },
      /** How long (ms) the memory array is shown (0 = not shown, unless sequential). */
      display_time: { type: jspsych.ParameterType.INT, default: 500 },
      /** Present the memory items one at a time in their placeholders (instead of all at once). */
      sequential: { type: jspsych.ParameterType.BOOL, default: false },
      /** When sequential: how long (ms) each item is shown. */
      sequential_item_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: blank gap (ms) between successive items. */
      sequential_gap_time: { type: jspsych.ParameterType.INT, default: 300 },
      /** When sequential: keep each item visible (build up) instead of blanking each before the next. */
      sequential_cumulative: { type: jspsych.ParameterType.BOOL, default: false },
      /** Blank retention interval (ms) between array offset and the recall probe. With mask_time > 0 it starts when the mask comes off, and still runs in full. */
      delay_time: { type: jspsych.ParameterType.INT, default: 800 },
      /** If > 0, ring the to-be-probed location (`cue_color`/`cue_thickness`) for this long
          right after the start, then wait delay_start before the array. Skipped when
          do_test is false (there is no probe to cue). 0 = off. */
      precue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, after the delay ring the to-be-probed location
          (`cue_color`/`cue_thickness`; the defaults match the probe ring) for this long
          before the response field appears. 0 = off. */
      retrocue_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, cover the occupied locations with a `mask_type` mask for this many ms
          starting the moment the array goes off (a backward mask that cuts encoding
          off); the blank `delay_time` then runs in full. Skipped when do_test is false. 0 = off. */
      mask_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Mask kind: a key in BradyUtils.maskKinds ("color-squares", "noise", "scramble";
          extend with BradyUtils.registerMask) or a function(ctx, size, {wheel, rng}). */
      mask_type: { type: jspsych.ParameterType.STRING, default: "color-squares" },
      /** Stimulus noise at encoding: 0 = none; 0..1 = fraction of each item covered by
          the `noise_type` degradation (a transparent overlay over the item's box --
          occlusion for images/words; removed at array offset). */
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
      /** Delay (ms) from start (click or trial onset), or from the end of the pre-cue, to array onset. */
      delay_start: { type: jspsych.ParameterType.INT, default: 500 },
      /** Where the typed-response field appears: "center" (at fixation) or "bottom" (below the stage). */
      response_location: { type: jspsych.ParameterType.STRING, default: "center" },
      /** Input field type: "text" or "number". */
      input_type: { type: jspsych.ParameterType.STRING, default: "text" },
      /** Min value (number inputs only); null to omit. */
      input_min: { type: jspsych.ParameterType.INT, default: null },
      /** Max value (number inputs only); null to omit. */
      input_max: { type: jspsych.ParameterType.INT, default: null },
      /** Step (number inputs only); null to omit. */
      input_step: { type: jspsych.ParameterType.FLOAT, default: null },
      /** Placeholder text shown in the empty input field. */
      input_placeholder: { type: jspsych.ParameterType.STRING, default: "" },
      /** Label on the submit button. */
      button_label: { type: jspsych.ParameterType.STRING, default: "Submit" },
      /**
       * The expected answer used to score accuracy. If null (default), the spec of
       * the probed item (stimuli[which_test]) is used. Scoring trims leading/trailing
       * whitespace, treats any run of internal whitespace as one space ("ice  cream"
       * matches "ice cream"), and ignores case. When both
       * sides parse fully as numbers they are compared numerically ("07" and "7.0"
       * match "7"). Set this when the typed answer differs from the displayed spec
       * (e.g. a label for an image, or a word for a color).
       */
      correct_answer: { type: jspsych.ParameterType.STRING, default: null },
      /** Show "Correct!"/"Incorrect" + a green/red highlight after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Override URL for the correct-response sound (else win.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Override URL for the incorrect-response sound (else lose.mp3). */
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Optional HTML shown beneath the display. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Background color of the stimulus box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the stimulus box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) from probe onset to submitting the typed answer (the click, or the Enter KeyDown). The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click on the Submit button. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null when the answer was submitted with the Enter key (see key_hold_duration) or not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** How long (ms) the Enter key was held when submitting by keyboard: KeyDown -> KeyUp. The keyboard counterpart of mouse_hold_duration; at most one of the two is non-null per response. There is no key_presses log: every typed character would land in it, which makes the multi-key exclusion meaningless for a typing field. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** The raw value typed by the participant (untrimmed). */
      response: { type: jspsych.ParameterType.STRING },
      /** Whether the typed answer matched the expected answer (see correct_answer); null if there is no answer to score against or no test. */
      correct: { type: jspsych.ParameterType.BOOL },
      /** The expected answer used for scoring (null if none). */
      target: { type: jspsych.ParameterType.STRING },
      /** Index of the probed item (after clamping). */
      which_test: { type: jspsych.ParameterType.INT },
      /** Placeholder index of each presented item. */
      positions: { type: jspsych.ParameterType.INT, array: true },
      /** The studied item specs (colors/degrees/images/text), as given. */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Measured time (ms) from array onset to hide, via performance.now() at the paint and clear calls. */
      actual_display_time: { type: jspsych.ParameterType.INT },
      /** Same value as actual_display_time (kept under the name the other plugins use). */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** One entry per item: `position` (placeholder index), `order` (index in the list, which is also the sequential presentation order), `value` (spec), `probed`, and `src`/`color`/`text`. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RecallPlugin {
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

      // ---- Resolve memory items (color / image / wheel-degree / text) ----
      const specs = trial.stimuli.slice();
      const setSize = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));

      // ---- Preload any images, then build and run the trial ----
      // trial() stays synchronous: an async trial() would end as soon as it returned.
      U.loadImages(items.filter((it) => it.kind === "image").map((it) => it.src)).then((imgCache) => {

      // ---- Choose item locations ----
      // Warn (only) about stimuli / which_test / item_positions mistakes.
      U.validatePlacement(trial, { plugin: "recall", setSize: setSize, supportsEnsemble: false, values: specs });
      U.checkParams(trial, { plugin: "recall", setSize: setSize,
        enums: { response_location: ["center", "bottom"], input_type: ["text", "number"], item_type: ["auto", "color", "image", "text"] } });
      // Clamp an out-of-range which_test (validatePlacement only warns) so the probe is a
      // real item. With no stimuli this gives -1, and the probe/scoring paths treat it as none.
      // Clamped values live in locals: trial is jsPsych's stored copy of the parameters
      // (save_trial_parameters reads it), so it is never modified.
      const whichTest = U.whichTestIndex(trial.which_test, setSize, { plugin: "recall" });
      // Expected answer for scoring, taken after the clamp so it is the item actually probed.
      const target =
        trial.correct_answer != null
          ? trial.correct_answer
          : (whichTest >= 0 ? specs[whichTest] : null);
      // item_positions -> one distinct slot per item (U.resolvePositions: invalid and repeated
      // slots dropped, missing ones padded with random unused slots), with enough
      // placeholders for every item and every slot used.
      const placed = U.resolvePositions(trial, setSize, { jsPsych: jsPsych });
      const numPh = placed.nph;
      const pos = placed.pos;

      // ---- Layout ----
      const boxSize = 2 * trial.radius + trial.item_size + 60;
      const center = boxSize / 2;
      const startText = trial.click_to_start ? "Click the + to start this trial." : "";

      // The response field goes at the stage centre (over the hidden fixation) or in a
      // panel below the stage. Its slot exists from the start, so the box does not move
      // when the field appears.
      const respCenter = trial.response_location === "center";
      let stageHTML = "";
      for (let i = 0; i < numPh; i++) {
        const top = Math.cos((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        const left = Math.sin((2 * Math.PI * i) / numPh) * trial.radius + center - trial.item_size / 2;
        stageHTML +=
          `<div id="recall-item-${i}" style="position:absolute;box-sizing:border-box;` +
          `border:1px solid #222;display:flex;align-items:center;justify-content:center;` +
          `width:${trial.item_size}px;height:${trial.item_size}px;top:${top}px;left:${left}px"></div>`;
      }
      stageHTML +=
        `<span id="recall-fixation" style="position:absolute;top:${center - 10}px;left:${center - 6}px;cursor:pointer">+</span>` +
        `<div id="recall-message" style="position:absolute;top:8px;width:100%;text-align:center">${startText}</div>` +
        // center: the response holder sits inside the stage, centred on fixation.
        (respCenter
          ? `<div id="recall-response" style="position:absolute;top:${center}px;left:0;width:100%;transform:translateY(-50%);text-align:center"></div>`
          : "");
      // bottom: the field and prompt go in a reserved panel below the stage, inside the box.
      // center: the box stays square and the prompt goes below it.
      const panelHTML = respCenter ? "" :
        // 140px covers the 32pt input + 18pt button (~105-115px rendered), so the box does
        // not grow after auto_zoom has sized it.
        `<div id="recall-response" style="min-height:140px"></div>` +
        (trial.prompt ? `<div style="margin-top:8px">${trial.prompt}</div>` : "");
      let html = U.stageBox({ idPrefix: "recall", width: boxSize, background: trial.background_color }, stageHTML, panelHTML);
      if (respCenter && trial.prompt) html += `<div style="text-align:center;margin-top:8px">${trial.prompt}</div>`;
      display_element.innerHTML = html;
      if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#recall-box"));

      const itemEl = (p) => display_element.querySelector(`#recall-item-${p}`);
      const setMsg = (h) => (display_element.querySelector("#recall-message").innerHTML = h);

      // ---- State ----
      let probeOnset = null;
      // One-shot guard shared by Enter and the Submit button. Without it a held Enter
      // (auto-repeat), or a click while Enter is still down, would call submit() twice and
      // finish the trial twice.
      let submitted = false;
      let arrayOnset = null;
      let actualDisplay = null;

      // ---- Render helpers -----------------------------------------------------
      // Noise overlays, keyed by placeholder index; removed on clear/hide.
      const noiseRemovers = {};
      const clearNoise = (p) => { if (noiseRemovers[p]) { noiseRemovers[p](); delete noiseRemovers[p]; } };
      const paintItem = (p, item) => {
        const el = itemEl(p);
        if (item.kind === "image") {
          const ok = imgCache[item.src];
          el.innerHTML = ok
            ? `<img src="${item.src}" style="width:100%;height:100%;object-fit:contain">`
            : "";
        } else if (item.kind === "color") {
          el.style.background = item.css;
        } else {
          el.innerHTML = `<span style="font-size:${trial.font_size}">${item.text}</span>`;
        }
        // Noise goes on a transparent overlay over the item's box; the item is untouched.
        clearNoise(p);
        if (trial.noise_level > 0) {
          noiseRemovers[p] = U.noiseOverlay(el, trial.noise_level, trial.noise_type, { wheel });
        }
      };
      const clearItem = (p) => {
        const el = itemEl(p);
        clearNoise(p);
        el.innerHTML = "";
        el.style.background = "";
      };

      // ---- Phases -------------------------------------------------------------
      const start = () => {
        setMsg("");
        const fix = display_element.querySelector("#recall-fixation");
        fix.style.cursor = "auto";
        fix.removeEventListener("click", start);
        if (trial.precue_time > 0 && trial.do_test) {
          // Pre-cue ring on the to-be-probed location, then delay_start, then the array.
          // No pre-cue on an encoding-only trial (do_test false): there is no probe to cue.
          const clearCue = U.spatialCue(itemEl(pos[whichTest]), { color: trial.cue_color, thickness: trial.cue_thickness });
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
        actualDisplay = Math.round(performance.now() - arrayOnset);
        for (let i = 0; i < setSize; i++) clearItem(pos[i]);
        // Blank retention interval: delay_time runs in full whether or not a mask
        // came first.
        const startDelay = () => {
          jsPsych.pluginAPI.setTimeout(trial.do_test ? afterDelay : () => finish(null), trial.delay_time);
        };
        // Backward mask: mask_type replaces the array at its offset, with no blank gap, so
        // that it cuts encoding off. It covers the occupied locations for mask_time ms and
        // the retention interval starts when it comes off.
        // Skipped when mask_time is 0 or do_test is false.
        if (trial.mask_time > 0 && trial.do_test) {
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

      // Optional retro-cue: ring only the to-be-probed location for retrocue_time ms. It is
      // not cleared, because showProbe overwrites it with the probe ring.
      const afterDelay = () => {
        if (trial.retrocue_time > 0) {
          const probePos = pos[whichTest];
          if (probePos != null) U.spatialCue(itemEl(probePos), { color: trial.cue_color, thickness: trial.cue_thickness });
          jsPsych.pluginAPI.setTimeout(showProbe, trial.retrocue_time);
        } else {
          showProbe();
        }
      };

      const showProbe = () => {
        // Ring the probed location and show the response field.
        const probePos = pos[whichTest];
        if (probePos != null) itemEl(probePos).style.boxShadow = "0 0 0 5px #000";
        if (trial.response_location === "center") {
          display_element.querySelector("#recall-fixation").style.display = "none";
        }

        const minAttr = trial.input_min != null ? ` min="${trial.input_min}"` : "";
        const maxAttr = trial.input_max != null ? ` max="${trial.input_max}"` : "";
        const stepAttr = trial.input_step != null ? ` step="${trial.input_step}"` : "";
        const phAttr = trial.input_placeholder ? ` placeholder="${trial.input_placeholder}"` : "";
        setResponseHTML(
          `<input type="${trial.input_type}" id="recall-input"${minAttr}${maxAttr}${stepAttr}${phAttr} ` +
          `style="font-size:32pt;text-align:center;width:6em">` +
          `<br><button class="jspsych-btn" id="recall-submit" style="font-size:18pt;margin-top:8px">${trial.button_label}</button>`
        );

        const input = display_element.querySelector("#recall-input");
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (e.repeat) return;   // a held Enter auto-repeats; it is still one response
            if (submitted) return;
            submitted = true;
            // Enter-to-submit is a keyboard response, so it records a hold (CONVENTIONS §11).
            // Consume any pending click first, so a click that only focused the field is
            // never credited here. No press log (see key_hold_duration in info.data).
            U.mouseHoldDuration();
            // Stamp rt here, at KeyDown. submit() runs after the release, and timing it
            // there would fold the hold into rt, coupling rt to key_hold_duration.
            const at = performance.now();
            U.awaitKeyUp(e.key).then(finishOnce.guard((keyHold) => submit(null, keyHold, at)));
          }
        });
        display_element.querySelector("#recall-submit").addEventListener("click", onSubmitClick);
        input.focus();
        probeOnset = performance.now();
      };

      // ---- Response / scoring -------------------------------------------------
      // The hold is read before any guard, so an ignored click (empty field, or Enter
      // already pending) still consumes its own press.
      const onSubmitClick = () => {
        const hold = U.mouseHoldDuration();
        if (submitted) return;
        submitted = true;
        submit(hold, null, performance.now());
      };

      // `at` is the response timestamp: the click time, or the Enter KeyDown time (an Enter
      // press reaches submit() only after its release).
      const submit = (hold, keyHold, at) => {
        const input = display_element.querySelector("#recall-input");
        if (!input) return;                                    // already torn down
        const value = input.value;
        if (value == null || String(value).length < 1) {       // require an entry
          submitted = false;                                   // let them try again
          return;
        }
        const rt = Math.round((at == null ? performance.now() : at) - probeOnset);
        const correct = target == null ? null : looseEqual(value, target);

        // Lock the UI.
        display_element.querySelector("#recall-submit").removeEventListener("click", onSubmitClick);
        display_element.querySelector("#recall-submit").disabled = true;
        input.disabled = true;

        if (trial.feedback && correct !== null) {
          const probePos = pos[whichTest];
          if (probePos != null) itemEl(probePos).style.boxShadow = `0 0 0 5px ${correct ? "#2ecc40" : "#ff4136"}`;
          setMsg(correct ? "Correct!" : "Incorrect");
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
          jsPsych.pluginAPI.setTimeout(() => finish({ rt: rt, hold: hold, keyHold: keyHold, value: value, correct: correct }), 800);
        } else {
          finish({ rt: rt, hold: hold, keyHold: keyHold, value: value, correct: correct });
        }
      };

      // ---- Finish -------------------------------------------------------------
      // resp is null for encoding-only (do_test:false) trials.
      const finish = (resp) => {
        // The full studied list (position, order, value), for swap/interference analyses.
        const stimuli_shown = specs.map((s, i) => {
          const it = items[i];
          const entry = {
            position: pos[i],             // placeholder index of this item
            order: i,                     // index into the studied list
            value: s,                     // item spec as given (degree / color / image / text)
            probed: i === whichTest, // whether this item's location was probed
          };
          if (it.kind === "image") entry.src = it.src;
          else if (it.kind === "color") entry.color = it.css;
          else entry.text = it.text;
          return entry;
        });
        const data = {
          rt: resp ? resp.rt : null,
          mouse_hold_duration: resp && resp.hold != null ? resp.hold : null,
          key_hold_duration: resp && resp.keyHold != null ? resp.keyHold : null,
          response: resp ? resp.value : null,
          correct: resp ? resp.correct : null,
          target: target != null ? String(target) : null,
          which_test: whichTest,
          positions: pos,
          stimuli: specs,
          actual_display_time: actualDisplay,
          actual_stim_duration: actualDisplay, // alias of actual_display_time
          stimuli_shown: stimuli_shown,
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
        finishOnce(data);
      };

      // ---- small DOM helper ----
      const setResponseHTML = (h) => (display_element.querySelector("#recall-response").innerHTML = h);

      // ---- Kick off -----------------------------------------------------------
      if (trial.click_to_start) {
        display_element.querySelector("#recall-fixation").addEventListener("click", start);
      } else {
        start();
      }

      }); // end loadImages().then
    }
  }
  RecallPlugin.info = info;

  // ===== module-private helpers =====
  // Scoring match for typed recall: numeric compare when both sides parse fully as
  // numbers (so "07"/"7.0" match 7), otherwise a trimmed, case-insensitive compare in
  // which any run of whitespace counts as one space ("ice  cream" matches "ice cream").
  function looseEqual(a, b) {
    var sa = String(a).trim().replace(/\s+/g, " "), sb = String(b).trim().replace(/\s+/g, " ");
    // Number(), not parseFloat, so "7abc" does not count as 7.
    var na = Number(sa), nb = Number(sb);
    if (sa !== "" && sb !== "" && !isNaN(na) && !isNaN(nb) && na === nb) return true;
    return sa.toLowerCase() === sb.toLowerCase();
  }
  return RecallPlugin;
})(jsPsychModule);
