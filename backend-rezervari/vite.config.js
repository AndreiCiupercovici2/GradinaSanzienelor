import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './src', 
  
  build: {
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
          if (req.url === '/accomodation') {
            req.url = '/Pages/accomodation.html'; 
          } else if (req.url === '/meal') {
            req.url = '/Pages/meal.html';
          } else if (req.url === '/contact') {
            req.url = '/Pages/contact.html';
          } else if (req.url === '/punctGastronomic') {
            req.url = '/Pages/punctGastronomic.html';
          } else if (req.url === '/') {
            req.url = '/index.html'; 
          }
          next();
        });
      }
    }
  ],
  
  server: {
    proxy: {
      '/api': { 
        target: `http://localhost:3000`,
        changeOrigin: true,
      },
    }
  }
});