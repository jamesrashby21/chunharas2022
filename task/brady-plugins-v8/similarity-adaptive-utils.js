/*
 * similarity-adaptive-utils.js
 * Shared similarity model and adaptive engine for the Brady-lab jsPsych v8
 * similarity plugins (jspsych-similarity-triad / -quad / -likert).
 *
 * Exposes one global namespace, `BradySimilarity`. Load order:
 *   brady-color-wheel.js -> brady-plugin-utils.js -> similarity-adaptive-utils.js
 *   -> jspsych-similarity-*.js
 *
 * The file also runs in plain node, so tests/invariants.js can unit-test the
 * math. The only browser call (fetch, in loadGroupPrior) is guarded. Under a
 * bare require() the namespace lands on module.exports
 * (require(...).BradySimilarity); with a global `window` defined (as the tests
 * do) it lands on that.
 *
 * What it estimates
 * -----------------
 * The target is the full similarity matrix s(x, y) = f(delta) + g_x(delta),
 * delta = wrap(y - x): a homogeneous falloff f plus per-target deviations g_x.
 *   (a) Every trial records exact degrees and signed offsets, so any matrix
 *       estimator (parametric f + g_x, or empirical binning) can be fit offline.
 *       engine.history / exportState() carry everything an offline g_x fit needs.
 *   (b) The engine adapts on f only. Anchor-stratified sampling (least-sampled
 *       of 12 equal bins first: 30 degrees on a 360 space, 15 on a 180 space)
 *       keeps every matrix row estimable, so anchors cover the space evenly by
 *       design.
 *   (c) `empiricalMatrix(history)` bins the recorded responses into an
 *       (anchor-bin x offset-bin) similarity table, a model-light reference
 *       implementation of the confusion-matrix aggregation.
 *   (d) Adaptive targeting of g_x is not implemented. createEngine reserves a
 *       `heterogeneous` option for it; setting it only warns.
 *
 * Stimulus space (`period`)
 * ------------------------
 * Degrees live on a circle of `period` degrees: 360 (default) for color-wheel
 * hues and pointed shapes, or 180 for unpointed orientations (an oriented bar,
 * Gabor or grating, item_shape "line", "gabor" or "grating", looks the same
 * rotated by 180 degrees). Distances wrap in
 * the period, so the largest distance is period/2, and the engine hands out
 * integer degrees in [0, period). Period 360 gives exactly the results this
 * module gave before the option existed.
 *
 * f is a peak-normalized (TCC-style) von Mises basis, periodic in the period P:
 *
 *     f(delta; w) = sum_k w_k * exp(kappa_k * (cos(2*pi*delta/P) - 1))
 *
 * with default kappas [0.5, 2, 8, 32] and w on the simplex (w_k >= 0,
 * sum w_k = 1), so f(0) = 1, f(-delta) = f(delta) and f(delta + P) = f(delta).
 * With P = 180 a kappa acts on the doubled angle, so the same kappas give the
 * same falloff shape over [0, 90] that they give over [0, 180] with P = 360.
 *
 * Four choice likelihoods share one precision beta > 0 (larger beta = more
 * deterministic choices):
 *   triad    -- odd-one-out over degrees [a,b,c]. Outcome = the most-similar
 *               pair, index 0 = AB, 1 = AC, 2 = BC (the odd item is the one not
 *               in that pair); P = softmax(beta*[s(a,b), s(a,c), s(b,c)]).
 *   reftriad -- reference `ref` with comparisons b, c. Outcome 0 = b judged MORE
 *               DIFFERENT from ref, 1 = c; P(b) = logistic(beta*[s(ref,c) - s(ref,b)]).
 *               This is the quad likelihood with a shared reference.
 *   quad     -- pairs (A,B) vs (C,D). Outcome 0 = pair1 judged MORE SIMILAR;
 *               P(pair1) = logistic(beta*[s(A,B) - s(C,D)]).
 *   likert   -- rating r in 1..R, higher = more similar. Ordered logistic with
 *               increasing thresholds c_k = c0 + (k-1)*exp(logDc):
 *               P(r <= k) = logistic(c_k - beta*s).
 *
 * The engine (`createEngine`) keeps a particle-filter posterior over
 * theta = { w (simplex), logBeta, c0, logDc }. Each response multiplies the
 * particle weights by its likelihood (weights are renormalized every update,
 * so no log-space accumulation is needed); when the effective sample size
 * falls below nParticles/2 it does systematic resampling plus a Liu-West
 * move (shrink toward the posterior mean, then jitter), which refreshes the
 * particles without widening the posterior.
 * Trial selection is epsilon-greedy. Each trial is a coverage trial with
 * probability epsilon, an independent Bernoulli draw per trial (so the number
 * of coverage trials varies around epsilon x trials; it is not a fixed
 * fraction). A coverage trial has offsets uniform on [minSeparation, period/2]
 * and stratified anchors; these are the independent replicates the reliable-variance
 * diagnostic uses. Otherwise it scores ~48 candidates by BALD mutual
 * information and takes the best. Candidate offsets come mostly from the
 * offsets where the posterior SD of f is highest, contrasted against
 * low-SD offsets where the geometry allows.
 *
 * All randomness goes through opts.rng (() -> [0,1)), so an engine built with
 * `BradySimilarity.seededRng(seed)` is fully deterministic.
 *
 * Group-prior JSON (loadGroupPrior), a small static file:
 *   { version: 1,
 *     period: 360,   (optional; 360 or 180, missing = 360)
 *     alpha:  [..one Dirichlet concentration per kappa..],
 *     beta:   { logMean, logSD },
 *     likert: { c0Mean, c0SD, dcLogMean, dcLogSD } }
 * Missing fields fall back to the defaults. A prior fit in one period does
 * not describe the other, so createEngine ignores a prior whose period differs
 * from the engine's (with a warning). In node (no fetch) pass the object, not
 * a URL.
 *
 * Limitation: the adaptive engine covers circular stimulus spaces only, with
 * a 360- or 180-degree period. For an oriented bar, Gabor or grating
 * (item_shape "line", "gabor" or "grating") create the engine with
 * { period: 180 }; the plugins warn if the shape and the
 * engine's period disagree. The plugins still accept image/text items for
 * fixed designs; ordinal embedding for face/object sets is not implemented.
 *
 * API
 * ---
 * The full API (every function, createEngine option, engine method, the history
 * record format and the exportState() layout) is documented in API.md, which
 * replaces the list that used to be here. Keep API.md in step when the API changes.
 *
 * Timothy Brady, Brady Lab -- 2026.
 */
(function (global) {
  "use strict";

  var DEFAULT_KAPPAS = [0.5, 2, 8, 32];
  var TWO_PI = 2 * Math.PI;

  /* ----- deduped warnings: BradyUtils.warnOnce in the browser, a plain
     console.warn fallback so node never needs BradyUtils. ----- */
  var _warned = {};
  function warn(msg) {
    if (global.BradyUtils && global.BradyUtils.warnOnce) { global.BradyUtils.warnOnce("brady-similarity", msg); return; }
    if (!_warned[msg] && typeof console !== "undefined" && console.warn) { _warned[msg] = 1; console.warn("[brady-similarity] " + msg); }
  }

  /* ----- seeded rng (mulberry32, 32-bit state) for deterministic engines ----- */
  // The returned function also has getState(): its current 32-bit state, such that
  // seededRng(rng.getState()) continues the same stream. exportState({particles: true})
  // saves it, so a restored engine can continue a seeded session exactly.
  function seededRng(seed) {
    var a = seed >>> 0;
    var next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.getState = function () { return a >>> 0; };
    return next;
  }

  /* ----- stimulus-space period (degrees per full turn of the stimulus) -----
     360 for hues and pointed shapes; 180 for unpointed orientations (bars),
     which look the same after a 180-degree turn. */
  var DEFAULT_PERIOD = 360;
  var PERIODS = [360, 180];
  // A model-function `period` argument: missing -> 360; anything else that is
  // not 360 or 180 throws, since a silent fallback would compute wrong values.
  function periodArg(p) {
    if (p == null) return DEFAULT_PERIOD;
    if (PERIODS.indexOf(p) < 0) throw new RangeError("BradySimilarity: period must be 360 or 180 (got " + p + ").");
    return p;
  }

  /* ----- circular helpers (degrees) ----- */
  // v -> [0, period)
  function wrapP(v, period) { v = v % period; return v < 0 ? v + period : v; }
  // |shortest arc| between two degrees, in [0, period/2]
  function absDiff(a, b, period) { var d = wrapP(a - b, period); return d > period / 2 ? period - d : d; }

  /* ----- von Mises basis, periodic in `period` -----
     The angle on the unit circle is 2*pi*delta/period = pi*delta/(period/2);
     for period 360 that is the original pi*delta/180, term for term. */
  function basisValue(kappa, deltaDeg, period) {
    return Math.exp(kappa * (Math.cos((deltaDeg * Math.PI) / (period / 2)) - 1));
  }
  // basis[k][d] for integer offsets d = 0..period-1. The engine works in integer
  // degrees, so each f evaluation is a K-term dot product against this table.
  function makeBasisTable(kappas, period) {
    var table = [];
    for (var k = 0; k < kappas.length; k++) {
      var row = new Float64Array(period);
      for (var d = 0; d < period; d++) row[d] = basisValue(kappas[k], d, period);
      table.push(row);
    }
    return table;
  }

  /* f(delta; w), evaluated exactly (non-integer deltas are fine). f(0) = 1
     only if w is on the simplex; this function does not check. */
  function fOf(deltaDeg, w, kappas, period) {
    kappas = kappas || DEFAULT_KAPPAS;
    period = periodArg(period);
    var s = 0;
    for (var k = 0; k < kappas.length; k++) s += w[k] * basisValue(kappas[k], deltaDeg, period);
    return s;
  }
  /* The full falloff curve at integer offsets 0..period-1. */
  function fCurve(w, kappas, period) {
    period = periodArg(period);
    var out = new Float64Array(period);
    for (var d = 0; d < period; d++) out[d] = fOf(d, w, kappas, period);
    return out;
  }

  /* ----- likelihoods (theta = { w, logBeta, c0, logDc }) ----- */
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
  function softmax3(a, b, c) {
    var m = Math.max(a, b, c);
    var ea = Math.exp(a - m), eb = Math.exp(b - m), ec = Math.exp(c - m);
    var s = ea + eb + ec;
    return [ea / s, eb / s, ec / s];
  }

  /* Triad: degrees [a,b,c] -> [P(AB most similar), P(AC), P(BC)]. */
  function triadProbs(degrees, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var sAB = fOf(absDiff(degrees[1], degrees[0], period), theta.w, kappas, period);
    var sAC = fOf(absDiff(degrees[2], degrees[0], period), theta.w, kappas, period);
    var sBC = fOf(absDiff(degrees[2], degrees[1], period), theta.w, kappas, period);
    return softmax3(beta * sAB, beta * sAC, beta * sBC);
  }
  /* Quad: P(pair1 = [A,B] judged more similar than pair2 = [C,D]). */
  function quadProb(pair1, pair2, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var s1 = fOf(absDiff(pair1[1], pair1[0], period), theta.w, kappas, period);
    var s2 = fOf(absDiff(pair2[1], pair2[0], period), theta.w, kappas, period);
    return sigmoid(beta * (s1 - s2));
  }
  /* Reference triad (reference-on-top task): P(b judged more different from
     `ref` than c is). More different means less similar, so this is quadProb
     with a shared reference and the sign flipped: P(b) rises as s(ref,b) falls
     relative to s(ref,c). */
  function refTriadProb(ref, b, c, theta, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var sB = fOf(absDiff(b, ref, period), theta.w, kappas, period);
    var sC = fOf(absDiff(c, ref, period), theta.w, kappas, period);
    return sigmoid(beta * (sC - sB));
  }
  /* Likert: degrees [a,b], R rating points -> [P(r=1), ..., P(r=R)], where
     higher ratings mean more similar. Ordered logistic with thresholds
     c_k = c0 + (k-1)*dc; dc = exp(logDc) > 0 keeps them increasing, so every
     probability is non-negative. Each cell is floored at 1e-12, so the row can
     sum to slightly more than 1 when a category is effectively impossible. */
  function likertProbs(degrees, theta, R, kappas, period) {
    period = periodArg(period);
    var beta = Math.exp(theta.logBeta);
    var dc = Math.exp(theta.logDc);
    var s = fOf(absDiff(degrees[1], degrees[0], period), theta.w, kappas, period);
    var out = new Array(R);
    var prev = 0;
    for (var k = 1; k < R; k++) {
      var cum = sigmoid(theta.c0 + (k - 1) * dc - beta * s);
      out[k - 1] = Math.max(cum - prev, 1e-12);
      prev = cum;
    }
    out[R - 1] = Math.max(1 - prev, 1e-12);
    return out;
  }

  /* ----- random-variate helpers (all through the injected rng) ----- */
  function randNorm(rng) {
    var u1 = 0;
    while (u1 <= 1e-12) u1 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * rng());
  }
  // Gamma(shape, 1) by Marsaglia-Tsang; shape < 1 uses Gamma(shape+1) * U^(1/shape).
  function randGamma(shape, rng) {
    if (shape < 1) {
      var u = 0;
      while (u <= 1e-12) u = rng();
      return randGamma(shape + 1, rng) * Math.pow(u, 1 / shape);
    }
    var d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x = randNorm(rng);
      var v = 1 + c * x;
      if (v <= 0) continue;
      v = v * v * v;
      var u2 = rng();
      if (u2 < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(Math.max(u2, 1e-300)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  // Dirichlet(alpha) sample -> simplex weights (normalized Gammas).
  function randDirichlet(alpha, rng) {
    var g = new Array(alpha.length), s = 0, k;
    for (k = 0; k < alpha.length; k++) { g[k] = Math.max(randGamma(alpha[k], rng), 1e-12); s += g[k]; }
    for (k = 0; k < alpha.length; k++) g[k] /= s;
    return g;
  }

  /* ----- group prior ----- */
  var DEFAULT_PRIOR = {
    version: 1,
    alpha: null, // null -> all-ones of length K (filled in per engine)
    beta: { logMean: Math.log(8), logSD: 0.75 },
    likert: { c0Mean: 0, c0SD: 1, dcLogMean: Math.log(1), dcLogSD: 0.5 },
  };
  // `period` is the engine's. A supplied prior records the period it was fit
  // in (missing field = 360); a prior from the other period is ignored as a whole.
  function normalizePrior(prior, K, period) {
    var priorPeriod = prior && prior.period != null ? Number(prior.period) : DEFAULT_PERIOD;
    if (prior && priorPeriod !== period) {
      warn("group prior was fit with period " + priorPeriod + " but the engine has period " + period +
        "; ignoring the prior (using the defaults). Give the prior a matching `period` field.");
      prior = null;
    }
    prior = prior || {};
    var alpha = Array.isArray(prior.alpha) ? prior.alpha.slice() : null;
    if (alpha && alpha.length !== K) {
      warn("group prior alpha has " + alpha.length + " entries but the engine has " + K +
        " kappas; ignoring the prior alpha (using all-ones).");
      alpha = null;
    }
    if (!alpha) { alpha = []; for (var k = 0; k < K; k++) alpha.push(1); }
    var b = prior.beta || {};
    var l = prior.likert || {};
    return {
      alpha: alpha,
      beta: {
        logMean: typeof b.logMean === "number" ? b.logMean : DEFAULT_PRIOR.beta.logMean,
        logSD: typeof b.logSD === "number" ? b.logSD : DEFAULT_PRIOR.beta.logSD,
      },
      likert: {
        c0Mean: typeof l.c0Mean === "number" ? l.c0Mean : DEFAULT_PRIOR.likert.c0Mean,
        c0SD: typeof l.c0SD === "number" ? l.c0SD : DEFAULT_PRIOR.likert.c0SD,
        dcLogMean: typeof l.dcLogMean === "number" ? l.dcLogMean : DEFAULT_PRIOR.likert.dcLogMean,
        dcLogSD: typeof l.dcLogSD === "number" ? l.dcLogSD : DEFAULT_PRIOR.likert.dcLogSD,
      },
    };
  }
  /* Resolve a group prior: an object resolves as-is; a URL string is fetched
     as JSON (browser only; node callers pass the object). */
  function loadGroupPrior(src) {
    if (src && typeof src === "object") return Promise.resolve(src);
    if (typeof src === "string") {
      if (typeof fetch !== "function") {
        return Promise.reject(new Error("loadGroupPrior: no fetch in this environment -- pass the prior object itself (node callers must load the JSON themselves)."));
      }
      return fetch(src).then(function (r) {
        if (!r.ok) throw new Error("loadGroupPrior: HTTP " + r.status + " fetching " + src);
        return r.json();
      });
    }
    return Promise.reject(new TypeError("loadGroupPrior: expected a prior object or a URL string."));
  }

  /* Is `response` a legal outcome for a trial of this type? R = the likert
     scale's rating points. Unknown types are not legal. */
  function legalResponse(type, response, R) {
    if (typeof response !== "number" || response !== Math.floor(response)) return false;
    if (type === "triad") return response >= 0 && response <= 2;
    if (type === "quad" || type === "reftriad") return response === 0 || response === 1;
    if (type === "likert") return response >= 1 && response <= R;
    return false;
  }
  /* Should a history record count in a summary (empiricalMatrix,
     reliableVariance)? Not if the engine marked it invalid, and not if its
     response is out of range (covers histories saved without the flag). */
  function usableRecord(rec, R) {
    return !!rec && !rec.invalid && legalResponse(rec.type, rec.response, R || 7);
  }

  /* ----- empirical (model-light) similarity observations ------------------
   * One history record -> its judged pairs as [degX, degY, value], value in
   * 0..1 with 1 = more similar (triad/quad: chosen-as-more-similar indicator;
   * likert: the rating rescaled to 0..1). R = the likert scale's rating points. */
  function pairObservations(rec, R) {
    if (rec.type === "triad") {
      var g = rec.degrees;
      return [
        [g[0], g[1], rec.response === 0 ? 1 : 0],
        [g[0], g[2], rec.response === 1 ? 1 : 0],
        [g[1], g[2], rec.response === 2 ? 1 : 0],
      ];
    }
    if (rec.type === "reftriad") {
      // Only the two reference pairs are judged. The chosen (more-different)
      // comparison is the less-similar one, so it gets 0.
      var a = rec.ref, cmp = rec.comparisons;
      return [
        [a, cmp[0], rec.response === 0 ? 0 : 1],
        [a, cmp[1], rec.response === 1 ? 0 : 1],
      ];
    }
    if (rec.type === "quad") {
      return [
        [rec.pair1[0], rec.pair1[1], rec.response === 0 ? 1 : 0],
        [rec.pair2[0], rec.pair2[1], rec.response === 1 ? 1 : 0],
      ];
    }
    // likert
    return [[rec.degrees[0], rec.degrees[1], (rec.response - 1) / Math.max((R || 7) - 1, 1)]];
  }
  /*
   * Model-light full-matrix path: bin an engine's recorded responses into an
   * (anchor-bin x offset-bin) empirical similarity table. Each judged pair
   * (x, y) is credited to both rows, anchorBin(x) and anchorBin(y), at offset
   * bin |wrap(y - x)|, since s(x,y) = f + g_x has a row for each item.
   *   history : engine.history (or any array of {type, degrees|pair1/pair2|
   *             ref+comparisons, response} records)
   *   opts    : { period=360, anchorBin=period/12, offsetBin=period/24,
   *               ratingPoints=7 }. History records do not carry the period,
   *             so pass the engine's period for a 180 engine.
   * Records marked invalid (or with an out-of-range response) are skipped.
   * Returns { period, anchorBins, offsetBins, anchorBinSize, offsetBinSize,
   * mean, n } where mean[a][o] is the binned similarity (0..1) or null when
   * unsampled, and n[a][o] the observation count. Offsets run 0..period/2.
   */
  function empiricalMatrix(history, opts) {
    opts = opts || {};
    var P = periodArg(opts.period);
    var aSize = opts.anchorBin || P / 12, oSize = opts.offsetBin || P / 24;
    var nA = Math.ceil(P / aSize), nO = Math.ceil((P / 2 + 1) / oSize);
    var R = opts.ratingPoints || 7;
    var sum = [], n = [], a, o;
    for (a = 0; a < nA; a++) {
      sum.push(new Float64Array(nO));
      n.push(new Float64Array(nO));
    }
    (history || []).forEach(function (rec) {
      if (!usableRecord(rec, R)) return; // invalid (out-of-range) responses carry no similarity
      pairObservations(rec, R).forEach(function (obs) {
        var ob = Math.min(Math.floor(absDiff(obs[1], obs[0], P) / oSize), nO - 1);
        [obs[0], obs[1]].forEach(function (deg) {
          var abin = Math.floor(wrapP(deg, P) / aSize) % nA;
          sum[abin][ob] += obs[2];
          n[abin][ob] += 1;
        });
      });
    });
    var mean = [], nOut = [];
    for (a = 0; a < nA; a++) {
      var mrow = new Array(nO), nrow = new Array(nO);
      for (o = 0; o < nO; o++) {
        nrow[o] = n[a][o];
        mrow[o] = n[a][o] > 0 ? sum[a][o] / n[a][o] : null;
      }
      mean.push(mrow); nOut.push(nrow);
    }
    return { period: P, anchorBins: nA, offsetBins: nO, anchorBinSize: aSize, offsetBinSize: oSize, mean: mean, n: nOut };
  }

  /* =====================================================================
   * The adaptive engine: particle posterior + BALD trial selection.
   * ===================================================================== */
  function createEngine(opts) {
    opts = opts || {};
    // opts.state: a full snapshot from exportState({particles: true}). Its settings
    // (period, kappas, nParticles, epsilon, ratingPoints, minSeparation) replace any in
    // opts, and the particles, weights, history and anchor counts are loaded instead of
    // being drawn from the prior (see restoreEngine).
    var state = opts.state || null;
    if (state) {
      if (!state.particles || !Array.isArray(state.particles.w)) {
        throw new Error("BradySimilarity: restoring needs a snapshot from exportState({particles: true}); this one has no particles.");
      }
      opts = Object.assign({}, opts, {
        period: state.period, kappas: state.kappas, nParticles: state.nParticles, epsilon: state.epsilon,
        ratingPoints: state.ratingPoints, minSeparation: state.minSeparation, prior: null,
      });
      // The rng to continue with: opts.rng, else a seeded rng rebuilt from the saved state.
      if (!opts.rng && state.rngState != null) opts.rng = seededRng(state.rngState);
    }
    var kappas = (opts.kappas || DEFAULT_KAPPAS).slice();
    var K = kappas.length;
    var N = opts.nParticles || 400;
    var epsilon = opts.epsilon != null ? opts.epsilon : 0.2;
    var rng = opts.rng || Math.random;
    var ratingPoints = Math.max(2, Math.round(opts.ratingPoints || 7)); // a 1-point scale carries no information
    // Stimulus-space period: 360 (default) or 180. Anything else warns and uses 360.
    var P = opts.period == null ? DEFAULT_PERIOD : Number(opts.period);
    if (PERIODS.indexOf(P) < 0) {
      warn("period=" + opts.period + " is not supported (use 360, or 180 for oriented bars); using 360.");
      P = DEFAULT_PERIOD;
    }
    var HALF = P / 2; // the largest possible distance
    var minSep = opts.minSeparation != null ? Math.round(Number(opts.minSeparation)) : 8;
    // Offsets are drawn from [minSep, period/2], so minSep must sit in 0..period/2.
    if (!(minSep >= 0 && minSep <= HALF)) {
      var clampedSep = isFinite(minSep) ? Math.min(Math.max(minSep, 0), HALF) : 8;
      warn("minSeparation=" + opts.minSeparation + " is outside 0.." + HALF + "; using " + clampedSep + ".");
      minSep = clampedSep;
    }
    var prior = normalizePrior(opts.prior, K, P);
    var basis = makeBasisTable(kappas, P);
    // Reserved: per-target g_x adaptation is not implemented, so `true` only warns.
    if (opts.heterogeneous) {
      warn("heterogeneous:true (per-target g_x adaptation) is not implemented -- the engine adapts the " +
        "homogeneous falloff f only; the option is ignored. The recorded history still supports " +
        "an offline g_x fit (exact degrees are stored per trial).");
    }

    // ---- particles: theta_i = { w (simplex, K), logBeta, c0, logDc } ----
    var W = new Float64Array(N * K);     // simplex weights, row-major
    var logBeta = new Float64Array(N);
    var c0 = new Float64Array(N);
    var logDc = new Float64Array(N);
    var wgt = new Float64Array(N);       // posterior particle weights (sum 1)
    if (state) loadParticles(state.particles);
    else (function samplePrior() {
      for (var i = 0; i < N; i++) {
        var wv = randDirichlet(prior.alpha, rng);
        for (var k = 0; k < K; k++) W[i * K + k] = wv[k];
        logBeta[i] = prior.beta.logMean + prior.beta.logSD * randNorm(rng);
        c0[i] = prior.likert.c0Mean + prior.likert.c0SD * randNorm(rng);
        logDc[i] = prior.likert.dcLogMean + prior.likert.dcLogSD * randNorm(rng);
        wgt[i] = 1 / N;
      }
    })();

    // Copy a saved particle set (exportState({particles: true}).particles) into place.
    function loadParticles(pt) {
      if (pt.w.length !== N || pt.logBeta.length !== N || pt.c0.length !== N || pt.logDc.length !== N || pt.weights.length !== N) {
        throw new Error("BradySimilarity: the snapshot's particle arrays do not have nParticles (" + N + ") entries.");
      }
      for (var i = 0; i < N; i++) {
        if (pt.w[i].length !== K) throw new Error("BradySimilarity: snapshot particle " + i + " has " + pt.w[i].length + " weights for " + K + " kappas.");
        for (var k = 0; k < K; k++) W[i * K + k] = pt.w[i][k];
        logBeta[i] = pt.logBeta[i]; c0[i] = pt.c0[i]; logDc[i] = pt.logDc[i]; wgt[i] = pt.weights[i];
      }
    }

    // A restored engine starts from the snapshot's history (a deep copy, so the snapshot
    // is left untouched).
    var history = state ? JSON.parse(JSON.stringify(state.history || [])) : [];
    var cacheMean = null, cacheSD = null; // fHat / fSD caches, cleared on update

    // f for particle i at integer offset d (0..period-1).
    function fP(i, d) {
      var s = 0, base = i * K;
      for (var k = 0; k < K; k++) s += W[base + k] * basis[k][d];
      return s;
    }
    function offIdx(a, b) { return Math.round(absDiff(a, b, P)); }

    // ---- per-particle likelihood of one observed response ----
    function likelihood(i, type, spec, response) {
      var beta = Math.exp(logBeta[i]);
      if (type === "triad") {
        var g = spec.degrees;
        var p = softmax3(
          beta * fP(i, offIdx(g[1], g[0])),
          beta * fP(i, offIdx(g[2], g[0])),
          beta * fP(i, offIdx(g[2], g[1]))
        );
        return p[response];
      }
      if (type === "quad") {
        var s1 = fP(i, offIdx(spec.pair1[1], spec.pair1[0]));
        var s2 = fP(i, offIdx(spec.pair2[1], spec.pair2[0]));
        var p1 = sigmoid(beta * (s1 - s2));
        return response === 0 ? p1 : 1 - p1;
      }
      if (type === "reftriad") {
        var sB = fP(i, offIdx(spec.comparisons[0], spec.ref));
        var sC = fP(i, offIdx(spec.comparisons[1], spec.ref));
        var pB = sigmoid(beta * (sC - sB)); // P(b more different from ref)
        return response === 0 ? pB : 1 - pB;
      }
      if (type === "likert") {
        var probs = likertRow(i, offIdx(spec.degrees[1], spec.degrees[0]));
        return probs[response - 1];
      }
      throw new Error("BradySimilarity engine: unknown update type '" + type + "'");
    }
    // Ordered-logistic outcome row for particle i at offset d.
    function likertRow(i, d) {
      var beta = Math.exp(logBeta[i]);
      var dc = Math.exp(logDc[i]);
      var s = fP(i, d);
      var out = new Array(ratingPoints);
      var prev = 0;
      for (var k = 1; k < ratingPoints; k++) {
        var cum = sigmoid(c0[i] + (k - 1) * dc - beta * s);
        out[k - 1] = Math.max(cum - prev, 1e-12);
        prev = cum;
      }
      out[ratingPoints - 1] = Math.max(1 - prev, 1e-12);
      return out;
    }

    // ---- systematic resampling, then Liu-West rejuvenation ----
    // Plain jitter adds variance on every resample, so the posterior would
    // widen with each one even when the data say nothing new. Liu-West (2001)
    // first shrinks each particle toward the weighted mean by a = sqrt(1 - h^2),
    // then adds noise with SD h * (the posterior SD of that parameter). The
    // mean is unchanged and the variance comes out a^2*V + h^2*V = V. Each
    // parameter is treated separately; w is handled in log space (then put
    // back on the simplex). LW_H is the bandwidth h, default 0.1 (a = 0.995):
    // larger moves particles further per resample (more rejuvenation), smaller
    // keeps them closer to their source. 0.1 passes the seeded recovery tests
    // at period 360 and 180.
    var LW_H = 0.1;
    var LW_A = Math.sqrt(1 - LW_H * LW_H);
    // Weighted mean and SD of each parameter under the current weights:
    // index k < K is log w_k, then logBeta, c0, logDc.
    function paramMoments() {
      var D = K + 3, mean = new Float64Array(D), m2 = new Float64Array(D), i, k;
      for (i = 0; i < N; i++) {
        var g = wgt[i];
        for (k = 0; k < D; k++) {
          var v = k < K ? Math.log(W[i * K + k] + 1e-12) : k === K ? logBeta[i] : k === K + 1 ? c0[i] : logDc[i];
          mean[k] += g * v; m2[k] += g * v * v;
        }
      }
      var sd = new Float64Array(D);
      for (k = 0; k < D; k++) sd[k] = Math.sqrt(Math.max(m2[k] - mean[k] * mean[k], 0));
      return { mean: mean, sd: sd };
    }
    // Liu-West move of one value x: shrink toward the mean, add scaled noise.
    function lwMove(x, mean, sd) { return LW_A * x + (1 - LW_A) * mean + LW_H * sd * randNorm(rng); }
    function resample() {
      var pm = paramMoments(); // before resampling, from the weighted particles
      var idx = new Array(N);
      var u = rng() / N, cum = 0, j = 0, i;
      for (i = 0; i < N; i++) {
        var target = u + i / N;
        while (cum + wgt[j] < target && j < N - 1) { cum += wgt[j]; j++; }
        idx[i] = j;
      }
      var W2 = new Float64Array(N * K);
      var lb2 = new Float64Array(N), c02 = new Float64Array(N), ld2 = new Float64Array(N);
      for (i = 0; i < N; i++) {
        var src = idx[i];
        // move w in log space, then renormalize back onto the simplex
        var s = 0, k, v;
        for (k = 0; k < K; k++) {
          v = Math.exp(lwMove(Math.log(W[src * K + k] + 1e-12), pm.mean[k], pm.sd[k]));
          W2[i * K + k] = v; s += v;
        }
        for (k = 0; k < K; k++) W2[i * K + k] /= s;
        lb2[i] = lwMove(logBeta[src], pm.mean[K], pm.sd[K]);
        c02[i] = lwMove(c0[src], pm.mean[K + 1], pm.sd[K + 1]);
        ld2[i] = lwMove(logDc[src], pm.mean[K + 2], pm.sd[K + 2]);
      }
      W = W2; logBeta = lb2; c0 = c02; logDc = ld2;
      for (i = 0; i < N; i++) wgt[i] = 1 / N;
    }

    // Is `response` a legal outcome index for this trial type?
    function validResponse(type, response) {
      if (["triad", "quad", "reftriad", "likert"].indexOf(type) < 0) {
        throw new Error("BradySimilarity engine: unknown update type '" + type + "'");
      }
      return legalResponse(type, response, ratingPoints);
    }

    // ---- posterior update on one observed response ----
    function update(type, spec, response) {
      var sum = 0, i;
      // An illegal response (e.g. a rating above ratingPoints) would turn every
      // weight into NaN and wipe the posterior. Record it, skip the update.
      var usable = validResponse(type, response);
      if (!usable) {
        warn("update(\"" + type + "\") got response " + response + ", outside the legal range" +
          (type === "likert" ? " 1.." + ratingPoints : "") + "; recorded in history but not used by the posterior.");
      }
      for (i = 0; usable && i < N; i++) {
        wgt[i] *= Math.max(likelihood(i, type, spec, response), 1e-300);
        sum += wgt[i];
      }
      if (!usable) {
        // weights untouched
      } else if (!(sum > 0) || !isFinite(sum)) { // every weight underflowed: reset to uniform
        for (i = 0; i < N; i++) wgt[i] = 1 / N;
        warn("particle weights degenerated on an update; weights reset to uniform.");
      } else {
        var ess = 0;
        for (i = 0; i < N; i++) { wgt[i] /= sum; ess += wgt[i] * wgt[i]; }
        if (1 / ess < N / 2) resample();
      }
      var rec = { type: type, response: response, isCoverage: !!spec.isCoverage };
      // kept for the record, but every summary (empiricalMatrix,
      // reliableVariance, exportState counts) skips it
      if (!usable) rec.invalid = true;
      if (spec.degrees) rec.degrees = spec.degrees.slice();
      if (spec.pair1) { rec.pair1 = spec.pair1.slice(); rec.pair2 = spec.pair2.slice(); }
      if (spec.ref != null) { rec.ref = spec.ref; rec.comparisons = spec.comparisons.slice(); }
      history.push(rec);
      cacheMean = null; cacheSD = null;
    }

    // ---- posterior mean/SD of f per offset --------------------------------
    // f is linear in w, so fHat needs only the weighted mean of w (K numbers)
    // and fSD only the KxK second moment C_kl = sum_i wgt_i w_ik w_il. Both
    // are cheap to push through the basis table at all `period` offsets.
    // meanCurve/sdCurve return the cached arrays for internal use; the public
    // fHat/fSD hand out copies, so a caller can't corrupt the cache.
    function moments() {
      var wbar = new Float64Array(K);
      var C = new Float64Array(K * K);
      for (var i = 0; i < N; i++) {
        var g = wgt[i], base = i * K;
        for (var k = 0; k < K; k++) {
          wbar[k] += g * W[base + k];
          for (var l = 0; l < K; l++) C[k * K + l] += g * W[base + k] * W[base + l];
        }
      }
      return { wbar: wbar, C: C };
    }
    function meanCurve() {
      if (cacheMean) return cacheMean;
      var m = moments();
      var out = new Float64Array(P);
      for (var d = 0; d < P; d++) {
        var s = 0;
        for (var k = 0; k < K; k++) s += m.wbar[k] * basis[k][d];
        out[d] = s;
      }
      cacheMean = out;
      return out;
    }
    function sdCurve() {
      if (cacheSD) return cacheSD;
      var m = moments();
      var mean = meanCurve();
      var out = new Float64Array(P);
      for (var d = 0; d < P; d++) {
        var e2 = 0;
        for (var k = 0; k < K; k++) {
          for (var l = 0; l < K; l++) e2 += m.C[k * K + l] * basis[k][d] * basis[l][d];
        }
        out[d] = Math.sqrt(Math.max(e2 - mean[d] * mean[d], 0));
      }
      cacheSD = out;
      return out;
    }
    function fHat() { return meanCurve().slice(); }
    function fSD() { return sdCurve().slice(); }
    function posteriorMean() {
      var m = moments();
      var lb = 0, c = 0, ld = 0;
      for (var i = 0; i < N; i++) { lb += wgt[i] * logBeta[i]; c += wgt[i] * c0[i]; ld += wgt[i] * logDc[i]; }
      return { w: Array.from(m.wbar), beta: Math.exp(lb), c0: c, dc: Math.exp(ld) };
    }
    // Posterior SD of each parameter on the scale the filter moves it in.
    function posteriorSD() {
      var sd = paramMoments().sd;
      return { logW: Array.from(sd.slice(0, K)), logBeta: sd[K], c0: sd[K + 1], logDc: sd[K + 2] };
    }

    /* ---- trial selection ---------------------------------------------------
     * Epsilon-greedy. Coverage draws take offsets uniform on [minSep, period/2]
     * and stratified anchors. Adaptive draws build 48 candidates whose offsets come
     * mostly from the 12 highest-posterior-SD offsets of f, paired with one of
     * the 12 lowest-SD offsets about a third of the time and a uniform offset
     * about 15% of the time, and keep the candidate with the largest BALD score.
     * ---------------------------------------------------------------------- */
    var POOL = 48, TOPK = 12;
    function randInt(lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); } // inclusive
    function randOffset() { return randInt(minSep, HALF); }
    // ---- anchor stratification --------------------------------------------
    // The estimand is the full matrix s(x,y), so anchors must cover the space
    // as evenly as offsets do. Each anchor comes from the least-sampled of 12
    // equal bins over [0, period) (30 degrees at period 360, 15 at 180; ties
    // broken by rng), at a uniform integer position inside it. Every item
    // degree of each issued trial is tallied, not just the anchor. BALD
    // ignores anchors (f depends on offset only), so this is the only thing
    // spreading them.
    var ANCHOR_BIN = P / 12, N_ABIN = Math.ceil(P / ANCHOR_BIN);
    var anchorCounts = new Array(N_ABIN);
    for (var ab = 0; ab < N_ABIN; ab++) anchorCounts[ab] = 0;
    if (state && state.anchorCoverage && Array.isArray(state.anchorCoverage.counts) && state.anchorCoverage.counts.length === N_ABIN) {
      anchorCounts = state.anchorCoverage.counts.slice();
    }
    function stratAnchor() {
      var min = Infinity, i;
      for (i = 0; i < N_ABIN; i++) if (anchorCounts[i] < min) min = anchorCounts[i];
      var ties = [];
      for (i = 0; i < N_ABIN; i++) if (anchorCounts[i] === min) ties.push(i);
      var bin = ties[Math.floor(rng() * ties.length)];
      return wrapP(bin * ANCHOR_BIN + Math.floor(rng() * ANCHOR_BIN), P);
    }
    function countAnchors(degs) {
      for (var i = 0; i < degs.length; i++) anchorCounts[Math.floor(wrapP(degs[i], P) / ANCHOR_BIN) % N_ABIN]++;
    }
    function anchorCoverage() { return { binSize: ANCHOR_BIN, counts: anchorCounts.slice() }; }
    // Offsets in [minSep, period/2] ranked by current posterior SD of f.
    function sdPools() {
      var sd = sdCurve();
      var offs = [];
      for (var d = minSep; d <= HALF; d++) offs.push(d);
      offs.sort(function (a, b) { return sd[b] - sd[a]; });
      return { high: offs.slice(0, TOPK), low: offs.slice(-TOPK) };
    }
    function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
    // Draw an offset: 15% uniform, then `altPool` (if given) up to 50%, else `pool`.
    function drawOffset(pool, altPool) {
      var u = rng();
      if (u < 0.15) return randOffset();          // a couple of random ones
      if (altPool && u < 0.5) return pick(altPool);
      return pick(pool);
    }
    // All pairwise |offsets| among `degs` >= minSep? (Always true while
    // `relaxSep` is set; see select().)
    var relaxSep = false;
    function separated(degs) {
      if (relaxSep) return true;
      for (var i = 0; i < degs.length; i++) {
        for (var j = i + 1; j < degs.length; j++) {
          if (absDiff(degs[i], degs[j], P) < minSep) return false;
        }
      }
      return true;
    }

    // ---- candidate constructors (shared by coverage and adaptive draws) ----
    // Triad: anchor a; b = a + d1, c = a - d2, so the third pair spans d1+d2.
    // A random mirror balances handedness (f is symmetric; the data may not be).
    // Each returns null if 60 tries never satisfy minSep.
    function makeTriad(d1, d2) {
      for (var t = 0; t < 60; t++) {
        var a = stratAnchor();
        var sgn = rng() < 0.5 ? 1 : -1;
        var degs = [a, wrapP(a + sgn * d1, P), wrapP(a - sgn * d2, P)];
        if (separated(degs)) return degs;
        // The d1+d2 wrap can collide. Redraw BOTH offsets: redrawing only d2
        // would keep d1 fixed and skew d2 toward small values. Rejecting the
        // pair keeps a coverage draw uniform over the feasible (d1, d2) region.
        d1 = randOffset(); d2 = randOffset();
      }
      return null;
    }
    function makeQuad(d1, d2) {
      for (var t = 0; t < 60; t++) {
        var a = stratAnchor(), c = stratAnchor();
        var s1 = rng() < 0.5 ? 1 : -1, s2 = rng() < 0.5 ? 1 : -1;
        var degs = [a, wrapP(a + s1 * d1, P), c, wrapP(c + s2 * d2, P)];
        if (separated(degs)) return degs;
      }
      return null;
    }
    function makePair(d1) {
      var a = stratAnchor();
      var sgn = rng() < 0.5 ? 1 : -1;
      return [a, wrapP(a + sgn * d1, P)];
    }

    // ---- BALD mutual information of one candidate over the particles ----
    // score = H[ sum_i wgt_i p(y|theta_i) ] - sum_i wgt_i H[ p(y|theta_i) ]
    function entropy(p) {
      var h = 0;
      for (var y = 0; y < p.length; y++) { if (p[y] > 0) h -= p[y] * Math.log(p[y]); }
      return h;
    }
    function bald(kind, degs) {
      var m = kind === "triad" ? 3 : (kind === "quad" || kind === "reftriad") ? 2 : ratingPoints;
      var pbar = new Float64Array(m);
      var hCond = 0;
      for (var i = 0; i < N; i++) {
        var p;
        if (kind === "triad") {
          var beta = Math.exp(logBeta[i]);
          p = softmax3(
            beta * fP(i, offIdx(degs[1], degs[0])),
            beta * fP(i, offIdx(degs[2], degs[0])),
            beta * fP(i, offIdx(degs[2], degs[1]))
          );
        } else if (kind === "reftriad") {
          // degs = [ref, b, c]; 2-outcome "which comparison is more different from ref"
          var br = Math.exp(logBeta[i]);
          var pB = sigmoid(br * (fP(i, offIdx(degs[2], degs[0])) - fP(i, offIdx(degs[1], degs[0]))));
          p = [pB, 1 - pB];
        } else if (kind === "quad") {
          var b2 = Math.exp(logBeta[i]);
          var p1 = sigmoid(b2 * (fP(i, offIdx(degs[1], degs[0])) - fP(i, offIdx(degs[3], degs[2]))));
          p = [p1, 1 - p1];
        } else {
          p = likertRow(i, offIdx(degs[1], degs[0]));
        }
        var g = wgt[i];
        for (var y = 0; y < m; y++) pbar[y] += g * p[y];
        hCond += g * entropy(p);
      }
      return entropy(pbar) - hCond;
    }

    // ---- the shared next-trial driver ----
    function select(kind, opts2) {
      var force = !!(opts2 && opts2.forceCoverage);
      var isCoverage = force || rng() < epsilon;
      var degs = null, d1, d2;
      if (isCoverage) {
        // Coverage draw (no BALD score, so score = null). On a circle of P
        // degrees three points can't all be more than P/3 apart and four can't
        // be more than P/4 apart (120 and 90 at P = 360; 60 and 45 at P = 180),
        // so a large minSep is unsatisfiable for triads/quads. After 200 failed
        // rounds the separation check is dropped for this one draw instead of
        // looping forever.
        var rounds = 0;
        do {
          if (rounds++ === 200) {
            relaxSep = true;
            warn("minSeparation=" + minSep + " could not be met for a " + kind +
              " trial; drew one without the separation constraint. Use a smaller minSeparation.");
          }
          d1 = randOffset(); d2 = randOffset();
          degs = (kind === "triad" || kind === "reftriad") ? makeTriad(d1, d2)
               : kind === "quad" ? makeQuad(d1, d2)
               : makePair(d1);
        } while (!degs);
        relaxSep = false;
        countAnchors(degs);
        return { degs: degs, isCoverage: true, score: null };
      }
      var pools = sdPools();
      var best = null, bestScore = -Infinity;
      for (var c = 0; c < POOL; c++) {
        d1 = drawOffset(pools.high, null);              // the uncertain offset
        d2 = drawOffset(pools.high, pools.low);         // contrast: well-known (or another uncertain/random)
        var cand = (kind === "triad" || kind === "reftriad") ? makeTriad(d1, d2)
                 : kind === "quad" ? makeQuad(d1, d2)
                 : makePair(d1);
        if (!cand) continue;
        var score = bald(kind, cand);
        if (score > bestScore) { bestScore = score; best = cand; }
      }
      if (!best) { // no candidate met minSep: fall back to a coverage draw
        return select(kind, { forceCoverage: true });
      }
      countAnchors(best);
      return { degs: best, isCoverage: false, score: bestScore };
    }
    function nextTriad(o) { var s = select("triad", o); return { degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }
    function nextRefTriad(o) { var s = select("reftriad", o); return { ref: s.degs[0], comparisons: [s.degs[1], s.degs[2]], degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }
    function nextQuad(o) { var s = select("quad", o); return { pair1: [s.degs[0], s.degs[1]], pair2: [s.degs[2], s.degs[3]], isCoverage: s.isCoverage, score: s.score }; }
    function nextPair(o) { var s = select("pair", o); return { degrees: s.degs, isCoverage: s.isCoverage, score: s.score }; }

    /* ---- reliable-variance diagnostic (approximate) ------------------------
     * Split the stored coverage responses into odd/even halves and bin each
     * half's similarity signal (pairObservations) by |offset|, in 13 bins of
     * period/24 degrees (15 at period 360, 7.5 at 180). r = correlation of the
     * two halves across bins; amp^2 = variance of the combined binned means; amp2r = amp^2 * max(r, 0). A rough split-half
     * stand-in for a smoother's reliable-variance objective, good only as a
     * stopping heuristic.
     * ---------------------------------------------------------------------- */
    var RV_BIN = P / 24; // deg per offset bin
    function binMeans(recs) {
      var nBins = Math.ceil((HALF + 1) / RV_BIN);
      var sum = new Float64Array(nBins), n = new Float64Array(nBins);
      recs.forEach(function (rec) {
        pairObservations(rec, ratingPoints).forEach(function (o) {
          var b = Math.min(Math.floor(absDiff(o[1], o[0], P) / RV_BIN), nBins - 1);
          sum[b] += o[2]; n[b] += 1;
        });
      });
      var out = new Array(nBins);
      for (var b = 0; b < nBins; b++) out[b] = n[b] > 0 ? sum[b] / n[b] : null;
      return out;
    }
    function pearson(xs, ys) {
      var n = xs.length;
      if (n < 3) return 0;
      var mx = 0, my = 0, i;
      for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
      mx /= n; my /= n;
      var sxy = 0, sxx = 0, syy = 0;
      for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my); }
      return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
    }
    function reliableVariance() {
      var cov = history.filter(function (h) { return h.isCoverage && usableRecord(h, ratingPoints); });
      if (cov.length === 0) return { amp2r: 0, r: 0, nCoverage: 0 };
      var hA = cov.filter(function (h, i) { return i % 2 === 0; });
      var hB = cov.filter(function (h, i) { return i % 2 === 1; });
      var mA = binMeans(hA), mB = binMeans(hB), mAll = binMeans(cov);
      var xs = [], ys = [], all = [];
      for (var b = 0; b < mAll.length; b++) {
        if (mA[b] != null && mB[b] != null) { xs.push(mA[b]); ys.push(mB[b]); }
        if (mAll[b] != null) all.push(mAll[b]);
      }
      var r = pearson(xs, ys);
      // amp^2: variance of the binned combined means (the structure's spread)
      var amp2 = 0;
      if (all.length > 1) {
        var m = all.reduce(function (a, v) { return a + v; }, 0) / all.length;
        amp2 = all.reduce(function (a, v) { return a + (v - m) * (v - m); }, 0) / (all.length - 1);
      }
      return { amp2r: amp2 * Math.max(r, 0), r: r, nCoverage: cov.length };
    }

    /* ---- JSON-able snapshot for saving with the data ----
       * Default: posterior summaries (means and f curves, not the particles) + history.
       * exportState({particles: true}) adds `particles` ({w: [N][K], logBeta, c0, logDc,
       * weights}, each of length N) and `rngState` (the state of a BradySimilarity.seededRng,
       * else null). That full snapshot is what restoreEngine(state) continues from. */
    function exportState(o) {
      var pm = posteriorMean();
      var nInvalid = history.filter(function (h) { return h.invalid; }).length;
      var out = {
        version: 1,
        period: P, // the stimulus space; degrees in history are in [0, period)
        kappas: kappas.slice(),
        nParticles: N,
        epsilon: epsilon,
        ratingPoints: ratingPoints,
        minSeparation: minSep,
        nResponses: history.length - nInvalid, // responses the posterior used
        nInvalid: nInvalid,                     // out-of-range records kept in history
        posterior: pm,
        fHat: Array.from(meanCurve()),
        fSD: Array.from(sdCurve()),
        reliableVariance: reliableVariance(),
        anchorCoverage: anchorCoverage(),
        // full trial-by-trial record with exact degrees, enough for an offline
        // refit including a per-target g_x fit
        history: history.slice(),
      };
      if (o && o.particles) {
        var pw = [], i, k;
        for (i = 0; i < N; i++) { var row = []; for (k = 0; k < K; k++) row.push(W[i * K + k]); pw.push(row); }
        out.particles = { w: pw, logBeta: Array.from(logBeta), c0: Array.from(c0), logDc: Array.from(logDc), weights: Array.from(wgt) };
        // A seeded rng can be resumed from its state; Math.random (or a custom rng) cannot,
        // so rngState is null then and a restored engine draws different trials.
        out.rngState = typeof rng.getState === "function" ? rng.getState() : null;
        out.history = JSON.parse(JSON.stringify(history));
      }
      return out;
    }

    /* A shuffled copy of `arr` (Fisher-Yates), drawn from the engine's rng. */
    function shuffle(arr) {
      var out = arr.slice();
      for (var i = out.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1));
        var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    }

    return {
      period: P,
      rng: rng,
      shuffle: shuffle,
      kappas: kappas,
      nParticles: N,
      epsilon: epsilon,
      ratingPoints: ratingPoints,
      minSeparation: minSep,
      history: history,
      update: update,
      fHat: fHat,
      fSD: fSD,
      posteriorMean: posteriorMean,
      posteriorSD: posteriorSD,
      anchorCoverage: anchorCoverage,
      nextTriad: nextTriad,
      nextRefTriad: nextRefTriad,
      nextQuad: nextQuad,
      nextPair: nextPair,
      reliableVariance: reliableVariance,
      exportState: exportState,
    };
  }

  /* Rebuild an engine from exportState({particles: true}) so a session can continue (after
     a page reload, or in a second session). opts may add an `rng`; without one, a snapshot
     of a seededRng engine resumes that rng from its saved state, so the restored engine
     hands out exactly the trials the original would have. A snapshot of a Math.random (or
     custom-rng) engine has rngState null: pass an rng; the restored engine continues the
     posterior, but not the same random draws. */
  function restoreEngine(state, opts) {
    return createEngine(Object.assign({}, opts || {}, { state: state }));
  }

  global.BradySimilarity = {
    version: "1.1.0",
    DEFAULT_KAPPAS: DEFAULT_KAPPAS.slice(),
    DEFAULT_PERIOD: DEFAULT_PERIOD,
    seededRng: seededRng,
    fOf: fOf,
    fCurve: fCurve,
    triadProbs: triadProbs,
    refTriadProb: refTriadProb,
    quadProb: quadProb,
    likertProbs: likertProbs,
    loadGroupPrior: loadGroupPrior,
    empiricalMatrix: empiricalMatrix,
    createEngine: createEngine,
    restoreEngine: restoreEngine,
  };
})(typeof window !== "undefined" ? window : this);
