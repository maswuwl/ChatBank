
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Critical Error: ChatBank root element not found.");
}

// Create root and render
const root = ReactDOM.createRoot(rootElement);

// Remove splash screen before rendering
const splash = document.getElementById('km-splash');
if (splash) {
  splash.style.display = 'none';
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
