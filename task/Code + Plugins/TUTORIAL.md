# Tutorial: building experiments with these jsPsych plugins

**For:** anyone who wants to run one of these visual-memory or perception tasks online,
even if you've barely written code. An experiment here is one text file (an `.html`
file) that runs in a web browser.

These tasks are add-ons to [jsPsych](https://www.jspsych.org), the free, open-source
engine that runs them. jsPsych also has a large library of standard plugins for the
everyday pieces (instructions, surveys, simple response screens), and you can mix those
freely with the ones here.

**Reading order for a first study:** §0 (get the files and run the example) → §1 (the
page skeleton) → §2 (the five ideas) → read the code of `example-experiment.html` →
find your task in §4 → §6 (saving and reading your data). Words you don't know are in
§8. Keep two pages open while you work:

- `showcase.html` runs every plugin live. Pick a demo, watch it, and copy its options.
- `reference.html` lists every option and data field of each plugin.

---

## 0. Get the files and run them

### 0.1 Download the plugins

1. Download `brady-plugins-v8.zip` from the plugins site (the "Download" link on the
   Overview page).
2. Unzip it (Windows: right-click → *Extract All*; Mac: double-click). You get a folder
   with the plugin files, `example-experiment.html`, the sounds and the sample images.
3. Your own experiment file goes **in that folder**, next to `example-experiment.html`.
   The plugins are loaded by file name, so the page can only find them there.

### 0.2 Get a text editor

Notepad works. [VS Code](https://code.visualstudio.com/) (free) is nicer because it
colors the code and shows mistakes. Don't use Word: it adds invisible formatting that
breaks code. On Windows, check that your file really ends in `.html` and not
`.html.txt` (File Explorer hides extensions by default: *View* → *Show* → *File name
extensions*).

### 0.3 Run the folder through a small web server

Double-clicking an `.html` file opens it as `file://...`. The example study may even
look fine that way, but sounds are off, the image tasks fail (the browser won't let a
`file://` page read image pixels, which the object-recoloring plugins need), and saving
to a server can fail. So always run it through a local web server: a small program
that hands the folder's files to your browser at an address starting with
`http://localhost`.

You start it from a **terminal**: a window where you type commands instead of
clicking. The server keeps running in that window until you stop it.

**Windows**

1. Open the unzipped folder in File Explorer.
2. Click in the address bar at the top (where the folder path is), type `cmd`, and
   press Enter. A black Command Prompt window opens, already in that folder.
3. Type `python -m http.server 8000` and press Enter. When it prints
   `Serving HTTP on ... port 8000`, it's running. Leave the window open.
   - If the Microsoft Store opens, or you see "Python was not found", Python isn't
     installed. Install it from [python.org](https://www.python.org/downloads/)
     (tick "Add python.exe to PATH" in the installer), close the Command Prompt,
     and repeat from step 2.
4. In your browser, go to <http://localhost:8000/example-experiment.html>. For your own
   file, use its name instead: `http://localhost:8000/my-study.html`.
5. To stop the server, click in the Command Prompt window and press Ctrl+C (or close
   the window).

**Mac**

1. Open Terminal (press Cmd+Space, type `Terminal`, press Enter).
2. Type `cd` and a space, drag the unzipped folder from Finder into the Terminal
   window (this pastes its path), and press Enter. (`cd` means "change directory":
   go into that folder.)
3. Type `python3 -m http.server 8000` and press Enter. If macOS offers to install
   developer tools, accept, then run the command again. When it prints
   `Serving HTTP on ... port 8000`, it's running. Leave the window open.
4. In your browser, go to <http://localhost:8000/example-experiment.html>.
5. To stop the server, click in the Terminal window and press Ctrl+C.

**No Python? Use VS Code's Live Server instead**

1. Install [VS Code](https://code.visualstudio.com/).
2. Click the Extensions icon on the left (or press Ctrl+Shift+X), search for
   **Live Server** (by Ritwick Dey), and click *Install*.
3. *File* → *Open Folder...* and choose the unzipped folder.
4. In the file list on the left, right-click `example-experiment.html` (or your own
   file) and choose **Open with Live Server**. The browser opens it at an address
   like `http://127.0.0.1:5500/example-experiment.html`.

Once the study is online, your web host is the server and you can skip this step.

### 0.4 The fastest start: the example study

With the server running, open `example-experiment.html`. It's a complete color
change-detection study: instructions, practice, the main block, a thank-you screen,
then the data on screen. Then open the same file in your editor to read its code
alongside §1, §2 and §5. Copying it and changing a few things is usually the quickest
way to your own study.

### 0.5 Where these fit: jsPsych and its standard plugins

- New to jsPsych? Its official getting-started tutorial takes about 10 minutes:
  <https://www.jspsych.org/latest/tutorials/hello-world/>
- The standard plugin library has ready-made plugins for the screens around your task:
  `instructions`, `fullscreen`, `preload`, the simple `html-keyboard-response` /
  `html-button-response` screens, questionnaires (`survey-text`, `survey-likert`,
  `survey-multi-choice`), and audio/video. Full list:
  <https://www.jspsych.org/latest/plugins/list-of-plugins/>
- A standard plugin and one of ours load the same way (a `<script>` line) and sit on
  the same timeline. To load another standard plugin, add a line like those in §1:
  `https://unpkg.com/@jspsych/plugin-NAME@2/dist/index.browser.min.js` (jsPsych v8
  uses the v2 plugin packages).
- Community plugins (like DataPipe, for saving to OSF) live in jsPsych-contrib:
  <https://github.com/jspsych/jspsych-contrib>.

---

## 1. The page skeleton (copy this, then add your trials)

Every experiment file looks like this. The comments (`<!-- ... -->` in HTML, `// ...`
in code) explain each part; keep them or delete them.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">

  <!-- 1. jsPsych itself, the engine that runs trials. Loaded from a CDN
       (a public copy on the internet), so you need an internet connection. -->
  <link rel="stylesheet" href="https://unpkg.com/jspsych@8/css/jspsych.css">
  <script src="https://unpkg.com/jspsych@8/dist/index.browser.min.js"></script>

  <!-- 2. Standard jsPsych plugins for the screens around your task
       (instructions, fullscreen, preloading images, simple key/button pages). -->
  <script src="https://unpkg.com/@jspsych/plugin-html-button-response@2/dist/index.browser.min.js"></script>
  <script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@2/dist/index.browser.min.js"></script>
  <script src="https://unpkg.com/@jspsych/plugin-instructions@2/dist/index.browser.min.js"></script>
  <script src="https://unpkg.com/@jspsych/plugin-fullscreen@2/dist/index.browser.min.js"></script>
  <script src="https://unpkg.com/@jspsych/plugin-preload@2/dist/index.browser.min.js"></script>

  <!-- 3. (Optional) confetti, used for the burst on correct feedback. -->
  <script src="https://unpkg.com/canvas-confetti@1.9.3/dist/confetti.browser.js"></script>

  <!-- 4. The lab plugins: all 17 in one file. It must sit in the same folder
       as this .html file. -->
  <script src="brady-plugins.bundle.js"></script>
</head>

<body></body>   <!-- jsPsych fills the page in for you; leave the body empty. -->

<script>
  // Create the experiment.
  const jsPsych = jsPsychModule.initJsPsych({
    show_progress_bar: true,   // the "Completion Progress" bar at the top of the page
    // on_finish runs when everything is done. Here it shows the data on screen,
    // which is handy while you build the study; §6 shows how to save it instead.
    on_finish: () => jsPsych.data.displayData(),
  });

  // The timeline is the ordered list of screens/trials to run.
  const timeline = [];
  // ...add trials to `timeline` here (see §2 and §4)...

  jsPsych.run(timeline);
</script>
</html>
```

The order of the `<script>` lines matters: a script can only use things defined by the
scripts above it. jsPsych loads first, then the lab plugins, and all of them load
before the `<script>` at the bottom that builds your timeline.

**Loading single plugins instead of the bundle.** `brady-plugins.bundle.js` holds the
color wheel, the shared helpers, the adaptive engine and all 17 plugins. You can
instead list only the files a study uses, in this order: the color wheel, the helpers,
then the task plugins (the three similarity plugins also need
`similarity-adaptive-utils.js`, after the helpers and before them):

```html
  <script src="brady-color-wheel.js"></script>
  <script src="brady-plugin-utils.js"></script>
  <script src="jspsych-change-detection.js"></script>
  <script src="jspsych-continuous-report.js"></script>
```

If you edit a plugin's source, rebuild the bundle with `node build-bundle.js`.

Each task plugin gives you one name to use in your trials:

| Plugin file | Name you write in a trial |
|---|---|
| jspsych-change-detection.js | `jsPsychChangeDetection` |
| jspsych-2afc-keyboard.js | `jsPsych2afcKeyboard` |
| jspsych-continuous-report.js | `jsPsychContinuousReport` |
| jspsych-continuous-image-report.js | `jsPsychContinuousImageReport` |
| jspsych-continuous-object-report.js | `jsPsychContinuousObjectReport` |
| jspsych-color-rotated-object.js | `jsPsychColorRotatedObject` |
| jspsych-object-orientation-report.js | `jsPsychObjectOrientationReport` |
| jspsych-wm-forced-choice.js | `jsPsychWmForcedChoice` |
| jspsych-wm-pairs.js | `jsPsychWmPairs` |
| jspsych-noise-dots.js | `jsPsychNoiseDots` |
| jspsych-recognition.js | `jsPsychRecognition` |
| jspsych-recall.js | `jsPsychRecall` |
| jspsych-spatial-report.js | `jsPsychSpatialReport` |
| jspsych-rsvp.js | `jsPsychRsvp` |
| jspsych-similarity-triad.js | `jsPsychSimilarityTriad` |
| jspsych-similarity-quad.js | `jsPsychSimilarityQuad` |
| jspsych-similarity-likert.js | `jsPsychSimilarityLikert` |

---

## 2. The five ideas you actually need

First, a little JavaScript vocabulary, since every example uses it:

- An object is a labelled bundle of settings in curly braces:
  `{ set_size: 4, feedback: true }`. Each `label: value` pair is one setting, and
  the pairs are separated by commas.
- An array is an ordered list in square brackets: `[2, 4, 6]` or `["cat", "dog"]`.
  Counting starts at 0, so the first entry is entry 0.
- A string is text in quotes: `"hello"`.
- `() => { ... }` is a short function: code that runs later, when jsPsych needs the
  value, instead of right away. You'll mostly copy these as they are.

Now the five ideas.

**1. A trial is an object.** It has a `type` (which plugin) plus that plugin's
options:

```js
{ type: jsPsychChangeDetection, set_size: 4, is_change: true }
```

**2. The timeline is a list of trials**, run top to bottom. Add to it with
`timeline.push(...)`:

```js
timeline.push({ type: jsPsychChangeDetection, set_size: 4, is_change: true });
```

**3. Timeline variables** let you write a trial once and run it once per condition.
You hand jsPsych a list of conditions; it runs the trial once per row, and can shuffle
and repeat the rows:

```js
const block = {
  // the trial template; jsPsych.timelineVariable('x') means "fill in x from the
  // current row below"
  timeline: [{
    type: jsPsychChangeDetection,
    set_size: jsPsych.timelineVariable('set_size'),
    is_change: jsPsych.timelineVariable('is_change'),
    feedback: true,
  }],
  timeline_variables: [          // one row = one condition
    { set_size: 2, is_change: true },
    { set_size: 2, is_change: false },
    { set_size: 6, is_change: true },
    { set_size: 6, is_change: false },
  ],
  randomize_order: true,         // shuffle the rows
  repetitions: 10,               // run the whole set 10 times: 10 × 4 = 40 trials
};
timeline.push(block);
```

> **Inside a function, use `jsPsych.evaluateTimelineVariable('x')`.**
> `jsPsych.timelineVariable('x')` works only as an option's whole value, as above.
> Inside a `() => ...` function it gives a placeholder, not the number, so arithmetic
> on it gives `NaN` ("not a number"). When you need to compute with a condition's
> value, write `jsPsych.evaluateTimelineVariable('x')` instead:
> `which_test: () => jsPsych.randomization.randomInt(0, jsPsych.evaluateTimelineVariable('set_size') - 1)`.
> (If a plugin does get `NaN` for `which_test`, it tests a random item and prints a
> console warning that suggests this fix.)

**4. The plugins fill in the randomness.** If you don't give colors or positions, the
plugin picks random colors at random locations on every trial, so you only set what you
care about. The tested item defaults to `which_test: 0`, the first item in the list;
with random colors at random locations that is still a random color at a random spot,
so you don't need to randomize it. You only need a random `which_test` when you supply
your own `stimuli` (see §3.1). (Helpers like `jsPsych.randomization.shuffle([...])`
are there when you need them.)

**5. The data.** Every trial records its own results: reaction time, accuracy, and
task-specific fields (each plugin's fields are listed in `reference.html`; §6.1 lists
the outcome columns of the common tasks). jsPsych does not copy your trial options into
the data, so if you'll need to tell rows apart later (practice vs. main, a condition
label), add a label through the trial's `data` option, e.g. `data: { phase: "practice" }`,
and filter on it. While developing you can look at the data in the browser console:

```js
jsPsych.data.get()                                  // all of it
jsPsych.data.get().filter({ trial_type: 'change-detection' })  // just one task
jsPsych.data.get().csv()                            // as a spreadsheet (CSV) string
```

Saving it to a file is §6.

---

## 3. Conventions shared by these plugins

These work the same way in every plugin that has the option. This is the short
version; README.md ("Shared conventions") has the full rules.

- Stimuli can be colors, color-wheel degrees, images, or words, mixed however you like,
  through a `stimuli` list plus `item_type` (`"auto"`, the default, which guesses; or
  `"color"` / `"image"` / `"text"`):
  - a number like `42` is color number 42 on the color wheel (see "color wheel" in §8)
  - `"rgb(255,0,0)"`, `"#0f0"`, `"lab(54,80,67)"` is that exact color
  - `"stim/dog.png"` is an image file (an image extension or any `/` in the string)
  - `"cat"` is the word "cat", and so is `"7"`: a number in quotes is text. The
    exception is a setting that can only be a color (`item_type: "color"`, the
    noise-dots colors, wm-pairs): there `"120"` means wheel color 120, the same as `120`
  - `stimuli: []` (empty) makes the color tasks generate random wheel colors
- `auto_zoom: true` scales the task to fill the window, so it's a usable size on any
  monitor. Use it on a page that holds only the experiment (ideally fullscreen).
- `feedback: true` shows whether the answer was right, plays `win.mp3` or `lose.mp3`,
  and fires confetti on correct answers. Turn the extras off with
  `feedback_sound: false` and `feedback_confetti: false`.
- `sequential: true` (the multi-item memory tasks) shows the items one at a time in
  their places, timed by `sequential_item_time` and `sequential_gap_time` (ms).
- Placeholders (outlines at every location) are drawn by default.
- Cues: `precue_time` (ms) highlights the location that will be tested before the items
  appear; `retrocue_time` (ms) highlights it after the delay. Both default to 0 (off).
- Report wheels with `num_choices` below 360 offer only that many evenly spaced colors,
  laid out so the correct answer is always one of them. Leave it at 360 for a
  continuous wheel.
- What trials save: besides the response and `rt`, every plugin saves `stimuli_shown`
  (one entry per item on screen, with its location and value) and, for timed displays,
  `actual_stim_duration` (how long the items were measured to be up). See §6.1.
- Mouse tracking: `record_mouse: true` logs the cursor path on change-detection,
  recognition, wm-forced-choice, spatial-report, continuous-report,
  continuous-image-report, continuous-object-report, color-rotated-object and
  object-orientation-report (README.md, "Mouse-trajectory recording").
- Swapping the color wheel: the color tasks use the Schurgin, Wixted & Brady (2020)
  wheel by default. For another, load `brady-color-wheel-zhangluck.js`,
  `brady-color-wheel-bae.js` or `brady-color-wheel-hemmer.js` **after**
  `brady-plugins.bundle.js` (or, with separate files, in place of
  `brady-color-wheel.js`). Each trial records the wheel it used in `color_wheel_name`.
- Units: times are in milliseconds (1000 = 1 second). Keys are strings: `"s"`, `"f"`,
  `" "` (space), `"ArrowLeft"`.

### 3.1 How `stimuli`, `which_test`, and `item_positions` fit together

Three settings decide *what* is shown, *where* it is shown, and *which* item is tested.
It's easy to combine them in a way that runs but quietly does the wrong thing, so here
they are together.

- `stimuli` (or `item_colors` / `orientations`) is your list of items. Its order is
  just your bookkeeping: item 0 is the first one you wrote, item 1 the second, and so
  on.
- `which_test` picks which item in that list is probed, by its number in the list.
  `which_test: 0` (the default) tests the item you listed first. Several plugins also
  accept `which_test: -1` for a whole-array (ensemble) report.
- `item_positions` (optional) pins which ring slot each item goes to, again by list
  order: `item_positions: [3, 0, 5]` puts item 0 at slot 3, item 1 at slot 0, and
  item 2 at slot 5. Leave it out and the plugin scatters the items to random slots
  each trial, which is usually what you want.

**Placement is randomized; list order is not.** If you leave `item_positions` empty,
the screen location is reshuffled every trial but `which_test` still refers to your
list, so the right item is tested wherever it landed. It also means that with your own
`stimuli` and the default `which_test: 0`, the first item you listed is the one tested
on every trial. That is the intended default, and if it is what you want, nothing more
is needed. Because it is easy to leave on by accident, the plugin prints a one-time
note in the console after the third such trial.

Common recipes:

| You want | Do this |
|---|---|
| Test a random item at a random location, one set size | leave `item_positions` empty; give `which_test` a function so it is drawn fresh each trial: `which_test: () => jsPsych.randomization.randomInt(0, 3)` for set size 4 (items 0 to 3) |
| The same, with set size varying across trials | `which_test: () => jsPsych.randomization.randomInt(0, jsPsych.evaluateTimelineVariable('set_size') - 1)` (the example below) |
| Always test one specific item, random locations | leave `item_positions` empty; fix `which_test` |
| Exact fixed layout (e.g. a figure or a demo) | set `item_positions` to a full list and set `which_test` |
| Whole-array / ensemble report | `which_test: -1` (continuous-report, continuous-image-report, continuous-object-report) |

**Example: mixed set sizes with your own items and a random probe.** Each trial draws
`set_size` words from a pool, and the tested word is random. `stimuli`, `which_test`
and `test_stimulus` are functions, so they are computed fresh on every trial, and they
use `jsPsych.evaluateTimelineVariable` because they need the condition's value inside a
function.

```js
const words = ["cat", "dog", "sun", "map", "pen", "cup", "hat", "box"];
const newWords = ["zip", "fog", "jam", "kit"];   // never studied: used as changed probes
const mixedBlock = {
  timeline: [{
    type: jsPsychChangeDetection,
    set_size: jsPsych.timelineVariable('set_size'),
    // set_size different words from the pool, in random order
    stimuli: () => jsPsych.randomization.sampleWithoutReplacement(
      words, jsPsych.evaluateTimelineVariable('set_size')),
    item_type: "text",
    // the tested item: a random one of items 0 .. set_size - 1
    which_test: () => jsPsych.randomization.randomInt(
      0, jsPsych.evaluateTimelineVariable('set_size') - 1),
    // The plugin can only change colors itself, so a word trial gives the changed
    // probe in test_stimulus. test_stimulus overrides is_change, so it is null
    // (no override) on "same" trials.
    is_change: jsPsych.timelineVariable('is_change'),
    test_stimulus: () => jsPsych.evaluateTimelineVariable('is_change')
      ? jsPsych.randomization.sampleWithoutReplacement(newWords, 1)[0]
      : null,
    data: { phase: "main" },
  }],
  timeline_variables: [
    { set_size: 2, is_change: true }, { set_size: 2, is_change: false },
    { set_size: 4, is_change: true }, { set_size: 4, is_change: false },
    { set_size: 6, is_change: true }, { set_size: 6, is_change: false },
  ],
  randomize_order: true,
  repetitions: 5,                // 5 × 6 = 30 trials
};
timeline.push(mixedBlock);
```

The data records the item that was actually tested in `which_test` and the truth in
`was_same`, so you can check the draws afterwards.

**Console warnings.** The plugins print a warning in the browser console (press F12,
then click *Console*) for the common mistakes here. The warning names the plugin, the
problem, and the fix. The warnings change nothing themselves; what the plugin then does
is listed after each one:

- `item_positions` with a different length than `set_size`. A short list is padded:
  items without a slot go to random unused slots. Extra entries are ignored. Give
  exactly `set_size` positions, or none.
- an invalid slot (negative or not a whole number). It is dropped, and that item gets a
  random unused slot.
- the same slot listed twice. Only the first use counts; the later item gets a random
  unused slot. Use distinct slots.
- a slot `>= num_placeholders`. The plugin raises `num_placeholders` to fit it, which
  changes the spacing of the ring. Set `num_placeholders` yourself if the spacing
  matters.
- `which_test` outside `0 .. set_size - 1`. It is clamped into range, so a different
  item than you meant is tested.
- `which_test` that is not a number (usually `NaN` from `jsPsych.timelineVariable`
  inside a function). A random item is tested, and the warning suggests
  `jsPsych.evaluateTimelineVariable`.
- a fixed `item_positions` and a fixed `which_test` together. The same screen location
  is probed on every trial, which participants can learn. Randomize `which_test` (or
  drop `item_positions`) unless a fixed probe location is the point.
- fewer distinct values than items (e.g. two identical colors in one array). This is
  usually an accident, since it muddies which item a response refers to.

The same console warnings catch other easy mistakes:

- Mistyped choices. Every "pick one" setting (`response_ui`, `response_mode`,
  `option_layout`, `report`, `item_type`, `probe_feature`, `mode`, `input_type`,
  `report_location`, `response_location`, …) is checked against its allowed values,
  and a typo gets a "did you mean" suggestion: `response_ui: "buton"` warns *did you
  mean "buttons"?*. Without the warning, a typo would fall back to the default and
  you'd get the wrong screen with no error.
- Impossible numbers: negative times (`display_time: -50`), a `radius` or `item_size`
  of zero or less, a non-positive `num_choices`, a `noise_level` outside 0..1, or
  `choices_per_test` below 2.
- Inconsistent choices. In `2afc-keyboard`, a `choice_keys` list that doesn't match the
  number of options, or a `correct_option` index out of range, is flagged (otherwise
  accuracy is scored against the wrong thing).

Mistyped option *names* are different: jsPsych ignores options it doesn't recognize,
with no warning (see §7).

A few settings are fine as they are but easy to leave on by accident. For these the
plugin prints a one-time note (a plain console message, not a warning) and runs as
asked:

- `which_test` still 0 after three trials that use your own `stimuli`: item 0 is the
  tested item every time.
- wm-forced-choice with `shuffle_options: false` and generated options: the target is
  always option 0, in the same screen slot on every trial.
- `record_mouse: true` with `response_ui: "keyboard"` in change-detection or
  recognition: there is nothing to click, so the trajectory has no response phase.

So when something runs but looks wrong, open the browser console first. If you have an
intentional design and want the console quiet, set
`BradyUtils.PLACEMENT_WARNINGS = false` once after the scripts load; it silences all of
these warnings and notes.

---

## 4. Every plugin, with a copy-paste example

Each block below is one trial object. Drop it into `timeline.push( ... )`, or use it as
the template inside timeline variables (§2). These show the options you'll use most;
the full list per plugin is in `reference.html`, and you can watch each one run in
`showcase.html`. The "Records" line names the main data columns; §6.1 explains how to
read them.

### 4.1 change-detection: same or different?
An array of colored disks, a blank delay, then one disk comes back, either the same or
changed. The participant judges same vs. different.

```js
{
  type: jsPsychChangeDetection,
  set_size: 4,             // how many items
  is_change: true,         // true = the probe changed; false = it's the same
  change_amount: 70,       // how far a change moves the color around the wheel (70 of 360 steps)
  display_time: 250,       // how long the array is shown (ms)
  delay_time: 800,         // blank memory delay (ms)
  response_mode: "binary", // "binary" | "confidence6" (one 1-6 scale) | "two_stage" (same/diff, then confidence)
  response_ui: "both",     // "both" (default) = click a button OR press S (same) / D (different) | "buttons" | "keyboard" | "radio"
  feedback: true,
}
```
Records: `said_same` (1/0), `was_same`, `correct`, `confidence` (or null), `rt`. The
keys are set by `same_key` / `different_key` (default `"s"` / `"d"`). The items are
colored disks; for colored squares (the classic Luck & Vogel display) add
`item_shape: "square"`:

```js
{ type: jsPsychChangeDetection, item_shape: "square", set_size: 4, is_change: true }
```

The items can also be images, words or degrees via `stimuli` + `item_type` (§3). For
images and words, give the changed probe yourself with `test_stimulus`, because the
plugin can only change colors automatically.

### 4.2 2afc-keyboard: perceptual forced choice by keyboard
Shows a few options side by side; the participant presses the key for the position
they pick. Options can be colors, degrees, images, or words.

```js
{
  type: jsPsych2afcKeyboard,
  stimuli: [40, 210],        // two colors given as wheel degrees (or images / words)
  choice_keys: ["f", "j"],   // one key per screen position, left to right (the default)
  correct_option: 1,         // index into stimuli of the correct option, or null if none
  shuffle_options: true,     // randomize the left/right order each trial (the default)
  prompt: "<p>Press F for the left color, J for the right.</p>",
  feedback: true,
}
```
Records: `response` (the key), `chosen_position` (0 = leftmost), `chosen_option` (index
into `stimuli`), `correct`, `rt`, and `option_order` (the left-to-right display order,
so you can recover which option sat where). The keys always map to screen position;
with `shuffle_options` on, `option_order` tells you which stimulus that was.
`wm-forced-choice` uses the same `choice_keys`, `correct_option`, `shuffle_options`,
and `option_order` names. With `prompt_lead_time` above 0, the prompt appears alone
first and the options appear when the keyboard goes live. Image options are sized with
`stimulus_width` / `stimulus_height`; `item_size` sizes only colors and words.

### 4.3 continuous-report: report a remembered color (and/or orientation)
Remember the items; one location is probed; click the matching color on a color wheel.
Error is measured in wheel degrees.

```js
{
  type: jsPsychContinuousReport,
  set_size: 4,
  display_time: 500,
  delay_time: 800,
  num_choices: 360,    // 360 = a continuous wheel; e.g. 12 = a 12-option wheel
  spin_wheel: true,    // rotate the wheel randomly each trial (reduces motor habits)
  feedback: true,
}
```
Records: `error` (the signed error, ready for TCC or other error-distribution models),
`reported_degree`, `target_degree`, `rt`, `mouse_hold_duration`. `error`,
`reported_degree`, `rt` and `mouse_hold_duration` are lists with one entry per report,
because a trial can ask for more than one (`responses_per_item`); a normal trial gives
one-entry lists like `[12]` (§6.1). `error = reported − target`: positive means the
answer was further around the wheel than the true color, which on screen is clockwise.
`wheel_spin` records how far the wheel was rotated on screen; the recorded degrees
already account for it.

The items can be disks (default), lines, triangles, Gabor patches or gratings
(`item_shape`), and you can report `"color"`, `"orientation"`, or `"both"`:

```js
{
  type: jsPsychContinuousReport,
  item_shape: "triangle",       // "disk" | "line" | "triangle" | "gabor" | "grating"
  report: "both",               // "color" | "orientation" | "both"
  report_order: "color_first",  // for "both": "color_first" | "orientation_first"
  set_size: 3,
  feedback: true,
}
```
For orientation, the probed shape turns to follow the mouse; click to set it. The
orientation columns are `orientation_error`, `reported_orientation` and
`target_orientation`. In ranking mode (`responses_per_item` above 1) each response must
be a different option.

Gabors and gratings are gray stripe patterns, so report their orientation. A Gabor at
10° looks the same as one at 190°, so orientations are recorded from 0 to 179 and the
error runs from −90 to +90 (`orientation_period` is 180 in the data). Put them on a
mid-gray box so they can reach full contrast:

```js
{
  type: jsPsychContinuousReport,
  item_shape: "gabor",              // or "grating" (no Gaussian fade)
  report: "orientation",
  background_color: "#808080",      // the Gabor's mean gray matches this
  grating_options: { cycles: 5, phase: "random" },  // other keys keep their defaults
  set_size: 3,
  feedback: true,
}
```
The outcome column is `orientation_error`. `grating_options` sets the stripes (how
many, contrast, fade, phase); README.md ("Gabors and gratings") lists every key and its
default. With `phase: "random"`, each item's phase is saved in `stimuli_shown`, and the
probe's in `probe_phase`.
`mode: "perception"` turns the task into a no-memory matching baseline (a visible
reference next to a gray match disk).

### 4.4 continuous-image-report: report on an image-morph wheel
The items are frames from a circular morph set (say, a face that gradually changes
identity). The wheel is the morph, and you report the remembered frame.

```js
{
  type: jsPsychContinuousImageReport,
  image_sprite: "stimuli/face-morph.png", // one wide image: all the frames in a row
  num_frames: 60,                          // how many frames are in that strip
  set_size: 3,
  display_time: 500,
  delay_time: 800,
  feedback: true,
}
```
The sprite is a single image with every morph frame laid out left to right, frame 0 at
the left. Degree `d` shows frame `round(d / 360 × num_frames)` (wrapping at
`num_frames`). You can instead pass `frames: ["f0.png","f1.png", ...]`, one file per
frame.
Records: `error`, `reported_degree`, `reported_frame`, `target_degree`, `target_frame`
(`error` and `reported_degree` are one-entry lists, as in §4.3).

> **If you are replicating an older study:** earlier copies of this plugin (the v6
> version and v8 copies before October 2026) drew the mirror-image sprite frame,
> `(N − idx) mod N`, so the recorded frame numbers did not match the image on screen.
> Errors in degrees were not affected. The current version shows the frame it records.
> If you pin `item_values` to reproduce an older study, participants now see the
> mirror-image morphs of what that study showed (CHANGELOG.md has the correction).

### 4.5 continuous-object-report: color-rotate real objects (working memory)
Several real-object photos appear at locations, each tinted a different color. After a
delay one location is probed; you move around a color wheel and the probed object
recolors live so you can match its remembered color.

```js
{
  type: jsPsychContinuousObjectReport,
  stimuli: ["stimuli/obj-clock.jpg", "stimuli/obj-mug.jpg", "stimuli/obj-pot.jpg"],
  set_size: 3,
  display_time: 500,
  delay_time: 800,
  background_color: "#ffffff",            // white hides the photos' own white backgrounds
  placeholder_border: "2px solid #ccc",   // the location boxes (the default)
  feedback: true,
}
```
To use one image for all items, pass `object_image: "stimuli/obj-clock.jpg"` instead of
a `stimuli` list. Records: `error`, `reported_degree`, `target_degree`. Degree 0 is each
object's own color, not the color wheel's color 0.

### 4.6 color-rotated-object: one recolored object (study or single report)
A single object whose color has been rotated. Two modes:

```js
// display: show it for a moment
{ type: jsPsychColorRotatedObject, mode: "display", stimulus: "stimuli/obj-clock.jpg",
  color_rotation_deg: 60, trial_duration: 1000 }

// report: adjust its color on a ring ("what's its real color?")
{ type: jsPsychColorRotatedObject, mode: "report", stimulus: "stimuli/obj-clock.jpg",
  color_rotation_deg: 60, feedback: true }
```
In report mode `color_rotation_deg` is the true answer that the response is scored
against. The object recolors to the ring option nearest the cursor, and that option is
what gets recorded. Report records: `reported_degree`, `error`, `rt` (lists, as in
§4.3).

### 4.7 object-orientation-report: report a remembered orientation of real objects
Real-object photos appear at locations, each rotated by some angle. After a delay one
location is probed; you spin the object back to its remembered angle.

```js
{
  type: jsPsychObjectOrientationReport,
  stimuli: ["stimuli/obj-clock.jpg", "stimuli/obj-mug.jpg", "stimuli/obj-pot.jpg"],
  set_size: 3,
  display_time: 500,
  delay_time: 800,
  report_location: "center",   // "center" (spin the probe in the middle) | "in_place" (spin it in its box)
  orientation_period: 360,     // 360 if every angle looks different; 180 if the object looks the same after a half turn
  feedback: true,
}
```
Records: `reported_orientation`, `orientation_error`, `target_orientation`, `rt`. To
quantize the response, set `orientation_num_choices`. It counts steps around the full
360°, so with `orientation_period: 180`, `orientation_num_choices: 12` gives 6 distinct
orientations.

### 4.8 wm-forced-choice: remember an array, then pick from options
Array, delay, then one location is probed and you pick which of K options was there.

```js
{
  type: jsPsychWmForcedChoice,
  set_size: 3,
  choices_per_test: 4,    // number of options offered (generated for color items)
  option_layout: "grid",  // "center" (default: a small ring at fixation) | "row" | "grid" | "circle"
  response_ui: "mouse",   // or "keyboard", with one key per option in choice_keys
  feedback: true,
}
```
Records: `chosen_option`, `correct_option`, `correct`, `rt`. For images or words, give
`stimuli` and the `test_options` (including the correct one). `item_shape: "square"`
draws the color items and options as squares.

A few things to know:

- With `response_ui: "keyboard"`, `choice_keys` map to options by screen position in
  reading order (top row first, then left to right), whatever the `option_layout`. The
  default `["ArrowLeft", "ArrowRight"]` covers two options; give one key per option for
  more.
- `shuffle_options: true` (the default) randomizes the option order. With `false`,
  generated options list the target first, so it is in the same slot on every trial;
  the plugin logs a one-time console note saying so.
- `collect_confidence: true` adds the lab's word confidence picker after the choice.
  `confidence` is recorded as 1..N, where N is the number of `confidence_labels`
  (default 4: Guess, Maybe, Probably, Certain).

### 4.9 wm-pairs: two-color objects (a ring plus an inner dot)
Each item has an outer color and an inner color. One feature of one item is probed;
you pick its color from a row of swatches.

```js
{
  type: jsPsychWmPairs,
  set_size: 3,
  probe_feature: "inner",  // test the "inner" or "outer" color (default "outer")
  feedback: true,
}
```
Records: `reported_color`, `target_color`, `correct`, `rt`. You can also choose item and
feature together with `which_test: [item, 0 or 1]` (0 = outer, 1 = inner). The running
points total shown at the top (`show_points`) carries over from trial to trial for the
whole page.

### 4.10 noise-dots: same/different through visual noise
Two disks built from colored dots, some of them random-colored noise; judge whether the
two are the same color. Answered with the keyboard.

```js
{
  type: jsPsychNoiseDots,
  colors: [40],               // the target color (a degree or CSS color)
  test_color: 210,            // the test disk's color; same as the target = a "same" trial
  noise_level: 0.4,           // 0-1: fraction of dots that are noise (or [target, test])
  response_mode: "binary",    // keys: S = same, D = different | "confidence6" | "two_stage" (the default)
  feedback: true,
}
```
`colors` is a list of candidate target colors, and only `colors[which_test]` is drawn
(`which_test` defaults to 0). `test_color` takes a degree (`210` or `"210"`) or a CSS
color. Records: `said_same`, `was_same`, `correct`, `confidence`, `rt`. `was_same`
compares the colors as drawn, so `210` and its `rgb(...)` value count as the same color.

### 4.11 recognition: have you seen this before? (old/new)
Shows one item and asks old vs. new. (Show your study items in a separate trial or block
beforehand.)

```js
{
  type: jsPsychRecognition,
  stimulus: "stimuli/obj-mug.jpg",  // or a color / degree / word
  is_old: true,                     // the truth, used for scoring
  response_mode: "confidence6",     // "binary" | "confidence6" (1 = sure new ... 6 = sure old)
  response_ui: "buttons",           // "keyboard" (the default: O = old, N = new; keys 1-6 for the scale) | "buttons" | "both"
  feedback: true,
}
```
Records: `said_old` (1/0; ratings 4-6 count as old), `was_old`, `correct`, `confidence`,
`rt`. A wheel degree works as the probe too (`stimulus: 120`).

### 4.12 recall: type what was there
Study items at locations, a delay, one location is highlighted, and the participant
types the answer.

```js
{
  type: jsPsychRecall,
  stimuli: ["7", "3", "9", "2"],  // here, digits at four locations
  item_type: "text",
  which_test: 0,                  // which item to test (0 = the first one listed)
  input_type: "number",           // "text" or "number"
  display_time: 800,
  delay_time: 1000,
}
```
Records: `response` (what they typed), `target`, `correct`, `rt`. Scoring trims spaces
at the ends, treats a run of spaces inside the answer as one space (`"ice  cream"`
matches `"ice cream"`) and ignores case, and when both sides are numbers it compares
them as numbers (`"07"` matches `"7"`). Use `correct_answer` when the expected answer
differs from what was shown (a name for an image, say). Text stimuli are inserted as
HTML, so `"<b>A</b>"` shows a bold A.

### 4.13 spatial-report: report a remembered location
Study items at locations, a delay, then report where the probed item was.

```js
{
  type: jsPsychSpatialReport,
  set_size: 3,
  which_test: 0,
  response_mode: "click",   // "box" (click a placeholder; the default) | "click" (anywhere) | "drag" (drag the probe)
  feedback: true,
}
```
Records: `reported_x`/`reported_y`, `true_x`/`true_y`, `spatial_error` (pixels),
`clicked_position` (in click and drag modes, the placeholder nearest the response),
`rt`. In drag mode `rt` is the time of the drop, so it includes the movement;
`drag_start_rt` is when the participant grabbed the probe.

### 4.14 rsvp: a fast stream at one spot
Shows items one after another at the same location (rapid serial visual presentation).
Items can be colors, degrees, images, or words.

```js
{
  type: jsPsychRsvp,
  stimuli: [0, 72, 144, 216, 288],  // five colors as degrees (or images/words)
  item_type: "color",
  item_duration: 300,               // ms per item, or one value per item: [300, 300, 600, 300, 300]
  isi: 0,                           // blank gap after each item (ms), also a single value or one per item
}
```
Records the stream and the measured on and off time of each item (`actual_stim_timing`,
`actual_isi_timing`). The timing runs on a chain of timers and is not locked to screen
refreshes, so use those measured values rather than the requested ones in your
analysis. With `isi: 0` items follow each other with no blank frame. Add
`response_keys: ["f"]` to log key presses during the stream. Each press in `responses`
records `item` (the item most recently shown) and `during_isi` (true if that item had
already gone and the press fell in the blank gap).

### 4.15 similarity-triad, -quad, -likert: similarity judgments
Three ways to measure how similar items look. Every trial also asks for a confidence
rating (Guess / Maybe / Probably / Certain) right after the choice, so mention it in
your instructions. Give fixed `stimuli`:

```js
// triad: which of the two bottom items is more different from the top one?
{ type: jsPsychSimilarityTriad, stimuli: [20, 60, 210] }   // [reference, bottom-left, bottom-right]

// quad: which pair is more different? [pair1-top, pair1-bottom, pair2-top, pair2-bottom]
{ type: jsPsychSimilarityQuad, stimuli: [20, 40, 200, 300] }

// likert: rate how similar two items are on a 1..rating_points scale
{ type: jsPsychSimilarityLikert, stimuli: [40, 120], rating_points: 7 }
```
`layout: "triangle"` turns the triad into odd-one-out. With `item_shape: "line"` numbers
are drawn as orientations instead of hues, and `"gabor"` / `"grating"` draw them as gray
stripe patterns:

```js
// triad of Gabors: 210 looks the same as 30, so it is recorded (and drawn) as 30
{ type: jsPsychSimilarityTriad, item_shape: "gabor", stimuli: [10, 40, 210], background_color: "#808080" }
```
Records: `response` (triad: 0 = the bottom-left item was picked as more different,
1 = bottom-right), `degrees` (the items as displayed), `period`, the signed offsets
(`item_offsets`), `confidence`, `rt`.

**Adaptive version: let the computer choose the trials.** Instead of fixed `stimuli`,
you can give the plugin an *engine*: a piece of code that, after every answer, picks
the next trial that will teach it the most about how similarity falls off with
distance. You create one engine and pass it to every trial. Here is a complete
adaptive Gabor triad block:

```js
// One engine for the whole session. period: 180 because a Gabor looks the same
// after a half turn. The seed makes the session reproducible; it is saved with the data.
const seed = jsPsych.randomization.randomInt(1, 1000000000);
jsPsych.data.addProperties({ engine_seed: seed });
const engine = BradySimilarity.createEngine({
  period: 180,
  rng: BradySimilarity.seededRng(seed),
});

timeline.push({
  type: jsPsychInstructions,
  pages: ["<p>Three striped patches will appear. Click the bottom patch that looks " +
          "<b>more different</b> from the top one. Then say how sure you are.</p>"],
  show_clickable_nav: true,
});

// 200 trials: the engine picks the angles for each one.
const gaborTriad = {
  type: jsPsychSimilarityTriad,
  engine: engine,
  item_shape: "gabor",
  background_color: "#808080",                       // mid-gray, for full contrast
  grating_options: { cycles: 5, phase: "random" },
  auto_zoom: true,
  data: { phase: "similarity" },
};
timeline.push({ timeline: [gaborTriad], repetitions: 200 });

// Save the engine's summary on the last screen's data row.
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: "<p>That's the end of this part. Thank you!</p>",
  choices: ["Continue"],
  on_finish: (data) => { data.engine_state = JSON.stringify(engine.exportState()); },
});
```

Why 200 trials: in simulations with a model observer, the error of the estimated
similarity curve shrank quickly up to about 150–200 trials and only a little after that
(README.md, "How many trials", has the numbers). The engine's own tests use 220–300.
Each trial is one click plus a confidence click.

Everything the engine learned is also in the trial rows (`degrees` and `response`), so
the `engine_state` column is a convenience. README.md ("Adaptive similarity tasks")
shows how to refit the data afterwards, and API.md documents the engine. The plugin
warns if the engine's period doesn't match `item_shape` (lines, Gabors and gratings
need `period: 180`).

---

## 5. Putting it together: a full experiment

A typical study goes: preload images, go fullscreen, show instructions, run a practice
block, run the main block, thank the participant, save.

```js
const jsPsych = jsPsychModule.initJsPsych({
  show_progress_bar: true,
  on_finish: () => jsPsych.data.displayData(),   // while developing; see §6 to save
});
const timeline = [];

// 1. Preload any image files you use (pure-color tasks need none).
timeline.push({ type: jsPsychPreload, images: ["stimuli/obj-clock.jpg"] });

// 2. Go fullscreen (fewer distractions, consistent sizing).
timeline.push({ type: jsPsychFullscreen, fullscreen_mode: true });

// 3. Instructions (one page per string; participant clicks Next).
timeline.push({
  type: jsPsychInstructions,
  pages: [
    "<h2>Welcome</h2><p>Try to remember the colors.</p>",
    "<p>Then say whether the test item is the <b>same</b> (press S) or " +
      "<b>different</b> (press D).</p>",
  ],
  show_clickable_nav: true,
});

// 4. A reusable block. Feedback on for practice, off for the main trials;
//    `phase` is stored with each trial so you can separate them later.
const makeBlock = (reps, feedback, phase) => ({
  timeline: [{
    type: jsPsychChangeDetection,
    set_size: jsPsych.timelineVariable('set_size'),
    is_change: jsPsych.timelineVariable('is_change'),
    response_ui: "keyboard",   // S = same, D = different
    feedback: feedback,
    data: { phase: phase },
  }],
  timeline_variables: [
    { set_size: 2, is_change: true }, { set_size: 2, is_change: false },
    { set_size: 6, is_change: true }, { set_size: 6, is_change: false },
  ],
  randomize_order: true,
  repetitions: reps,
});

timeline.push(makeBlock(2, true, "practice"));   // practice: 2 × 4 = 8 trials, with feedback
timeline.push({ type: jsPsychHtmlKeyboardResponse,
                stimulus: "<p>Practice done. Press any key to start.</p>" });
timeline.push(makeBlock(10, false, "main"));     // main block: 10 × 4 = 40 trials

// 5. Thank-you screen.
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: "<h2>Thank you!</h2><p>You're done. Click Finish to save your answers.</p>",
  choices: ["Finish"],
});

jsPsych.run(timeline);
```

That's a whole study. `example-experiment.html` in this folder is close to this and
ready to run, so start there and edit it. (On the tutorial web page, the example's full
code is shown below.)

<div id="example-code"></div>

---

## 6. Saving the data

Pick whichever fits how you're running the study. In every case the data are saved in
`on_finish`, which runs after the last trial; end the timeline with a thank-you screen
(like step 5 above) so the participant isn't left looking at a blank page.

**On your own computer (piloting): download a CSV file.** Replace the `on_finish` line
in `initJsPsych` with this. The browser saves `data.csv` to your Downloads folder, and
the page then shows a short message.

```js
const jsPsych = jsPsychModule.initJsPsych({
  show_progress_bar: true,
  on_finish: () => {
    jsPsych.data.get().localSave('csv', 'data.csv');   // goes to your Downloads folder
    jsPsych.getDisplayElement().innerHTML =
      "<p>All done. Your data file has been saved. You can close this tab.</p>";
  },
});
```

To give each participant their own file, put an ID in the name:
`localSave('csv', 'data_' + subjectId + '.csv')`, with `subjectId` from below.

**To your own server:** send the data at the end to a save script on your server
(ask whoever runs your server for its address):

```js
const jsPsych = jsPsychModule.initJsPsych({
  on_finish: () => {
    fetch("save_data.php", {                 // your server's save script
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: subjectId, data: jsPsych.data.get().json() }),
    }).then(() => {
      jsPsych.getDisplayElement().innerHTML = "<p>Saved. Thank you! You can close this tab.</p>";
    });
  },
});
```

**No server (free):** DataPipe saves to OSF. Load `@jspsych-contrib/plugin-pipe` and add
a `jsPsychPipe` trial at the end with your experiment ID (see the DataPipe site).

**Label every row.** Stamp each row with the participant and condition at the start, so
they end up in the saved file:

```js
const subjectId = jsPsych.randomization.randomID(8);   // or an ID from your recruiting site
jsPsych.data.addProperties({ subject: subjectId, condition: "A" });
```

### 6.1 Reading your data

Each row of the file is one trial (including instruction screens; filter on
`trial_type` or your `phase` label). The columns you'll usually analyze:

| Task | Outcome columns | What they mean |
|---|---|---|
| change-detection | `correct`, `said_same`, `was_same`, `rt` | `said_same` 1 = answered "same"; `was_same` = the truth |
| continuous-report (color) | `error`, `reported_degree`, `target_degree`, `rt` | `error` in wheel degrees, −180 to +180 |
| continuous-report (lines, Gabors, gratings) | `orientation_error`, `reported_orientation`, `target_orientation` | `orientation_error` in degrees, −90 to +90 |
| continuous-report (triangles) | the same orientation columns | −180 to +180 |
| recognition | `correct`, `said_old`, `was_old`, `confidence` | `confidence` 1 = sure new … 6 = sure old |
| wm-forced-choice, 2afc-keyboard | `correct`, `chosen_option`, `rt` | |
| similarity plugins | `response` or `rating`, `degrees`, `confidence` | see §4.15 |

Every plugin also saves `rt` (ms from when the answer could be given), a response
duration (`mouse_hold_duration` or `key_hold_duration`: how long the button or key was
held), `stimuli_shown` (everything on screen) and `color_wheel_name`. README.md ("What
gets recorded") describes every shared column, and the "All data fields" view in
`reference.html` lets you search every column of every plugin by name.

**The sign of `error`.** `error` is your answer minus the true color, measured in wheel
steps the short way round, so it runs from −180 to +180. A positive error means the
answer was further along the wheel's numbering than the true color, which on screen
is clockwise from it. Zero is a perfect answer. Orientation errors work the same way:
positive = rotated clockwise from the true angle.

**Columns that look like `[63]`.** In the report plugins (continuous-report,
continuous-image-report, continuous-object-report, color-rotated-object), `error`,
`reported_degree`, `rt` and `mouse_hold_duration` are lists, so in the CSV they appear
with brackets: `[63]`. Missing values appear as the text `null`. To turn them into
numbers:

```r
# R (readr): parse_number drops the brackets; "null" becomes NA (with a warning)
library(readr)
d <- read_csv("data.csv")
d$error <- parse_number(d$error)
# base R alternative:
d$rt <- suppressWarnings(as.numeric(gsub("\\[|\\]", "", d$rt)))
```

```python
# Python (pandas): strip the brackets, then convert; "null" and empty cells become NaN
import pandas as pd
d = pd.read_csv("data.csv")
d["error"] = pd.to_numeric(d["error"].str.strip("[]"), errors="coerce")
```

This works for trials with one response each, which is the default. If you use
`responses_per_item` above 1 or `report: "both"`, a cell can hold several numbers
(`[12,-40]`); read those as lists with `json.loads` in Python or `jsonlite::fromJSON`
in R.

### 6.2 Data quality

The plugins record what you need for the usual exclusions but don't apply any. Things
to check: trials where more than one key was pressed (`multiple_keys_pressed`), very
long response durations (holds over 1000 ms are conventionally dropped), and whether the
items stayed up as long as you asked (`actual_stim_duration` vs. your `display_time`).
`null` means "couldn't be measured", not 0. README.md ("Data quality and exclusions")
has the details and references. The plugins don't detect bots or AI-assisted
responding; add your own checks.

---

## 7. Troubleshooting

First, open the browser's developer console: press F12 (Mac: Cmd+Option+J in Chrome,
Cmd+Option+C in Safari), then click *Console*. Read the first red message.

| What you see | Likely cause | Fix |
|---|---|---|
| Blank page, no red error in the console | `jsPsych.run(timeline)` is missing, or nothing was pushed onto `timeline` | Check the last lines of your `<script>`; compare with §1 |
| `Failed to load resource` / `404 (File not found)` | Your `.html` file isn't in the plugin folder, or a file name is mistyped | Put the file next to `brady-plugins.bundle.js`; check the spelling in the `<script src=...>` line |
| `Unexpected identifier` / `Unexpected token` | A missing comma, bracket or quote, usually on the line *before* the one named | Check that every `label: value` pair ends with a comma and every `{` `[` `(` is closed |
| `jsPsychSomething is not defined` | A typo in the plugin name, or its `<script>` line is missing or below your code | Copy the name from the table in §1; keep the script lines in the order shown there |
| `jsPsychModule is not defined` | jsPsych didn't load from the internet (offline, or a network blocks unpkg.com) | Check your connection; try another network |
| The page goes blank after the last trial | Expected when `on_finish` only saves | End with a thank-you screen and show a message in `on_finish` (§6) |
| Can't open the page at all at `localhost` (connection refused) | The server isn't running, or the port differs | Start it again (§0.3); use the port it printed |
| Your file opens as plain text, or is called `my-study.html.txt` | Windows hid the `.txt` extension | Turn on file name extensions (§0.2) and rename the file |
| Console warning: `which_test is NaN` | `jsPsych.timelineVariable` used inside a function | Use `jsPsych.evaluateTimelineVariable` there (§2, the box under idea 3) |
| Colors work but images are blank, or "tainted canvas" errors | The page was opened as `file://`, or the images aren't in the served folder | Run it through the server (§0.3); keep images in the folder or a subfolder |
| No confetti or no sound | Confetti needs the `canvas-confetti` `<script>` (§1); sounds need `win.mp3`/`lose.mp3` next to the bundle | Add the script; keep the sound files in the folder. Browsers also mute sound until the participant has clicked once |
| An option seems to do nothing | jsPsych silently ignores option names it doesn't recognize, and names are case-sensitive | Check the spelling against `reference.html` (mistyped *values* get a console warning; §3.1) |

When in doubt, compare with the showcase: open `showcase.html`, run the task that's
misbehaving, and copy the options it uses.

---

## 8. Concepts and words

**Task and stimulus words**

- **Color wheel:** a circle of 360 colors that change gradually, numbered 0 to 359.
  A color's "degree" is just its number on the wheel; colors with nearby numbers look
  alike. The default wheel comes from Schurgin, Wixted & Brady (2020).
- **Set size:** how many items are shown at once.
- **Study → delay → test:** the shape of most memory trials. Items are shown (study),
  disappear for a blank interval (delay), then memory is tested.
- **Probe / test item:** the item (or location) asked about at test.
- **Placeholder:** an empty outline marking a location where an item can appear.
- **Pre-cue / retro-cue:** a highlight that marks the location to be tested, shown
  before the items appear (pre-cue) or after they've gone (retro-cue).
- **Change detection:** decide whether the probe is the same as what was there.
- **Delayed estimation / continuous report:** reproduce the remembered value exactly
  (click its color on the wheel) instead of choosing from a few options.
- **N-AFC / 2-AFC (forced choice):** pick the right answer from N (or 2) options.
  A **foil** is a wrong option.
- **Quantized wheel:** a report wheel that offers only some colors (e.g. 12) instead
  of all 360.
- **Target-anchored:** the offered options are spaced around the true answer, so the
  true answer is always one of them.
- **Ensemble report:** report the average of all the items rather than one of them.
- **CIELAB:** a color space designed so that equal distances look roughly equally
  different; the lab's color wheels are circles in it.
- **Gabor / grating:** a patch of soft gray stripes (a grating), optionally faded at
  the edges (a Gabor). **Phase** shifts the stripes sideways; **contrast** is how
  strong the stripes are; the **period** is the turn after which a shape looks the
  same again (180° for stripes and lines, 360° for colors and triangles).
- **TCC (target confusability competition):** the lab's model of memory errors; the
  `error` columns are its input.
- **Response duration (RD):** how long the key or mouse button was held down for the
  answer. It tracks confidence; the data columns are the `*_hold_duration` fields.
- **Adaptive engine:** code that picks each next trial to be the most informative one,
  given the answers so far (§4.15).
- **Similarity judgment:** a trial that asks which items look more alike or more
  different (triad, quad, likert).

**Code and web words**

- HTML file: the experiment; a text file ending in `.html`.
- CDN: a public copy of a code library on the internet, so you don't install anything.
  That's what the `unpkg.com` links are.
- plugin: code for one kind of trial (like change detection).
- trial: one screen or step, written as an object with a `type` plus options.
- timeline: the ordered list of trials to run.
- timeline variable: a value that changes from condition to condition (§2, idea 3).
- parameter / option: one setting of a trial (like `set_size: 4`).
- object `{}` / array `[]` / string `"..."`: a settings bundle, an ordered list, a piece
  of text.
- function `() => ...`: code that runs later, when its value is needed.
- `NaN`: "not a number", what JavaScript gives for impossible arithmetic.
- ms: milliseconds (1000 = 1 second).
- terminal: a window where you type commands (Command Prompt on Windows, Terminal on
  Mac).
- local server / localhost: a small program on your own computer that serves a folder
  to your browser (§0.3).
- console: the browser's error log (open it with F12), your first stop when something
  breaks.
- CSV: a spreadsheet saved as plain text, one row per line, columns separated by
  commas.

---

*Want to write or extend a plugin yourself? See CONVENTIONS.md.*
