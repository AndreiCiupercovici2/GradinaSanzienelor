// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Tell Vite where your raw HTML and JS live
  root: './src', 
  
  build: {
    // When you build for production, empty the public folder and put the new files there
    outDir: '../public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        accomodation: resolve(__dirname, 'src/Pages/accomodation.html'),
        contact: resolve(__dirname, 'src/Pages/contact.html'),
        punctGastronomic: resolve(__dirname, 'src/Pages/punctGastronomic.html'),
        meal: resolve(__dirname, 'src/Pages/meal.html'),
      }
    }
  },
  plugins: [
    {
      name: 'clean-urls-for-mpa',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Dacă userul cere /accomodation
          if (req.url === '/accomodation') {
            req.url = '/Pages/accomodation.html'; // Se uită automat în ./src/Pages/
          } else if (req.url === '/meal') {
            req.url = '/Pages/meal.html';
          } else if (req.url === '/contact') {
            req.url = '/Pages/contact.html';
          } else if (req.url === '/punctGastronomic') {
            req.url = '/Pages/punctGastronomic.html';
          } else if (req.url === '/') {
            req.url = '/index.html'; // Asta încarcă index-ul tău din /src
          }
          next();
        });
      }
    }
  ],
  
  server: {
    // This connects Vite's dev server to your Express backend
    proxy: {
      '/api': { // If your backend routes start with /api
        target: `http://localhost:3000`, // Your Express server's port
        changeOrigin: true,
      },
    }
  }
});