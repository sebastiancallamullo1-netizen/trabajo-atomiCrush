<?php
// ============================================================
// CONEXIÓN A LA BASE DE DATOS
// Todos los demás archivos .php empiezan con require "conexion.php".
// ============================================================

// El juego corre en otra dirección (localhost:5173) que el servidor
// (localhost), así que hay que permitirle hacer pedidos (CORS).
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// Antes de cada pedido el navegador manda uno de prueba (OPTIONS): se responde vacío
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit;
}

// Datos de MySQL de XAMPP (por defecto el usuario es root y no tiene contraseña)
$servidor = "localhost";
$usuarioBD = "root";
$contraseniaBD = "";
$nombreBD = "atomicrush";

// Que los errores de MySQL se puedan atrapar con try/catch
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conexion = new mysqli($servidor, $usuarioBD, $contraseniaBD, $nombreBD);
    $conexion->set_charset("utf8mb4");
} catch (mysqli_sql_exception $e) {
    responder(["ok" => false, "error" => "No se pudo conectar a la base de datos. ¿Está prendido MySQL en XAMPP y se importó base_de_datos.sql?"]);
}

// Lee los datos que manda el juego (vienen en formato JSON)
function leerDatos() {
    $datos = json_decode(file_get_contents("php://input"), true);
    return is_array($datos) ? $datos : [];
}

// Devuelve una respuesta en JSON al juego y termina
function responder($respuesta) {
    echo json_encode($respuesta);
    exit;
}

// Arma todo lo que el juego necesita saber de un jugador:
// nivel máximo, puntajes y estrellas de cada nivel, y álbum
function datosDelJugador($conexion, $id) {
    $consulta = $conexion->prepare("SELECT usuario, nivel_maximo FROM usuarios WHERE id = ?");
    $consulta->bind_param("i", $id);
    $consulta->execute();
    $jugador = $consulta->get_result()->fetch_assoc();

    $niveles = [];
    $consulta = $conexion->prepare("SELECT nivel, puntos, estrellas FROM puntajes WHERE usuario_id = ?");
    $consulta->bind_param("i", $id);
    $consulta->execute();
    $resultado = $consulta->get_result();
    while ($fila = $resultado->fetch_assoc()) {
        $niveles[$fila["nivel"]] = ["puntos" => (int) $fila["puntos"], "estrellas" => (int) $fila["estrellas"]];
    }

    $album = [];
    $consulta = $conexion->prepare("SELECT formula FROM album WHERE usuario_id = ?");
    $consulta->bind_param("i", $id);
    $consulta->execute();
    $resultado = $consulta->get_result();
    while ($fila = $resultado->fetch_assoc()) {
        $album[] = $fila["formula"];
    }

    return [
        "ok" => true,
        "usuarioId" => $id,
        "usuario" => $jugador["usuario"],
        "nivelMaximo" => (int) $jugador["nivel_maximo"],
        // (object) para que un jugador sin niveles mande {} y no []
        "niveles" => (object) $niveles,
        "album" => $album,
    ];
}
