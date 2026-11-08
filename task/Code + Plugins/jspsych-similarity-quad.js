/*
 * jspsych-similarity-quad.js  --  jsPsych v8 plugin
 *
 * Similarity quad (pair comparison): two pairs of items side by side. The
 * participant clicks the pair that is MOST DIFFERENT, i.e. whose two items are
 * least similar to each other. The responses feed BradySimilarity, which
 * estimates the similarity structure of a stimulus wheel.
 *
 * Items can be color-wheel degrees (disks), orientations (bars, triangles, Gabor
 * patches or gratings, via `item_shape`), CSS colors, images, or text. Two trial sources:
 *   Fixed    -- pass `stimuli` (4 item specs: [pair1a, pair1b, pair2a, pair2b]);
 *               is_coverage_trial and model_score are null.
 *   Adaptive -- pass an `engine` (BradySimilarity.createEngine, one instance
 *               shared across the timeline) and leave `stimuli` empty. The
 *               trial gets its degrees from engine.nextQuad, randomizes which
 *               pair is left/right and each pair's top/bottom order (engine
 *               rng), and calls engine.update() with the displayed degrees
 *               before finishing. `adaptive:false` forces a coverage draw.
 *
 * Stimulus period: an oriented bar (item_shape "line"), a Gabor patch ("gabor")
 * or a grating ("grating") looks the same after a 180-degree turn, so its
 * degrees live in [0,180) and its offsets wrap at 180; disks (hues) and
 * triangles (pointed) use 360 (BradyUtils.shapePeriod). The trial records this
 * as `period`. For an adaptive line/gabor/grating study create the engine with
 * BradySimilarity.createEngine({ period: 180 }); the plugin warns once if the
 * engine's period does not match the shape. Gabors and gratings are achromatic
 * (`grating_options`); with phase "random" each item gets its own phase,
 * recorded in stimuli_shown.
 *
 * Confidence is collected on every trial by default (`collect_confidence`):
 * an inline 4-point word popup anchored to the chosen pair, whose x clears
 * the choice so the participant can choose again.
 *
 * The data store exact degrees and signed pair offsets (`pair_offsets`, in the
 * stimulus period), so a similarity matrix fit to them has the same orientation
 * as memory-error data.
 *
 * Click/timer driven, so trial() is synchronous and calls
 * this.jsPsych.finishTrial(data) later (CONVENTIONS.md section 3).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js,
 * similarity-adaptive-utils.js, then this file.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSimilarityQuad = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "similarity-quad",
    version: version,
    parameters: {
      /**
       * The 4 items as [pair1-top, pair1-bottom, pair2-top, pair2-bottom]; pair1
       * is shown on the left. Each may be a number (color-wheel degree, or
       * orientation degree when `item_shape` is "line"/"triangle"/"gabor"/"grating"), a CSS color /
       * "lab(...)" string, an image path, or text. Numbers are recorded wrapped
       * into [0, period), so a "line" at 200 is recorded (and drawn) as 20. Leave
       * empty to draw the quad from `engine` instead (adaptive mode).
       */
      stimuli: { type: jspsych.ParameterType.STRING, array: true, default: [] },
      /** Force interpretation of items: "auto" (default), "color", "image", or "text". */
      item_type: { type: jspsych.ParameterType.STRING, default: "auto" },
      /** Item shape: "disk" (default; a numeric item is a color-wheel hue), or "line" /
          "triangle" / "gabor" / "grating" (a numeric item is an orientation in degrees;
          0 = horizontal / pointing right, increasing clockwise). Lines and triangles are
          drawn in `item_color`; Gabors and gratings are achromatic, set by
          `grating_options`, with stripes at d running the same way as a "line" at d.
          "line", "gabor" and "grating" repeat every 180 degrees (period 180); "disk" and
          "triangle" repeat every 360. */
      item_shape: { type: jspsych.ParameterType.STRING, default: "disk" },
      /** Fill color for "line"/"triangle" (orientation/shape) items. Gabors and gratings
          are achromatic and ignore it. */
      item_color: { type: jspsych.ParameterType.STRING, default: "#555555" },
      /**
       * Gabor/grating appearance (item_shape "gabor" or "grating"; ignored otherwise). An
       * object; keys you leave out keep their defaults:
       * cycles (4): grating cycles across the item diameter;
       * contrast (1): Michelson contrast 0..1 around the mean, capped so the sinusoid is not
       * clipped (around a light mean such as the default #dddddd background only ~0.15
       * fits; use background_color "#808080" for full contrast);
       * sigma (0.18): Gaussian envelope SD as a fraction of the item diameter (gabor only);
       * phase (0): cosine phase in degrees at the item centre (0 = a bright stripe through
       * the centre), or "random" for an independent whole-degree phase per item (recorded
       * in stimuli_shown);
       * mean ("background"): the mean gray, "background" to match background_color's
       * luminance so the patch blends into the box, or a CSS color (its luminance is used).
       * Degree d and d + 180 draw the same pattern.
       */
      grating_options: { type: jspsych.ParameterType.OBJECT, default: { cycles: 4, contrast: 1, sigma: 0.18, phase: 0, mean: "background" } },
      /** Color wheel for degree lookups (null = window.BradyColorWheel). */
      color_wheel: { type: jspsych.ParameterType.OBJECT, default: null },
      /**
       * A BradySimilarity engine (BradySimilarity.createEngine(...)), one
       * instance shared across the timeline. Required when `stimuli` is empty:
       * it supplies the next quad (nextQuad) and receives the response
       * (engine.update) before the trial finishes. Ignored when `stimuli` is given.
       * With item_shape "line", "gabor" or "grating" create it with { period: 180 }.
       */
      engine: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Engine mode only: true = ask the engine for its next quad, epsilon-greedy: each
          trial is independently a uniform COVERAGE draw with probability epsilon (the
          engine's `epsilon`, default 0.2; a per-trial Bernoulli draw, so the coverage count
          varies), else the most-informative (BALD-selected) quad. false = always force a
          coverage draw. */
      adaptive: { type: jspsych.ParameterType.BOOL, default: true },
      /** Question shown at the top of the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: "Which PAIR is most DIFFERENT? Click it." },
      /** Diameter/side (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Background color of the task box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the task box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the choice, show the inline 4-point word-confidence picker
          anchored to the chosen pair (confidence is collected on every trial). */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: true },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },
      /** If > 0, end the trial with a null response after this many ms without a choice. A choice already
          waiting on its confidence rating is allowed to finish. 0 = wait forever. */
      response_timeout: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from when the pairs appear to the (final) choice click. Null on timeout. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** The left pair's 2 item specs as displayed [top, bottom]. */
      pair1: { type: jspsych.ParameterType.STRING, array: true },
      /** The right pair's 2 item specs as displayed [top, bottom]. */
      pair2: { type: jspsych.ParameterType.STRING, array: true },
      /** The 4 wheel/orientation degrees as displayed [pair1-top, pair1-bottom, pair2-top, pair2-bottom] (integers in [0, period)), or nulls for non-degree items. */
      degrees: { type: jspsych.ParameterType.INT, array: true },
      /** Period (degrees) of the stimulus space that `degrees` and the offsets live in: 180 for
          item_shape "line", "gabor" or "grating" (they look the same rotated 180 degrees),
          360 otherwise (BradyUtils.shapePeriod). */
      period: { type: jspsych.ParameterType.INT },
      /** Signed wrapped within-pair offsets [wrap(p1b-p1a), wrap(p2b-p2a)] in (-period/2, period/2]; null unless all four degrees are known. */
      pair_offsets: { type: jspsych.ParameterType.INT, array: true },
      /** Which pair was clicked as MOST DIFFERENT: 0 = left (pair1), 1 = right (pair2). Null on timeout.
          The engine's quad outcome is the more-similar pair, so engine.update gets 1 - response. */
      response: { type: jspsych.ParameterType.INT },
      /** The chosen (most-different) pair's 2 item specs. Null on timeout. */
      chosen_pair_items: { type: jspsych.ParameterType.STRING, array: true },
      /** Confidence rating 1..N, N = number of confidence_labels (default 4: 1 = Guess ... 4 = Certain). Null when not collected or on timeout. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the choice to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click. Null when not collected or not measurable. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Engine mode: true if this trial was a coverage draw (the per-trial probability-epsilon draw, or adaptive:false), false if BALD-selected. Null in fixed designs. */
      is_coverage_trial: { type: jspsych.ParameterType.BOOL },
      /** Engine mode: the BALD information score of the selected quad (null on coverage draws and in fixed designs). */
      model_score: { type: jspsych.ParameterType.FLOAT },
      /** One entry per displayed item, in `degrees` order: kind plus value/src/text, and `degree` (in [0, period)) when the spec is a number. Gabor/grating items also carry `phase`, the grating phase (deg) the item was drawn with. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SimilarityQuadPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      U.checkParams(trial, {
        plugin: "similarity-quad",
        enums: { item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] },
        nonneg: ["response_timeout"],
      });

      // ---- Trial source: fixed `stimuli` (4 specs) OR the adaptive engine ----
      const period = stimulusPeriod(trial.item_shape);
      const src = resolveQuadSource(jsPsych, trial, period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, period); return; }
      const specs = src.specs;     // [p1a, p1b, p2a, p2b] in display order
      const degrees = src.degrees;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const shape = trial.item_shape;
      const isShape = (it) => (shape === "line" || shape === "triangle" || U.isGratingShape(shape)) && it.kind !== "image" && it.kind !== "text";
      // Gabor / grating appearance (achromatic; null for the other shapes).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "similarity-quad", background: trial.background_color })
        : null;
      // Per-item paint options: an oriented shape drawn at the recorded degree (so the
      // screen shows exactly what `degrees` says), or the disk/square path.
      // Gabors/gratings also get the resolved options with this item's phase.
      const paintOpts = (it, deg, phase) => isShape(it)
        ? { shape: shape, orientation: deg != null ? deg : 0, color: trial.item_color,
          grating: grating ? Object.assign({}, grating, { phase: phase || 0 }) : null }
        : { circle: it.kind === "color" };
      const phases = itemPhases(items, grating, isShape, src, trial); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt band on top, two bordered pair sub-boxes ----
      const sz = trial.item_size;
      const promptH = 48;
      const labelH = 20, gapIn = 18, padIn = 16;           // label height, gap between the two items, sub-box padding
      const pw = sz + 2 * padIn;                           // pair sub-box width
      const ph = labelH + 2 * sz + gapIn + 2 * padIn;      // pair sub-box height
      const gapBetween = Math.max(40, Math.round(sz * 0.5));
      const W = Math.max(2 * pw + gapBetween + 48, 320);
      const H = promptH + ph + 26;
      const leftX = [W / 2 - gapBetween / 2 - pw, W / 2 + gapBetween / 2];
      let html =
        `<div id="simq-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="simq-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${trial.prompt || ""}</div>`;
      for (let p = 0; p < 2; p++) {
        html +=
          `<div id="simq-pair-${p}" data-idx="${p}" style="position:absolute;left:${leftX[p]}px;top:${promptH}px;` +
          `width:${pw}px;height:${ph}px;box-sizing:border-box;border:2px solid #666;border-radius:8px;` +
          `padding:${padIn}px;cursor:pointer;background:rgba(255,255,255,.25)">` +
          `<div style="height:${labelH}px;line-height:${labelH}px;text-align:center;font-size:12px;color:#555;pointer-events:none">Pair ${p + 1}</div>`;
        for (let j = 0; j < 2; j++) {
          const i = p * 2 + j;
          const round = (items[i].kind === "color" && (shape === "disk" || (grating && isShape(items[i])))) ? "border-radius:50%;" : "";
          const edge = grating && isShape(items[i]) ? "transparent" : "#222"; // no outline around a Gabor
          html +=
            `<canvas id="simq-cv-${i}" width="${sz}" height="${sz}" style="display:block;margin:${j === 0 ? 0 : gapIn}px auto 0;` +
            `${round}border:1px solid ${edge};pointer-events:none"></canvas>`;
        }
        html += "</div>";
      }
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#simq-box");
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Paint (preload any image items first; trial() stays synchronous) ----
      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        for (let i = 0; i < 4; i++) {
          const cv = display_element.querySelector(`#simq-cv-${i}`);
          U.paintItem(cv.getContext("2d"), items[i], sz, imgCache, paintOpts(items[i], degrees[i], phases[i]));
        }
        onset = performance.now();
      });

      // ---- Response ----------------------------------------------------------
      let responded = false;
      let committed = false; // guards finishTrial/engine.update against any double fire
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (which) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#simq-pair-${which}`);
          const t0 = performance.now();
          U.confidencePopup(chosenEl, box, { labels: trial.confidence_labels, colors: trial.confidence_colors },
            (conf) => {
              const cHold = U.mouseHoldDuration(); // the confidence click is its own press
              if (conf == null) { // x: clear the choice (and end the trial if the timeout already passed)
                responded = false;
                if (timedOut && !committed) { committed = true; finish(null, null); }
                return;
              }
              confidence = conf;
              confRt = Math.round(performance.now() - t0);
              confHold = cHold;
              commit(which, rt, hold);
            });
          return;
        }
        commit(which, rt, hold);
      };
      for (let p = 0; p < 2; p++) {
        display_element.querySelector(`#simq-pair-${p}`).addEventListener("click", () => choose(p));
      }

      // ---- Commit: update the engine, then finish ---------------------------
      const commit = (which, rt, hold) => {
        if (committed) return;
        committed = true;
        // `which` is the pair clicked as most different. The engine's quad
        // outcome is the more-similar pair, so it gets 1 - which; the data
        // `response` keeps `which`.
        if (src.engineSpec) trial.engine.update("quad", src.engineSpec, 1 - which);
        finish(which, rt, hold);
      };

      const finish = (which, rt, hold) => {
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          pair1: [toStr(specs[0]), toStr(specs[1])],
          pair2: [toStr(specs[2]), toStr(specs[3])],
          degrees: degrees.slice(),
          period: period,
          pair_offsets: degreesKnown
            ? [offsetDeg(degrees[1], degrees[0], period), offsetDeg(degrees[3], degrees[2], period)]
            : null,
          response: which,
          chosen_pair_items: which == null ? null : [toStr(specs[which * 2]), toStr(specs[which * 2 + 1])],
          confidence: confidence,
          rt_confidence: confRt,
          confidence_mouse_hold_duration: confHold,
          is_coverage_trial: src.engineSpec ? src.engineSpec.isCoverage : null,
          model_score: src.score != null ? src.score : null,
          stimuli_shown: items.map((it, i) => shownRecord(it, specs[i], period, phases[i])),
        };
        data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
        if (trial.data) Object.assign(data, trial.data); // experimenter fields win on collision
        jsPsych.finishTrial(data);
      };

      // ---- Optional response timeout -----------------------------------------
      if (trial.response_timeout > 0) {
        jsPsych.pluginAPI.setTimeout(() => {
          if (committed) return;
          // A choice is waiting on its confidence rating: let it finish. If the
          // participant clears it with x instead, the trial ends there.
          if (responded) { timedOut = true; return; }
          responded = true; committed = true;
          finish(null, null);
        },
          trial.response_timeout);
      }
    }
  }
  SimilarityQuadPlugin.info = info;

  // ===== module-private helpers =====
  function toStr(s) { return s == null ? null : String(s); }
  /* Period (degrees) of the stimulus space for an item_shape: the shared rule
     BradyUtils.shapePeriod. An unpointed bar ("line"), a Gabor or a grating looks the
     same after a 180-degree turn; hues ("disk") and pointed shapes ("triangle")
     repeat every 360. */
  function stimulusPeriod(shape) { return U.shapePeriod(shape); }
  /* Degree -> [0, period). Period 360 is U.wrap360. */
  function wrapDeg(v, period) { return period === 180 ? ((v % 180) + 180) % 180 : U.wrap360(v); }
  /* Signed a - b in (-period/2, period/2]. Period 360 matches U.angleDiff. */
  function offsetDeg(a, b, period) { const d = wrapDeg(a - b, period); return d > period / 2 ? d - period : d; }
  /* A numeric spec's recorded degree: rounded, wrapped into [0, period). */
  function specDegree(s, period) { return typeof s === "number" ? wrapDeg(Math.round(s), period) : null; }
  /* Warn once when the engine's period does not match the stimulus period. The
     engine is used as given; the data still record degrees in the stimulus period. */
  function checkEnginePeriod(plugin, eng, shape, period) {
    const ep = eng.period != null ? eng.period : 360;
    if (ep === period) return;
    if (period === 180) {
      U.warnOnce(plugin, "item_shape \"" + shape + "\" repeats every 180 degrees; create the engine with {period: 180} " +
        "(this engine has period " + ep + ", so it treats 0 and 180 as maximally different).");
    } else {
      U.warnOnce(plugin, "the engine has period " + ep + " but item_shape \"" + shape + "\" repeats every 360 degrees; " +
        "use {period: 180} with item_shape line/gabor/grating.");
    }
  }
  /* Shuffled copy of `arr`, drawn from the engine's rng (engine.shuffle) so a
     seeded engine also reproduces the layout; jsPsych's shuffle otherwise. */
  function engineShuffle(jsPsych, eng, arr) {
    return typeof eng.shuffle === "function" ? eng.shuffle(arr) : jsPsych.randomization.shuffle(arr.slice());
  }
  function shownRecord(item, spec, period, phase) {
    const rec = { kind: item.kind, degree: specDegree(spec, period) };
    if (item.kind === "image") rec.src = item.src;
    else if (item.kind === "text") rec.text = item.text;
    else rec.value = spec;
    if (phase != null) rec.phase = phase; // Gabor/grating: the phase it was drawn with
    return rec;
  }
  /* Grating phase per displayed item (null for an item not drawn as a Gabor/grating).
     Random phases come from the engine's rng when the engine supplied the trial, so a
     seeded engine reproduces them, and otherwise from Math.random (which
     jsPsych.randomization.setSeed seeds). */
  function itemPhases(items, grating, isShape, src, trial) {
    const eng = src && src.engineSpec ? trial.engine : null;
    const rng = eng && typeof eng.rng === "function" ? eng.rng : undefined;
    return items.map((it) => (grating && isShape(it) ? U.gratingPhase(grating, rng) : null));
  }
  /*
   * Fixed: stimuli >= 4 -> [p1a, p1b, p2a, p2b] as given.
   * Engine: nextQuad() (forceCoverage when adaptive:false). The pairs are
   * randomly assigned left/right and each pair's items randomly ordered top/
   * bottom (engine rng); engineSpec holds the displayed arrangement in the
   * engine's degrees, so pair index 0 is the left pair as shown. specs/degrees
   * are the same values wrapped into the stimulus period.
   */
  function resolveQuadSource(jsPsych, trial, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= 4) {
      if (stim.length > 4) U.warnOnce("similarity-quad", "stimuli has " + stim.length + " entries but this task uses exactly 4; the extras are ignored.");
      if (trial.engine) U.warnOnce("similarity-quad", "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, 4);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce("similarity-quad", "stimuli has only " + stim.length + " entr" + (stim.length === 1 ? "y" : "ies") + " but this task needs 4 ([pair1a, pair1b, pair2a, pair2b]), or none plus an `engine`. The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function") {
      U.warnOnce("similarity-quad", "no stimuli and no engine -- pass `stimuli` (4 item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod("similarity-quad", eng, trial.item_shape, period);
    const sel = eng.nextQuad({ forceCoverage: !trial.adaptive });
    let pairs = [sel.pair1.slice(), sel.pair2.slice()];
    pairs = engineShuffle(jsPsych, eng, pairs);                       // random left/right
    pairs = pairs.map((p) => engineShuffle(jsPsych, eng, p));         // random top/bottom
    const shown = [pairs[0][0], pairs[0][1], pairs[1][0], pairs[1][1]].map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { pair1: pairs[0].slice(), pair2: pairs[1].slice(), isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  function finishInvalid(jsPsych, display_element, trial, period) {
    display_element.innerHTML =
      "<p style='color:#a00'>similarity-quad: no items to show (see the console warning).</p>";
    const data = {
      rt: null, mouse_hold_duration: null, pair1: [], pair2: [], degrees: [], period: period, pair_offsets: null, response: null,
      chosen_pair_items: null, confidence: null, rt_confidence: null, confidence_mouse_hold_duration: null,
      is_coverage_trial: null, model_score: null, stimuli_shown: [],
    };
    data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
    if (trial.data) Object.assign(data, trial.data);
    jsPsych.finishTrial(data);
  }

  return SimilarityQuadPlugin;
})(jsPsychModule);
