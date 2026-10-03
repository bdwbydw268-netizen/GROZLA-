import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Anti-DevTools and Context Menu protection
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' || 
    (e.ctrlKey && e.shiftKey && e.key === 'I') || 
    (e.ctrlKey && e.shiftKey && e.key === 'J') || 
    (e.ctrlKey && e.shiftKey && e.key === 'C') || 
    (e.ctrlKey && e.key === 'U') ||
    (e.metaKey && e.altKey && e.key === 'I') ||
    (e.metaKey && e.altKey && e.key === 'J') ||
    (e.metaKey && e.altKey && e.key === 'U')
  ) {
    e.preventDefault();
  }
});

import App from './App.tsx';
import './index.css';

// Register Service Worker for Mobile PWA / WebAPK installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('GROZLA Service Worker registered with scope:', registration.scope);
    }).catch((error) => {
      console.warn('GROZLA Service Worker registration failed:', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
