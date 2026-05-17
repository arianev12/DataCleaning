<?php
$distIndex = __DIR__ . '/dist/index.html';

// Dev proxy settings
$devHost = 'http://127.0.0.1:5173';
$forceDev = (getenv('FEDM_DEV') === '1') || isset($_GET['dev']);

// Try to proxy to Vite dev server when available or when forced. This is dev-only convenience.
if (!$forceDev && !function_exists('curl_init')) {
  // If curl isn't available, we cannot proxy; fall through to serving dist or instructions.
  $devAvailable = false;
} elseif ($forceDev) {
  $devAvailable = true;
} else {
  // Quick HEAD check to see if dev server is running
  $ch = curl_init($devHost . '/index.html');
  curl_setopt($ch, CURLOPT_NOBODY, true);
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, 500);
  curl_setopt($ch, CURLOPT_TIMEOUT_MS, 500);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $devAvailable = ($httpCode >= 200 && $httpCode < 500);
}

if ($devAvailable) {
  if (!function_exists('curl_init')) {
    // curl required for proxying
    header('Content-Type: text/plain; charset=utf-8', true, 500);
    echo "PHP cURL extension required for dev proxying.\n";
    exit;
  }

  $requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
  $url = rtrim($devHost, '/') . $requestUri;

  $ch = curl_init($url);
  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

  // Forward request body for non-GET requests
  if ($method !== 'GET' && $method !== 'HEAD') {
    $body = file_get_contents('php://input');
    if ($body !== false && $body !== '') {
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
  }

  // Forward selected headers
  if (function_exists('getallheaders')) {
    $outHeaders = [];
    foreach (getallheaders() as $k => $v) {
      if (strtolower($k) === 'host') continue;
      $outHeaders[] = $k . ': ' . $v;
    }
    if (!empty($outHeaders)) curl_setopt($ch, CURLOPT_HTTPHEADER, $outHeaders);
  }

  curl_setopt($ch, CURLOPT_HEADER, true);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
  curl_setopt($ch, CURLOPT_TIMEOUT_MS, 2000);
  $resp = curl_exec($ch);
  if ($resp === false) {
    curl_close($ch);
    // If proxy failed, fall through to serve dist or instructions below
  } else {
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE) ?: 200;
    $rawHeaders = substr($resp, 0, $headerSize);
    $body = substr($resp, $headerSize);
    curl_close($ch);

    http_response_code($status);
    // Send headers from dev server response (skip HTTP/1.x status lines)
    $lines = preg_split('/\r?\n/', $rawHeaders);
    foreach ($lines as $line) {
      if (stripos($line, 'HTTP/') === 0) continue;
      if (trim($line) === '') continue;
      header($line, false);
    }

    echo $body;
    exit;
  }
}

// Serve built files or instructions when dev proxy isn't used
if (file_exists($distIndex)) {
  $html = file_get_contents($distIndex);

  // Determine the script base (e.g. /fedm when index.php lives at /fedm/index.php)
  $scriptName = isset($_SERVER['SCRIPT_NAME']) ? str_replace('\\', '/', $_SERVER['SCRIPT_NAME']) : '';
  $base = rtrim(dirname($scriptName), '/');
  $basePrefix = ($base === '' || $base === '.') ? '' : $base;

  // dist will live under the PHP folder. Build assets are in dist/assets and dist/favicon.
  $distPrefix = ($basePrefix === '') ? '/dist' : $basePrefix . '/dist';

  // Replace common absolute paths emitted by Vite to point at the dist folder relative to this PHP entry
  $html = str_replace('"/assets/', '"' . $distPrefix . '/assets/', $html);
  $html = str_replace("'/assets/", "'" . $distPrefix . '/assets/', $html);
  $html = str_replace('"/favicon', '"' . $distPrefix . '/favicon', $html);
  $html = str_replace("'/favicon", "'" . $distPrefix . '/favicon', $html);

  if ($basePrefix !== '') {
    $html = str_replace('"' . $basePrefix . '/assets/', '"' . $distPrefix . '/assets/', $html);
    $html = str_replace("'" . $basePrefix . '/assets/', "'" . $distPrefix . '/assets/', $html);
    $html = str_replace('"' . $basePrefix . '/favicon', '"' . $distPrefix . '/favicon', $html);
    $html = str_replace("'" . $basePrefix . '/favicon', "'" . $distPrefix . '/favicon', $html);
  }

  // Ensure the <base> tag (if exists) uses the current folder so relative URLs resolve
  if (stripos($html, '<base') !== false) {
    $baseHref = ($basePrefix === '') ? '/' : $basePrefix . '/';
    $html = preg_replace('/<base[^>]*>/i', '<base href="' . $baseHref . '">', $html, 1);
  }

  echo $html;
  exit;
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FEDM — Not built</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:2rem}</style>
  </head>
  <body>
    <h1>FEDM — Not built</h1>
    <p>The frontend assets haven't been built yet. To serve this app via Apache/PHP follow these steps:</p>
    <ol>
      <li>Install Node.js (includes `npm`) if you don't have it.</li>
      <li>From the project root (`c:\xampp\htdocs\fedm`) run:</li>
      <pre>npm install
npm run build -- --base /fedm/</pre>
      <li>After the build completes, reload this page at <a href="/fedm/">/fedm/</a>.</li>
    </ol>
    <p>If you prefer Vite dev server for development, run:</p>
    <pre>npm install
npm run dev</pre>
  </body>
</html>
