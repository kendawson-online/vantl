<?php
// cleanup_tmp.php - remove files in server/tmp older than 24 hours
$tmp = __DIR__ . '/tmp';
$ttl = 24 * 60 * 60; // 24 hours
if (!is_dir($tmp)) exit;
foreach (glob($tmp . '/*.json') as $f) {
    if (filemtime($f) < time() - $ttl) @unlink($f);
}
