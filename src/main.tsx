import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out third-party browser extension errors (e.g., MetaMask inpage scripts injected by Chrome extensions)
if (typeof window !== 'undefined') {
  const isExtensionNoise = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || err.reason || err || '');
    const file = String(err.filename || '');
    const stack = String(err.stack || (err.error && err.error.stack) || '');
    return (
      msg.includes('MetaMask') ||
      msg.includes('Failed to connect to MetaMask') ||
      msg.includes('ethereum') ||
      file.includes('chrome-extension://') ||
      file.includes('moz-extension://') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('inpage.js')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionNoise(event) || isExtensionNoise(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isExtensionNoise(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
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

