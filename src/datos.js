/* ============================================================
   DATOS DEL JUEGO
   Elementos, moléculas válidas y niveles. Para agregar un nivel
   o una molécula nueva alcanza con agregar un objeto acá.
   ============================================================ */

// Diccionario de elementos: símbolo -> nombre y color de la ficha
export const ELEMENTOS = {
  H: { nombre: "Hidrógeno", color: "#3B82F6" },
  O: { nombre: "Oxígeno", color: "#EF4444" },
  C: { nombre: "Carbono", color: "#6B7280" },
  N: { nombre: "Nitrógeno", color: "#10B981" },
  Na: { nombre: "Sodio", color: "#8B5CF6" },
  Cl: { nombre: "Cloro", color: "#22C55E" },
  Ca: { nombre: "Calcio", color: "#F59E0B" },
  Mg: { nombre: "Magnesio", color: "#EC4899" },
  K: { nombre: "Potasio", color: "#D946EF" },
  He: { nombre: "Helio (gas noble)", color: "#67E8F9" },
  Ne: { nombre: "Neón (gas noble)", color: "#FB923C" },
};

// Gases nobles: obstáculos que no reaccionan con nada
export const GASES_NOBLES = ["He", "Ne"];

// Moléculas válidas: qué átomos y cuántos de cada uno hacen falta
export const MOLECULAS_DICCIONARIO = {
  H2O: { formula: "H2O", nombre: "Agua", atomosNecesarios: { H: 2, O: 1 },
    dato: "Cubre más del 70% de la superficie de la Tierra y forma cerca del 60% del cuerpo humano." },
  O2: { formula: "O2", nombre: "Oxígeno", atomosNecesarios: { O: 2 },
    dato: "Es el gas que respiramos: forma alrededor del 21% del aire." },
  H2: { formula: "H2", nombre: "Hidrógeno", atomosNecesarios: { H: 2 },
    dato: "El hidrógeno es el elemento más abundante del universo. El Sol obtiene su energía uniendo átomos de hidrógeno." },
  N2: { formula: "N2", nombre: "Nitrógeno", atomosNecesarios: { N: 2 },
    dato: "Es el gas más abundante del aire que respiramos: cerca del 78%." },
  NaCl: { formula: "NaCl", nombre: "Sal", atomosNecesarios: { Na: 1, Cl: 1 },
    dato: "Es la sal de mesa. Cada litro de agua de mar tiene unos 35 gramos de sal." },
  CO2: { formula: "CO2", nombre: "Dióxido de Carbono", atomosNecesarios: { C: 1, O: 2 },
    dato: "Lo exhalamos al respirar, y las plantas lo usan para hacer la fotosíntesis." },
  NH3: { formula: "NH3", nombre: "Amoníaco", atomosNecesarios: { N: 1, H: 3 },
    dato: "Se usa para fabricar fertilizantes y está en muchos productos de limpieza." },
  CH4: { formula: "CH4", nombre: "Metano", atomosNecesarios: { C: 1, H: 4 },
    dato: "Es el componente principal del gas natural que se usa para cocinar y calefaccionar." },
  CaO: { formula: "CaO", nombre: "Óxido de Calcio (cal)", atomosNecesarios: { Ca: 1, O: 1 },
    dato: "Es la cal viva. Se usa para fabricar cemento y en la construcción desde hace miles de años." },
  MgO: { formula: "MgO", nombre: "Óxido de Magnesio", atomosNecesarios: { Mg: 1, O: 1 },
    dato: "Aguanta temperaturas altísimas, por eso se usa en los ladrillos que recubren hornos industriales." },
  KCl: { formula: "KCl", nombre: "Cloruro de Potasio", atomosNecesarios: { K: 1, Cl: 1 },
    dato: "Se usa como \"sal light\" porque tiene el gusto salado de la sal común pero sin sodio." },
  KOH: { formula: "KOH", nombre: "Hidróxido de Potasio", atomosNecesarios: { K: 1, O: 1, H: 1 },
    dato: "Es una base muy fuerte: se usa para fabricar jabones blandos y en las pilas alcalinas." },
  K2O: { formula: "K2O", nombre: "Óxido de Potasio", atomosNecesarios: { K: 2, O: 1 },
    dato: "Los fertilizantes indican cuánto potasio tienen como porcentaje de K2O, porque las plantas lo necesitan para crecer." },
  CaCl2: { formula: "CaCl2", nombre: "Cloruro de Calcio", atomosNecesarios: { Ca: 1, Cl: 2 },
    dato: "Se tira en las rutas nevadas para derretir el hielo, y también absorbe la humedad del aire." },
};

// Mapa de 15 niveles. "pool" son los elementos que pueden aparecer en la
// grilla, "tiempoSegundos" es el límite del cronómetro y "probGasNoble"
// es la probabilidad de que aparezca un gas noble (obstáculo).
export const MAPA_NIVELES = [
  { id: 1, tipo: "FORMULA", metaFormula: "H2O", metaCantidad: 6, movimientos: 9, tiempoSegundos: 58, pool: ["H", "O", "N"], desc: "Formá 6 moléculas de Agua (H2O)" },
  { id: 2, tipo: "FORMULA", metaFormula: "O2", metaCantidad: 5, movimientos: 10, tiempoSegundos: 65, pool: ["O", "H", "N"], desc: "Formá 5 moléculas de Oxígeno (O2)" },
  { id: 3, tipo: "ELEMENTO", metaElemento: "O", metaCantidad: 14, movimientos: 10, tiempoSegundos: 65, pool: ["O", "H", "N", "Mg"], probGasNoble: 0.06, desc: "Recolectá 14 átomos de Oxígeno (O)" },
  { id: 4, tipo: "FORMULA", metaFormula: "NaCl", metaCantidad: 5, movimientos: 8, tiempoSegundos: 52, pool: ["Na", "Cl", "H", "O", "Mg"], probGasNoble: 0.06, desc: "Formá 5 moléculas de Sal (NaCl)" },
  { id: 5, tipo: "ELEMENTO", metaElemento: "N", metaCantidad: 12, movimientos: 9, tiempoSegundos: 58, pool: ["N", "H", "O", "C"], probGasNoble: 0.06, desc: "Juntá 12 átomos de Nitrógeno (N)" },
  { id: 6, tipo: "FORMULA", metaFormula: "CO2", metaCantidad: 5, movimientos: 9, tiempoSegundos: 58, pool: ["C", "O", "H", "Ca"], probGasNoble: 0.09, desc: "Formá 5 moléculas de Dióxido de Carbono" },
  { id: 7, tipo: "MULTIPLES_MOLECULAS", metaCantidad: 4, movimientos: 7, tiempoSegundos: 46, pool: ["H", "O", "N", "C", "Na", "Cl"], probGasNoble: 0.09, desc: "Formá 4 moléculas DISTINTAS en el nivel" },
  { id: 8, tipo: "FORMULA", metaFormula: "NH3", metaCantidad: 4, movimientos: 11, tiempoSegundos: 72, pool: ["N", "H", "O", "C"], probGasNoble: 0.09, desc: "Formá 4 moléculas de Amoníaco (NH3)" },
  { id: 9, tipo: "ELEMENTO", metaElemento: "C", metaCantidad: 14, movimientos: 17, tiempoSegundos: 110, pool: ["C", "H", "O", "N", "Ca"], probGasNoble: 0.12, desc: "Recolectá 14 átomos de Carbono (C)" },
  { id: 10, tipo: "FORMULA", metaFormula: "CH4", metaCantidad: 3, movimientos: 16, tiempoSegundos: 104, pool: ["C", "H", "O", "Ca"], probGasNoble: 0.12, desc: "Formá 3 moléculas de Metano (CH4)" },
  { id: 11, tipo: "FORMULA", metaFormula: "KCl", metaCantidad: 6, movimientos: 7, tiempoSegundos: 65, pool: ["K", "Cl", "Na", "O"], probGasNoble: 0.09, desc: "Formá 6 moléculas de Cloruro de Potasio (KCl)" },
  { id: 12, tipo: "FORMULA", metaFormula: "KOH", metaCantidad: 5, movimientos: 8, tiempoSegundos: 78, pool: ["K", "O", "H", "Cl"], probGasNoble: 0.09, desc: "Formá 5 moléculas de Hidróxido de Potasio (KOH)" },
  { id: 13, tipo: "ELEMENTO", metaElemento: "Cl", metaCantidad: 14, movimientos: 12, tiempoSegundos: 78, pool: ["Cl", "K", "Ca", "Na", "H"], probGasNoble: 0.12, desc: "Recolectá 14 átomos de Cloro (Cl)" },
  { id: 14, tipo: "FORMULA", metaFormula: "CaCl2", metaCantidad: 5, movimientos: 9, tiempoSegundos: 90, pool: ["Ca", "Cl", "K", "O"], probGasNoble: 0.12, desc: "Formá 5 moléculas de Cloruro de Calcio (CaCl2)" },
  { id: 15, tipo: "MULTIPLES_MOLECULAS", metaCantidad: 6, movimientos: 7, tiempoSegundos: 80, pool: ["K", "Cl", "Ca", "O", "H", "Na"], probGasNoble: 0.12, desc: "Nivel Final: Formá 6 moléculas DISTINTAS" },
];

// Preguntas de química que aparecen al ganar cada nivel (se elige una al azar).
// "correcta" es la posición de la respuesta correcta en "opciones" (empieza en 0).
// "explicacion" se muestra después de responder, acierte o no.
export const PREGUNTAS = {
  1: [
    { pregunta: "¿Cuántos átomos de hidrógeno tiene una molécula de agua (H2O)?", opciones: ["1", "2", "3"], correcta: 1,
      explicacion: "El 2 de H2O indica que hay 2 átomos de hidrógeno por cada átomo de oxígeno." },
    { pregunta: "¿Qué elementos forman el agua?", opciones: ["Hidrógeno y oxígeno", "Hidrógeno y nitrógeno", "Oxígeno y carbono"], correcta: 0,
      explicacion: "El agua está formada por hidrógeno (H) y oxígeno (O)." },
  ],
  2: [
    { pregunta: "¿Qué porcentaje del aire es oxígeno (O2)?", opciones: ["Cerca del 21%", "Cerca del 50%", "Cerca del 78%"], correcta: 0,
      explicacion: "El oxígeno es cerca del 21% del aire; el 78% es nitrógeno." },
    { pregunta: "La molécula O2 está formada por...", opciones: ["Dos átomos de oxígeno", "Un átomo de oxígeno y uno de hidrógeno", "Dos elementos distintos"], correcta: 0,
      explicacion: "O2 son dos átomos del mismo elemento, el oxígeno, unidos entre sí." },
  ],
  3: [
    { pregunta: "¿Cuál es el símbolo químico del oxígeno?", opciones: ["Ox", "O", "Og"], correcta: 1,
      explicacion: "El oxígeno se representa con la letra O." },
    { pregunta: "¿Qué proceso de los seres vivos necesita oxígeno?", opciones: ["La respiración", "La fotosíntesis", "La digestión del agua"], correcta: 0,
      explicacion: "En la respiración las células usan oxígeno para obtener energía." },
  ],
  4: [
    { pregunta: "¿Cuál es la fórmula de la sal de mesa?", opciones: ["NaCl", "KCl", "CaO"], correcta: 0,
      explicacion: "La sal de mesa es cloruro de sodio: un átomo de sodio (Na) y uno de cloro (Cl)." },
    { pregunta: "¿Qué símbolo tiene el sodio?", opciones: ["S", "So", "Na"], correcta: 2,
      explicacion: "Na viene de \"natrium\", el nombre del sodio en latín." },
  ],
  5: [
    { pregunta: "¿Cuál es el gas más abundante del aire?", opciones: ["Oxígeno", "Nitrógeno", "Dióxido de carbono"], correcta: 1,
      explicacion: "El nitrógeno (N2) es cerca del 78% del aire que respiramos." },
    { pregunta: "¿Qué símbolo tiene el nitrógeno?", opciones: ["N", "Ni", "Nt"], correcta: 0,
      explicacion: "El nitrógeno se representa con la letra N." },
  ],
  6: [
    { pregunta: "¿Cuántos átomos de oxígeno tiene el CO2?", opciones: ["1", "2", "3"], correcta: 1,
      explicacion: "CO2: un átomo de carbono y dos de oxígeno." },
    { pregunta: "¿Qué hacen las plantas con el CO2?", opciones: ["Lo usan en la fotosíntesis", "Lo convierten en agua", "No lo usan"], correcta: 0,
      explicacion: "En la fotosíntesis las plantas toman CO2 y liberan oxígeno." },
  ],
  7: [
    { pregunta: "¿Cuál de estas es una molécula formada por un solo elemento?", opciones: ["H2O", "N2", "NaCl"], correcta: 1,
      explicacion: "N2 tiene dos átomos del mismo elemento. Las otras combinan elementos distintos." },
    { pregunta: "¿Qué es un compuesto?", opciones: ["Una sustancia con un solo tipo de átomo", "Una sustancia formada por dos o más elementos distintos", "Una mezcla de agua y sal"], correcta: 1,
      explicacion: "Un compuesto une átomos de elementos distintos, como el agua (H y O)." },
  ],
  8: [
    { pregunta: "¿Cuál es la fórmula del amoníaco?", opciones: ["NH3", "NO2", "N2H"], correcta: 0,
      explicacion: "El amoníaco tiene un átomo de nitrógeno y tres de hidrógeno: NH3." },
    { pregunta: "¿Para qué se usa mucho el amoníaco?", opciones: ["Para fabricar fertilizantes", "Para hacer vidrio", "Como combustible de autos"], correcta: 0,
      explicacion: "La mayor parte del amoníaco se usa para fabricar fertilizantes." },
  ],
  9: [
    { pregunta: "¿Qué símbolo tiene el carbono?", opciones: ["Ca", "C", "Cr"], correcta: 1,
      explicacion: "El carbono es C. Ca es el calcio." },
    { pregunta: "¿Por qué el helio y el neón no forman moléculas en el juego?", opciones: ["Porque son gases nobles y casi no reaccionan", "Porque son metales", "Porque son muy pesados"], correcta: 0,
      explicacion: "Los gases nobles tienen su última capa de electrones completa, por eso casi no reaccionan." },
  ],
  10: [
    { pregunta: "¿Cuántos átomos de hidrógeno tiene el metano (CH4)?", opciones: ["2", "3", "4"], correcta: 2,
      explicacion: "El 4 de CH4 indica cuatro átomos de hidrógeno unidos a un carbono." },
    { pregunta: "¿Dónde se usa el metano en la vida diaria?", opciones: ["En el gas natural para cocinar", "En la sal de mesa", "En el agua de la canilla"], correcta: 0,
      explicacion: "El gas natural de la cocina es principalmente metano." },
  ],
  11: [
    { pregunta: "¿Qué símbolo tiene el potasio?", opciones: ["P", "Po", "K"], correcta: 2,
      explicacion: "K viene de \"kalium\", el nombre del potasio en latín. P es el fósforo." },
    { pregunta: "¿Por qué el KCl se usa como \"sal light\"?", opciones: ["Porque es salado pero no tiene sodio", "Porque no tiene gusto", "Porque tiene azúcar"], correcta: 0,
      explicacion: "El cloruro de potasio tiene gusto salado y reemplaza al sodio de la sal común." },
  ],
  12: [
    { pregunta: "¿Cuántos átomos en total tiene una molécula de KOH?", opciones: ["2", "3", "4"], correcta: 1,
      explicacion: "KOH: un potasio (K), un oxígeno (O) y un hidrógeno (H). Son 3 átomos." },
    { pregunta: "El hidróxido de potasio (KOH) es...", opciones: ["Un ácido", "Una base", "Un gas noble"], correcta: 1,
      explicacion: "Los hidróxidos como el KOH son bases; se usan, por ejemplo, para hacer jabón." },
  ],
  13: [
    { pregunta: "¿Qué símbolo tiene el cloro?", opciones: ["C", "Cl", "Co"], correcta: 1,
      explicacion: "El cloro es Cl. C es el carbono y Co es el cobalto." },
    { pregunta: "¿Para qué se usa el cloro en las piletas?", opciones: ["Para matar microbios", "Para darle color al agua", "Para calentar el agua"], correcta: 0,
      explicacion: "El cloro desinfecta: elimina bacterias y otros microbios del agua." },
  ],
  14: [
    { pregunta: "¿Cuántos átomos de cloro tiene el CaCl2?", opciones: ["1", "2", "3"], correcta: 1,
      explicacion: "CaCl2: un átomo de calcio y dos de cloro." },
    { pregunta: "¿Para qué se tira cloruro de calcio en las rutas con nieve?", opciones: ["Para derretir el hielo", "Para que brille", "Para que se forme más nieve"], correcta: 0,
      explicacion: "El cloruro de calcio baja la temperatura a la que se congela el agua, y así el hielo se derrite." },
  ],
  15: [
    { pregunta: "¿Qué indican los números chiquitos de una fórmula, como el 2 de H2O?", opciones: ["Cuántos átomos de ese elemento hay", "La temperatura", "Cuántas moléculas hay"], correcta: 0,
      explicacion: "El subíndice dice cuántos átomos de ese elemento tiene la molécula." },
    { pregunta: "¿Cuál de estos elementos es un metal?", opciones: ["Potasio (K)", "Cloro (Cl)", "Oxígeno (O)"], correcta: 0,
      explicacion: "El potasio es un metal; el cloro y el oxígeno son no metales." },
  ],
};
