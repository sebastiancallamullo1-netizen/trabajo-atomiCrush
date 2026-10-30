/* ============================================================
   BASE DE DATOS (Supabase)
   Supabase es una base de datos en internet (PostgreSQL) que además
   trae su propio sistema de usuarios (correo + contraseña). El juego
   se conecta directo desde el navegador, sin PHP en el medio.
   Las tablas y funciones se crean con supabase/base_de_datos.sql.
   (La versión anterior con XAMPP, PHP y MySQL quedó en la rama "version-xampp").
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

// Datos del proyecto de Supabase: se copian de Project Settings > API.
// La "anon key" es pública (se puede subir al repo): lo que protege los
// datos son las reglas de seguridad (RLS) que están en el archivo .sql.
const SUPABASE_URL = "PEGAR_ACA_LA_PROJECT_URL";
const SUPABASE_ANON_KEY = "PEGAR_ACA_LA_ANON_KEY";

const configurado = SUPABASE_URL.startsWith("https://");
const supabase = configurado ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const SIN_CONFIGURAR = { ok: false, error: "Falta configurar Supabase en src/baseDeDatos.js." };

// Supabase devuelve los errores en inglés: se traducen los más comunes
function traducirError(error) {
  const mensaje = error?.message || "";
  if (mensaje.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (mensaje.includes("already registered")) return "Ya hay una cuenta con ese correo. Iniciá sesión.";
  if (mensaje.includes("Email not confirmed")) return "Todavía no confirmaste tu correo. Revisá tu bandeja de entrada.";
  if (mensaje.includes("Password should be")) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (mensaje.includes("invalid format") || mensaje.includes("is invalid")) return "El correo no es válido.";
  if (mensaje.includes("Database error saving new user")) return "Ese nickname ya existe. Elegí otro.";
  if (mensaje.includes("Failed to fetch")) return "No se pudo conectar con el servidor. Revisá tu conexión a internet.";
  return mensaje || "Ocurrió un error. Probá de nuevo.";
}

// Arma todo lo que el juego necesita saber de un jugador:
// nickname, nivel máximo, puntajes y estrellas de cada nivel, y álbum
async function datosDelJugador(id) {
  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("nickname, nivel_maximo")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: traducirError(error) };

  const { data: filasPuntajes } = await supabase
    .from("puntajes")
    .select("nivel, puntos, estrellas")
    .eq("usuario_id", id);
  const niveles = {};
  for (const fila of filasPuntajes || []) {
    niveles[fila.nivel] = { puntos: fila.puntos, estrellas: fila.estrellas };
  }

  const { data: filasAlbum } = await supabase.from("album").select("formula").eq("usuario_id", id);

  return {
    ok: true,
    usuarioId: id,
    usuario: perfil.nickname,
    nivelMaximo: perfil.nivel_maximo,
    niveles,
    album: (filasAlbum || []).map((fila) => fila.formula),
  };
}

// Crea una cuenta nueva. Si sale bien, devuelve sus datos (empieza en el nivel 1).
export async function registrarUsuario(nickname, correo, contrasenia) {
  if (!configurado) return SIN_CONFIGURAR;
  if (nickname.length < 3 || nickname.length > 20) {
    return { ok: false, error: "El nickname tiene que tener entre 3 y 20 caracteres." };
  }
  if (contrasenia.length < 6) {
    return { ok: false, error: "La contraseña tiene que tener al menos 6 caracteres." };
  }

  // ¿Ya existe alguien con ese nickname?
  const { data: ocupado } = await supabase.from("perfiles").select("id").eq("nickname", nickname).maybeSingle();
  if (ocupado) return { ok: false, error: "Ese nickname ya existe. Elegí otro." };

  // El nickname viaja como dato extra: la base de datos lo usa para crear el perfil
  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: contrasenia,
    options: { data: { nickname } },
  });
  if (error) return { ok: false, error: traducirError(error) };

  // Si en Supabase está activado "Confirm email", primero hay que confirmar el correo
  if (!data.session) {
    return { ok: false, error: "Te mandamos un correo para confirmar la cuenta. Confirmala y después iniciá sesión." };
  }
  return datosDelJugador(data.user.id);
}

// Revisa correo y contraseña. Si son correctos, devuelve el progreso guardado.
export async function iniciarSesion(correo, contrasenia) {
  if (!configurado) return SIN_CONFIGURAR;
  const { data, error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasenia });
  if (error) return { ok: false, error: traducirError(error) };
  return datosDelJugador(data.user.id);
}

// Si el jugador ya había iniciado sesión en este navegador, Supabase se
// acuerda: devuelve sus datos sin pedir la contraseña de nuevo.
export async function recuperarSesion() {
  if (!configurado) return { ok: false };
  const { data } = await supabase.auth.getSession();
  if (!data.session) return { ok: false };
  return datosDelJugador(data.session.user.id);
}

export async function cerrarSesionBD() {
  if (configurado) await supabase.auth.signOut();
}

// Guarda el nivel máximo, los puntajes de cada nivel y el álbum del jugador.
// La función guardar_progreso (del .sql) solo guarda mejoras.
export async function guardarProgreso(datos) {
  if (!configurado) return SIN_CONFIGURAR;
  const { error } = await supabase.rpc("guardar_progreso", {
    nivel_maximo: datos.nivelMaximo,
    niveles: datos.niveles,
    album: datos.album,
  });
  return error ? { ok: false, error: traducirError(error) } : { ok: true };
}

// Trae los 10 mejores jugadores de la tabla de puntuaciones
export async function cargarRanking() {
  if (!configurado) return [];
  const { data, error } = await supabase.rpc("ranking");
  if (error) return [];
  return data.map((fila) => ({
    usuario: fila.nickname,
    nivelMaximo: fila.nivel_maximo,
    puntosTotales: Number(fila.puntos_totales),
  }));
}
