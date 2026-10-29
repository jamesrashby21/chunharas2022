# API reference: BradySimilarity, BradyColorWheel and BradyUtils

The plugins are configured through their trial parameters (see `reference.html`). This
page covers the three JavaScript globals you can also call from your own experiment
code. All three are in `brady-plugins.bundle.js`; with separate files, load
`brady-color-wheel.js` → `brady-plugin-utils.js` → `similarity-adaptive-utils.js` →
the plugins.

For what the adaptive engine is for and a complete study recipe, read "Adaptive
similarity tasks" in README.md first. This page is the reference.

Contents: [BradySimilarity](#bradysimilarity-the-adaptive-similarity-engine) ·
[BradyColorWheel](#bradycolorwheel-color-wheels) · [BradyUtils](#bradyutils-helpers-you-may-call)

---

## BradySimilarity: the adaptive-similarity engine

Defined in `similarity-adaptive-utils.js`. The module also runs in plain node: under
`require()` the namespace is `require("./similarity-adaptive-utils.js").BradySimilarity`,
or `global.BradySimilarity` if you define `global.window = global` first. The only
browser call (`fetch`, in `loadGroupPrior`) is guarded.

### The model

The estimand is the similarity matrix `s(x, y) = f(Δ) + g_x(Δ)`, with
`Δ = wrap(y − x)`: a homogeneous falloff `f` plus per-target deviations `g_x`. The
engine adapts only `f`. Every trial records exact degrees and signed offsets, so `g_x`
(or any other matrix estimator) can be fit offline from the history.

`f` is a peak-normalized von Mises basis, periodic in the period P (360 or 180):

    f(Δ; w) = Σ_k w_k · exp(κ_k · (cos(2πΔ/P) − 1))

with default κ = [0.5, 2, 8, 32] and w on the simplex (w_k ≥ 0, Σ w_k = 1), so
f(0) = 1, f(−Δ) = f(Δ) and f(Δ + P) = f(Δ). With P = 180 each κ acts on the doubled
angle, so the same κ give the same falloff shape over [0, 90] that they give over
[0, 180] at P = 360.

Four choice likelihoods share one precision β > 0 (larger = more deterministic):

| Type | Outcome coding | Probability |
|---|---|---|
| `"triad"` | odd-one-out over `[a, b, c]`: the most-similar pair, 0 = AB, 1 = AC, 2 = BC | softmax(β·[s(a,b), s(a,c), s(b,c)]) |
| `"reftriad"` | reference `ref`, comparisons `b, c`: 0 = b judged more different, 1 = c | P(b) = logistic(β·[s(ref,c) − s(ref,b)]) |
| `"quad"` | pairs (A,B) vs (C,D): 0 = pair1 judged more similar | P(pair1) = logistic(β·[s(A,B) − s(C,D)]) |
| `"likert"` | rating r in 1..R, higher = more similar | ordered logistic, thresholds c_k = c0 + (k−1)·exp(logDc): P(r ≤ k) = logistic(c_k − β·s) |

The engine keeps a particle-filter posterior over θ = {w, logBeta, c0, logDc}. Each
response reweights the particles by its likelihood. When the effective sample size
falls below nParticles/2 it resamples (systematic) and applies a Liu–West move:
shrink each particle toward the weighted mean by a = √(1 − h²), then add noise with
SD h × that parameter's posterior SD, h = 0.1. This refreshes the particles without
widening the posterior.

Trial selection: each trial is a **coverage** trial with probability `epsilon`, an
independent draw per trial (so the number of coverage trials varies around
`epsilon × trials`; it is not a fixed fraction). A coverage trial has offsets
uniform on [`minSeparation`, period/2]. Otherwise the engine scores about 48
candidates by BALD mutual information and takes the best; candidate offsets come
mostly from where the posterior SD of `f` is highest. Anchors (the items' positions
on the circle) are stratified over 12 equal bins (30° at period 360, 15° at 180),
least-sampled bin first, so every row of the matrix stays estimable.

All randomness goes through `opts.rng`, so an engine built with
`seededRng(seed)` is fully deterministic. The plugins also shuffle left/right and
layout order with `engine.shuffle`, so a seeded engine reproduces the screen too.

### Functions

| Call | Returns |
|---|---|
| `seededRng(seed)` | `() => [0, 1)` (mulberry32). `rng.getState()` returns a state that `seededRng(state)` continues from. |
| `createEngine(opts)` | an engine (below) |
| `restoreEngine(state[, opts])` | an engine rebuilt from `exportState({particles: true})`; same as `createEngine({state})`. Settings come from the snapshot; the rng is `opts.rng`, else `seededRng(state.rngState)`. A seeded engine restored this way hands out exactly the trials the uninterrupted engine would have. An engine that used `Math.random` (its `rngState` is null) resumes on the same posterior but not the same random stream. |
| `empiricalMatrix(history[, opts])` | the model-light anchor × offset table (below) |
| `loadGroupPrior(urlOrObject)` | `Promise<prior>` (below) |
| `fOf(Δ, w[, kappas[, period]])` | f at Δ (non-integer Δ is fine) |
| `fCurve(w[, kappas[, period]])` | `Float64Array(period)`, f at 0..period−1 |
| `triadProbs(degrees, theta[, kappas[, period]])` | `[pAB, pAC, pBC]` |
| `refTriadProb(ref, b, c, theta[, kappas[, period]])` | P(b judged more different) |
| `quadProb(pair1, pair2, theta[, kappas[, period]])` | P(pair1 judged more similar) |
| `likertProbs(degrees, theta, R[, kappas[, period]])` | R probabilities |
| `DEFAULT_KAPPAS`, `DEFAULT_PERIOD` | `[0.5, 2, 8, 32]`, `360` |

In the model functions `period` defaults to 360; a value other than 360 or 180 throws.
Pass `null` for `kappas` to keep the defaults. `theta` is `{w, logBeta[, c0, logDc]}`.

### `createEngine(opts)`

| Option | Default | Meaning |
|---|---|---|
| `period` | 360 | 360 for hues and pointed shapes, 180 for lines, Gabors and gratings. Other values warn and use 360. |
| `epsilon` | 0.2 | per-trial probability of a coverage trial |
| `rng` | `Math.random` | the random source; pass `seededRng(seed)` for a reproducible session |
| `minSeparation` | 8 | minimum offset between any two items on a trial (integer degrees, clamped to 0..period/2) |
| `nParticles` | 400 | particle count |
| `kappas` | `DEFAULT_KAPPAS` | basis widths |
| `ratingPoints` | 7 | likert scale length R (at least 2) |
| `prior` | none | a group prior (from `loadGroupPrior`); one fit in the other period is ignored with a warning |
| `heterogeneous` | false | reserved for adaptive targeting of `g_x`, which is not implemented; `true` only warns |

### Engine methods and properties

| Member | What it does |
|---|---|
| `nextRefTriad([{forceCoverage}])` | `{ref, comparisons: [b, c], degrees: [ref, b, c], isCoverage, score}` |
| `nextTriad([{forceCoverage}])` | `{degrees: [a, b, c], isCoverage, score}` |
| `nextQuad([{forceCoverage}])` | `{pair1: [a, b], pair2: [c, d], isCoverage, score}` |
| `nextPair([{forceCoverage}])` | `{degrees: [a, b], isCoverage, score}` |
| `update(type, spec, response)` | records one response and updates the posterior. `type` is `"triad"`, `"reftriad"`, `"quad"` or `"likert"`; `spec` is the object a `next*` call returned (or `{degrees}` / `{pair1, pair2}` / `{ref, comparisons}`, with an optional `isCoverage`); `response` uses the outcome coding in the table above. An out-of-range response is kept in `history` with `invalid: true` and a warning, and is skipped by the posterior, `empiricalMatrix`, `reliableVariance` and `nResponses`. |
| `fHat()` / `fSD()` | `Float64Array(period)`: posterior mean / SD of f at offsets 0..period−1 (a fresh copy each call) |
| `posteriorMean()` | `{w, beta, c0, dc}`: w and c0 are posterior means; beta and dc are exp of the posterior mean of their logs |
| `posteriorSD()` | `{logW: [K], logBeta, c0, logDc}`: posterior SDs on the filter's own scales |
| `anchorCoverage()` | `{binSize, counts: [12]}`: items issued per anchor bin |
| `reliableVariance()` | `{amp2r, r, nCoverage}`: a rough split-half diagnostic from the coverage trials only. Their similarity signal is binned by offset (13 bins of period/24°) for odd and even halves; `r` is the correlation of the halves across bins and `amp2r` = variance of the combined bin means × max(r, 0). With 20% coverage trials it rests on few trials, so treat it as a heuristic, not a stopping rule. |
| `exportState([{particles: true}])` | a JSON-able snapshot (below) |
| `history` | one record per response: `{type, response, isCoverage, degrees, ...}` plus `ref`/`comparisons` (reftriad) or `pair1`/`pair2` (quad), and `invalid: true` when out of range. Degrees are in [0, period). History records do not carry the period. |
| `period`, `rng`, `shuffle(array)` | the period; the random source; a shuffled copy drawn from `rng` |

### `exportState()`

The default snapshot holds posterior **summaries**, not the particles:

```
{ version: 1, period, kappas, nParticles, epsilon, ratingPoints, minSeparation,
  nResponses,          // responses the posterior used
  nInvalid,            // out-of-range records kept in history
  posterior,           // posteriorMean(): {w, beta, c0, dc}
  fHat, fSD,           // arrays of length period
  reliableVariance, anchorCoverage,
  history }            // every response with exact degrees: enough for an offline refit
```

`exportState({particles: true})` adds `particles` (`{w: [N][K], logBeta, c0, logDc,
weights}`, each of length N) and `rngState` (the seeded rng's state, else null). Only
this full snapshot can be passed to `restoreEngine`. It is about 400 × 7 numbers
larger, so save it only if you need to resume a session.

### `empiricalMatrix(history[, opts])`

Bins the recorded responses into an anchor × offset similarity table:
`{period, anchorBins, offsetBins, anchorBinSize, offsetBinSize, mean, n}`.
`mean[a][o]` is the binned similarity signal in 0..1 (null for an empty bin) and
`n[a][o]` its count; each judged pair is credited to both members' anchor rows.
Options: `period` (default 360; pass `engine.period` or the saved `period`, since
history records don't carry it), `anchorBin` (default period/12), `offsetBin`
(default period/24), `ratingPoints` (default 7, for likert histories).

### Group priors

`loadGroupPrior(urlOrObject)` reads a prior for `createEngine({prior})`. No prior file
ships with the plugins: you write one from a pooled fit of earlier participants (for
example the means and SDs of their `posterior` values). The format:

```
{ version: 1,
  period: 360,                         // optional; 360 or 180, missing = 360
  alpha:  [/* one Dirichlet concentration per kappa */],
  beta:   { logMean, logSD },
  likert: { c0Mean, c0SD, dcLogMean, dcLogSD } }
```

Missing fields fall back to the defaults. In node (no `fetch`) pass the object, not a
URL.

### Limitations

The engine covers circular spaces of whole degrees with a 360° or 180° period. The
plugins accept image and text items in fixed designs only; there is no ordinal
embedding for face or object sets.

---

## BradyColorWheel: color wheels

`window.BradyColorWheel` is the active wheel. The default comes from
`brady-color-wheel.js`; the alternative wheel files replace it (README.md, "Swapping
the color wheel").

| Member | What it is |
|---|---|
| `name` | the wheel's name, recorded in each trial as `color_wheel_name` (`"schurgin-brady-2020"`, `"zhang-luck"`, `"bae-flombaum"`, `"hemmer-hsl"`, or `"custom"`) |
| `colors`, `length` | the `[r, g, b]` list and its length |
| `rgb(deg)` | a copy of the `[r, g, b]` at a degree, rounded to the nearest entry and wrapped (−10 = 350; `"120"` counts as 120). A degree that is not a number gives neutral gray `[128, 128, 128]` and warns once. |
| `css(deg)` | the same color as an `"rgb(r,g,b)"` string |
| `make(colors[, name])` | builds a new wheel object |

`make(colors, name)` expects exactly 360 entries: entry d is the color at wheel degree
d, as `[r, g, b]` sRGB values 0–255 (fractions are fine; `css()` rounds). Any other
length still builds a wheel (degree d uses entry round(d/360·n)) but warns once,
since it is usually a mistake (three colors meant as a palette, say). Give it a name
so your data records which wheel was used:

```js
const myColors = Array.from({ length: 360 }, (_, d) => [d * 255 / 359, 128, 128]);
const myWheel = BradyColorWheel.make(myColors, "my-red-ramp");
// then, per trial: { type: jsPsychContinuousReport, color_wheel: myWheel }
```

---

## BradyUtils: helpers you may call

`window.BradyUtils` holds the shared code every plugin uses. Most of it is internal;
these are the parts that are useful from experiment code. Plugin authors: the full
list is in the comment block at the top of `brady-plugin-utils.js`, and the rules for
using it are in CONVENTIONS.md §4.

| Call | What it does |
|---|---|
| `PLACEMENT_WARNINGS` | set to `false` once after the scripts load to silence every parameter warning and note |
| `colorWheelCSS(deg[, wheel])` / `colorWheelRGB(deg[, wheel])` | a wheel color as `"rgb(...)"` / `[r, g, b]` |
| `randomColorDegrees(n, minDiff[, rng])` | `n` wheel degrees at least `minDiff` apart (falls back to evenly spaced ones, with a warning, when they can't fit) |
| `randInt(min, max[, rng])` | an inclusive random integer |
| `seededRng(seed)` | a seeded rng (mulberry32), for replayable draws |
| `wrap360(v)`, `angleDiff(a, b)`, `circularDiff(a, b, period)` | circular arithmetic; `angleDiff` is `a − b` wrapped to (−180, 180] |
| `circularMean(degs)`, `ensembleTarget(degs)` | the circular mean of some degrees; `ensembleTarget` is NaN when the mean is undefined (degrees that cancel out) |
| `shapePeriod(shape)` | 180 for `"line"`, `"gabor"`, `"grating"`; 360 otherwise |
| `rotateHueLab(rgb, deg)` | rotates a color's CIELAB hue angle; positive = forward along the wheel |
| `rgb2lab(rgb)` / `lab2rgb(lab)` | sRGB ↔ CIELAB (D65) |
| `sameColor(a, b[, wheel])` | true when two color specs resolve to the same RGB (a degree, its `rgb(...)`, a `#hex`) |
| `resolveItem(spec, wheel[, forceType])` | how a stimulus spec will be drawn: `{kind: "color", css}`, `{kind: "image", src}` or `{kind: "text", text}` |
| `registerNoise(name, fn)` / `registerMask(name, fn)` | add a noise or mask kind for `noise_type` / `mask_type`. `fn(ctx, size, level, opts)` for noise, `fn(ctx, size, opts)` for masks, with `opts = {wheel, rng, source}`. |
| `noiseKinds` / `maskKinds` | the registries (built in: `speckle`, `salt-pepper`, `gaussian`; `color-squares`, `noise`, `scramble`) |
