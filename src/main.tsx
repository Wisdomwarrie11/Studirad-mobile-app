import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out third-party browser extension errors and Vite HMR WebSocket proxy noise
if (typeof window !== 'undefined') {
  const isIgnoredNoise = (err: any) => {
    if (!err) return false;
    const msg = String(err?.message || err?.reason || err || '');
    const file = String(err?.filename || '');
    const stack = String(err?.stack || (err?.error && err?.error?.stack) || '');
    return (
      msg.includes('MetaMask') ||
      msg.includes('Failed to connect to MetaMask') ||
      msg.includes('ethereum') ||
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('closed without opened') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('[vite]') ||
      file.includes('chrome-extension://') ||
      file.includes('moz-extension://') ||
      file.includes('@vite/client') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('inpage.js') ||
      stack.includes('@vite/client')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isIgnoredNoise(event) || isIgnoredNoise(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isIgnoredNoise(event.reason)) {
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

