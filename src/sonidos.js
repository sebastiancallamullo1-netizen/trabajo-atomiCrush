/* ============================================================
   SONIDOS
   No usamos archivos de audio: los sonidos se generan con la
   Web Audio API del navegador. Un "oscilador" produce una nota
   de cierta frecuencia (Hz) y un "gain" controla el volumen,
   que baja rápido para que suene como un "pip".
   ============================================================ */

let contexto = null;
let silenciado = leerPreferencia();

// Recordamos si el jugador apagó el sonido (si el navegador no deja, sigue prendido)
function leerPreferencia() {
  try {
    return localStorage.getItem("atomicrush_silencio") === "si";
  } catch {
    return false;
  }
}

// El navegador solo deja crear el audio después de que el usuario
// tocó algo en la página, por eso se crea recién la primera vez que suena.
function obtenerContexto() {
  if (!contexto) contexto = new AudioContext();
  return contexto;
}

// Toca una nota: frecuencia en Hz, cuándo empieza y cuánto dura (en segundos)
function tocarNota(frecuencia, inicio, duracion, tipo = "sine", volumen = 0.15) {
  const ctx = obtenerContexto();
  const oscilador = ctx.createOscillator();
  const volumenNota = ctx.createGain();
  const momento = ctx.currentTime + inicio;

  oscilador.type = tipo;
  oscilador.frequency.value = frecuencia;
  volumenNota.gain.setValueAtTime(volumen, momento);
  volumenNota.gain.exponentialRampToValueAtTime(0.001, momento + duracion);

  oscilador.connect(volumenNota);
  volumenNota.connect(ctx.destination);
  oscilador.start(momento);
  oscilador.stop(momento + duracion);
}

// Toca el sonido pedido. "combo" hace que el acierto suene más agudo
// mientras más aciertos seguidos lleva el jugador.
export function sonar(nombre, combo = 1) {
  if (silenciado) return;

  if (nombre === "acierto") {
    const base = 440 * Math.pow(1.12, Math.min(combo, 8));
    tocarNota(base, 0, 0.15, "triangle");
    tocarNota(base * 1.5, 0.08, 0.2, "triangle");
  } else if (nombre === "error") {
    tocarNota(160, 0, 0.25, "sawtooth", 0.08);
  } else if (nombre === "gas") {
    tocarNota(1200, 0, 0.1);
    tocarNota(1600, 0.06, 0.15);
  } else if (nombre === "cadena") {
    [660, 880, 1100].forEach((f, i) => tocarNota(f, i * 0.06, 0.15, "triangle"));
  } else if (nombre === "poder") {
    for (let i = 0; i < 8; i++) tocarNota(300 + i * 120, i * 0.05, 0.2, "square", 0.05);
  } else if (nombre === "descubrir") {
    [784, 988, 1175, 1568].forEach((f, i) => tocarNota(f, i * 0.1, 0.25, "sine"));
  } else if (nombre === "victoria") {
    [523, 659, 784, 1047].forEach((f, i) => tocarNota(f, i * 0.12, 0.3, "triangle"));
  } else if (nombre === "derrota") {
    [392, 330, 262].forEach((f, i) => tocarNota(f, i * 0.2, 0.35, "sine"));
  }
}

export function estaSilenciado() {
  return silenciado;
}

// Prende o apaga el sonido y devuelve el estado nuevo
export function alternarSonido() {
  silenciado = !silenciado;
  try {
    localStorage.setItem("atomicrush_silencio", silenciado ? "si" : "no");
  } catch {
    // si no se puede guardar, solo dura hasta recargar la página
  }
  return silenciado;
}
