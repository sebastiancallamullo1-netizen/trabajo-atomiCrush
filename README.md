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
| `src/baseDeDatos.js` | Pedidos a los PHP: registro, inicio de sesión, guardar progreso y ranking |
| `api/` | Servidor en PHP (XAMPP) y `base_de_datos.sql` con las tablas de MySQL |
| `src/App.jsx` | Pantallas, estados del juego y eventos del usuario |
| `src/App.css` | Estilos y animaciones |

## Base de datos y login (XAMPP)

Los usuarios, contraseñas, puntajes y el álbum se guardan en MySQL con XAMPP. El juego le hace pedidos a los archivos PHP de la carpeta `api/`.

1. Abrir el panel de XAMPP y prender **Apache** y **MySQL**.
2. Entrar a **http://localhost/phpmyadmin**, ir a la pestaña **Importar**, elegir `api/base_de_datos.sql` y tocar **Continuar**. Se crea la base `atomicrush` con las tablas `usuarios`, `puntajes` y `album`.
3. Copiar el contenido de la carpeta `api/` a `htdocs/atomicrush/` de XAMPP (en Windows: `C:\xampp\htdocs\atomicrush\`; en Mac: `/Applications/XAMPP/xamppfiles/htdocs/atomicrush/`).
4. Correr el juego con `npm run dev`, crear una cuenta y jugar. En phpMyAdmin se ven los datos guardados.

Las contraseñas no se guardan tal cual: PHP guarda un hash con `password_hash()` y al iniciar sesión las compara con `password_verify()`.

## Jugar desde otra compu de la red (sin Node)

XAMPP puede servir el juego completo, así quien juega no necesita instalar nada:

1. En la compu que tiene XAMPP: `npm run build` y copiar el contenido de `docs/` a `htdocs/atomicrush/` (junto a los PHP).
2. Ver la IP de esa compu en la red (en Mac: `ipconfig getifaddr en0`; en Windows: `ipconfig`).
3. Desde cualquier compu conectada a la misma red, entrar a `http://IP-de-la-compu/atomicrush/` (por ejemplo `http://10.0.20.75/atomicrush/`).

El juego busca los PHP en la misma dirección desde donde se abrió (`window.location.hostname`), por eso funciona tanto con `localhost` como con la IP.

