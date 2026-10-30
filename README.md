# AtomiCrush — Juego educativo de Química

Proyecto de PISWD (Prof. Diego Callamullo) — 7mo año.
Integrantes: Santiago Battiston, Sebastián Callamullo, Ignacio Kozak, Dylan Ugarte.

## Cómo ejecutar el proyecto

El juego está hecho con React y Vite, así que no se abre con doble clic en `index.html`: hay que ejecutarlo con Node.js.

**Requisitos**

- [Node.js](https://nodejs.org) **20.19 o más nuevo** (o 22.12 o más nuevo). Para ver la versión instalada: `node -v`.
- Git, para clonar el repositorio.

**Pasos**

```
git clone https://github.com/sebastiancallamullo1-netizen/trabajo-atomiCrush.git
cd trabajo-atomiCrush
npm install
npm run dev
```

Después abrir en el navegador la dirección que muestra la consola (normalmente `http://localhost:5173`).

**Versión de producción**

```
npm run build
npm run preview
```

`npm run build` arma la versión final del juego en la carpeta `docs/` y `npm run preview` la sirve en `http://localhost:4173`, como lo haría un hosting.

## Cómo está organizado el código

| Archivo | Qué tiene |
|---|---|
| `src/datos.js` | Elementos, moléculas válidas y los 10 niveles |
| `src/logica.js` | Generación del tablero, gravedad, detección de moléculas en línea, poder Catalizador, estrellas |
| `src/baseDeDatos.js` | Conexión con Supabase: registro, inicio de sesión, guardar progreso y ranking |
| `supabase/base_de_datos.sql` | Tablas, reglas de seguridad y funciones de la base de datos |
| `src/App.jsx` | Pantallas, estados del juego y eventos del usuario |
| `src/App.css` | Estilos y animaciones |

## Base de datos y login (Supabase)

Los usuarios, puntajes y el álbum se guardan en [Supabase](https://supabase.com), una base de datos PostgreSQL en internet. El juego se conecta directo desde el navegador; no hace falta PHP ni XAMPP.

1. Crear un proyecto en Supabase.
2. En el proyecto: **SQL Editor** > **New query** > pegar todo `supabase/base_de_datos.sql` > **Run**. Se crean las tablas `perfiles`, `puntajes` y `album`, y las funciones `guardar_progreso` y `ranking`.
3. En **Authentication** > **Sign In / Providers** > **Email**, desactivar **Confirm email** (así los alumnos entran apenas crean la cuenta, sin confirmar el correo).
4. En **Project Settings** > **API Keys** copiar la **Project URL** y la **publishable key** y pegarlas en `src/baseDeDatos.js`.

Las contraseñas las guarda Supabase hasheadas. Cada jugador solo puede ver y modificar sus propios datos, por las reglas de seguridad (RLS) del archivo `.sql`.

## Publicar el juego (Vercel)

El juego está publicado en Vercel, que lo arma y lo sube solo cada vez que se hace push a `main`:

1. Entrar a [vercel.com](https://vercel.com) con la cuenta de GitHub.
2. **Add New** > **Project** > elegir el repositorio `trabajo-atomiCrush` > **Deploy**. La configuración (`npm run build` y la carpeta `docs`) ya está en `vercel.json`.

## Versión anterior con XAMPP

La versión con PHP + MySQL en XAMPP quedó guardada en la rama `version-xampp`:

```
git checkout version-xampp
```

Ahí están la carpeta `api/` con los PHP y las instrucciones para correrla.
