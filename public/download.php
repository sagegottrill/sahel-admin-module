<?php
// download.php
// Proxies file downloads to bypass CORS issues on localhost and ensure correct headers.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadDir = 'uploads/';

if (isset($_GET['file'])) {
    // Security: Only allow filenames, no paths
    $filename = basename($_GET['file']);
    $filepath = $uploadDir . $filename;

    if (file_exists($filepath)) {
        // Detect MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filepath);
        finfo_close($finfo);

        // Set headers
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filepath));

        // Output file
        readfile($filepath);
        exit;
    } else {
        http_response_code(404);
        echo "File not found: " . htmlspecialchars($filename);
    }
} else {
    http_response_code(400);
    echo "No file specified.";
}
?>