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
};

// Moléculas válidas: qué átomos y cuántos de cada uno hacen falta
export const MOLECULAS_DICCIONARIO = {
  H2O: { formula: "H2O", nombre: "Agua", atomosNecesarios: { H: 2, O: 1 } },
  O2: { formula: "O2", nombre: "Oxígeno", atomosNecesarios: { O: 2 } },
  H2: { formula: "H2", nombre: "Hidrógeno", atomosNecesarios: { H: 2 } },
  N2: { formula: "N2", nombre: "Nitrógeno", atomosNecesarios: { N: 2 } },
  NaCl: { formula: "NaCl", nombre: "Sal", atomosNecesarios: { Na: 1, Cl: 1 } },
  CO2: { formula: "CO2", nombre: "Dióxido de Carbono", atomosNecesarios: { C: 1, O: 2 } },
  NH3: { formula: "NH3", nombre: "Amoníaco", atomosNecesarios: { N: 1, H: 3 } },
  CH4: { formula: "CH4", nombre: "Metano", atomosNecesarios: { C: 1, H: 4 } },
};

// Mapa de 10 niveles. "pool" son los elementos que pueden aparecer en la
// grilla y "tiempoSegundos" es el límite del cronómetro.
export const MAPA_NIVELES = [
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
