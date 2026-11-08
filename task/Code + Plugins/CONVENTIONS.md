# Authoring conventions for the Brady-lab jsPsych v8 plugins

Every plugin in `all_plugins_v8/` follows these rules, so the plugins stay
consistent, load with a plain `<script>` tag, and behave correctly under jsPsych v8.
Read this before adding or editing a plugin. Use these three files as reference
implementations: `jspsych-change-detection.js` (timer/callback driven),
`jspsych-2afc-keyboard.js` (async/await driven) and
`jspsych-continuous-report.js` (mouse/canvas driven).

This file is the contract for plugin code. The user-facing description of the same
behavior lives in one place each, and this file links there rather than repeating it:
README.md ("What gets recorded", "Shared conventions", "Gabors and gratings",
"Placement rules", "Adaptive similarity tasks"), API.md (the `BradySimilarity`,
`BradyColorWheel` and `BradyUtils` API) and CHANGELOG.md. §12 defines the terms used
in all of them. When a change alters what a plugin records, bump its `version` (jsPsych
writes it into every row as `plugin_version`) and add a CHANGELOG.md block headed by
the new version.

## 1. File wrapper

Each plugin is an IIFE that receives the global `jsPsychModule` and returns the
plugin class. Get `ParameterType` from the argument:

```js
var jsPsychMyThing = (function (jspsych) {
  "use strict";
  const U = window.BradyUtils;            // shared helpers (optional)
  const version = "2.0.0";
  const info = { name: "my-thing", version, parameters: {...}, data: {...} };
  class MyThingPlugin {
    constructor(jsPsych) { this.jsPsych = jsPsych; }
    trial(display_element, trial) { /* ... */ }
  }
  MyThingPlugin.info = info;
  return MyThingPlugin;
})(jsPsychModule);
```

Load order in HTML: `brady-color-wheel.js` → `brady-plugin-utils.js` → plugins.
The three `jspsych-similarity-*` plugins also need `similarity-adaptive-utils.js`,
loaded after `brady-plugin-utils.js` and before them (see §10).
`brady-plugins.bundle.js` already contains all of these in this order.

## 2. `info` object

- Always include `name`, `version` (string), `parameters`, and a `data` schema
  (v8 warns without `version`/`data`).
- Each parameter: `{ type: jspsych.ParameterType.X, default: ... , array?: true }`.
  Give every parameter a JSDoc comment describing it. These comments are the docs:
  `build-reference.js` copies them into `reference.html`.
- Common types: `HTML_STRING`, `STRING`, `INT`, `FLOAT`, `BOOL`, `KEYS`,
  `IMAGE`, `OBJECT`, `FUNCTION`. Keys are strings (`"f"`, `" "`, `"ArrowLeft"`),
  never keycodes.
- **A parameter that accepts an array must be declared `array: true` or `OBJECT`.**
  jsPsych 8 only warns when a value doesn't match a `STRING`, `FLOAT` or `BOOL`
  declaration, but it truncates a non-integer passed to a non-array `INT`, so an
  array given to an `INT` parameter silently becomes `NaN`. Use `array: true` when
  the value is always an array (`item_positions`), and `OBJECT` when it can be a
  scalar or an array (`rsvp`'s `item_duration`/`isi`, `wm-pairs`'s `which_test`,
  `noise-dots`'s `noise_level`). An `OBJECT` parameter must normalize both forms
  itself, and its JSDoc must say which forms it takes.

## 3. Ending a trial

jsPsych ends a trial when `trial()` (a) calls `this.jsPsych.finishTrial(data)`,
or (b) is an `async` method whose returned Promise resolves, in which case the
resolved value is the data.

So:
- If the trial is driven by timers or event listeners (it returns before the
  response happens), `trial()` must be synchronous and call
  `this.jsPsych.finishTrial(data)` later. Do not mark it `async`: an async
  method that returns immediately makes jsPsych end the trial at once with no
  data. If you need to wait for setup (e.g. image preloads), keep `trial()` sync
  and run the body inside `loadImages(...).then(...)`.
- If the trial is driven entirely by `await` (e.g. `await getKeyboardResponse`),
  you may make `trial()` `async` and `return` the data object at the end
  instead of calling `finishTrial`.

Pick one style per plugin. Don't mix `finishTrial` with returning data.

A callback-driven trial often has more than one way to end (a `trial_duration`
timeout, a key release, a click during the keyup wait), and a promise can settle after
jsPsych has already moved on. Create `const finishOnce = U.makeFinisher(jsPsych)` at the
top of `trial()` and end the trial only through `finishOnce(data)`. It calls
`finishTrial` the first time, while the trial is still current, and does nothing
after that. `finishOnce.guard(fn)` wraps a callback so it runs only while the trial is
live, and `finishOnce.onEnd(fn)` registers cleanup (e.g. a confidence popup's
`teardown`) that runs when the trial ends.

## 4. Use the shared helpers (`window.BradyUtils`)

- `resolveItem(spec, wheel, forceType)` → `{kind:"color",css}` / `{kind:"image",src}`
  / `{kind:"text",text}`. It lets one `stimuli` array hold colors, images, text, or
  color-wheel degrees. Use it for every item input.
- `colorWheelCSS(deg[, wheel])` / `colorWheelRGB`, `rotateHueLab(rgb, deg)`, `rgb2lab`,
  `lab2rgb`, `labStringToCss`, `cssToRgb`.
- `isNumericString(s)`: true for `"120"`, `"-10"`, `"45.5"`. Where a spec is known to be
  a color, a numeric string is a wheel degree (`"120"` and `120` give the same color).
  Under `item_type:"auto"`, `resolveItem` still reads `"120"` as text.
- `sameColor(a, b[, wheel])`: compares two color specs by resolved RGB, so a degree, its
  `rgb(...)` string, a `#hex` and a `lab(...)` of the same color are equal. Use it for
  same/different scoring (`was_same`), never a string comparison.
- `isNeutralLab(L, a, b)`: the one neutral-pixel rule (L\* < 5, L\* > 95, or |a\*| and
  |b\*| both < 5). `rotateCanvasHue` (memory items) and `makeRecolorCache` (probes) both
  use it, so an object and its probe at the same rotation match pixel for pixel.
- `wrap360`, `angleDiff`, `circularMean`, `circularDiff(a, b, period)`.
- `shapePeriod(shape)`: the item-shape period rule (180 for line/gabor/grating, else 360).
  `resolveGrating`, `gratingPhase`, `gratingPixels` and `drawGrating`: the Gabor/grating
  painter (§5).
- `ensembleTarget(degs)`: the target of an ensemble (`which_test:-1`) report, the
  circular mean of the item degrees. NaN when the mean is undefined; record a null
  target and error then. Every report plugin with an ensemble mode scores against it.
- Randomness: `randInt(min, max[, rng])`, `randomColorDegrees(n, minDiff[, rng])`
  (always returns `n` angles; falls back to evenly spaced ones, with a warning, when `n`
  can't be `minDiff` apart), and `seededRng(seed)` (mulberry32). Passing a seeded rng
  to these, `resolvePositions` or `generateFoils` replays those draws exactly.
- `resolvePositions(trial, setSize, opts)` → `{pos, nph}`: the `item_positions` rule
  (§5). Never resolve positions by hand.
- `generateFoils(target, k, minDeg, opts)`: `k` foil colors, each at least `minDeg`
  from the target and from each other. A wheel-degree target gets wheel foils. Any
  other target (CSS, `lab()`, `[r,g,b]`) gets its own color hue-rotated in CIELAB,
  using only rotations that stay inside the sRGB gamut, so the foils keep its lightness
  and chroma. It warns once when not all `k` fit.
- `fixNaNParams(trial, info, plugin)`: call it first thing in `trial()`, as
  `trial = U.fixNaNParams(trial, info, info.name)`. A NaN numeric (INT/FLOAT, non-array)
  parameter gets its default, with a warning that names the likely cause
  (`jsPsych.timelineVariable` inside a function). It never modifies jsPsych's copy of
  the parameters: when it fixes something it returns a shallow copy. `which_test` is
  left to `whichTestIndex`.
- `whichTestIndex(raw, n, {plugin, allowEnsemble, rng})`: the probed item's index for a
  trial of `n` items. `-1` stays `-1` when `allowEnsemble`; a value that is not a finite
  number probes a random valid item and warns, suggesting
  `jsPsych.evaluateTimelineVariable`; a non-integer is rounded, and anything out of
  range is clamped into 0..n−1.
- `colorWheelName(wheel)`: the `color_wheel_name` field, the wheel's `.name` (the trial's
  `color_wheel`, else the global wheel), or `"custom"` when it has none.
- `wantPrecue(trial)`: the pre-cue rule (`precue_time > 0` and `do_test` not false).
  Add plugin-specific exclusions (ensemble, perception) on top.
- `makeFinisher(jsPsych)`: the once-only trial ending (§3).
- `confidencePopup(anchorEl, boxEl, opts, onPick)`: the inline word confidence picker.
  It returns `{detach, teardown, buttons, el}`. Register `teardown` with
  `finishOnce.onEnd` so a popup left open at a timeout can't report a rating after the
  trial is over.
- `autoZoom(box, opts)`: implement the `auto_zoom` option with this.
- `validatePlacement(trial, opts)` and `checkParams(trial, opts)`: warn-only
  diagnostics for config mistakes. Call them once the set size is known, before
  clamping or building anything.
- `warnOnce(plugin, msg)` for likely mistakes (`console.warn`), and
  `noteOnce(plugin, key, msg)` for options that work as intended but are easy to
  leave on by accident (`console.log`, once per plugin and key). Both are silenced by
  `BradyUtils.PLACEMENT_WARNINGS = false`. The current notes: `which_test` still 0
  after three trials with the experimenter's own `stimuli` (from `validatePlacement`),
  wm-forced-choice `shuffle_options:false` with generated options, and `record_mouse`
  with `response_ui:"keyboard"` in change-detection and recognition. Don't use a
  warning for a choice the lab intends, such as `which_test` defaulting to 0 or
  unshuffled options putting the target in slot 0.

The color wheel is `window.BradyColorWheel` (swappable). Never embed wheel data
in a plugin. The alternative wheel files reuse `BradyColorWheel.make` when it is
already loaded, and every wheel draws neutral gray (with one warning) for a degree
that is not a number.

## 5. Standard parameter names and semantics

- `stimuli` (array): the items. Accept color/image/text/degree via `resolveItem`.
- `item_type` (`"auto"` | `"color"` | `"image"` | `"text"`, default `"auto"`).
- `color_wheel` (OBJECT, default null → `window.BradyColorWheel`).
- `auto_zoom` (BOOL, default false → call `U.autoZoom(box)` right after building the DOM).
- `prompt` (HTML_STRING, default null).
- `feedback` (BOOL, default false).
- Timing in ms. Use `this.jsPsych.pluginAPI.setTimeout(fn, ms)` (cleared
  automatically when the trial finishes), not bare `setTimeout`, for trial timing.
- Randomness: prefer `this.jsPsych.randomization.*`
  (`shuffle`, `sampleWithoutReplacement`). The `BradyUtils` draws take an optional
  `rng` (§4), and the similarity plugins shuffle with `engine.shuffle` (§10).
- `placeholder_border` (STRING) / `show_placeholders` (BOOL): location plugins draw a
  visible placeholder at every location by default. Don't hide them by default.
- `item_positions` (INT, `array: true`): explicit placeholder slots. A short or
  invalid list must never crash a trial. Resolve it with
  `U.resolvePositions(trial, setSize, {jsPsych})` → `{pos, nph}`, never by hand: invalid
  slots (non-integers, negatives) and repeats are dropped, the list is cut to the set
  size, `nph = max(num_placeholders, setSize, largest slot + 1)`, and items without a
  slot get random unused placeholders. noise-dots passes `fill: "lowest"`, so its
  default stays `[0, 1]`. `validatePlacement` still warns about the list.
- The four location manipulations are uniform across the 9 spatial multi-item plugins
  (change-detection, wm-forced-choice, wm-pairs, spatial-report, recall, continuous-report,
  continuous-image-report, continuous-object-report, object-orientation-report).
  `tests/invariants.js` checks the names and defaults:
  - `precue_time` (INT ms, before the array) and `retrocue_time` (INT ms, after the
    delay, before the response) highlight the to-be-probed location with `U.spatialCue`,
    a `cue_color`/`cue_thickness` box-shadow ring (default `"#000"`/5).
    wm-forced-choice reuses its encoding-cue `cue_color`/`cue_thickness` (default
    `"red"`/4) rather than adding a second pair. Both times default to 0 (off) and do
    nothing for ensemble or whole-report configs (`which_test:-1`, no single target).
    The pre-cue is also skipped when `do_test` is false (`U.wantPrecue`).
  - `noise_level` (FLOAT 0..1, default 0) + `noise_type` (STRING, default `"speckle"`)
    degrade each memory item at encoding via a transparent overlay canvas per location
    (`U.noiseOverlay`, positioned exactly over the placeholder and copying its
    border-radius). The probe/test/response display is always noise-free.
  - `mask_time` (INT ms, default 0) + `mask_type` (STRING, default `"color-squares"`): a backward mask. The moment the array goes off, with no blank gap, cover each occupied location with a mask overlay (`U.maskOverlay`) for `mask_time` ms, so the mask cuts encoding off; then run the blank `delay_time` in full (never subtract the mask from it). Order in every plugin: array → mask → blank `delay_time` → retro-cue → probe/response, so response onset = array offset + `mask_time` + `delay_time` + `retrocue_time`. With mouse tracking, mark `"mask"` at mask onset and `"delay"` when the blank interval starts.
  - Noise and mask kinds are pluggable. Never hard-code a pattern in a plugin.
    `noise_type`/`mask_type` accepts a key into `BradyUtils.noiseKinds`/`maskKinds`
    (built-ins: `speckle`, `salt-pepper`, `gaussian`; `color-squares`, `noise`,
    `scramble`), a function (`fn(ctx, size, level, opts)` for noise,
    `fn(ctx, size, opts)` for masks, with `opts = {wheel, rng, source}`), or an object
    `{type, ...extra}`. Studies add kinds with `BradyUtils.registerNoise`/`registerMask`
    without touching any plugin.
- `item_shape` (STRING, default `"disk"`; continuous-report and the similarity plugins):
  `"disk"`, `"line"`, `"triangle"`, `"gabor"` or `"grating"`. Draw it with the shared
  painter (`U.paintItem` / `U.drawShape` / `U.drawGrating`) and take its period from
  `U.shapePeriod(shape)` (180 for line/gabor/grating, else 360), never from a list of
  shape names. Orientation 0 is horizontal / pointing right, increasing clockwise, and a
  Gabor's or grating's stripes at d run the same way as the line at d.
- `item_shape` in the location plugins that draw color disks (so far change-detection
  and wm-forced-choice): `"disk"` (default) or `"square"`, a filled square the size of
  the disk. The placeholders, cue rings and noise/mask overlays must take the same
  shape, so they stay aligned with the items.
- `grating_options` (OBJECT): the Gabor/grating look. Its keys and defaults
  (`U.GRATING_DEFAULTS`) and how they look on screen are described once, in README.md
  ("Gabors and gratings"). Resolve it once per trial with
  `U.resolveGrating(trial.grating_options, {plugin, background: trial.background_color})`,
  which merges a partial object with the defaults and warns about out-of-range values.
  Gabors and gratings are achromatic: ignore item colors when drawing them. Phase 0 is
  cosine phase about the item centre and the pattern is computed at d mod 180, so d and
  d + 180 draw identically. With `phase: "random"` draw each item's phase with
  `U.gratingPhase(g, rng)` (the engine's rng in the similarity plugins, so a seeded engine
  replays it) and record it as `phase` in that item's `stimuli_shown` entry; a probe or
  response item gets its own phase (continuous-report's `probe_phase`).
- Orientation parameters and fields (`orientations`, `orientation_period`,
  `reported_orientation`, ...) follow the period rule in §8: values in [0, period),
  errors wrapped to ±period/2, the period recorded with the trial, and null on disk
  items, which have no orientation.
- `num_choices` (INT, 360 = continuous). When quantized (`< 360`), anchor the option
  grid on the target (`target + k·360/num_choices`) so the correct value is always an
  option (`U.snapDegree(deg, n, target)`). Continuous (`>= 360`) and explicit
  `choice_degrees` are not anchored. The orientation analog is
  `orientation_num_choices` (INT, 0 = continuous; target-anchored when `> 0`), used by
  continuous-report and object-orientation-report. It counts steps around the full
  360°, so with a 180° period, n steps give n/2 distinct orientations.
- `font_size` (STRING, e.g. `"16pt"`): recall exposes it for DOM-rendered text items.
  The canvas-text plugins derive the font from the item size (`~size/4`) and don't
  take it.
- `record_mouse` (BOOL) + `mouse_min_interval` / `mouse_response_min_interval` (INT ms):
  plugins that support it record the cursor path with `U.makeMouseTracker`. Mark the
  phases with `mt.mark(...)` using the names in §12 (`encoding`, `array`, `delay`,
  `report`, `confidence`).
- `which_test` (INT; OBJECT in wm-pairs): the index of the probed item in the item
  list. Resolve it with `U.whichTestIndex(raw, n, {plugin, allowEnsemble, rng})`, which
  clamps an out-of-range value and turns a value that is not a number (NaN from
  `jsPsych.timelineVariable` inside a function) into a random item with a warning, so a
  bad value never crashes a trial.
- `response_mode` is the decision format (`"binary"`/`"confidence6"`/`"two_stage"`) in
  change-detection, noise-dots and recognition, but the input method
  (`"box"`/`"click"`/`"drag"`) in spatial-report, which predates the rule. Don't add a
  third meaning: name an input-method option `response_ui` in new plugins.

## 6. DOM / rendering

- Render into `display_element` (set `.innerHTML` or append nodes). Give the
  outer box a stable id (e.g. `#xx-box`) and call `autoZoom` on it.
- Use canvases for items that may need image drawing, per-pixel noise, or hue
  rotation. Plain divs are fine for simple color/text disks.
- Inject any CSS you need once, via a `<style>` tag guarded by a module flag, or use
  inline styles. Prefix class and id names with the plugin name to avoid clashes.

## 7. Keyboard / mouse responses

- Keyboard: `this.jsPsych.pluginAPI.getKeyboardResponse({callback_function,
  valid_responses, rt_method:"performance", persist:false})`; cancel with
  `cancelKeyboardResponse(listener)`. Compare with
  `this.jsPsych.pluginAPI.compareKeys(info.key, "s")`.
- Buttons/mouse: build elements and `addEventListener("click", ...)`.
- Both must also record how long the response was held (response duration); see §11.
  Keyboard responses also wait for the key release before the trial ends.

## 8. Data

- Record `rt` and the key dependent measures under clear, descriptive names.
  `rt` is the response initiation time. Also record the response duration (how
  long the response was held down); see §11.
  Document every emitted field in the `info.data` schema (the reference is
  generated from it, and `tests/selftest.html` fails on undeclared fields).
- Preserve the experimenter's `trial.data`: build the result in a local object,
  then `if (trial.data) Object.assign(data, trial.data);` right before
  `finishTrial(data)`. Experimenter-provided keys win on collision.
- Record `stimuli_shown`: one entry per item actually presented (its placeholder
  position and value/degree/src, plus any rotation/orientation), so swap and
  interference models can be fit from the data alone, not just from the probed item.
- Record the probed item's index as `which_test`, the resolved value (after clamping;
  1 in continuous-report's perception mode). The report plugins also record it as
  `target_index`; the two are always equal, and color-rotated-object, which has no
  `which_test` parameter, records only `target_index` (0). Record what you resolved,
  not the parameter as passed.
- Record `color_wheel_name` (`U.colorWheelName(trial.color_wheel)`) in every plugin
  that draws wheel colors, so the data say which wheel the degrees refer to.
- Orientation fields are recorded in [0, period) and orientation errors wrapped to
  (−period/2, period/2], with the period from `U.shapePeriod` (or an explicit
  `orientation_period`). Record the period with the data: as `orientation_period` in
  plugins that can also report color (continuous-report, object-orientation-report),
  as `period` in the similarity plugins. A field that has no meaning on a trial is
  `null`, not 0: on disk items the orientation fields are null (so `orientation_error`
  is null on a disk trial that asks for an orientation report), and Gabor and grating
  `stimuli_shown` entries have `color: null`, since they are achromatic.
- Record `actual_stim_duration`, the measured on-screen time of the memory array
  (`performance.now()` when the array is hidden minus when it was painted), not the
  requested `display_time`. If the array stays up through the response (noise-dots
  with `display_time` null/0, continuous-image-report perception mode), record onset to
  response instead, and say so in the field's JSDoc.
- Declare a numeric field `FLOAT` when it can be fractional (e.g. a circular-mean
  `target_degree`, or a degree on an image or object wheel), and `INT` only when it is
  always a whole number.
- Mouse tracking (`record_mouse`): `U.makeMouseTracker` records `mouse_trajectory` in
  logical px from the box centre (corrected for `auto_zoom` per sample). Also emit
  `mouse_geometry` in that same logical frame, built from the plugin's own layout
  numbers, never from `getBoundingClientRect` (which is zoomed), so geometry and
  trajectory line up regardless of `auto_zoom`. For a wheel: item study boxes, the
  wheel `{cx,cy,radius}`, each item's `U.wheelPoint(...)` and the `target_point`.
  For click-to-choose options: `U.discreteChoiceGeometry(box, choices)`.

### Wheel/report sign convention (do not break this)
For any continuous/wheel report, the recorded `error` is always
`reported − target` (wrapped to (−180, 180]), where `reported` is the color/frame
the participant actually pointed at. To guarantee that, place option `deg`
at screen angle `deg + spin + offset` with `x = cx + R*cos(a)`, `y = cy + R*sin(a)`
(y down), and read the response back with the exact inverse,
`BradyUtils.wheelDegreeFromPointer(centerEl, clientX, clientY, spin, offset)`
(relative to a zero-size anchor element at the wheel centre). Identical geometry for
placement and readback means what you point at is what's recorded, so a
similarity-by-distance matrix is never mirror-flipped relative to the stored
errors. Read the response from the pointer angle, not from clicks on
overlapping swatch elements (those bias clicks at the 0/359 seam). Keep swatches
display-only (`pointer-events:none`), score a click at the click's own angle (not the
last `mousemove`), and snap to the nearest option on quantized wheels
(`BradyUtils.snapDegree`).

## 9. Style

- Clean, simple, commented. Use section headers (`// ---- Phase ----`).
- Keep a top banner comment: a title line, then a first paragraph of one or two
  sentences saying what the paradigm is, then the key options and the load-order note.
  `build-reference.js` uses the first one or two sentences of that first paragraph as
  the plugin's description in `reference.html`, so write them for a reader choosing a
  plugin.
- Each plugin registers one unique `name`, so any combination can be loaded
  together.

## 10. The adaptive-similarity module (`similarity-adaptive-utils.js`)

The three similarity plugins (`jspsych-similarity-triad/-quad/-likert`) share
one engine module, global `window.BradySimilarity`, loaded after
`brady-plugin-utils.js` and before those plugins (the bundle orders it
correctly). Rules for editing it:

- **Keep it node-testable.** The module must run in plain node (no
  `window`/`document`; `fetch` is used only inside `loadGroupPrior`, and guarded),
  because `tests/invariants.js` unit-tests the engine's math (likelihood identities,
  seeded determinism, synthetic recovery).
- **Route all randomness through the injected `rng`** (`opts.rng`,
  default `Math.random`; `BradySimilarity.seededRng(seed)` for tests). Never
  call `Math.random` directly inside the engine: that breaks the seeded
  determinism and recovery tests.
- **The estimand is the full matrix** `s(x,y) = f(Δ) + g_x(Δ)`. The engine adapts
  only the homogeneous `f`, so trial records must always carry exact degrees and
  signed offsets (they feed offline matrix fits), coverage draws stay uniform over
  offsets, and anchors stay stratified over the wheel.
- **Distances are on a circle of `period` degrees**, 360 (default) or 180 for oriented
  bars, Gabors and gratings (`createEngine({period: 180})`). Use `engine.period` wherever a distance or bin
  is computed, including `empiricalMatrix(history, {period})`, since history records
  don't carry it. Period 360 must keep giving exactly the results the module gave
  before the option existed.
- **Resampling is a Liu–West move**: shrink each particle toward the weighted mean by
  a = √(1 − h²), then add noise with SD h × that parameter's posterior SD, with h = 0.1.
  This keeps the posterior variance unchanged, where a fixed jitter would widen it on
  every resample. The recovery margin at h = 0.1 depends on the seed (see
  `internal/IMPROVEMENT_PLAN.md`), so check a change to h against several seeds.
- **Coverage draws stay uniform.** When the triad's two offsets collide on the wrap,
  redraw both, not just the second.
- **Invalid responses are kept but not used.** `update` records an out-of-range
  response in `history` with `invalid: true` and a warning. The posterior,
  `empiricalMatrix`, `reliableVariance` and `exportState().nResponses` skip it, and
  `exportState().nInvalid` counts it.
- **Hand out copies.** `fHat()` / `fSD()` return fresh arrays, so a caller can't corrupt
  the cache.
- **Plugins talk to the engine only through the `engine` parameter.** A similarity
  plugin takes the engine as an explicit `engine` trial parameter (one instance shared
  across the timeline), asks it for the next trial (`nextRefTriad`/`nextTriad`/
  `nextQuad`/`nextPair`, passing `forceCoverage` when `adaptive:false`), and calls
  `engine.update(type, spec, response)` (type `"reftriad"`/`"triad"`/`"quad"`/`"likert"`)
  with the displayed degrees before `finishTrial`. It shuffles left/right and layout
  order with `engine.shuffle`, so a seeded engine also reproduces the screen.
- **The plugin's period comes from `item_shape`** via `U.shapePeriod` (180 for `"line"`,
  `"gabor"` and `"grating"`, 360 otherwise), the same rule as the orientation fields of
  the report plugins (§8, where the field is called `orientation_period`).
  It records that as the `period` data field, records degrees in [0, period) and signed
  offsets in (−period/2, period/2], and warns once when the engine's period differs.
  A trial given both `stimuli` and `engine` uses the stimuli, leaves the engine alone
  and warns once.
- All three plugins collect confidence on every trial (`collect_confidence: true`).
  That default is fixed, not a per-study choice.

## 11. Response duration (how long the response was held down)

Every plugin records how long a response was held as well as when it was made
(`rt`): the mouse-button press for a click, the KeyDown→KeyUp interval for a
key. This is **response duration (RD)** in the sense of Zhou, Goh, Phillips &
Firestone (2026) and Pfister, Neszmélyi & Kunde (2023): across face detection,
motion coherence and trivia tasks, RD predicted subjective confidence
over and above response initiation time, and was essentially uncorrelated
with it (within-subject r ≈ 0.01). It costs nothing to collect and is independent of
`rt`, so we collect it everywhere by default. In our terms, `rt` is the literature's
*response initiation time* and the hold fields are the *response duration*.

Fields (documented per plugin in `info.data`):

- `mouse_hold_duration`: ms the button was held for the committing click.
- `key_hold_duration`: ms the response key was held down.
- `key_presses`: every key pressed during the response window, as `{key, t, duration}`
  (`t` in ms from the window's start), sorted by `t`. A key still held when the window
  closes is included with `duration: null`. Presses that began before the window opened
  are skipped.
- `multiple_keys_pressed`: a key other than the recorded response was also
  pressed. Zhou et al. and its predecessors exclude such trials, and the
  criterion cannot be reconstructed after the fact, so we log the presses.

**A confidence rating is a second response, so it gets its own duration.** Any
plugin that collects confidence as a separate response (the similarity plugins'
`collect_confidence`, `wm-forced-choice`'s popup, `change-detection` /
`noise-dots` in `two_stage`) also emits `confidence_mouse_hold_duration` and/or
`confidence_key_hold_duration` (whichever input the rating uses; noise-dots is
keyboard-only, the popups are click-only), paired with `rt_confidence` exactly as the
decision's holds pair with `rt`. Do not fold the two together: relating the
decision's duration to the rating is the point. Where the rating is the
response (`confidence6` in change-detection, noise-dots and recognition, a single 1–6
scale), there is one response and only the ordinary hold fields. change-detection and
noise-dots also write the old name `key_hold_duration_confidence` with the same value,
as a deprecated alias; don't add it to new plugins.

**Not every press is a response duration.** `spatial-report`'s `"drag"` mode
commits on the mouseup that ends a drag, so its press time mostly reflects how far
the probe had to travel. That is a movement time, not a decision press: it is
reported separately as `drag_duration`, `mouse_hold_duration` is null in that
mode, and the two must never be pooled. Apply the same reasoning to any future
response that commits on a drag or a hold-to-confirm.

**Shape follows `rt`.** If a plugin's `rt` is an array (one entry per response),
the hold field is a parallel array in the same order. `null` always means *not
measurable*, never 0.

### Implementing it

Use the `BradyUtils` helpers; do not hand-roll listeners. References:
`jspsych-2afc-keyboard.js` (keyboard) and `jspsych-continuous-report.js` (mouse).
The recorder handles mouse, touch and pen (it ignores the browser's emulated mouse
events for 1 s after a touch release), clears a press on `pointercancel`/blur, and
matches a key release by `e.code` when `e.key` changed mid-press (Shift).

- **Clicks.** A `click` event fires only after the button is released, so the
  duration is already available. Call `U.mouseHoldDuration()` as the first
  statement of the click handler, before any guard or early return: a click the
  handler ignores must still consume its press, or the next click would claim a
  stale duration.
- **Keyboard.** jsPsych's `getKeyboardResponse` fires on KeyDown, so the hold
  doesn't exist yet when the response is recorded. `await U.awaitKeyUp(key)`
  before finishing. This delays the end of the trial until the key is released, on
  purpose: RDs run ~100 ms and are conventionally excluded above 1000 ms, so the
  cost is small, while `rt` and every other measure stay stamped at KeyDown. A 5 s
  timeout, window blur and page-hide all resolve the wait (as `null`), so a stuck or
  never-released key can't hang an experiment.
- Respect §3: in a timer/callback-driven plugin, do not make `trial()` async
  to await the keyup. Chain `U.awaitKeyUp(...).then(finishOnce.guard(...))` and end
  the trial with `finishOnce(data)` inside the callback, so a trial that ended some
  other way during the wait isn't finished twice.
- Open the press log with `U.beginPressLog(t0)` where the `rt` clock starts (`t0`
  defaults to now), close it with `U.endPressLog()` when the response is complete
  (before any feedback, so feedback-time keys aren't logged), and wrap the keyboard
  fields with `U.keyHoldData(duration, key, log)`.

References: Pfister, R., Neszmélyi, B., & Kunde, W. (2023). Response durations: A
flexible, no-cost tool for psychological science. *Current Directions in Psychological
Science, 32*(2), 160–166. https://doi.org/10.1177/09637214221141692 · Zhou, H., Goh,
R. Z., Phillips, I., & Firestone, C. (2026). Response duration tracks confidence.
*Proceedings of the National Academy of Sciences, 123*(29).
https://doi.org/10.1073/pnas.2612367123

## 12. Terms

One name per idea, used the same way in code comments, JSDoc and the user docs.

- **Response duration (RD):** how long the committing response was held down
  (KeyDown→KeyUp, or button press→release). The concept is always called response
  duration; the data fields that hold it are named `*_hold_duration`
  (`mouse_hold_duration`, `key_hold_duration`, `confidence_mouse_hold_duration`,
  `confidence_key_hold_duration`). Don't call it "hold time" or "press duration".
- **`rt`:** response *initiation* time, from the onset of the response phase to the
  press.
- **Period:** the rotation after which a stimulus looks the same: 360 for hues and
  pointed shapes, 180 for lines, Gabors and gratings (`U.shapePeriod`). The engine
  option and the similarity plugins' data field are `period`; continuous-report and
  object-orientation-report call the parameter and field `orientation_period`, because
  a color report on the same trial always has period 360.
- **`which_test`:** the probed item's index in the item list (a parameter and a data
  field). **`target_index`** is the same number under the name the report plugins also
  use; they never differ in recorded data. They can differ from the `which_test`
  *parameter* you passed: the recorded value is after clamping, a random item when the
  parameter was not a number, and 1 (the match slot) in continuous-report's perception
  mode.
- **Item list:** the items of a trial, named `stimuli` in most plugins and
  `item_colors` / `orientations` / `item_values` where the plugin names it for what it
  holds. All of them follow the same item rules.
- **Wheel degree:** an integer 0–359 naming a color on the active color wheel (or a
  morph frame, or an object's hue rotation). Degrees increase clockwise on screen.
- **Signed error:** `reported − target`, wrapped to (−period/2, period/2].
- **Coverage trial:** an engine trial drawn uniformly over offsets instead of by BALD;
  each trial is one with probability `epsilon`.
- **Mouse phases** (`mouse_phase_onsets` keys, in order): `encoding` (0: tracking start, at the fixation click or trial start, before `delay_start` and any pre-cue), `array` (memory-array onset, the first item painted), `mask` (mask onset, which is the array's offset; only on trials that show a mask), `delay` (the blank retention interval begins: the array's offset, or the mask's offset after a mask), `report` (response phase opens), `confidence` (a separate rating opens). `array` is marked in continuous-report, continuous-image-report, continuous-object-report, object-orientation-report, spatial-report, change-detection and wm-forced-choice; color-rotated-object marks it at 0 with `encoding` (the object is up from the start); recognition has no array. A phase that didn't happen has no key.
- **`response_mode` / `response_ui`:** see §5; the decision format vs. the input
  method.
