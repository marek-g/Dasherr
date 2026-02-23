// Skrypt jest potrzebny do sprawdzania dostepności danej strony (URL).
// Nie da się tego zrobić w czystym JavaScript, ponieważ przeglądarki
// ze względów bezpieczeństwa blokują zapytania do innych domen.

<?php
$ALLOWED_PROTOCOLS = CURLPROTO_HTTP | CURLPROTO_HTTPS;
$TIMEOUT = 5; // 5 sekund wystarczy na sprawdzenie dostępności

if (!empty($_POST['url'])) {
    $url = $_POST['url'];
    $request = curl_init($url);

    curl_setopt($request, CURLOPT_PROTOCOLS, $ALLOWED_PROTOCOLS);
    curl_setopt($request, CURLOPT_CONNECTTIMEOUT, $TIMEOUT);
    curl_setopt($request, CURLOPT_TIMEOUT, $TIMEOUT);
    curl_setopt($request, CURLOPT_FOLLOWLOCATION, true);

    // Pobierz tylko nagłówki, nie ściągaj całej treści strony
    curl_setopt($request, CURLOPT_NOBODY, true); 
    
    // Opcjonalnie: Ignoruj błędy certyfikatu SSL (przydatne przy domowych serwerach)
    curl_setopt($request, CURLOPT_SSL_VERIFYPEER, false);

    curl_exec($request);
    $status_code = curl_getinfo($request, CURLINFO_HTTP_CODE);

    if (curl_errno($request)) {
        $status_code = 502; // Błąd połączenia
    }

    curl_close($request);
    http_response_code($status_code);
}
?>
