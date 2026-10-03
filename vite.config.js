import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
// viteSingleFile junta todo el juego (JS + CSS) adentro de un solo index.html.
// Así la versión armada se puede abrir con doble clic, sin "npm run dev".
// La versión armada se guarda en la carpeta "docs" (GitHub Pages también la usa).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'docs',
  },
})
