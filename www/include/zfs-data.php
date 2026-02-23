<?php
header('Content-Type: application/json');

// Wykonujemy komendę zfs list z opcją -p (wartości w bajtach)
// i -H (bez nagłówka)
// Zwraca: name, used, available
exec("sudo /usr/bin/zfs list -Hp -o name,used,avail 2>&1", $output, $return_var);

if ($return_var !== 0) {
    echo json_encode([
        'error' => 'ZFS command failed',
        'exit_code' => $return_var,
        'message' => implode("\n", $output) // Tutaj zobaczysz konkretny komunikat błędu
    ]);
    exit;
}

$datasets = [];
foreach ($output as $line) {
    $cols = preg_split('/\s+/', $line);
    if (count($cols) >= 3) {
        $datasets[] = [
            'name'  => $cols[0],
            'used'  => (float)$cols[1],
            'avail' => (float)$cols[2]
        ];
    }
}

echo json_encode($datasets);
