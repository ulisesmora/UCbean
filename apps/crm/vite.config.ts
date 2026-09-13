import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

/**
 * El CRM corre aparte del sitio público.
 *
 * Vite y no Next porque esto no necesita nada de servidor: es una pantalla
 * que el personal abre detrás de un login y que habla con la misma API.
 * Sin renderizado en servidor ni SEO que cuidar, Next solo añadiría build
 * que mantener.
 */
export default defineConfig({
  plugins: [
    react(),
    // El compilador de React memoriza por su cuenta: decide dónde hacen
    // falta useMemo y useCallback leyendo el código. Por eso los
    // componentes de este proyecto se escriben sin ellos, y no se olvida
    // ninguno ni sobra ninguno.
    //
    // En el plugin 6 esto ya no va dentro de `react()`: la transformación
    // normal pasó a oxc y babel se añade aparte, solo para los archivos
    // que el preset filtra.
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    // `import.meta.dirname` en vez de `__dirname`: Vite 8 avisa de que
    // el cargador nativo de config, que será el de por defecto, no
    // entiende el segundo.
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  server: {
    port: 3002,
    proxy: {
      // El navegador habla con el mismo origen, así que la cookie de
      // refresco viaja sin pelearse con CORS ni con SameSite.
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
