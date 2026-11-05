import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out third-party browser extension errors (e.g., MetaMask inpage scripts injected by Chrome extensions)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.filename?.includes('chrome-extension://') ||
      event.filename?.includes('moz-extension://') ||
      event.message?.includes('MetaMask') ||
      event.message?.includes('Failed to connect to MetaMask')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (
      reasonStr.includes('MetaMask') ||
      reasonStr.includes('chrome-extension://') ||
      reasonStr.includes('Failed to connect to MetaMask')
    ) {
      event.preventDefault();
    }
  });
}

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

