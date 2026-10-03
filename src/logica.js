import { MOLECULAS_DICCIONARIO } from "./datos.js";

/* ============================================================
   LÓGICA DEL TABLERO
   Funciones que no dibujan nada: generan la grilla, detectan
   moléculas, aplican la gravedad y calculan el poder especial.
   ============================================================ */

export const FILAS = 6;
export const COLUMNAS = 6;

// Puntos que hay que sumar en un nivel para cargar el poder "Catalizador"
export const PUNTOS_PARA_PODER = 1000;

let contadorId = 0;

// Cada átomo tiene un id único: React lo usa como "key" para saber
// qué ficha es nueva (y animar su caída) y cuál ya estaba.
function crearAtomo(simbolo) {
  contadorId += 1;
  return { id: contadorId, elemento: simbolo };
}

// Devuelve qué elementos conviene que aparezcan más seguido en la grilla,
// según el objetivo del nivel: el elemento a juntar, o los elementos de
// la fórmula pedida. Esto es lo que arregla el bug de niveles "imposibles".
function obtenerElementosObjetivo(nivelConfig) {
  if (nivelConfig.tipo === "FORMULA") {
    return Object.keys(MOLECULAS_DICCIONARIO[nivelConfig.metaFormula].atomosNecesarios);
  }

  if (nivelConfig.tipo === "ELEMENTO") {
    const elemento = nivelConfig.metaElemento;

    // ¿Existe una molécula hecha 100% de este elemento, como O2 o N2?
    // Si existe, alcanza con priorizar ese elemento solo.
    const existeHomonuclear = Object.values(MOLECULAS_DICCIONARIO).some((mol) => {
      const claves = Object.keys(mol.atomosNecesarios);
      return claves.length === 1 && claves[0] === elemento;
    });
    if (existeHomonuclear) return [elemento];

    // Si NO existe (como el Carbono, que no forma "C2"), la única forma
    // de sumarlo es combinado con otros elementos (CO2, CH4). Ahí hay que
    // priorizar TODOS los elementos de esas fórmulas, no solo el Carbono,
    // para que la grilla tenga con qué combinarlo.
    const elementosRelacionados = new Set();
    Object.values(MOLECULAS_DICCIONARIO).forEach((mol) => {
      const claves = Object.keys(mol.atomosNecesarios);
      if (claves.includes(elemento)) claves.forEach((e) => elementosRelacionados.add(e));
    });
    return Array.from(elementosRelacionados);
  }

  return [];
}

// Elige un elemento al azar del pool del nivel, pero con más chance (42%)
// de que sea uno de los elementos "objetivo" del nivel. Si eligiera
// siempre parejo entre todo el pool, algunos niveles serían casi
// imposibles de completar con los movimientos disponibles.
function elegirElementoDelPool(pool, nivelConfig) {
  const objetivo = obtenerElementosObjetivo(nivelConfig);
  if (objetivo.length > 0 && Math.random() < 0.42) {
    return objetivo[Math.floor(Math.random() * objetivo.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generarGrillaInicial(nivelConfig) {
  const grilla = [];
  for (let fila = 0; fila < FILAS; fila++) {
    const filaNueva = [];
    for (let col = 0; col < COLUMNAS; col++) {
      filaNueva.push(crearAtomo(elegirElementoDelPool(nivelConfig.pool, nivelConfig)));
    }
    grilla.push(filaNueva);
  }
  return grilla;
}

// Las celdas vacías (null) se rellenan: los átomos que quedan "caen"
// hacia abajo y arriba aparecen átomos nuevos.
export function aplicarGravedad(grillaConHuecos, nivelConfig) {
  const nuevaGrilla = [];
  for (let f = 0; f < FILAS; f++) nuevaGrilla.push(new Array(COLUMNAS).fill(null));

  for (let col = 0; col < COLUMNAS; col++) {
    const sobrevivientes = [];
    for (let fila = 0; fila < FILAS; fila++) {
      if (grillaConHuecos[fila][col] !== null) {
        sobrevivientes.push(grillaConHuecos[fila][col]);
      }
    }

    const faltantes = FILAS - sobrevivientes.length;
    const nuevos = [];
    for (let i = 0; i < faltantes; i++) {
      nuevos.push(crearAtomo(elegirElementoDelPool(nivelConfig.pool, nivelConfig)));
    }

    const columnaFinal = [...nuevos, ...sobrevivientes];
    for (let fila = 0; fila < FILAS; fila++) {
      nuevaGrilla[fila][col] = columnaFinal[fila];
    }
  }
  return nuevaGrilla;
}

// Devuelve una copia de la grilla con dos celdas intercambiadas
export function intercambiarCeldas(grilla, a, b) {
  const copia = grilla.map((fila) => [...fila]);
  const temporal = copia[a.fila][a.col];
  copia[a.fila][a.col] = copia[b.fila][b.col];
  copia[b.fila][b.col] = temporal;
  return copia;
}

// Cuenta cuántos átomos de cada elemento hay en una lista de celdas.
// Ejemplo: [H, O, H] -> { H: 2, O: 1 }
export function contarAtomos(celdas, grilla) {
  const conteo = {};
  celdas.forEach(({ fila, col }) => {
    const simbolo = grilla[fila][col].elemento;
    conteo[simbolo] = (conteo[simbolo] || 0) + 1;
  });
  return conteo;
}

// Compara el conteo de las celdas contra cada receta del diccionario.
// Los objetos no se pueden comparar con ===, por eso se revisa clave por clave.
export function verificarCualquierMolecula(celdas, grilla) {
  const conteo = contarAtomos(celdas, grilla);

  for (const key in MOLECULAS_DICCIONARIO) {
    const mol = MOLECULAS_DICCIONARIO[key];
    const nec = mol.atomosNecesarios;
    const kNec = Object.keys(nec);
    const kSel = Object.keys(conteo);

    if (kNec.length === kSel.length && kNec.every((s) => conteo[s] === nec[s])) {
      return mol;
    }
  }
  return null;
}

// Arma la lista de celdas de un tramo recto. Si se sale del tablero devuelve null.
function armarTramo(filaInicio, colInicio, largo, esHorizontal) {
  const celdas = [];
  for (let i = 0; i < largo; i++) {
    const fila = esHorizontal ? filaInicio : filaInicio + i;
    const col = esHorizontal ? colInicio + i : colInicio;
    if (fila < 0 || fila >= FILAS || col < 0 || col >= COLUMNAS) return null;
    celdas.push({ fila, col });
  }
  return celdas;
}

// Busca, en la fila y en la columna de una celda, una línea de átomos
// seguidos (de 2 a 5, como en Candy Crush) que forme una molécula válida
// y que pase por esa celda. Si hay varias, se queda con la más larga.
// Ejemplo: en la fila  H O H  hay una molécula de agua.
export function buscarMoleculaEnLinea(grilla, fila, col) {
  let mejor = null;

  for (let largo = 2; largo <= 5; largo++) {
    // "corrimiento" = en qué posición del tramo queda la celda pedida
    for (let corrimiento = 0; corrimiento < largo; corrimiento++) {
      const horizontal = armarTramo(fila, col - corrimiento, largo, true);
      const vertical = armarTramo(fila - corrimiento, col, largo, false);

      [horizontal, vertical].forEach((celdas) => {
        if (!celdas) return;
        const molecula = verificarCualquierMolecula(celdas, grilla);
        if (molecula && (!mejor || celdas.length > mejor.celdas.length)) {
          mejor = { molecula, celdas };
        }
      });
    }
  }
  return mejor;
}

// Después de intercambiar las celdas a y b, revisa si alguna de las dos
// quedó formando una molécula en línea. Si las dos forman, gana la más larga.
export function buscarMoleculaPorIntercambio(grillaNueva, a, b) {
  const enA = buscarMoleculaEnLinea(grillaNueva, a.fila, a.col);
  const enB = buscarMoleculaEnLinea(grillaNueva, b.fila, b.col);
  if (enA && enB) return enA.celdas.length >= enB.celdas.length ? enA : enB;
  return enA || enB;
}

// Prueba todos los intercambios posibles (cada celda con la de su derecha
// y la de abajo). Si ninguno forma una molécula, el tablero quedó trabado.
export function hayJugadaPosible(grilla) {
  for (let fila = 0; fila < FILAS; fila++) {
    for (let col = 0; col < COLUMNAS; col++) {
      const vecinos = [
        { fila, col: col + 1 },
        { fila: fila + 1, col },
      ];
      for (const vecino of vecinos) {
        if (vecino.fila >= FILAS || vecino.col >= COLUMNAS) continue;
        const a = { fila, col };
        if (grilla[fila][col].elemento === grilla[vecino.fila][vecino.col].elemento) continue;
        const copia = intercambiarCeldas(grilla, a, vecino);
        if (buscarMoleculaPorIntercambio(copia, a, vecino)) return true;
      }
    }
  }
  return false;
}

// Poder "Catalizador": mira TODO el tablero y calcula cuánto avanza la meta
// con los átomos que hay. Para no regalar el nivel, avanza como mucho
// un tercio de la meta.
export function calcularAvancePoder(grilla, nivelConfig, moleculasUsadas) {
  const todasLasCeldas = [];
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < COLUMNAS; c++) todasLasCeldas.push({ fila: f, col: c });
  }
  const conteo = contarAtomos(todasLasCeldas, grilla);
  const tope = Math.ceil(nivelConfig.metaCantidad / 3);

  if (nivelConfig.tipo === "FORMULA") {
    // Cuántas moléculas enteras alcanzan con lo que hay: manda el elemento
    // que se termina primero (en química se llama "reactivo limitante").
    const necesarios = MOLECULAS_DICCIONARIO[nivelConfig.metaFormula].atomosNecesarios;
    let posibles = Infinity;
    for (const simbolo in necesarios) {
      posibles = Math.min(posibles, Math.floor((conteo[simbolo] || 0) / necesarios[simbolo]));
    }
    return { avance: Math.min(posibles, tope), moleculasNuevas: [] };
  }

  if (nivelConfig.tipo === "ELEMENTO") {
    const cantidad = conteo[nivelConfig.metaElemento] || 0;
    return { avance: Math.min(cantidad, tope), moleculasNuevas: [] };
  }

  // MULTIPLES_MOLECULAS: suma las moléculas que todavía no se formaron
  // y que se podrían armar con los átomos del tablero.
  const moleculasNuevas = [];
  for (const key in MOLECULAS_DICCIONARIO) {
    const necesarios = MOLECULAS_DICCIONARIO[key].atomosNecesarios;
    const alcanza = Object.keys(necesarios).every((s) => (conteo[s] || 0) >= necesarios[s]);
    if (alcanza && !moleculasUsadas.has(key) && moleculasNuevas.length < tope) {
      moleculasNuevas.push(key);
    }
  }
  return { avance: moleculasNuevas.length, moleculasNuevas };
}

// Estrellas al ganar, según cuántos movimientos sobraron
export function calcularEstrellas(movimientosRestantes, movimientosTotales) {
  const fraccion = movimientosRestantes / movimientosTotales;
  if (fraccion >= 0.4) return 3;
  if (fraccion >= 0.2) return 2;
  return 1;
}

// Convierte segundos totales a formato "m:ss" para mostrar en el cronómetro
export function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, "0")}`;
}
