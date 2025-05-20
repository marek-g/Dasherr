<?php
header('Content-Type: application/json');

$requestBody = file_get_contents("php://input");
$data = json_decode($requestBody, true);

// Check if required parameters are provided
if (!isset($data['url'], $data['xapikey'])) {
    echo json_encode(["error" => "Missing required parameters"]);
    http_response_code(400);
    exit;
}

$url = rtrim($data['url'], '/');
$xapikey = $data['xapikey'];

// pfSense API endpoints
$endpoints = [
    "interfaceStatus" => "$url/api/v2/status/interfaces?limit=0&offset=0",
    "dns" => "$url/api/v2/system/dns"
];

$results = [];

// Fetch data from each endpoint
foreach ($endpoints as $key => $apiUrl) {
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "x-api-key: $xapikey",
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpCode == 200) {
        $results[$key] = json_decode($response, true)['data'] ?? ["error" => "Invalid JSON response"];
    } else {
        $results[$key] = ["error" => "Failed to fetch $key (HTTP $httpCode, $error)"];
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);