<?php
// done.php - shows preview and download link for converted JSON
$tmpDir = __DIR__ . '/tmp';
$file = isset($_GET['file']) ? basename($_GET['file']) : '';
$path = $tmpDir . '/' . $file;
if (!$file || !file_exists($path)) {
    http_response_code(404);
    echo '<p>File not found.</p><p><a href="upload.html">Go back to upload</a></p>';
    exit;
}

$json = file_get_contents($path);
$data = json_decode($json, true);
?><!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Conversion Done</title>
<style>body{font-family:Arial,Helvetica,sans-serif;margin:20px}pre{background:#f6f8fa;padding:12px;border:1px solid #ddd;overflow:auto}</style>
</head><body>
  <h1>Conversion Successful</h1>
  <p>Your spreadsheet was converted to JSON and saved temporarily on the server.</p>
  <p><strong>Download:</strong> <a href="tmp/<?php echo urlencode($file); ?>"><?php echo htmlspecialchars($file); ?></a></p>
  <p><strong>Preview:</strong></p>
  <pre><?php echo htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)); ?></pre>

  <h2>Next steps</h2>
  <ol>
    <li>Add the timeline CSS/JS to your HTML (cdnjs/jsdelivr/unpkg) — see README for exact links.</li>
    <li>Download this JSON file and place it where your HTML can reach it.</li>
    <li>Use the `data-json-config` attribute or call the timeline loader to point to this JSON file.</li>
    <li>Upload any images referenced by your sheet to your web server (optional).</li>
    <li>Reload your page to view the timeline.</li>
  </ol>

  <p>Note: Temporary files are automatically removed after 24 hours.</p>
  <p><a href="upload.html">Convert another file</a></p>
  <p><a href="README.md">Server README</a> • <a href="../readme.md">Project README</a></p>
</body></html>
