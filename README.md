# AtomiCrush — Juego educativo de Química

Proyecto de PISWD (Prof. Diego Callamullo) — 7mo año.
Integrantes: Santiago Battiston, Sebastián Callamullo, Ignacio Kozak, Dylan Ugarte.

## Cómo abrir el juego

**Opción 1 (sin instalar nada):** abrir con doble clic el archivo `index.html` (o directamente `docs/index.html`).
Es la versión ya armada del juego, todo en un solo archivo, y funciona en cualquier navegador.

**Opción 2 (para programar):**

```
npm install
npm run dev
```

y entrar a `http://localhost:5173`.

Después de hacer cambios en el código, correr `npm run build` para actualizar la versión de `docs/`.

## Cómo está organizado el código

| Archivo | Qué tiene |
|---|---|
| `src/datos.js` | Elementos, moléculas válidas y los 10 niveles |
| `src/logica.js` | Generación del tablero, gravedad, detección de moléculas en línea, poder Catalizador, estrellas |
| `src/firebase.js` | Base de datos: guardar/cargar el progreso de cada jugador y el ranking |
| `src/App.jsx` | Pantallas, estados del juego y eventos del usuario |
| `src/App.css` | Estilos y animaciones |

## Base de datos (Firebase)

El progreso se guarda en Firebase Firestore (colección `jugadores`).
Mientras `firebaseConfig` en `src/firebase.js` esté vacío, el juego guarda en el navegador (localStorage) y funciona igual.
