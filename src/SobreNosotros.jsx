/* ============================================================
   SOBRE NOSOTROS
   Pantalla propia con el equipo, las tecnologías y el GitHub.
   Se abre desde el login o desde el mapa de niveles.
   ============================================================ */

const URL_GITHUB = "https://github.com/sebastiancallamullo1-netizen/trabajo-atomiCrush";
const URL_JUEGO = "https://atomicrush.vercel.app";

// Cada integrante es un "átomo": iniciales y un color del juego
const INTEGRANTES = [
  { nombre: "Santiago Battiston", iniciales: "SB", color: "#38bdf8" },
  { nombre: "Sebastián Callamullo", iniciales: "SC", color: "#a78bfa" },
  { nombre: "Ignacio Kozak", iniciales: "IK", color: "#f472b6" },
  { nombre: "Dylan Ugarte", iniciales: "DU", color: "#4ade80" },
];

const TECNOLOGIAS = ["React", "Vite", "Supabase", "PostgreSQL", "Vercel"];

// Logo oficial de GitHub (el "octocat" en silueta)
function IconoGithub() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function SobreNosotros({ onVolver }) {
  const anio = new Date().getFullYear();

  return (
    <section className="ac-nosotros">
      <div className="ac-nosotros-arriba">
        <button className="ac-btn ac-btn-sec ac-btn-chico" onClick={onVolver}>← Volver</button>
      </div>

      <div className="ac-nosotros-etiqueta">⚛ Sobre nosotros</div>
      <h2 className="ac-nosotros-titulo">Detrás de AtomiCrush</h2>
      <p className="ac-nosotros-texto">
        Somos un grupo de estudiantes de 7mo año que hizo AtomiCrush. La idea fue simple: aprender química jugando, combinando átomos para
        formar moléculas reales como en un juego de encastrar.
      </p>

      <h3 className="ac-nosotros-subtitulo">👥 El equipo</h3>
      <div className="ac-equipo">
        {INTEGRANTES.map((p) => (
          <div key={p.nombre} className="ac-integrante" style={{ "--color": p.color }}>
            <div className="ac-integrante-atomo">
              <span>{p.iniciales}</span>
            </div>
            <div className="ac-integrante-nombre">{p.nombre}</div>
          </div>
        ))}
      </div>

      <h3 className="ac-nosotros-subtitulo">🛠️ Con qué lo hicimos</h3>
      <div className="ac-tecnologias">
        {TECNOLOGIAS.map((t) => (
          <span key={t} className="ac-tecnologia">{t}</span>
        ))}
      </div>

      <h3 className="ac-nosotros-subtitulo">💻 El proyecto</h3>
      <div className="ac-enlaces">
        <a className="ac-github-tarjeta" href={URL_GITHUB} target="_blank" rel="noopener noreferrer">
          <span className="ac-github-icono"><IconoGithub /></span>
          <span className="ac-github-textos">
            <span className="ac-github-titulo">Mirá el código en GitHub</span>
            <span className="ac-github-ruta">sebastiancallamullo1-netizen/trabajo-atomiCrush</span>
          </span>
          <span className="ac-github-flecha" aria-hidden="true">→</span>
        </a>
        <a className="ac-enlace-juego" href={URL_JUEGO} target="_blank" rel="noopener noreferrer">
          🎮 Jugar online · atomicrush.vercel.app
        </a>
      </div>

      <p className="ac-nosotros-creditos">
        © {anio} AtomiCrush · Hecho por Battiston, Callamullo, Kozak y Ugarte
      </p>
    </section>
  );
}
