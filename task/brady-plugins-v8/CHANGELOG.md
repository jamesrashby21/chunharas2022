# Changelog

Newest first. Each block lists what you can see in a running study or in the saved
data, and is headed by the `plugin_version` it applies to. jsPsych writes each
plugin's version into every trial row as `plugin_version`, so you can tell which
rules a data file was recorded under.

All three 2026-10-02 blocks below ship together as **2.0.0** for every plugin. Data
recorded before that say `1.0.0` (continuous-report: `1.1.0`).

## 2026-10-09, the mask comes before the delay

**plugin_version:** 2.1.0 (change-detection, wm-forced-choice, wm-pairs, spatial-report, recall, continuous-report, continuous-image-report, continuous-object-report, object-orientation-report). The other eight plugins have no mask and stay at 2.0.0.

**This changes trial timing for any study that sets `mask_time` above 0.** Studies that leave `mask_time` at its default of 0 run exactly as before.

**Behavior change**

- **The post-stimulus mask now directly follows the array.** With `mask_time > 0`, the mask covers the occupied locations the moment the array goes off, with no blank gap, and the blank `delay_time` runs in full after the mask comes off. The sequence is array → mask (`mask_time`) → blank delay (`delay_time`) → retro-cue → probe/response. Through 2.0.0 the sequence was array → blank delay → mask → retro-cue → probe/response, so the mask came just before the response screen. The mask is now a backward mask that cuts encoding off, which is the design the lab's experiments use.
- **Total time from array offset to the response screen is unchanged:** `mask_time` + `delay_time` + `retrocue_time`. Only the order of the mask and the blank interval changed. `delay_time` is not shortened by the mask.
- **No parameter was renamed or removed.** `mask_time` and `mask_type` keep their names, defaults (0 and `"color-squares"`) and skip rules: no mask when `mask_time` is 0, on `do_test: false` trials (wherever the plugin has `do_test`), or in continuous-report's perception mode.

**Data changes**

- **`mouse_phase_onsets`** (only with `record_mouse`) has a new `mask` key on trials that show a mask: the mask's onset, which is the array's offset. `delay` is now the start of the blank retention interval, so on a masked trial it is the mask's offset (`mask` + `mask_time`) rather than the array's offset. On trials without a mask `delay` is the array's offset, as before. To get the array's offset on any trial, use `mask` when it is present and `delay` otherwise.
- No other data field changed. `plugin_version` separates the two orderings: a row from one of the nine plugins above that says 2.0.0 or lower was run with the mask after the delay, and 2.1.0 with the mask before it.

## 2026-10-02, usability review fixes

**plugin_version:** 2.0.0 (all plugins).

**New data fields:** `orientation_period` (continuous-report, object-orientation-report),
`confidence_key_hold_duration` (change-detection, noise-dots), `color_wheel_name` (the 15
plugins that take `color_wheel`), `item_shape` (change-detection, wm-forced-choice), and
an `array` key in `mouse_phase_onsets`. Details below.

**Data changes**

- **continuous-report records orientations in their own period.** For `item_shape`
  `"line"`, `"gabor"` and `"grating"`, `reported_orientation`, `target_orientation`,
  `orientations` and each `stimuli_shown[i].orientation` are now in [0, 180) (a
  pointer at 207° is recorded as 27). They used to be raw angles in [0, 360). A new
  `orientation_period` data field says which period the trial used (180 for those
  shapes, 360 for `"triangle"`), and a new `orientation_period` parameter overrides
  it (0, the default, takes it from `item_shape`). `orientation_error` was already
  wrapped correctly and is unchanged. To compare with older data, take the old
  orientations mod 180.
- **continuous-report on disk trials** records `orientations`, `target_orientation`
  and `stimuli_shown[i].orientation` as null. They used to be filled with 0. A disk
  trial that asks for an orientation report therefore records `orientation_error` as
  null.
- **continuous-report Gabor and grating items** record `stimuli_shown[i].color` as null
  (they are achromatic).
- **object-orientation-report** records the period it used as `orientation_period`;
  its orientations are in [0, orientation_period).
- **`key_presses`** rows are sorted by press onset (`t`). They used to be in release
  order, so a long press that began first could come after a short one.
- **change-detection, noise-dots:** the confidence key's response duration is now
  `confidence_key_hold_duration`, matching `confidence_mouse_hold_duration`. The old
  name `key_hold_duration_confidence` is still written, with the same value, so
  existing analysis code keeps working.
- **`mouse_phase_onsets`** has a new `array` key: the memory array's onset (first item
  painted). `encoding` is the tracking start (the fixation click), which comes before
  the array.
- **`color_wheel_name`**: every plugin that draws wheel colors records the wheel's
  name (`"schurgin-brady-2020"` for the default; `"custom"` for a wheel built
  without a name).
- **A `which_test` that is not a number** (NaN, a string) no longer crashes the trial.
  The trial probes a random item, records it in `which_test`, and warns once. The
  usual cause is `jsPsych.timelineVariable()` inside a function; the warning
  suggests `jsPsych.evaluateTimelineVariable()`. Any other numeric parameter that
  arrives as NaN gets its default, with the same warning, instead of throwing or
  hanging a timer.
- **`item_shape: "square"`** in change-detection and wm-forced-choice draws the color
  items as filled squares the size of the disk (placeholders, cue rings and overlays
  follow). The default is still `"disk"`. Both plugins record `item_shape`.


**Library changes**

- `BradyColorWheel.make(colors, name)` takes an optional name (recorded as
  `color_wheel_name`) and warns when it is given anything other than 360 colors.
- Engine: `exportState({particles: true})` adds the particle set and the seeded rng's
  state, and `BradySimilarity.restoreEngine(state)` continues a session from it. See
  API.md.
- `brady-plugins-v8.zip` (built by `node build-zip.js`) holds everything a study
  needs, including the docs.
- showcase.html has adaptive-triad and Gabor-triad demos; reference.html gives each
  plugin a real description and has an all-fields view.

## 2026-10-02, follow-up to the audit

**plugin_version:** 2.0.0 (released together with the usability fixes above).

No parameter or data field was renamed or removed, and no plugin default changed. A
few data fields were added (listed below).

**What a running study will notice**

- **Ensemble trials (`which_test: -1`) in continuous-image-report and
  continuous-object-report** are now scored against the circular mean of the item
  degrees, as continuous-report already was. `target_degree` and `error` used to be
  null on these trials. They are now null only when the mean is undefined (degrees
  that cancel out, such as 0/120/240).
- **`item_positions` in recall, wm-forced-choice and wm-pairs** now follows the same
  rule as the other spatial plugins. These three used to fall back to fully random
  placement when the list was short or had a bad entry; now the valid slots are kept
  and only the missing items are placed at random. See "Placement rules" in README.md.
- **similarity plugins with `item_shape: "line"`** record degrees in [0, 180) and
  offsets in (−90, 90], with a new `period` field (180 for lines, 360 otherwise). Line
  data used to be recorded on a 360° circle.
- **Seeded adaptive engines give different sequences than before.** The particle
  filter's resampling step changed (see the engine group below), the triad's coverage
  draw changed, and the plugins now shuffle the layout with the engine's rng. A given
  seed is still fully reproducible, layout included.
- **noise-dots:** with `display_time` null or 0, `actual_stim_duration` is the time
  from disk onset to the first response key. It used to be about 0.
- **change-detection, noise-dots:** `was_same` compares the resolved RGB, so `120`,
  `"120"`, its `rgb(...)` string and the matching `#hex` count as one color. It used
  to compare the strings.
- **recall:** loose scoring now also collapses runs of internal whitespace
  (`"ice  cream"` matches `"ice cream"`).
- **continuous-report:** in ranking mode (`responses_per_item > 1`) line orientations
  are compared modulo 180, so `o` and `o + 180` count as the same option, and the
  number of ranks is capped at the distinct orientations (n/2 for an even
  `orientation_num_choices`). Line trials can record fewer responses than before.
- **Numeric-string colors:** wherever a value must be a color (`item_type: "color"`,
  noise-dots `colors`/`test_color`, wm-pairs colors), a string such as `"120"` is wheel degree 120. Under `item_type: "auto"`, `"120"` is
  still the text "120".
- **`precue_time`** does nothing when `do_test` is false, in every plugin that has
  both.
- **color-rotated-object:** previews keep the object's aspect ratio.

**New data fields and options**

- **Gabor and grating stimuli:** `item_shape: "gabor"` and `"grating"` in
  continuous-report and the three similarity plugins, with one new option,
  `grating_options` (`{cycles, contrast, sigma, phase, mean}`). Their orientation lives
  in a 180° space, like `"line"`. Each Gabor/grating `stimuli_shown` entry records its
  `phase`, and continuous-report adds `probe_phase`. See "Gabors and gratings" in README.md.
- spatial-report: `drag_start_rt` (drag mode), the time from probe onset to the
  mousedown that grabs the probe.
- rsvp: each `responses` entry adds `item` (the most recently painted item) and
  `during_isi` (whether that item had already been cleared).
- recognition: `response_ui: "both"` (buttons shown and keys armed; the first answer
  counts), as in change-detection.
- continuous-image-report: perception mode records `actual_stim_duration` (array
  onset to response).
- `target_degree`, `reported_degree` and `reported_option` are declared `FLOAT` in the
  plugins where they can be fractional (continuous-image-report,
  continuous-object-report, continuous-report `target_degree`). The values are
  unchanged.

**Adaptive-similarity engine**

- A `period` option: 360 (default) or 180 for oriented bars. See "Adaptive similarity tasks" in README.md. New `engine.period`, `engine.rng`, `engine.shuffle(array)` and
  `engine.posteriorSD()`.
- `engine.fHat()` / `engine.fSD()` return copies.
  `empiricalMatrix(history, {period})` bins a 180° history correctly.
- An out-of-range response is kept in `engine.history` with `invalid: true` and left
  out of the posterior and every summary. `exportState()` reports `nResponses` (usable
  responses) and `nInvalid`.
- Resampling uses a Liu–West move (shrink toward the posterior mean, then jitter,
  bandwidth h = 0.1) in place of the fixed jitter, so repeated resampling no longer
  widens the posterior.
- The triad's coverage draw redraws both offsets when they collide, so coverage
  trials stay uniform.
- The plugins warn when `item_shape` and the engine's period disagree, and when a
  trial gets both `stimuli` and `engine` (the fixed stimuli are used; the engine is not
  updated).

**Console messages**

- One-time notes (`console.log`, not warnings) for options that work as intended but
  are easy to leave on by accident: `which_test` left at 0 on the first three trials
  of a plugin that get your own `stimuli`; wm-forced-choice `shuffle_options: false`
  with generated options (the target is always option 0); and `record_mouse` with
  `response_ui: "keyboard"` in change-detection and recognition. `which_test: 0` and
  unshuffled options are intended behavior; the notes only make them visible.
- color-rotated-object warns when a display trial has no way to end (no
  `trial_duration` and no key that ends it).
- A color wheel given a non-numeric degree draws neutral gray and warns once.

**BradyUtils and wheels (for plugin authors)**

- New helpers: `resolvePositions`, `generateFoils`, `seededRng` (and an optional
  `rng` argument on `randInt` / `randomColorDegrees`), `makeFinisher`,
  `confidencePopup(...).teardown()`, `noteOnce`, `isNeutralLab`, `ensembleTarget`,
  `sameColor`, `wantPrecue` and `isNumericString`. See CONVENTIONS.md §4 and API.md.
- `rotateCanvasHue` (memory items) and `makeRecolorCache` (probes) share one
  neutral-pixel rule (`isNeutralLab`), so an object and its probe at the same rotation
  match pixel for pixel.
- The alternative wheel files reuse `BradyColorWheel.make` when it is loaded.
- continuous-image-report and continuous-object-report no longer write into the
  trial's parameters.
- The test harness accepts `confidence` 1..N for N `confidence_labels`.

## 2026-10-02 audit

**plugin_version:** 2.0.0 (released together with the usability fixes above).

These are the changes from the 2026-10-02 code audit. Some entries below were changed
again by the follow-up above (noise-dots `actual_stim_duration`, recall whitespace).
No parameter or data field was renamed, added or removed,
and no default changed. Eight parameters are now declared `OBJECT`. Five of them so
they accept arrays: rsvp `item_duration`/`isi`, wm-pairs `which_test`, wm-forced-choice
`test_options` and noise-dots `noise_level`. The other three so a wheel degree no longer
triggers a jsPsych type warning: change-detection `test_stimulus`, noise-dots
`test_color` and recognition `stimulus`.

- **continuous-image-report: sprite frames were mirrored.** The sprite was positioned
  at `idx*100%`, which displays frame `(N − idx) mod N`, so the image on screen was the
  mirror frame of the one recorded. It now uses `idx/(N−1)*100%` and shows the recorded
  frame. The `frames` (one URL per step) path was not affected. The v6
  `continuous-image-*` plugins have the same bug. In data from either older version,
  degree `d` showed sprite frame `(360 − d) mod 360` (for a 360-frame sprite). Absolute
  errors are unaffected, but signed errors are negated relative to the sprite's frame
  order. To show the same images as an older study whose item degrees you pin, pass
  `(360 − d) % 360`.
- **rsvp:** per-item `item_duration` and `isi` arrays now work. jsPsych 8 had turned
  them into `NaN`, so array ISIs ran at about 0 ms. With `isi: 0`, consecutive items now
  paint in the same task, with no blank frame between them. Timing is a `setTimeout`
  chain, not frame-locked.
- **wm-pairs:** the `which_test: [item, inner_or_outer]` form now works (it was `NaN`).
  Generated foils keep `min_color_distance` from the target and from each other, and
  off-wheel (CSS/lab) targets get hue-rotated foils, so lightness or chroma no longer
  gives the answer away.
- **wm-forced-choice:** the precue ring no longer stays on through the probe. Foils
  never equal the target. Off-wheel targets get hue-rotated foils. `test_options: []`
  is treated as omitted. Keyboard `choice_keys` map to options in reading order (top
  row first, then left to right). Image/text options in the `"center"` layout are drawn
  a little smaller so their corners clear the placeholders.
- **Short or invalid `item_positions`** no longer crash or misplace items. See
  "Placement rules" in README.md for the rule each plugin follows.
- **2afc-keyboard:** with `prompt_lead_time`, the options are hidden during the lead
  time and appear when the keyboard goes live. `stimuli_shown.rotation` is the rotation
  actually applied. Rotated images keep their aspect ratio. Keys pressed during feedback
  are no longer logged in `key_presses`.
- **continuous-object-report / color-rotated-object:** a click is scored at the
  click's own angle rather than the last `mousemove`. color-rotated-object's live
  recolor snaps to the nearest ring option, so the color you see is the one recorded.
- **continuous-report:** feedback in ranking mode scores rank 1. Perception mode with
  `which_test: -1` no longer turns into an ensemble trial. Perception mode records the
  gray match slot as `"#888888"`.
- **spatial-report:** a ~1.4 px click bias is gone. In click and drag modes,
  `clicked_position` is the nearest placeholder. In drag mode, `rt` is the drop time
  (it includes the movement).
- **object-orientation-report:** `orientation_num_choices` counts steps around 360°,
  so with `orientation_period: 180`, n steps give n/2 distinct orientations.
- **noise-dots:** `noise_level` takes a scalar or `[target, test]`. With
  `display_time` null or 0, the disks stay up and `actual_stim_duration` is about 0 (since changed: it now runs
  from disk onset to the first response; see the newer block above).
- **change-detection:** warns when `is_change: true` is set on image/word items with no
  `test_stimulus` (the probe would be identical to the study item).
- **recall:** loose scoring trims, ignores case and compares numbers numerically. It
  does not collapse internal whitespace. Text stimuli are inserted as HTML.
- **similarity plugins:** `response_timeout` now fires even while the confidence popup
  is open. Out-of-range responses are recorded but skipped by the engine (with a
  warning).
- **All plugins (BradyUtils):** touch and pen hold durations are measured correctly. A
  key that went down before the trial (e.g. the key that ended the previous screen)
  no longer sets `multiple_keys_pressed`. The win/lose sounds load relative to the
  script, so they also work from the bundle.
