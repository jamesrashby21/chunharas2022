# Brady-lab jsPsych v8 plugins

Visual working-memory and perception plugins for [jsPsych](https://www.jspsych.org)
v8: change detection, continuous report (color, orientation, Gabors, image morphs, real
objects), forced choice, recognition, recall, spatial report, RSVP, and similarity
judgments with an optional adaptive engine. Seventeen plugins share one swappable
color wheel and one set of helpers, and every trial records what was on screen.

- New to jsPsych or to coding: start with the tutorial (`tutorial.html`, or
  `TUTORIAL.md`), §0–§2, then copy `example-experiment.html`.
- `showcase.html` runs every plugin live; `reference.html` lists every parameter and
  data field per plugin.
- API.md documents the JavaScript you can call yourself (the adaptive engine, color
  wheels, helpers). CHANGELOG.md lists what changed, by `plugin_version`.
  CONVENTIONS.md is for people editing or adding plugins.

Contents: [Use it](#use-it) · [What gets recorded](#what-gets-recorded) ·
[Data quality and exclusions](#data-quality-and-exclusions) ·
[The 17 plugins](#the-17-plugins) · [Shared conventions](#shared-conventions) ·
[Gabors and gratings](#gabors-and-gratings) · [Placement rules](#placement-rules) ·
[Adaptive similarity tasks](#adaptive-similarity-tasks) ·
[Swapping the color wheel](#swapping-the-color-wheel) ·
[Mouse-trajectory recording](#mouse-trajectory-recording) ·
[Other notes](#other-notes) · [Files](#files)

## Use it

1. Download `brady-plugins-v8.zip` from the plugins site and unzip it. It holds the
   plugin files, the bundle, the sounds, the sample stimuli, the example study and
   these docs (`node build-zip.js` rebuilds it).
2. Put your experiment's `.html` file in the unzipped folder.
3. Serve the folder from a web server (on your own computer:
   `python -m http.server 8000`, then open `http://localhost:8000/your-file.html`;
   TUTORIAL.md §0 has step-by-step instructions).

**One include (simplest):**

```html
<link rel="stylesheet" href="https://unpkg.com/jspsych@8/css/jspsych.css">
<script src="https://unpkg.com/jspsych@8/dist/index.browser.min.js"></script>
<script src="https://unpkg.com/canvas-confetti@1.9.3/dist/confetti.browser.js"></script> <!-- optional: confetti on correct feedback -->
<script src="brady-plugins.bundle.js"></script>   <!-- wheel + helpers + engine + all 17 plugins -->
<script>
  const jsPsych = jsPsychModule.initJsPsych({ show_progress_bar: true });
  jsPsych.run([
    { type: jsPsychChangeDetection, set_size: 4, is_change: true },
  ]);
</script>
```

**Or the separate files**, to load only what you use. Order matters: the wheel, then
the helpers, then `similarity-adaptive-utils.js` if you use a similarity plugin, then
the plugins:

```html
<script src="brady-color-wheel.js"></script>
<script src="brady-plugin-utils.js"></script>
<script src="jspsych-change-detection.js"></script>
<!-- ...the plugins you need... -->
```

The bundle is generated from the source files; after editing a source file, rebuild it
with `node build-bundle.js`.

## What gets recorded

Every trial is one row of jsPsych data. Besides jsPsych's own columns (`trial_type`,
`trial_index`, `time_elapsed`, `internal_node_id`, and `plugin_version`, the plugin's
version, which CHANGELOG.md is organized by), the plugins record the following. The
complete per-plugin list, with a description of every field, is in `reference.html`;
its "All data fields" view (`reference.html#all-data-fields`) lists every field of every
plugin in one searchable table.

**Outcome columns of the common tasks**

| Plugin | Outcome | Also |
|---|---|---|
| change-detection | `correct`, `said_same` (1/0), `was_same` | `confidence` (confidence modes), `rt` |
| continuous-report | `error` (color); `orientation_error` (lines, triangles, Gabors, gratings) | `reported_degree`, `target_degree`, `reported_orientation`, `target_orientation`, `orientation_period` |
| continuous-image-report / continuous-object-report / color-rotated-object | `error` | `reported_degree`, `target_degree` (image report adds `reported_frame`, `target_frame`) |
| object-orientation-report | `orientation_error` | `reported_orientation`, `target_orientation`, `orientation_period` |
| wm-forced-choice / 2afc-keyboard | `correct`, `chosen_option` | `option_order`, `chosen_position`, `confidence` |
| recognition | `correct`, `said_old` (1/0), `was_old` | `confidence` |
| recall / wm-pairs / noise-dots | `correct` | `response` / `reported_color` / `said_same` |
| spatial-report | `spatial_error` (px) | `reported_x/y`, `true_x/y`, `clicked_position` |
| similarity-triad / -quad / -likert | `response` (triad, quad) or `rating` (likert) | `degrees`, `period`, the signed offsets, `confidence` |

The continuous-report outcome columns are ready for TCC and other error-distribution
models: `error` (or `orientation_error`) is the signed response error, and
`stimuli_shown` gives every item's value for swap or interference models.

**Fields shared across plugins**

- `rt`: response initiation time in ms, from the onset of the response phase.
- Response duration: how long the response was held down, recorded alongside `rt` in
  `mouse_hold_duration` (the committing click) or `key_hold_duration` (the response
  key). A separate confidence rating has its own: `rt_confidence` with
  `confidence_mouse_hold_duration` or `confidence_key_hold_duration`. Response
  duration predicts confidence over and above `rt` (Zhou et al., 2026; Pfister et al.,
  2023). See "Data quality and exclusions".
- `key_presses` (keyboard plugins): every key pressed in the response window,
  `{key, t, duration}`, sorted by press onset `t` (ms from the window's start); a key
  still down when the window closes has `duration: null`.
  `multiple_keys_pressed`: a key other than the recorded response was also pressed.
- `stimuli_shown`: one entry per item on screen, in item order: its placeholder
  `position`, its value (`degree`, `color`, `src` or `text`) and any `orientation`.
  Gabor and grating entries add `phase`.
- `actual_stim_duration`: the measured on-screen time of the memory array (or stream)
  in ms, which can differ from the requested `display_time` by a frame or more. Use it,
  not `display_time`, in timing analyses.
- `which_test`: the index of the probed item in your item list, after the plugin
  resolved it. It equals the `which_test` you passed except when that was out of
  range (it is clamped into 0..set_size − 1) or not a number (a random item is probed;
  a console warning says so). In continuous-report's perception mode it is 1, the
  match slot. The six report plugins also write the same number as `target_index`;
  the two columns are always equal there. color-rotated-object has only
  `target_index`, always 0.
- `color_wheel_name`: which wheel the recorded degrees refer to
  (`"schurgin-brady-2020"` for the default).
- Anything you pass in a trial's `data` option is kept, and it wins on a name
  collision. Use it to tag rows, e.g. `data: { phase: "main" }`; jsPsych does not copy
  trial options into the data.

**Shapes and units**

- In the report plugins (continuous-report, continuous-image-report,
  continuous-object-report, color-rotated-object), `rt`, `mouse_hold_duration`,
  `error`, `reported_degree` and the orientation response fields are **arrays**, one
  entry per response, because a trial can collect several (`responses_per_item`,
  `report: "both"`). A single-response trial gives one-element arrays such as `[63]`.
  In a CSV these appear as the text `[63]`; TUTORIAL.md §6.1 shows how to read them in
  R and Python.
- `null` means *not measurable* (a timeout, a press that started before the trial),
  never 0.
- Degrees are wheel degrees, 0–359. Times are ms.

**Sign conventions**

- `error = reported − target`, wrapped to (−180, 180]. A positive error means the
  response was further along the wheel's numbering than the target, which on screen
  is clockwise from the target's position (the wheel's numbers increase clockwise;
  `spin_wheel` rotates the whole wheel but keeps that direction). The response is read
  back with the exact inverse of the option placement, so errors line up with a
  distance-based similarity matrix and are never mirror-flipped.
- Orientations: 0 is horizontal (a line) or pointing right (a triangle), and degrees
  increase clockwise on screen. `orientation_error = reported − target`, wrapped to
  ±period/2.
- **Period.** Lines, Gabors and gratings look the same after a half turn, so their
  orientations have a 180° period: they are recorded in [0, 180) and their errors wrap
  at ±90. Disks (hue) and triangles (pointed) use 360. Each trial records the period
  it used: continuous-report and object-orientation-report as `orientation_period`
  (named so because those plugins can also report color, whose period is always 360),
  the similarity plugins as `period`. CHANGELOG.md notes that continuous-report
  recorded raw 0–359 orientations before plugin_version 2.0.0.

## Data quality and exclusions

The plugins record what you need for the usual exclusions; they don't apply any.

- **Response duration.** Response durations (RDs) are typically around 100 ms, and
  trials with RDs above 1000 ms are conventionally excluded as anomalous holds. A
  keyboard trial waits for the key's release before ending (up to 5 s; a stuck key
  records `null`).
- **More than one key.** `multiple_keys_pressed` is true when another key was also
  pressed during the response window. Studies of response duration exclude these
  trials; the criterion can't be rebuilt afterwards, so it is logged.
- **Timing.** Compare `actual_stim_duration` with the `display_time` you asked for
  and drop or flag trials where the array stayed up noticeably longer (a frame is
  about 17 ms at 60 Hz). rsvp records each item's measured timing in
  `actual_stim_timing` and `actual_isi_timing`.
- **Not measurable.** A `null` hold or `rt` means the plugin could not measure it
  (timeout, page lost focus). Treat it as missing, not as 0.
- **Spatial-report drag mode.** `drag_duration` is movement time, not a response
  duration; `mouse_hold_duration` is null in that mode. Don't pool the two.
- **Bots and AI agents.** The plugins don't detect automated or AI-assisted
  responding. Add your own checks (attention checks, pointer and visibility logging) in
  the experiment.

References:
Pfister, R., Neszmélyi, B., & Kunde, W. (2023). Response durations: A flexible,
no-cost tool for psychological science. *Current Directions in Psychological Science,
32*(2), 160–166. https://doi.org/10.1177/09637214221141692 ·
Zhou, H., Goh, R. Z., Phillips, I., & Firestone, C. (2026). Response duration tracks
confidence. *Proceedings of the National Academy of Sciences, 123*(29).
https://doi.org/10.1073/pnas.2612367123

## The 17 plugins

| Plugin (global) | Paradigm | Main options |
|---|---|---|
| **change-detection** (`jsPsychChangeDetection`) | Array → delay → probe one item, same/different | `item_shape` (`"disk"`/`"square"`), `response_mode` (`"binary"`/`"confidence6"`/`"two_stage"`), `response_ui` (`"both"`/`"keyboard"`/`"buttons"`/`"radio"`), `noise_level`/`noise_type`, `mask_time`/`mask_type`, `precue_time` |
| **2afc-keyboard** (`jsPsych2afcKeyboard`) | Perceptual N-AFC by keyboard | `color_rotation_deg`, `prompt_lead_time` (options hidden until it ends), `preview_duration`; options as degrees/colors/images/words |
| **continuous-report** (`jsPsychContinuousReport`) | Delayed estimation of color and/or orientation; disks, lines, triangles, Gabors or gratings | `item_shape`, `grating_options`, `report` (`"color"`/`"orientation"`/`"both"`) + `report_order`, `num_choices` (quantized), `wheel_option_offset`, `which_test:-1` (ensemble), `responses_per_item` (ranking) |
| **continuous-image-report** (`jsPsychContinuousImageReport`) | Delayed estimation on an image-morph wheel (sprite or frame list) | `num_choices`, `wheel_option_offset`, `precue_time`, `do_test:false`, `mode:"perception"`, `which_test:-1` |
| **continuous-object-report** (`jsPsychContinuousObjectReport`) | Hue report on real object photos (objects hue-rotated; recolored live on the wheel) | `cue_items`/`precue_time`, `wheel_shows_object`, `num_choices`, `which_test:-1`, `do_test:false` |
| **color-rotated-object** (`jsPsychColorRotatedObject`) | One object, hue-rotated in CIELAB; study or report | `mode` (`"display"`/`"report"`), `color_rotation_deg`, `responses_per_item` |
| **object-orientation-report** (`jsPsychObjectOrientationReport`) | Real objects shown rotated at locations; report orientation by spinning the probed object | `report_location` (`"center"`/`"in_place"`), `orientations`, `orientation_period`, `orientation_num_choices` |
| **wm-forced-choice** (`jsPsychWmForcedChoice`) | Memory array → delay → K-AFC among options | `item_shape` (`"disk"`/`"square"`), `choices_per_test`, `option_layout` (`"center"` default, `"row"`/`"grid"`/`"circle"`), `cue_test_location`, `position_angle_offset`, `sequential`, `color_rotation_deg` + `test_color_rotation_deg`, `preview_duration`, `collect_confidence` |
| **wm-pairs** (`jsPsychWmPairs`) | Concentric two-color objects; probe one sub-feature | `probe_feature` (`"inner"`/`"outer"`), `which_test` (index or `[item, 0=outer/1=inner]`), `test_color_options` |
| **noise-dots** (`jsPsychNoiseDots`) | Color patches made of signal + noise dots; same/different | `noise_level` (0–1, scalar or `[target, test]`), `response_mode` (`"binary"`/`"confidence6"`/`"two_stage"`), `num_dots`, `num_colors` |
| **recognition** (`jsPsychRecognition`) | Single probe judged old/new (± confidence) | `response_mode` (`"binary"`/`"confidence6"`), `response_ui` (`"keyboard"`/`"buttons"`/`"both"`); `confidence` 1 = sure new … 6 = sure old (`said_old` = 1 when `confidence` ≥ 4) |
| **recall** (`jsPsychRecall`) | Study → probe a location → type the item | `input_type` (`"text"`/`"number"`), `correct_answer` |
| **spatial-report** (`jsPsychSpatialReport`) | Report the remembered location | `response_mode` (`"box"`/`"click"`/`"drag"`; drag mode adds `drag_start_rt`) |
| **rsvp** (`jsPsychRsvp`) | Rapid serial stream at one location | `item_duration`, `isi` (each a single value or one per item), optional non-interrupting `response_keys` (each press records the `item` on screen and `during_isi`) |
| **similarity-triad** (`jsPsychSimilarityTriad`) | Reference on top, two below; click the one most different from the reference (`layout:"triangle"` = odd-one-out of three) | `layout`, `item_shape`, `stimuli` (3) or adaptive `engine`, `collect_confidence` (default true) |
| **similarity-quad** (`jsPsychSimilarityQuad`) | Two pairs side by side; click the pair that is most different | `item_shape`, `stimuli` (4) or adaptive `engine`, `collect_confidence` (default true) |
| **similarity-likert** (`jsPsychSimilarityLikert`) | One pair; rate similarity on an R-point grayscale scale (word anchors at the endpoints only) | `item_shape`, `stimuli` (2) or adaptive `engine`, `rating_points` (default 7), `rating_labels`, `collect_confidence` (default true) |

`response_mode` names the decision format in change-detection, noise-dots and
recognition, but the input method in spatial-report. Every parameter and data field
has a JSDoc comment in its plugin's `info` block, and those comments fill the tables
in `reference.html`.

## Shared conventions

These hold in every plugin that has the option. TUTORIAL.md §3 summarizes them for
beginners; this is the full statement.

- **Items can be colors, color-wheel degrees, images, or text**, mixed freely, via a
  `stimuli` array + `item_type` (`"auto"`/`"color"`/`"image"`/`"text"`). Under
  `"auto"`: numbers are wheel degrees; `"rgb(...)"`/`"#.."`/`"lab(...)"` strings are
  colors; strings with an image extension or a `/` are images; anything else is text,
  including a number in quotes. Where a value must be a color (`item_type:"color"`,
  noise-dots `colors`/`test_color`, wm-pairs colors), a numeric string such as `"120"`
  is wheel degree 120. Named CSS colors (`"black"`) are text under `"auto"`; pass
  `item_type:"color"` for a colored item. `stimuli: []` makes the color tasks generate
  random wheel colors. Some plugins name the item list for what it holds
  (`item_colors`, `orientations`); the same rules apply.
- **`item_shape`** (continuous-report and the similarity plugins): `"disk"` (default),
  `"line"`, `"triangle"`, `"gabor"` or `"grating"`. A numeric item is drawn as an
  orientation for every shape except `"disk"`. See "Gabors and gratings" and the
  period rule under "What gets recorded". change-detection and wm-forced-choice take
  `item_shape: "disk"` (default) or `"square"`: color items drawn as filled squares the
  size of the disk (the Luck & Vogel style display); placeholders, cue rings and
  noise/mask overlays take the same shape. spatial-report and recall always draw color
  items as squares and have no `item_shape`.
- **`color_wheel`** on every plugin that draws wheel colors (default: the global wheel;
  pass your own to swap it per trial).
- **`auto_zoom: true`** (all 17 plugins) scales the task box to fill the browser
  window. It measures how far the task sits from the top of the viewport, so the
  progress bar, a page header and the top margin are accounted for, and a box that
  nearly fills the window never pushes past the bottom. It is meant for a page that
  holds only the experiment, ideally fullscreen; other content below the task is
  pushed off screen.
- **Self-contained task boxes.** When a plugin shows its response below the array
  (same/different or old/new buttons, a forced-choice option strip, a typed-recall
  field), the box is one tall rectangle: the placeholder circle fills the square top,
  and the message, response and prompt appear in a reserved panel inside the same box.
  The box never shifts, and `auto_zoom` scales it as a unit. Layouts whose response
  sits inside the array (wm-forced-choice `option_layout:"center"`, recall
  `response_location:"center"`, the report wheels) stay a plain square.
- **Keys** are strings (`"f"`, `" "`, `"ArrowLeft"`); **times** are in ms.
- **Sequential presentation:** the multi-item memory tasks take `sequential: true` to
  show items one at a time in their places (`sequential_item_time`,
  `sequential_gap_time`).
- **Hue rotation:** positive `color_rotation_deg` moves a hue forward (increasing)
  along the color wheel. `BradyUtils.rotateHueLab(rgb, +deg)` increases the CIELAB hue
  angle, matching the wheel's index order.
- **Feedback:** with `feedback: true`, confetti and win/lose sounds play by default
  (toggle with `feedback_sound` / `feedback_confetti`; replace the sounds with
  `correct_sound`/`incorrect_sound`). Confetti needs the canvas-confetti script (see
  "Use it"); the sounds need `win.mp3`/`lose.mp3` next to `brady-plugin-utils.js` or
  the bundle.
- **Quantized report** (`num_choices < 360` on continuous-report,
  continuous-image-report, continuous-object-report, color-rotated-object) is
  target-anchored: the options are `target + k·(360/num_choices)`, so the correct value
  is always an option (best answer = 0 error). `spin_wheel` still randomizes where the
  target sits on screen. An explicit `choice_degrees` list is not anchored. The
  orientation analog, `orientation_num_choices`, counts steps around the full 360°, so
  with a 180° period n steps give n/2 distinct orientations.
- **Ensemble report** (`which_test: -1` on continuous-report, continuous-image-report
  and continuous-object-report) is scored against the circular mean of the item
  degrees (`BradyUtils.ensembleTarget`), so `error = reported − mean`. When the mean is
  undefined (degrees that cancel out, such as 0/120/240), `target_degree` and `error`
  are null.
- **Console diagnostics.** The plugins warn in the browser console about likely
  mistakes (a mistyped option value gets a "did you mean"), and print one-time notes for
  options that work but are easy to leave on by accident. TUTORIAL.md §3.1 lists them.
  `BradyUtils.PLACEMENT_WARNINGS = false` silences all of them.

## Gabors and gratings

`item_shape: "gabor"` and `"grating"` (continuous-report and the three similarity
plugins) draw achromatic, per-pixel stripe patterns. A grating is a sinusoidal
luminance grating in a circular aperture of the item's size; a Gabor is the same
grating under a circular Gaussian envelope.

- **Orientation.** Stripes at degree d run the same way as a `"line"` at d (0 =
  horizontal, clockwise positive), and d and d + 180 draw the same pattern, so the
  period is 180: orientations are recorded in [0, 180) and errors and offsets wrap at
  ±90. An adaptive similarity study with them needs `createEngine({ period: 180 })`.
- **`grating_options`** sets the look; keys you leave out keep their defaults:
  `cycles` 4 (across the item diameter), `contrast` 1 (Michelson), `sigma` 0.18
  (envelope SD as a fraction of the diameter, Gabor only), `phase` 0 (cosine phase: a
  bright stripe through the centre; `"random"` draws a whole-degree phase per item and
  records it in `stimuli_shown[i].phase`), and `mean` `"background"` (the mean gray
  matches `background_color`, so a Gabor blends into the box; or give a CSS color).
- **Contrast** is capped so the sinusoid never clips. Around the default `#dddddd`
  background only about 0.15 fits, so set `background_color: "#808080"` for full
  contrast (a one-time console note says when the cap applies).
- **Color** is ignored: Gabor and grating `stimuli_shown` entries have `color: null`
  in continuous-report, and continuous-report warns if a Gabor/grating trial asks for
  a color report.
- **Probe phase.** In continuous-report the probe drawn during the response gets its
  own phase, recorded as `probe_phase`; with `phase: "random"` it generally differs
  from the probed item's study phase. In the similarity plugins, random phases are
  drawn from the engine's rng, so a seeded engine reproduces them.

## Placement rules

- **Placeholders are drawn by default** at every location of a multi-item,
  location-cued plugin, so the layout and any location cue are clear. The color/disk
  plugins draw a circle outline. continuous-object-report, object-orientation-report
  and wm-forced-choice take `placeholder_border` (default `"2px solid #ccc"`; `"none"`
  hides it), and spatial-report takes `show_placeholders` (default `true`).
- **The box doesn't jump.** Anything a plugin reveals later (test options, a typed
  recall field, a response prompt) has its space reserved from the start. wm-forced-
  choice defaults to `option_layout:"center"` (options around fixation, inside the
  box), and recall to `response_location:"center"`. Use
  `option_layout:"row"/"grid"/"circle"` or `response_location:"bottom"` to put them
  under the box instead.
- **`stimuli`, `which_test` and `item_positions`.** `which_test` indexes your item
  list, not the screen; `item_positions` (optional) pins item i to placeholder slot
  `item_positions[i]`; without it, items go to random slots each trial. TUTORIAL.md
  §3.1 explains how the three combine, with recipes.
- **Short or invalid `item_positions`** never crash a trial. Every placeholder plugin
  follows one rule (`BradyUtils.resolvePositions`): invalid slots (negative or not
  whole numbers) and repeated slots are dropped, entries past the set size are ignored,
  and items left without a slot go to random unused placeholders. `num_placeholders`
  grows to cover the largest slot used. noise-dots fills a missing slot with the lowest
  unused one instead, so its default stays `[0, 1]`.
- **The four location manipulations** work the same way in the nine spatial
  multi-item plugins (change-detection, wm-forced-choice, wm-pairs, spatial-report,
  recall, continuous-report, continuous-image-report, continuous-object-report,
  object-orientation-report):
  - `precue_time` (ms) highlights the to-be-probed location before the array;
    `retrocue_time` (ms) highlights it after the retention delay, before the response
    screen. Both default to 0. The ring uses `cue_color`/`cue_thickness`. There is no
    pre-cue when `do_test` is false, since nothing is probed.
  - `noise_level` (0..1) + `noise_type` degrade every memory item at encoding (the probe/response display stays noise-free).
  - `mask_time` (ms) + `mask_type` put a backward mask over the occupied locations the moment the array goes off, with no blank gap, so the mask cuts encoding off. The blank `delay_time` then runs in full after the mask: array → mask → delay → retro-cue → response, so the response screen opens `mask_time` + `delay_time` (+ `retrocue_time`) after the array's offset. `mask_time` defaults to 0 (no mask).
  - `noise_type`/`mask_type` take a registered kind name (`"speckle"`, `"salt-pepper"`,
    `"gaussian"`; `"color-squares"`, `"noise"`, `"scramble"`) or your own function.
    `BradyUtils.registerNoise`/`registerMask` add new kinds (API.md).

## Adaptive similarity tasks

**In plain terms:** the similarity plugins ask people which colors (or orientations)
look more alike, and the adaptive engine picks each next question to be the one that
teaches it the most about how similarity falls off with distance. The result is a
participant's similarity curve, plus a record of every judgment so the whole
similarity matrix can be estimated afterwards.

The triad shows a reference item with two comparisons and asks which is most
different from the reference (`layout:"triangle"` shows three items as an
odd-one-out). The quad asks which of two pairs is most different. The likert rates one
pair. All three collect a confidence rating on every trial.

**What it estimates.** The full similarity matrix `s(x, y) = f(Δ) + g_x(Δ)` (a
homogeneous falloff `f` plus per-target deviations `g_x`), the object TCC-style
memory models use. Every trial records the exact degrees and signed offsets, so any
matrix estimator (parametric or empirical binning) can be fit offline, and the matrix
can't end up mirror-flipped relative to memory-error data. The engine keeps a
particle-filter posterior over a von Mises-basis `f` (peak-normalized, `f(0) = 1`) and
a precision β, and picks trials by BALD mutual information; on a random 20% of trials
(`epsilon`) it instead draws a uniform "coverage" trial. Anchors are stratified over
the circle so every matrix row stays estimable. The model, the options and every
method are in API.md.

Each plugin runs in two modes:

- **Fixed design:** pass `stimuli` (3 / 4 / 2 item specs: wheel degrees,
  orientations, colors, images, or words). Use it for piloting and for item sets that
  aren't a wheel.
- **Adaptive (wheel or orientation only):** create one engine and pass it as `engine`
  on every trial. If a trial gets both `stimuli` and `engine`, the plugin uses the
  fixed stimuli, does not update the engine, and warns once.

### A complete adaptive session: seeded, saved, refit

```js
// 1. One engine for the whole session. Seed it so the session can be reproduced,
//    and record the seed with the data.
const seed = jsPsych.randomization.randomInt(1, 1e9);
jsPsych.data.addProperties({ engine_seed: seed });
const engine = BradySimilarity.createEngine({
  period: 180,                                  // Gabors; use 360 for color
  rng: BradySimilarity.seededRng(seed),
});

// 2. The trials: 200 adaptive Gabor triads (see "How many trials" below).
const triad = {
  type: jsPsychSimilarityTriad, engine: engine,
  item_shape: "gabor", background_color: "#808080",
  grating_options: { cycles: 5, phase: "random" },
  auto_zoom: true, data: { phase: "similarity" },
};
timeline.push({ timeline: [triad], repetitions: 200 });

// 3. Save the engine's state on the next trial's row.
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: "<p>That's the end of this part.</p>", choices: ["Continue"],
  on_finish: (data) => { data.engine_state = JSON.stringify(engine.exportState()); },
});
```

Offline (node or the browser console), refit from the saved state:

```js
const state = JSON.parse(row.engine_state);         // the saved string from step 3
// Model-light: bin the judgments by anchor and offset.
const table = BradySimilarity.empiricalMatrix(state.history, { period: state.period });
// Model-based: replay the history into a fresh engine (e.g. one built with a
// group prior). The particle filter makes its own random draws, so the refit
// posterior matches the original closely but not bit for bit.
const refit = BradySimilarity.createEngine({ period: state.period });
state.history.filter((h) => !h.invalid).forEach((h) => refit.update(h.type, h, h.response));
const fHat = refit.fHat();                           // the falloff at offsets 0..period-1
```

To refit from the trial rows instead of the saved state, convert each row's
`response` to the engine's outcome coding (API.md has the table):

| Plugin, layout | `engine.update(...)` from a data row |
|---|---|
| triad, `"reference"` (default) | `("reftriad", { ref: degrees[0], comparisons: [degrees[1], degrees[2]] }, response)` |
| triad, `"triangle"` | `("triad", { degrees }, 2 - response)`: the row records the odd item (0..2); the engine wants the most-similar pair |
| quad | `("quad", { pair1: [degrees[0], degrees[1]], pair2: [degrees[2], degrees[3]] }, 1 - response)`: the row records the more-different pair; the engine wants the more-similar one |
| likert | `("likert", { degrees }, rating)` |

Skip rows whose `response` (or `rating`) is null (timeouts; the engine was not updated
on them).

### Saving and resuming a session

To let a participant pick up where they left off (after a reload, or in a second
session), save the full snapshot, `exportState({ particles: true })`, after every trial
and rebuild the engine from it with `BradySimilarity.restoreEngine`. The snapshot adds
the particle set and the seeded rng's state, so a seeded engine continues with exactly
the trials it would have given without the break. This example keeps the snapshot in
the browser's `localStorage`; to resume on another computer, save it to your server
instead.

```js
const saved = localStorage.getItem("similarity_engine");
const engine = saved
  ? BradySimilarity.restoreEngine(JSON.parse(saved))         // continue the old session
  : BradySimilarity.createEngine({ period: 180, rng: BradySimilarity.seededRng(seed) });

const triad = {
  type: jsPsychSimilarityTriad, engine: engine,
  item_shape: "gabor", background_color: "#808080",
  on_finish: () => {
    localStorage.setItem("similarity_engine", JSON.stringify(engine.exportState({ particles: true })));
  },
};
// Run only the trials that are left:
const done = engine.exportState().history.length;
timeline.push({ timeline: [triad], repetitions: Math.max(0, 200 - done) });
```

An engine created with `Math.random` (no `rng`) has no rng state to save: it resumes
on the same posterior but draws different trials than it would have. Seed it if exact
continuation matters.

### How many trials

Plan on about 200 adaptive triads per participant. In simulations of an observer
whose falloff is in the engine's model family (period 180, reference triads, β = 12,
10 seeds), the root-mean-square error of the estimated falloff fell from about 0.07
after 60 trials to 0.055 after 150 and 0.04 after 200, then improved little (0.037
after 300). The engine's own recovery tests (`tests/invariants.js`) use 220 triads
(odd-one-out) and 300 reference triads. Real observers are noisier than the
simulated one, so more trials help if you also want the per-target deviations
`g_x`, which the engine does not target. `engine.reliableVariance()` is a rough
split-half diagnostic from the coverage trials only, so don't use it alone to stop
early.

### Period: lines, Gabors and gratings are 180°

The engine's `period` option is 360 (the default) for hues and pointed shapes, 180 for
lines, Gabors and gratings. Within a period the largest distance is period/2, and the
engine hands out integer degrees in [0, period). The plugins take their own period
from `item_shape`, record it in each trial's `period` field, record degrees in
[0, period) and signed offsets in (−period/2, period/2], and warn once if the engine's
period doesn't match. Pass the period to `empiricalMatrix` (history records don't
carry it).

**Limitations:** the adaptive engine works only on circular spaces of whole degrees
with a 360° or 180° period. Image and text items work in fixed designs only.

## Swapping the color wheel

`brady-color-wheel.js` is the default: the CIELAB wheel from Schurgin, Wixted & Brady
(2020). To use a different wheel:

- with the separate files, load one of the files below *instead of*
  `brady-color-wheel.js` (before `brady-plugin-utils.js`);
- with the bundle, load the variant *after* `brady-plugins.bundle.js`;
- or build one with `BradyColorWheel.make(colors, name)` (360 `[r, g, b]` entries,
  0–255; API.md) and pass it as a trial's `color_wheel`.

Each file provides 360 colors and the same `window.BradyColorWheel` interface, and its
`name` is recorded as `color_wheel_name`. The alternative wheels quote the source
paper's own description in their file headers.

| File | Wheel |
|---|---|
| `brady-color-wheel.js` | **Schurgin, Wixted & Brady (2020)**, *Nat. Hum. Behav.* (default). Published nominal circle: L\*=54, centre (a\*,b\*)=(21.5, 11.5), radius 49. Stores the published sRGB values; index d is wheel degree d. |
| `brady-color-wheel-zhangluck.js` | **Zhang & Luck (2008)**, *Nature*. A widely reused delayed-estimation wheel: CIELAB circle at L\*=70, centre (a\*,b\*)=(20, 38), radius 60 (180 colors in the original; we sample 360 on the same circle). Also the wheel used by Bays, Catalao & Husain (2009) and Bae, Olkkonen, Allred, Wilson & Flombaum (2014, *J. Vision*). Under D65, 201 of the 360 colors fall outside sRGB and are clipped. |
| `brady-color-wheel-bae.js` | **Bae, Olkkonen, Allred & Flombaum (2015)**, *JEP: General*. CIELAB circle at L\*=70 centred on the neutral point (a\*,b\*)=(0, 0), radius 38 (more muted). 180 colors in the original; we sample 360. All in gamut. |
| `brady-color-wheel-hemmer.js` | **Hemmer group** (e.g. Persaud & Hemmer, 2014). HSL hue sweep at full saturation and 50% lightness. Not perceptually uniform. |

In the three generated wheels, wheel degree d is hue angle d + 1 (the generating loop
runs h = 1..360), so degree 0 sits 1° past hue angle 0.

The generated CIELAB wheels are converted to sRGB under the D65 white point. The
papers converted under their own measured monitor white points, which other displays
can't reproduce, so these RGB values approximate the published stimuli rather than
copy them. The default Schurgin wheel stores the published RGB values directly.
Converted back with the standard sRGB/D65 formulas, those values sit at a constant
L\* = 54 but trace a slightly irregular ring (fitted centre ≈ (22.6, 11.0), radius ≈
50.6) rather than the nominal circle, because the original stimuli were generated with
a different conversion. Use the stored values to match the published stimuli; don't
regenerate the wheel from the nominal circle.

The real-object plugins (color-rotated-object, continuous-object-report) rotate each
object's own colors, so their degree 0 is the object's actual color, not the wheel's.
Their report ring is neutral gray by default; `wheel_colors: true` tints it with the
object's own hues (its mean CIELAB color rotated to each degree).
In continuous-object-report, `wheel_shows_object: true` instead shows small recolored
copies of the object at each option; color-rotated-object shows recolored previews
outside the ring (`num_previews`).

## Mouse-trajectory recording

Nine plugins can record the whole-trial mouse trajectory (as in delayed-estimation
studies that analyze the cursor path to the wheel, not just the final response):

- the six analog-report plugins: continuous-report, continuous-object-report,
  continuous-image-report, color-rotated-object, object-orientation-report,
  spatial-report;
- three click-to-choose plugins: change-detection, recognition, wm-forced-choice.

wm-pairs and the similarity plugins don't support it. It is off by default; turn it
on per trial:

| Param | Default | Meaning |
|---|---|---|
| `record_mouse` | `false` | Record the cursor trajectory for the whole trial. |
| `mouse_min_interval` | `0` | Min ms between samples during encoding/delay (0 = every `mousemove`). |
| `mouse_response_min_interval` | `0` | Min ms between samples during the response window (0 = every `mousemove`). |

When it's on, the trial data gains:

- `mouse_trajectory`: compact rows `[t, x, y, value]`. `t` = ms from the start of
  tracking (the fixation click with `click_to_start`, else trial start); `x,y` =
  logical px relative to the stage centre (corrected for zoom on every sample, so the
  frame doesn't depend on `auto_zoom`); `value` = what the cursor is over: the hovered
  hue/orientation/morph degree on a wheel, the nearest placeholder index for
  spatial-report, or the nearest option/button index for the click-to-choose plugins.
  `value` is `null` before the response phase.
- `mouse_trajectory_columns`: `["t","x","y","value"]`.
- `mouse_response_start_index`: the first response-window row, so
  `mouse_trajectory.slice(mouse_response_start_index)` is the response-only path.
- `mouse_phase_onsets`: `{phase: ms}` on the same clock as `t`. `encoding` is the tracking start (0: the fixation click, or trial start without `click_to_start`), which comes before the delay before the array and any pre-cue; `array` is the memory array's onset (first item painted); `mask` is the mask's onset, which is the array's offset (only on trials that show a mask); `delay` is when the blank retention interval begins, which is the array's offset, or the mask's offset on a masked trial (any retro-cue falls between `delay` and `report`); `report` is when the response phase opens; `confidence` is when a separate rating opens. A phase that didn't happen has no key: recognition has no `array`, a trial without a mask has no `mask`, and in color-rotated-object the object is up from the start, so `array` is 0 like `encoding`.
- `mouse_zoom`: the auto-zoom scale applied to the stage (informational; the
  trajectory is already in logical px).
- `mouse_geometry`: the trial layout in the same logical, centre-origin frame, so it
  lines up directly with the trajectory. For the wheel plugins: `items` (each study
  item's box `{x,y,w,h}` with its `position`, `value` and `target` flag), `wheel`
  (`{cx,cy,radius}`, or `null` for the location task), `wheel_points` (where each
  item's value sits on the response wheel; `null` for an item whose color isn't a
  wheel degree), and `target_point` (the wheel position of the correct answer). That
  makes "did the cursor head toward the target or toward a non-target's wheel position"
  a direct computation. For the click-to-choose plugins: each option's box and
  `target_option`.

`wheel_spin` is the random rotation of the wheel on screen; it is already undone in
every recorded degree, so you need it only to relate screen positions to wheel
degrees.

In change-detection and recognition, `record_mouse` with `response_ui: "keyboard"`
still records the path, but there are no options to click, so the trajectory has no
response phase and `mouse_geometry` is null. A one-time console note says so.

With `click_to_start` (the default), participants click the centred fixation to begin,
so the trajectory starts at screen centre at `t=0` (seeded as `[0,0,0,null]`).
Sampling is event-driven (~60–125 Hz, only while the mouse moves), so a parked cursor
costs almost nothing; a typical trial is ~100–300 rows. To shrink the data further,
raise `mouse_min_interval` and keep `mouse_response_min_interval` at 0.

## Other notes

- **recognition** is the test probe only (the old/new judgment). Present the items in
  a separate study trial before it.
- **continuous-image-report sprite format:** a horizontal strip of `num_frames`
  equal-width frames (default 360). Morph degree *d* → frame
  `round(d/360 * num_frames) mod num_frames`. You can pass a `frames` array of image
  URLs (one per morph step) instead. Sprite-based versions before October 2026 showed
  the mirror frame; CHANGELOG.md ("2026-10-02 audit") gives the correction for
  replicating a study run with one.
- **Plugin authors:** CONVENTIONS.md has the rules. The one that bites most often:
  plugins driven by timers or listeners keep `trial()` synchronous and call
  `finishTrial()`; making such a `trial()` async makes jsPsych end it immediately.

## Files

| File | What it is |
|---|---|
| `brady-plugins.bundle.js` | The default wheel, helpers, engine and all 17 plugins in one file. Generated: rebuild with `node build-bundle.js`. |
| `brady-color-wheel.js` | The default color wheel (`window.BradyColorWheel`). |
| `brady-color-wheel-zhangluck.js`, `-bae.js`, `-hemmer.js` | Drop-in alternative wheels. |
| `brady-plugin-utils.js` | Shared helpers (`window.BradyUtils`). |
| `similarity-adaptive-utils.js` | The adaptive-similarity model and engine (`window.BradySimilarity`). Load after `brady-plugin-utils.js`, before the `jspsych-similarity-*` plugins. |
| `jspsych-*.js` (17) | The plugins. |
| `win.mp3` / `lose.mp3` | Correct/incorrect feedback sounds. |
| `stimuli/` | Sample images used by the demos and tests (object photos, a face-morph sprite). |
| `example-experiment.html` | A complete, runnable change-detection study to use as a template. |
| `index.html`, `showcase.html`, `reference.html`, `tutorial.html` | The plugins site. `reference.html` is generated from the plugin sources by `node build-reference.js`. |
| `TUTORIAL.md` | The tutorial (shown by `tutorial.html`). |
| `API.md` | Reference for `BradySimilarity`, `BradyColorWheel` and `BradyUtils`. |
| `CHANGELOG.md` | Changes by date and `plugin_version`. |
| `CONVENTIONS.md` | The authoring rules for plugin code. |
| `brady-plugins-v8.zip` | The download: 48 files in a `brady-plugins-v8/` folder (the plugins, bundle, wheels, sounds, sample stimuli, example study, site pages and docs). It leaves out `tests/` and `internal/`. |
| `build-bundle.js`, `build-reference.js`, `build-zip.js` | Regenerate the bundle, the reference tables and the zip. After editing a source file run them in that order, `node build-zip.js` last, so the zip holds the current files. |
| `tests/` | Maintainer tests (see `tests/README.md`). Not part of the deployed site. |
| `internal/` | Maintainer notes. Not for deployment. |
