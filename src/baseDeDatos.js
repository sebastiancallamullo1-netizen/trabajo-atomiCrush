/* ============================================================
   BASE DE DATOS (XAMPP: Apache + PHP + MySQL)
   El juego no se conecta directo a MySQL: le hace pedidos (fetch)
   a los archivos PHP de la carpeta "api", que corren en el Apache
   de XAMPP. Esos PHP leen y escriben en MySQL (se ve en phpMyAdmin).
   ============================================================ */

// Dónde están los PHP: la carpeta "api" copiada en htdocs/atomicrush
const URL_API = "http://localhost/atomicrush";

// Manda un pedido a un archivo PHP y devuelve su respuesta.
// Si el servidor no responde (XAMPP apagado), devuelve un error claro.
async function llamar(archivo, datos) {
  try {
    const respuesta = await fetch(`${URL_API}/${archivo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    return await respuesta.json();
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. ¿Están prendidos Apache y MySQL en XAMPP?" };
  }
}

// Crea un usuario nuevo. Si sale bien, devuelve sus datos (empieza en el nivel 1).
export function registrarUsuario(usuario, contrasenia) {
  return llamar("registro.php", { usuario, contrasenia });
}

// Revisa usuario y contraseña. Si son correctos, devuelve el progreso guardado.
export function iniciarSesion(usuario, contrasenia) {
  return llamar("login.php", { usuario, contrasenia });
}

// Guarda el nivel máximo, los puntajes de cada nivel y el álbum del jugador
export function guardarProgreso(usuarioId, datos) {
  return llamar("guardar_progreso.php", { usuarioId, ...datos });
}

// Trae los 10 mejores jugadores de la tabla de puntuaciones
export async function cargarRanking() {
  const respuesta = await llamar("ranking.php", {});
  return respuesta.ok ? respuesta.ranking : [];
}
