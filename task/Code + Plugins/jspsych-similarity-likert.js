/*
 * jspsych-similarity-likert.js  --  jsPsych v8 plugin
 *
 * Similarity rating: one pair of items side by side, rated on an R-point
 * scale (default 7) by clicking one of a row of grayscale buttons. Only the
 * end buttons carry word anchors (`rating_labels`, default "Very different" /
 * "Very similar"). The responses feed BradySimilarity, which estimates the
 * similarity structure of a stimulus wheel.
 *
 * Items can be color-wheel degrees (disks), orientations (bars, triangles, Gabor
 * patches or gratings, via `item_shape`), CSS colors, images, or text. Two trial sources:
 *   Fixed    -- pass `stimuli` (2 item specs); is_coverage_trial and
 *               model_score are null.
 *   Adaptive -- pass an `engine` (BradySimilarity.createEngine, one instance
 *               shared across the timeline) and leave `stimuli` empty. The
 *               trial gets a pair from engine.nextPair, randomizes left/right
 *               (engine rng), and calls engine.update() with the displayed
 *               degrees before finishing. `adaptive:false` forces a coverage
 *               draw. If `rating_points` disagrees with the engine's
 *               ratingPoints, the engine's value is used (with a warning),
 *               since the ordered-logistic likelihood must match the scale
 *               shown.
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
 * an inline 4-point word popup anchored to the chosen rating button, whose x
 * clears the rating so the participant can rate again.
 *
 * The data store exact degrees and the signed offset (in the stimulus period),
 * so a similarity matrix fit to them has the same orientation as memory-error
 * data.
 *
 * Click/timer driven, so trial() is synchronous and calls
 * this.jsPsych.finishTrial(data) later (CONVENTIONS.md section 3).
 *
 * Load order: brady-color-wheel.js, brady-plugin-utils.js,
 * similarity-adaptive-utils.js, then this file.
 * Timothy Brady, Brady Lab -- 2026.
 */

var jsPsychSimilarityLikert = (function (jspsych) {
  "use strict";

  const U = window.BradyUtils;
  const version = "2.0.0";

  const info = {
    name: "similarity-likert",
    version: version,
    parameters: {
      /**
       * The 2 items [left, right]. Each may be a number (color-wheel degree, or
       * orientation degree when `item_shape` is "line"/"triangle"/"gabor"/"grating"), a CSS color
       * / "lab(...)" string, an image path, or text. Numbers are recorded
       * wrapped into [0, period), so a "line" at 200 is recorded (and drawn) as
       * 20. Leave empty to draw the pair from `engine` instead (adaptive mode).
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
       * it supplies the next pair (nextPair) and receives the rating
       * (engine.update) before the trial finishes. Ignored when `stimuli` is given.
       * With item_shape "line", "gabor" or "grating" create it with { period: 180 }.
       */
      engine: { type: jspsych.ParameterType.OBJECT, default: null },
      /** Engine mode only: true = ask the engine for its next pair, epsilon-greedy: each
          trial is independently a uniform COVERAGE draw with probability epsilon (the
          engine's `epsilon`, default 0.2; a per-trial Bernoulli draw, so the coverage count
          varies), else the most-informative (BALD-selected) pair. false = always force a
          coverage draw. */
      adaptive: { type: jspsych.ParameterType.BOOL, default: true },
      /** Question shown at the top of the box. */
      prompt: { type: jspsych.ParameterType.HTML_STRING, default: "How similar are these two items?" },
      /** Number of rating buttons R (rating 1..R; values below 2 become 2). In engine
          mode the engine's ratingPoints wins (with a warning) when they disagree. */
      rating_points: { type: jspsych.ParameterType.INT, default: 7 },
      /** Word anchors: the first entry goes under the first button, the last entry under
          the last button; any middle entries are not shown. */
      rating_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Very different", "Very similar"] },
      /** Diameter/side (px) of each item. */
      item_size: { type: jspsych.ParameterType.INT, default: 110 },
      /** Background color of the task box. */
      background_color: { type: jspsych.ParameterType.STRING, default: "#dddddd" },
      /** Scale the task box with CSS transform to fill the browser window. */
      auto_zoom: { type: jspsych.ParameterType.BOOL, default: false },
      /** After the rating, show the inline 4-point word-confidence picker
          anchored to the chosen button (confidence is collected on every trial). */
      collect_confidence: { type: jspsych.ParameterType.BOOL, default: true },
      /** Word labels (low -> high) for the confidence picker. */
      confidence_labels: { type: jspsych.ParameterType.STRING, array: true, default: ["Guess", "Maybe", "Probably", "Certain"] },
      /** CSS colors (low -> high) for the confidence buttons. */
      confidence_colors: { type: jspsych.ParameterType.STRING, array: true, default: ["#e74c3c", "#e67e22", "#9acd32", "#2ecc71"] },
      /** If > 0, end the trial with a null response after this many ms without a rating. A rating already
          waiting on its confidence rating is allowed to finish. 0 = wait forever. */
      response_timeout: { type: jspsych.ParameterType.INT, default: 0 },
    },
    data: {
      /** Response time (ms) from when the pair appears to the (final) rating click. Null on timeout. The literature's "response initiation time". */
      rt: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the committing click. "Response duration" (RD) in Zhou et al. (PNAS, in press); tracks confidence independently of rt. null if not measurable. */
      mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** The 2 item specs as displayed [left, right]. */
      pair: { type: jspsych.ParameterType.STRING, array: true },
      /** The 2 wheel/orientation degrees as displayed [left, right] (integers in [0, period)), or nulls for non-degree items. */
      degrees: { type: jspsych.ParameterType.INT, array: true },
      /** Period (degrees) of the stimulus space that `degrees` and the offsets live in: 180 for
          item_shape "line", "gabor" or "grating" (they look the same rotated 180 degrees),
          360 otherwise (BradyUtils.shapePeriod). */
      period: { type: jspsych.ParameterType.INT },
      /** Signed wrapped offset wrap(right - left) in (-period/2, period/2]; null unless both degrees are known. */
      offset: { type: jspsych.ParameterType.INT },
      /** The similarity rating 1..rating_points (1 = most different, R = most similar). Null on timeout. */
      rating: { type: jspsych.ParameterType.INT },
      /** The number of rating buttons R actually shown (engine's ratingPoints in engine mode). */
      rating_points: { type: jspsych.ParameterType.INT },
      /** Confidence rating 1..N, N = number of confidence_labels (default 4: 1 = Guess ... 4 = Certain). Null when not collected or on timeout. */
      confidence: { type: jspsych.ParameterType.INT },
      /** Response time (ms) from the rating to the confidence rating (collect_confidence only; else null). */
      rt_confidence: { type: jspsych.ParameterType.INT },
      /** How long (ms) the mouse button was held for the confidence-rating click. Null when not collected or not measurable. */
      confidence_mouse_hold_duration: { type: jspsych.ParameterType.INT },
      /** Engine mode: true if this trial was a coverage draw (the per-trial probability-epsilon draw, or adaptive:false), false if BALD-selected. Null in fixed designs. */
      is_coverage_trial: { type: jspsych.ParameterType.BOOL },
      /** Engine mode: the BALD information score of the selected pair (null on coverage draws and in fixed designs). */
      model_score: { type: jspsych.ParameterType.FLOAT },
      /** One entry per displayed item [left, right]: kind plus value/src/text, and `degree` (in [0, period)) when the spec is a number. Gabor/grating items also carry `phase`, the grating phase (deg) the item was drawn with. */
      stimuli_shown: { type: jspsych.ParameterType.OBJECT, array: true },
      /** Name of the color wheel the trial used: the wheel's `name` ("schurgin-brady-2020" for the default wheel, or the name
       *  of a loaded alternative or `color_wheel`), or "custom" for a wheel without one. Records which wheel the
       *  recorded degrees refer to (BradyUtils.colorWheelName). */
      color_wheel_name: { type: jspsych.ParameterType.STRING },
    },
  };

  class SimilarityLikertPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      trial = U.fixNaNParams(trial, info, info.name); // a NaN number (e.g. a misused timeline variable) -> its default, with a warning
      const jsPsych = this.jsPsych;
      const wheel = trial.color_wheel || window.BradyColorWheel;
      const forceType = trial.item_type === "auto" ? undefined : trial.item_type;

      U.checkParams(trial, {
        plugin: "similarity-likert",
        enums: { item_type: ["auto", "color", "image", "text"], item_shape: ["disk", "line", "triangle", "gabor", "grating"] },
        positive: ["rating_points"],
        nonneg: ["response_timeout"],
        min: { rating_points: 2 },
      });

      // The likelihood's rating scale must match the buttons shown, so in engine
      // mode the engine's ratingPoints wins over a mismatched rating_points.
      let R = Math.max(2, Math.round(trial.rating_points || 7));
      const eng = trial.engine;
      const engineUsable = (trial.stimuli || []).length === 0 && eng && typeof eng.update === "function";
      if (engineUsable && eng.ratingPoints && eng.ratingPoints !== R) {
        U.warnOnce("similarity-likert", "rating_points=" + R + " does not match the engine's ratingPoints=" +
          eng.ratingPoints + "; using the engine's (the ordered-logistic likelihood must match the scale shown).");
        R = eng.ratingPoints;
      }

      // ---- Trial source: fixed `stimuli` (2 specs) OR the adaptive engine ----
      const period = stimulusPeriod(trial.item_shape);
      const src = resolvePairSource(jsPsych, trial, period);
      if (!src) { finishInvalid(jsPsych, display_element, trial, R, period); return; }
      const specs = src.specs;     // [left, right] display order
      const degrees = src.degrees;
      const items = specs.map((s) => U.resolveItem(s, wheel, forceType));
      const shape = trial.item_shape;
      const isShape = (it) => (shape === "line" || shape === "triangle" || U.isGratingShape(shape)) && it.kind !== "image" && it.kind !== "text";
      // Gabor / grating appearance (achromatic; null for the other shapes).
      const grating = U.isGratingShape(shape)
        ? U.resolveGrating(trial.grating_options, { plugin: "similarity-likert", background: trial.background_color })
        : null;
      // Per-item paint options: an oriented shape drawn at the recorded degree (so the
      // screen shows exactly what `degrees` says), or the disk/square path.
      // Gabors/gratings also get the resolved options with this item's phase.
      const paintOpts = (it, deg, phase) => isShape(it)
        ? { shape: shape, orientation: deg != null ? deg : 0, color: trial.item_color,
          grating: grating ? Object.assign({}, grating, { phase: phase || 0 }) : null }
        : { circle: it.kind === "color" };
      const phases = itemPhases(items, grating, isShape, src, trial); // grating phase per item (null if not a Gabor/grating)

      // ---- Build the box: prompt band, the pair, the rating-button row -------
      const sz = trial.item_size;
      const promptH = 48;
      const gap = Math.max(30, Math.round(sz * 0.4));
      const btnW = 34, btnH = 30, btnGap = 6, labelH = 34;
      const rowW = R * btnW + (R - 1) * btnGap;
      const W = Math.max(2 * sz + gap + 60, rowW + 40, 320);
      const itemsTop = promptH + 8;
      const scaleTop = itemsTop + sz + 24;
      const H = scaleTop + btnH + labelH + 10;
      let html =
        `<div id="siml-box" style="position:relative;margin:0 auto;width:${W}px;height:${H}px;` +
        `background:${trial.background_color};border:1px solid #000">` +
        `<div id="siml-prompt" style="position:absolute;top:0;left:0;width:100%;height:${promptH}px;` +
        `display:flex;align-items:center;justify-content:center;text-align:center;padding:0 12px;` +
        `box-sizing:border-box;overflow:hidden">${trial.prompt || ""}</div>`;
      for (let i = 0; i < 2; i++) {
        const x = W / 2 + (i === 0 ? -1 : 1) * (gap / 2) + (i === 0 ? -sz : 0);
        const round = (items[i].kind === "color" && (shape === "disk" || (grating && isShape(items[i])))) ? "border-radius:50%;" : "";
        const edge = grating && isShape(items[i]) ? "transparent" : "#222"; // no outline around a Gabor
        html +=
          `<canvas id="siml-cv-${i}" width="${sz}" height="${sz}" ` +
          `style="position:absolute;left:${x}px;top:${itemsTop}px;${round}border:1px solid ${edge}"></canvas>`;
      }
      // Rating buttons: unlabeled grayscale swatches, lighter = more similar
      // (40% lightness for "very different" up to 95% for "very similar").
      const rowLeft = (W - rowW) / 2;
      for (let k = 0; k < R; k++) {
        const light = R > 1 ? Math.round(40 + (k / (R - 1)) * 55) : 68;
        html +=
          `<button type="button" id="siml-rate-${k}" data-rating="${k + 1}" ` +
          `title="${k + 1} / ${R}" style="position:absolute;left:${rowLeft + k * (btnW + btnGap)}px;top:${scaleTop}px;` +
          `width:${btnW}px;height:${btnH}px;padding:0;border:1px solid rgba(0,0,0,.4);border-radius:5px;` +
          `cursor:pointer;background:hsl(0,0%,${light}%)"></button>`;
      }
      const lab = trial.rating_labels || [];
      const labStyle = `position:absolute;top:${scaleTop + btnH + 4}px;width:${Math.round(rowW / 2)}px;` +
        `font-size:12px;color:#333;line-height:1.15;overflow:hidden;height:${labelH - 6}px`;
      html +=
        `<div style="${labStyle};left:${rowLeft}px;text-align:left">${lab[0] || ""}</div>` +
        `<div style="${labStyle};left:${rowLeft + rowW - Math.round(rowW / 2)}px;text-align:right">${lab[lab.length - 1] || ""}</div>`;
      html += "</div>";
      display_element.innerHTML = html;
      const box = display_element.querySelector("#siml-box");
      if (trial.auto_zoom) U.autoZoom(box);

      // ---- Paint (preload any image items first; trial() stays synchronous) ----
      const imgSrcs = items.filter((it) => it.kind === "image").map((it) => it.src);
      let onset = performance.now();
      U.loadImages(imgSrcs).then((imgCache) => {
        for (let i = 0; i < 2; i++) {
          const cv = display_element.querySelector(`#siml-cv-${i}`);
          U.paintItem(cv.getContext("2d"), items[i], sz, imgCache, paintOpts(items[i], degrees[i], phases[i]));
        }
        onset = performance.now();
      });

      // ---- Response ----------------------------------------------------------
      let responded = false;
      let committed = false; // guards finishTrial/engine.update against any double fire
      let confidence = null, confRt = null, confHold = null;
      let timedOut = false; // response_timeout fired while the confidence popup was open

      const choose = (rating) => {
        // Read the hold first so every click consumes its own press; otherwise an
        // ignored click would leave its duration for the next click to claim.
        const hold = U.mouseHoldDuration();
        if (responded) return;
        responded = true;
        const rt = Math.round(performance.now() - onset);
        if (trial.collect_confidence) {
          const chosenEl = display_element.querySelector(`#siml-rate-${rating - 1}`);
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
              commit(rating, rt, hold);
            });
          return;
        }
        commit(rating, rt, hold);
      };
      for (let k = 0; k < R; k++) {
        display_element.querySelector(`#siml-rate-${k}`).addEventListener("click", () => choose(k + 1));
      }

      // ---- Commit: update the engine, then finish ---------------------------
      const commit = (rating, rt, hold) => {
        if (committed) return;
        committed = true;
        if (src.engineSpec) trial.engine.update("likert", src.engineSpec, rating);
        finish(rating, rt, hold);
      };

      const finish = (rating, rt, hold) => {
        const degreesKnown = degrees.every((d) => d != null);
        const data = {
          rt: rt != null ? rt : null,
          mouse_hold_duration: hold != null ? hold : null,
          pair: specs.map(toStr),
          degrees: degrees.slice(),
          period: period,
          offset: degreesKnown ? offsetDeg(degrees[1], degrees[0], period) : null,
          rating: rating,
          rating_points: R,
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
  SimilarityLikertPlugin.info = info;

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
   * Fixed: stimuli >= 2 -> [left, right] as given.
   * Engine: nextPair() (forceCoverage when adaptive:false). The two degrees
   * are randomly ordered left/right (engine rng) and engineSpec holds the
   * displayed order in the engine's degrees; specs/degrees are the same values
   * wrapped into the stimulus period. f is symmetric, so the shuffle only
   * balances the sign of the recorded offsets.
   */
  function resolvePairSource(jsPsych, trial, period) {
    const stim = trial.stimuli || [];
    if (stim.length >= 2) {
      if (stim.length > 2) U.warnOnce("similarity-likert", "stimuli has " + stim.length + " entries but this task uses exactly 2; the extras are ignored.");
      if (trial.engine) U.warnOnce("similarity-likert", "both stimuli and engine given; using the fixed stimuli, engine not updated");
      const specs = stim.slice(0, 2);
      return { specs: specs, degrees: specs.map((s) => specDegree(s, period)), engineSpec: null, score: null };
    }
    if (stim.length > 0) {
      U.warnOnce("similarity-likert", "stimuli has only 1 entry but this task needs 2 (or none plus an `engine`). The trial cannot run.");
      return null;
    }
    const eng = trial.engine;
    if (!eng || typeof eng.update !== "function") {
      U.warnOnce("similarity-likert", "no stimuli and no engine -- pass `stimuli` (2 item specs) for a fixed design, or `engine: BradySimilarity.createEngine(...)` for the adaptive task. The trial cannot run.");
      return null;
    }
    checkEnginePeriod("similarity-likert", eng, trial.item_shape, period);
    const sel = eng.nextPair({ forceCoverage: !trial.adaptive });
    const engDegs = engineShuffle(jsPsych, eng, sel.degrees);
    const shown = engDegs.map((d) => wrapDeg(d, period));
    return {
      specs: shown.slice(),
      degrees: shown.slice(),
      engineSpec: { degrees: engDegs, isCoverage: !!sel.isCoverage },
      score: sel.score,
    };
  }
  function finishInvalid(jsPsych, display_element, trial, R, period) {
    display_element.innerHTML =
      "<p style='color:#a00'>similarity-likert: no items to show (see the console warning).</p>";
    const data = {
      rt: null, mouse_hold_duration: null, pair: [], degrees: [], period: period, offset: null, rating: null, rating_points: R,
      confidence: null, rt_confidence: null, confidence_mouse_hold_duration: null,
      is_coverage_trial: null, model_score: null, stimuli_shown: [],
    };
    data.color_wheel_name = U.colorWheelName(trial.color_wheel); // which wheel the degrees refer to
    if (trial.data) Object.assign(data, trial.data);
    jsPsych.finishTrial(data);
  }

  return SimilarityLikertPlugin;
})(jsPsychModule);
