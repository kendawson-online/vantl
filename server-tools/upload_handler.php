<?php
// upload_handler.php
// Accepts multipart form upload or url param, delegates to convert.php by including it,
// captures JSON output, saves it to server/tmp and redirects to done.php

$tmpDir = __DIR__ . '/tmp';
if (!is_dir($tmpDir)) {
    @mkdir($tmpDir, 0755, true);
}

function sendFailure($msg) {
    echo '<p>Error: ' . htmlspecialchars($msg) . '</p>';
    echo '<p><a href="upload.html">Back to upload</a></p>';
    exit;
}

// We want to re-use convert.php's logic. We'll include it and capture output.
$haveInput = false;
if (!empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) $haveInput = true;
if (!empty($_POST['url'])) $haveInput = true;
if (!$haveInput) sendFailure('No file or URL provided.');

// Capture original superglobals so we can restore later
$origFiles = $_FILES;
$origPost = $_POST;
$origGet = $_GET;

// Keep $_FILES and $_POST as-is (form submitted directly to this script).
// Include convert.php and capture its output
ob_start();
include __DIR__ . '/convert.php';
$json = ob_get_clean();

// restore superglobals
$_FILES = $origFiles;
$_POST = $origPost;
$_GET = $origGet;

if (!$json) sendFailure('Conversion produced no output.');

$decoded = json_decode($json, true);
if ($decoded === null) {
    // show raw output for debugging
    sendFailure('Conversion did not return valid JSON. Output:<pre>' . htmlspecialchars($json) . '</pre>');
}

// Save JSON to tmp dir with unique name
$fname = 'timeline_' . gmdate('Ymd_His') . '_' . bin2hex(random_bytes(6)) . '.json';
$path = $tmpDir . '/' . $fname;
if (file_put_contents($path, $json) === false) {
    sendFailure('Failed to write JSON to server.');
}

// Redirect to done page
header('Location: done.php?file=' . urlencode($fname));
exit;
