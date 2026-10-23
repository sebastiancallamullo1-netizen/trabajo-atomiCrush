<?php
// ============================================================
// RANKING: los 10 mejores jugadores
// El puntaje total de cada jugador es la suma de su mejor puntaje
// en cada nivel (así repetir un nivel no infla el puntaje).
// ============================================================
require "conexion.php";

$resultado = $conexion->query(
    "SELECT u.usuario, u.nivel_maximo, SUM(p.puntos) AS total
     FROM usuarios u
     JOIN puntajes p ON p.usuario_id = u.id
     GROUP BY u.id
     ORDER BY total DESC
     LIMIT 10"
);

$ranking = [];
while ($fila = $resultado->fetch_assoc()) {
    $ranking[] = [
        "usuario" => $fila["usuario"],
        "nivelMaximo" => (int) $fila["nivel_maximo"],
        "puntosTotales" => (int) $fila["total"],
    ];
}

responder(["ok" => true, "ranking" => $ranking]);
