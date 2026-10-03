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
  buscarJugadaPosible,
  buscarGasesVecinos,
  buscarMoleculaEnCadena,
  ultimoIdCreado,
  esGasNoble,
  calcularAvancePoder,
  calcularEstrellas,
  formatearTiempo,
} from "./logica.js";
import { cargarJugador, guardarJugador, cargarRanking, usandoFirebase } from "./firebase.js";
import { sonar, estaSilenciado, alternarSonido } from "./sonidos.js";

/* ============================================================
   ATOMICRUSH - Juego Educativo de Química
   Pantallas: login, instrucciones, mapa, álbum, juego y ranking
   ============================================================ */

// Cuánto tarda la animación de deslizar una ficha (en milisegundos)
const DURACION_DESLIZAR = 180;
// Cuántos píxeles hay que arrastrar para que cuente como movimiento
const DISTANCIA_MINIMA = 20;
// Segundos sin mover nada hasta que aparece la pista
const SEGUNDOS_PISTA = 6;
// Máximo de moléculas que se pueden formar solas seguidas
const MAXIMO_CADENA = 3;

// Muestra de 0 a 3 estrellas, por ejemplo "★★☆"
function textoEstrellas(cantidad) {
  return "★".repeat(cantidad) + "☆".repeat(3 - cantidad);
}

// Dibuja los átomos de una molécula como bolitas de colores
function MiniAtomos({ molecula }) {
  return (
    <div className="ac-molecula-atomos">
      {Object.entries(molecula.atomosNecesarios).map(([simbolo, cantidad]) =>
        Array.from({ length: cantidad }).map((_, i) => (
          <span key={simbolo + i} className="ac-mini-atomo" style={{ "--color": ELEMENTOS[simbolo].color }}>
            {simbolo}
          </span>
        ))
      )}
    </div>
  );
}

export default function App() {
  // ---------- Jugador y pantallas ----------
  const [usuario, setUsuario] = useState("");
  const [pantalla, setPantalla] = useState("login");
  const [cargando, setCargando] = useState(false);
  const [nivelMaximo, setNivelMaximo] = useState(1);
  // Mejor puntaje y estrellas de cada nivel: { 1: { puntos, estrellas }, ... }
  const [progresoNiveles, setProgresoNiveles] = useState({});
  // Fórmulas de las moléculas que el jugador ya descubrió: ["H2O", "O2", ...]
  const [album, setAlbum] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [silencio, setSilencio] = useState(estaSilenciado());

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
  // Moléculas recién descubiertas que falta mostrar. Es una fila (cola):
  // si en una cadena se descubren dos, se muestran una después de la otra.
  const [tarjetas, setTarjetas] = useState([]);
  const [pista, setPista] = useState(null); // jugada sugerida { a, b }

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
  const tarjeta = tarjetas.length > 0 ? tarjetas[0] : null;

  // Cronómetro del nivel: baja de a 1 segundo mientras se está jugando.
  // Se frena si se ganó, se perdió o si está abierta la tarjeta de una molécula nueva.
  useEffect(() => {
    if (pantalla !== "jugando" || nivelCompletado || sinMovimientos || sinTiempo || tarjeta) return;

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
  }, [pantalla, nivelCompletado, sinMovimientos, sinTiempo, nivelIndex, tarjeta]);

  // Pista: si pasan SEGUNDOS_PISTA sin que el jugador haga nada, se marca
  // una jugada posible. Cada vez que cambia la grilla o el jugador toca una
  // ficha (la pista vuelve a null), el reloj empieza de nuevo.
  useEffect(() => {
    if (pantalla !== "jugando" || bloqueado || juegoTerminado || tarjeta || pista) return;
    const espera = setTimeout(() => setPista(buscarJugadaPosible(grilla)), SEGUNDOS_PISTA * 1000);
    return () => clearTimeout(espera);
  }, [grilla, pantalla, bloqueado, juegoTerminado, tarjeta, pista]);

  // Sonido de derrota cuando se acaban los movimientos o el tiempo
  useEffect(() => {
    if (sinMovimientos || sinTiempo) sonar("derrota");
  }, [sinMovimientos, sinTiempo]);

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
      setAlbum(datos.album || []);
      setPantalla("mapa");
    } else {
      setNivelMaximo(1);
      setProgresoNiveles({});
      setAlbum([]);
      setPantalla("instrucciones");
    }
  };

  const cerrarSesion = () => {
    setUsuario("");
    setNivelMaximo(1);
    setProgresoNiveles({});
    setAlbum([]);
    setPantalla("login");
  };

  const abrirRanking = async () => {
    setCargando(true);
    setRanking(await cargarRanking());
    setCargando(false);
    setPantalla("ranking");
  };

  // Guarda en la base de datos todo lo del jugador. "cambios" trae los
  // datos nuevos (por ejemplo el álbum actualizado); el resto se toma
  // del estado actual.
  const guardarDatos = (cambios) => {
    const datos = {
      usuario: usuario.trim(),
      nivelMaximo,
      niveles: progresoNiveles,
      album,
      ...cambios,
    };
    // El puntaje total es la suma del mejor puntaje de cada nivel.
    // Así repetir el nivel 1 muchas veces no infla el ranking.
    let puntosTotales = 0;
    Object.values(datos.niveles).forEach((nivel) => {
      puntosTotales += nivel.puntos;
    });
    datos.puntosTotales = puntosTotales;
    guardarJugador(usuario.trim(), datos);
  };

  // Al ganar: se guarda el resultado del nivel si mejoró el anterior
  const guardarResultado = (puntosFinales, estrellas, albumActual) => {
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
    setProgresoNiveles(nuevoProgreso);
    setNivelMaximo(nuevoMaximo);
    guardarDatos({ niveles: nuevoProgreso, nivelMaximo: nuevoMaximo, album: albumActual });
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
    setTarjetas([]);
    setPista(null);
    setMensaje({ texto: "", tipo: "" });
    setPantalla("jugando");
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    if (tipo === "error") setTimeout(() => setMensaje({ texto: "", tipo: "" }), 1400);
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
      id: Date.now() + Math.random(),
      texto,
      fila: sumaFilas / celdas.length,
      col: sumaCols / celdas.length,
    };
    setCarteles((actuales) => [...actuales, nuevo]);
    setTimeout(() => setCarteles((actuales) => actuales.filter((c) => c.id !== nuevo.id)), 900);
  };

  const cambiarSonido = () => setSilencio(alternarSonido());

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
    setPista(null);

    // Los gases nobles no reaccionan: no se pueden mover
    if (esGasNoble(grilla[a.fila][a.col].elemento) || esGasNoble(grilla[b.fila][b.col].elemento)) {
      sonar("error");
      mostrarMensaje("🚫 Los gases nobles no reaccionan: se liberan formando una molécula al lado", "error");
      return;
    }

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
        sonar("error");
        mostrarMensaje("❌ Ese movimiento no forma ninguna molécula", "error");
        setTimeout(() => {
          setDesplazamientos({});
          setBloqueado(false);
        }, DURACION_DESLIZAR);
        return;
      }

      // Forma una molécula: el intercambio queda y se procesa
      setDesplazamientos({});
      setGrilla(grillaNueva);

      // "estado" lleva los valores de la jugada de un paso al siguiente
      // (los estados de React no se actualizan hasta el próximo render)
      const estado = {
        movimientos: movimientosRestantes - 1,
        progreso: progresoObjetivo,
        puntos,
        combo,
        carga: cargaPoder,
        usadas: moleculasDistintasUsadas,
        album,
      };
      procesarMolecula(grillaNueva, resultado, estado, 0);
    }, DURACION_DESLIZAR);
  };

  // Hace brillar la molécula (y los gases nobles pegados), la aplica y
  // después revisa si los átomos que cayeron formaron otra molécula de
  // la meta: eso es la reacción en cadena. numeroCadena = 0 es la jugada
  // del jugador, 1 o más son moléculas que se formaron solas.
  const procesarMolecula = (grillaActual, resultado, estado, numeroCadena) => {
    const gases = buscarGasesVecinos(grillaActual, resultado.celdas);
    setCeldasAcierto([...resultado.celdas, ...gases]);

    setTimeout(() => {
      setCeldasAcierto([]);
      const idAnterior = ultimoIdCreado();
      const { grillaNueva, estadoNuevo } = aplicarMolecula(grillaActual, resultado, gases, estado, numeroCadena);
      setGrilla(grillaNueva);

      if (estadoNuevo.progreso >= nivelConfig.metaCantidad) {
        ganarNivel(estadoNuevo.puntos, estadoNuevo.movimientos, estadoNuevo.album);
        setBloqueado(false);
        return;
      }

      // Esperamos a que caigan las fichas y buscamos una reacción en cadena
      setTimeout(() => {
        const cadena = numeroCadena < MAXIMO_CADENA ? buscarMoleculaEnCadena(grillaNueva, nivelConfig, idAnterior) : null;
        if (cadena) {
          procesarMolecula(grillaNueva, cadena, estadoNuevo, numeroCadena + 1);
        } else {
          terminarJugada(grillaNueva, estadoNuevo);
        }
      }, 350);
    }, 300);
  };

  // Aplica el resultado de una molécula: progreso, combo, puntos, poder,
  // álbum y saca los átomos (más los gases liberados) con gravedad.
  const aplicarMolecula = (grillaActual, resultado, gases, estado, numeroCadena) => {
    const { molecula, celdas } = resultado;

    let avance = 0;
    if (nivelConfig.tipo === "FORMULA" && molecula.formula === nivelConfig.metaFormula) {
      avance = 1;
    } else if (nivelConfig.tipo === "ELEMENTO") {
      celdas.forEach(({ fila, col }) => {
        if (grillaActual[fila][col].elemento === nivelConfig.metaElemento) avance++;
      });
    } else if (nivelConfig.tipo === "MULTIPLES_MOLECULAS" && !estado.usadas.has(molecula.formula)) {
      avance = 1;
    }
    const usadas = new Set(estado.usadas);
    usadas.add(molecula.formula);

    // Puntos: 50 por cada átomo de la molécula y 25 por cada gas liberado.
    // Combo: cada acierto seguido suma 15% extra, con tope de +75%.
    const comboNuevo = estado.combo + 1;
    const bonusCombo = Math.min(comboNuevo - 1, 5) * 0.15;
    const puntosGanados = Math.round((celdas.length * 50 + gases.length * 25) * (1 + bonusCombo));

    // Álbum: si es la primera vez que forma esta molécula, se agrega
    const esNueva = !estado.album.includes(molecula.formula);
    const albumNuevo = esNueva ? [...estado.album, molecula.formula] : estado.album;

    const estadoNuevo = {
      ...estado,
      progreso: estado.progreso + avance,
      puntos: estado.puntos + puntosGanados,
      combo: comboNuevo,
      carga: Math.min(PUNTOS_PARA_PODER, estado.carga + puntosGanados),
      usadas,
      album: albumNuevo,
    };

    // Actualizamos lo que se ve en pantalla
    setMovimientosRestantes(estadoNuevo.movimientos);
    setProgresoObjetivo(estadoNuevo.progreso);
    setPuntos(estadoNuevo.puntos);
    setCombo(comboNuevo);
    setCargaPoder(estadoNuevo.carga);
    setMoleculasDistintasUsadas(usadas);
    mostrarCartel(`+${puntosGanados}`, celdas);

    let texto = `✅ ¡Formaste ${molecula.nombre} (${molecula.formula})!`;
    if (numeroCadena > 0) texto = `⛓️ ¡Reacción en cadena! Se formó ${molecula.formula} solo`;
    if (comboNuevo > 1) texto += ` 🔥 x${comboNuevo}`;
    if (gases.length > 0) texto += ` · Liberaste ${gases.length} gas noble`;
    mostrarMensaje(texto, "exito");

    sonar(numeroCadena > 0 ? "cadena" : "acierto", comboNuevo);
    if (gases.length > 0) sonar("gas");

    if (esNueva) {
      setAlbum(albumNuevo);
      setTarjetas((actuales) => [...actuales, molecula]);
      sonar("descubrir");
      guardarDatos({ album: albumNuevo });
    }

    // Sacamos los átomos usados y los gases liberados, y caen nuevos
    const grillaConHuecos = grillaActual.map((f) => [...f]);
    [...celdas, ...gases].forEach(({ fila, col }) => {
      grillaConHuecos[fila][col] = null;
    });
    return { grillaNueva: aplicarGravedad(grillaConHuecos, nivelConfig), estadoNuevo };
  };

  // Cuando termina la jugada (y la cadena, si hubo): ¿quedan movimientos?
  // ¿quedan jugadas posibles? Si no, se mezcla el tablero solo.
  const terminarJugada = (grillaActual, estado) => {
    if (estado.movimientos <= 0) {
      setSinMovimientos(true);
    } else if (!buscarJugadaPosible(grillaActual)) {
      setGrilla(generarGrillaInicial(nivelConfig));
      mostrarMensaje("🔄 No quedaban jugadas: se mezcló el tablero", "exito");
    }
    setBloqueado(false);
  };

  const ganarNivel = (puntosDelNivel, movimientosQueSobraron, albumActual) => {
    const estrellas = calcularEstrellas(movimientosQueSobraron, nivelConfig.movimientos);
    const puntosFinales = puntosDelNivel + 300; // bonus por completar el nivel
    setPuntos(puntosFinales);
    setEstrellasGanadas(estrellas);
    setNivelCompletado(true);
    sonar("victoria");
    guardarResultado(puntosFinales, estrellas, albumActual);
  };

  // ---------- Poder especial: Catalizador ----------
  // Se carga sumando puntos. Al usarlo, "barre" todo el tablero:
  // cuenta lo que se podría formar con todos los átomos, suma ese avance
  // a la meta y genera un tablero nuevo. No gasta movimientos.
  const usarPoder = () => {
    if (!poderListo || bloqueado || juegoTerminado) return;

    const { avance, moleculasNuevas } = calcularAvancePoder(grilla, nivelConfig, moleculasDistintasUsadas);
    setPista(null);
    setBloqueado(true);
    setBarriendo(true);
    sonar("poder");

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
        ganarNivel(nuevosPuntos, movimientosRestantes, album);
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
    setPista(null);
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

  const esPista = (f, c) =>
    pista !== null && ((pista.a.fila === f && pista.a.col === c) || (pista.b.fila === f && pista.b.col === c));

  // Elementos que muestra la leyenda: los del pool más los gases nobles si el nivel tiene
  const elementosLeyenda = nivelConfig.probGasNoble ? [...nivelConfig.pool, "He", "Ne"] : nivelConfig.pool;
  const totalMoleculas = Object.keys(MOLECULAS_DICCIONARIO).length;

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
            <li>Si después del cambio queda una <b>línea</b> de átomos que forma una molécula (por ejemplo <b>H O H</b> = agua), la molécula se forma y caen átomos nuevos. Si los átomos que caen forman otra molécula de la meta, hay <b>reacción en cadena</b>.</li>
            <li>Si el cambio no forma nada, los átomos vuelven a su lugar y no perdés el movimiento. Si te trabás, a los {SEGUNDOS_PISTA} segundos aparece una <b>pista</b>.</li>
            <li>Los <b>gases nobles</b> (He, Ne) no reaccionan con nada y no se pueden mover. Para sacarlos, formá una molécula pegada a ellos.</li>
            <li>Al sumar <b>{PUNTOS_PARA_PODER} puntos</b> se carga el poder <b>⚡ Catalizador</b>: barre todo el tablero y avanza tu meta con los átomos que había.</li>
            <li>Cada nivel tiene <b>movimientos</b> y <b>tiempo</b> limitados. Cuantos más movimientos te sobren, más estrellas ganás.</li>
          </ol>
          <button className="ac-btn" onClick={() => setPantalla("mapa")}>▶ Ir al mapa de niveles</button>
          <button className="ac-btn ac-btn-sec" onClick={() => setPantalla("album")}>📖 Ver álbum de moléculas</button>
        </div>
      )}

      {/* ÁLBUM DE MOLÉCULAS */}
      {pantalla === "album" && (
        <div className="ac-box">
          <div className="ac-title">📖 Álbum de moléculas</div>
          <p className="ac-subtitulo">
            Descubriste {album.length} de {totalMoleculas}. Formá una molécula para desbloquear su dato curioso.
          </p>
          <div className="ac-lista-moleculas">
            {Object.values(MOLECULAS_DICCIONARIO).map((mol) => {
              const descubierta = album.includes(mol.formula);
              return (
                <div key={mol.formula} className={`ac-molecula-fila ${descubierta ? "" : "oculta"}`}>
                  <div className="ac-molecula-encabezado">
                    <div>
                      <div className="ac-molecula-formula">{mol.formula}</div>
                      <div className="ac-molecula-nombre">{mol.nombre}</div>
                    </div>
                    <MiniAtomos molecula={mol} />
                  </div>
                  <div className="ac-molecula-dato">{descubierta ? mol.dato : "🔒 Todavía no la formaste"}</div>
                </div>
              );
            })}
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
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={() => setPantalla("album")}>📖 Álbum {album.length}/{totalMoleculas}</button>
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
            <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={cambiarSonido} title="Sonido">
              {silencio ? "🔇" : "🔊"}
            </button>
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
            {elementosLeyenda.map((simbolo) => (
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
                  if (esGasNoble(atomo.elemento)) clases += " noble";
                  if (desplazamiento) clases += " moviendo";
                  if (estaAcierto) clases += " acierto";
                  if (estaApretada) clases += " apretada";
                  if (esPista(f, c)) clases += " pista";

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

          {/* Tarjeta de molécula descubierta (frena el cronómetro) */}
          {tarjeta && !juegoTerminado && (
            <div className="ac-resultado ac-tarjeta">
              <div className="ac-tarjeta-titulo">✨ ¡Nueva molécula descubierta!</div>
              <div className="ac-tarjeta-formula">{tarjeta.formula}</div>
              <div className="ac-molecula-nombre">{tarjeta.nombre}</div>
              <MiniAtomos molecula={tarjeta} />
              <p className="ac-tarjeta-dato">{tarjeta.dato}</p>
              <p className="ac-tarjeta-album">Se guardó en tu álbum ({album.length}/{totalMoleculas})</p>
              <button className="ac-btn" onClick={() => setTarjetas((actuales) => actuales.slice(1))}>
                {tarjetas.length > 1 ? "Siguiente ▶" : "¡Seguir jugando!"}
              </button>
            </div>
          )}

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
