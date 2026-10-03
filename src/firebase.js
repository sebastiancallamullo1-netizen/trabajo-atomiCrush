import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

/* ============================================================
   BASE DE DATOS (Firebase Firestore)
   Acá se guarda el progreso de cada jugador y se arma el ranking.
   Firestore guarda "documentos" adentro de "colecciones":
     colección "jugadores" -> un documento por jugador, por ejemplo:
     { usuario: "Santiago", nivelMaximo: 4, puntosTotales: 2350,
       niveles: { "1": { puntos: 900, estrellas: 3 }, ... } }
   ============================================================ */

// Datos del proyecto de Firebase. Se sacan de: Consola de Firebase >
// Configuración del proyecto > Tus apps > App web. No son contraseñas:
// solo dicen a qué proyecto conectarse.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Mientras la configuración esté vacía, el juego guarda todo en el
// navegador (localStorage) para poder seguir funcionando igual.
export const usandoFirebase = firebaseConfig.projectId !== "";

let db = null;
if (usandoFirebase) {
  db = getFirestore(initializeApp(firebaseConfig));
}

const CLAVE_LOCAL = "atomicrush_jugadores";

function leerLocal() {
  return JSON.parse(localStorage.getItem(CLAVE_LOCAL) || "{}");
}

function escribirLocal(todos) {
  localStorage.setItem(CLAVE_LOCAL, JSON.stringify(todos));
}

// El nombre del jugador se usa como identificador del documento.
// Lo pasamos a minúsculas para que "Santi" y "santi" sean el mismo jugador,
// y cambiamos "/" porque Firestore no lo acepta en los identificadores.
function idDeJugador(nombre) {
  return nombre.trim().toLowerCase().replaceAll("/", "-");
}

// Devuelve los datos guardados del jugador, o null si es nuevo.
export async function cargarJugador(nombre) {
  if (usandoFirebase) {
    try {
      const documento = await getDoc(doc(db, "jugadores", idDeJugador(nombre)));
      return documento.exists() ? documento.data() : null;
    } catch (error) {
      // Si no hay internet o falla Firebase, seguimos con lo guardado local
      console.warn("No se pudo leer de Firebase, se usa localStorage", error);
    }
  }
  return leerLocal()[idDeJugador(nombre)] || null;
}

// Guarda (o reemplaza) los datos del jugador.
export async function guardarJugador(nombre, datos) {
  // Siempre dejamos una copia local, por si se corta la conexión
  const todos = leerLocal();
  todos[idDeJugador(nombre)] = datos;
  escribirLocal(todos);

  if (usandoFirebase) {
    try {
      await setDoc(doc(db, "jugadores", idDeJugador(nombre)), datos);
    } catch (error) {
      console.warn("No se pudo guardar en Firebase", error);
    }
  }
}

// Trae a todos los jugadores y los ordena de mayor a menor puntaje.
export async function cargarRanking() {
  let jugadores = Object.values(leerLocal());

  if (usandoFirebase) {
    try {
      const resultado = await getDocs(collection(db, "jugadores"));
      jugadores = resultado.docs.map((d) => d.data());
    } catch (error) {
      console.warn("No se pudo leer el ranking de Firebase", error);
    }
  }

  return jugadores.sort((a, b) => b.puntosTotales - a.puntosTotales).slice(0, 10);
}
