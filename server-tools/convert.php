<?php
// convert.php
// Simple endpoint to convert CSV / Excel / Google Sheets into timeline JSON
// Usage:
//  - POST file upload: field name `file` (CSV or XLS/XLSX)
//  - GET/POST with `url` pointing to a CSV or Google Sheets URL
//  - Optional POST/GET metadata fields: timelineName, layoutMode, visibleItems, minWidth, maxWidth, nodeColor, lineColor, navColor, lastupdated
// Output: JSON matching the app's expected format including `lastupdated` timestamp

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// If Composer autoload is available (project root or server/), load it so PhpSpreadsheet is usable.
$possibleAutoloads = [__DIR__ . '/vendor/autoload.php', __DIR__ . '/../vendor/autoload.php'];
foreach ($possibleAutoloads as $a) {
    if (file_exists($a)) {
        require_once $a;
        break;
    }
}
function sendError($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

// Helper: read POST/GET value
function getParam($k) {
    if (isset($_POST[$k])) return $_POST[$k];
    if (isset($_GET[$k])) return $_GET[$k];
    return null;
}

// Helper: fetch remote content
function fetchUrl($url) {
    $opts = [
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: vjs-timeline-converter/1.0\r\n"
        ]
    ];
    $context = stream_context_create($opts);
    return @file_get_contents($url, false, $context);
}

// Convert Google Sheets URL -> CSV export URL (if public)
function googleSheetsToCsv($url) {
    // Accept forms like https://docs.google.com/spreadsheets/d/{id}/edit#gid={gid}
    if (preg_match('#https?://docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)#', $url, $m)) {
        $id = $m[1];
        $gid = null;
        if (preg_match('/[\?&]gid=(\d+)/', $url, $g)) $gid = $g[1];
        $csvUrl = 'https://docs.google.com/spreadsheets/d/' . $id . '/export?format=csv';
        if ($gid) $csvUrl .= '&gid=' . $gid;
        return $csvUrl;
    }
    return $url;
}

// Parse CSV content into array of associative rows
function parseCsvString($csvStr) {
    $rows = array_map('trim', explode("\n", str_replace(["\r\n","\r"], "\n", $csvStr)));
    $data = [];
    $headers = [];
    foreach ($rows as $i => $row) {
        if ($row === '') continue;
        $cells = str_getcsv($row);
        if ($i === 0) {
            // normalize header names
            foreach ($cells as $h) $headers[] = strtolower(trim($h));
            continue;
        }
        $obj = [];
        foreach ($cells as $j => $cell) {
            $key = isset($headers[$j]) ? $headers[$j] : 'column_' . $j;
            $obj[$key] = $cell;
        }
        $data[] = $obj;
    }
    return $data;
}

// Convert spreadsheet rows (assoc array) into timeline `nodes` format
function rowsToNodes($rows) {
    $nodes = [];
    $autoId = 1;
    foreach ($rows as $r) {
        $node = [];
        // map common fields
        if (isset($r['id']) && trim($r['id']) !== '') $node['id'] = is_numeric($r['id']) ? (int)$r['id'] : $r['id'];
        else $node['id'] = $autoId++;
        if (isset($r['title'])) $node['title'] = $r['title'];
        if (isset($r['content'])) $node['content'] = $r['content'];
        if (isset($r['image'])) $node['image'] = $r['image'];
        // allow optional html field
        if (isset($r['html'])) $node['html'] = $r['html'];
        $nodes[] = $node;
    }
    return $nodes;
}

// Main logic: determine source
$inputUrl = getParam('url');
$uploaded = isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK;

if (!$inputUrl && !$uploaded) {
    sendError('No input provided. POST a file (field `file`) or provide `url` parameter.');
}

$content = null;
$filename = null;

if ($uploaded) {
    $tmp = $_FILES['file']['tmp_name'];
    $filename = $_FILES['file']['name'];
    $content = @file_get_contents($tmp);
    if ($content === false) sendError('Failed to read uploaded file', 500);
} else {
    // if Google Sheets URL, convert to CSV export
    $inputUrl = googleSheetsToCsv($inputUrl);
    $content = fetchUrl($inputUrl);
    if ($content === false) sendError('Failed to fetch URL: ' . $inputUrl, 500);
    $filename = basename(parse_url($inputUrl, PHP_URL_PATH));
}

// Determine type by filename extension or content heuristics
$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

$rows = [];
if (in_array($ext, ['csv','txt']) || strpos($content, ',') !== false) {
    // CSV
    $rows = parseCsvString($content);
} elseif (in_array($ext, ['xls','xlsx'])) {
    // Excel - attempt to use PhpSpreadsheet
    if (!class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
        sendError('Excel support requires phpoffice/phpspreadsheet. Install via Composer and enable autoload.', 500);
    }
    try {
        $tmpfile = tempnam(sys_get_temp_dir(), 'vjs_sp');
        file_put_contents($tmpfile, $content);
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmpfile);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();
        $header = [];
        for ($r = 1; $r <= $highestRow; $r++) {
            $row = [];
            $cells = $sheet->rangeToArray('A' . $r . ':' . $highestColumn . $r, NULL, TRUE, FALSE);
            $cells = $cells[0];
            if ($r === 1) {
                foreach ($cells as $c) $header[] = strtolower(trim($c));
                continue;
            }
            foreach ($cells as $j => $c) {
                $key = isset($header[$j]) ? $header[$j] : 'col_' . $j;
                $row[$key] = $c;
            }
            $rows[] = $row;
        }
        @unlink($tmpfile);
    } catch (Exception $e) {
        sendError('Failed to parse Excel file: ' . $e->getMessage(), 500);
    }
} else {
    // Fallback: try CSV parse
    $rows = parseCsvString($content);
}

$nodes = rowsToNodes($rows);

// Build metadata from params
$metaKeys = ['timelineName','layoutMode','visibleItems','minWidth','maxWidth','nodeColor','lineColor','navColor','lastupdated'];
$meta = [];
foreach ($metaKeys as $k) {
    $v = getParam($k);
    if ($v !== null) $meta[$k] = $v;
}

if (!isset($meta['lastupdated']) || trim($meta['lastupdated']) === '') {
    $meta['lastupdated'] = gmdate('c');
}

$output = array_merge($meta, ['nodes' => $nodes]);

echo json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
