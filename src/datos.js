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
};

// Mapa de 10 niveles. "pool" son los elementos que pueden aparecer en la
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
  { id: 10, tipo: "FORMULA", metaFormula: "CH4", metaCantidad: 3, movimientos: 16, tiempoSegundos: 104, pool: ["C", "H", "O", "Ca"], probGasNoble: 0.12, desc: "Nivel Final: Formá 3 moléculas de Metano" },
];
