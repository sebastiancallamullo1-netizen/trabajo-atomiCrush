<?php
// ============================================================
// REGISTRO: crea un usuario nuevo con su contraseña
// Recibe: { usuario, contrasenia }
// ============================================================
require "conexion.php";

$datos = leerDatos();
$usuario = trim($datos["usuario"] ?? "");
$contrasenia = $datos["contrasenia"] ?? "";

// Validaciones
if (strlen($usuario) < 3 || strlen($usuario) > 20) {
    responder(["ok" => false, "error" => "El usuario tiene que tener entre 3 y 20 caracteres."]);
}
if (strlen($contrasenia) < 4) {
    responder(["ok" => false, "error" => "La contraseña tiene que tener al menos 4 caracteres."]);
}

// ¿Ya existe alguien con ese nombre?
$consulta = $conexion->prepare("SELECT id FROM usuarios WHERE usuario = ?");
$consulta->bind_param("s", $usuario);
$consulta->execute();
if ($consulta->get_result()->num_rows > 0) {
    responder(["ok" => false, "error" => "Ese usuario ya existe. Elegí otro o iniciá sesión."]);
}

// La contraseña se guarda "hasheada": aunque alguien vea la tabla en
// phpMyAdmin, no puede saber cuál es la contraseña original.
$hash = password_hash($contrasenia, PASSWORD_DEFAULT);

$consulta = $conexion->prepare("INSERT INTO usuarios (usuario, contrasenia) VALUES (?, ?)");
$consulta->bind_param("ss", $usuario, $hash);
$consulta->execute();

responder(datosDelJugador($conexion, $conexion->insert_id));
