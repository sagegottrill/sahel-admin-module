<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuration
$uploadDir = 'uploads/';
$maxSize = 100 * 1024 * 1024; // 100MB

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileSize = $file['size'];
        $fileError = $file['error'];

        // Check for errors
        if ($fileError === 0) {
            // Check file size
            if ($fileSize <= $maxSize) {
                // Get file extension
                $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

                // Secure MIME type check
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $fileTmpName);
                finfo_close($finfo);

                // If no extension (compressed images), derive from MIME type
                if (empty($fileExt)) {
                    $mimeToExt = [
                        'application/pdf' => 'pdf',
                        'image/jpeg' => 'jpg',
                        'image/png' => 'png'
                    ];
                    $fileExt = isset($mimeToExt[$mimeType]) ? $mimeToExt[$mimeType] : '';
                }

                $allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
                $allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

                if (in_array($fileExt, $allowedExts) && in_array($mimeType, $allowedMimeTypes)) {
                    // Generate unique name
                    $nameWithoutExt = pathinfo($fileName, PATHINFO_FILENAME);
                    $cleanName = preg_replace('/[^a-zA-Z0-9._-]/', '', $nameWithoutExt);
                    if (empty($cleanName)) {
                        $cleanName = 'file';
                    }
                    $newFileName = time() . '_' . uniqid() . '_' . $cleanName . '.' . $fileExt;
                    $destination = $uploadDir . $newFileName;

                    if (move_uploaded_file($fileTmpName, $destination)) {
                        // Success
                        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
                        $host = $_SERVER['HTTP_HOST'];
                        $path = dirname($_SERVER['REQUEST_URI']);
                        if ($path == '/' || $path == '\\')
                            $path = '';

                        $fileUrl = "$protocol://$host$path/$destination";

                        echo json_encode([
                            'success' => true,
                            'message' => 'File uploaded successfully',
                            'url' => $fileUrl,
                            'path' => $destination
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid file type. Only PDF, JPG, and PNG are allowed.',
                        'received_type' => $mimeType,
                        'received_ext' => $fileExt
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'File is too large. Max limit is 100MB.']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Error uploading file. Code: ' . $fileError]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file received.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
?>