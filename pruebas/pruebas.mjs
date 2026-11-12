/* ============================================================
   PRUEBAS DE ATOMICRUSH (beta test)
   Se corren con:  npm test
   Prueban contra la base de datos real (Supabase):
   registro, inicio de sesión, guardado de progreso, permisos,
   inyección SQL, trampas en el puntaje y filtro de palabras.
   Las cuentas de prueba se borran solas al terminar.
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import * as bd from "../src/baseDeDatos.js";
import { tienePalabraProhibida } from "../src/palabrasProhibidas.js";

const URL = "https://weqaljmtmstzvkmblomh.supabase.co";
const KEY = "sb_publishable_NfYdxrnnT0So5C6Z90ACIw_dOVLrqJq";
const cliente = () => createClient(URL, KEY, { auth: { persistSession: false } });

const ID = Date.now().toString().slice(-6);
const CLAVE = "Prueba-" + Math.random().toString(36).slice(2, 10);
const correo = (x) => `test.atomicrush.${ID}.${x}@gmail.com`;
const cuentasCreadas = [];

const resultados = [];
let seccion = "";
function grupo(nombre) { seccion = nombre; }
function prueba(nombre, esperado, paso, obtenido) {
  resultados.push({ seccion, nombre, esperado, obtenido, paso });
}
const rechazado = (r) => !r || r.ok === false || !!r.error;
// Un rechazo tiene que mostrarse en castellano, sin mensajes técnicos de la base de datos
const mensajeClaro = (r) => !r?.error || !/violates|constraint|syntax|relation/i.test(r.error);

// ---------- 1. Filtro de palabras (sin base de datos) ----------
grupo("Filtro de palabras");
const ofensivas = ["elboludo22", "p.u.t.a", "p0r0ng4", "puuuuta", "Pend3j0", "hijo.de.puta", "c.u.l.o", "juan.gil.22",
  "xXxNaZixXx", "fuck_you", "laconchadetumadre", "maricon", "negrodemierda", "m@tar", "MOGOLICO", "gonorrea99"];
for (const p of ofensivas) prueba(`Bloquea "${p}"`, "Bloqueado", tienePalabraProhibida(p), tienePalabraProhibida(p) ? "Bloqueado" : "Pasó");
const normales = ["computadora", "controlar", "Mariano", "Gilberto", "articulo", "Analia", "Paco", "MariCarmen", "Georgia",
  "recoger", "Penelope", "vehiculo", "pijama", "Vergara", "5to.año", "Monica", "bombero10", "quimica2026"];
for (const p of normales) prueba(`Deja pasar "${p}"`, "Permitido", !tienePalabraProhibida(p), tienePalabraProhibida(p) ? "Bloqueado" : "Permitido");

// El filtro de la base de datos tiene que dar lo mismo que el del juego
const anon = cliente();
let iguales = 0;
for (const p of [...ofensivas, ...normales]) {
  const { data } = await anon.rpc("tiene_palabra_prohibida", { texto: p });
  if (data === tienePalabraProhibida(p)) iguales++;
}
const total = ofensivas.length + normales.length;
prueba("El filtro de la base de datos coincide con el del juego", `${total}/${total}`, iguales === total, `${iguales}/${total}`);

// ---------- 2. Registro ----------
grupo("Registro");
let r = await bd.registrarUsuario(`Test${ID}`, correo("a"), CLAVE);
prueba("Registro con datos válidos", "Crea la cuenta", r.ok, r.ok ? "Creada" : r.error);
if (r.ok) cuentasCreadas.push(correo("a"));
await bd.cerrarSesionBD();

const casosRegistro = [
  ["Nickname repetido", `Test${ID}`, correo("b"), CLAVE],
  ["Nickname repetido con otras mayúsculas", `TEST${ID}`, correo("b"), CLAVE],
  ["Correo que ya tiene cuenta", `Otro${ID}`, correo("a"), CLAVE],
  ["Dominio de correo no permitido", `Dom${ID}`, `test${ID}@cualquiercosa.xyz`, CLAVE],
  ["Correo mal escrito", `Mal${ID}`, "esto-no-es-un-correo", CLAVE],
  ["Contraseña de menos de 6 caracteres", `Corta${ID}`, correo("c"), "123"],
  ["Nickname de menos de 3 letras", "ab", correo("c"), CLAVE],
  ["Nickname de más de 20 letras", "a".repeat(25), correo("c"), CLAVE],
  ["Nickname con espacios", "Juan Perez", correo("c"), CLAVE],
  ["Nickname con código HTML", "<script>alert(1)</script>", correo("c"), CLAVE],
  ["Nickname con inyección SQL", "x'; DROP TABLE perfiles;--", correo("c"), CLAVE],
  ["Nickname ofensivo", `elboludo${ID.slice(-3)}`, correo("c"), CLAVE],
  ["Nickname ofensivo disfrazado", "p0r0ng4", correo("c"), CLAVE],
  ["Correo ofensivo", `Limpio${ID}`, `pelotudo${ID}@gmail.com`, CLAVE],
];
for (const [nombre, nick, mail, clave] of casosRegistro) {
  r = await bd.registrarUsuario(nick, mail, clave);
  prueba(nombre, "Rechaza", rechazado(r), r.ok ? "SE CREÓ" : r.error);
  if (r.ok) { cuentasCreadas.push(mail); await bd.cerrarSesionBD(); }
}

// Saltándose el juego: se llama directo a la API de Supabase
grupo("Registro saltándose el juego (directo a la API)");
const directos = [
  ["Nickname ofensivo", "putazo" + ID.slice(-3), correo("d")],
  ["Correo ofensivo", "Limpio2" + ID, `forro${ID}@gmail.com`],
  ["Dominio no permitido", "Dom2" + ID, `x${ID}@hacker.com`],
  ["Nickname con HTML", "<b>hola</b>", correo("e")],
  ["Nickname repetido con otras mayúsculas", `test${ID}`, correo("f")],
  ["Sin nickname", null, correo("g")],
];
for (const [nombre, nick, mail] of directos) {
  const c = cliente();
  r = await c.auth.signUp({ email: mail, password: CLAVE, options: { data: nick === null ? {} : { nickname: nick } } });
  prueba(nombre, "Rechaza", !!r.error, r.error ? r.error.message : "SE CREÓ");
  if (!r.error) cuentasCreadas.push(mail);
}

// ---------- 3. Inicio de sesión ----------
grupo("Inicio de sesión");
r = await bd.iniciarSesion(correo("a"), CLAVE);
prueba("Correo y contraseña correctos", "Entra", r.ok, r.ok ? "Entró" : r.error);
await bd.cerrarSesionBD();
r = await bd.iniciarSesion(correo("a").toUpperCase(), CLAVE);
prueba("Correo escrito en mayúsculas", "Entra", r.ok, r.ok ? "Entró" : r.error);
await bd.cerrarSesionBD();
const casosLogin = [
  ["Contraseña incorrecta", correo("a"), "incorrecta"],
  ["Correo no registrado", correo("noexiste"), CLAVE],
  ["Contraseña vacía", correo("a"), ""],
  ["Inyección SQL en el correo", "' OR '1'='1' --@gmail.com", CLAVE],
  ["Inyección SQL en la contraseña", correo("a"), "' OR '1'='1"],
  ["Inyección SQL en los dos", "admin'--@gmail.com", "' OR 1=1 --"],
];
for (const [nombre, mail, clave] of casosLogin) {
  r = await bd.iniciarSesion(mail, clave);
  prueba(nombre, "Rechaza", rechazado(r), r.ok ? "ENTRÓ" : r.error);
  if (r.ok) await bd.cerrarSesionBD();
}
// Muchos intentos seguidos con contraseña incorrecta: tiene que seguir rechazando
let entro = false;
for (let i = 0; i < 8; i++) if ((await bd.iniciarSesion(correo("a"), "mala" + i)).ok) entro = true;
prueba("8 intentos seguidos con contraseñas incorrectas", "Ninguno entra", !entro, entro ? "ALGUNO ENTRÓ" : "Ninguno entró");

// ---------- 4. Guardado del progreso ----------
grupo("Guardado del progreso");
await bd.iniciarSesion(correo("a"), CLAVE);
r = await bd.guardarProgreso({ nivelMaximo: 2, niveles: { 1: { puntos: 900, estrellas: 2 } }, album: ["H2O"] });
prueba("Guardar un puntaje normal", "Se guarda", r.ok, r.ok ? "Guardado" : r.error);
r = await bd.guardarProgreso({ nivelMaximo: 1, niveles: { 1: { puntos: 100, estrellas: 1 } }, album: [] });
r = await bd.iniciarSesion(correo("a"), CLAVE);
prueba("Un puntaje peor no pisa al mejor", "900 pts, 2 estrellas",
  r.ok && r.niveles[1].puntos === 900 && r.niveles[1].estrellas === 2, r.ok ? `${r.niveles[1].puntos} pts, ${r.niveles[1].estrellas} estrellas` : r.error);
prueba("Se recupera el álbum", "H2O", r.ok && r.album.includes("H2O"), r.ok ? r.album.join(", ") : r.error);
const trampas = [
  ["Puntaje gigante (99.999.999)", { nivelMaximo: 2, niveles: { 1: { puntos: 99999999, estrellas: 3 } }, album: [] }],
  ["Puntaje negativo", { nivelMaximo: 2, niveles: { 2: { puntos: -500, estrellas: 1 } }, album: [] }],
  ["Más de 3 estrellas", { nivelMaximo: 2, niveles: { 2: { puntos: 500, estrellas: 9 } }, album: [] }],
  ["Nivel que no existe (99)", { nivelMaximo: 2, niveles: { 99: { puntos: 10, estrellas: 1 } }, album: [] }],
  ["Molécula inventada en el álbum", { nivelMaximo: 2, niveles: {}, album: ["Kriptonita"] }],
  ["Código HTML en el álbum", { nivelMaximo: 2, niveles: {}, album: ["<script>alert(1)</script>"] }],
  ["Inyección SQL en el álbum", { nivelMaximo: 2, niveles: {}, album: ["'); DROP TABLE album;--"] }],
  ["Puntaje que no es un número", { nivelMaximo: 2, niveles: { 2: { puntos: "mucho", estrellas: 1 } }, album: [] }],
];
for (const [nombre, datos] of trampas) {
  r = await bd.guardarProgreso(datos);
  prueba(nombre, "Rechaza con un mensaje claro", rechazado(r) && mensajeClaro(r), r.ok ? "SE GUARDÓ" : r.error);
}
r = await bd.guardarProgreso({ nivelMaximo: 99, niveles: {}, album: [] });
const yo = await bd.iniciarSesion(correo("a"), CLAVE);
prueba("Nivel máximo exagerado (99)", "Queda en 15 como máximo", yo.ok && yo.nivelMaximo <= 15, yo.ok ? `nivel ${yo.nivelMaximo}` : yo.error);
await bd.cerrarSesionBD();
r = await bd.guardarProgreso({ nivelMaximo: 15, niveles: { 1: { puntos: 5000, estrellas: 3 } }, album: [] });
prueba("Guardar sin haber iniciado sesión", "Rechaza", rechazado(r), r.ok ? "SE GUARDÓ" : r.error);

// ---------- 5. Permisos: nadie toca datos ajenos ----------
grupo("Permisos (datos de otros jugadores)");
const victima = cliente();
const datosVictima = (await victima.auth.signInWithPassword({ email: correo("a"), password: CLAVE })).data.user;
const atacante = cliente();
r = await atacante.auth.signUp({ email: correo("h"), password: CLAVE, options: { data: { nickname: `Atk${ID}` } } });
if (!r.error) cuentasCreadas.push(correo("h"));
const idV = datosVictima.id;
for (const [nombre, consulta] of [
  ["Leer los puntajes de otro jugador", atacante.from("puntajes").select("*").eq("usuario_id", idV)],
  ["Leer el álbum de otro jugador", atacante.from("album").select("*").eq("usuario_id", idV)],
  ["Leer la lista de palabras prohibidas", anon.from("palabras_prohibidas").select("*").limit(5)],
]) {
  r = await consulta;
  prueba(nombre, "No ve nada", !r.data || r.data.length === 0, r.data?.length ? `VIO ${r.data.length} filas` : "No vio nada");
}
for (const [nombre, consulta] of [
  ["Cambiar el nivel de otro jugador", atacante.from("perfiles").update({ nivel_maximo: 15 }).eq("id", idV).select()],
  ["Cambiar el nickname de otro jugador", atacante.from("perfiles").update({ nickname: "hackeado" }).eq("id", idV).select()],
  ["Borrar el perfil de otro jugador", atacante.from("perfiles").delete().eq("id", idV).select()],
  ["Escribir un puntaje a nombre de otro", atacante.from("puntajes").insert({ usuario_id: idV, nivel: 3, puntos: 5000, estrellas: 3 }).select()],
  ["Agregar un dominio de correo permitido", atacante.from("dominios_permitidos").insert({ dominio: "hacker.com" }).select()],
  ["Borrar palabras prohibidas", atacante.from("palabras_prohibidas").delete().eq("palabra", "puta").select()],
]) {
  r = await consulta;
  prueba(nombre, "Bloqueado", !!r.error || !r.data || r.data.length === 0, r.error ? "Bloqueado" : r.data?.length ? "LO HIZO" : "Bloqueado (0 filas)");
}
const v = await bd.iniciarSesion(correo("a"), CLAVE);
prueba("Los datos del jugador siguen intactos", `Test${ID}, 900 pts`, v.ok && v.usuario === `Test${ID}` && v.niveles[1]?.puntos === 900,
  v.ok ? `${v.usuario}, ${v.niveles[1]?.puntos} pts` : v.error);
await bd.cerrarSesionBD();

// ---------- 6. Ranking ----------
grupo("Ranking");
const ranking = await bd.cargarRanking();
prueba("Devuelve como máximo 10 jugadores", "≤ 10", ranking.length <= 10, `${ranking.length}`);
const ordenado = ranking.every((x, i) => i === 0 || ranking[i - 1].puntosTotales >= x.puntosTotales);
prueba("Está ordenado de mayor a menor", "Ordenado", ordenado, ordenado ? "Ordenado" : "DESORDENADO");
prueba("Ningún puntaje supera el máximo posible", "≤ 150.000", ranking.every((x) => x.puntosTotales <= 150000),
  `máximo: ${Math.max(0, ...ranking.map((x) => x.puntosTotales))}`);

// ---------- Limpieza: se borran las cuentas de prueba ----------
let borradas = 0;
for (const mail of cuentasCreadas) {
  const c = cliente();
  const { error } = await c.auth.signInWithPassword({ email: mail, password: CLAVE });
  if (!error && !(await c.rpc("borrar_mi_cuenta")).error) borradas++;
}
grupo("Limpieza");
prueba("Se borran las cuentas de prueba", `${cuentasCreadas.length}`, borradas === cuentasCreadas.length, `${borradas}`);

// ---------- Resumen ----------
const fallas = resultados.filter((x) => !x.paso);
let actual = "";
for (const x of resultados) {
  if (x.seccion !== actual) { actual = x.seccion; console.log(`\n== ${actual}`); }
  console.log(`${x.paso ? "✔" : "✘"} ${x.nombre} → esperado: ${x.esperado} · obtenido: ${x.obtenido}`);
}
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} pruebas aprobadas`);
if (process.argv.includes("--json")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.argv[process.argv.indexOf("--json") + 1], JSON.stringify(resultados, null, 1));
}
process.exit(fallas.length ? 1 : 0);
