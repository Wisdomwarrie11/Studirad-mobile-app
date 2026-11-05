import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for offline educational caching & Google Play Store (TWA) compliance
if ('serviceWorker' in navigator && !window.location.hostname.includes('webcontainer')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[StudiRad] Service Worker updated: Educational resources ready offline.');
              }
            };
          }
        };
      })
      .catch((err) => {
        // Silently handle registration errors in restricted iframes
      });
  });
}

