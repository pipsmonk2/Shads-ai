import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Safely register Service Worker if supported in the browser environment
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.info('Shads AI updated and ready.');
                }
              };
            }
          };
        })
        .catch((err) => {
          // Gracefully suppress sandbox/iframe service worker restrictions
          console.warn('ServiceWorker registration handled:', err?.message || err);
        });
    } catch (e) {
      console.warn('ServiceWorker initialization handled:', e);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

