import { ELEMENTOS, MOLECULAS_DICCIONARIO, GASES_NOBLES } from "./datos.js";

/* ============================================================
   CHATBOT DE CONSULTAS — "Profe Átomo"
   Responde dudas sobre cómo se juega y sobre la química del juego.
   No usa inteligencia artificial: busca palabras clave en lo que
   escribe el jugador y elige la respuesta que corresponde.
   ============================================================ */

// Preguntas frecuentes: si el texto tiene alguna de las "palabras",
// se responde con "respuesta". Se revisan en orden.
const PREGUNTAS = [
  {
    palabras: ["hola", "buenas", "buen dia", "hey"],
    respuesta: "¡Hola! Soy el Profe Átomo. Preguntame cómo se juega o por cualquier molécula o elemento del juego, por ejemplo: ¿qué es el NH3?",
  },
  {
    palabras: ["como se juega", "como juego", "reglas", "instrucciones", "como se forma", "como formo"],
    respuesta: "Deslizá un átomo hacia un vecino para intercambiarlos. Si queda una línea de átomos que forma una molécula (por ejemplo H O H = agua), la molécula se forma y caen átomos nuevos.",
  },
  {
    palabras: ["gas noble", "gases nobles", "helio", "neon", "obstaculo", "no se mueve"],
    respuesta: "Los gases nobles (He y Ne) tienen su última capa de electrones completa, por eso no reaccionan con nada. En el juego no se pueden mover: para sacarlos, formá una molécula pegada a ellos.",
  },
  {
    palabras: ["catalizador", "poder", "ulti", "especial"],
    respuesta: "El Catalizador se carga sumando 1500 puntos. Al usarlo barre todo el tablero y avanza tu meta según las moléculas que se podían armar con los átomos que había. En química, un catalizador acelera una reacción.",
  },
  {
    palabras: ["estrella", "estrellas"],
    respuesta: "Las estrellas dependen de los movimientos que te sobran al ganar: 3 si sobra el 40% o más, 2 si sobra el 20%, y 1 si no.",
  },
  {
    palabras: ["pista", "ayuda", "trabado", "no se que hacer"],
    respuesta: "Si pasás 6 segundos sin mover, dos átomos empiezan a titilar: intercambialos y vas a formar una molécula.",
  },
  {
    palabras: ["cadena", "reaccion en cadena", "solo"],
    respuesta: "Si los átomos que caen forman solos una molécula de 3 átomos o más que sirve para tu meta, se forma sin gastar movimientos. Es una reacción en cadena.",
  },
  {
    palabras: ["movimiento", "movimientos", "tiempo", "perdi", "perder"],
    respuesta: "Cada nivel tiene movimientos y tiempo limitados. Un intercambio que no forma nada no gasta movimiento, pero el tiempo sigue corriendo.",
  },
  {
    palabras: ["moleculas", "que moleculas", "lista"],
    respuesta: "Las moléculas del juego son: " + Object.keys(MOLECULAS_DICCIONARIO).join(", ") + ". Preguntame por cualquiera.",
  },
];

const RESPUESTA_POR_DEFECTO =
  "No entendí la pregunta. Probá con: ¿cómo se juega?, ¿qué es un gas noble?, ¿para qué sirve el catalizador? o el nombre de una molécula (por ejemplo CO2).";

// Pasa el texto a minúsculas, le saca los acentos y los signos,
// así "¿Qué es el CO₂?" y "que es el co2" se tratan igual.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ¿Aparece "palabra" como palabra completa dentro de "texto"?
// Se agregan espacios a los costados para que "sal" no coincida con "salir".
function contiene(texto, palabra) {
  return (" " + texto + " ").includes(" " + palabra + " ");
}

// Arma la explicación de una molécula: qué átomos lleva y su dato curioso
function describirMolecula(mol) {
  const partes = [];
  for (const simbolo in mol.atomosNecesarios) {
    partes.push(`${mol.atomosNecesarios[simbolo]} de ${ELEMENTOS[simbolo].nombre}`);
  }
  return `${mol.formula} es ${mol.nombre}. Se forma con ${partes.join(" y ")}. ${mol.dato}`;
}

// Arma la explicación de un elemento: en qué moléculas del juego aparece
function describirElemento(simbolo) {
  const nombre = ELEMENTOS[simbolo].nombre.split(" (")[0];
  if (GASES_NOBLES.includes(simbolo)) {
    return `${nombre} (${simbolo}) es un gas noble: tiene su última capa de electrones completa y no reacciona con nada. En el juego es un obstáculo que se saca formando una molécula pegada a él.`;
  }
  const enMoleculas = [];
  for (const key in MOLECULAS_DICCIONARIO) {
    if (MOLECULAS_DICCIONARIO[key].atomosNecesarios[simbolo]) enMoleculas.push(key);
  }
  return `${nombre} (${simbolo}) aparece en: ${enMoleculas.join(", ")}.`;
}

// Función principal: recibe lo que escribió el jugador y devuelve la respuesta
export function responder(textoJugador) {
  const texto = normalizar(textoJugador);

  // 1) ¿Pregunta por una molécula? Se busca por fórmula (co2) o por nombre (agua)
  for (const mol of Object.values(MOLECULAS_DICCIONARIO)) {
    const nombre = normalizar(mol.nombre.split("(")[0]);
    if (contiene(texto, mol.formula.toLowerCase()) || contiene(texto, nombre)) {
      return describirMolecula(mol);
    }
  }

  // 2) ¿Pregunta por un elemento? Se busca por nombre (carbono)
  for (const simbolo in ELEMENTOS) {
    const nombre = normalizar(ELEMENTOS[simbolo].nombre.split("(")[0]);
    if (contiene(texto, nombre)) return describirElemento(simbolo);
  }

  // 3) Preguntas frecuentes
  for (const pregunta of PREGUNTAS) {
    if (pregunta.palabras.some((palabra) => contiene(texto, palabra))) {
      return pregunta.respuesta;
    }
  }

  return RESPUESTA_POR_DEFECTO;
}
