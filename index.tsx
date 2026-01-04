
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Critical Error: ChatBank root element not found.");
}

const root = ReactDOM.createRoot(rootElement);

// وظيفة لإزالة شاشة التحميل بسلاسة تامة ومنع حجب اللمس
const hideSplashScreen = () => {
  const splash = document.getElementById('km-splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      splash.remove();
    }, 500);
  }
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// استدعاء الإخفاء بعد استقرار التطبيق
window.addEventListener('load', () => {
  setTimeout(hideSplashScreen, 800);
});

// تأمين الإخفاء في حال فشل حدث الـ load
setTimeout(hideSplashScreen, 2000);
