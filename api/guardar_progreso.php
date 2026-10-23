<?php
// ============================================================
// GUARDAR PROGRESO del jugador
// Recibe: { usuarioId, nivelMaximo, niveles: { "1": { puntos, estrellas } }, album: ["H2O", ...] }
// Solo guarda mejoras: nunca baja un puntaje ni el nivel alcanzado.
// ============================================================
require "conexion.php";

$datos = leerDatos();
$id = (int) ($datos["usuarioId"] ?? 0);
if ($id <= 0) {
    responder(["ok" => false, "error" => "Falta el usuario."]);
}

// Nivel máximo: GREATEST se queda con el mayor entre el guardado y el nuevo
$nivelMaximo = (int) ($datos["nivelMaximo"] ?? 1);
$consulta = $conexion->prepare("UPDATE usuarios SET nivel_maximo = GREATEST(nivel_maximo, ?) WHERE id = ?");
$consulta->bind_param("ii", $nivelMaximo, $id);
$consulta->execute();

// Tabla de puntuaciones: si el jugador ya tenía ese nivel, se actualiza
// solo si mejoró (ON DUPLICATE KEY UPDATE + GREATEST)
$consulta = $conexion->prepare(
    "INSERT INTO puntajes (usuario_id, nivel, puntos, estrellas) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE puntos = GREATEST(puntos, VALUES(puntos)), estrellas = GREATEST(estrellas, VALUES(estrellas))"
);
foreach (($datos["niveles"] ?? []) as $nivel => $resultado) {
    $nivel = (int) $nivel;
    $puntos = (int) ($resultado["puntos"] ?? 0);
    $estrellas = (int) ($resultado["estrellas"] ?? 0);
    $consulta->bind_param("iiii", $id, $nivel, $puntos, $estrellas);
    $consulta->execute();
}

// Álbum: INSERT IGNORE no hace nada si la molécula ya estaba guardada
$consulta = $conexion->prepare("INSERT IGNORE INTO album (usuario_id, formula) VALUES (?, ?)");
foreach (($datos["album"] ?? []) as $formula) {
    $consulta->bind_param("is", $id, $formula);
    $consulta->execute();
}

responder(["ok" => true]);
