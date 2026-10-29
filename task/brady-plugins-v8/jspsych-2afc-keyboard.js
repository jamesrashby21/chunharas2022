/*
 * jspsych-2afc-keyboard.js  --  jsPsych v8 plugin
 *
 * Forced choice between options shown side by side, answered with the keyboard.
 * choice_keys[i] picks the option at spatial position i, counting from the left
 * (so with ["f","j"], f = left, j = right). Two options is classic 2-AFC, but
 * any number works.
 *
 * Options can be colors, color-wheel degrees, images, or words, mixed freely
 * (see `stimuli` and `item_type`).
 *
 * Sequence: [grayscale preview, preview_duration] -> [prompt alone with the
 * options hidden, prompt_lead_time] -> options visible + keyboard live -> keyup
 * -> [feedback]. rt is timed from the last step's onset.
 *
 * Key options:
 *   shuffle_options     -- randomize the left-to-right order (default true)
 *   color_rotation_deg  -- per-option CIELAB hue rotation for image options
 *   preview_duration / prompt_lead_time -- the optional phases above
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsych2afcKeyboard = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "2afc-keyboard",
    version: version,
    parameters: {
      /**
       * The options to choose between, in canonical order. Each entry may be a
       * number (color-wheel degree), a CSS color / "lab(...)" string, an image
       * path, or a word. One per choice key. Required.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: undefined },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Color wheel for degree lookups (defaults to window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Keys for the spatial positions, left to right (e.g. ["f","j"]): choice_keys[i]
          picks whichever option is drawn at position i. Same name as wm-forced-choice.
          Keys beyond the number of options are ignored. */
      choice_keys: { type: jspsych.ParameterType.KEYS, array: true, default: ["f", "j"] },
      /** Canonical index (into `stimuli`, not the shuffled position) of the correct option,
          for accuracy and feedback, or null. Same name as wm-forced-choice. */
      correct_option: { type: jspsych.ParameterType.INT, default: null },
      /**
       * Optional per-stimulus hue rotation (deg) in CIELAB, indexed like `stimuli`,
       * applied to image options only. Empty (default) or 0 = image shown unmodified.
       */
      color_rotation_deg: { type: jspsych.ParameterType.INT, array: true, default: [] },
      /** Randomize the left-to-right order of the options (as in wm-forced-choice). */
      shuffle_options: { type: jspsych.ParameterType.BOOL, default: true },
      /** If > 0, show the options in grayscale for this long first; the keyboard is not
          yet live. */
      preview_duration: { type: jspsych.ParameterType.INT, default: 0 },
      /** If > 0, show the prompt alone (options hidden) for this long, then reveal the
          options and enable the keyboard together. */
      prompt_lead_time: { type: jspsych.ParameterType.INT, default: 0 },
      /** Optional HTML shown beneath the options (e.g. the question). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /** Size (px) of color and word options. Images use stimulus_width/height or their
          natural size. */
      item_size: { type: jspsych.ParameterType.INT, default: 120 },
      /** Explicit image width/height (px); null leaves natural size. Giving only one keeps
          the aspect ratio. */
      stimulus_width: { type: jspsych.ParameterType.INT, default: null },
      stimulus_height: { type: jspsych.ParameterType.INT, default: null },
      /** Briefly highlight the chosen (and correct) option after responding. */
      feedback: { type: jspsych.ParameterType.BOOL, default: false },
      /** Play a win/lose sound on feedback. */
      feedback_sound: { type: jspsych.ParameterType.BOOL, default: true },
      /** Fire a confetti burst on a correct response. */
      feedback_confetti: { type: jspsych.ParameterType.BOOL, default: true },
      /** Optional sound URL overrides played on correct / incorrect responses (else win.mp3 / lose.mp3). */
      correct_sound: { type: jspsych.ParameterType.STRING, default: null },
      incorrect_sound: { type: jspsych.ParameterType.STRING, default: null },
      /** Scale the options box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** Response time (ms) from when the options are visible and the keyboard is live (after any preview / prompt lead time) to the keydown. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** The key the participant pressed. */
      response: { type: jspsych.ParameterType.STRING },
      /** How long (ms) the response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (key never released, window blurred). */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed from response onset until the response key is released (feedback time excluded): {key, t (ms from response onset), duration}. `duration` is null for a key still held when the window closed (it still counts for the multi-key exclusion). */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** Left-to-right position chosen (0 = leftmost). Named to match wm-forced-choice. */
      chosen_position: { type: jspsych.ParameterType.INT },
      /** Canonical index (into `stimuli`) of the chosen option. Named to match wm-forced-choice. */
      chosen_option: { type: jspsych.ParameterType.INT },
      /** Whether the choice was correct (null if no correct_option given). */
      correct: { type: jspsych.ParameterType.BOOL },
      /** Left-to-right order of stimulus indices as shown (matches wm-forced-choice). */
      option_order: { type: jspsych.ParameterType.INT, array: true },
      /** The option specs, in canonical order (as given). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Every option shown, in left-to-right order: {position, index (canonical), rotation (hue rotation applied, deg; always 0 for color and word options, which are never rotated)} plus {src} for an image, {text} for a word, or {value: the color spec as given}. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class TwoAfcKeyboardPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    async trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      // Warn (only) about bad parameter values and key/option count mismatches.
      U.checkParams(trial, { plugin: "2afc-keyboard", enums: { item_type: ["auto", "color", "image", "text"] } });
      if (trial.choice_keys.length !== trial.stimuli.length) {
        U.warnOnce("2afc-keyboard", "choice_keys has " + trial.choice_keys.length + " key(s) but there are " +
          trial.stimuli.length + " option(s); give one key per option (e.g. choice_keys: [\"f\",\"j\"] for 2 options).");
      }
      if (trial.correct_option != null && (trial.correct_option < 0 || trial.correct_option >= trial.stimuli.length)) {
        U.warnOnce("2afc-keyboard", "correct_option=" + trial.correct_option + " is out of range for " +
          trial.stimuli.length + " option(s) (valid 0.." + (trial.stimuli.length - 1) + ", or null); accuracy will be wrong.");
      }

      // ---- Spatial order (position -> stimulus index) ----
      let order = trial.stimuli.map((_, i) => i);
      if (trial.shuffle_options) order = jsPsych.randomization.shuffle(order);

      // ---- Build the row of options ----
      const wrap = document.createElement("div");
      wrap.id = "afc-stimuli";
      wrap.style.cssText = "display:flex;gap:40px;justify-content:center;align-items:center";

      // Hue rotation actually applied to option idx: images only.
      const rotationFor = (idx, item) =>
        item.kind === "image" && trial.color_rotation_deg.length ? (trial.color_rotation_deg[idx] || 0) : 0;

      const loads = [];
      order.forEach((idx, posIndex) => {
        const item = U.resolveItem(trial.stimuli[idx], wheel, forceType);
        let el;
        if (item.kind === "color") {
          el = document.createElement("div");
          el.style.cssText =
            `width:${trial.item_size}px;height:${trial.item_size}px;border-radius:50%;` +
            `border:1px solid #222;background:${item.css}`;
        } else if (item.kind === "text") {
          el = document.createElement("div");
          el.textContent = item.text;
          el.style.cssText =
            `min-width:${trial.item_size}px;height:${trial.item_size}px;display:flex;` +
            `align-items:center;justify-content:center;font-size:${Math.round(trial.item_size / 4)}px`;
        } else {
          const rot = rotationFor(idx, item);
          if (rot) {
            el = document.createElement("canvas");
            loads.push(drawRotated(el, item.src, rot, trial.stimulus_width, trial.stimulus_height));
          } else {
            el = document.createElement("img");
            el.src = item.src;
            if (trial.stimulus_width) el.width = trial.stimulus_width;
            if (trial.stimulus_height) el.height = trial.stimulus_height;
          }
        }
        el.dataset.idx = idx; // stimulus identity
        el.dataset.pos = posIndex; // spatial position
        wrap.appendChild(el);
      });

      const box = document.createElement("div");
      box.id = "afc-box";
      const promptDiv = document.createElement("div");
      promptDiv.id = "afc-prompt";
      promptDiv.style.cssText = "margin-top:16px;text-align:center;min-height:1.5em";
      box.appendChild(wrap);
      box.appendChild(promptDiv);
      display_element.innerHTML = "";
      display_element.appendChild(box);

      await Promise.all(loads); // wait for any hue-rotated canvases to draw
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Optional grayscale preview ----
      if (trial.preview_duration > 0) {
        wrap.style.filter = "grayscale(1)";
        await wait(jsPsych, trial.preview_duration);
        wrap.style.filter = "none";
      }

      // ---- Optional lead time: the prompt alone with the options hidden, then the
      //      options appear and the keyboard goes live together (rt starts there). ----
      if (trial.prompt) promptDiv.innerHTML = trial.prompt;
      if (trial.prompt_lead_time > 0) {
        wrap.style.visibility = "hidden";
        await wait(jsPsych, trial.prompt_lead_time);
        wrap.style.visibility = "visible";
      }

      // ---- Collect the keyboard response ----
      // Log every key pressed from response onset, so trials with more than one
      // response key can be excluded (see info.data).
      U.beginPressLog();
      // Only keys that have an option: a surplus key would select a position with no
      // option and record chosen_option undefined.
      const liveKeys = trial.choice_keys.slice(0, order.length);
      const response = await new Promise((resolve) => {
        jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: resolve,
          valid_responses: liveKeys,
          rt_method: "performance",
          persist: false,
        });
      });

      // getKeyboardResponse fires on keydown, before the hold is known, so wait for the
      // release (CONVENTIONS §11). RDs run ~100 ms, so this costs the trial little.
      const key_hold_duration = await U.awaitKeyUp(response.key);
      // Close the log at the release, so keys pressed during feedback don't count.
      const pressLog = U.endPressLog();

      // Key -> spatial position (choice_keys order) -> canonical option (order[position]).
      const position = liveKeys.findIndex((k) => jsPsych.pluginAPI.compareKeys(k, response.key));
      const choice = order[position];
      const correct = trial.correct_option === null ? null : choice === trial.correct_option;

      // ---- Optional feedback ----
      if (trial.feedback) {
        const chosenEl = wrap.querySelector(`[data-pos="${position}"]`);
        // Green/red when accuracy is defined; neutral gray when there's no correct answer.
        const chosenColor = correct === null ? "#888" : correct ? "#2ecc40" : "#ff4136";
        if (chosenEl) chosenEl.style.outline = `4px solid ${chosenColor}`;
        if (correct === false && trial.correct_option !== null) {
          const correctEl = wrap.querySelector(`[data-idx="${trial.correct_option}"]`);
          if (correctEl) correctEl.style.outline = "4px solid #2ecc40";
        }
        // Sound/confetti only when accuracy is defined (correct_option set).
        if (correct === true || correct === false) {
          U.feedbackCues(correct, { sound: trial.feedback_sound, confetti: trial.feedback_confetti, sounds: { correct: trial.correct_sound, incorrect: trial.incorrect_sound } });
        }
        await wait(jsPsych, 700);
      }

      // Every option shown, with its spatial position, canonical index, applied hue
      // rotation, and value. resolveItem is pure, so re-resolving gives the same items.
      const stimuli_shown = order.map((idx, posIndex) => {
        const item = U.resolveItem(trial.stimuli[idx], wheel, forceType);
        const rec = { position: posIndex, index: idx, rotation: rotationFor(idx, item) };
        if (item.kind === "image") rec.src = item.src;
        else if (item.kind === "text") rec.text = item.text;
        else rec.value = trial.stimuli[idx]; // color: hue degree or css spec
        return rec;
      });

      // async trial(): returning the data object ends the trial (CONVENTIONS §3).
      const data = {
        rt: Math.round(response.rt),
        response: response.key,
        ...U.keyHoldData(key_hold_duration, response.key, pressLog),
        chosen_position: position,
        chosen_option: choice,
        correct: correct,
        option_order: order,
        stimuli: trial.stimuli,
        stimuli_shown: stimuli_shown,
      };
      data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
      if (trial.data) Object.assign(data, trial.data); // experimenter-provided fields win on key collision
      return data;
    }
  }
  TwoAfcKeyboardPlugin.info = info;

  // ===== helpers =====
  // Promise-wrapped jsPsych timeout (auto-cancelled if the trial ends early).
  function wait(jsPsych, ms) {
    return new Promise((resolve) => jsPsych.pluginAPI.setTimeout(resolve, ms));
  }
  // Load an image, draw it to `canvas`, and rotate every pixel's hue by `deg`.
  // Sizing matches the unrotated <img>: natural size, or w/h, keeping the aspect
  // ratio when only one is given.
  function drawRotated(canvas, src, deg, w, h) {
    return new Promise((resolve) => {
      const img = new Image();
      if (U.needsCors(src)) img.crossOrigin = "anonymous"; // only for cross-origin URLs; crossOrigin can block file:// loads
      img.onload = () => {
        const nw = img.naturalWidth, nh = img.naturalHeight;
        const cw = w || (h && nh ? Math.round((nw * h) / nh) : nw);
        const ch = h || (w && nw ? Math.round((nh * w) / nw) : nh);
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        // CIELAB hue-rotate in place (degrades gracefully on a tainted cross-origin canvas).
        U.rotateCanvasHue(ctx, cw, ch, deg);
        resolve();
      };
      img.onerror = resolve; // don't hang the trial if an image is missing
      img.src = src;
    });
  }
  return TwoAfcKeyboardPlugin;
})(jsPsychModule);
