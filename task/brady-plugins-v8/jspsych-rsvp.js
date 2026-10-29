/*
 * jspsych-rsvp.js  --  jsPsych v8 plugin
 *
 * Rapid serial visual presentation. Shows a stream of stimuli one at a time at
 * the same screen location, each for item_duration ms with an optional blank ISI
 * after it. Records the stream order and the measured on/off time of every item.
 *
 * Each stream item may be a color, a color-wheel degree, an image, or text, mixed
 * freely (see `stimuli` / `item_type`, resolved via BradyUtils.resolveItem). All
 * items are painted into one shared canvas, so every kind renders in the same spot
 * at the same size.
 *
 * Timing: items are scheduled with jsPsych.pluginAPI.setTimeout, chained item to
 * item, not locked to display frames. Each on/off time is stamped with
 * performance.now() when the canvas is painted or cleared, which is when the draw
 * call runs, not when the frame reaches the screen. Durations therefore come out
 * in whole-frame steps on screen (about 16.7 ms at 60 Hz) and can run a frame long;
 * check actual_stim_timing / actual_isi_timing rather than assuming the requested
 * values. With isi 0 the next item replaces the current one directly, with no
 * blank in between.
 *
 * By default no response is collected. `response_keys` adds a key-detection
 * response for target-detection designs; it never ends the trial early, since the
 * stream's own timing ends the trial. Responses are timed from stream onset, and
 * each one records `item`, the most recently painted item, and `during_isi`, whether
 * the blank after that item was showing at the keypress.
 *
 * Trial-ending rule (CONVENTIONS.md §3): timer driven, so trial() is synchronous
 * and calls this.jsPsych.finishTrial(data) once (through U.makeFinisher) when the
 * stream ends.
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js, then this file
 * (each via a <script> tag).
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychRsvp = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "rsvp",
    version: version,
    parameters: {
      /**
       * The stream, in presentation order. Each entry may be a number (degree
       * on the color wheel), a CSS color string ("rgb(255,0,0)", "#0f0"), a
       * "lab(L,a,b)" string, an image path ("dog.png", "img/x.jpg"), or text ("cat").
       * Required.
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: undefined },
      /** Force interpretation of `stimuli`: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /**
       * Color wheel used to turn degrees into colors. Defaults to the global
       * window.BradyColorWheel. Pass your own { rgb(deg), css(deg) } to swap it.
       */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * Time in ms each stimulus is shown. A single value (or length-1 array)
       * applies to every item; otherwise give one value per item. A shorter array
       * is padded with its last value (with a console warning). Declared OBJECT, not
       * INT, because jsPsych 8 coerces a non-array INT parameter to a number and
       * would turn a per-item array into NaN.
       */
      item_duration: { type: jspsych.ParameterType.OBJECT, default: 100 },
      /**
       * Blank inter-stimulus interval (ms) after each item, including the last.
       * A single value (or length-1 array) applies to every item; otherwise one per
       * item (a shorter array is padded with its last value). Default 0: items are
       * back to back with no blank frame between them. OBJECT for the same reason
       * as item_duration.
       */
      isi: { type: jspsych.ParameterType.OBJECT, default: 0 },
      /** Size (px) of the square presentation area / each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 200 },
      /** Background color of the presentation box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#ffffff" },
      /** Optional HTML shown beneath the stream (e.g. task instructions). */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: null },
      /**
       * Optional keys to listen for during the stream (e.g. ["f"] to flag a
       * detected target). null (default) collects no response. Every press of a
       * listed key is logged (a held key counts once); none ends the trial early.
       */
      response_keys: { type: jspsych.ParameterType.KEYS, default: null },
      /** Scale the presentation box with CSS transform to fill the window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
    },
    data: {
      /** The stream item specs, in presentation order (as given / resolved). */
      stimuli: { type: jspsych.ParameterType.STRING, array: true },
      /** Requested per-item display durations (ms), expanded to one per item. */
      item_duration: { type: jspsych.ParameterType.INT, array: true },
      /** Requested per-item ISIs (ms), expanded to one per item. */
      isi: { type: jspsych.ParameterType.INT, array: true },
      /** Measured time (ms) from each item's paint call to its clear call (or to the next item's paint, when isi is 0). */
      actual_stim_timing: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured blank time (ms) after each item; 0 when isi is 0. */
      actual_isi_timing: { type: jspsych.ParameterType.FLOAT, array: true },
      /** Measured duration (ms) of the whole stream: first item onset to last item offset. */
      actual_stim_duration: { type: jspsych.ParameterType.INT },
      /** All key responses during the stream: [{ key, rt, item, during_isi }]. rt is ms from stream onset (first item painted). item is the index of the most recently painted item (null before the first one), so a press during a blank ISI is credited to the item just before it. during_isi is true if that item had already been cleared (the press fell in its blank ISI, including the blank after the last item), false while it was on screen. Both are stamped when the key event is handled, not at the screen refresh. */
      responses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** RT (ms, from stream onset) of the first response, or null. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** Key of the first response, or null. */
      response: { type: jspsych.ParameterType.STRING },
      /** How long (ms) the first response key was held down: KeyDown -> KeyUp. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable (still held at stream end, window blurred). Later responses' holds are in key_presses. */
      key_hold_duration: { type: jspsych.ParameterType.INT },
      /** Every key pressed during the stream (any key, not only response_keys): {key, t (ms from stream onset), duration}. `duration` is null for a key still held when the stream ended (it still counts for the multi-key exclusion). Only when response_keys is set; else null. */
      key_presses: { type: jspsych.ParameterType.OBJECT, array: true },
      /** True if a key other than the recorded response was also pressed (the standard RD exclusion criterion). */
      multiple_keys_pressed: { type: jspsych.ParameterType.BOOL },
      /** One entry per stream item: `position` (serial position), `kind`, `spec`, the resolved `src`/`text`/`css` (+ `degree` for numeric specs), and its requested `item_duration`/`isi`. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class RsvpPlugin {
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
      U.checkParams(trial, { plugin: "rsvp", enums: { item_type: ["auto", "color", "image", "text"] } });

      // ---- Resolve the stream items (color / image / text / wheel-degree) ----
      const specs = trial.stimuli.slice();
      const n = specs.length;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));

      // ---- Expand timing arrays (length 1 -> applies to all items) ----
      const durations = expand(trial.item_duration, n);
      const isis = expand(trial.isi, n);

      // ---- Preload images, then build and run (trial() stays synchronous) ----
      U.loadImages(items.filter((it) => it.kind === "image").map((it) => it.src)).then((imgCache) => {

        // ---- Build the DOM: one square box with a single shared canvas ----
        const s = trial.item_size;
        let html =
          `<div id="rsvp-box" style="position:relative;margin:0 auto;border:1px solid #000;box-sizing:content-box;` +
          `width:${s}px;height:${s}px;background:${trial.background_color}">` +
          `<canvas id="rsvp-canvas" width="${s}" height="${s}" ` +
          `style="display:block"></canvas></div>`;
        if (trial.prompt) html += trial.prompt;
        display_element.innerHTML = html;
        if (trial.auto_zoom) U.autoZoom(display_element.querySelector("#rsvp-box"));

        const ctx = display_element.querySelector("#rsvp-canvas").getContext("2d");

        // ---- State / recording ----
        const actualStimTiming = [];
        const actualISITiming = [];
        const responses = [];
        let streamStart = null;
        let lastStimOffset = null; // offset (clear) time of the most recent item
        let curItem = null;        // index of the most recently painted item (null before the first)
        let inIsi = false;         // true while that item has been cleared (blank ISI)
        let kbListener = null;

        // ---- Optional (non-interrupting) key-detection response ----
        if (trial.response_keys) {
          // Log every key released from here on, so each response's hold (and any extra
          // keys) can be read back at stream end; the timer-driven stream never waits on a
          // release. The log opens in the same task as the first paint, so its t is
          // effectively ms from stream onset.
          U.beginPressLog();
          kbListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: (resp) => {
              responses.push({ key: resp.key, rt: Math.round(performance.now() - streamStart), item: curItem, during_isi: inIsi });
            },
            valid_responses: trial.response_keys,
            rt_method: "performance",
            persist: true, // listen for the whole stream
            allow_held_key: false,
          });
        }

        // ---- Stream scheduler (timer-driven; the trial ends when the stream does) ----
        const showItem = (i) => {
          if (i >= n) return finish();
          U.paintItem(ctx, items[i], s, imgCache);
          curItem = i;
          inIsi = false;
          const onset = performance.now();
          if (i === 0) streamStart = onset;
          jsPsych.pluginAPI.setTimeout(() => {
            // With no ISI the next item is painted in this same task (paintItem clears the
            // canvas first). Clearing here and painting from a 0 ms timer would let the
            // browser render a blank frame between back-to-back items.
            if (!(isis[i] > 0) && i + 1 < n) {
              lastStimOffset = performance.now();
              actualStimTiming.push(lastStimOffset - onset);
              actualISITiming.push(0);
              showItem(i + 1);
              return;
            }
            // Blank the canvas and record the item's on-time, then wait out the ISI.
            ctx.clearRect(0, 0, s, s);
            inIsi = true;
            lastStimOffset = performance.now();
            actualStimTiming.push(lastStimOffset - onset);
            const isiStart = performance.now();
            jsPsych.pluginAPI.setTimeout(() => {
              actualISITiming.push(performance.now() - isiStart);
              showItem(i + 1);
            }, isis[i]);
          }, durations[i]);
        };

        // ---- Finish ----
        const finish = () => {
          if (kbListener) jsPsych.pluginAPI.cancelKeyboardResponse(kbListener);
          display_element.innerHTML = "";
          // The presented stream in order, with resolved values and requested timing.
          const stimuli_shown = items.map((it, i) => {
            const entry = { position: i, kind: it.kind, spec: specs[i], item_duration: durations[i], isi: isis[i] };
            if (it.kind === "image") entry.src = it.src;
            else if (it.kind === "text") entry.text = it.text;
            else {
              entry.css = it.css;
              // resolveItem doesn't carry .degree; recover it from a numeric (wheel-degree) spec.
              if (typeof specs[i] === "number") entry.degree = U.wrap360(specs[i]);
            }
            return entry;
          });
          // The first response's hold is read from the press log, so nothing delays the
          // stream-timed end of the trial. A key still held at stream end has no release,
          // so its hold is null.
          const pressLog = trial.response_keys ? U.endPressLog() : null;
          const firstKey = responses.length ? responses[0].key : null;
          const firstRow = firstKey && pressLog
            ? pressLog.filter((p) => p.key === String(firstKey).toLowerCase())[0]
            : null;
          const data = {
            stimuli: specs,
            item_duration: durations,
            isi: isis,
            actual_stim_timing: actualStimTiming,
            actual_isi_timing: actualISITiming,
            actual_stim_duration:
              streamStart != null && lastStimOffset != null
                ? Math.round(lastStimOffset - streamStart)
                : null,
            responses: responses,
            rt: responses.length ? responses[0].rt : null,
            response: firstKey,
            ...U.keyHoldData(firstRow ? firstRow.duration : null, firstKey, pressLog),
            stimuli_shown: stimuli_shown,
          };
          data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
          if (trial.data) Object.assign(data, trial.data); // preserve experimenter-provided fields (they win on key collision)
          finishOnce(data);
        };

        // ---- Kick off the stream ----
        showItem(0);
      });
    }
  }
  RsvpPlugin.info = info;

  // ===== module-private helpers =====

  // Expand a timing spec (number or array) to exactly `n` per-item values. A scalar or
  // length-1 array applies to all items; a shorter array is padded with its last value
  // (with a warning) so trailing items do not get undefined, i.e. 0 ms.
  function expand(spec, n) {
    const arr = Array.isArray(spec) ? spec : [spec];
    if (arr.length === 1) return Array(n).fill(arr[0]);
    if (arr.length >= n) return arr.slice(0, n);
    U.warnOnce("rsvp", "a timing array has " + arr.length + " value(s) for " + n +
      " items; padding by repeating the last value (give 1 or " + n + " values to be explicit).");
    const out = arr.slice();
    while (out.length < n) out.push(arr[arr.length - 1]);
    return out;
  }

  return RsvpPlugin;
})(jsPsychModule);
