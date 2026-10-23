<?php
// ============================================================
// INICIO DE SESIÓN: revisa usuario y contraseña
// Recibe: { usuario, contrasenia }
// Devuelve el progreso guardado del jugador si los datos son correctos.
// ============================================================
require "conexion.php";

$datos = leerDatos();
$usuario = trim($datos["usuario"] ?? "");
$contrasenia = $datos["contrasenia"] ?? "";

$consulta = $conexion->prepare("SELECT id, contrasenia FROM usuarios WHERE usuario = ?");
$consulta->bind_param("s", $usuario);
$consulta->execute();
$fila = $consulta->get_result()->fetch_assoc();

// password_verify compara la contraseña escrita con el hash guardado.
// Si el usuario no existe o la contraseña no coincide, se da el mismo
// mensaje, para no avisarle a nadie qué usuarios existen.
if (!$fila || !password_verify($contrasenia, $fila["contrasenia"])) {
    responder(["ok" => false, "error" => "Usuario o contraseña incorrectos."]);
}

responder(datosDelJugador($conexion, (int) $fila["id"]));
