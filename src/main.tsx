import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Capture beforeinstallprompt as early as possible so React doesn't miss it
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  // Dispatch custom event to notify App.tsx if it is already mounted
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

// Register service worker for installability (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Shads AI Service Worker registered successfully:', reg.scope);
        // Force service worker update check on load to clear cached PWA registration bugs
        reg.update();
      })
      .catch((err) => {
        console.error('Shads AI Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
