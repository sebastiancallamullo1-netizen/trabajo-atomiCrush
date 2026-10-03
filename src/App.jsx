import { useState, useEffect } from "react";
import "./App.css";
import { ELEMENTOS, MOLECULAS_DICCIONARIO, MAPA_NIVELES } from "./datos.js";
import {
  FILAS,
  COLUMNAS,
  PUNTOS_PARA_PODER,
  generarGrillaInicial,
  aplicarGravedad,
  intercambiarCeldas,
  buscarMoleculaPorIntercambio,
  hayJugadaPosible,
  calcularAvancePoder,
  calcularEstrellas,
  formatearTiempo,
} from "./logica.js";
import { cargarJugador, guardarJugador, cargarRanking, usandoFirebase } from "./firebase.js";

/* ============================================================
   ATOMICRUSH - Juego Educativo de Química
   Pantallas: login, instrucciones, mapa, moléculas, juego y ranking
   ============================================================ */

// Cuánto tarda la animación de deslizar una ficha (en milisegundos)
const DURACION_DESLIZAR = 180;
// Cuántos píxeles hay que arrastrar para que cuente como movimiento
const DISTANCIA_MINIMA = 20;

// Muestra de 0 a 3 estrellas, por ejemplo "★★☆"
function textoEstrellas(cantidad) {
  return "★".repeat(cantidad) + "☆".repeat(3 - cantidad);
}

export default function App() {
  // ---------- Jugador y pantallas ----------
  const [usuario, setUsuario] = useState("");
  const [pantalla, setPantalla] = useState("login");
  const [cargando, setCargando] = useState(false);
  const [nivelMaximo, setNivelMaximo] = useState(1);
  // Mejor puntaje y estrellas de cada nivel: { 1: { puntos, estrellas }, ... }
  const [progresoNiveles, setProgresoNiveles] = useState({});
  const [ranking, setRanking] = useState([]);

  // ---------- Partida en curso ----------
  const [nivelIndex, setNivelIndex] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [movimientosRestantes, setMovimientosRestantes] = useState(0);
  const [progresoObjetivo, setProgresoObjetivo] = useState(0);
  const [moleculasDistintasUsadas, setMoleculasDistintasUsadas] = useState(new Set());
  const [grilla, setGrilla] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [nivelCompletado, setNivelCompletado] = useState(false);
  const [sinMovimientos, setSinMovimientos] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [sinTiempo, setSinTiempo] = useState(false);
  const [combo, setCombo] = useState(0);
  const [estrellasGanadas, setEstrellasGanadas] = useState(0);
  const [cargaPoder, setCargaPoder] = useState(0);

  // ---------- Estado de las animaciones ----------
  const [origenArrastre, setOrigenArrastre] = useState(null); // dónde se apretó
  const [bloqueado, setBloqueado] = useState(false); // true mientras hay una animación
  const [desplazamientos, setDesplazamientos] = useState({}); // fichas deslizándose
  const [celdasAcierto, setCeldasAcierto] = useState([]); // fichas que brillan
  const [barriendo, setBarriendo] = useState(false); // animación del poder
  const [carteles, setCarteles] = useState([]); // "+150" que suben y desaparecen

  const nivelConfig = MAPA_NIVELES[nivelIndex];
  const juegoTerminado = nivelCompletado || sinMovimientos || sinTiempo;
  const poderListo = cargaPoder >= PUNTOS_PARA_PODER;

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

  // ---------- Login y progreso guardado ----------
  const handleLogin = async (e) => {
    e.preventDefault();
    const nombre = usuario.trim();
    if (nombre.length === 0) return;

    setCargando(true);
    const datos = await cargarJugador(nombre);
    setCargando(false);

    if (datos) {
      // Jugador que ya había jugado: recuperamos su progreso y va directo al mapa
      setNivelMaximo(datos.nivelMaximo);
      setProgresoNiveles(datos.niveles || {});
      setPantalla("mapa");
    } else {
      setNivelMaximo(1);
      setProgresoNiveles({});
      setPantalla("instrucciones");
    }
  };

  const cerrarSesion = () => {
    setUsuario("");
    setNivelMaximo(1);
    setProgresoNiveles({});
    setPantalla("login");
  };

  const abrirRanking = async () => {
    setCargando(true);
    setRanking(await cargarRanking());
    setCargando(false);
    setPantalla("ranking");
  };

  // Guarda el resultado del nivel (si mejoró) en la base de datos
  const guardarResultado = (puntosFinales, estrellas) => {
    const id = nivelConfig.id;
    const anterior = progresoNiveles[id] || { puntos: 0, estrellas: 0 };
    const nuevoProgreso = {
      ...progresoNiveles,
      [id]: {
        puntos: Math.max(anterior.puntos, puntosFinales),
        estrellas: Math.max(anterior.estrellas, estrellas),
      },
    };
    const nuevoMaximo = Math.max(nivelMaximo, id + 1);

    // El puntaje total es la suma del mejor puntaje de cada nivel.
    // Así repetir el nivel 1 muchas veces no infla el ranking.
    let puntosTotales = 0;
    Object.values(nuevoProgreso).forEach((nivel) => {
      puntosTotales += nivel.puntos;
    });

    setProgresoNiveles(nuevoProgreso);
    setNivelMaximo(nuevoMaximo);
    guardarJugador(usuario.trim(), {
      usuario: usuario.trim(),
      nivelMaximo: nuevoMaximo,
      puntosTotales,
      niveles: nuevoProgreso,
    });
  };

  // ---------- Comienzo de un nivel ----------
  const iniciarNivel = (idx) => {
    const cfg = MAPA_NIVELES[idx];
    setNivelIndex(idx);
    setPuntos(0);
    setMovimientosRestantes(cfg.movimientos);
    setTiempoRestante(cfg.tiempoSegundos);
    setSinTiempo(false);
    setProgresoObjetivo(0);
    setMoleculasDistintasUsadas(new Set());
    setGrilla(generarGrillaInicial(cfg));
    setNivelCompletado(false);
    setSinMovimientos(false);
    setCombo(0);
    setCargaPoder(0);
    setEstrellasGanadas(0);
    setBloqueado(false);
    setDesplazamientos({});
    setCeldasAcierto([]);
    setCarteles([]);
    setMensaje({ texto: "", tipo: "" });
    setPantalla("jugando");
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    if (tipo === "error") setTimeout(() => setMensaje({ texto: "", tipo: "" }), 1200);
  };

  // Cartel "+150" que aparece sobre las fichas y se va solo
  const mostrarCartel = (texto, celdas) => {
    let sumaFilas = 0;
    let sumaCols = 0;
    celdas.forEach(({ fila, col }) => {
      sumaFilas += fila;
      sumaCols += col;
    });
    const nuevo = {
      id: Date.now(),
      texto,
      fila: sumaFilas / celdas.length,
      col: sumaCols / celdas.length,
    };
    setCarteles((actuales) => [...actuales, nuevo]);
    setTimeout(() => setCarteles((actuales) => actuales.filter((c) => c.id !== nuevo.id)), 900);
  };

  // ---------- Intercambio de fichas (como Candy Crush) ----------
  // Mueve visualmente las fichas a y b. cantidad = 1 las lleva al lugar
  // de la otra, cantidad = 0 las devuelve a su lugar.
  const moverFichas = (a, b, cantidad) => {
    setDesplazamientos({
      [`${a.fila}-${a.col}`]: { dx: (b.col - a.col) * cantidad, dy: (b.fila - a.fila) * cantidad },
      [`${b.fila}-${b.col}`]: { dx: (a.col - b.col) * cantidad, dy: (a.fila - b.fila) * cantidad },
    });
  };

  const intentarIntercambio = (a, b) => {
    if (bloqueado || juegoTerminado) return;

    // Probamos el intercambio en una copia de la grilla
    const grillaNueva = intercambiarCeldas(grilla, a, b);
    const mismoElemento = grilla[a.fila][a.col].elemento === grilla[b.fila][b.col].elemento;
    const resultado = mismoElemento ? null : buscarMoleculaPorIntercambio(grillaNueva, a, b);

    setBloqueado(true);
    moverFichas(a, b, 1);

    setTimeout(() => {
      if (!resultado) {
        // No forma ninguna molécula: las fichas vuelven a su lugar
        // y no se gasta el movimiento (igual que en Candy Crush)
        moverFichas(a, b, 0);
        setCombo(0);
        mostrarMensaje("❌ Ese movimiento no forma ninguna molécula", "error");
        setTimeout(() => {
          setDesplazamientos({});
          setBloqueado(false);
        }, DURACION_DESLIZAR);
        return;
      }

      // Forma una molécula: el intercambio queda y las fichas brillan un momento
      setDesplazamientos({});
      setGrilla(grillaNueva);
      setCeldasAcierto(resultado.celdas);
      setTimeout(() => {
        setCeldasAcierto([]);
        completarFormacion(grillaNueva, resultado);
        setBloqueado(false);
      }, 300);
    }, DURACION_DESLIZAR);
  };

  // Acá se aplica el resultado real: movimientos, progreso, combo, puntos,
  // carga del poder y la desaparición de los átomos con gravedad.
  const completarFormacion = (grillaActual, resultado) => {
    const { molecula, celdas } = resultado;
    const nuevosMovimientos = movimientosRestantes - 1;
    setMovimientosRestantes(nuevosMovimientos);

    let avanceGoal = 0;
    if (nivelConfig.tipo === "FORMULA" && molecula.formula === nivelConfig.metaFormula) {
      avanceGoal = 1;
    } else if (nivelConfig.tipo === "ELEMENTO") {
      celdas.forEach(({ fila, col }) => {
        if (grillaActual[fila][col].elemento === nivelConfig.metaElemento) avanceGoal++;
      });
    } else if (nivelConfig.tipo === "MULTIPLES_MOLECULAS") {
      const nuevoSet = new Set(moleculasDistintasUsadas);
      nuevoSet.add(molecula.formula);
      setMoleculasDistintasUsadas(nuevoSet);
      avanceGoal = nuevoSet.size - progresoObjetivo;
    }

    // Puntos: 50 por cada átomo de la molécula (CH4 vale más que H2).
    // Combo: cada acierto seguido suma 15% extra, con tope de +75%.
    const comboNuevo = combo + 1;
    const bonusCombo = Math.min(comboNuevo - 1, 5) * 0.15;
    const puntosGanados = Math.round(celdas.length * 50 * (1 + bonusCombo));
    setCombo(comboNuevo);

    const nuevoProgreso = progresoObjetivo + avanceGoal;
    const nuevosPuntos = puntos + puntosGanados;
    setProgresoObjetivo(nuevoProgreso);
    setPuntos(nuevosPuntos);
    setCargaPoder(Math.min(PUNTOS_PARA_PODER, cargaPoder + puntosGanados));
    mostrarCartel(`+${puntosGanados}`, celdas);

    // Sacamos los átomos usados y caen nuevos
    const grillaConHuecos = grillaActual.map((f) => [...f]);
    celdas.forEach(({ fila, col }) => {
      grillaConHuecos[fila][col] = null;
    });
    let grillaFinal = aplicarGravedad(grillaConHuecos, nivelConfig);

    const textoCombo = comboNuevo > 1 ? ` 🔥 x${comboNuevo}` : "";
    mostrarMensaje(`✅ ¡Formaste ${molecula.nombre} (${molecula.formula})!${textoCombo}`, "exito");

    // Si después de caer las fichas no queda ninguna jugada, se mezcla solo
    if (!hayJugadaPosible(grillaFinal)) {
      grillaFinal = generarGrillaInicial(nivelConfig);
      mostrarMensaje("🔄 No quedaban jugadas: se mezcló el tablero", "exito");
    }
    setGrilla(grillaFinal);

    if (nuevoProgreso >= nivelConfig.metaCantidad) {
      ganarNivel(nuevosPuntos, nuevosMovimientos);
    } else if (nuevosMovimientos <= 0) {
      setSinMovimientos(true);
    }
  };

  const ganarNivel = (puntosDelNivel, movimientosQueSobraron) => {
    const estrellas = calcularEstrellas(movimientosQueSobraron, nivelConfig.movimientos);
    const puntosFinales = puntosDelNivel + 300; // bonus por completar el nivel
    setPuntos(puntosFinales);
    setEstrellasGanadas(estrellas);
    setNivelCompletado(true);
    guardarResultado(puntosFinales, estrellas);
  };

  // ---------- Poder especial: Catalizador ----------
  // Se carga sumando puntos. Al usarlo, "barre" todo el tablero:
  // cuenta lo que se podría formar con todos los átomos, suma ese avance
  // a la meta y genera un tablero nuevo. No gasta movimientos.
  const usarPoder = () => {
    if (!poderListo || bloqueado || juegoTerminado) return;

    const { avance, moleculasNuevas } = calcularAvancePoder(grilla, nivelConfig, moleculasDistintasUsadas);
    setBloqueado(true);
    setBarriendo(true);

    setTimeout(() => {
      setBarriendo(false);
      setCargaPoder(0);
      setGrilla(generarGrillaInicial(nivelConfig));

      if (moleculasNuevas.length > 0) {
        const nuevoSet = new Set(moleculasDistintasUsadas);
        moleculasNuevas.forEach((m) => nuevoSet.add(m));
        setMoleculasDistintasUsadas(nuevoSet);
      }

      const nuevoProgreso = progresoObjetivo + avance;
      const nuevosPuntos = puntos + avance * 100;
      setProgresoObjetivo(nuevoProgreso);
      setPuntos(nuevosPuntos);
      mostrarMensaje(`⚡ ¡Catalizador! La meta avanzó +${avance}`, "exito");

      if (nuevoProgreso >= nivelConfig.metaCantidad) {
        ganarNivel(nuevosPuntos, movimientosRestantes);
      }
      setBloqueado(false);
    }, 700);
  };

  // ---------- Arrastre con mouse o dedo ----------
  // Los "pointer events" funcionan igual para mouse y para pantallas táctiles.
  // Al apretar se guarda la posición; al moverse más de DISTANCIA_MINIMA
  // píxeles se decide la dirección y se intercambia con la ficha vecina.
  function manejarPointerDown(e, fila, col) {
    if (bloqueado || juegoTerminado) return;
    setOrigenArrastre({ fila, col, x: e.clientX, y: e.clientY });
  }

  function manejarPointerMove(e) {
    if (!origenArrastre) return;
    const dx = e.clientX - origenArrastre.x;
    const dy = e.clientY - origenArrastre.y;
    if (Math.abs(dx) < DISTANCIA_MINIMA && Math.abs(dy) < DISTANCIA_MINIMA) return;

    let destino;
    if (Math.abs(dx) > Math.abs(dy)) {
      destino = { fila: origenArrastre.fila, col: origenArrastre.col + (dx > 0 ? 1 : -1) };
    } else {
      destino = { fila: origenArrastre.fila + (dy > 0 ? 1 : -1), col: origenArrastre.col };
    }

    const origen = { fila: origenArrastre.fila, col: origenArrastre.col };
    setOrigenArrastre(null);
    const dentroDelTablero = destino.fila >= 0 && destino.fila < FILAS && destino.col >= 0 && destino.col < COLUMNAS;
    if (dentroDelTablero) intentarIntercambio(origen, destino);
  }

  function soltarArrastre() {
    setOrigenArrastre(null);
  }

  // ---------- Pantallas ----------
  return (
    <div className="ac-root">
      {/* LOGIN */}
      {pantalla === "login" && (
        <div className="ac-box">
          <div className="ac-logo">⚛</div>
          <div className="ac-title">ATOMICRUSH</div>
          <p className="ac-subtitulo">Plataforma Educativa de Química</p>
          <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
            <label className="ac-label">Ingresá tu nombre de estudiante:</label>
            <input
              className="ac-input"
              placeholder="Ej: Santiago"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <button className="ac-btn" type="submit" disabled={cargando}>
              {cargando ? "Cargando progreso..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      )}

      {/* INSTRUCCIONES */}
      {pantalla === "instrucciones" && (
        <div className="ac-box">
          <div className="ac-title">📋 Cómo se juega</div>
          <ol className="ac-instrucciones">
            <li>Cada nivel te pide una meta: formar una molécula varias veces, juntar cierta cantidad de un elemento, o formar varias moléculas distintas.</li>
            <li><b>Deslizá</b> un átomo hacia un vecino (arriba, abajo, izquierda o derecha) para <b>intercambiarlos</b>, como en Candy Crush.</li>
            <li>Si después del cambio queda una <b>línea</b> de átomos que forma una molécula (por ejemplo <b>H O H</b> = agua), la molécula se forma y caen átomos nuevos.</li>
            <li>Si el cambio no forma nada, los átomos vuelven a su lugar y no perdés el movimiento.</li>
            <li>Al sumar <b>{PUNTOS_PARA_PODER} puntos</b> se carga el poder <b>⚡ Catalizador</b>: barre todo el tablero y avanza tu meta con los átomos que había.</li>
            <li>Cada nivel tiene <b>movimientos</b> y <b>tiempo</b> limitados. Cuantos más movimientos te sobren, más estrellas ganás.</li>
          </ol>
          <button className="ac-btn" onClick={() => setPantalla("mapa")}>▶ Ir al mapa de niveles</button>
          <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("moleculas")}>🧪 Ver moléculas válidas</button>
        </div>
      )}

      {/* TABLA DE MOLÉCULAS */}
      {pantalla === "moleculas" && (
        <div className="ac-box">
          <div className="ac-title">🧪 Moléculas válidas</div>
          <p className="ac-subtitulo">Estas son las combinaciones que reconoce el juego</p>
          <div className="ac-lista-moleculas">
            {Object.values(MOLECULAS_DICCIONARIO).map((mol) => (
              <div key={mol.formula} className="ac-molecula-fila">
                <div>
                  <div className="ac-molecula-formula">{mol.formula}</div>
                  <div className="ac-molecula-nombre">{mol.nombre}</div>
                </div>
                <div className="ac-molecula-atomos">
                  {Object.entries(mol.atomosNecesarios).map(([simbolo, cantidad]) =>
                    Array.from({ length: cantidad }).map((_, i) => (
                      <span key={simbolo + i} className="ac-mini-atomo" style={{ "--color": ELEMENTOS[simbolo].color }}>
                        {simbolo}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
        </div>
      )}

      {/* MAPA DE NIVELES */}
      {pantalla === "mapa" && (
        <div className="ac-box">
          <div className="ac-mapa-header">
            <div>
              <span className="ac-label">Estudiante</span>
              <h3 className="ac-nombre">{usuario}</h3>
              <span className="ac-guardado">{usandoFirebase ? "☁️ Progreso guardado en la nube" : "💾 Progreso guardado en este navegador"}</span>
            </div>
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={cerrarSesion}>🚪 Salir</button>
          </div>

          <div className="ac-botonera">
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={() => setPantalla("instrucciones")}>❓ Cómo jugar</button>
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={() => setPantalla("moleculas")}>🧪 Moléculas</button>
            <button className="ac-btn ac-btn-chico" onClick={abrirRanking} disabled={cargando}>🏆 Ranking</button>
          </div>

          <div className="ac-mapa-camino">
            {MAPA_NIVELES.map((n, idx) => {
              const desbloqueado = n.id <= nivelMaximo;
              const resultado = progresoNiveles[n.id];
              let estado = "bloqueado";
              if (resultado) estado = "completo";
              else if (desbloqueado) estado = "actual";
              // Los nodos van en zigzag, como el camino de Candy Crush
              const corrimiento = [0, 1, 2, 1][idx % 4];

              return (
                <div
                  key={n.id}
                  className={`ac-nodo ${estado}`}
                  style={{ marginLeft: `${corrimiento * 18}%` }}
                  onClick={() => desbloqueado && iniciarNivel(idx)}
                >
                  <div className="ac-nodo-circulo">{desbloqueado ? n.id : "🔒"}</div>
                  <div className="ac-nodo-info">
                    <div className="ac-nodo-titulo">Nivel {n.id}</div>
                    <div className="ac-nodo-desc">{n.desc}</div>
                    {resultado && <div className="ac-estrellas">{textoEstrellas(resultado.estrellas)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JUEGO EN CURSO */}
      {pantalla === "jugando" && (
        <div className="ac-box ac-box-juego">
          <div className="ac-juego-top">
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={() => setPantalla("mapa")}>← Mapa</button>
            <span className="ac-nivel-etiqueta">Nivel {nivelConfig.id}</span>
          </div>

          <div className="ac-stats-bar">
            <div className="ac-stat"><span>Movs</span><strong style={{ color: "#38bdf8" }}>{movimientosRestantes}</strong></div>
            <div className="ac-stat"><span>Meta</span><strong style={{ color: "#4ade80" }}>{progresoObjetivo}/{nivelConfig.metaCantidad}</strong></div>
            <div className="ac-stat"><span>Tiempo</span><strong style={{ color: tiempoRestante <= 10 ? "#f87171" : "#facc15" }}>{formatearTiempo(tiempoRestante)}</strong></div>
            <div className="ac-stat"><span>Puntos</span><strong>{puntos}</strong></div>
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
                {simbolo} · {ELEMENTOS[simbolo].nombre}
              </span>
            ))}
          </div>

          <p className={`ac-mensaje ${mensaje.tipo}`}>
            {mensaje.texto}
            {combo > 1 && !mensaje.texto && <span className="ac-combo">🔥 Combo x{combo}</span>}
          </p>

          <div className="ac-tablero">
            <div
              className={`ac-grid ${barriendo ? "barriendo" : ""}`}
              onPointerMove={manejarPointerMove}
              onPointerUp={soltarArrastre}
              onPointerLeave={soltarArrastre}
            >
              {grilla.map((fila, f) =>
                fila.map((atomo, c) => {
                  const estaAcierto = celdasAcierto.some((s) => s.fila === f && s.col === c);
                  const estaApretada = origenArrastre && origenArrastre.fila === f && origenArrastre.col === c;
                  const desplazamiento = desplazamientos[`${f}-${c}`];
                  const estilo = {
                    "--color": ELEMENTOS[atomo.elemento].color,
                    animationDelay: barriendo ? `${c * 50}ms` : undefined,
                  };
                  if (desplazamiento) {
                    // 100% = el ancho de la ficha, --hueco = el espacio entre fichas
                    estilo.transform = `translate(calc(${desplazamiento.dx} * (100% + var(--hueco))), calc(${desplazamiento.dy} * (100% + var(--hueco))))`;
                  }

                  let clases = "ac-cell";
                  if (desplazamiento) clases += " moviendo";
                  if (estaAcierto) clases += " acierto";
                  if (estaApretada) clases += " apretada";

                  return (
                    <div
                      key={atomo.id}
                      className={clases}
                      style={estilo}
                      onPointerDown={(e) => manejarPointerDown(e, f, c)}
                    >
                      {atomo.elemento}
                    </div>
                  );
                })
              )}
            </div>

            {carteles.map((cartel) => (
              <div
                key={cartel.id}
                className="ac-cartel"
                style={{
                  left: `${((cartel.col + 0.5) / COLUMNAS) * 100}%`,
                  top: `${((cartel.fila + 0.5) / FILAS) * 100}%`,
                }}
              >
                {cartel.texto}
              </div>
            ))}
          </div>

          <div className="ac-poder">
            <div className="ac-poder-barra">
              <div className="ac-poder-relleno" style={{ width: `${(cargaPoder / PUNTOS_PARA_PODER) * 100}%` }} />
            </div>
            <button
              className={`ac-btn ac-btn-poder ${poderListo ? "listo" : ""}`}
              onClick={usarPoder}
              disabled={!poderListo || bloqueado || juegoTerminado}
            >
              ⚡ Catalizador {poderListo ? "¡LISTO!" : `${cargaPoder}/${PUNTOS_PARA_PODER}`}
            </button>
          </div>

          {nivelCompletado && (
            <div className="ac-resultado">
              {nivelConfig.id === MAPA_NIVELES.length ? (
                <h3 style={{ color: "#facc15" }}>🏆 ¡Completaste AtomiCrush!</h3>
              ) : (
                <h3 style={{ color: "#4ade80" }}>🎉 ¡Nivel Completado!</h3>
              )}
              <div className="ac-estrellas grande">{textoEstrellas(estrellasGanadas)}</div>
              <p>Puntaje del nivel: {puntos} pts (incluye +300 por completarlo)</p>
              {nivelConfig.id < MAPA_NIVELES.length && (
                <button className="ac-btn" onClick={() => iniciarNivel(nivelIndex + 1)}>Siguiente nivel ▶</button>
              )}
              <button className="ac-btn ac-btn-sec" onClick={abrirRanking}>Ver Ranking</button>
              <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
            </div>
          )}

          {(sinMovimientos || sinTiempo) && (
            <div className="ac-resultado">
              <h3 style={{ color: "#f87171" }}>{sinTiempo ? "⏰ Se acabó el tiempo" : "❌ Te quedaste sin movimientos"}</h3>
              <button className="ac-btn" onClick={() => iniciarNivel(nivelIndex)}>Reintentar</button>
              <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("mapa")}>Volver al Mapa</button>
            </div>
          )}
        </div>
      )}

      {/* RANKING */}
      {pantalla === "ranking" && (
        <div className="ac-box">
          <div className="ac-title">🏆 Tabla de Posiciones</div>
          <p className="ac-subtitulo">
            {usandoFirebase ? "Datos de la base de datos (Firebase)" : "Datos guardados en este navegador"}
          </p>

          {ranking.length === 0 && <p className="ac-vacio">Todavía nadie completó un nivel.</p>}

          {ranking.map((item, index) => (
            <div key={item.usuario} className={`ac-lb-row ${index === 0 ? "primero" : ""}`}>
              <div>
                <span className="ac-lb-puesto">#{index + 1}</span>
                <strong>{item.usuario}</strong>
              </div>
              <div>
                <span className="ac-lb-nivel">Nivel {Math.min(item.nivelMaximo, MAPA_NIVELES.length)}</span>
                <strong style={{ color: "#4ade80" }}>{item.puntosTotales} pts</strong>
              </div>
            </div>
          ))}

          <button className="ac-btn ac-btn-sec" style={{ marginTop: "16px" }} onClick={() => setPantalla("mapa")}>
            Volver al Mapa
          </button>
        </div>
      )}
    </div>
  );
}
