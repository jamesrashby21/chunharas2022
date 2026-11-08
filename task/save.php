<?php
/*
 * save.php -- stores one participant's data file.
 * Adapted from the save.php used for earlier experiments (Turk/rickardlab template).
 *
 * Where data end up (same layout as before, relative to THIS file's folder):
 *     data/{experimenter}/{experimentName}/{id}.txt       (experimenter is optional)
 * For study 26BR00 the page sends experimenter = "" and experimentName = "26BR00",
 * so each participant is saved as   data/26BR00/{id}.txt
 * (a ?test=1 run is saved under     data/26BR00_test/{id}.txt).
 * If an id already exists, a unique suffix is added:  {id}_{uniqid}.txt  (nothing is overwritten).
 *
 * Setup on the server (once):
 *   1. Put this file in the same folder as chunharas2022.html (the page posts to "save.php").
 *   2. Create the empty folder  data  next to it and let the web server write to it:
 *          mkdir data && chmod 777 data
 *      (or: chown www-data data).  Do NOT create the 26BR00 subfolder yourself -- PHP creates it,
 *      so it is owned by the web server and writable.  PHP needs to be enabled in Apache.
 *   3. The first save also writes data/.htaccess ("Require all denied") so the files cannot be downloaded
 *      through the web.  Fetch the data over SFTP/scp.  If Apache ignores .htaccess (AllowOverride None),
 *      protect data/ in the Apache config instead.  Test: open https://.../data/26BR00/<id>.txt in a
 *      browser -- it should say 403 Forbidden.
 *
 * Differences from the old script (all for safety):
 *   - POST only; id / experimenter are restricted to letters, digits, "_" and "-" (the old script
 *     would let anyone write outside the data folder with "../" in experimentName);
 *   - experimentName must be one of the names allowed below;
 *   - the payload must be valid JSON and at most 5 MB;
 *   - no "Access-Control-Allow-Origin: *": the page and this script are on the same server,
 *     so the browser does not need it. Add the header back only if the page is ever hosted elsewhere.
 */

header('Content-Type: text/plain; charset=utf-8');

$ALLOWED_EXPERIMENT_NAMES = array("26BR00", "26BR00_test");
$MAX_BYTES = 5 * 1024 * 1024;

function fail($code, $msg) {
    http_response_code($code);
    print_r($msg . "\n");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, "POST only");

// get posted data
$id             = isset($_POST['id'])             ? $_POST['id']             : '';
$experimenter   = isset($_POST['experimenter'])   ? $_POST['experimenter']   : '';
$experimentName = isset($_POST['experimentName']) ? $_POST['experimentName'] : '';
$curData        = isset($_POST['curData'])        ? $_POST['curData']        : '';

// validate
if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) fail(400, "bad id");
if ($experimenter !== '' && !preg_match('/^[A-Za-z0-9_-]{1,64}$/', $experimenter)) fail(400, "bad experimenter");
if (!in_array($experimentName, $ALLOWED_EXPERIMENT_NAMES, true)) fail(400, "bad experimentName");
if ($curData === '' || strlen($curData) > $MAX_BYTES) fail(400, "empty or too large");
json_decode($curData);
if (json_last_error() !== JSON_ERROR_NONE) fail(400, "data is not valid JSON");

// setup directories:  data/{experimenter}/{experimentName}/
$dataRoot = __DIR__ . "/data";
if (!is_dir($dataRoot)) fail(500, "data folder missing (create it next to save.php and make it writable)");
$dataDir = $dataRoot . "/" . $experimenter . "/" . $experimentName . "/";
$dataDir = str_replace("//", "/", $dataDir);   // if experimenter isn't provided, get rid of the extra "/"

// keep the data out of reach of the web
$htaccess = $dataRoot . "/.htaccess";
if (!file_exists($htaccess)) @file_put_contents($htaccess, "Require all denied\n");

// create directory if needed:
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) fail(500, "could not create folder");
}

// create the file; if the id already exists, make a unique name instead of overwriting.
// fopen mode 'x' fails if the file exists, so two simultaneous saves cannot clobber each other.
$fileName = $dataDir . $id . ".txt";
$tries = 0;
while (($fh = @fopen($fileName, 'x')) === false) {
    if (++$tries > 5) fail(500, "could not create file");
    $fileName = $dataDir . $id . "_" . uniqid() . ".txt";
}

// save file:
$ok = (fwrite($fh, $curData) === strlen($curData));
fclose($fh);
if (!$ok) { @unlink($fileName); fail(500, "could not write file"); }
@chmod($fileName, 0666);   // as before: lab users can read/delete it over SFTP

print_r("Success saving data!\n");
print_r("fileName: " . basename($fileName) . "\n");
exit();
?>
