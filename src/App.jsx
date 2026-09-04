import React, { useState, useEffect } from "react";

/* ============================================================
   ATOMICRUSH - Juego Educativo de Química
   Versión Pro - Mapa de Niveles, Login & Leaderboard
   ============================================================ */

const ELEMENTOS = {
  H: { nombre: "Hidrógeno", color: "#3B82F6", texto: "#FFFFFF" },
  O: { nombre: "Oxígeno", color: "#EF4444", texto: "#FFFFFF" },
  C: { nombre: "Carbono", color: "#6B7280", texto: "#FFFFFF" },
  N: { nombre: "Nitrógeno", color: "#10B981", texto: "#FFFFFF" },
  Na: { nombre: "Sodio", color: "#8B5CF6", texto: "#FFFFFF" },
  Cl: { nombre: "Cloro", color: "#22C55E", texto: "#FFFFFF" },
  Ca: { nombre: "Calcio", color: "#F59E0B", texto: "#FFFFFF" },
  Mg: { nombre: "Magnesio", color: "#EC4899", texto: "#FFFFFF" },
};

const MOLECULAS_DICCIONARIO = {
  H2O: { formula: "H2O", nombre: "Agua", atomosNecesarios: { H: 2, O: 1 } },
  O2: { formula: "O2", nombre: "Oxígeno", atomosNecesarios: { O: 2 } },
  H2: { formula: "H2", nombre: "Hidrógeno", atomosNecesarios: { H: 2 } },
  N2: { formula: "N2", nombre: "Nitrógeno", atomosNecesarios: { N: 2 } },
  NaCl: { formula: "NaCl", nombre: "Sal", atomosNecesarios: { Na: 1, Cl: 1 } },
  CO2: { formula: "CO2", nombre: "Dióxido de Carbono", atomosNecesarios: { C: 1, O: 2 } },
  NH3: { formula: "NH3", nombre: "Amoníaco", atomosNecesarios: { N: 1, H: 3 } },
  CH4: { formula: "CH4", nombre: "Metano", atomosNecesarios: { C: 1, H: 4 } },
};

// Mapa de 10 Niveles con pool de elementos filtrado por nivel
// "tiempoSegundos" es el límite de tiempo para completar el nivel (cronómetro)
const MAPA_NIVELES = [
  { id: 1, tipo: "FORMULA", metaFormula: "H2O", metaCantidad: 6, movimientos: 13, tiempoSegundos: 78, pool: ["H", "O"], desc: "Formá 6 moléculas de Agua (H2O)" },
  { id: 2, tipo: "FORMULA", metaFormula: "O2", metaCantidad: 6, movimientos: 12, tiempoSegundos: 73, pool: ["O", "H"], desc: "Formá 6 moléculas de Oxígeno (O2)" },
  { id: 3, tipo: "ELEMENTO", metaElemento: "O", metaCantidad: 12, movimientos: 15, tiempoSegundos: 95, pool: ["O", "H", "N"], desc: "Recolectá 12 átomos de Oxígeno (O)" },
  { id: 4, tipo: "FORMULA", metaFormula: "NaCl", metaCantidad: 5, movimientos: 10, tiempoSegundos: 64, pool: ["Na", "Cl", "H"], desc: "Formá 5 moléculas de Sal (NaCl)" },
  { id: 5, tipo: "ELEMENTO", metaElemento: "N", metaCantidad: 10, movimientos: 13, tiempoSegundos: 81, pool: ["N", "H", "O"], desc: "Juntá 10 átomos de Nitrógeno (N)" },
  { id: 6, tipo: "FORMULA", metaFormula: "CO2", metaCantidad: 5, movimientos: 9, tiempoSegundos: 56, pool: ["C", "O", "H"], desc: "Formá 5 moléculas de Dióxido de Carbono" },
  { id: 7, tipo: "MULTIPLES_MOLECULAS", metaCantidad: 4, movimientos: 11, tiempoSegundos: 56, pool: ["H", "O", "N", "C"], desc: "Formá 4 moléculas DISTINTAS en el nivel" },
  { id: 8, tipo: "FORMULA", metaFormula: "NH3", metaCantidad: 4, movimientos: 9, tiempoSegundos: 52, pool: ["N", "H", "O"], desc: "Formá 4 moléculas de Amoníaco (NH3)" },
  { id: 9, tipo: "ELEMENTO", metaElemento: "C", metaCantidad: 14, movimientos: 17, tiempoSegundos: 98, pool: ["C", "H", "O"], desc: "Recolectá 14 átomos de Carbono (C)" },
  { id: 10, tipo: "FORMULA", metaFormula: "CH4", metaCantidad: 5, movimientos: 8, tiempoSegundos: 48, pool: ["C", "H", "O"], desc: "Nivel Final: Formá 5 moléculas de Metano" },
];

const FILAS = 6;
const COLUMNAS = 6;
let contadorId = 0;

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

// Elige un elemento al azar del pool del nivel, pero con más chance (60%)
// de que sea uno de los elementos "objetivo" del nivel. Antes elegía
// siempre con la misma probabilidad entre todo el pool, lo que hacía que
// algunos niveles fueran casi imposibles de completar con los movimientos
// disponibles.
function elegirElementoDelPool(pool, nivelConfig) {
  const objetivo = nivelConfig ? obtenerElementosObjetivo(nivelConfig) : [];
  if (objetivo.length > 0 && Math.random() < 0.42) {
    return objetivo[Math.floor(Math.random() * objetivo.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function generarGrillaInicial(pool, nivelConfig) {
  const grilla = [];
  for (let fila = 0; fila < FILAS; fila++) {
    const filaNueva = [];
    for (let col = 0; col < COLUMNAS; col++) {
      filaNueva.push(crearAtomo(elegirElementoDelPool(pool, nivelConfig)));
    }
    grilla.push(filaNueva);
  }
  return grilla;
}

function aplicarGravedad(grillaConHuecos, pool, nivelConfig) {
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
      nuevos.push(crearAtomo(elegirElementoDelPool(pool, nivelConfig)));
    }

    const columnaFinal = [...nuevos, ...sobrevivientes];
    for (let fila = 0; fila < FILAS; fila++) {
      nuevaGrilla[fila][col] = columnaFinal[fila];
    }
  }
  return nuevaGrilla;
}

function sonAdyacentes(a, b) {
  return Math.abs(a.fila - b.fila) + Math.abs(a.col - b.col) === 1;
}

// Convierte segundos totales a formato "m:ss" para mostrar en el cronómetro
function formatearTiempo(segundosTotales) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, "0")}`;
}

function verificarCualquierMolecula(seleccion, grilla) {
  const conteo = {};
  seleccion.forEach(({ fila, col }) => {
    const simbolo = grilla[fila][col].elemento;
    conteo[simbolo] = (conteo[simbolo] || 0) + 1;
  });

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

export default function AtomiCrush() {
  const [usuario, setUsuario] = useState("");
  const [pantalla, setPantalla] = useState("login");
  const [nivelMaximo, setNivelMaximo] = useState(1);
  const [leaderboard, setLeaderboard] = useState(() => {
    const local = localStorage.getItem("atomicrush_leaderboard");
    return local
      ? JSON.parse(local)
      : [
          { usuario: "ProfeQuimica", puntos: 1500, nivel: 10 },
          { usuario: "SantiB", puntos: 950, nivel: 6 },
          { usuario: "Alex", puntos: 400, nivel: 3 },
        ];
  });

  const [nivelIndex, setNivelIndex] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [movimientosRestantes, setMovimientosRestantes] = useState(0);
  const [progresoObjetivo, setProgresoObjetivo] = useState(0);
  const [moleculasDistintasUsadas, setMoleculasDistintasUsadas] = useState(new Set());
  const [grilla, setGrilla] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [nivelCompletado, setNivelCompletado] = useState(false);
  const [sinMovimientos, setSinMovimientos] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [sinTiempo, setSinTiempo] = useState(false);
  const [combo, setCombo] = useState(0);
  const [celdasAcierto, setCeldasAcierto] = useState([]);

  const nivelConfig = MAPA_NIVELES[nivelIndex];

  useEffect(() => {
    localStorage.setItem("atomicrush_leaderboard", JSON.stringify(leaderboard));
  }, [leaderboard]);

  // Cronómetro del nivel: baja de a 1 segundo mientras se está jugando
  // y todavía no se ganó, se quedó sin movimientos o se acabó el tiempo.
  useEffect(() => {
    if (pantalla !== "jugando" || nivelCompletado || sinMovimientos || sinTiempo) return;

    const intervalo = setInterval(() => {
      setTiempoRestante((t) => {
        if (t <= 1) {
          setSinTiempo(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Función de limpieza: para el cronómetro al desmontar o al cambiar
    // de nivel/pantalla, para que no queden intervalos corriendo de más.
    return () => clearInterval(intervalo);
  }, [pantalla, nivelCompletado, sinMovimientos, sinTiempo, nivelIndex]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usuario.trim().length > 0) {
      setPantalla("instrucciones");
    }
  };

  const cerrarSesion = () => {
    setUsuario("");
    setNivelMaximo(1);
    setPuntos(0);
    setPantalla("login");
  };

  const iniciarNivel = (idx) => {
    setNivelIndex(idx);
    const cfg = MAPA_NIVELES[idx];
    setMovimientosRestantes(cfg.movimientos);
    setTiempoRestante(cfg.tiempoSegundos);
    setSinTiempo(false);
    setProgresoObjetivo(0);
    setMoleculasDistintasUsadas(new Set());
    setGrilla(generarGrillaInicial(cfg.pool, cfg));
    setNivelCompletado(false);
    setSinMovimientos(false);
    setCombo(0);
    setMensaje({ texto: "", tipo: "" });
    setPantalla("jugando");
  };

  const procesarIntento = (seleccionFinal) => {
    if (nivelCompletado || sinMovimientos || sinTiempo) return;

    const moleculaFormada = verificarCualquierMolecula(seleccionFinal, grilla);

    if (!moleculaFormada) {
      // Un error corta la racha de combo
      setCombo(0);
      setMensaje({ texto: "❌ Combinación no válida", tipo: "error" });
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 1200);
      return;
    }

    // Antes de sacar los átomos del tablero, los marcamos con brillo
    // ("celdasAcierto") durante un instante corto, para que se note
    // visualmente cuál fue la combinación que funcionó.
    setCeldasAcierto(seleccionFinal);
    setTimeout(() => {
      setCeldasAcierto([]);
      completarFormacion(seleccionFinal, moleculaFormada);
    }, 260);
  };

  // Acá se aplica el resultado real: movimientos, progreso, combo, puntos
  // y la desaparición de los átomos con gravedad. Separado de
  // procesarIntento para poder mostrar el brillo antes de que ocurra.
  const completarFormacion = (seleccionFinal, moleculaFormada) => {
    const nuevosMovimientos = movimientosRestantes - 1;
    setMovimientosRestantes(nuevosMovimientos);

    let avanceGoal = 0;
    if (nivelConfig.tipo === "FORMULA" && moleculaFormada.formula === nivelConfig.metaFormula) {
      avanceGoal = 1;
    } else if (nivelConfig.tipo === "ELEMENTO") {
      seleccionFinal.forEach(({ fila, col }) => {
        if (grilla[fila][col].elemento === nivelConfig.metaElemento) avanceGoal++;
      });
    } else if (nivelConfig.tipo === "MULTIPLES_MOLECULAS") {
      const nuevoSet = new Set(moleculasDistintasUsadas);
      nuevoSet.add(moleculaFormada.formula);
      setMoleculasDistintasUsadas(nuevoSet);
      avanceGoal = nuevoSet.size - progresoObjetivo;
    }

    // Combo: sube con cada acierto seguido y multiplica los puntos.
    // combo 1 = sin bonus, cada escalón siguiente suma 15% extra, tope +75%.
    const comboNuevo = combo + 1;
    const bonusCombo = Math.min(comboNuevo - 1, 5) * 0.15;
    const puntosBase = 100;
    const puntosGanados = Math.round(puntosBase * (1 + bonusCombo));
    setCombo(comboNuevo);

    const nuevoProgreso = progresoObjetivo + avanceGoal;
    const nuevosPuntos = puntos + puntosGanados;
    setProgresoObjetivo(nuevoProgreso);
    setPuntos(nuevosPuntos);

    const grillaConHuecos = grilla.map((f) => [...f]);
    seleccionFinal.forEach(({ fila, col }) => {
      grillaConHuecos[fila][col] = null;
    });
    setGrilla(aplicarGravedad(grillaConHuecos, nivelConfig.pool, nivelConfig));

    const textoCombo = comboNuevo > 1 ? ` 🔥 x${comboNuevo}` : "";
    setMensaje({ texto: `✅ ¡Formaste ${moleculaFormada.nombre}! (+${puntosGanados} pts)${textoCombo}`, tipo: "exito" });

    if (nuevoProgreso >= nivelConfig.metaCantidad) {
      setNivelCompletado(true);
      const siguienteNivel = nivelIndex + 2;
      if (siguienteNivel > nivelMaximo) {
        setNivelMaximo(siguienteNivel);
      }
      actualizarScore(nuevosPuntos + 300, Math.max(nivelMaximo, siguienteNivel));
    } else if (nuevosMovimientos <= 0) {
      setSinMovimientos(true);
    }
  };

  const actualizarScore = (pts, lvl) => {
    setLeaderboard((prev) => {
      const existe = prev.find((u) => u.usuario === usuario);
      let updated;
      if (existe) {
        updated = prev.map((u) =>
          u.usuario === usuario ? { ...u, puntos: Math.max(u.puntos, pts), nivel: Math.max(u.nivel, lvl) } : u
        );
      } else {
        updated = [...prev, { usuario, puntos: pts, nivel: lvl }];
      }
      return updated.sort((a, b) => b.puntos - a.puntos);
    });
  };

  function iniciarSeleccion(fila, col) {
    if (nivelCompletado || sinMovimientos || sinTiempo) return;
    setArrastrando(true);
    setSeleccion([{ fila, col }]);
  }

  function agregarASeleccion(fila, col) {
    if (!arrastrando) return;
    setSeleccion((actual) => {
      if (actual.some((c) => c.fila === fila && c.col === col)) return actual;
      const ultima = actual[actual.length - 1];
      if (sonAdyacentes(ultima, { fila, col })) return [...actual, { fila, col }];
      return actual;
    });
  }

  // ---------- Arreglo del bug de arrastre rápido ----------
  // En vez de depender solo de onMouseEnter (evento discreto que se puede
  // saltear celdas si el mouse se mueve rápido), consultamos de forma
  // continua en qué celda cae la posición actual del mouse mientras se
  // arrastra, usando document.elementFromPoint. Mismo principio que el
  // ejemplo del profe: revisar la posición todo el tiempo, no esperar
  // un evento puntual por objeto. Se usa tanto para mouse como para touch.
  function obtenerCeldaDesdePosicion(clientX, clientY) {
    const elemento = document.elementFromPoint(clientX, clientY);
    if (!elemento || !elemento.dataset || elemento.dataset.fila === undefined) return null;
    return { fila: Number(elemento.dataset.fila), col: Number(elemento.dataset.col) };
  }

  function manejarMouseMove(e) {
    if (!arrastrando) return;
    const celda = obtenerCeldaDesdePosicion(e.clientX, e.clientY);
    if (celda) agregarASeleccion(celda.fila, celda.col);
  }

  // ---------- Soporte táctil (celular / tablet) ----------
  function manejarTouchMove(e) {
    if (!arrastrando) return;
    e.preventDefault();
    const toque = e.touches[0];
    const celda = obtenerCeldaDesdePosicion(toque.clientX, toque.clientY);
    if (celda) agregarASeleccion(celda.fila, celda.col);
  }

  function finalizarSeleccion() {
    setArrastrando(false);
    if (seleccion.length > 0) {
      procesarIntento(seleccion);
      setSeleccion([]);
    }
  }

  return (
    <div className="ac-root">
      <style>{`
        .ac-root {
          min-height: 100vh;
          background: #0f172a;
          color: #f8fafc;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
        }
        .ac-box {
          width: 100%;
          max-width: 480px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
        }
        .ac-title {
          font-size: 28px;
          font-weight: 900;
          text-align: center;
          background: linear-gradient(to right, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .ac-input {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid #475569;
          background: #0f172a;
          color: #fff;
          font-size: 16px;
          margin: 16px 0;
          box-sizing: border-box;
          outline: none;
        }
        .ac-input:focus { border-color: #38bdf8; }
        .ac-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.2s;
        }
        .ac-btn:hover { opacity: 0.95; }
        .ac-btn:active { transform: scale(0.98); }
        .ac-btn-sec {
          background: #334155;
          color: #f8fafc;
          margin-top: 8px;
        }
        
        /* Estilos del Mapa */
        .ac-mapa-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 420px;
          overflow-y: auto;
          padding-right: 6px;
          margin: 16px 0;
        }
        .ac-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ac-node:hover:not(.locked) {
          border-color: #38bdf8;
          transform: translateX(4px);
        }
        .ac-node.locked {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Estilos Juego */
        .ac-stats-bar {
          display: flex;
          justify-content: space-between;
          background: #0f172a;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 12px;
          border: 1px solid #334155;
        }
        .ac-objetivo-grande {
          text-align: center;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 12px;
        }
        .ac-objetivo-grande .simbolo {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .ac-objetivo-grande .desc {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }
        .ac-grid {
          display: grid;
          grid-template-columns: repeat(${COLUMNAS}, 1fr);
          gap: 8px;
          user-select: none;
          touch-action: none;
        }
        .ac-cell {
          aspect-ratio: 1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: inset 0 -3px 0 rgba(0,0,0,0.2);
          transition: transform 0.1s;
          animation: ac-caer 0.28s ease-out;
        }
        @keyframes ac-caer {
          from { transform: translateY(-18px); opacity: 0.4; }
          to { transform: translateY(0); opacity: 1; }
        }
        .ac-cell.acierto {
          animation: ac-brillo 0.26s ease-in-out;
          box-shadow: 0 0 0 3px #fff, 0 0 16px 4px rgba(255,255,255,0.8);
        }
        @keyframes ac-brillo {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .ac-barra-fondo {
          width: 100%;
          height: 8px;
          background: #1e293b;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 6px;
        }
        .ac-barra-relleno {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        .ac-leyenda {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          margin-bottom: 12px;
        }
        .ac-leyenda-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #cbd5e1;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 999px;
          padding: 3px 8px;
        }
        .ac-leyenda-punto {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .ac-cell.selected {
          transform: scale(1.1);
          outline: 3px solid #fff;
          z-index: 10;
        }

        /* Leaderboard */
        .ac-lb-row {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #0f172a;
          border-radius: 10px;
          margin-bottom: 8px;
          font-size: 14px;
        }
      `}</style>

      {/* LOGIN */}
      {pantalla === "login" && (
        <div className="ac-box">
          <div className="ac-title">⚛ ATOMICRUSH</div>
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Plataforma Educativa de Química
          </p>
          <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
            <label style={{ fontSize: "13px", color: "#cbd5e1" }}>Ingresá tu nombre de estudiante:</label>
            <input
              className="ac-input"
              placeholder="Ej: Santiago"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <button className="ac-btn" type="submit">
              Iniciar Sesión
            </button>
          </form>
        </div>
      )}

      {/* INSTRUCCIONES */}
      {pantalla === "instrucciones" && (
        <div className="ac-box">
          <div className="ac-title">📋 Cómo se juega</div>
          <ol style={{ fontSize: "14px", lineHeight: 1.7, color: "#cbd5e1", paddingLeft: "20px" }}>
            <li>Cada nivel te pide una meta: formar una molécula varias veces, juntar cierta cantidad de un elemento, o formar varias moléculas distintas.</li>
            <li>Mantené el mouse (o el dedo) apretado sobre un átomo y arrastrá pasando por átomos <b>vecinos</b> (arriba, abajo, izquierda o derecha).</li>
            <li>Soltá cuando la selección forme alguna de las moléculas válidas.</li>
            <li>Cada nivel tiene una cantidad limitada de <b>movimientos</b> y un <b>tiempo límite</b>: si se acaba cualquiera de los dos antes de cumplir la meta, hay que reintentar.</li>
            <li>Al completar un nivel se desbloquea el siguiente en el mapa.</li>
          </ol>
          <button className="ac-btn" onClick={() => setPantalla("mapa")}>▶ Ir al mapa de niveles</button>
        </div>
      )}

      {/* MAPA DE NIVELES */}
      {pantalla === "mapa" && (
        <div className="ac-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Estudiante</span>
              <h3 style={{ margin: 0, color: "#38bdf8" }}>{usuario}</h3>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="ac-btn ac-btn-sec"
                style={{ width: "auto", padding: "8px 14px", fontSize: "13px", margin: 0 }}
                onClick={() => setPantalla("instrucciones")}
              >
                ❓ Cómo jugar
              </button>
              <button
                className="ac-btn"
                style={{ width: "auto", padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setPantalla("leaderboard")}
              >
                🏆 Ranking
              </button>
              <button
                className="ac-btn ac-btn-sec"
                style={{ width: "auto", padding: "8px 14px", fontSize: "13px", margin: 0 }}
                onClick={cerrarSesion}
              >
                🚪 Salir
              </button>
            </div>
          </div>

          <h4 style={{ margin: "20px 0 10px", color: "#f8fafc" }}>Selección de Nivel</h4>

          <div className="ac-mapa-container">
            {MAPA_NIVELES.map((n, idx) => {
              const unlocked = n.id <= nivelMaximo;
              return (
                <div
                  key={n.id}
                  className={`ac-node ${unlocked ? "" : "locked"}`}
                  onClick={() => unlocked && iniciarNivel(idx)}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "15px" }}>Nivel {n.id}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{n.desc}</div>
                  </div>
                  <div style={{ fontSize: "18px" }}>{unlocked ? "▶️" : "🔒"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JUEGO EN CURSO */}
      {pantalla === "jugando" && (
        <div className="ac-box">
          <div className="ac-stats-bar">
            <span>Movs: <strong style={{ color: "#38bdf8" }}>{movimientosRestantes}</strong></span>
            <span>Meta: <strong style={{ color: "#4ade80" }}>{progresoObjetivo}/{nivelConfig.metaCantidad}</strong></span>
            <span>⏱ <strong style={{ color: tiempoRestante <= 10 ? "#f87171" : "#facc15" }}>{formatearTiempo(tiempoRestante)}</strong></span>
            <span>Pts: <strong>{puntos}</strong></span>
            {combo > 1 && <span style={{ color: "#fb923c" }}>🔥 x{combo}</span>}
          </div>

          <div className="ac-objetivo-grande">
            <div className="simbolo" style={{ color: ELEMENTOS[nivelConfig.metaElemento]?.color || "#38bdf8" }}>
              {nivelConfig.tipo === "FORMULA" && nivelConfig.metaFormula}
              {nivelConfig.tipo === "ELEMENTO" && nivelConfig.metaElemento}
              {nivelConfig.tipo === "MULTIPLES_MOLECULAS" && "?"}
            </div>
            <div className="desc">{nivelConfig.desc}</div>
            <div className="ac-barra-fondo">
              <div
                className="ac-barra-relleno"
                style={{ width: `${Math.min(100, (progresoObjetivo / nivelConfig.metaCantidad) * 100)}%` }}
              />
            </div>
          </div>

          <div className="ac-leyenda">
            {nivelConfig.pool.map((simbolo) => (
              <span key={simbolo} className="ac-leyenda-chip">
                <span className="ac-leyenda-punto" style={{ background: ELEMENTOS[simbolo].color }} />
                {simbolo}
              </span>
            ))}
          </div>

          <p style={{ textAlign: "center", minHeight: "20px", fontSize: "13px", fontWeight: 700, color: mensaje.tipo === "exito" ? "#4ade80" : "#f87171", margin: "4px 0" }}>
            {mensaje.texto}
          </p>

          <div
            className="ac-grid"
            onMouseUp={finalizarSeleccion}
            onMouseMove={manejarMouseMove}
            onTouchMove={manejarTouchMove}
            onTouchEnd={finalizarSeleccion}
          >
            {grilla.map((fila, f) =>
              fila.map((atomo, c) => {
                const estaSel = seleccion.some((s) => s.fila === f && s.col === c);
                const estaAcierto = celdasAcierto.some((s) => s.fila === f && s.col === c);
                const info = ELEMENTOS[atomo.elemento];
                return (
                  <div
                    key={atomo.id}
                    data-fila={f}
                    data-col={c}
                    className={`ac-cell ${estaSel ? "selected" : ""} ${estaAcierto ? "acierto" : ""}`}
                    style={{ background: info.color, color: info.texto }}
                    onMouseDown={() => iniciarSeleccion(f, c)}
                    onMouseEnter={() => agregarASeleccion(f, c)}
                    onTouchStart={() => iniciarSeleccion(f, c)}
                  >
                    {atomo.elemento}
                  </div>
                );
              })
            )}
          </div>

          {nivelCompletado && nivelConfig.id === MAPA_NIVELES.length && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <h3 style={{ color: "#facc15", margin: "8px 0" }}>🏆 ¡Completaste AtomiCrush!</h3>
              <p style={{ fontSize: "13px", color: "#cbd5e1" }}>Puntaje final: {puntos} pts</p>
              <button className="ac-btn" onClick={() => setPantalla("leaderboard")}>Ver Ranking</button>
              <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
            </div>
          )}

          {nivelCompletado && nivelConfig.id !== MAPA_NIVELES.length && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <h3 style={{ color: "#4ade80", margin: "8px 0" }}>🎉 ¡Nivel Completado!</h3>
              <button className="ac-btn" onClick={() => setPantalla("mapa")}>Continuar al Mapa</button>
            </div>
          )}

          {sinMovimientos && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <h3 style={{ color: "#f87171", margin: "8px 0" }}>❌ Te quedaste sin movimientos</h3>
              <button className="ac-btn" onClick={() => iniciarNivel(nivelIndex)}>Reintentar</button>
              <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
            </div>
          )}

          {sinTiempo && (
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <h3 style={{ color: "#f87171", margin: "8px 0" }}>⏰ Se acabó el tiempo</h3>
              <button className="ac-btn" onClick={() => iniciarNivel(nivelIndex)}>Reintentar</button>
              <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD */}
      {pantalla === "leaderboard" && (
        <div className="ac-box">
          <div className="ac-title">🏆 Tabla de Posiciones</div>
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
            Top Estudiantes del Laboratorio
          </p>

          <div>
            {leaderboard.map((item, index) => (
              <div key={index} className="ac-lb-row" style={{ borderLeft: index === 0 ? "4px solid #f59e0b" : "none" }}>
                <div>
                  <span style={{ fontWeight: 800, color: "#38bdf8", marginRight: "8px" }}>#{index + 1}</span>
                  <strong>{item.usuario}</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", marginRight: "12px", fontSize: "12px" }}>Nivel {item.nivel || 1}</span>
                  <strong style={{ color: "#4ade80" }}>{item.puntos} pts</strong>
                </div>
              </div>
            ))}
          </div>

          <button className="ac-btn ac-btn-sec" style={{ marginTop: "16px" }} onClick={() => setPantalla("mapa")}>
            Volver al Mapa
          </button>
        </div>
      )}
    </div>
  );
}
