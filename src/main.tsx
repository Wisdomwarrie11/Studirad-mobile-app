import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for offline capability & Google Play Store (TWA) compliance
if ('serviceWorker' in navigator && !window.location.hostname.includes('webcontainer')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // SW registered
      })
      .catch((err) => {
        // Silently handle registration errors in restricted iframes
      });
  });
}

