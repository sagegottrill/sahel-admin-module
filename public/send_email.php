<?php
// Prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['to']) || empty($input['subject']) || empty($input['message'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

$to = $input['to'];
$subject = $input['subject'];
$message = $input['message'];
$attachment = isset($input['attachment']) ? $input['attachment'] : null; // Expects {name: 'filename.pdf', data: 'base64string'}

// Boundary for multipart
$boundary = md5(time());

// Headers
$headers = "MIME-Version: 1.0" . "\r\n";
$fromName = getenv('EMAIL_FROM_NAME') ?: 'Sahel Resilience Stack';
$fromEmail = getenv('EMAIL_FROM_EMAIL') ?: 'noreply@example.invalid';
$headers .= "From: {$fromName} <{$fromEmail}>" . "\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"" . "\r\n";

// Multipart Body
$body = "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $message . "\r\n\r\n";

// Attachment
if ($attachment && !empty($attachment['data']) && !empty($attachment['name'])) {
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: application/pdf; name=\"" . $attachment['name'] . "\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"" . $attachment['name'] . "\"\r\n\r\n";
    $body .= chunk_split($attachment['data']) . "\r\n";
}

$body .= "--$boundary--";

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['status' => 'success', 'message' => 'Email sent successfully']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to send email']);
}
?>