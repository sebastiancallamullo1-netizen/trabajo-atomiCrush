/* ============================================================
   FILTRO DE PALABRAS OFENSIVAS
   No se puede crear una cuenta si el nickname o el correo tienen
   alguna de estas palabras (insultos, groserías, discriminación,
   contenido sexual y violencia, en español de varios países y algo
   de inglés). La misma lista está cargada en la base de datos
   (tablas palabras_prohibidas y palabras_permitidas), así que el
   control también funciona aunque alguien se saltee el juego.
   ============================================================ */

// Se buscan DENTRO del texto: "elboludo22" o "p.u.t.a" también quedan bloqueados.
export const PALABRAS_PROHIBIDAS = [
  // Insultos (Argentina y Uruguay)
  "boludo", "boluda", "pelotudo", "pelotuda", "forro", "forra", "pajero", "pajera", "pajin",
  "conchudo", "conchuda", "concha", "chota", "pija", "poronga", "garca", "salame", "gilazo",
  "chupapija", "chupamela", "chupala", "sorete", "ojete", "cagon", "cagona", "mogolico", "mogolica",
  "mongolico", "mongolica", "conchetumadre", "laconchadetumadre", "lpmqtp", "chupaculo",
  // Insultos (España, México, Chile, Colombia, Venezuela, Perú)
  "gilipollas", "capullo", "subnormal", "cabron", "cabrona", "culero", "culera", "pinche",
  "chingar", "chingada", "chingado", "chingon", "verga", "vergon", "pendejo", "pendeja",
  "huevon", "weon", "aweonao", "conchetumare", "conchesumadre", "malparido", "malparida",
  "gonorrea", "mamaguevo", "mamaguebo", "mamahuevo", "hijueputa", "cojudo", "cojuda", "huevada",
  // Insultos generales
  "imbecil", "idiota", "estupido", "estupida", "tarado", "tarada", "retrasado", "retrasada",
  "anormal", "inutil", "cornudo", "cornuda", "cretino", "cretina", "bastardo", "bastarda",
  "malnacido", "malnacida", "mierda", "mierdoso", "cagada", "carajo", "culiado", "culiao",
  "culeado", "hijodeputa", "hijadeputa", "putamadre", "lagranputa",
  // Contenido sexual
  "puta", "puto", "putita", "putito", "putazo", "putero", "prostituta", "prostituto", "ramera",
  "zorra", "perra", "trola", "trolo", "coger", "cogida", "cogiendo", "follar", "follando",
  "polla", "pollon", "tetas", "tetona", "culona", "culote", "pajearse", "pajeando", "masturb",
  "orgasmo", "orgia", "porno", "pornografia", "sexo", "violador", "violacion", "pedofilo",
  "pederasta", "zoofilia", "incesto", "chupapene", "pene", "vagina", "clitoris", "semen",
  "eyacul", "mamada", "felacion", "nalgas", "pichula", "calentona", "garchar", "garche",
  // Discriminación
  "maricon", "marica", "mariquita", "joto", "punal", "tortillera", "travelo", "trava",
  "negrodemierda", "negrata", "sudaca", "nazi", "hitler", "simio",
  // Drogas y violencia
  "falopa", "cocaina", "porro", "drogadicto", "narco", "asesino", "matar", "suicid",
  "terrorista", "bomba",
  // Inglés
  "fuck", "fucker", "fucking", "motherfucker", "shit", "bitch", "bastard", "asshole", "dick",
  "cock", "pussy", "cunt", "whore", "slut", "nigga", "nigger", "faggot", "retard", "porn", "sex",
];

// Palabras cortas que solo se bloquean si aparecen SOLAS (separadas por
// puntos, guiones, números, etc.), porque también están dentro de
// palabras normales: "gil" en "gilberto", "culo" en "articulo", "mono" en "monopatin".
export const PALABRAS_SOLAS = [
  "gil", "gila", "orto", "teta", "pito", "culo", "pete", "hdp", "lpm", "ctm", "csm", "ptm",
  "kkk", "ass", "tit", "mono", "torta", "bolita", "cono", "anal", "pico", "raja",
];

// Palabras normales que contienen algo de la lista y no se tienen que
// bloquear (por ejemplo "computadora" tiene "puta" adentro).
export const PALABRAS_PERMITIDAS = [
  "comput", "disput", "imput", "reput", "diputad", "amput", "esput",
  "control", "recog", "escog", "acog", "encog",
  "conchita", "concheto", "pijama", "vergara", "georgia", "maricarmen", "maricruz",
  "matarazzo", "matarife", "matare", "carajillo", "bombero", "bombilla", "bombon", "bombard",
  "pinchetti", "pollack", "penelope", "sexto", "sexta", "sextet", "essex", "sussex",
  "dickson", "dickens", "peacock", "hitchcock", "hancock", "cockpit",
];

// Pasa el texto a una forma estándar para comparar: minúsculas, sin tildes
// ni ñ, cambia números y símbolos que se usan para disfrazar letras
// (p0rong4 → poronga) y junta las letras repetidas de más (puuuta → puta).
export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
    .replace(/5/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/@/g, "a").replace(/\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1");
}

// Devuelve true si el texto (nickname o parte del correo) tiene una palabra ofensiva
export function tienePalabraProhibida(texto) {
  const limpio = normalizar(texto);

  // Palabras largas: se miran solo las letras (así "p.u.t.a" queda como "puta"),
  // después de sacar las palabras normales que podrían confundir
  let soloLetras = limpio.replace(/[^a-z]/g, "");
  for (const permitida of PALABRAS_PERMITIDAS) {
    soloLetras = soloLetras.split(permitida).join("-");
  }
  if (PALABRAS_PROHIBIDAS.some((p) => soloLetras.includes(p))) return true;

  // Palabras cortas: se compara cada pedacito del texto por separado,
  // y también el texto entero sin separadores (así "c.u.l.o" queda como "culo")
  const pedazos = limpio.split(/[^a-z]+/);
  return PALABRAS_SOLAS.some((p) => pedazos.includes(p) || limpio.replace(/[^a-z]/g, "") === p);
}
